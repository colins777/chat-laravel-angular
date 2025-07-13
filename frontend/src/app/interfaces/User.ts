export interface User {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_date: string | null;
}