import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ClientTableComponent } from './client-table/client-table.component';
import { ClientFormComponent } from './client-form/client-form.component';
import { Client } from './client.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ClientTableComponent, ClientFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
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
