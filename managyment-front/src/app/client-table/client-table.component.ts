import { Component, DestroyRef, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Client, ClientService, extractErrorMessage } from '../client.service';
import { formatCpf, formatDate, formatDayMonth, formatPhone, initials, normalizeText, todayIso } from '../client.format';

@Component({
  selector: 'app-client-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule],
  templateUrl: './client-table.component.html',
  styleUrls: ['./client-table.component.scss']
})
export class ClientTableComponent implements OnInit {
  @Output() edit = new EventEmitter<Client>();

  private clientService = inject(ClientService);
  private destroyRef = inject(DestroyRef);

  displayedColumns: string[] = ['name', 'cpf', 'email', 'phoneNumber', 'age', 'billingDay', 'actions'];
  clients: Client[] = [];
  filteredClients: Client[] = [];
  filter = '';
  loading = false;
  errorMessage = '';
  selectedClient: Client | null = null;

  readonly formatCpf = formatCpf;
  readonly formatPhone = formatPhone;
  readonly formatDate = formatDate;
  readonly formatDayMonth = formatDayMonth;
  readonly initials = initials;

  ngOnInit(): void {
    this.loadClients();
    this.clientService.clientsChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadClients());
  }

  loadClients(): void {
    this.loading = true;
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.applyFilter();
        // Keep the open details in sync with the latest data; close it if the client was deleted.
        if (this.selectedClient) {
          const cpf = this.selectedClient.cpf;
          this.selectedClient = data.find((client) => client.cpf === cpf) ?? null;
        }
        this.loading = false;
        this.errorMessage = '';
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = extractErrorMessage(error);
      }
    });
  }

  // Text fields ignore case and accents. CPF and phone are stored as digits only,
  // so the typed value is compared by its digits, which also finds masked input.
  applyFilter(): void {
    const term = normalizeText(this.filter.trim());
    const digits = this.filter.replace(/\D/g, '');
    if (!term) {
      this.filteredClients = this.clients;
      return;
    }
    this.filteredClients = this.clients.filter((client) =>
      normalizeText(client.name).includes(term) ||
      normalizeText(client.email).includes(term) ||
      (digits !== '' && (client.cpf.includes(digits) || client.phoneNumber.includes(digits)))
    );
  }

  isDueToday(client: Client): boolean {
    return client.nextDueDate === todayIso();
  }

  showClientDetails(client: Client): void {
    this.selectedClient = client;
  }

  closePopup(): void {
    this.selectedClient = null;
  }

  remove(client: Client): void {
    if (!confirm(`Excluir o cliente ${client.name}?`)) {
      return;
    }
    this.clientService.deleteClient(client.cpf).subscribe({
      error: (error) => (this.errorMessage = extractErrorMessage(error))
    });
  }
}
