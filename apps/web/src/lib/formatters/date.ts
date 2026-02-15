import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy", { locale: fr });
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), "dd/MM/yy");
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy HH:mm", { locale: fr });
}

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: fr });
}
