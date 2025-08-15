import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CallData {
  id: number;
  call_session_id: string;
  type: 'audio' | 'video';
  status: string;
  caller: any;
  receiver: any;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CallSignal {
  call_session_id: string;
  to_user_id: number;
  signal_type: 'offer' | 'answer' | 'ice-candidate';
  signal_data: any;
}

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private apiUrl = environment.apiUrl;
  
  // Behavior subjects for reactive state management
  private currentCallSubject = new BehaviorSubject<CallData | null>(null);
  private incomingCallSubject = new BehaviorSubject<CallData | null>(null);
  private callStatusSubject = new BehaviorSubject<string>('idle');

  // Public observables
  public currentCall$ = this.currentCallSubject.asObservable();
  public incomingCall$ = this.incomingCallSubject.asObservable();
  public callStatus$ = this.callStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Initiate a call
   */
  initiateCall(receiverId: number, type: 'audio' | 'video'): Observable<any> {
    return this.http.post(`${this.apiUrl}/calls/initiate`, 
      { receiver_id: receiverId,
        type: type
      },
      {withCredentials: true}
    );
  }

  /**
   * Answer an incoming call
   */
  answerCall(callId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calls/answer`, 
      {call_id: callId},
      {withCredentials: true});
  }

  /**
   * End an active call
   */
  endCall(callId: number): Observable<any> {
      return this.http.post(`${this.apiUrl}/calls/end`, 
        {call_id: callId
        },
        {withCredentials: true}
      );
    }

  /**
   * Decline an incoming call
   */
  declineCall(callId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/calls/decline`, 
      {call_id: callId},
      {withCredentials: true}
    );
  }

  /**
   * Send WebRTC signal
   */
  sendSignal(signal: CallSignal): Observable<any> {
    return this.http.post(`${this.apiUrl}/calls/signal`, signal,
      {withCredentials: true});
  }

  /**
   * Get active calls for the current user
   */
  getActiveCalls(): Observable<any> {
    return this.http.get(`${this.apiUrl}/calls/active`);
  }

  /**
   * Set current call
   */
  setCurrentCall(call: CallData | null) {
    this.currentCallSubject.next(call);
    this.callStatusSubject.next(call ? call.status : 'idle');
  }

  /**
   * Set incoming call
   */
  setIncomingCall(call: CallData | null) {
    this.incomingCallSubject.next(call);
    if (call) {
      this.callStatusSubject.next('incoming');
    }
  }

  /**
   * Update call status
   */
  updateCallStatus(status: string) {
    this.callStatusSubject.next(status);
  }

  /**
   * Get current call value
   */
  getCurrentCall(): CallData | null {
    return this.currentCallSubject.value;
  }

  /**
   * Get incoming call value
   */
  getIncomingCall(): CallData | null {
    return this.incomingCallSubject.value;
  }

  /**
   * Clear all call data
   */
  clearCalls() {
    this.currentCallSubject.next(null);
    this.incomingCallSubject.next(null);
    this.callStatusSubject.next('idle');
  }

  /**
   * Check if user is in a call
   */
  isInCall(): boolean {
    const currentCall = this.getCurrentCall();
    return currentCall !== null && ['initiated', 'ringing', 'answered'].includes(currentCall.status);
  }

  /**
   * Check if user has an incoming call
   */
  hasIncomingCall(): boolean {
    return this.getIncomingCall() !== null;
  }
}
