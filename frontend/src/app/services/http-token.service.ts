import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

//@TODO add this import to use the API endpoints
const baseUrl = 'http://localhost:8000';

@Injectable({
  providedIn: 'root'
})
export class HttpTokenService {

  constructor(private http: HttpClient) { }

  getCrsfToken() {
    return this.http.get<any>(API_ENDPOINTS.GET_CRSF_TOKEN, 
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

  getConversations(): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.CONVERSATIONS.GET_ALL_CONVERSATIONS, {withCredentials: true});
  }
  
  getMessagesByUser(userId: number, page: number = 1): Observable<any> {
    return this.http.get<any>(`${API_ENDPOINTS.MESSAGES.GET_MESSAGES_BY_USER}/${userId}?page=${page}`, {withCredentials: true});
  }

  storeMessage(receiverId: number, FormData: FormData): Observable<any> {
    return this.http.post<any>(`${API_ENDPOINTS.MESSAGES.STORE_MESSAGE}`, 
      FormData,
      {withCredentials: true});
  }

}
