export type RevealMode = 'radial' | 'wipe' | 'scatter';

export interface Wallpaper {
  id: string;
  title: string;
  sourceUri: string;
  theme: string;
  revealMode: RevealMode;
  isUnlocked: boolean;
  unlockCondition: string | null;
}
