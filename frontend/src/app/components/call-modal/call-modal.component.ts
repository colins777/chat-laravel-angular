import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallData } from '../../interfaces/CallData';
import { EchoService } from '../../services/echo.service';
import { HttpClient } from '@angular/common/http';
import { CallService } from '../../services/call.service';
import { Conversation } from '../../interfaces/Conversation';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-modal.component.html',
  styleUrls: ['./call-modal.component.css']
})
export class CallModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isVisibleCallModal: boolean = false;
  @Input() currentUser: any = null;
  @Input() selectedConversation: Conversation | null = null;

  @Output() isCalling = new EventEmitter<boolean>();
  @Output() closeModal = new EventEmitter<boolean>();
  
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  // Dragging properties
  isDragging = false;
  startX = 0;
  startY = 0;
  currentX = 0;
  currentY = 0;

  // Call state
  callStatus: 'connecting' | 'connected' | 'ended' | 'failed' = 'connecting';
  callDuration = 0;
  durationInterval: any;

  currentCall: CallData | null = null;
  incomingCall: CallData | null = null;
  isIncomingCall: boolean = false;
  callData: CallData | null = null;


  // WebRTC properties
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  // STUN servers configuration
  private readonly rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

    constructor(
        private echo: EchoService,
        private http: HttpClient,
        private callService: CallService
      ) {
        console.log('CallModalComponent initialized');
      }

  ngOnInit() {
    console.log('CallModalComponent initialized:', this.callData);
  }

  ngAfterViewInit() {
    if (this.callData && !this.isIncomingCall) {
      this.setupVideoElements();
    }
  }

  ngOnDestroy() {
    this.cleanupCall();
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }

  // Listen to call events
   listenToCallEvents(conversations: Conversation[]): void {
    const echo = this.echo.getInstance();
    // Listen for call events on existing message channels
    conversations.forEach((conversation) => {
      const otherUserId = conversation.id;
      const sortedIds = [this.currentUser.id, otherUserId].sort().join('-');
      const channelName = `message.user.${sortedIds}`;

      console.log('Listening to call events channels...', channelName);

      echo.private(channelName)
        .listen('CallInitiated', (data: any) => {

          console.log('Incoming call:', data);

          this.incomingCall = data;
          this.isIncomingCall = true;
          this.isVisibleCallModal = true;
        })
        .listen('CallAnswered', (data: any) => {

          console.log('Call answered:', data);

          this.currentCall = data;
          this.isIncomingCall = false;
          this.isVisibleCallModal = true;
        })
        .listen('CallEnded', (data: any) => {

          console.log('Call ended:', data);

          this.handleCallEnded(data);
        })
        .listen('WebRTCSignal', (data: any) => {
          console.log('WebRTC signal received:', data);
          this.handleWebRTCSignal(data);
        });
    });
  }

  // Handle WebRTC signals
  handleWebRTCSignal(signal: any) {
    console.log('Handling WebRTC signal:', signal);
    
    if (signal.type === 'offer' && this.peerConnection) {
      // Handle incoming offer when answering a call
      this.handleIncomingOffer(signal);
    } else if (signal.type === 'answer' && this.peerConnection) {
      // Handle incoming answer when initiating a call
      this.handleIncomingAnswer(signal);
    } else if (signal.type === 'ice-candidate' && this.peerConnection) {
      // Handle incoming ICE candidate
      this.handleIncomingICECandidate(signal);
    }
  }

  private async handleIncomingOffer(offer: any) {
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      
      // Send answer back to the caller
      this.sendSignal('answer', answer);
    } catch (error) {
      console.error('Failed to handle incoming offer:', error);
      this.callStatus = 'failed';
    }
  }

  private async handleIncomingAnswer(answer: any) {
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle incoming answer:', error);
      this.callStatus = 'failed';
    }
  }

  private async handleIncomingICECandidate(candidate: any) {
    try {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to handle incoming ICE candidate:', error);
    }
  }

  // Handle call ended
  handleCallEnded(call: CallData | null) {
    this.currentCall = null;
    this.incomingCall = null;
    this.isIncomingCall = false;
    this.isVisibleCallModal = false;
    this.callService.clearCalls();
    
    this.isCalling.emit(false);
  }

  // Call control methods
  initiateCall(type: 'audio' | 'video') {

    console.log('type:', type);

    if (!this.selectedConversation) return;

   this.isCalling.emit(true)

    this.callService.initiateCall(this.selectedConversation.id, type).subscribe({
      next: (response) => {
        console.log('Call initiated:', response);
        this.currentCall = response.call;

        this.callData = response.call;

        this.isIncomingCall = false;
        this.isVisibleCallModal = true;
        this.isCalling.emit(false)
      },
      error: (error) => {
         this.isCalling.emit(false)
        console.error('Failed to initiate call:', error);
  
      }
    });
  }

  answerCall(callId: number) {
    this.callService.answerCall(callId).subscribe({
      next: (response) => {
        console.log('Call answered:', response);
        this.currentCall = response.call;
        this.incomingCall = null;
        this.isIncomingCall = false;
        this.isVisibleCallModal = true;
        
        // Emit that we're no longer in calling state
        this.isCalling.emit(false);
      },
      error: (error) => {
        console.error('Failed to answer call:', error);
        // Emit that we're no longer in calling state on error
        this.isCalling.emit(false);
      }
    });
  }

  declineCall(callId: number) {
    this.callService.declineCall(callId).subscribe({
      next: (response) => {
        console.log('Call declined:', response);
        this.handleCallEnded(response.call);
      },
      error: (error) => {
        console.error('Failed to decline call:', error);
        // Even on error, we should clean up the call state
        this.handleCallEnded(null);
      }
    });
  }

  endCall(callId: number) {
    this.callService.endCall(callId).subscribe({
      next: (response) => {
        console.log('Call ended:', response);
        this.handleCallEnded(response.call);
      },
      error: (error) => {
        console.error('Failed to end call:', error);
        // Even on error, we should clean up the call state
        this.handleCallEnded(null);
      }
    });
  }

  onEndCall() {
    if (this.callData) {
      this.endCall(this.callData.id);
    } else if (this.incomingCall) {
      // If no callData but we have an incoming call, decline it
      this.declineCall(this.incomingCall.id);
    }

    // Emit that we're no longer in calling state
    this.isCalling.emit(false);

    this.isVisibleCallModal = false;
    this.currentCall = null;
    this.incomingCall = null;
    this.isIncomingCall = false;

    this.closeModal.emit();
  }

  // Dragging functionality
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX - this.currentX;
    this.startY = event.clientY - this.currentY;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    
    this.currentX = event.clientX - this.startX;
    this.currentY = event.clientY - this.startY;
    
    const modal = event.currentTarget as HTMLElement;
    modal.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onCalling() {
      this.isCalling.emit(true);
      console.log('Calling:', this.isCalling);
  }

  // Call control methods
  onAnswerCall() {
    if (this.incomingCall) {
      console.log('Answering call data:', this.incomingCall);
      
      this.callData = this.incomingCall;
      
      // Answer the call via the service
      this.answerCall(this.incomingCall.id);
      
      // Set up the call as an answerer (not initiator)
      this.setupAnswerCall();
    }
  }

  onDeclineCall() {
    if (this.incomingCall) {
      console.log('Declining call with ID:', this.incomingCall.id);
      // Call the declineCall method directly
      this.declineCall(this.incomingCall.id);
      
      // Emit that we're no longer in calling state
      this.isCalling.emit(false);
      
      this.closeModal.emit();
    }
  }
  // WebRTC methods
  private async setupAnswerCall() {
    try {
      await this.getUserMedia();
      this.setupPeerConnection();
      // For answerer, we don't create an offer, we wait for the offer from the caller
      this.startCallTimer();
      this.callStatus = 'connecting';
      this.isCalling.emit(false);
    } catch (error) {
      console.error('Failed to setup answer call:', error);
      this.callStatus = 'failed';
      
      this.isCalling.emit(false);
    }
  }

  private async getUserMedia() {
    const constraints = {
      audio: true,
      video: this.callData?.type === 'video'
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (this.localVideo?.nativeElement) {
      this.localVideo.nativeElement.srcObject = this.localStream;
    }
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = this.remoteStream;
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to the other peer via signaling server
        this.sendSignal('ice-candidate', event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'connected') {
        this.callStatus = 'connected';
        // Emit that we're no longer in calling state when connected
        this.isCalling.emit(false);
      } else if (this.peerConnection?.connectionState === 'failed') {
        this.callStatus = 'failed';
        // Emit that we're no longer in calling state when failed
        this.isCalling.emit(false);
      }
    };
  }

  private sendSignal(type: string, data: any) {
    // This will be implemented to send signals via your WebSocket service
    console.log('Sending signal:', type, data);
  }

  private setupVideoElements() {
    if (this.localVideo?.nativeElement && this.localStream) {
      this.localVideo.nativeElement.srcObject = this.localStream;
    }
    
    // Also set up remote video if we have it
    if (this.remoteVideo?.nativeElement && this.remoteStream) {
      this.remoteVideo.nativeElement.srcObject = this.remoteStream;
    }
  }

  private startCallTimer() {
    this.durationInterval = setInterval(() => {
      this.callDuration++;
    }, 1000);
    this.isCalling.emit(false);
  }

  private cleanupCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }

  // Format call duration
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

}
