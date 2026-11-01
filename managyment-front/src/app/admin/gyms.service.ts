import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api';

export interface GymUser {
  id: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  gymId: number | null;
}

export interface Gym {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  users: GymUser[];
  clientCount: number;
}

export interface CreateGymInput {
  name: string;
  ownerName: string;
  ownerUsername?: string;
}

// The temporary password comes back only once, from create and reset. The screen must show it right away.
export interface CreatedGym {
  gym: Omit<Gym, 'users' | 'clientCount'>;
  user: GymUser;
  temporaryPassword: string;
}

export interface ResetPasswordResult {
  user: GymUser;
  temporaryPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class GymsService {
  private http = inject(HttpClient);

  list(): Observable<Gym[]> {
    return this.http.get<Gym[]>(`${API_URL}/gyms`);
  }

  create(input: CreateGymInput): Observable<CreatedGym> {
    return this.http.post<CreatedGym>(`${API_URL}/gyms`, input);
  }

  setActive(gymId: number, active: boolean): Observable<unknown> {
    return this.http.patch(`${API_URL}/gyms/${gymId}`, { active });
  }

  resetPassword(userId: number): Observable<ResetPasswordResult> {
    return this.http.post<ResetPasswordResult>(`${API_URL}/users/${userId}/reset-password`, {});
  }
}
