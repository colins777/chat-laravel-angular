import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, height: '0px', overflow: 'hidden' })),
      state('*', style({ opacity: 1, height: '*', overflow: 'hidden' })),
      transition(':enter', [
        animate('300ms ease-in')
      ]),
      transition(':leave', [
        animate('300ms ease-out')
      ])
    ])
  ],
  template: `
    <input
      type="text"
      [ngModel]="searchTerm"
      (ngModelChange)="onInputChange($event)"
      [placeholder]="placeholder"
      [ngClass]="inputClass"
      [ngStyle]="inputStyle"
      @fadeInOut
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
