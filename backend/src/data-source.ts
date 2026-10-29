import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [User],
  migrations: ['dist/migrations/*.js'],
});
