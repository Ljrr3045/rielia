BEGIN;
LOCK TABLE project, task IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE project ADD COLUMN "taskRevision" integer NOT NULL DEFAULT 1 CHECK ("taskRevision">0);
ALTER TABLE task ADD COLUMN rank bigint NOT NULL DEFAULT 0;
-- Backfill without firing existing UPDATE/version/archive guards. This happens
-- only inside the explicit migration, with both domain tables locked.
ALTER TABLE task DISABLE TRIGGER preserve_task;
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY "workspaceId","projectId",status ORDER BY number,id)*1024 AS rank FROM task
) UPDATE task SET rank=ordered.rank FROM ordered WHERE task.id=ordered.id;
ALTER TABLE task ENABLE TRIGGER preserve_task;
ALTER TABLE task ADD CONSTRAINT task_positive_rank CHECK (rank>0);
ALTER TABLE task ADD CONSTRAINT task_scope_status_rank UNIQUE ("workspaceId","projectId",status,rank) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE activity_event DROP CONSTRAINT activity_event_action_check;
ALTER TABLE activity_event ADD CONSTRAINT activity_event_action_check CHECK (action IN
  ('create-project','edit-project','archive-project','restore-project','create-task','edit-task','archive-task','restore-task','change-visibility','change-access','move-task'));

-- Called only inside the existing exclusive policy fence (also acquired by
-- task statement triggers). Never accepts a browser array offset or rank.
CREATE FUNCTION task_rank_before(w text, p text, s text, before_id text, moving_id text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE upper_rank bigint; lower_rank bigint; attempt integer;
BEGIN
  IF s NOT IN ('backlog','todo','in_progress','done','canceled') THEN RAISE EXCEPTION 'Invalid status' USING ERRCODE='23514'; END IF;
  FOR attempt IN 1..2 LOOP
    IF before_id IS NULL THEN
      SELECT coalesce(max(rank),0) INTO lower_rank FROM task WHERE "workspaceId"=w AND "projectId"=p AND status=s AND id IS DISTINCT FROM moving_id;
      IF lower_rank<=9223372036854774783 THEN RETURN lower_rank+1024; END IF;
    ELSE
      SELECT rank INTO upper_rank FROM task WHERE "workspaceId"=w AND "projectId"=p AND status=s AND id=before_id AND id IS DISTINCT FROM moving_id AND "archivedAt" IS NULL;
      IF upper_rank IS NULL THEN RAISE EXCEPTION 'Invalid move anchor' USING ERRCODE='23514'; END IF;
      SELECT coalesce(max(rank),0) INTO lower_rank FROM task WHERE "workspaceId"=w AND "projectId"=p AND status=s AND rank<upper_rank AND id IS DISTINCT FROM moving_id;
      IF upper_rank-lower_rank>1 THEN RETURN lower_rank+(upper_rank-lower_rank)/2; END IF;
    END IF;
    IF attempt=1 THEN
      -- Retained archived rows take part, preserving their relative order and
      -- restoration position. Existing guards conservatively bump row versions;
      -- the enclosing operation owns the one aggregate activity/outbox/receipt.
      WITH ordered AS (
        SELECT id,row_number() OVER (ORDER BY rank,number,id)*1024 AS rank FROM task WHERE "workspaceId"=w AND "projectId"=p AND status=s
      ) UPDATE task SET rank=ordered.rank FROM ordered WHERE task.id=ordered.id AND task.rank IS DISTINCT FROM ordered.rank;
    END IF;
  END LOOP;
  RAISE EXCEPTION 'Task order exhausted' USING ERRCODE='23514';
END $$;

CREATE FUNCTION initialize_task_rank() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.rank=0 THEN NEW.rank:=task_rank_before(NEW."workspaceId",NEW."projectId",NEW.status,NULL,NULL); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER initialize_task_rank BEFORE INSERT ON task FOR EACH ROW EXECUTE FUNCTION initialize_task_rank();
CREATE FUNCTION advance_task_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE project SET "taskRevision"="taskRevision"+1 WHERE "workspaceId"=NEW."workspaceId" AND id=NEW."projectId";
  RETURN NEW;
END $$;
CREATE TRIGGER advance_task_revision AFTER INSERT OR UPDATE ON task FOR EACH ROW EXECUTE FUNCTION advance_task_revision();
CREATE FUNCTION preserve_task_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."taskRevision"<OLD."taskRevision" THEN RAISE EXCEPTION 'Task revision is monotonic' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_task_revision BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION preserve_task_revision();
COMMIT;
