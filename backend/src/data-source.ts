import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity.js';
import { RefreshToken } from './auth/entities/refresh-token.entity.js';
import { Board } from './boards/entities/board.entity.js';
import { BoardColumn } from './columns/entities/column.entity.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [User, RefreshToken, Board, BoardColumn],
  migrations: ['dist/migrations/*.js'],
});
