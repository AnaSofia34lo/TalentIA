UPDATE "users" SET "role" = 'recruiter' WHERE "role"::text = 'admin';

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
DROP TYPE IF EXISTS "Role";
CREATE TYPE "Role" AS ENUM ('recruiter', 'candidate');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'candidate';
