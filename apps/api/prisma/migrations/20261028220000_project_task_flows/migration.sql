BEGIN;
LOCK TABLE principal, membership, workspace, execution_grant IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE execution_grant ADD CONSTRAINT execution_grant_scope_subject UNIQUE ("workspaceId", id, "subjectPrincipalId");

CREATE TABLE project (
  id text PRIMARY KEY,
  "workspaceId" text NOT NULL REFERENCES workspace(id) ON DELETE RESTRICT,
  key text NOT NULL CHECK (key ~ '^[A-Z][A-Z0-9]{1,9}$'),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200 AND name = btrim(name)),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 20000),
  visibility text NOT NULL DEFAULT 'workspace' CHECK (visibility = 'workspace'),
  "nextTaskNumber" integer NOT NULL DEFAULT 1 CHECK ("nextTaskNumber" > 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  "archivedAt" timestamp(3),
  "createdByPrincipalId" text NOT NULL,
  "creationMode" text NOT NULL,
  "creationSource" text NOT NULL,
  "creationGrantId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("workspaceId", key), UNIQUE ("workspaceId", id),
  FOREIGN KEY ("workspaceId", "createdByPrincipalId") REFERENCES membership("workspaceId", "principalId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId", "creationGrantId", "createdByPrincipalId") REFERENCES execution_grant("workspaceId", id, "subjectPrincipalId") ON DELETE RESTRICT,
  CHECK (("creationMode" = 'human' AND "creationSource" = 'web' AND "creationGrantId" IS NULL) OR
    ("creationMode" IN ('delegated','autonomous') AND "creationSource" = 'mcp' AND "creationGrantId" IS NOT NULL))
);
CREATE TABLE task (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL,
  number integer NOT NULL CHECK (number > 0),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 300 AND title = btrim(title)),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 20000),
  type text NOT NULL DEFAULT 'task' CHECK (type IN ('task','bug','feature')),
  priority text NOT NULL DEFAULT 'none' CHECK (priority IN ('none','low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog','todo','in_progress','done','canceled')),
  "assigneePrincipalId" text,
  "dueDate" date CHECK ("dueDate" BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), "archivedAt" timestamp(3),
  "createdByPrincipalId" text NOT NULL, "creationMode" text NOT NULL, "creationSource" text NOT NULL, "creationGrantId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("workspaceId", "projectId", number), UNIQUE ("workspaceId", "projectId", id),
  FOREIGN KEY ("workspaceId", "projectId") REFERENCES project("workspaceId", id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId", "createdByPrincipalId") REFERENCES membership("workspaceId", "principalId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId", "assigneePrincipalId") REFERENCES membership("workspaceId", "principalId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId", "creationGrantId", "createdByPrincipalId") REFERENCES execution_grant("workspaceId", id, "subjectPrincipalId") ON DELETE RESTRICT,
  CHECK (("creationMode" = 'human' AND "creationSource" = 'web' AND "creationGrantId" IS NULL) OR
    ("creationMode" IN ('delegated','autonomous') AND "creationSource" = 'mcp' AND "creationGrantId" IS NOT NULL))
);

-- Ordinary DML participates in the existing policy/session fence too. API
-- operations take it before authorization, avoiding check/write race windows.
CREATE TRIGGER project_fence BEFORE INSERT OR UPDATE OR DELETE ON project FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE TRIGGER task_fence BEFORE INSERT OR UPDATE OR DELETE ON task FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE FUNCTION preserve_project() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Project history is retained' USING ERRCODE='23514'; END IF;
  IF ROW(NEW.id,NEW."workspaceId",NEW.key,NEW."createdByPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId",NEW."createdAt") IS DISTINCT FROM
     ROW(OLD.id,OLD."workspaceId",OLD.key,OLD."createdByPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId",OLD."createdAt")
     OR NEW."nextTaskNumber" < OLD."nextTaskNumber" THEN
    RAISE EXCEPTION 'Project identity and allocation are immutable' USING ERRCODE='23514';
  END IF;
  IF ROW(NEW.name,NEW.description,NEW."archivedAt") IS DISTINCT FROM ROW(OLD.name,OLD.description,OLD."archivedAt") OR NEW.version IS DISTINCT FROM OLD.version THEN
    NEW.version := OLD.version + 1; NEW."updatedAt" := CURRENT_TIMESTAMP;
  ELSE NEW.version := OLD.version; NEW."updatedAt" := OLD."updatedAt"; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_project BEFORE UPDATE OR DELETE ON project FOR EACH ROW EXECUTE FUNCTION preserve_project();
