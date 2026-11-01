import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { extractErrorMessage } from '../client.service';
import { Gym, GymsService, GymUser } from './gyms.service';

// A temporary password on screen. Shown once; the admin copies it and hands it to the owner.
interface IssuedCredentials {
  title: string;
  username: string;
  temporaryPassword: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gymsService = inject(GymsService);

  gyms: Gym[] = [];
  loading = true;
  listError = '';

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    ownerName: ['', Validators.required],
    ownerUsername: ['']
  });
  creating = false;
  formError = '';

  issued: IssuedCredentials | null = null;
  copied = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.gymsService.list().subscribe({
      next: (gyms) => {
        this.gyms = gyms;
        this.loading = false;
      },
      error: (error) => {
        this.listError = extractErrorMessage(error);
        this.loading = false;
      }
    });
  }

  createGym(): void {
    if (this.form.invalid || this.creating) {
      return;
    }
    const { name, ownerName, ownerUsername } = this.form.getRawValue();
    this.creating = true;
    this.formError = '';

    this.gymsService
      .create({ name, ownerName, ownerUsername: ownerUsername.trim() || undefined })
      .subscribe({
        next: ({ gym, user, temporaryPassword }) => {
          this.creating = false;
          this.form.reset();
          this.showCredentials(`Academia "${gym.name}" criada`, user.username, temporaryPassword);
          this.load();
        },
        error: (error) => {
          this.creating = false;
          this.formError = extractErrorMessage(error);
        }
      });
  }

  toggleGym(gym: Gym): void {
    this.gymsService.setActive(gym.id, !gym.active).subscribe({
      next: () => this.load(),
      error: (error) => (this.listError = extractErrorMessage(error))
    });
  }

  resetPassword(user: GymUser): void {
    if (!confirm(`Gerar uma nova senha temporária para "${user.username}"? A senha atual deixará de funcionar.`)) {
      return;
    }
    this.gymsService.resetPassword(user.id).subscribe({
      next: ({ user: updated, temporaryPassword }) => {
        this.showCredentials('Nova senha temporária gerada', updated.username, temporaryPassword);
        this.load();
      },
      error: (error) => (this.listError = extractErrorMessage(error))
    });
  }

  async copyPassword(): Promise<void> {
    if (!this.issued) {
      return;
    }
    await navigator.clipboard.writeText(this.issued.temporaryPassword);
    this.copied = true;
  }

  dismissCredentials(): void {
    this.issued = null;
    this.copied = false;
  }

  private showCredentials(title: string, username: string, temporaryPassword: string): void {
    this.issued = { title, username, temporaryPassword };
    this.copied = false;
  }
}
