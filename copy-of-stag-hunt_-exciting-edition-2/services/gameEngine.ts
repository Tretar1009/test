
import { GameState, GamePhase, Choice, Player, GameEvent } from '../types';
import { getThreshold, getRandomRounds, HARE_POINTS, STAG_POOL, REVEAL_DURATION } from '../constants';

/**
 * GameEngine manages the "server" state for a specific room.
 * In this implementation, the Host's tab acts as the authoritative server.
 */
export class GameEngine {
  private channel: BroadcastChannel;
  private state: GameState;
  private onStateUpdate: (state: GameState) => void;
  private timerInterval: number | null = null;

  constructor(roomId: string, onStateUpdate: (state: GameState) => void) {
    this.channel = new BroadcastChannel(`stag_hunt_${roomId}`);
    this.onStateUpdate = onStateUpdate;
    this.state = this.getInitialState(roomId);

    this.channel.onmessage = (event: MessageEvent<GameEvent>) => {
      this.handleEvent(event.data);
    };
  }

  private getInitialState(roomId: string): GameState {
    return {
      roomId,
      phase: GamePhase.LOBBY,
      players: [],
      currentRound: 0,
      totalRounds: 10,
      config: {
        harePoints: HARE_POINTS,
        stagPool: STAG_POOL,
        timeoutSeconds: 20
      },
      lastRoundResult: null,
      timer: 0
    };
  }

  private handleEvent(event: GameEvent) {
    const { type, payload, senderId } = event;

    switch (type) {
      case 'PLAYER_JOIN':
        this.addPlayer(payload.id, payload.name, senderId);
        break;
      case 'PLAYER_LEAVE':
        this.removePlayer(senderId);
        break;
      case 'START_GAME':
        if (this.isHost(senderId)) this.startGame();
        break;
      case 'SUBMIT_CHOICE':
        this.handleChoice(senderId, payload.choice);
        break;
      case 'SYNC':
        // Only non-hosts update their state from sync messages
        if (!this.isHost(this.getLocalPlayerId())) {
          this.state = payload;
          this.onStateUpdate(this.state);
        }
        break;
    }
  }

  private isHost(playerId: string): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    return !!player?.isHost;
  }

  private getLocalPlayerId(): string {
    return localStorage.getItem('stag_hunt_player_id') || '';
  }

  private addPlayer(id: string, name: string, senderId: string) {
    if (this.state.phase !== GamePhase.LOBBY) return;
    if (this.state.players.length >= 5) return;
    
    const existing = this.state.players.find(p => p.id === id);
    if (!existing) {
      const newPlayer: Player = {
        id,
        name,
        score: 0,
        lastChoice: Choice.NONE,
        isHost: this.state.players.length === 0,
        isConnected: true,
        lastRoundPoints: 0
      };
      this.state.players.push(newPlayer);
      this.sync();
    }
  }

  private removePlayer(id: string) {
    const playerIndex = this.state.players.findIndex(p => p.id === id);
    if (playerIndex > -1) {
      const wasHost = this.state.players[playerIndex].isHost;
      this.state.players.splice(playerIndex, 1);
      
      // Transfer host
      if (wasHost && this.state.players.length > 0) {
        this.state.players[0].isHost = true;
      }
      
      if (this.state.players.length === 0) {
        this.stopTimer();
      }

      this.sync();
    }
  }

  private startGame() {
    if (this.state.players.length < 2) return;
    this.state.phase = GamePhase.CHOOSING;
    this.state.currentRound = 1;
    this.state.totalRounds = getRandomRounds();
    this.state.timer = this.state.config.timeoutSeconds;
    this.state.players.forEach(p => {
      p.score = 0;
      p.lastChoice = Choice.NONE;
    });
    this.startTimer();
    this.sync();
  }

  private handleChoice(playerId: string, choice: Choice) {
    if (this.state.phase !== GamePhase.CHOOSING) return;
    
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.lastChoice = choice;
      this.sync();

      // If all players chosen, trigger early reveal
      const allChosen = this.state.players.every(p => p.lastChoice !== Choice.NONE);
      if (allChosen) {
        this.evaluateRound();
      }
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = window.setInterval(() => {
      if (this.state.timer > 0) {
        this.state.timer--;
        this.sync();
      } else {
        if (this.state.phase === GamePhase.CHOOSING) {
          this.evaluateRound();
        } else if (this.state.phase === GamePhase.REVEAL) {
          this.nextRound();
        }
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private evaluateRound() {
    this.stopTimer();
    const threshold = getThreshold(this.state.players.length);
    const stagPlayers = this.state.players.filter(p => p.lastChoice === Choice.STAG || p.lastChoice === Choice.NONE); // Timeout default logic could go here
    
    // Auto-assign "Hare" to non-choosers if timeout
    this.state.players.forEach(p => {
      if (p.lastChoice === Choice.NONE) p.lastChoice = Choice.HARE;
    });

    const finalStagPlayers = this.state.players.filter(p => p.lastChoice === Choice.STAG);
    const stagCount = finalStagPlayers.length;
    const hareCount = this.state.players.length - stagCount;
    const isSuccess = stagCount >= threshold;
    const pointsPerStag = isSuccess ? Math.floor(this.state.config.stagPool / stagCount) : 0;

    const choices: Record<string, Choice> = {};
    this.state.players.forEach(p => {
      choices[p.id] = p.lastChoice;
      let roundScore = 0;
      if (p.lastChoice === Choice.STAG) {
        roundScore = pointsPerStag;
      } else {
        roundScore = this.state.config.harePoints;
      }
      p.lastRoundPoints = roundScore;
      p.score += roundScore;
    });

    this.state.lastRoundResult = {
      round: this.state.currentRound,
      stagCount,
      hareCount,
      threshold,
      isSuccess,
      pointsPerStag,
      choices
    };

    this.state.phase = GamePhase.REVEAL;
    this.state.timer = REVEAL_DURATION;
    this.startTimer();
    this.sync();
  }

  private nextRound() {
    if (this.state.currentRound >= this.state.totalRounds) {
      this.state.phase = GamePhase.ENDED;
      this.stopTimer();
    } else {
      this.state.currentRound++;
      this.state.phase = GamePhase.CHOOSING;
      this.state.timer = this.state.config.timeoutSeconds;
      this.state.players.forEach(p => p.lastChoice = Choice.NONE);
      this.startTimer();
    }
    this.sync();
  }

  private sync() {
    this.onStateUpdate({ ...this.state });
    this.channel.postMessage({
      type: 'SYNC',
      payload: this.state,
      senderId: this.getLocalPlayerId()
    });
  }

  public send(event: Omit<GameEvent, 'senderId'>) {
    const senderId = this.getLocalPlayerId();
    // Execute locally if we are the sender
    this.handleEvent({ ...event, senderId });
    // Broadcast
    this.channel.postMessage({ ...event, senderId });
  }

  public destroy() {
    this.stopTimer();
    this.channel.close();
  }
}
