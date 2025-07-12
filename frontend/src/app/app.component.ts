import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpTokenService } from './services/http-token.service';
//import { EchoService } from './services/echo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{

  title = 'frontend';

  constructor(
    private tSvc:HttpTokenService,
   // private echoService: EchoService
  ) {}

  ngOnInit(): void {
    this.tSvc.getCrsfToken()
      .subscribe(response => console.log(response))
  }
}
