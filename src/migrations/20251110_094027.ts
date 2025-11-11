import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('superadmin', 'editor');
  ALTER TYPE "public"."enum_articles_document_type" ADD VALUE 'routine' BEFORE 'plan';
  ALTER TYPE "public"."enum__articles_v_version_document_type" ADD VALUE 'routine' BEFORE 'plan';
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"departments_id" integer
  );
  
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  ALTER TABLE "departments" ADD COLUMN "full_path" varchar;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_departments_id_idx" ON "users_rels" USING btree ("departments_id");
  CREATE INDEX "departments_full_path_idx" ON "departments" USING btree ("full_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_rels" CASCADE;
  ALTER TABLE "articles" ALTER COLUMN "document_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_articles_document_type";
  CREATE TYPE "public"."enum_articles_document_type" AS ENUM('policy', 'guideline', 'instruction', 'plan', 'protocol', 'report', 'decision', 'agreement', 'template', 'faq');
  ALTER TABLE "articles" ALTER COLUMN "document_type" SET DATA TYPE "public"."enum_articles_document_type" USING "document_type"::"public"."enum_articles_document_type";
  ALTER TABLE "_articles_v" ALTER COLUMN "version_document_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__articles_v_version_document_type";
  CREATE TYPE "public"."enum__articles_v_version_document_type" AS ENUM('policy', 'guideline', 'instruction', 'plan', 'protocol', 'report', 'decision', 'agreement', 'template', 'faq');
  ALTER TABLE "_articles_v" ALTER COLUMN "version_document_type" SET DATA TYPE "public"."enum__articles_v_version_document_type" USING "version_document_type"::"public"."enum__articles_v_version_document_type";
  DROP INDEX "departments_full_path_idx";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "departments" DROP COLUMN "full_path";
  DROP TYPE "public"."enum_users_role";`)
}
