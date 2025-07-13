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
import { MessageFormComponent } from '../components/message-form/message-form.component';


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
    MessageFormComponent
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
  //@TODO fix default value
  receiverId: number = 0;

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

          console.log('User info response: ', response);
          this.loadConversations();
        //  this.loadMessagesByUser(this.user.id);

          this.route.paramMap.subscribe(params => {
          const userId = Number(params.get('userId'));
          if (userId) {
            this.loadMessagesByUser(userId);
        }
      });
        
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
        if (this.conversations.length > 0 && this.selectedConversation == null) {
          this.selectedConversation = this.conversations[0];

          this.receiverId = this.user.id == this.selectedConversation.user_id_1  ? this.selectedConversation.user_id_2 : this.conversations[0].user_id_1
        }

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

    this.receiverId = this.user.id == conversation.user_id_1  ? conversation.user_id_2 : conversation.user_id_1
   // this.loadMessagesByUser(this.receiverId)
    this.selectedConversation =  conversation
    this.router.navigate(['/chat/user', this.receiverId]);
  }

    loadMessagesByUser(userId: number): void {
    this.svc.getMessagesByUser(userId)
    .subscribe({
      next: (response: any) => {
        this.messages = response.data.reverse() || response;
        console.log('Messages loaded:', this.messages);
      },
      error: (error: any) => {
        this.errMessage = 'Failed to load conversations';
        this.isLoading = false;
        console.error('Error fetching conversations:', error);
      }
    });
  }

  handleSendMessage(event: { message: string, attachments: File | null, receiverId: number }) {
      const formData = new FormData();
      formData.append('message', event.message);
      formData.append('receiver_id', event.receiverId.toString());
      if (event.attachments) {
        formData.append('attachments[]', event.attachments);
      }

      this.storeMessage(event.receiverId, formData);
      this.loadMessagesByUser(this.receiverId);
  }


  storeMessage(receiverId: number, formData: FormData): void {


    this.svc.storeMessage(receiverId, formData)

    .subscribe({
      next: (response: any) => {


        console.log('Conversations loaded:', this.conversations);
      },
      error: (error: any) => {
        
        console.error('Error fetching conversations:', error);
      }
    });
  }
}