export interface Event {
  id: string;
  title: string;
  host: string;
  banner: string;
  day: string;
  mon: string;
  time: string;
  loc: string;
  going: number;
  interested: number;
  registered: number;
  isFree: boolean;
  price?: string;
  category: string;
  isOnline: boolean;
  speaker?: string;
  duration?: string;
  platform?: string;
  c1: string;
  c2: string;
}
