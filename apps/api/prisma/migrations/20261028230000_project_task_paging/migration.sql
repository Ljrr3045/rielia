BEGIN;
LOCK TABLE project IN SHARE ROW EXCLUSIVE MODE;
-- Append order is independent of random public IDs and wall-clock ties. The
-- existing BEFORE STATEMENT policy fence serializes project inserts, including
-- ordinary DML. Identity values are allocated only after acquiring that fence.
ALTER TABLE project ADD COLUMN sequence integer;
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id)::integer AS position FROM project
) UPDATE project p SET sequence = ordered.position FROM ordered WHERE p.id = ordered.id;
ALTER TABLE project ALTER COLUMN sequence SET NOT NULL;
ALTER TABLE project ALTER COLUMN sequence ADD GENERATED ALWAYS AS IDENTITY;
SELECT setval(pg_get_serial_sequence('project','sequence'), COALESCE((SELECT max(sequence) FROM project),1), EXISTS(SELECT 1 FROM project));
CREATE UNIQUE INDEX project_sequence_key ON project(sequence);
CREATE UNIQUE INDEX project_workspace_sequence_key ON project("workspaceId", sequence);
CREATE FUNCTION preserve_project_sequence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.sequence IS DISTINCT FROM OLD.sequence THEN
    RAISE EXCEPTION 'Project allocation order is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_project_sequence BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION preserve_project_sequence();
COMMIT;
