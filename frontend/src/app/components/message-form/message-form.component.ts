import { Component, EventEmitter, Input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonIconLoaderComponent} from '../UI/button-icon-loader.component';
import { HttpTokenService } from '../../services/http-token.service';
import { MessageAttachmentHelperService } from '../../services/message-attachment-helper.service';

interface FilePreview {
  file: File;
  preview?: string;
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'app-message-form',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ButtonIconLoaderComponent,
  ],
  templateUrl: './message-form.component.html',
  styleUrl: './message-form.component.css'
})
export class MessageFormComponent {
  constructor(private svc: HttpTokenService, 
    public messageAttachmentHelper: MessageAttachmentHelperService
  ) {}

  newMessage: string = '';
  selectedFiles: FilePreview[] = [];
  errorMessage: string | null = null;
  messageIsSending: boolean = false;
  disabledMessageInput: boolean = false;
  maxFileSize = 10240000; // 10MB in bytes
  maxFiles = 10;

  @Input() receiverId!: number;
  @Input() loadConversations!: () => void;
  @Input() loadMessagesByUser!: (userId: number, page: number) => void;
  @Input() scrollToBottom!: () => void;

  sendMessage() {
    if (!this.newMessage.trim() && this.selectedFiles.length === 0) {
      this.errorMessage = 'Message or file is required';
      return;
    }

    if (!this.receiverId) {
      this.errorMessage = 'Select conversation';
      return;
    }

    this.handleSendMessage({ 
      message: this.newMessage, 
      attachments: this.selectedFiles.map(f => f.file),
      receiverId: this.receiverId
    });
  }
  

  handleSendMessage({ message, attachments, receiverId }: { message: string, attachments: File[], receiverId: number }): void {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('receiver_id', receiverId.toString());
    if (attachments) {
      attachments.forEach((file: File) => {
        formData.append('attachments[]', file);
      });
    }
    this.storeMessage(receiverId, formData);
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
        this.selectedFiles = [];
        this.errorMessage = null;
      },
      error: (error) => {
        this.errorMessage = error.error.message;
        this.messageIsSending = false;
        console.error('Error fetching conversations:', error);
      }
    });
  }

  onFileSelected(event: Event) {
    const filesInput = event.target as HTMLInputElement;

    console.log('selectedFiles', this.selectedFiles);
    
    if (filesInput.files && filesInput.files.length > 0) {
      const newFiles = Array.from(filesInput.files);
      
      // Check if adding these files would exceed the limit
      if (this.selectedFiles.length + newFiles.length > this.maxFiles) {
        this.errorMessage = `Maximum ${this.maxFiles} files allowed`;
        return;
      }

      newFiles.forEach(file => {
        if (file.size > this.maxFileSize) {
          this.errorMessage = `File ${file.name} is too large. Maximum size is ${this.maxFileSize / 1024000} Mb`;

          setTimeout(() => {
            this.errorMessage = null;
          }, 3000);
          return;
        }

        const filePreview: FilePreview = {
          file: file,
          name: file.name,
          size: file.size,
          type: file.type
        };

        // Generate preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            filePreview.preview = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        }

        this.selectedFiles.push(filePreview);

        console.log('this.selectedFiles', this.selectedFiles);
      });
      filesInput.value = '';
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.errorMessage = null;
  }

}
