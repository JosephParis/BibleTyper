export interface Settings {
  userId: string;
  theme: 'light' | 'dark';
  fontSize: number;
  lineHeight: number;
  translation: string;
  versesPerPractice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsUpdate {
  theme?: 'light' | 'dark';
  fontSize?: number;
  lineHeight?: number;
  translation?: string;
  versesPerPractice?: number;
} 