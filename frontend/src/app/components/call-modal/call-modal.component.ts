import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallData } from '../../interfaces/CallData';
import { EchoService } from '../../services/echo.service';
import { CallService } from '../../services/call.service';
import { Conversation } from '../../interfaces/Conversation';
import { ButtonIconLoaderComponent } from '../UI/button-icon-loader.component';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule, 
    FormsModule,
    ButtonIconLoaderComponent
  ],
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

  callData: CallData | null = null;

  isIncomingCall: boolean = false;
  callType: 'audio' | 'video' = 'audio';

  isLoadingAnswer: boolean = false;
  isLoadingDecline: boolean = false;

  localVideoElement!: ElementRef<HTMLVideoElement>;
  remoteVideoElement!: ElementRef<HTMLVideoElement>;
  videoStopped: boolean = false;

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
      private callService: CallService
    ) {}

  ngOnInit() {
    console.log('localVideo El:', this.localVideo);
  }

  ngAfterViewInit() {
    this.localVideoElement = this.localVideo
      this.remoteVideoElement = this.remoteVideo;

    console.log('localVideo El:', this.localVideo);
  }

  ngOnDestroy() {}

  // Listen to call events
  listenToCallEvents(conversations: Conversation[]): void {
    const echo = this.echo.getInstance();
    // Listen for call events on existing message channels
    conversations.forEach((conversation) => {
      const otherUserId = conversation.id;
      const sortedIds = [this.currentUser.id, otherUserId].sort().join('-');
      const channelName = `message.user.${sortedIds}`;

      echo.private(channelName)
        .listen('CallInitiated', (data: any) => {

          console.log('WS Incoming call:', data);

          this.callData = data;
          this.isIncomingCall = true;
          this.isVisibleCallModal = true;
        })
        .listen('CallAnswered', (data: any) => {

          console.log('WS Call answered:', data);

          this.isIncomingCall = false;
          this.handleWebRTCSignal(data);
        })
        .listen('CallEnded', (data: any) => {

          console.log('WS Call ended:', data);

          this.handleCallEnded(data);
        })
        .listen('WebRTCSignal', (data: any) => {

          console.log('WS WebRTC signal received:', data);

          this.handleWebRTCSignal(data);
        });
    });
  }

  // Handle WebRTC signals
handleWebRTCSignal(signal: any) {
  console.log('Handling WebRTC signal:', signal);
  
  // if (!this.peerConnection) {
  //   console.error('No peer connection available');
  //   return;
  // }

  switch (signal.type) {
    case 'offer':
      this.handleIncomingOffer(signal.offer);
      break;
    case 'answer':
      this.handleIncomingAnswer(signal.answer);
      break;
    case 'ice-candidate':
      this.handleIncomingICECandidate(signal.candidate);
      break;
  }
}

