import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Conversations } from '../../interfaces/Conversation';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoaderWrapperComponent } from '../../components/UI/loader-wrapper/loader-wrapper.component';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoaderWrapperComponent
  ],
  templateUrl: './left-sidebar.component.html'
})
export class LeftSidebarComponent {
  @Input() conversations: Conversations[] = [];
  @Input() selectedConversation: Conversations | null = null;
  @Input() showSearch: boolean = false;
  @Input() searchTerm: string = '';
  @Input() filter: string = 'unread';

  @Output() conversationClick = new EventEmitter<Conversations>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() showSearchChange = new EventEmitter<boolean>();
  @Output() filterChange = new EventEmitter<string>();

  loading: boolean = false;
  error: string = '';

  onConversationClick(conversation: Conversations) {
    this.conversationClick.emit(conversation);
  }

  onSearchToggle() {
    this.showSearchChange.emit(!this.showSearch);
  }

  onSearchTermChange(term: string) {
    this.searchTermChange.emit(term);
  }

  onFilterChange(filter: string) {
    this.filterChange.emit(filter);
  }
}
