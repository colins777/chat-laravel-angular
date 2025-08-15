export interface CallData {
  id: number;
  call_session_id: string;
  type: 'audio' | 'video';
  status: string;
  caller: any;
  receiver: any;
}