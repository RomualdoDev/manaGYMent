import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../api';

export type Role = 'ADMIN' | 'STAFF';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
  gymId: number | null;
  mustChangePassword: boolean;
}

interface Session {
  accessToken: string;
  user: AuthUser;
}

const STORAGE_KEY = 'managyment.session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private session = signal<Session | null>(this.loadSession());

  readonly user = computed(() => this.session()?.user ?? null);

  get token(): string | null {
    return this.session()?.accessToken ?? null;
  }

  login(username: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${API_URL}/auth/login`, { username, password }).pipe(
      tap((session) => this.save(session))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/change-password`, { currentPassword, newPassword }).pipe(
      tap(() => {
        const current = this.session();
        if (current) {
          this.save({ ...current, user: { ...current.user, mustChangePassword: false } });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private save(session: Session): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  // A session whose token already expired is dropped right away, so the user sees the login screen.
  private loadSession(): Session | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const session: Session = JSON.parse(raw);
      if (!isExpired(session.accessToken)) {
        return session;
      }
    } catch {
      // Corrupted entry: treated as no session below.
    }
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// Reads the "exp" claim of the JWT (seconds since epoch). The server still checks the signature.
function isExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
