import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonIconSendMessageComponent} from '../UI/button-icon-send-message';
import { HttpTokenService } from '../../services/http-token.service';


@Component({
  selector: 'app-message-form',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ButtonIconSendMessageComponent,
  ],
  templateUrl: './message-form.component.html',
  styleUrl: './message-form.component.css'
})
export class MessageFormComponent {
  constructor(private svc: HttpTokenService) {}

  newMessage: string = '';
  selectedFile: File | null = null;
  errorMessage: string | null = null;
  messageIsSending: boolean = false;
  disabledMessageInput: boolean = false;

@Input() receiverId!: number;
@Input() loadConversations!: () => void;
@Input() loadMessagesByUser!: (userId: number, page: number) => void;
@Input() scrollToBottom!: () => void;

handleSendMessage(event: { message: string, attachments: File | null, receiverId: number }) :void {
  const formData = new FormData();
  formData.append('message', event.message);
  formData.append('receiver_id', event.receiverId.toString());
  if (event.attachments) {
    formData.append('attachments[]', event.attachments);
  }
  this.storeMessage(event.receiverId, formData);
}

storeMessage(receiverId: number, formData: FormData): void {

  this.messageIsSending = true;
  this.svc.storeMessage(receiverId, formData)
  .subscribe({
    next: (response: any) => {
      this.messageIsSending = false;
      this.loadMessagesByUser(this.receiverId, 1);
      this.scrollToBottom();
      this.newMessage = '';
      this.selectedFile = null;
      this.errorMessage = null;
    },
    error: (error) => {
      this.errorMessage = error.error.message;
      this.messageIsSending = false;

      console.error('Error fetching conversations:', error);
    }
  });
}

  sendMessage() {

   if (!this.newMessage.trim()) {
    this.errorMessage = 'Message is required';
    return;
   }

   if (!this.receiverId) {
    this.errorMessage = 'Select conversation';
    return;
   }
    
   console.log('newMessage', this.newMessage);

  this.handleSendMessage({ 
    message: this.newMessage, 
    attachments: this.selectedFile,
    receiverId: this.receiverId
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
  
    console.log('selectedFile', input.files)
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Example: Only allow images under 2MB
      if (file.size > 2 * 1024 * 1024) {
        this.selectedFile = null;
      } else {
        this.selectedFile = file;
      }
    } else {
      this.selectedFile = null;
    }
  }


}
