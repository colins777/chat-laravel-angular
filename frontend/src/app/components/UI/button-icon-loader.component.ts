import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button-icon-loader',
  template: `
    <button type="submit" 
      [ngClass]="class" 
      [attr.type]="type"
      [disabled]="isLoading"
    >
      <span *ngIf="text">{{ text }}</span>

      <ng-content *ngIf="!isLoading" select="[slot=icon]"></ng-content>

      <span *ngIf="isLoading" class="flex items-center">
        <span class="loader"></span>
      </span>
  </button>
  `,
  imports: [CommonModule],
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
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
export class ButtonIconLoaderComponent {
  @Input() text: string = '';
  @Input() class: string = 'ml-2 px-2 rounded bg-[#b30000] text-white w-[60px] h-[60px]';
  @Input() isLoading: boolean = false;
  @Input() type: string = 'button';
}
