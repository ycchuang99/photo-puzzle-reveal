export interface GridSection {
  id: number;
  code: string; // The secret code encoded in the QR
  isUnlocked: boolean;
  row: number;
  col: number;
}

export interface GameState {
  sections: GridSection[];
  imageUrl: string | null;
  isComplete: boolean;
}
