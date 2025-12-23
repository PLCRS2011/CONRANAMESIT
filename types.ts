
export interface PetName {
  id: string;
  name: string;
  meaning: string;
  tags: string[];
}

export type Species = 'Dog' | 'Cat' | 'Hamster' | 'Bird' | 'Rabbit' | 'Reptile' | 'Other';

export interface UserSession {
  userId: string;
  userName: string;
  likes: string[]; // List of PetName IDs
}

export type AppMode = 'landing' | 'species-selection' | 'generating' | 'share-session' | 'join-session' | 'swiping' | 'share-results' | 'match-reveal';

export interface AppState {
  mode: AppMode;
  currentSpecies: Species;
  names: PetName[];
  currentUser: UserSession; // The user using THIS device
  importedSessions: string[][]; // Array of lists of likes from other users
  isHost: boolean; // Is this the device that generated the names?
  isLoading: boolean;
}
