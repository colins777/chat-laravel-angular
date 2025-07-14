import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-message-form',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    
  ],
  templateUrl: './message-form.component.html',
  styleUrl: './message-form.component.css'
})
export class MessageFormComponent {
  newMessage: string = '';
  selectedImage: File | null = null;
  fileError: string | null = null;

@Input() receiverId!: number;
@Input() errorMessage!: string;
@Output() messageSend = new EventEmitter<{ message: string, attachments: File | null,receiverId: number }>();


onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    // Example: Only allow images under 2MB
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'File size must be under 2MB.';
      this.selectedImage = null;
    } else {
      this.selectedImage = file;
      this.errorMessage = '';
    }
  } else {
    this.selectedImage = null;
    this.errorMessage = '';
  }
}

  sendMessage() {
    if (!this.newMessage.trim() && !this.selectedImage) return;
    this.messageSend.emit({ 
      message: this.newMessage, 
      attachments: this.selectedImage,
      receiverId: this.receiverId
     });

    this.newMessage = '';
    this.selectedImage = null;
  }
}
