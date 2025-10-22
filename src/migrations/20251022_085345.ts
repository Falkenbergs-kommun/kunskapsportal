import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" ADD COLUMN "created_by_id" integer;
  ALTER TABLE "articles" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_created_by_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_updated_by_id" integer;
  ALTER TABLE "departments" ADD COLUMN "created_by_id" integer;
  ALTER TABLE "departments" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "departments" ADD CONSTRAINT "departments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "departments" ADD CONSTRAINT "departments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "articles_created_by_idx" ON "articles" USING btree ("created_by_id");
  CREATE INDEX "articles_updated_by_idx" ON "articles" USING btree ("updated_by_id");
  CREATE INDEX "_articles_v_version_version_created_by_idx" ON "_articles_v" USING btree ("version_created_by_id");
  CREATE INDEX "_articles_v_version_version_updated_by_idx" ON "_articles_v" USING btree ("version_updated_by_id");
  CREATE INDEX "departments_created_by_idx" ON "departments" USING btree ("created_by_id");
  CREATE INDEX "departments_updated_by_idx" ON "departments" USING btree ("updated_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" DROP CONSTRAINT "articles_created_by_id_users_id_fk";
  
  ALTER TABLE "articles" DROP CONSTRAINT "articles_updated_by_id_users_id_fk";
  
  ALTER TABLE "_articles_v" DROP CONSTRAINT "_articles_v_version_created_by_id_users_id_fk";
  
  ALTER TABLE "_articles_v" DROP CONSTRAINT "_articles_v_version_updated_by_id_users_id_fk";
  
  ALTER TABLE "departments" DROP CONSTRAINT "departments_created_by_id_users_id_fk";
  
  ALTER TABLE "departments" DROP CONSTRAINT "departments_updated_by_id_users_id_fk";
  
  DROP INDEX "articles_created_by_idx";
  DROP INDEX "articles_updated_by_idx";
  DROP INDEX "_articles_v_version_version_created_by_idx";
  DROP INDEX "_articles_v_version_version_updated_by_idx";
  DROP INDEX "departments_created_by_idx";
  DROP INDEX "departments_updated_by_idx";
  ALTER TABLE "articles" DROP COLUMN "created_by_id";
  ALTER TABLE "articles" DROP COLUMN "updated_by_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_created_by_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_updated_by_id";
  ALTER TABLE "departments" DROP COLUMN "created_by_id";
  ALTER TABLE "departments" DROP COLUMN "updated_by_id";`)
}
