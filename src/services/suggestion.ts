import type { ApplicationStatus } from '@prisma/client';
import { addDays, formatDateOnly, todayDate } from '../utils/dates';

export interface Suggestion {
  title: string;
  dueOn: string;
  dueOnDate: Date;
}

/**
 * הצעת צעד הבא לפי הסטטוס — מבוסס כללים בלבד, ללא AI.
 * השרת אינו יוצר את הפעולה בעצמו; הלקוח מציג את ההצעה, והמשתמש מחליט אם להוסיף אותה.
 */
export function suggestNextStep(status: ApplicationStatus): Suggestion | null {
  if (!status.suggestedAction) {
    return null;
  }
  const dueOnDate = addDays(todayDate(), status.suggestedDays ?? 3);
  return { title: status.suggestedAction, dueOn: formatDateOnly(dueOnDate), dueOnDate };
}

export function toSuggestionDto(suggestion: Suggestion | null) {
  return suggestion ? { title: suggestion.title, dueOn: suggestion.dueOn } : null;
}
