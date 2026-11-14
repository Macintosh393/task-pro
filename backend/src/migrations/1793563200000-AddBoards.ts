import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoards1793563200000 implements MigrationInterface {
  name = 'AddBoards1793563200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "boards" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "title" character varying(255) NOT NULL, "iconId" character varying(50) NOT NULL DEFAULT 'project', "backgroundId" character varying(50) NOT NULL DEFAULT 'none', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_boards_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_boards_user_created_id" ON "boards" ("userId", "createdAt", "id")`);
    await queryRunner.query(
      `ALTER TABLE "boards" ADD CONSTRAINT "FK_boards_userId_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "boards" DROP CONSTRAINT "FK_boards_userId_users"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_boards_user_created_id"`);
    await queryRunner.query(`DROP TABLE "boards"`);
  }
}
