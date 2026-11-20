BEGIN;
-- Maintenance window: drain readers, writers and long transactions first.
LOCK TABLE project, task, sprint, activity_event IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE task ADD COLUMN "estimatePoints" integer CHECK ("estimatePoints" BETWEEN 0 AND 1000);
CREATE FUNCTION preserve_task_estimate() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."archivedAt" IS NOT NULL AND NEW."estimatePoints" IS DISTINCT FROM OLD."estimatePoints" THEN
    RAISE EXCEPTION 'Archived task estimates are frozen' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_task_estimate BEFORE UPDATE ON task FOR EACH ROW EXECUTE FUNCTION preserve_task_estimate();
ALTER TABLE sprint ADD COLUMN "startedAt" timestamptz(3);
ALTER TABLE sprint DROP CONSTRAINT sprint_state_check;
ALTER TABLE sprint ADD CONSTRAINT sprint_state_check CHECK (
  (state='planned' AND "startedAt" IS NULL) OR
  (state='active' AND "startedAt" IS NOT NULL AND "startedAt" BETWEEN TIMESTAMPTZ '0001-01-01 00:00:00+00' AND TIMESTAMPTZ '9999-12-31 23:59:59.999+00'));
CREATE UNIQUE INDEX sprint_one_active ON sprint("workspaceId","projectId") WHERE state='active';
CREATE OR REPLACE FUNCTION preserve_sprint() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Sprint history is retained' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' AND (NEW.state<>'planned' OR NEW."startedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Sprint must be planned first' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF ROW(NEW.id,NEW."workspaceId",NEW."projectId",NEW."timeZone",NEW."createdByPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId",NEW."createdAt") IS DISTINCT FROM
       ROW(OLD.id,OLD."workspaceId",OLD."projectId",OLD."timeZone",OLD."createdByPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId",OLD."createdAt") THEN
      RAISE EXCEPTION 'Sprint identity, zone and authorship are immutable' USING ERRCODE='23514';
    END IF;
    IF NEW.state IS DISTINCT FROM OLD.state THEN
      IF OLD.state<>'planned' OR NEW.state<>'active' OR NEW."startedAt" IS NULL OR
        ROW(NEW.name,NEW.goal,NEW."startDate",NEW."endDateExclusive",NEW."startsAt",NEW."endsAt") IS DISTINCT FROM
        ROW(OLD.name,OLD.goal,OLD."startDate",OLD."endDateExclusive",OLD."startsAt",OLD."endsAt") OR
        NOT EXISTS (SELECT 1 FROM project WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId" AND mode='scrum') THEN
        RAISE EXCEPTION 'Invalid explicit sprint transition' USING ERRCODE='23514';
      END IF;
    ELSIF NEW."startedAt" IS DISTINCT FROM OLD."startedAt" THEN
      RAISE EXCEPTION 'Actual start is immutable' USING ERRCODE='23514';
    END IF;
    NEW.version:=OLD.version+1; NEW."updatedAt":=CURRENT_TIMESTAMP;
  END IF;
  IF EXISTS (SELECT 1 FROM project WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId" AND ("archivedAt" IS NOT NULL OR (TG_OP='INSERT' AND mode<>'scrum'))) THEN
    RAISE EXCEPTION 'Project cannot plan a new sprint or is archived' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
-- Bounded semantic tuple; no text, identity supplied by a client, or arbitrary JSON.
CREATE FUNCTION valid_sprint_snapshot(s jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_typeof(s)='object' AND (SELECT count(*)=5 FROM jsonb_object_keys(s))
    AND s ?& ARRAY['version','status','estimatePoints','parentTaskId','archivedAt']
    AND jsonb_typeof(s->'version')='number' AND (s->>'version') ~ '^[1-9][0-9]*$'
    AND s->>'status' IN ('backlog','todo','in_progress','done','canceled')
    AND (s->'estimatePoints'='null'::jsonb OR (jsonb_typeof(s->'estimatePoints')='number' AND (s->>'estimatePoints') ~ '^(0|[1-9][0-9]{0,2}|1000)$'))
    AND (s->'parentTaskId'='null'::jsonb OR (jsonb_typeof(s->'parentTaskId')='string' AND s->>'parentTaskId' ~ '^[A-Za-z0-9_-]{1,128}$'))
    AND (s->'archivedAt'='null'::jsonb OR (jsonb_typeof(s->'archivedAt')='string' AND s->>'archivedAt' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$')),false);
$$;
CREATE TABLE sprint_participation (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL, "sprintId" text NOT NULL, "taskId" text NOT NULL,
  "enteredAt" timestamptz(3) NOT NULL, "enteredOrdinal" integer NOT NULL CHECK ("enteredOrdinal">0), "entrySnapshot" jsonb NOT NULL CHECK (valid_sprint_snapshot("entrySnapshot")),
  "exitedAt" timestamptz(3), "exitedOrdinal" integer, "exitReason" text, "exitSnapshot" jsonb,
  UNIQUE ("workspaceId","projectId","sprintId",id,"taskId"),
  FOREIGN KEY ("workspaceId","projectId","sprintId") REFERENCES sprint("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","taskId") REFERENCES task("workspaceId","projectId",id) ON DELETE RESTRICT,
  CHECK (("exitedAt" IS NULL AND "exitedOrdinal" IS NULL AND "exitReason" IS NULL AND "exitSnapshot" IS NULL) OR
    ("exitedAt" IS NOT NULL AND "exitedOrdinal" IS NOT NULL AND "exitReason" IS NOT NULL AND "exitedOrdinal">"enteredOrdinal" AND "exitReason" IN ('removed','transferred') AND "exitSnapshot" IS NOT NULL AND valid_sprint_snapshot("exitSnapshot")))
);
CREATE UNIQUE INDEX sprint_one_current_visit ON sprint_participation("workspaceId","projectId","taskId") WHERE "exitedAt" IS NULL;
CREATE INDEX sprint_participation_scope ON sprint_participation("workspaceId","projectId","sprintId",id);
CREATE INDEX sprint_participation_task ON sprint_participation("workspaceId","projectId","taskId",id);
ALTER TABLE activity_event ADD CONSTRAINT activity_project_identity UNIQUE ("workspaceId","projectId",id);
CREATE TABLE sprint_scope_event (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL, "sprintId" text NOT NULL,
  ordinal integer NOT NULL CHECK (ordinal>0), kind text NOT NULL CHECK (kind IN ('entry','exit','task-change','metadata','start')),
  "activityId" text NOT NULL, "participationId" text, "taskId" text, "occurredAt" timestamptz(3) NOT NULL,
  "beforeSnapshot" jsonb CHECK ("beforeSnapshot" IS NULL OR valid_sprint_snapshot("beforeSnapshot")), "afterSnapshot" jsonb CHECK ("afterSnapshot" IS NULL OR valid_sprint_snapshot("afterSnapshot")),
  UNIQUE ("workspaceId","projectId","sprintId",ordinal),
  FOREIGN KEY ("workspaceId","projectId","sprintId") REFERENCES sprint("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","activityId") REFERENCES activity_event("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","sprintId","participationId","taskId") REFERENCES sprint_participation("workspaceId","projectId","sprintId",id,"taskId") ON DELETE RESTRICT,
  CHECK ((kind IN ('metadata','start') AND "participationId" IS NULL AND "taskId" IS NULL AND "beforeSnapshot" IS NULL AND "afterSnapshot" IS NULL) OR
    (kind='entry' AND "participationId" IS NOT NULL AND "taskId" IS NOT NULL AND "beforeSnapshot" IS NULL AND "afterSnapshot" IS NOT NULL) OR
    (kind='exit' AND "participationId" IS NOT NULL AND "taskId" IS NOT NULL AND "beforeSnapshot" IS NOT NULL AND "afterSnapshot" IS NOT NULL) OR
    (kind='task-change' AND "participationId" IS NOT NULL AND "taskId" IS NOT NULL AND "beforeSnapshot" IS NOT NULL AND "afterSnapshot" IS NOT NULL))
);
CREATE UNIQUE INDEX sprint_unique_start_event ON sprint_scope_event("workspaceId","projectId","sprintId") WHERE kind='start';
CREATE INDEX sprint_scope_event_task ON sprint_scope_event("workspaceId","projectId","taskId",id);
CREATE TABLE sprint_start_reference (
  "workspaceId" text NOT NULL, "projectId" text NOT NULL, "sprintId" text NOT NULL, "participationId" text NOT NULL, "taskId" text NOT NULL,
  "startOrdinal" integer NOT NULL, snapshot jsonb NOT NULL CHECK (valid_sprint_snapshot(snapshot)),
  PRIMARY KEY ("workspaceId","projectId","sprintId","participationId"),
  FOREIGN KEY ("workspaceId","projectId","sprintId","participationId","taskId") REFERENCES sprint_participation("workspaceId","projectId","sprintId",id,"taskId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","sprintId","startOrdinal") REFERENCES sprint_scope_event("workspaceId","projectId","sprintId",ordinal) DEFERRABLE INITIALLY DEFERRED
);
CREATE FUNCTION preserve_sprint_visit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' OR OLD."exitedAt" IS NOT NULL OR
    ROW(NEW.id,NEW."workspaceId",NEW."projectId",NEW."sprintId",NEW."taskId",NEW."enteredAt",NEW."enteredOrdinal",NEW."entrySnapshot") IS DISTINCT FROM
    ROW(OLD.id,OLD."workspaceId",OLD."projectId",OLD."sprintId",OLD."taskId",OLD."enteredAt",OLD."enteredOrdinal",OLD."entrySnapshot") OR NEW."exitedAt" IS NULL THEN
    RAISE EXCEPTION 'Visits retain immutable entry and one exit' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_sprint_visit BEFORE UPDATE OR DELETE ON sprint_participation FOR EACH ROW EXECUTE FUNCTION preserve_sprint_visit();
CREATE FUNCTION preserve_sprint_fact() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Sprint facts are immutable' USING ERRCODE='23514'; END $$;
CREATE TRIGGER preserve_scope_event BEFORE UPDATE OR DELETE ON sprint_scope_event FOR EACH ROW EXECUTE FUNCTION preserve_sprint_fact();
CREATE TRIGGER preserve_start_reference BEFORE UPDATE OR DELETE ON sprint_start_reference FOR EACH ROW EXECUTE FUNCTION preserve_sprint_fact();
CREATE TRIGGER sprint_participation_fence BEFORE INSERT OR UPDATE OR DELETE ON sprint_participation FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE TRIGGER sprint_scope_event_fence BEFORE INSERT OR UPDATE OR DELETE ON sprint_scope_event FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE TRIGGER sprint_start_reference_fence BEFORE INSERT OR UPDATE OR DELETE ON sprint_start_reference FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
-- Ordinals describe membership at start even when timestamps tie or a lock waited.
CREATE FUNCTION check_sprint_facts() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE w text; p text; s text; activated sprint%ROWTYPE; start_event sprint_scope_event%ROWTYPE;
BEGIN
  w:=NEW."workspaceId"; p:=NEW."projectId";
  IF TG_TABLE_NAME='sprint' THEN s:=NEW.id; ELSE s:=NEW."sprintId"; END IF;
  SELECT * INTO activated FROM sprint WHERE "workspaceId"=w AND "projectId"=p AND id=s;
  SELECT * INTO start_event FROM sprint_scope_event WHERE "workspaceId"=w AND "projectId"=p AND "sprintId"=s AND kind='start';
  IF (activated.state='active') IS DISTINCT FROM (start_event.id IS NOT NULL) OR
    (start_event.id IS NOT NULL AND (start_event."occurredAt"<>activated."startedAt" OR start_event.ordinal>activated.version)) THEN
    RAISE EXCEPTION 'Active sprint requires its exact start event' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.ordinal>activated.version) OR
    EXISTS (SELECT 1 FROM sprint_start_reference r WHERE r."workspaceId"=w AND r."projectId"=p AND r."sprintId"=s AND
      (start_event.id IS NULL OR r."startOrdinal"<>start_event.ordinal)) OR
    EXISTS (SELECT 1 FROM sprint_participation v WHERE v."workspaceId"=w AND v."projectId"=p AND v."sprintId"=s AND
      ((v."enteredOrdinal"<start_event.ordinal AND (v."exitedOrdinal" IS NULL OR v."exitedOrdinal">start_event.ordinal)) IS DISTINCT FROM
      EXISTS (SELECT 1 FROM sprint_start_reference r WHERE r."workspaceId"=w AND r."projectId"=p AND r."sprintId"=s AND r."participationId"=v.id)) AND start_event.id IS NOT NULL) THEN
    RAISE EXCEPTION 'Start reference must equal the full scope at start' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM sprint_participation v WHERE v."workspaceId"=w AND v."projectId"=p AND v."sprintId"=s AND
    (NOT EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.ordinal=v."enteredOrdinal" AND e.kind='entry' AND e."participationId"=v.id AND e."afterSnapshot"=v."entrySnapshot" AND e."occurredAt"=v."enteredAt") OR
    (v."exitedAt" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.ordinal=v."exitedOrdinal" AND e.kind='exit' AND e."participationId"=v.id AND e."afterSnapshot"=v."exitSnapshot" AND e."occurredAt"=v."exitedAt")))) THEN
    RAISE EXCEPTION 'Visit requires its immutable entry and exit events' USING ERRCODE='23514';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER sprint_facts AFTER INSERT OR UPDATE ON sprint DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sprint_facts();
CREATE CONSTRAINT TRIGGER visit_facts AFTER INSERT OR UPDATE ON sprint_participation DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sprint_facts();
CREATE CONSTRAINT TRIGGER event_facts AFTER INSERT ON sprint_scope_event DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sprint_facts();
CREATE CONSTRAINT TRIGGER reference_facts AFTER INSERT ON sprint_start_reference DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sprint_facts();
ALTER TABLE activity_event DROP CONSTRAINT activity_event_action_check;
ALTER TABLE activity_event ADD CONSTRAINT activity_event_action_check CHECK (action IN
  ('create-project','edit-project','archive-project','restore-project','create-task','edit-task','archive-task','restore-task','change-visibility','change-access','move-task',
   'set-task-parent','add-checklist-item','edit-checklist-item','move-checklist-item','remove-checklist-item','add-comment','edit-comment',
   'configure-planning','create-sprint','edit-sprint','start-sprint','set-task-sprint','estimate-task'));
COMMIT;
