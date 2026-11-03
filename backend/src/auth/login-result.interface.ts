import { User } from '../users/entities/user.entity.js';
import { TokenPair } from './token-pair.interface.js';

export interface LoginResult extends TokenPair {
  user: User;
}
