import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { Conversation } from '../interfaces/Conversation';
import { Message } from '../interfaces/Message';
import { MessageFormComponent } from '../components/message-form/message-form.component';
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
import { LoaderWrapperComponent } from '../components/UI/loader-wrapper/loader-wrapper.component';
import { getDateLabel } from '../helpers/message-date-label.helper';
import { EchoService } from '../services/echo.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../interfaces/User';


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

  localConversations: Conversation[] = [];
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;

  messages: Message[] = [];
  image: string | null = null;
  showSearch: boolean = false;
  searchTerm: string = '';
  filter = 'unread';
  showMessages: boolean = false;
  receiverId: number = 0;
  groupedMessages: { [label: string]: Message[] } = {};

  loading: boolean = false;
  loadingConversations: boolean = false;
  error: string = '';
  sendMessageError: string = '';
  messageIsSending: boolean = false;

  currentPage: number = 1;
  hasMoreMessages: boolean = true

  onlineUsers: User[] = [];

    constructor(
      private svc: HttpTokenService,
      private router: Router,
      private route: ActivatedRoute,
      private echo: EchoService,
      private http: HttpClient,
    ) {}

  //addEcho service for listening to events
  listenToEchoEvents(): void {
   // if (!this.user) return;
    const echo = this.echo.getInstance();

    console.log('listen!')

    echo.join('online')
      .here((usersOnline: User[]) => {
        console.log('WS online', usersOnline)

        this.onlineUsers = usersOnline;

        this.conversations.forEach((conversation) => {
          if (usersOnline.length > 0) {
          usersOnline.map((user) => {
            if (conversation.id === user.id && this.user.id !== conversation.id) {
              conversation.online = true;
            }
          })
        }});
        console.log('conversation here', this.conversations)
      })
      .joining((usersOnline:any) => {
          console.log('WS joining', usersOnline)
          
          this.conversations.forEach((conversation) => {
            const users = Array.isArray(usersOnline) ? usersOnline : [usersOnline];
            users.map((user: any) => {
              if (conversation.id === user.id && this.user.id !== conversation.id) {
                conversation.online = true;
              }
            });
        });
      })
      .leaving((usersOnline:any) => {
          console.log('WS leaving', usersOnline)

          this.conversations.forEach((conversation) => {
            const users = Array.isArray(usersOnline) ? usersOnline : [usersOnline];
            users.map((user: any) => {
              if (conversation.id === user.id && this.user.id !== conversation.id) {
                conversation.online = false;
              }
            });
        });


          console.log('conversations leaving', this.conversations)
      })
      .error((e:any) => {
        console.warn('WS error', e)
      });
  }

  ngOnInit(): void {
    this.svc.getUser()
      .subscribe({
        next: (response: any) => {
          this.user = response;
          this.loadConversations();
        },
        error: (error: { error: { message: string } }) => {
          this.errMessage = error.error.message || 'An error occurred';
          console.error('Error fetching user:', error);
          this.router.navigate(['/chat']);
        }
      });
  }

  ngOnDestroy(): void {
    //  this.echo.disconnect();
      const echo = this.echo.getInstance();
      console.log('ngOnDestroy', echo)
      echo.disconnect();
  }

  groupMessagesByDate(messages: Message[]): { [label: string]: Message[] } {
    const groups: { [label: string]: Message[] } = {};
    const seenIds = new Set<number>();

    for (const msg of messages) {
      if (seenIds.has(msg.id)) continue;
      seenIds.add(msg.id);

      const label = getDateLabel(msg.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    }

    return groups;
  }
  loadConversations(): void {
  this.loadingConversations = true;
  
  this.svc.getConversations()
    .subscribe({
      next: (response: any) => {
        this.conversations = response.data || response;
        this.localConversations = response.data || response;
        this.loadingConversations = false;
        this.listenToEchoEvents();
      },
      error: (error: any) => {
        this.errMessage = 'Failed to load conversations';
        this.loadingConversations = false;
        console.error('Error fetching conversations:', error);
      }
    });
  }

  onConversationClick(conversation: Conversation): void {
    this.messages = [];
    this.currentPage = 1;
    this.receiverId = conversation.id;
    this.selectedConversation =  conversation;
    console.log('selectedConversation', this.selectedConversation);
    this.loadMessagesByUser(this.receiverId, this.currentPage)
  }

loadMessagesByUser(userId: number, page: number = 1): void {

  this.loading = true;
  this.svc.getMessagesByUser(userId, page).subscribe({
    next: (response) => {
      if (page === 1) {
        this.messages = response.data.reverse();
        this.showMessages = true;
      } else {
        this.messages = [...response.data.reverse(), ...this.messages];
        this.showMessages = true;
      }
  
      this.currentPage = response.meta.current_page[0];
      this.groupedMessages = this.groupMessagesByDate(this.messages);
      this.hasMoreMessages = !!response.meta.next_page_url;
      this.loading = false;
    },
    error: (error: any) => {
      console.warn('error', error.message)
      this.loading = false;
    }
  });
}

  onScroll(event: any): void {
    const scrollTop = event.target.scrollTop;
    if (scrollTop < 100 && this.hasMoreMessages && !this.loading) {
      this.loadMessagesByUser(this.receiverId, this.currentPage + 1);
    }
  }

  handleSendMessage(event: { message: string, attachments: File | null, receiverId: number }) :void {
      const formData = new FormData();
      formData.append('message', event.message);
      formData.append('receiver_id', event.receiverId.toString());
      if (event.attachments) {
        formData.append('attachments[]', event.attachments);
      }

      this.storeMessage(event.receiverId, formData);
      this.loadConversations();
  }

  storeMessage(receiverId: number, formData: FormData): void {

    this.messageIsSending = true;

    this.svc.storeMessage(receiverId, formData)
    .subscribe({
      next: (response: any) => {
        this.messageIsSending = false;
        console.log('Conversations loaded:', this.conversations);
        this.loadMessagesByUser(this.receiverId, 1);
      },
      error: (error) => {
        this.sendMessageError = error.error.message;
         this.messageIsSending = false;
        console.error('Error fetching conversations:', error);
      }
    });
  }

  filterConversations(term: string): void {
    this.searchTerm = term;
    if (!term) {
      this.conversations = [...this.localConversations];
      return;
    }

    const searchTerm = term.toLowerCase().trim();
    this.conversations = this.localConversations.filter(conversation =>
      conversation.name &&
      conversation.name.toLowerCase().includes(searchTerm)
    );
  }

}