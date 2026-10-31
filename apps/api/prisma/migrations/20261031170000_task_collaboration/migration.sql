BEGIN;
LOCK TABLE task, activity_event IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE task ADD COLUMN "parentTaskId" text;
ALTER TABLE task ADD CONSTRAINT task_parent_scope FOREIGN KEY ("workspaceId","projectId","parentTaskId") REFERENCES task("workspaceId","projectId",id) ON DELETE RESTRICT;
ALTER TABLE task ADD CONSTRAINT task_not_self_parent CHECK (id IS DISTINCT FROM "parentTaskId");
CREATE INDEX task_parent ON task("workspaceId","projectId","parentTaskId",number);
-- The existing statement fence serializes both ordinary DML and service writes.
-- Check final hierarchy at commit too, including transactions changing both ends.
CREATE FUNCTION check_task_hierarchy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM task child JOIN task parent ON parent.id=child."parentTaskId" AND parent."workspaceId"=child."workspaceId" AND parent."projectId"=child."projectId"
    WHERE child."workspaceId"=NEW."workspaceId" AND child."projectId"=NEW."projectId" AND parent."parentTaskId" IS NOT NULL) THEN
    RAISE EXCEPTION 'Task hierarchy permits one level only' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER task_hierarchy AFTER INSERT OR UPDATE ON task DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_task_hierarchy();
CREATE FUNCTION guard_parent_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='INSERT' OR NEW."parentTaskId" IS DISTINCT FROM OLD."parentTaskId" THEN
    IF (TG_OP='UPDATE' AND OLD."archivedAt" IS NOT NULL) OR EXISTS
      (SELECT 1 FROM task WHERE "workspaceId"=NEW."workspaceId" AND "projectId"=NEW."projectId" AND "archivedAt" IS NOT NULL AND
        (id=NEW."parentTaskId" OR (TG_OP='UPDATE' AND id=OLD."parentTaskId"))) THEN
      RAISE EXCEPTION 'Archived relationships are frozen' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_parent_change BEFORE INSERT OR UPDATE ON task FOR EACH ROW EXECUTE FUNCTION guard_parent_change();

CREATE TABLE checklist_item (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL, "taskId" text NOT NULL,
  text text NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 500 AND text=btrim(text) AND text !~ E'[\\r\\n\\t]'),
  position integer NOT NULL CHECK (position BETWEEN 1 AND 100), completed boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK (version>0), "removedAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("workspaceId","projectId","taskId",id),
  FOREIGN KEY ("workspaceId","projectId","taskId") REFERENCES task("workspaceId","projectId",id) ON DELETE RESTRICT
);
CREATE INDEX checklist_order ON checklist_item("workspaceId","projectId","taskId",position,id) WHERE "removedAt" IS NULL;
CREATE TABLE task_comment (
  id text PRIMARY KEY, "workspaceId" text NOT NULL, "projectId" text NOT NULL, "taskId" text NOT NULL,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 10000), version integer NOT NULL DEFAULT 1 CHECK (version>0),
  "authorPrincipalId" text NOT NULL, "creationMode" text NOT NULL, "creationSource" text NOT NULL, "creationGrantId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("workspaceId","projectId","taskId",id),
  FOREIGN KEY ("workspaceId","projectId","taskId") REFERENCES task("workspaceId","projectId",id) ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","authorPrincipalId") REFERENCES membership("workspaceId","principalId") ON DELETE RESTRICT,
  FOREIGN KEY ("workspaceId","creationGrantId","authorPrincipalId") REFERENCES execution_grant("workspaceId",id,"subjectPrincipalId") ON DELETE RESTRICT,
  CHECK (("creationMode"='human' AND "creationSource"='web' AND "creationGrantId" IS NULL) OR
    ("creationMode" IN ('delegated','autonomous') AND "creationSource"='mcp' AND "creationGrantId" IS NOT NULL))
);
CREATE INDEX comment_page ON task_comment("workspaceId","projectId","taskId","updatedAt" DESC,id DESC);
CREATE TRIGGER checklist_fence BEFORE INSERT OR UPDATE OR DELETE ON checklist_item FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE TRIGGER comment_fence BEFORE INSERT OR UPDATE OR DELETE ON task_comment FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE FUNCTION preserve_task_collaboration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Collaboration history is retained' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' THEN
    IF ROW(NEW.id,NEW."workspaceId",NEW."projectId",NEW."taskId",NEW."createdAt") IS DISTINCT FROM ROW(OLD.id,OLD."workspaceId",OLD."projectId",OLD."taskId",OLD."createdAt") THEN
      RAISE EXCEPTION 'Collaboration identity is immutable' USING ERRCODE='23514';
    END IF;
    IF TG_TABLE_NAME='task_comment' THEN
      IF ROW(NEW."authorPrincipalId",NEW."creationMode",NEW."creationSource",NEW."creationGrantId") IS DISTINCT FROM ROW(OLD."authorPrincipalId",OLD."creationMode",OLD."creationSource",OLD."creationGrantId") THEN
        RAISE EXCEPTION 'Comment authorship is immutable' USING ERRCODE='23514';
      END IF;
    ELSIF OLD."removedAt" IS NOT NULL THEN
      RAISE EXCEPTION 'Removed checklist items are retained' USING ERRCODE='23514';
    END IF;
    NEW.version:=OLD.version+1; NEW."updatedAt":=CURRENT_TIMESTAMP;
  END IF;
  IF EXISTS (SELECT 1 FROM task t JOIN project p ON p.id=t."projectId" AND p."workspaceId"=t."workspaceId" WHERE t.id=NEW."taskId" AND t."workspaceId"=NEW."workspaceId" AND t."projectId"=NEW."projectId" AND (t."archivedAt" IS NOT NULL OR p."archivedAt" IS NOT NULL)) THEN
    RAISE EXCEPTION 'Archived collaboration is frozen' USING ERRCODE='23514';
  END IF;
  IF TG_TABLE_NAME='checklist_item' AND TG_OP='INSERT' AND (SELECT count(*) FROM checklist_item WHERE "workspaceId"=NEW."workspaceId" AND "projectId"=NEW."projectId" AND "taskId"=NEW."taskId" AND "removedAt" IS NULL)>=100 THEN
    RAISE EXCEPTION 'Checklist limit reached' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_checklist BEFORE INSERT OR UPDATE OR DELETE ON checklist_item FOR EACH ROW EXECUTE FUNCTION preserve_task_collaboration();
CREATE TRIGGER preserve_comment BEFORE INSERT OR UPDATE OR DELETE ON task_comment FOR EACH ROW EXECUTE FUNCTION preserve_task_collaboration();

ALTER TABLE activity_event ADD COLUMN changes jsonb;
ALTER TABLE activity_event ADD CONSTRAINT activity_changes_bounded CHECK (changes IS NULL OR (jsonb_typeof(changes)='array' AND jsonb_array_length(changes)<=4 AND pg_column_size(changes)<=2048));
ALTER TABLE activity_event DROP CONSTRAINT activity_event_action_check;
ALTER TABLE activity_event ADD CONSTRAINT activity_event_action_check CHECK (action IN
 ('create-project','edit-project','archive-project','restore-project','create-task','edit-task','archive-task','restore-task','change-visibility','change-access','move-task',
  'set-task-parent','add-checklist-item','edit-checklist-item','move-checklist-item','remove-checklist-item','add-comment','edit-comment'));
CREATE INDEX task_activity_page ON activity_event("workspaceId","projectId","taskId","createdAt",id);
COMMIT;
