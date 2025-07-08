import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpTokenService {

  constructor(private http: HttpClient) { }

  getCrsfToken() {
    return this.http.get<any>('http://localhost:8000/sanctum/csrf-cookie', 
      {withCredentials: true, observe: 'response'}
    );
  }
}
