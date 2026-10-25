import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationSmokeTest1792950138588 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "migration_smoke_test" ("id" integer NOT NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "migration_smoke_test"`);
  }
}
