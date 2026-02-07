export interface Settings {
  versesPerPractice: number;
  activeSourceText: string;
}

export interface SettingsUpdate {
  versesPerPractice?: number;
  activeSourceText?: string;
} 