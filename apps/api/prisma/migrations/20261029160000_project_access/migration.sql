BEGIN;
LOCK TABLE principal, membership, workspace, execution_grant, project, task IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE project DROP CONSTRAINT project_visibility_check;
ALTER TABLE project ADD CONSTRAINT project_visibility_check CHECK (visibility IN ('workspace','private'));
ALTER TABLE activity_event DROP CONSTRAINT activity_event_action_check;
ALTER TABLE activity_event ADD CONSTRAINT activity_event_action_check CHECK (action IN
  ('create-project','edit-project','archive-project','restore-project','create-task','edit-task','archive-task','restore-task','change-visibility','change-access'));
ALTER TABLE activity_event ADD COLUMN "accessPrincipalId" text;
ALTER TABLE activity_event ADD CONSTRAINT activity_access_subject FOREIGN KEY ("workspaceId","accessPrincipalId") REFERENCES membership("workspaceId","principalId") ON DELETE RESTRICT;
ALTER TABLE activity_event ADD CONSTRAINT activity_access_action CHECK ((action='change-access') = ("accessPrincipalId" IS NOT NULL));

CREATE TABLE project_access (
  "workspaceId" text NOT NULL, "projectId" text NOT NULL, "principalId" text NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','revoked')),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("workspaceId","projectId","principalId"),
  FOREIGN KEY ("workspaceId","projectId") REFERENCES project("workspaceId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","principalId") REFERENCES membership("workspaceId","principalId") ON DELETE RESTRICT
);
CREATE INDEX project_access_subject ON project_access("workspaceId","principalId",state,"projectId");
CREATE TRIGGER project_access_fence BEFORE INSERT OR UPDATE OR DELETE ON project_access FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();

-- Active workspace membership remains mandatory, including for administrators.
-- This predicate is for assignment constraints, never an authentication seam.
CREATE FUNCTION project_principal_can_read(w text, project_id text, subject_id text) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM project pr JOIN membership m ON m."workspaceId"=pr."workspaceId"
    JOIN principal p ON p.id=m."principalId"
    WHERE pr."workspaceId"=w AND pr.id=project_id AND m."principalId"=subject_id
      AND m.state='active' AND p.state='active' AND p.kind IN ('human','agent')
      AND (p.kind<>'agent' OR p."workspaceId"=w)
      AND (pr.visibility='workspace' OR (p.kind='human' AND m.role IN ('owner','admin'))
        OR EXISTS (SELECT 1 FROM project_access a WHERE a."workspaceId"=w AND a."projectId"=project_id AND a."principalId"=subject_id AND a.state='active'))
  )
$$;

CREATE FUNCTION preserve_project_access() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Project access history is retained' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND ROW(NEW."workspaceId",NEW."projectId",NEW."principalId",NEW."createdAt") IS DISTINCT FROM ROW(OLD."workspaceId",OLD."projectId",OLD."principalId",OLD."createdAt") THEN
    RAISE EXCEPTION 'Project access identity is immutable' USING ERRCODE='23514';
  END IF;
  IF NEW.state='active' THEN
    IF EXISTS (SELECT 1 FROM project WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId" AND "archivedAt" IS NOT NULL) THEN
      RAISE EXCEPTION 'Restore project before granting access' USING ERRCODE='23514';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM membership m JOIN principal p ON p.id=m."principalId"
      WHERE m."workspaceId"=NEW."workspaceId" AND m."principalId"=NEW."principalId" AND m.state='active' AND p.state='active'
        AND p.kind IN ('human','agent') AND (p.kind<>'agent' OR p."workspaceId"=NEW."workspaceId")) THEN
      RAISE EXCEPTION 'Project access requires active scoped membership' USING ERRCODE='23514';
    END IF;
  END IF;
  NEW."updatedAt" := CURRENT_TIMESTAMP;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_project_access BEFORE INSERT OR UPDATE OR DELETE ON project_access FOR EACH ROW EXECUTE FUNCTION preserve_project_access();
-- ON CONFLICT executes both BEFORE INSERT and BEFORE UPDATE. Advance only
-- after the actual row effect, so an upsert increments the aggregate once.
CREATE FUNCTION advance_project_access_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE project SET version=version+1 WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId";
  RETURN NEW;
END $$;
CREATE TRIGGER project_access_version AFTER INSERT OR UPDATE ON project_access FOR EACH ROW EXECUTE FUNCTION advance_project_access_version();

CREATE OR REPLACE FUNCTION preserve_project() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Project history is retained' USING ERRCODE='23514'; END IF;
  IF ROW(NEW.id,NEW."workspaceId",NEW.key,NEW."createdByPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId",NEW."createdAt") IS DISTINCT FROM
     ROW(OLD.id,OLD."workspaceId",OLD.key,OLD."createdByPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId",OLD."createdAt")
     OR NEW."nextTaskNumber" < OLD."nextTaskNumber" THEN
    RAISE EXCEPTION 'Project identity and allocation are immutable' USING ERRCODE='23514';
  END IF;
  IF OLD."archivedAt" IS NOT NULL AND ROW(NEW.name,NEW.description,NEW.visibility) IS DISTINCT FROM ROW(OLD.name,OLD.description,OLD.visibility) THEN
    RAISE EXCEPTION 'Archived project content is frozen' USING ERRCODE='23514';
  END IF;
  IF ROW(NEW.name,NEW.description,NEW.visibility,NEW."archivedAt") IS DISTINCT FROM ROW(OLD.name,OLD.description,OLD.visibility,OLD."archivedAt") OR NEW.version IS DISTINCT FROM OLD.version THEN
    NEW.version := OLD.version + 1; NEW."updatedAt" := CURRENT_TIMESTAMP;
  ELSE NEW.version := OLD.version; NEW."updatedAt" := OLD."updatedAt"; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION preserve_task() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Task history is retained' USING ERRCODE='23514'; END IF;
  IF TG_OP = 'UPDATE' AND ROW(NEW.id,NEW."workspaceId",NEW."projectId",NEW.number,NEW."createdByPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId",NEW."createdAt") IS DISTINCT FROM
     ROW(OLD.id,OLD."workspaceId",OLD."projectId",OLD.number,OLD."createdByPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId",OLD."createdAt") THEN
    RAISE EXCEPTION 'Task identity and authorship are immutable' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM project WHERE id=NEW."projectId" AND "workspaceId"=NEW."workspaceId" AND "archivedAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Archived project is frozen' USING ERRCODE='23514';
  END IF;
  IF NEW."assigneePrincipalId" IS NOT NULL AND (TG_OP='INSERT' OR NEW."assigneePrincipalId" IS DISTINCT FROM OLD."assigneePrincipalId") AND NOT EXISTS
    (SELECT 1 FROM membership m JOIN principal p ON p.id=m."principalId" WHERE m."workspaceId"=NEW."workspaceId" AND m."principalId"=NEW."assigneePrincipalId"
      AND m.state='active' AND p.state='active' AND p.kind IN ('human','agent') AND project_principal_can_read(NEW."workspaceId", NEW."projectId", p.id)) THEN
    RAISE EXCEPTION 'Assignment requires active same-scope membership' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' THEN
    -- Allocation is part of the task insert, so rollback restores the counter.
    UPDATE project SET "nextTaskNumber"="nextTaskNumber"+1 WHERE id=NEW."projectId" AND "workspaceId"=NEW."workspaceId" RETURNING "nextTaskNumber"-1 INTO NEW.number;
  ELSE NEW.version := OLD.version+1; NEW."updatedAt" := CURRENT_TIMESTAMP; END IF;
  RETURN NEW;
END $$;

COMMIT;
