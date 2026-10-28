BEGIN;
-- Prevent a user inserted between backfill and trigger installation from being
-- missed. Migration deployment remains the explicit one-shot, never API startup.
LOCK TABLE "user" IN SHARE ROW EXCLUSIVE MODE;

-- A real UPDATE, rather than an advisory lock alone, fences stale snapshots at
-- REPEATABLE READ/SERIALIZABLE as well as serializing READ COMMITTED writers.
-- This intentionally serializes the small T35.0 policy substrate, not task data.
CREATE TABLE principal_policy_fence (singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton), revision bigint NOT NULL DEFAULT 0);
INSERT INTO principal_policy_fence VALUES (true, 0);
CREATE FUNCTION fence_principal_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE principal_policy_fence SET revision = revision + 1 WHERE singleton;
  IF NOT FOUND THEN RAISE EXCEPTION 'Principal policy fence is unavailable' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;

CREATE TABLE principal (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kind text NOT NULL CHECK (kind IN ('human', 'agent', 'system')),
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'suspended', 'revoked')),
  "displayName" text NOT NULL CHECK (length(btrim("displayName")) BETWEEN 1 AND 200),
  "userId" text UNIQUE REFERENCES "user"(id) ON DELETE RESTRICT,
  "workspaceId" text,
  "custodianPrincipalId" text REFERENCES principal(id) ON DELETE RESTRICT,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT principal_identity_kind CHECK (
    (kind = 'human' AND "userId" IS NOT NULL AND "workspaceId" IS NULL AND "custodianPrincipalId" IS NULL)
    OR (kind = 'agent' AND "userId" IS NULL AND "workspaceId" IS NOT NULL AND "custodianPrincipalId" IS NOT NULL)
    OR (kind = 'system' AND id = 'rielia-system' AND "userId" IS NULL AND "workspaceId" IS NULL AND "custodianPrincipalId" IS NULL)
  ),
  CONSTRAINT principal_system_reserved CHECK ((id = 'rielia-system') = (kind = 'system'))
);
CREATE INDEX principal_workspace_idx ON principal("workspaceId");
CREATE INDEX principal_custodian_idx ON principal("custodianPrincipalId");
CREATE TABLE workspace (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  "ownerPrincipalId" text NOT NULL REFERENCES principal(id) ON DELETE RESTRICT,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE principal ADD FOREIGN KEY ("workspaceId") REFERENCES workspace(id) ON DELETE RESTRICT;
CREATE TABLE membership (
  "workspaceId" text NOT NULL REFERENCES workspace(id) ON DELETE RESTRICT,
  "principalId" text NOT NULL REFERENCES principal(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'suspended', 'revoked')),
  PRIMARY KEY ("workspaceId", "principalId")
);
CREATE INDEX membership_principal_idx ON membership("principalId");
CREATE TABLE execution_grant (
  id text PRIMARY KEY,
  "workspaceId" text NOT NULL REFERENCES workspace(id) ON DELETE RESTRICT,
  "subjectPrincipalId" text NOT NULL REFERENCES principal(id) ON DELETE RESTRICT,
  "authorizedByPrincipalId" text NOT NULL REFERENCES principal(id) ON DELETE RESTRICT,
  mode text NOT NULL CHECK (mode IN ('delegated', 'autonomous')),
  "allowedOperations" text[] NOT NULL CHECK (cardinality("allowedOperations") > 0 AND "allowedOperations" <@ ARRAY['read', 'write']::text[] AND array_position("allowedOperations", NULL) IS NULL),
  "expiresAt" timestamp(3) NOT NULL,
  "revokedAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX execution_grant_subject_idx ON execution_grant("workspaceId", "subjectPrincipalId");

CREATE FUNCTION preserve_principal_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Historical identity must be retained' USING ERRCODE = '23514'; END IF;
  IF ROW(NEW.id, NEW.kind, NEW."userId", NEW."workspaceId", NEW."createdAt") IS DISTINCT FROM
     ROW(OLD.id, OLD.kind, OLD."userId", OLD."workspaceId", OLD."createdAt")
     OR (OLD.state = 'revoked' AND NEW.state <> 'revoked') THEN
    RAISE EXCEPTION 'Principal identity is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preserve_principal BEFORE UPDATE OR DELETE ON principal FOR EACH ROW EXECUTE FUNCTION preserve_principal_identity();

CREATE FUNCTION preserve_policy_reference() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Historical policy reference must be retained' USING ERRCODE = '23514'; END IF;
  IF TG_TABLE_NAME = 'membership' THEN
    IF ROW(NEW."workspaceId", NEW."principalId") IS DISTINCT FROM ROW(OLD."workspaceId", OLD."principalId")
      OR (OLD.state = 'revoked' AND NEW.state <> 'revoked') THEN
      RAISE EXCEPTION 'Membership identity is immutable' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'workspace' THEN
    IF ROW(NEW.id, NEW."createdAt") IS DISTINCT FROM ROW(OLD.id, OLD."createdAt") THEN
      RAISE EXCEPTION 'Workspace identity is immutable' USING ERRCODE = '23514';
    END IF;
  ELSE
    IF ROW(NEW.id, NEW."workspaceId", NEW."subjectPrincipalId", NEW."authorizedByPrincipalId", NEW.mode, NEW."createdAt", NEW."expiresAt", NEW."allowedOperations") IS DISTINCT FROM
       ROW(OLD.id, OLD."workspaceId", OLD."subjectPrincipalId", OLD."authorizedByPrincipalId", OLD.mode, OLD."createdAt", OLD."expiresAt", OLD."allowedOperations")
       OR (OLD."revokedAt" IS NOT NULL AND NEW."revokedAt" IS DISTINCT FROM OLD."revokedAt") THEN
      RAISE EXCEPTION 'Grant identity and limits are immutable; issue another grant' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- These constraints run against the final transaction state, allowing atomic
-- workspace+owner-member creation and explicit management/ownership transfer.
CREATE FUNCTION validate_principal_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM workspace w LEFT JOIN principal p ON p.id = w."ownerPrincipalId"
    LEFT JOIN membership m ON m."workspaceId" = w.id AND m."principalId" = p.id
    WHERE p.kind IS DISTINCT FROM 'human' OR p.state IS DISTINCT FROM 'active'
      OR m.role IS DISTINCT FROM 'owner' OR m.state IS DISTINCT FROM 'active'
  ) THEN RAISE EXCEPTION 'Workspace requires its active human owner' USING ERRCODE = '23514'; END IF;
  IF EXISTS (
    SELECT 1 FROM membership m JOIN principal p ON p.id = m."principalId" JOIN workspace w ON w.id = m."workspaceId"
    WHERE p.kind = 'system' OR (m.role = 'owner' AND m."principalId" <> w."ownerPrincipalId")
      OR (p.kind = 'agent' AND (p."workspaceId" <> m."workspaceId" OR m.role NOT IN ('member', 'viewer')))
  ) THEN RAISE EXCEPTION 'Membership kind, role or workspace is inconsistent' USING ERRCODE = '23514'; END IF;
  IF EXISTS (
    SELECT 1 FROM principal a LEFT JOIN principal c ON c.id = a."custodianPrincipalId"
    LEFT JOIN membership cm ON cm."workspaceId" = a."workspaceId" AND cm."principalId" = c.id
    LEFT JOIN membership am ON am."workspaceId" = a."workspaceId" AND am."principalId" = a.id
    WHERE a.kind = 'agent' AND (c.kind IS DISTINCT FROM 'human' OR am."principalId" IS NULL
      OR (a.state = 'active' AND (c.state IS DISTINCT FROM 'active' OR cm.state IS DISTINCT FROM 'active' OR cm.role NOT IN ('owner', 'admin'))))
  ) THEN RAISE EXCEPTION 'Agent requires own membership and active human administrator custodian, or explicit suspension' USING ERRCODE = '23514'; END IF;
  IF EXISTS (
    SELECT 1 FROM execution_grant g JOIN principal p ON p.id = g."subjectPrincipalId"
    JOIN principal a ON a.id = g."authorizedByPrincipalId"
    LEFT JOIN membership m ON m."workspaceId" = g."workspaceId" AND m."principalId" = p.id
    WHERE a.kind <> 'human' OR m."principalId" IS NULL
      OR (g.mode = 'delegated' AND (p.kind <> 'human' OR g."authorizedByPrincipalId" <> g."subjectPrincipalId"))
      OR (g.mode = 'autonomous' AND (p.kind <> 'agent' OR p."workspaceId" <> g."workspaceId"))
  ) THEN RAISE EXCEPTION 'Grant subject kind or workspace is inconsistent' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;

