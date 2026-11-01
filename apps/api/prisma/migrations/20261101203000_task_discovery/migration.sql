BEGIN;
-- Offline/local additive migration; the explicit one-shot remains the owner.
LOCK TABLE outbox_event IN ACCESS EXCLUSIVE MODE;
ALTER TABLE outbox_event ADD COLUMN sequence bigint;
-- The immutable historical payload, identity and timestamps are unchanged.
ALTER TABLE outbox_event DISABLE TRIGGER retain_outbox;
WITH ordered AS (SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS n FROM outbox_event)
UPDATE outbox_event o SET sequence=ordered.n FROM ordered WHERE ordered.id=o.id;
ALTER TABLE outbox_event ENABLE TRIGGER retain_outbox;
CREATE SEQUENCE outbox_delivery_sequence;
SELECT setval('outbox_delivery_sequence', COALESCE((SELECT max(sequence) FROM outbox_event),0)+1, false);
ALTER TABLE outbox_event ALTER COLUMN sequence SET NOT NULL;
ALTER TABLE outbox_event ALTER COLUMN sequence SET DEFAULT 0;
ALTER TABLE outbox_event ADD CONSTRAINT outbox_sequence_positive CHECK(sequence>0);
CREATE UNIQUE INDEX outbox_event_sequence_key ON outbox_event(sequence);
CREATE INDEX outbox_event_workspace_sequence ON outbox_event("workspaceId",sequence);
-- BEFORE STATEMENT runs before defaults/row triggers. Every insertion, including
-- future worker insertion, takes the existing exclusive fence until COMMIT.
-- A bare sequence/default cannot provide this commit-order property.
CREATE TRIGGER outbox_delivery_fence BEFORE INSERT ON outbox_event FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE FUNCTION assign_outbox_sequence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.sequence := nextval('outbox_delivery_sequence');
  RETURN NEW;
END $$;
CREATE TRIGGER assign_outbox_sequence BEFORE INSERT ON outbox_event FOR EACH ROW EXECUTE FUNCTION assign_outbox_sequence();
COMMIT;
