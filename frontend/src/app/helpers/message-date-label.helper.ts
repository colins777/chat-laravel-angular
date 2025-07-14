// src/app/helpers/message-date-label.helper.ts
import { formatDate } from '@angular/common';

/**
 * Returns a label for a given date string:
 * - 'Heute' for today
 * - 'Gestern' for yesterday
 * - 'dd/MM/yyyy' for all other dates
 */
export function getDateLabel(dateString: string): string {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  // Remove time for comparison
  const isToday = messageDate.toDateString() === today.toDateString();
  const isYesterday = messageDate.toDateString() === yesterday.toDateString();

  if (isToday) return 'Heute';
  if (isYesterday) return 'Gestern';
  return formatDate(messageDate, 'dd/MM/yyyy', 'en-US');
}
