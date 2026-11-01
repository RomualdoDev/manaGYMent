import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { extractErrorMessage } from '../../client.service';
import { AuthService } from '../auth.service';
import { homePath } from '../auth.guards';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: '../auth-page.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submitting = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid || this.submitting) {
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.submitting = true;
    this.errorMessage = '';

    this.auth.login(username, password).subscribe({
      next: ({ user }) => this.router.navigateByUrl(homePath(user)),
      error: (error) => {
        this.submitting = false;
        this.errorMessage = describeLoginError(error);
      }
    });
  }
}

function describeLoginError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 429) {
    return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
  }
  return extractErrorMessage(error);
}
