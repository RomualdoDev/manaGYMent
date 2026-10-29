import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Client {
  cpf: string;
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  size?: number | null;
  beginDate?: number | null;
  billingDay: number;
  nextDueDate: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientInput = Pick<Client, 'cpf' | 'name' | 'email' | 'phoneNumber' | 'age' | 'billingDay'>;
export type ClientUpdate = Omit<ClientInput, 'cpf'>;

// Extracts the message from the API: validation errors arrive as a list, the others as text.
export function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Não foi possível conectar à API. Verifique se o backend está rodando.';
    }
    const message = error.error?.message;
    if (Array.isArray(message)) {
      return message.join('. ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Erro inesperado. Tente novamente.';
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'http://localhost:3000/clients';
  private changes = new Subject<void>();

  // Emits whenever the list changes (create, update or delete), so the screens reload.
  readonly clientsChanged = this.changes.asObservable();

  constructor(private http: HttpClient) { }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getClientByCpf(cpf: string): Observable<Client> {
    return this.http.get<Client>(this.clientUrl(cpf));
  }

  createClient(client: ClientInput): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client).pipe(
      tap(() => this.changes.next())
    );
  }

  updateClient(cpf: string, client: ClientUpdate): Observable<Client> {
    return this.http.patch<Client>(this.clientUrl(cpf), client).pipe(
      tap(() => this.changes.next())
    );
  }

  deleteClient(cpf: string): Observable<void> {
    return this.http.delete<void>(this.clientUrl(cpf)).pipe(
      tap(() => this.changes.next())
    );
  }

  private clientUrl(cpf: string): string {
    return `${this.apiUrl}/${encodeURIComponent(cpf)}`;
  }
}
