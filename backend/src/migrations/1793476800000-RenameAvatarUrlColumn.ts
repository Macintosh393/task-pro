import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAvatarUrlColumn1793476800000 implements MigrationInterface {
  name = 'RenameAvatarUrlColumn1793476800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "avatar_url" TO "avatarUrl"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO "avatar_url"`);
  }
}
