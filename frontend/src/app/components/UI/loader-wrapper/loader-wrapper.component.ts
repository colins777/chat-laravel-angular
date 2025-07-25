import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-loader-wrapper',
  templateUrl: './loader-wrapper.component.html',
  styleUrls: ['./loader-wrapper.component.css'],
    imports: [
    CommonModule,
    FormsModule,
  ],
})
export class LoaderWrapperComponent {
  @Input() loading:boolean = false;
  @Input() error: string | null = null;
}
