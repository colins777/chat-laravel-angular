import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Add this import
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { HttpTokenService } from '../services/http-token.service';
import { Conversations } from '../interfaces/Conversation';
import { Message } from '../interfaces/Message';

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
    RouterModule, 
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit, OnDestroy {
  errMessage!: string | null;
  user!: any | null;
  localConversations: any[] = [];
  sortedConversations: any[] = [];

  messages: Message [] = [];
  conversations: Conversations[] = [];
  image: string | null = null;
  showSearch: boolean = false;
  searchTerm: string = '';
  isLoading: boolean = false;
  filter = 'unread';

  selectedConversation = this.conversations[0] ?? null;
  newMessage = '';

  constructor(
    private svc: HttpTokenService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.svc.getUser()
      .subscribe({
        next: (response: any) => {
          this.user = response;

          console.log('response', response);
          this.loadConversations();
          this.loadMessagesByUser(this.user.id);
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
        this.conversations = response.data || response;
        
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

  onConversationClick(conversation: Conversations): void {

    let partnerId = this.user.id == conversation.user_id_1  ? conversation.user_id_2 : conversation.user_id_1
    
    this.loadMessagesByUser(partnerId)
    this.selectedConversation =  conversation

    this.router.navigate(['/chat/user', partnerId]);
  }


  

  loadMessagesByUser(userId: number): void {
    //this.isLoading = true; 

    this.svc.getMessagesByUser(userId)
    .subscribe({
      next: (response: any) => {
        this.messages = response.data || response;

        console.log('Messages loaded:', this.messages);
      },
      error: (error: any) => {
        this.errMessage = 'Failed to load conversations';
        this.isLoading = false;
        console.error('Error fetching conversations:', error);
      }
    });
  }


  sendMessage() {}
}