private async handleIncomingOffer(offer: RTCSessionDescriptionInit) {
  try {
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    
    // Send answer back
    this.sendSignalToServer({
      type: 'answer',
      answer: answer,
      call_session_id: this.callData?.call_session_id,
      to_user_id: this.getOtherUserId()
    });
  } catch (error) {
    console.error('Failed to handle incoming offer:', error);
    this.callStatus = 'failed';
  }
}

  private async handleIncomingAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle incoming answer:', error);
      this.callStatus = 'failed';
    }
  }

  private async handleIncomingICECandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to handle incoming ICE candidate:', error);
    }
  }

  // Handle call ended
  handleCallEnded(call: CallData | null) {
    this.isIncomingCall = false;
    this.isVisibleCallModal = false;
    this.callService.clearCalls();
    
    this.isCalling.emit(false);
  }

  async initiateCall(type: 'audio' | 'video') {
    if (!this.selectedConversation) return;

    this.isCalling.emit(true);
    this.callType = type;

    //TODO need to ask user to turn on camera/microphone in case when it is not enabled
    // First get user media/camera/microphone access and setup peer connection
    await this.getUserMedia()
      .then(() => {
        
        this.setupPeerConnection()
          .then(() => {
            // Create call via your service
            this.callService.initiateCall(this.selectedConversation!.id, type).subscribe({
                next: async (response) => {

                console.log('Call initiated:', response);

                this.callData = response.call;
                this.isIncomingCall = false;
                this.isVisibleCallModal = true;

                // Create and send offer
                await this.createAndSendOffer();
                
                this.isCalling.emit(false);
            },
            error: (error) => {
              this.isCalling.emit(false);
              console.error('Failed to initiate call:', error);
            }
          });
      }) 
    })
    .catch((error) => {
      console.error('Failed to get user media:', error);
      this.isCalling.emit(false);
    });
  }

  private async createAndSendOffer() {
    try {
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      this.sendSignalToServer({
        type: 'offer',
        offer: offer,
        call_session_id: this.callData?.call_session_id,
        to_user_id: this.getOtherUserId()
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  private sendSignalToServer(data: any) {
    this.callService.sendSignal({
      call_session_id: data.call_session_id,
      to_user_id: data.to_user_id,
      signal_type: data.type,
      signal_data: data.type === 'ice-candidate' ? data.candidate : 
                  data.type === 'offer' ? data.offer : data.answer
    }).subscribe({
      next: (response) => {
        console.log('Signal sent successfully:', response);
      },
      error: (error) => {
        console.error('Failed to send signal:', error);
      }
    });
  }

  private getOtherUserId(): number {
    if (!this.callData) return 0;
    
    const call = this.callData;

    return call.caller.id === this.currentUser.id ? call.receiver.id : call.caller.id;
  }

  onAnswerCall() {
    if (this.callData) {
      this.setupAnswerCall();
      this.answerCall(this.callData.id);
    } else {
      this.onEndCall();
    }
  }

  answerCall(callId: number) {

    this.isLoadingAnswer = true;

    this.callService.answerCall(callId).subscribe({
      next: (response) => {
        console.log('Call answered:', response);
        this.callData = response.call;
        this.isIncomingCall = false;
        this.isCalling.emit(false);
        console .log('Sending signal for answered call:', this.callData)

        if (!this.callData) {
          console.error('Call data is null after answering');
          this.isLoadingAnswer = false;

          return;
        }
        this.callService.sendSignal({
          call_session_id: this.callData.call_session_id,
          to_user_id: this.callData?.receiver.id,
          signal_type: 'answer',
          signal_data: this.callData
        }).subscribe({
        next: (signalResponse) => {
          this.isLoadingAnswer = false;
          console.log('Signal sent successfully:', signalResponse);
        },
        error: (signalError) => {
          this.isLoadingAnswer = false
          console.error('Failed to send signal:', signalError);
        }
        });
      },
      error: (error) => {
        console.error('Failed to answer call:', error);
        this.isLoadingAnswer = false
        this.isCalling.emit(false);
      }
    });
  }

  private async setupAnswerCall() {
    try {
      await this.getUserMedia();
      this.setupPeerConnection();

      //this.startCallTimer();

      this.callStatus = 'connecting';
      this.isCalling.emit(false);
    } catch (error) {
      console.error('Failed to setup answer call:', error);
      this.callStatus = 'failed';
      
      this.isCalling.emit(false);
    }
  }

  onEndCall() {
    if (this.callData) {
      this.endCall(this.callData.id);
    }

    this.isCalling.emit(false);
    this.isVisibleCallModal = false;
    this.isIncomingCall = false;
    this.closeModal.emit();
  }

  endCall(callId: number) {
    this.callService.endCall(callId).subscribe({
      next: (response) => {
        console.log('Call ended:', response);
        this.handleCallEnded(response.call);

        this.cleanupCall()
      },
      error: (error) => {
        console.error('Failed to end call:', error);
        this.handleCallEnded(null);
      }
    });
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

  onDeclineCall() {
      console.log('Declining call with ID:', this.callData!.id);
      this.declineCall(this.callData!.id);
      this.isCalling.emit(false);
      this.closeModal.emit();
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

//media
  async getUserMedia(): Promise<void> {
    try {

    console.log('this.callData', this.callData);

    const constraints = {
        audio: true,
       // video: this.callData?.type === 'video' ? {
      //  video: {
      //     width: { min: 640, ideal: 1200, max: 1200 },
      //     height: { min: 480, ideal: 1200, max: 720 },
      //  }
      video: { width: 640, height: 480 },
      
    };


    await navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.localStream = stream;
        console.log('Local stream obtained:', stream);
        this.startLocalVideo();
    })
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;  
    }
  }

  startLocalVideo() {
    this.localStream?.getVideoTracks().forEach(track => {
      track.enabled = true;
    });

    const videoElement = this.localVideoElement.nativeElement;
    videoElement.srcObject = this.localStream;
     // Set video properties
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = false;
  


    // Check video status after a delay
    setTimeout(() => {
      console.log('Delayed video check:');
      this.verifyVideoElement(this.localVideoElement.nativeElement);
      videoElement.play().catch((error) => {
        console.error('Error playing local video:', error);
      });

      this.videoStopped = false;

      // If still not loaded, try to force load
      if (videoElement.readyState === 0) {
        console.log('Forcing video load...');
        videoElement.load();
        
        // Check again after forcing load
        setTimeout(() => {
          this.verifyVideoElement(this.localVideoElement.nativeElement);
        }, 1000);
      }
    }, 500);
  }


  onStopVideo() {
    this.stopLocalVideo();
    this.videoStopped = true;

    console.log('Local video stopped');
    // this.callService.sendSignal({
    //   call_session_id: this.callData?.call_session_id,
    //   to_user_id: this.getOtherUserId(),
    //   signal_type: 'stop-video',
    //   signal_data: null
    // }).subscribe({
    //   next: (response) => {
    //     console.log('Video stopped signal sent:', response);
    //   },
    //   error: (error) => {
    //     console.error('Failed to send stop video signal:', error);
    //   }
    // });
  }

  stopLocalVideo() {
    this.localStream?.getVideoTracks().forEach(track => {
      track.stop();
    });

    this.localVideo.nativeElement.srcObject = null;

    console.log('Stopping local video Local stream...', this.localStream);
    this.verifyVideoElement(this.localVideoElement.nativeElement);
  }

private verifyVideoElement(videoElement: HTMLVideoElement): void {
  console.log('- srcObject:', videoElement.srcObject);
  console.log('- videoWidth:', videoElement.videoWidth);
  console.log('- videoHeight:', videoElement.videoHeight);
  console.log('- readyState:', videoElement.readyState);
  console.log('- paused:', videoElement.paused);
  console.log('- muted:', videoElement.muted);
  
  // Check if srcObject has video tracks
  if (videoElement.srcObject && videoElement.srcObject instanceof MediaStream) {
    const stream = videoElement.srcObject as MediaStream;
    console.log(`-stream active:`, stream.active);
    console.log(`-stream video tracks:`, stream.getVideoTracks().length);
  }
}

private async setupPeerConnection() {
  this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote tracks
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);

      this.remoteStream = event.streams[0];
      
      // Set remote video element
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = this.remoteStream;
      }
    };

  // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'connected') {
        this.callStatus = 'connected';
        this.isCalling.emit(false);
      } else if (this.peerConnection?.connectionState === 'failed') {
        this.callStatus = 'failed';
        this.isCalling.emit(false);
      }
    };
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

  // private startCallTimer() {
  //   this.durationInterval = setInterval(() => {
  //     this.callDuration++;
  //   }, 1000);
  //   this.isCalling.emit(false);
  // }

  // formatDuration(seconds: number): string {
  //   const mins = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  // }
}