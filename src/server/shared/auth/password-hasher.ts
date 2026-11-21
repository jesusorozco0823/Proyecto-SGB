import bcrypt from 'bcryptjs';

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export const passwordHasher: PasswordHasher = {
  hash(plain) {
    return bcrypt.hash(plain, 12);
  },
  verify(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};
