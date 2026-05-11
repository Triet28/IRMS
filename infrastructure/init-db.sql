-- ============================================================
-- IRMS Database Initialisation
-- Runs once when the PostgreSQL container first starts.
-- Creates schemas, service-scoped users, and grants.
-- Table DDL is handled by Flyway inside each Spring Boot service.
-- ============================================================

-- 1. Create schemas
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS menu_schema;
CREATE SCHEMA IF NOT EXISTS order_schema;
CREATE SCHEMA IF NOT EXISTS billing_schema;

-- 2. Create service-specific DB users
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'auth_user') THEN
        CREATE USER auth_user WITH PASSWORD 'auth_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'menu_user') THEN
        CREATE USER menu_user WITH PASSWORD 'menu_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'order_user') THEN
        CREATE USER order_user WITH PASSWORD 'order_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'billing_user') THEN
        CREATE USER billing_user WITH PASSWORD 'billing_pass';
    END IF;
END
$$;

-- 3. Grant: each user may ONLY access its own schema
-- auth_user → auth_schema
GRANT CONNECT ON DATABASE irms TO auth_user;
GRANT USAGE, CREATE ON SCHEMA auth_schema TO auth_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth_schema
    GRANT ALL ON TABLES    TO auth_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth_schema
    GRANT ALL ON SEQUENCES TO auth_user;

-- menu_user → menu_schema
GRANT CONNECT ON DATABASE irms TO menu_user;
GRANT USAGE, CREATE ON SCHEMA menu_schema TO menu_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA menu_schema
    GRANT ALL ON TABLES    TO menu_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA menu_schema
    GRANT ALL ON SEQUENCES TO menu_user;

-- order_user → order_schema
GRANT CONNECT ON DATABASE irms TO order_user;
GRANT USAGE, CREATE ON SCHEMA order_schema TO order_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA order_schema
    GRANT ALL ON TABLES    TO order_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA order_schema
    GRANT ALL ON SEQUENCES TO order_user;

-- billing_user → billing_schema
GRANT CONNECT ON DATABASE irms TO billing_user;
GRANT USAGE, CREATE ON SCHEMA billing_schema TO billing_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA billing_schema
    GRANT ALL ON TABLES    TO billing_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA billing_schema
    GRANT ALL ON SEQUENCES TO billing_user;
