import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, input, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonLoaderComponent } from '../button-loader.component';

@Component({
  selector: 'app-dots-menu',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ButtonLoaderComponent
  ],
  templateUrl: './dots-menu.component.html',
  styleUrl: './dots-menu.component.css'
})
export class DotsMenuComponent {
  @Input() messageId!: number;
  @Input() openMessageMenus!: Set<number>;
  @Input() isDeletingMessage!: boolean;
  
  @Output() menuToggledEmitter = new EventEmitter<{messageId: number, isOpen: boolean}>();
  @Output() allMenusClosedEmitter = new EventEmitter<void>();
  @Output() deleteMessageEmitter = new EventEmitter<number>();

  isOpen(messageId: number): boolean {
    return this.openMessageMenus.has(messageId);
  }

  toggleMessageMenu(messageId: number): void {
    const isCurrentlyOpen = this.openMessageMenus.has(messageId);
    this.menuToggledEmitter.emit({
      messageId: messageId,
      isOpen: !isCurrentlyOpen
    });
  }

  closeAllMessageMenus(): void {
    this.allMenusClosedEmitter.emit();
  }

  //TODO fix this using global click service
  // onDocumentClick(event: Event): void {
  //   const target = event.target as HTMLElement;

  //   console.log('Document clicked dots menu:', target);

  //   if (!target.closest('.additional-dots-menu') && !target.closest('.additional-dots-dropdown')) {
  //     this.closeAllMessageMenus();
  //   }
  // }

  deleteMessageHandler(messageId: number): void {
    if (this.isDeletingMessage) {
      return; // Prevent multiple clicks while deleting
    }
    this.deleteMessageEmitter.emit(messageId);
  }
}
