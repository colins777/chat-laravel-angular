import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallData } from '../../interfaces/CallData';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-modal.component.html',
  styleUrls: ['./call-modal.component.css']
})
export class CallModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isVisible: boolean = false;
  @Input() callData: CallData | null = null;
  @Input() isIncoming: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() answerCall = new EventEmitter<number>();
  @Output() declineCall = new EventEmitter<number>();
  @Output() endCall = new EventEmitter<number>();

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

  ngOnInit() {
    if (this.callData && !this.isIncoming) {
      this.initializeCall();
    }
  }

  ngAfterViewInit() {
    if (this.callData && !this.isIncoming) {
      this.setupVideoElements();
    }
  }

  ngOnDestroy() {
    this.cleanupCall();
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
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

  // Call control methods
  onAnswerCall() {
    if (this.callData) {
      this.answerCall.emit(this.callData.id);
      this.initializeCall();
    }
  }

  onDeclineCall() {
    if (this.callData) {
      this.declineCall.emit(this.callData.id);
      this.closeModal.emit();
    }
  }

  onEndCall() {
    if (this.callData) {
      this.endCall.emit(this.callData.id);
      this.closeModal.emit();
    }
  }

  onCloseModal() {
    this.closeModal.emit();
  }

  // WebRTC methods
  private async initializeCall() {
    try {
      await this.getUserMedia();
      this.setupPeerConnection();
      this.createOffer();
      this.startCallTimer();
    } catch (error) {
      console.error('Failed to initialize call:', error);
      this.callStatus = 'failed';
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
      } else if (this.peerConnection?.connectionState === 'failed') {
        this.callStatus = 'failed';
      }
    };
  }

  private async createOffer() {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      // Send offer to the other peer via signaling server
      this.sendSignal('offer', offer);
    } catch (error) {
      console.error('Failed to create offer:', error);
      this.callStatus = 'failed';
    }
  }

  private sendSignal(type: string, data: any) {
    // This will be implemented to send signals via your WebSocket service
    console.log('Sending signal:', type, data);
  }

  private setupVideoElements() {
    if (this.localVideo?.nativeElement && this.localStream) {
      this.localVideo.nativeElement.srcObject = this.localStream;
    }
  }

  private startCallTimer() {
    this.durationInterval = setInterval(() => {
      this.callDuration++;
    }, 1000);
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
