export interface Participant {
  id: string;
  name: string;
  department?: string;
  employeeId?: string;
  note?: string;
}

export interface Prize {
  id: string;
  name: string;
  count: number;
  remainingCount: number;
  icon?: string;
  category?: string;
}

export interface DrawRecord {
  id: string;
  timestamp: number;
  prizeId?: string;
  prizeName: string;
  winner: Participant;
  batchId: string;
}

export type DrawMode = 'no-repeat' | 'repeat';

export type GroupingMode = 'by_size' | 'by_count';

export type NamingTheme = 'numbers' | 'letters' | 'colors' | 'animals' | 'planets' | 'elements';

export interface GroupResult {
  id: string;
  name: string;
  color: string;
  members: Participant[];
  leaderId?: string;
}
