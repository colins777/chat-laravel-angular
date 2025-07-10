export interface Conversations {
  id: number;
  name: string;
  is_group: boolean;
  is_user: boolean;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
  blocked_at: Date | null;
  last_message: string | null;
  last_message_date: Date | null;
  read_at: Date | null;
  is_read: boolean;
  avatar: string | null;
  email: string;
}
