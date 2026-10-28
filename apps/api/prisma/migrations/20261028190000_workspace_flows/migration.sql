BEGIN;
LOCK TABLE principal, membership, workspace IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE membership ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
CREATE FUNCTION membership_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.version := OLD.version + 1; RETURN NEW; END $$;
CREATE TRIGGER membership_version BEFORE UPDATE ON membership FOR EACH ROW EXECUTE FUNCTION membership_version();
CREATE FUNCTION agent_membership_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kind = 'agent' AND ROW(NEW.state, NEW."custodianPrincipalId") IS DISTINCT FROM ROW(OLD.state, OLD."custodianPrincipalId") THEN
    UPDATE membership SET version = version WHERE "principalId" = NEW.id AND "workspaceId" = NEW."workspaceId";
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER agent_membership_version AFTER UPDATE ON principal FOR EACH ROW EXECUTE FUNCTION agent_membership_version();

CREATE TABLE invitation (
  id text PRIMARY KEY,
  "workspaceId" text NOT NULL REFERENCES workspace(id) ON DELETE RESTRICT,
  "issuerPrincipalId" text NOT NULL REFERENCES principal(id) ON DELETE RESTRICT,
  "recipientEmail" text NOT NULL CHECK ("recipientEmail" = lower(btrim("recipientEmail")) AND length("recipientEmail") BETWEEN 3 AND 254),
  role text NOT NULL CHECK (role IN ('admin','member','viewer')),
  "tokenHash" text NOT NULL UNIQUE CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),
  "expiresAt" timestamp(3) NOT NULL,
  "consumedAt" timestamp(3),
  "revokedAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("workspaceId", "issuerPrincipalId") REFERENCES membership("workspaceId", "principalId") ON DELETE RESTRICT,
  CHECK ("expiresAt" > "createdAt"),
  CHECK ("consumedAt" IS NULL OR "revokedAt" IS NULL)
);
CREATE INDEX invitation_workspace_created_idx ON invitation("workspaceId", "createdAt");
CREATE UNIQUE INDEX invitation_pending_recipient_idx ON invitation("workspaceId", "recipientEmail") WHERE "consumedAt" IS NULL AND "revokedAt" IS NULL;
CREATE TRIGGER invitation_fence BEFORE INSERT OR UPDATE OR DELETE ON invitation FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE FUNCTION preserve_invitation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Invitation history must be retained' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' AND (ROW(NEW.id, NEW."workspaceId", NEW."issuerPrincipalId", NEW."recipientEmail", NEW.role, NEW."tokenHash", NEW."createdAt", NEW."expiresAt") IS DISTINCT FROM
      ROW(OLD.id, OLD."workspaceId", OLD."issuerPrincipalId", OLD."recipientEmail", OLD.role, OLD."tokenHash", OLD."createdAt", OLD."expiresAt")
    OR (OLD."consumedAt" IS NOT NULL AND NEW."consumedAt" IS DISTINCT FROM OLD."consumedAt")
    OR (OLD."revokedAt" IS NOT NULL AND NEW."revokedAt" IS DISTINCT FROM OLD."revokedAt")) THEN
    RAISE EXCEPTION 'Invitation identity or terminal state is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_invitation BEFORE UPDATE OR DELETE ON invitation FOR EACH ROW EXECUTE FUNCTION preserve_invitation();
CREATE FUNCTION validate_invitation_issuer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM membership m JOIN principal p ON p.id = m."principalId"
    WHERE m."workspaceId" = NEW."workspaceId" AND m."principalId" = NEW."issuerPrincipalId"
      AND m.state = 'active' AND m.role IN ('owner','admin') AND p.kind = 'human' AND p.state = 'active') THEN
    RAISE EXCEPTION 'Invitation requires a current human administrator issuer' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_invitation_issuer BEFORE INSERT ON invitation FOR EACH ROW EXECUTE FUNCTION validate_invitation_issuer();

-- Owning workspace policy also applies to internal/SQL membership changes.
-- Existing autonomous grants retain independent agent authority when an issuer
-- leaves; terminal subject removal revokes that subject's grants.
CREATE FUNCTION invalidate_membership_authority() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.state <> 'active' OR NEW.role NOT IN ('owner','admin') THEN
    UPDATE invitation SET "revokedAt" = CURRENT_TIMESTAMP WHERE "workspaceId" = NEW."workspaceId" AND "issuerPrincipalId" = NEW."principalId" AND "consumedAt" IS NULL AND "revokedAt" IS NULL;
  END IF;
  IF NEW.state = 'revoked' THEN
    UPDATE execution_grant SET "revokedAt" = CURRENT_TIMESTAMP WHERE "workspaceId" = NEW."workspaceId" AND "subjectPrincipalId" = NEW."principalId" AND "revokedAt" IS NULL;
  END IF;
  IF NEW.role = 'viewer' THEN
    UPDATE execution_grant SET "revokedAt" = CURRENT_TIMESTAMP WHERE "workspaceId" = NEW."workspaceId" AND "subjectPrincipalId" = NEW."principalId" AND "revokedAt" IS NULL AND 'write' = ANY("allowedOperations");
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER invalidate_membership_authority AFTER UPDATE ON membership FOR EACH ROW EXECUTE FUNCTION invalidate_membership_authority();
CREATE FUNCTION invalidate_principal_authority() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.state <> 'active' THEN
    UPDATE invitation SET "revokedAt" = CURRENT_TIMESTAMP WHERE "issuerPrincipalId" = NEW.id AND "consumedAt" IS NULL AND "revokedAt" IS NULL;
  END IF;
  IF NEW.state = 'revoked' THEN
    UPDATE execution_grant SET "revokedAt" = CURRENT_TIMESTAMP WHERE "subjectPrincipalId" = NEW.id AND "revokedAt" IS NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER invalidate_principal_authority AFTER UPDATE ON principal FOR EACH ROW EXECUTE FUNCTION invalidate_principal_authority();
-- Recipient verification changes must serialize with acceptance too.
CREATE TRIGGER user_workspace_fence BEFORE UPDATE ON "user" FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
CREATE TABLE workspace_operation (
  "actorPrincipalId" text NOT NULL REFERENCES principal(id) ON DELETE RESTRICT,
  key text NOT NULL,
  "requestHash" text NOT NULL CHECK ("requestHash" ~ '^[0-9a-f]{64}$'),
  response jsonb NOT NULL,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("actorPrincipalId", key)
);
CREATE TRIGGER workspace_operation_fence BEFORE INSERT OR UPDATE OR DELETE ON workspace_operation FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();
COMMIT;
