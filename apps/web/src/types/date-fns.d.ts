declare module "date-fns" {
  export function format(date: Date | number | string, formatStr: string, options?: any): string;
  export function formatDistanceToNow(date: Date | number | string, options?: any): string;
  export function parseISO(dateString: string): Date;
}

declare module "date-fns/locale" {
  export const fr: any;
}
