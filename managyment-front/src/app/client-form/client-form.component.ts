import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Client, ClientService, extractErrorMessage } from '../client.service';
import { formatCpf, formatPhone } from '../client.format';
import { InputMaskDirective } from '../input-mask.directive';

type FormField = 'name' | 'cpf' | 'age' | 'email' | 'phoneNumber' | 'billingDay';

// Accepts area code + number with 10 or 11 digits, with or without a mask.
function phoneDigits(control: AbstractControl): ValidationErrors | null {
  const digits = String(control.value ?? '').replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  return digits.length === 10 || digits.length === 11 ? null : { phone: true };
}

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputMaskDirective],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss'
})
export class ClientFormComponent implements OnInit {
  // No client: create mode. With a client: edit mode (the CPF cannot be changed).
  @Input() client: Client | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  readonly billingDays = Array.from({ length: 31 }, (_, index) => index + 1);

  saving = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)]],
    age: [0, [Validators.required, Validators.min(0), Validators.max(150)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, phoneDigits]],
    billingDay: [10, [Validators.required, Validators.min(1), Validators.max(31)]]
  });

  ngOnInit(): void {
    if (this.client) {
      this.form.patchValue({
        ...this.client,
        cpf: formatCpf(this.client.cpf),
        phoneNumber: formatPhone(this.client.phoneNumber)
      });
      this.form.controls.cpf.disable();
    }
  }

  get isEdit(): boolean {
    return this.client !== null;
  }

  // Days 29 to 31 do not exist in every month, so the due date falls on the last day.
  get showMonthEndHint(): boolean {
    return this.form.controls.billingDay.value > 28;
  }

  isInvalid(field: FormField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  fieldError(field: FormField): string {
    const errors = this.form.controls[field].errors ?? {};
    if (errors['required']) return 'Campo obrigatório';
    if (errors['email']) return 'Email inválido';
    if (errors['pattern']) return 'CPF deve ter 11 dígitos';
    if (errors['phone']) return 'Informe DDD + número (10 ou 11 dígitos)';
    if (errors['maxlength']) return 'Texto muito longo';
    if (errors['min'] || errors['max']) {
      return field === 'billingDay' ? 'Escolha um dia entre 1 e 31' : 'Idade fora do intervalo (0 a 150)';
    }
    return 'Valor inválido';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const { cpf, ...data } = this.form.getRawValue();

    const request = this.client
      ? this.clientService.updateClient(this.client.cpf, data)
      : this.clientService.createClient({ cpf, ...data });

    request.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = extractErrorMessage(error);
      }
    });
  }
}
