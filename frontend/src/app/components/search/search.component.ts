import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <input
      type="text"
      [ngModel]="searchTerm"
      (ngModelChange)="onInputChange($event)"
      [placeholder]="placeholder"
      [ngClass]="inputClass"
      [ngStyle]="inputStyle"
      class="w-full px-3 py-1 rounded bg-[#222] text-white focus:outline-none"
    />
  `
})
export class searchComponent {
  @Input() placeholder: string = 'Chats durchsuchen...';
  @Input() inputClass: string = '';
  @Input() inputStyle: { [key: string]: string } = {};
  @Input() searchTerm: string = '';

  @Output() searchTermChange = new EventEmitter<string>();

  onInputChange(term: string) {
      this.searchTerm = term;
      this.searchTermChange.emit(term);
    }
}