CREATE FUNCTION preserve_task() RETURNS trigger LANGUAGE plpgsql AS $$
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
      AND m.state='active' AND p.state='active' AND p.kind IN ('human','agent')) THEN
    RAISE EXCEPTION 'Assignment requires active same-scope membership' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' THEN
    -- Allocation is part of the task insert, so rollback restores the counter.
    UPDATE project SET "nextTaskNumber"="nextTaskNumber"+1 WHERE id=NEW."projectId" AND "workspaceId"=NEW."workspaceId" RETURNING "nextTaskNumber"-1 INTO NEW.number;
  ELSE NEW.version := OLD.version+1; NEW."updatedAt" := CURRENT_TIMESTAMP; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_task BEFORE INSERT OR UPDATE OR DELETE ON task FOR EACH ROW EXECUTE FUNCTION preserve_task();

CREATE TABLE activity_event (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL, "taskId" text,
  "actorPrincipalId" text NOT NULL, "executionMode" text NOT NULL, source text NOT NULL, "grantId" text,
  "requestId" text NOT NULL, action text NOT NULL CHECK (action IN ('create-project','edit-project','archive-project','restore-project','create-task','edit-task','archive-task','restore-task')),
  "entityVersion" integer NOT NULL CHECK ("entityVersion">0), "changedFields" text[] NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE ("workspaceId",id),
  FOREIGN KEY ("workspaceId","projectId") REFERENCES project("workspaceId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","projectId","taskId") REFERENCES task("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","actorPrincipalId") REFERENCES membership("workspaceId","principalId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","grantId","actorPrincipalId") REFERENCES execution_grant("workspaceId",id,"subjectPrincipalId") ON DELETE RESTRICT,
  CHECK (("executionMode"='human' AND source='web' AND "grantId" IS NULL) OR ("executionMode" IN ('delegated','autonomous') AND source='mcp' AND "grantId" IS NOT NULL))
);
CREATE TABLE outbox_event (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "activityId" text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type='domain.activity'), payload jsonb NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("workspaceId","activityId") REFERENCES activity_event("workspaceId",id) ON DELETE RESTRICT,
  CHECK (payload=jsonb_build_object('activityId',"activityId"))
);
CREATE TABLE project_task_operation (
  "workspaceId" text NOT NULL, "actorPrincipalId" text NOT NULL, "executionScope" text NOT NULL, key text NOT NULL,
  "requestHash" text NOT NULL CHECK ("requestHash" ~ '^[0-9a-f]{64}$'), response jsonb NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("workspaceId","actorPrincipalId","executionScope",key),
  FOREIGN KEY ("workspaceId","actorPrincipalId") REFERENCES membership("workspaceId","principalId") ON DELETE RESTRICT
);
CREATE FUNCTION retain_domain_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Domain event and receipt history is immutable' USING ERRCODE='23514'; END $$;
CREATE TRIGGER retain_activity BEFORE UPDATE OR DELETE ON activity_event FOR EACH ROW EXECUTE FUNCTION retain_domain_event();
CREATE TRIGGER retain_outbox BEFORE UPDATE OR DELETE ON outbox_event FOR EACH ROW EXECUTE FUNCTION retain_domain_event();
CREATE TRIGGER retain_domain_receipt BEFORE UPDATE OR DELETE ON project_task_operation FOR EACH ROW EXECUTE FUNCTION retain_domain_event();
COMMIT;
