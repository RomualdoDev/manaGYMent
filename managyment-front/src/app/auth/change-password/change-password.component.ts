import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { extractErrorMessage } from '../../client.service';
import { AuthService } from '../auth.service';
import { homePath } from '../auth.guards';

// The new password must match its confirmation.
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmation = group.get('confirmation')?.value;
  return newPassword === confirmation ? null : { mismatch: true };
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: '../auth-page.scss'
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Shown as a required first step when the owner logs in with a temporary password.
  readonly forced = this.auth.user()?.mustChangePassword ?? false;

  form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmation: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  submitting = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.submitting) {
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.submitting = true;
    this.errorMessage = '';

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        const user = this.auth.user();
        this.router.navigateByUrl(user ? homePath(user) : '/login');
      },
      error: (error) => {
        this.submitting = false;
        this.errorMessage = extractErrorMessage(error);
      }
    });
  }
}
