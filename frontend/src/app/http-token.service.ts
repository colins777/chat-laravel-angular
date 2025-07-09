import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const baseUrl = 'http://localhost:8000';

@Injectable({
  providedIn: 'root'
})
export class HttpTokenService {

  constructor(private http: HttpClient) { }

  getCrsfToken() {
    return this.http.get<any>(`${baseUrl}/sanctum/csrf-cookie`, 
      {withCredentials: true, observe: 'response'}
    );
  }


  login(email: string, password: string) {
    return this.http.post<any>(`${baseUrl}/login`, {email, password},
      {withCredentials: true})
  }

  logout() {
     return this.http.post<any>(`${baseUrl}/logout`, '', {withCredentials: true})
  }
  getUser() {
    return this.http.get<any>(`${baseUrl}/api/user`, {withCredentials: true})
  }
}
