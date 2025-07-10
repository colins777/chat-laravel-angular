import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { HttpTokenService } from '../services/http-token.service';
import { Conversations } from '../interfaces/Conversations';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,        
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    FormsModule, 
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit, OnDestroy {
  errMessage!: string | null;
  user!: any | null;
  onlineUsers: { [key: number]: any } = {};
  localConversations: any[] = [];
  sortedConversations: any[] = [];

  selectChat: Conversations | null = null;
  image: string | null = null;
  showSearch: boolean = false;
  searchTerm: string = '';
  isLoading: boolean = false;
  filter = 'unread';
  conversations: Conversations[] = [];

  constructor(
    private svc: HttpTokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.svc.getUser()
      .subscribe({
        next: (response: any) => {
          this.user = response;

          console.log('response', response);
          this.loadConversations();

        },
        error: (error: { error: { message: string } }) => {
          this.errMessage = error.error.message || 'An error occurred';
          console.error('Error fetching user:', error);
          this.router.navigate(['/chat']);
        }
      });
  }

  ngOnDestroy(): void {}

  loadConversations(): void {
  this.isLoading = true;
  
  this.svc.getConversations()
    .subscribe({
      next: (response: any) => {
        this.conversations = response.data || response; // Adjust based on your API response structure
        
        // Set first conversation as selected if available
        if (this.conversations.length > 0) {
          this.selectedConversation = this.conversations[0];
        }
        
        this.isLoading = false;
        console.log('Conversations loaded:', this.conversations);
      },
      error: (error: any) => {
        this.errMessage = 'Failed to load conversations';
        this.isLoading = false;
        console.error('Error fetching conversations:', error);
      }
    });
  }

  selectedConversation = this.conversations[0];
  messages = [
    { text: 'Hello!', isMine: false, image: 'https://i.pravatar.cc/100?img=1', },
    { text: 'Hi! How are you?', isMine: true, image: 'https://i.pravatar.cc/100?img=1', },
  ];
  newMessage = '';

  selectConversation(convo: any) {
    this.selectedConversation = convo;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({ text: this.newMessage, isMine: true, image: 'https://i.pravatar.cc/100?img=1' });
      this.newMessage = '';
    }
  }

  attachImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
       // this.messages.push({ image: reader.result, isMine: true });
      };
      reader.readAsDataURL(file);
    }
  }

}

