import { Component, Input, Output, EventEmitter, input } from '@angular/core';
import { Conversation } from '../../interfaces/Conversation';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoaderWrapperComponent } from '../../components/UI/loader-wrapper/loader-wrapper.component';
import { searchComponent } from '../../components/search/search.component';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoaderWrapperComponent,
    searchComponent
  ],
  templateUrl: './left-sidebar.component.html'
})
export class LeftSidebarComponent {
  @Input() conversations: Conversation[] = [];
  @Input() selectedConversation: Conversation | null = null;
  @Input() showSearch: boolean = false;
  @Input() searchTerm: string = '';
  @Input() filter: string = 'unread';
 
  @Output() conversationClick = new EventEmitter<Conversation>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() showSearchChange = new EventEmitter<boolean>();
  @Output() filterChange = new EventEmitter<string>();

  loading: boolean = false;
  error: string = '';
  filteredConversations: Conversation[] = [];


  onConversationClick(conversation: Conversation) {
    this.conversationClick.emit(conversation);
  }

  onSearchToggle() {
    this.showSearchChange.emit(!this.showSearch);
  }

  onSearchInputChange(term: string) {
    this.searchTermChange.emit(term);
  }

}
