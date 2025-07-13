import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-message-form',
  imports: [
    FormsModule
  ],
  templateUrl: './message-form.component.html',
  styleUrl: './message-form.component.css'
})
export class MessageFormComponent {
  newMessage: string = '';
  selectedImage: File | null = null;

  @Input() partnerId!: number;
  @Output() messageSend = new EventEmitter<{ message: string, image: File | null,partnerId: number }>();

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
    } else {
      this.selectedImage = null;
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() && !this.selectedImage) return;
    this.messageSend.emit({ 
      message: this.newMessage, 
      image: this.selectedImage,
      partnerId: this.partnerId
     });
    this.newMessage = '';
    this.selectedImage = null;
  }
}
