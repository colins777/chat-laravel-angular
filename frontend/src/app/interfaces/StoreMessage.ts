export interface StoreMessage {
  message: string;
  attachments: File[] | null;
  receiverId: number;
}