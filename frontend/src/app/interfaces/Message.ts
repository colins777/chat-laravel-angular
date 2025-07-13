import { User } from "./User";

export interface Message {
  id: number;
  conversation_id: number | null;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  image?: string;
  sender?: User;
}