CREATE FUNCTION validate_grant_issuance() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM principal a JOIN membership m ON m."principalId" = a.id AND m."workspaceId" = NEW."workspaceId"
    WHERE a.id = NEW."authorizedByPrincipalId" AND a.kind = 'human' AND a.state = 'active' AND m.state = 'active'
      AND (NEW.mode = 'delegated' AND NEW."subjectPrincipalId" = a.id OR NEW.mode = 'autonomous' AND m.role IN ('owner', 'admin'))
  ) THEN RAISE EXCEPTION 'Grant requires its current authorized human issuer' USING ERRCODE = '23514'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM principal p JOIN membership m ON m."principalId" = p.id AND m."workspaceId" = NEW."workspaceId"
    WHERE p.id = NEW."subjectPrincipalId" AND p.state = 'active' AND m.state = 'active'
      AND (m.role <> 'viewer' OR NOT ('write' = ANY(NEW."allowedOperations")))
  ) THEN RAISE EXCEPTION 'Grant cannot exceed current subject permissions' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER grant_issuance BEFORE INSERT ON execution_grant FOR EACH ROW EXECUTE FUNCTION validate_grant_issuance();

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY['principal', 'workspace', 'membership', 'execution_grant'] LOOP
    EXECUTE format('CREATE TRIGGER policy_write_fence BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy()', tab);
    EXECUTE format('CREATE CONSTRAINT TRIGGER principal_policy_consistency AFTER INSERT OR UPDATE OR DELETE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_principal_policy()', tab);
    IF tab <> 'principal' THEN
      EXECUTE format('CREATE TRIGGER preserve_policy_reference BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION preserve_policy_reference()', tab);
    END IF;
  END LOOP;
END $$;
-- Session revocation/expiry updates participate in the same atomic use-case
-- fence, so an already-issued opaque web context cannot race logout.
CREATE TRIGGER session_policy_fence BEFORE INSERT OR UPDATE OR DELETE ON session FOR EACH STATEMENT EXECUTE FUNCTION fence_principal_policy();

INSERT INTO principal(id, kind, "displayName") VALUES ('rielia-system', 'system', 'System');
INSERT INTO principal(kind, "userId", "displayName") SELECT 'human', id, left(coalesce(nullif(btrim(name), ''), 'Human'), 200) FROM "user";
CREATE FUNCTION map_human_principal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO principal(kind, "userId", "displayName") VALUES ('human', NEW.id, left(coalesce(nullif(btrim(NEW.name), ''), 'Human'), 200));
  RETURN NEW;
END $$;
CREATE TRIGGER user_principal_mapping AFTER INSERT ON "user" FOR EACH ROW EXECUTE FUNCTION map_human_principal();
COMMIT;
