export interface Scene {
  id: string;
  title: string;
  description: string;
  details: string;
  imageUrl: string;
  audioUrl?: string;
  videoId?: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export type AppState = 'landing' | 'setup' | 'loading' | 'timer';
