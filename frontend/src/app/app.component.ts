import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpTokenService } from './services/http-token.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{

  title = 'Chat';

  constructor(
    private tSvc:HttpTokenService
  ) {}

  ngOnInit(): void {
    this.tSvc.getCrsfToken()
      .subscribe(response => console.log(response))
  }
}
