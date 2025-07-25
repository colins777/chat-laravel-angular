export interface Conversation {
  id: number;
  user_id_1: number;
  user_id_2: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  blocked_at: Date | null;
  last_message: string | null;
  last_message_date: Date | null;
  read_at: Date | null;
  is_read: boolean;
  avatar: string | null;
  email: string;
  online: boolean;
}
