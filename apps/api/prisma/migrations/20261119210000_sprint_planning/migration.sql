BEGIN;
LOCK TABLE project, activity_event IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE project
  ADD COLUMN mode text NOT NULL DEFAULT 'kanban' CHECK (mode IN ('kanban','scrum')),
  ADD COLUMN "timeZone" text NOT NULL DEFAULT 'UTC' CHECK (length("timeZone") BETWEEN 1 AND 100 AND "timeZone" ~ '^[A-Za-z][A-Za-z0-9_+./-]*$'),
  ADD COLUMN "pointScale" integer[] NOT NULL DEFAULT ARRAY[0,1,2,3,5,8,13,21],
  ADD COLUMN "sprintRevision" integer NOT NULL DEFAULT 1 CHECK ("sprintRevision">0);
CREATE FUNCTION valid_point_scale(points integer[]) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT array_ndims(points)=1 AND array_lower(points,1)=1 AND cardinality(points) BETWEEN 1 AND 32
    AND NOT EXISTS (SELECT 1 FROM unnest(points) WITH ORDINALITY AS p(value,n)
      WHERE value IS NULL OR value<0 OR value>1000 OR (n>1 AND value<=points[n::integer-1]));
$$;
ALTER TABLE project ADD CONSTRAINT project_point_scale CHECK (valid_point_scale("pointScale"));
CREATE OR REPLACE FUNCTION preserve_project() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Project history is retained' USING ERRCODE='23514'; END IF;
  IF ROW(NEW.id,NEW."workspaceId",NEW.key,NEW."createdByPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId",NEW."createdAt") IS DISTINCT FROM
     ROW(OLD.id,OLD."workspaceId",OLD.key,OLD."createdByPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId",OLD."createdAt")
     OR NEW."nextTaskNumber" < OLD."nextTaskNumber" OR NEW."sprintRevision" < OLD."sprintRevision" THEN
    RAISE EXCEPTION 'Project identity and allocation are immutable' USING ERRCODE='23514';
  END IF;
  IF OLD."archivedAt" IS NOT NULL AND ROW(NEW.name,NEW.description,NEW.visibility,NEW.mode,NEW."timeZone",NEW."pointScale") IS DISTINCT FROM
     ROW(OLD.name,OLD.description,OLD.visibility,OLD.mode,OLD."timeZone",OLD."pointScale") THEN
    RAISE EXCEPTION 'Archived project content is frozen' USING ERRCODE='23514';
  END IF;
  IF ROW(NEW.name,NEW.description,NEW.visibility,NEW."archivedAt",NEW.mode,NEW."timeZone",NEW."pointScale") IS DISTINCT FROM
     ROW(OLD.name,OLD.description,OLD.visibility,OLD."archivedAt",OLD.mode,OLD."timeZone",OLD."pointScale") OR NEW.version IS DISTINCT FROM OLD.version THEN
    NEW.version := OLD.version + 1; NEW."updatedAt" := CURRENT_TIMESTAMP;
  ELSE NEW.version := OLD.version; NEW."updatedAt" := OLD."updatedAt"; END IF;
  RETURN NEW;
