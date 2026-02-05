
export enum GamePhase {
  LOBBY = 'LOBBY',
  CHOOSING = 'CHOOSING',
  REVEAL = 'REVEAL',
  ENDED = 'ENDED'
}

export enum Choice {
  STAG = 'STAG',
  HARE = 'HARE',
  NONE = 'NONE'
}

export type ConnectionStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'DISconnected';

export interface Player {
  id: string;
  name: string;
  score: number;
  lastChoice: Choice;
  isHost: boolean;
  isConnected: boolean;
  lastRoundPoints: number;
}

export interface GameConfig {
  harePoints: number;
  stagPool: number;
  timeoutSeconds: number;
}

export interface RoundResult {
  round: number;
  stagCount: number;
  hareCount: number;
  threshold: number;
  isSuccess: boolean;
  pointsPerStag: number;
  choices: Record<string, Choice>;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  config: GameConfig;
  lastRoundResult: RoundResult | null;
  timer: number;
}

export interface GameEvent {
  type: 'SYNC' | 'PLAYER_JOIN' | 'PLAYER_LEAVE' | 'START_GAME' | 'SUBMIT_CHOICE' | 'RESET';
  payload: any;
  senderId: string;
}
