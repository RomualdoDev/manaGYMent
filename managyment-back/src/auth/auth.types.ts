import { User } from '@prisma/client';

export const ROLE = { ADMIN: 'ADMIN', STAFF: 'STAFF' } as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

// Only the claims needed to identify the caller. The guard still reloads the user from the database.
export interface JwtPayload {
  sub: number;
  role: Role;
  gymId: number | null;
}

// The logged-in user as seen by controllers and returned to the client. Never includes the password hash.
export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
  gymId: number | null;
  mustChangePassword: boolean;
}

export function toAuthUser(user: Pick<User, 'id' | 'username' | 'name' | 'role' | 'gymId' | 'mustChangePassword'>): AuthUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as Role,
    gymId: user.gymId,
    mustChangePassword: user.mustChangePassword,
  };
}

// A user can log in only if the account is active and its gym is active.
// STAFF always belongs to a gym; ADMIN never does.
export function canAuthenticate(user: { active: boolean; role: string; gym: { active: boolean } | null }): boolean {
  if (!user.active) {
    return false;
  }
  if (!user.gym) {
    return user.role === ROLE.ADMIN;
  }
  return user.gym.active;
}
