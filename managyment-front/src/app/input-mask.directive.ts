import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { maskCpf, maskPhone } from './client.format';

// Applies a display mask to a text input bound to a form control, as the user types.
// The control keeps the masked value, so validation sees exactly what is on screen.
@Directive({
  selector: 'input[appMask]',
  standalone: true
})
export class InputMaskDirective {
  @Input('appMask') mask: 'cpf' | 'phone' = 'cpf';

  private ngControl = inject(NgControl, { self: true });
  private element = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('input')
  onInput(): void {
    // Read the element, not the control: it always holds what the user just typed,
    // regardless of the order in which Angular's value accessor and this listener run.
    const typed = this.element.nativeElement.value;
    const masked = this.mask === 'cpf' ? maskCpf(typed) : maskPhone(typed);
    if (masked !== typed) {
      this.ngControl.control?.setValue(masked);
    }
  }
}
