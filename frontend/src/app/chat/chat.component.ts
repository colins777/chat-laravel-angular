import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpTokenService } from '../services/http-token.service';
import Echo from 'laravel-echo';

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

 // @Input() conversations: any[] = [];
 // @Input() selectedConversation: any;
  onlineUsers: { [key: number]: any } = {};
  localConversations: any[] = [];
  sortedConversations: any[] = [];
  private echoChannel: any;
  private echo: any;

  // If you need a chats property, declare it like this:
  chats: any[] = [];
  selectChat: any = null;
  image: string | null = null;
  showSearch: boolean = false;
  searchTerm: string = '';

  constructor(
    private svc: HttpTokenService,
    private router: Router
  ) {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    this.svc.getUser()
      .subscribe({
        next: (response: any) => {
          this.user = response;

          console.log('response', response);

        },
        error: (error: { error: { message: string } }) => {
          this.errMessage = error.error.message || 'An error occurred';
          console.error('Error fetching user:', error);
          this.router.navigate(['/chat']);
        }
      });


  //  this.localConversations = [...this.conversations];
  //  // this.sortConversations();
  //   // Echo listeners
  //   this.echo = new Echo({
  //     broadcaster: 'pusher',
  //     key: 'your-pusher-key',
  //     cluster: 'your-pusher-cluster',
  //     forceTLS: true
  //     // Add other options as needed
  //   });

  //   this.echoChannel = this.echo.join('online')
  //     .here((users: any[]) => {
  //       const onlineUserObj = Object.fromEntries(
  //         users.map(user => [user.id, user])
  //       );
  //       this.onlineUsers = { ...this.onlineUsers, ...onlineUserObj };
  //     })
  //     .joining((user: any) => {
  //       this.onlineUsers = { ...this.onlineUsers, [user.id]: user };
  //     })
  //     .leaving((user: any) => {
  //       const { [user.id]: _, ...rest } = this.onlineUsers;
  //       this.onlineUsers = rest;
  //     })
  //     .error((error: any) => {
  //       console.error('Echo error:', error);
  //     });

    }

    filter = 'unread';
  // Example initialization (if needed, otherwise remove or set in ngOnInit)
  conversations = [
    {
      id: 1,
      name: 'Alice',
      avatar: 'https://i.pravatar.cc/100?img=1',
      lastMessage: 'Hi there!',
    },
    {
      id: 2,
      name: 'Bob',
      avatar: 'https://i.pravatar.cc/100?img=2',
      lastMessage: 'How are you?',
      image: 'https://i.pravatar.cc/100?img=1',
    },
  ];


  selectedConversation = this.conversations[0];
  messages = [
    { text: 'The first witness was the first minute or two, they began running about in the distance, and she drew herself up closer to Alice\'s side as she could, for the moment she quite forgot how to speak.', isMine: false, image: 'https://i.pravatar.cc/100?img=1', },
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

