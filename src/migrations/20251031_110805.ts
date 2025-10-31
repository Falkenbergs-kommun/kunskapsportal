import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" ALTER COLUMN "content" SET DATA TYPE varchar;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_content" SET DATA TYPE varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" ALTER COLUMN "content" SET DATA TYPE jsonb;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_content" SET DATA TYPE jsonb;`)
}
