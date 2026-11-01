import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientTableComponent } from '../client-table/client-table.component';
import { ClientFormComponent } from '../client-form/client-form.component';
import { Client } from '../client.service';

// Clients of the logged-in gym: list, create and edit.
@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, ClientTableComponent, ClientFormComponent],
  templateUrl: './clients-page.component.html'
})
export class ClientsPageComponent {
  formOpen = false;
  editingClient: Client | null = null;

  openCreate(): void {
    this.editingClient = null;
    this.formOpen = true;
  }

  openEdit(client: Client): void {
    this.editingClient = client;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
    this.editingClient = null;
  }
}
