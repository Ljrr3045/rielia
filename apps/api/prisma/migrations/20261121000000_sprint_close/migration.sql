BEGIN;
-- Drain readers, writers and long transactions; deploy matching readers/writers together.
LOCK TABLE project, task, sprint, sprint_participation, sprint_scope_event, sprint_start_reference, activity_event IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE sprint ADD COLUMN "closedAt" timestamptz(3);
ALTER TABLE sprint DROP CONSTRAINT sprint_state_check;
ALTER TABLE sprint ADD CONSTRAINT sprint_state_check CHECK (
  (state='planned' AND "startedAt" IS NULL AND "closedAt" IS NULL) OR
  (state IN ('active','closed') AND "startedAt" BETWEEN TIMESTAMPTZ '0001-01-01 00:00:00+00' AND TIMESTAMPTZ '9999-12-31 23:59:59.999+00' AND "startedAt" IS NOT NULL AND
    ((state='active' AND "closedAt" IS NULL) OR (state='closed' AND "closedAt" IS NOT NULL AND "closedAt">="startedAt" AND "closedAt"<=TIMESTAMPTZ '9999-12-31 23:59:59.999+00'))));
CREATE OR REPLACE FUNCTION preserve_sprint() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Sprint history is retained' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' AND (NEW.state<>'planned' OR NEW."startedAt" IS NOT NULL OR NEW."closedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Sprint must be planned first' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.state='closed' THEN RAISE EXCEPTION 'Closed sprint is immutable' USING ERRCODE='23514'; END IF;
    IF ROW(NEW.id,NEW."workspaceId",NEW."projectId",NEW."timeZone",NEW."createdByPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId",NEW."createdAt") IS DISTINCT FROM
       ROW(OLD.id,OLD."workspaceId",OLD."projectId",OLD."timeZone",OLD."createdByPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId",OLD."createdAt") THEN
      RAISE EXCEPTION 'Sprint identity, zone and authorship are immutable' USING ERRCODE='23514';
    END IF;
    IF NEW.state IS DISTINCT FROM OLD.state THEN
      IF ROW(NEW.name,NEW.goal,NEW."startDate",NEW."endDateExclusive",NEW."startsAt",NEW."endsAt") IS DISTINCT FROM
         ROW(OLD.name,OLD.goal,OLD."startDate",OLD."endDateExclusive",OLD."startsAt",OLD."endsAt") OR NOT (
        (OLD.state='planned' AND NEW.state='active' AND NEW."startedAt" IS NOT NULL AND NEW."closedAt" IS NULL AND EXISTS
          (SELECT 1 FROM project WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId" AND mode='scrum')) OR
        (OLD.state='active' AND NEW.state='closed' AND NEW."startedAt"=OLD."startedAt" AND NEW."closedAt" IS NOT NULL)) THEN
        RAISE EXCEPTION 'Invalid explicit sprint transition' USING ERRCODE='23514';
      END IF;
    ELSIF ROW(NEW."startedAt",NEW."closedAt") IS DISTINCT FROM ROW(OLD."startedAt",OLD."closedAt") THEN
      RAISE EXCEPTION 'Actual lifecycle times are immutable' USING ERRCODE='23514';
    END IF;
    NEW.version:=OLD.version+1; NEW."updatedAt":=CURRENT_TIMESTAMP;
  END IF;
  IF EXISTS (SELECT 1 FROM project WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId" AND ("archivedAt" IS NOT NULL OR (TG_OP='INSERT' AND mode<>'scrum'))) THEN
    RAISE EXCEPTION 'Project cannot plan a new sprint or is archived' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
ALTER TABLE sprint_participation DROP CONSTRAINT sprint_participation_check;
ALTER TABLE sprint_participation ADD CONSTRAINT sprint_participation_check CHECK (
  ("exitedAt" IS NULL AND "exitedOrdinal" IS NULL AND "exitReason" IS NULL AND "exitSnapshot" IS NULL) OR
  ("exitedAt" IS NOT NULL AND "exitedOrdinal" IS NOT NULL AND "exitedOrdinal">"enteredOrdinal" AND "exitReason" IS NOT NULL AND "exitReason" IN ('removed','transferred','closed') AND "exitSnapshot" IS NOT NULL AND valid_sprint_snapshot("exitSnapshot")));
ALTER TABLE sprint_scope_event DROP CONSTRAINT sprint_scope_event_kind_check;
ALTER TABLE sprint_scope_event ADD CONSTRAINT sprint_scope_event_kind_check CHECK (kind IN ('entry','exit','task-change','metadata','start','close','carryover'));
ALTER TABLE sprint_scope_event DROP CONSTRAINT sprint_scope_event_check;
ALTER TABLE sprint_scope_event ADD CONSTRAINT sprint_scope_event_check CHECK (
  (kind IN ('metadata','start','close','carryover') AND "participationId" IS NULL AND "taskId" IS NULL AND "beforeSnapshot" IS NULL AND "afterSnapshot" IS NULL) OR
  (kind='entry' AND "participationId" IS NOT NULL AND "taskId" IS NOT NULL AND "beforeSnapshot" IS NULL AND "afterSnapshot" IS NOT NULL) OR
  (kind IN ('exit','task-change') AND "participationId" IS NOT NULL AND "taskId" IS NOT NULL AND "beforeSnapshot" IS NOT NULL AND "afterSnapshot" IS NOT NULL));
CREATE TABLE sprint_closure (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL, "sprintId" text NOT NULL,
  destination text, "targetSprintId" text, "sourceOrdinal" integer NOT NULL CHECK ("sourceOrdinal">0), "targetOrdinal" integer,
  "closedAt" timestamptz(3) NOT NULL, "previewSchema" integer NOT NULL CHECK ("previewSchema"=1), "previewHash" text NOT NULL CHECK ("previewHash" ~ '^[0-9a-f]{64}$'), "activityId" text NOT NULL,
  UNIQUE ("workspaceId","projectId","sprintId"), UNIQUE ("workspaceId","projectId","sprintId",id),
  FOREIGN KEY ("workspaceId","projectId","sprintId") REFERENCES sprint("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","targetSprintId") REFERENCES sprint("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","activityId") REFERENCES activity_event("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","sprintId","sourceOrdinal") REFERENCES sprint_scope_event("workspaceId","projectId","sprintId",ordinal) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY ("workspaceId","projectId","targetSprintId","targetOrdinal") REFERENCES sprint_scope_event("workspaceId","projectId","sprintId",ordinal) DEFERRABLE INITIALLY DEFERRED,
  CHECK ((destination IS NULL AND "targetSprintId" IS NULL AND "targetOrdinal" IS NULL) OR
    (destination='backlog' AND "targetSprintId" IS NULL AND "targetOrdinal" IS NULL) OR
    (destination IS NOT NULL AND destination='sprint' AND "targetSprintId" IS NOT NULL AND "targetSprintId"<>"sprintId" AND "targetOrdinal" IS NOT NULL AND "targetOrdinal">0))
);
CREATE TABLE sprint_closing_outcome (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL, "sprintId" text NOT NULL, "closureId" text NOT NULL,
  "participationId" text NOT NULL, "taskId" text NOT NULL, snapshot jsonb NOT NULL CHECK (valid_sprint_snapshot(snapshot)),
  disposition text NOT NULL CHECK (disposition IN ('done','canceled','backlog','carried')), "targetSprintId" text, "targetParticipationId" text,
  UNIQUE ("workspaceId","projectId","sprintId","participationId"), UNIQUE ("targetParticipationId"),
  FOREIGN KEY ("workspaceId","projectId","sprintId","closureId") REFERENCES sprint_closure("workspaceId","projectId","sprintId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","sprintId","participationId","taskId") REFERENCES sprint_participation("workspaceId","projectId","sprintId",id,"taskId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","targetSprintId","targetParticipationId","taskId") REFERENCES sprint_participation("workspaceId","projectId","sprintId",id,"taskId") DEFERRABLE INITIALLY DEFERRED,
  CHECK ((disposition='carried' AND "targetSprintId" IS NOT NULL AND "targetParticipationId" IS NOT NULL) OR
    (disposition<>'carried' AND "targetSprintId" IS NULL AND "targetParticipationId" IS NULL)),
  CHECK ((snapshot->>'status'='done' AND disposition='done') OR (snapshot->>'status'='canceled' AND disposition='canceled') OR
    (snapshot->>'status' NOT IN ('done','canceled') AND disposition IN ('backlog','carried')))
);
CREATE INDEX sprint_outcome_scope ON sprint_closing_outcome("workspaceId","projectId","sprintId",id);
CREATE INDEX sprint_outcome_task ON sprint_closing_outcome("workspaceId","projectId","taskId",id);
CREATE UNIQUE INDEX sprint_unique_close_event ON sprint_scope_event("workspaceId","projectId","sprintId") WHERE kind='close';
CREATE TRIGGER preserve_sprint_closure BEFORE UPDATE OR DELETE ON sprint_closure FOR EACH ROW EXECUTE FUNCTION preserve_sprint_fact();
CREATE TRIGGER preserve_sprint_outcome BEFORE UPDATE OR DELETE ON sprint_closing_outcome FOR EACH ROW EXECUTE FUNCTION preserve_sprint_fact();
CREATE TRIGGER sprint_closure_fence BEFORE INSERT OR UPDATE OR DELETE ON sprint_closure FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE TRIGGER sprint_outcome_fence BEFORE INSERT OR UPDATE OR DELETE ON sprint_closing_outcome FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
-- No ordinary writes or inserts into old ordinal gaps once closed. The aggregate close is the sole exception.
CREATE FUNCTION guard_closed_sprint_fact() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s sprint%ROWTYPE;
BEGIN
  SELECT * INTO s FROM sprint WHERE "workspaceId"=NEW."workspaceId" AND "projectId"=NEW."projectId" AND id=NEW."sprintId";
  IF s.state='closed' THEN
    IF TG_TABLE_NAME='sprint_scope_event' THEN
      IF NEW.kind='close' AND NEW.ordinal=s.version AND EXISTS (SELECT 1 FROM sprint_closure c WHERE c."workspaceId"=s."workspaceId" AND c."projectId"=s."projectId" AND c."sprintId"=s.id AND c."sourceOrdinal"=NEW.ordinal AND c."activityId"=NEW."activityId") THEN RETURN NEW; END IF;
    ELSIF TG_TABLE_NAME='sprint_participation' AND TG_OP='UPDATE' THEN
      IF NEW."exitReason"='closed' AND NEW."exitedOrdinal"=s.version AND EXISTS (SELECT 1 FROM sprint_closure c WHERE c."workspaceId"=s."workspaceId" AND c."projectId"=s."projectId" AND c."sprintId"=s.id AND c."closedAt"=NEW."exitedAt") THEN RETURN NEW; END IF;
    END IF;
    RAISE EXCEPTION 'Closed sprint facts are frozen' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_closed_visit BEFORE INSERT OR UPDATE ON sprint_participation FOR EACH ROW EXECUTE FUNCTION guard_closed_sprint_fact();
CREATE TRIGGER guard_closed_event BEFORE INSERT ON sprint_scope_event FOR EACH ROW EXECUTE FUNCTION guard_closed_sprint_fact();
CREATE TRIGGER guard_closed_reference BEFORE INSERT ON sprint_start_reference FOR EACH ROW EXECUTE FUNCTION guard_closed_sprint_fact();
CREATE FUNCTION guard_closure_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME='sprint_closure' THEN
    IF NOT EXISTS (SELECT 1 FROM sprint s WHERE s."workspaceId"=NEW."workspaceId" AND s."projectId"=NEW."projectId" AND s.id=NEW."sprintId" AND s.state='closed' AND s.version=NEW."sourceOrdinal" AND s."closedAt"=NEW."closedAt") OR
      (NEW."targetSprintId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sprint s WHERE s."workspaceId"=NEW."workspaceId" AND s."projectId"=NEW."projectId" AND s.id=NEW."targetSprintId" AND s.state='planned' AND s.version=NEW."targetOrdinal")) THEN
      RAISE EXCEPTION 'Closure requires exact source and planned target' USING ERRCODE='23514';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM sprint_participation v JOIN task t ON t."workspaceId"=v."workspaceId" AND t."projectId"=v."projectId" AND t.id=v."taskId" WHERE v."workspaceId"=NEW."workspaceId" AND v."projectId"=NEW."projectId" AND v."sprintId"=NEW."sprintId" AND v.id=NEW."participationId" AND v."taskId"=NEW."taskId" AND v."exitedAt" IS NULL AND NEW.snapshot=jsonb_build_object('version',t.version,'status',t.status,'estimatePoints',t."estimatePoints",'parentTaskId',t."parentTaskId",'archivedAt',CASE WHEN t."archivedAt" IS NULL THEN NULL ELSE to_char(t."archivedAt",'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') END)) THEN
      RAISE EXCEPTION 'Outcome requires a canonical current source visit' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_closure_insert BEFORE INSERT ON sprint_closure FOR EACH ROW EXECUTE FUNCTION guard_closure_insert();
CREATE TRIGGER guard_outcome_insert BEFORE INSERT ON sprint_closing_outcome FOR EACH ROW EXECUTE FUNCTION guard_closure_insert();
CREATE OR REPLACE FUNCTION check_sprint_facts() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE w text; p text; s text; activated sprint%ROWTYPE; start_event sprint_scope_event%ROWTYPE; c sprint_closure%ROWTYPE;
BEGIN
  w:=NEW."workspaceId"; p:=NEW."projectId";
  IF TG_TABLE_NAME='sprint' THEN s:=NEW.id; ELSE s:=NEW."sprintId"; END IF;
  SELECT * INTO activated FROM sprint WHERE "workspaceId"=w AND "projectId"=p AND id=s;
  SELECT * INTO start_event FROM sprint_scope_event WHERE "workspaceId"=w AND "projectId"=p AND "sprintId"=s AND kind='start';
  SELECT * INTO c FROM sprint_closure WHERE "workspaceId"=w AND "projectId"=p AND "sprintId"=s;
  IF (activated.state IN ('active','closed')) IS DISTINCT FROM (start_event.id IS NOT NULL) OR
    (start_event.id IS NOT NULL AND (start_event."occurredAt"<>activated."startedAt" OR start_event.ordinal>activated.version)) THEN
    RAISE EXCEPTION 'Started sprint requires its exact start event' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.ordinal>activated.version) OR
    EXISTS (SELECT 1 FROM sprint_start_reference r WHERE r."workspaceId"=w AND r."projectId"=p AND r."sprintId"=s AND (start_event.id IS NULL OR r."startOrdinal"<>start_event.ordinal)) OR
    EXISTS (SELECT 1 FROM sprint_participation v WHERE v."workspaceId"=w AND v."projectId"=p AND v."sprintId"=s AND start_event.id IS NOT NULL AND
      ((v."enteredOrdinal"<start_event.ordinal AND (v."exitedOrdinal" IS NULL OR v."exitedOrdinal">start_event.ordinal)) IS DISTINCT FROM
       EXISTS (SELECT 1 FROM sprint_start_reference r WHERE r."workspaceId"=w AND r."projectId"=p AND r."sprintId"=s AND r."participationId"=v.id))) THEN
    RAISE EXCEPTION 'Start reference must equal the full scope at start' USING ERRCODE='23514';
  END IF;
  IF (activated.state='closed') IS DISTINCT FROM (c.id IS NOT NULL) OR
    (c.id IS NOT NULL AND (c."closedAt"<>activated."closedAt" OR c."sourceOrdinal"<>activated.version OR NOT EXISTS
      (SELECT 1 FROM sprint_scope_event e JOIN activity_event a ON a."workspaceId"=e."workspaceId" AND a."projectId"=e."projectId" AND a.id=e."activityId" WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.ordinal=c."sourceOrdinal" AND e.kind='close' AND e."activityId"=c."activityId" AND e."occurredAt"=c."closedAt" AND a.action='close-sprint' AND a."sprintId"=s AND a."entityVersion"=c."sourceOrdinal"))) OR
    EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.kind='close' AND (c.id IS NULL OR e.ordinal<>c."sourceOrdinal")) THEN
    RAISE EXCEPTION 'Closed sprint requires its exact closure event' USING ERRCODE='23514';
  END IF;
  IF c.id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM sprint_participation v WHERE v."workspaceId"=w AND v."projectId"=p AND v."sprintId"=s AND
      (v."exitedAt" IS NULL OR ((v."enteredOrdinal"<c."sourceOrdinal" AND v."exitedOrdinal">=c."sourceOrdinal") IS DISTINCT FROM EXISTS
        (SELECT 1 FROM sprint_closing_outcome o WHERE o."workspaceId"=w AND o."projectId"=p AND o."sprintId"=s AND o."participationId"=v.id)))) OR
    EXISTS (SELECT 1 FROM sprint_closing_outcome o JOIN sprint_participation v ON v.id=o."participationId" WHERE o."workspaceId"=w AND o."projectId"=p AND o."sprintId"=s AND
      (v."exitReason"<>'closed' OR v."exitedOrdinal"<>c."sourceOrdinal" OR v."exitedAt"<>c."closedAt" OR v."exitSnapshot"<>o.snapshot OR
       (o.disposition='backlog' AND c.destination IS DISTINCT FROM 'backlog') OR
       (o.disposition='carried' AND (o."targetSprintId" IS DISTINCT FROM c."targetSprintId" OR NOT EXISTS
         (SELECT 1 FROM sprint_participation d WHERE d.id=o."targetParticipationId" AND d."enteredOrdinal"=c."targetOrdinal" AND d."enteredAt"=c."closedAt" AND d."entrySnapshot"=o.snapshot))))) OR
    (c."targetSprintId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=c."targetSprintId" AND e.ordinal=c."targetOrdinal" AND e.kind='carryover' AND e."activityId"=c."activityId" AND e."occurredAt"=c."closedAt"))) THEN
    RAISE EXCEPTION 'Closure outcomes must equal the complete source scope' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.kind='carryover' AND NOT EXISTS
    (SELECT 1 FROM sprint_closure x WHERE x."workspaceId"=w AND x."projectId"=p AND x."targetSprintId"=s AND x."targetOrdinal"=e.ordinal AND x."activityId"=e."activityId" AND x."closedAt"=e."occurredAt")) THEN
    RAISE EXCEPTION 'Carryover requires its source closure' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM sprint_participation v WHERE v."workspaceId"=w AND v."projectId"=p AND v."sprintId"=s AND
    ((NOT EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.ordinal=v."enteredOrdinal" AND e.kind='entry' AND e."participationId"=v.id AND e."afterSnapshot"=v."entrySnapshot" AND e."occurredAt"=v."enteredAt") AND NOT EXISTS
      (SELECT 1 FROM sprint_closing_outcome o JOIN sprint_closure x ON x.id=o."closureId" WHERE o."workspaceId"=w AND o."projectId"=p AND o."targetSprintId"=s AND o."targetParticipationId"=v.id AND x."targetOrdinal"=v."enteredOrdinal" AND x."closedAt"=v."enteredAt" AND o.snapshot=v."entrySnapshot")) OR
    (v."exitedAt" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sprint_scope_event e WHERE e."workspaceId"=w AND e."projectId"=p AND e."sprintId"=s AND e.ordinal=v."exitedOrdinal" AND e.kind='exit' AND e."participationId"=v.id AND e."afterSnapshot"=v."exitSnapshot" AND e."occurredAt"=v."exitedAt") AND NOT
      (v."exitReason"='closed' AND c.id IS NOT NULL AND v."exitedOrdinal"=c."sourceOrdinal" AND EXISTS (SELECT 1 FROM sprint_closing_outcome o WHERE o."closureId"=c.id AND o."participationId"=v.id AND o.snapshot=v."exitSnapshot"))))) THEN
    RAISE EXCEPTION 'Visit requires its immutable entry and exit facts' USING ERRCODE='23514';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER closure_facts AFTER INSERT ON sprint_closure DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sprint_facts();
CREATE CONSTRAINT TRIGGER outcome_facts AFTER INSERT ON sprint_closing_outcome DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sprint_facts();
ALTER TABLE activity_event DROP CONSTRAINT activity_event_action_check;
ALTER TABLE activity_event ADD CONSTRAINT activity_event_action_check CHECK (action IN
  ('create-project','edit-project','archive-project','restore-project','create-task','edit-task','archive-task','restore-task','change-visibility','change-access','move-task',
   'set-task-parent','add-checklist-item','edit-checklist-item','move-checklist-item','remove-checklist-item','add-comment','edit-comment',
   'configure-planning','create-sprint','edit-sprint','start-sprint','set-task-sprint','estimate-task','close-sprint'));
COMMIT;
