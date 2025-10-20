/*
  Warnings:

  - The values [Boolean,String] on the enum `Typetrait` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Typetrait_new" AS ENUM ('BOOLEAN', 'STRING', 'ENUM');
ALTER TABLE "Trait" ALTER COLUMN "type" TYPE "Typetrait_new" USING ("type"::text::"Typetrait_new");
ALTER TYPE "Typetrait" RENAME TO "Typetrait_old";
ALTER TYPE "Typetrait_new" RENAME TO "Typetrait";
DROP TYPE "public"."Typetrait_old";
COMMIT;
