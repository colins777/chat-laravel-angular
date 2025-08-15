import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
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
import { MessageAttachmentHelperService } from '../services/message-attachment-helper.service';
import { DotsMenuComponent } from '../components/UI/dots-menu/dots-menu.component';
import { CallModalComponent } from '../components/call-modal/call-modal.component';
import { CallService, CallData } from '../services/call.service';
import  { ButtonIconLoaderComponent } from '../components/UI/button-icon-loader.component';

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
    LoaderWrapperComponent,
    DotsMenuComponent,
    CallModalComponent,
    ButtonIconLoaderComponent
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
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
  hasMoreMessages: boolean = true;
  shouldScrollToBottom: boolean = false;

  onlineUsers: User[] = [];

  // Track which message menus are open
  openMessageMenus: Set<number> = new Set();
  isDeletingMessage: boolean = false;

  // Call-related properties
  showCallModal = false;
  currentCall: CallData | null = null;
  incomingCall: CallData | null = null;
  isIncomingCall = false;
  isCalling = false;

  constructor(
      private svc: HttpTokenService,
      private router: Router,
      private route: ActivatedRoute,
      private echo: EchoService,
      private http: HttpClient,
      public messageAttachmentHelper: MessageAttachmentHelperService,
      private callService: CallService
    ) {}

  //addEcho service for listening to events
  listenToEchoEvents(): void {
   // if (!this.user) return;
    const echo = this.echo.getInstance();

    this.conversations.forEach((conversation, i) => {
      const otherUserId = conversation.id;
      const sortedIds = [this.user.id, otherUserId].sort().join('-');
      const channelName = `message.user.${sortedIds}`;

      echo.private(channelName)
        .listen('SocketMessage', (data: any) => {
          const newMessage: Message = data.message;

          // Show new message in tje messages list if it belongs to the current selected conversation
          if (this.selectedConversation && this.selectedConversation.id === newMessage.sender_id && !newMessage.deleted) {
           // if (!newMessage.deleted) {

              console.log('newMessage:', newMessage);
              console.log('messages:', this.messages);

              this.messages.push(newMessage);
              this.groupedMessages = this.groupMessagesByDate(this.messages);
            
              this.scrollToBottom();
              this.shouldScrollToBottom = false;

          } 

          if (newMessage.deleted) {
              //this.updateConversationsWithLastMessage(newMessage);
                console.log('Message deleted:', newMessage);

              this.messages = this.messages.filter(message => message.id !== newMessage.id);
              this.groupedMessages = this.groupMessagesByDate(this.messages);
          } else {
            // Update conversation with new message
           this.updateConversationsWithLastMessage(newMessage);
          }

          
        });
    });

    // Listen for call events
    this.listenToCallEvents();

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

      console.log('ngOnDestroy', echo)
  }

  scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;

      console.log('scrollToBottom height', element.scrollHeight)

      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
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

        console.log('loadConversations', this.conversations)
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
    
    //this.scrollToBottom();
    this.shouldScrollToBottom = true;

    //set all unread messages to read
    if ((this.selectedConversation?.unread_messages ?? 0) > 0) {
      this.markAsRead(conversation.id);

      this.selectedConversation.unread_messages = 0;
    }
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

      //scroll to bottom
      console.log('shouldScrollToBottom', this.shouldScrollToBottom)
      if (this.shouldScrollToBottom) {
          this.scrollToBottom();
          this.shouldScrollToBottom = false;
      }

      console.log('response messages:', response)
      console.log('loadMessages:', this.messages)
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

  updateConversationsWithLastMessage(message: Message): void {
   this.conversations.forEach((conversation) => {
      if (conversation.id === message.sender_id) {
        conversation.last_message = message.message;
        conversation.last_message_date = new Date(message.created_at);
        conversation.unread_messages = (conversation.unread_messages ?? 0) + 1;
      }
    });
  }

  markAsRead(senderId: number): void {
    this.svc.markAsRead(senderId).subscribe({
      next: (response: any) => {
        console.log('markAsRead', response)
      },
      error: (error: any) => {
        console.error('Error marking as read:', error);
      }
    });
  }

   onMenuToggled(data: {messageId: number, isOpen: boolean}): void {
    if (data.isOpen) {
      this.openMessageMenus.add(data.messageId);
    } else {
      this.openMessageMenus.delete(data.messageId);
    }
    console.log('openMessageMenus', this.openMessageMenus);
  }

  onAllMenusClosed(): void {
    this.openMessageMenus.clear();
  }

  //TODO fix bug with last message not being deleted
  onDeleteMessage(messageId:  number): void {

    this.isDeletingMessage = true;
   
    this.svc.deleteMessage(messageId).subscribe({
      next: (response: any) => {
        console.log('deleteMessage', response)

       this.messages = this.messages.filter(message => message.id !== messageId);
       this.groupedMessages = this.groupMessagesByDate(this.messages);
       this.openMessageMenus.delete(messageId);

       this.isDeletingMessage = false;
      },
      error: (error: any) => {
        console.error('Error marking as read:', error);
      }
    })
  }

  // Listen for call events via WebSocket
  listenToCallEvents(): void {
    const echo = this.echo.getInstance();

    // Listen for call events on existing message channels
    this.conversations.forEach((conversation) => {
      const otherUserId = conversation.id;
      const sortedIds = [this.user.id, otherUserId].sort().join('-');
      const channelName = `message.user.${sortedIds}`;

      echo.private(channelName)
        .listen('CallInitiated', (data: any) => {
          console.log('Incoming call:', data);
          this.incomingCall = data;
          this.isIncomingCall = true;
          this.showCallModal = true;
        })
        .listen('CallAnswered', (data: any) => {
          console.log('Call answered:', data);
          this.currentCall = data;
          this.isIncomingCall = false;
          this.showCallModal = true;
        })
        .listen('CallEnded', (data: any) => {
          console.log('Call ended:', data);
          this.handleCallEnded(data);
        })
        .listen('WebRTCSignal', (data: any) => {
          console.log('WebRTC signal received:', data);
          this.handleWebRTCSignal(data);
        });
    });
  }

  // Handle WebRTC signals
  handleWebRTCSignal(signal: any) {
    // This will be implemented to handle WebRTC signaling
    console.log('Handling WebRTC signal:', signal);
  }

  // Handle call ended
  handleCallEnded(call: CallData) {
    this.currentCall = null;
    this.incomingCall = null;
    this.isIncomingCall = false;
    this.showCallModal = false;
    this.callService.clearCalls();
  }

  // Call control methods
  initiateCall(type: 'audio' | 'video') {

    console.log('initiateCall');

    if (!this.selectedConversation) return;

    this.isCalling = true;

    this.callService.initiateCall(this.selectedConversation.id, type).subscribe({
      next: (response) => {
        console.log('Call initiated:', response);
        this.currentCall = response.call;
        this.isIncomingCall = false;
        this.showCallModal = true;
        this.isCalling = false;
      },
      error: (error) => {
        console.error('Failed to initiate call:', error);
        this.isCalling = false;
      }
    });
  }

  answerCall(callId: number) {
    this.callService.answerCall(callId).subscribe({
      next: (response) => {
        console.log('Call answered:', response);
        this.currentCall = response.call;
        this.incomingCall = null;
        this.isIncomingCall = false;
        this.showCallModal = true;
      },
      error: (error) => {
        console.error('Failed to answer call:', error);
      }
    });
  }

  declineCall(callId: number) {
    this.callService.declineCall(callId).subscribe({
      next: (response) => {
        console.log('Call declined:', response);
        this.handleCallEnded(response.call);
      },
      error: (error) => {
        console.error('Failed to decline call:', error);
      }
    });
  }

  endCall(callId: number) {
    this.callService.endCall(callId).subscribe({
      next: (response) => {
        console.log('Call ended:', response);
        this.handleCallEnded(response.call);
      },
      error: (error) => {
        console.error('Failed to end call:', error);
      }
    });
  }

  closeCallModal() {
    this.showCallModal = false;
    this.currentCall = null;
    this.incomingCall = null;
    this.isIncomingCall = false;
  }

}

