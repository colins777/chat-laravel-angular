import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
import { LoaderWrapperComponent } from '../components/UI/loader-wrapper/loader-wrapper.component';
import { getDateLabel } from '../helpers/message-date-label.helper';



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
    MessageFormComponent,
    LeftSidebarComponent,
    LoaderWrapperComponent
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
  filter = 'unread';

  selectedConversation:Conversations | null = null;
  showMessages: boolean = false;
  newMessage = '';
  receiverId: number = 0;
  groupedMessages: { [label: string]: Message[] } = {};

  //
  loading: boolean = false;
  error: string = '';
    constructor(
      private svc: HttpTokenService,
      private router: Router,
      private route: ActivatedRoute
    ) {}


  //addEcho service for listening to events
  listenToEchoEvents(): void {}

  ngOnInit(): void {
    this.svc.getUser()
      .subscribe({
        next: (response: any) => {
          this.user = response;

          this.listenToEchoEvents();

          console.log('User info response: ', response);
          this.loadConversations();

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

      this.route.paramMap.subscribe(params => {
          const receiverId = Number(params.get('userId'));
          if (receiverId) {
          this.receiverId = receiverId;
          //this.loadMessagesByUser(receiverId);
        }
        });
  }

  ngOnDestroy(): void {}

  groupMessagesByDate(messages: Message[]): { [label: string]: Message[] } {
    return messages.reduce((groups, msg) => {
      const label = getDateLabel(msg.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
      return groups;
    }, {} as { [label: string]: Message[] });
  }

  loadConversations(): void {
  this.loading = true;
  
  this.svc.getConversations()
    .subscribe({
      next: (response: any) => {
        this.conversations = response.data || response;

        if (this.selectedConversation) {
          this.receiverId = this.user.id == this.selectedConversation.user_id_1  ? this.selectedConversation.user_id_2 : this.conversations[0].user_id_1
        }
        
        this.loading = false;
        console.log('selectedConversation:', this.selectedConversation);
      },
      error: (error: any) => {
        this.errMessage = 'Failed to load conversations';
        this.loading = false;
        console.error('Error fetching conversations:', error);
      }
    });
  }

  onConversationClick(conversation: Conversations): void {

    this.receiverId = this.user.id == conversation.user_id_1  ? conversation.user_id_2 : conversation.user_id_1
    this.selectedConversation =  conversation
    console.log('selectedConversation', this.selectedConversation);
    this.router.navigate(['/chat/user', this.receiverId]);
  }

  loadMessagesByUser(userId: number): void {
      this.loading = true;
      this.svc.getMessagesByUser(userId)

      .subscribe({
        next: (response: any) => {
          
          this.showMessages = true;
          this.messages = response.data.reverse() || response;
          this.groupedMessages = this.groupMessagesByDate(this.messages);

          console.log('Messages loaded res:', response);
          console.log('Messages loaded:', this.messages);
          this.loading = false;
        },
        error: (error: any) => {
          this.loading = false;
          this.errMessage = 'Failed to load conversations';
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
      this.loadConversations();
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