END $$;
CREATE TABLE sprint (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 200 AND name=btrim(name) AND name !~ E'[\n\r\t]'),
  goal text NOT NULL CHECK (length(goal) BETWEEN 1 AND 2000 AND goal=btrim(goal)),
  state text NOT NULL DEFAULT 'planned' CHECK (state='planned'), version integer NOT NULL DEFAULT 1 CHECK (version>0),
  "startDate" date NOT NULL, "endDateExclusive" date NOT NULL,
  "timeZone" text NOT NULL CHECK (length("timeZone") BETWEEN 1 AND 100 AND "timeZone" ~ '^[A-Za-z][A-Za-z0-9_+./-]*$'),
  "startsAt" timestamptz(3) NOT NULL, "endsAt" timestamptz(3) NOT NULL,
  "createdByPrincipalId" text NOT NULL, "creationMode" text NOT NULL, "creationSource" text NOT NULL, "creationGrantId" text,
  "createdAt" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("workspaceId","projectId",id),
  FOREIGN KEY ("workspaceId","projectId") REFERENCES project("workspaceId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","createdByPrincipalId") REFERENCES membership("workspaceId","principalId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","creationGrantId","createdByPrincipalId") REFERENCES execution_grant("workspaceId",id,"subjectPrincipalId") ON DELETE RESTRICT,
  CHECK ("startDate">=DATE '0001-01-01' AND "endDateExclusive"<=DATE '9999-12-31' AND "startDate"<"endDateExclusive" AND "startsAt"<"endsAt"),
  CHECK ("startsAt">=TIMESTAMPTZ '0001-01-01 00:00:00+00' AND "endsAt"<=TIMESTAMPTZ '9999-12-31 23:59:59.999+00'),
  CHECK (("startsAt" AT TIME ZONE "timeZone")="startDate"::timestamp AND ("endsAt" AT TIME ZONE "timeZone")="endDateExclusive"::timestamp),
  CHECK (("creationMode"='human' AND "creationSource"='web' AND "creationGrantId" IS NULL) OR
    ("creationMode" IN ('delegated','autonomous') AND "creationSource"='mcp' AND "creationGrantId" IS NOT NULL))
);
CREATE TRIGGER sprint_fence BEFORE INSERT OR UPDATE OR DELETE ON sprint FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE FUNCTION preserve_sprint() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Sprint history is retained' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND ROW(NEW.id,NEW."workspaceId",NEW."projectId",NEW.state,NEW."timeZone",NEW."createdByPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId",NEW."createdAt") IS DISTINCT FROM
     ROW(OLD.id,OLD."workspaceId",OLD."projectId",OLD.state,OLD."timeZone",OLD."createdByPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId",OLD."createdAt") THEN
    RAISE EXCEPTION 'Sprint identity, zone and authorship are immutable' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM project WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId" AND ("archivedAt" IS NOT NULL OR (TG_OP='INSERT' AND mode<>'scrum'))) THEN
    RAISE EXCEPTION 'Project cannot plan a new sprint or is archived' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' THEN NEW.version:=OLD.version+1; NEW."updatedAt":=CURRENT_TIMESTAMP; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_sprint BEFORE INSERT OR UPDATE OR DELETE ON sprint FOR EACH ROW EXECUTE FUNCTION preserve_sprint();
CREATE FUNCTION advance_sprint_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE project SET "sprintRevision"="sprintRevision"+1 WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId";
  RETURN NEW;
END $$;
CREATE TRIGGER advance_sprint_revision AFTER INSERT OR UPDATE ON sprint FOR EACH ROW EXECUTE FUNCTION advance_sprint_revision();
ALTER TABLE activity_event ADD COLUMN "sprintId" text;
ALTER TABLE activity_event ADD CONSTRAINT activity_sprint_scope FOREIGN KEY ("workspaceId","projectId","sprintId") REFERENCES sprint("workspaceId","projectId",id) ON DELETE RESTRICT;
ALTER TABLE activity_event ADD CONSTRAINT activity_sprint_target CHECK ("sprintId" IS NULL OR "taskId" IS NULL);
ALTER TABLE activity_event DROP CONSTRAINT activity_event_action_check;
ALTER TABLE activity_event ADD CONSTRAINT activity_event_action_check CHECK (action IN
  ('create-project','edit-project','archive-project','restore-project','create-task','edit-task','archive-task','restore-task','change-visibility','change-access','move-task',
   'set-task-parent','add-checklist-item','edit-checklist-item','move-checklist-item','remove-checklist-item','add-comment','edit-comment',
   'configure-planning','create-sprint','edit-sprint'));
COMMIT;
