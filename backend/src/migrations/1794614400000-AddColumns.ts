import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumns1794614400000 implements MigrationInterface {
  name = 'AddColumns1794614400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "columns" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "boardId" uuid NOT NULL, "title" character varying(255) NOT NULL, "position" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_columns_board_position" UNIQUE ("boardId", "position") DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT "PK_columns_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "columns" ADD CONSTRAINT "FK_columns_boardId_boards" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "columns" DROP CONSTRAINT "FK_columns_boardId_boards"`);
    await queryRunner.query(`DROP TABLE "columns"`);
  }
}
