import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';

const SALT_ROUNDS = 10;

// Without 0, O, 1, I and l, so the temporary password is easy to read and type.
const TEMPORARY_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash of a random value. Used when the username does not exist, so a failed login takes as long as a real one.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), SALT_ROUNDS);

export function generateTemporaryPassword(length = 10): string {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += TEMPORARY_ALPHABET[randomInt(TEMPORARY_ALPHABET.length)];
  }
  return password;
}
