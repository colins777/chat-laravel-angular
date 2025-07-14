import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button-loader',
  template: `
    <button
      [ngClass]="class"
      [disabled]="disabled || isLoading"
      [attr.type]="type"
    >
      <span>{{ text }}</span>
      <span *ngIf="isLoading" class="ml-2 flex items-center">
        <span class="loader"></span>
      </span>
    </button>
  `,
  imports: [CommonModule],
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .loader {
      border: 2px solid #f3f3f3;
      border-top: 2px solid #fff;
      border-radius: 50%;
      width: 1em;
      height: 1em;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
  `]
})
export class ButtonLoaderComponent {
  @Input() text: string = 'Button';
  @Input() class: string = '';
  @Input() isLoading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() type: string = 'button';
}
