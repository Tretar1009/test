
import { GameState, GamePhase, Choice, Player, GameEvent } from '../types';
import { getThreshold, getRandomRounds, HARE_POINTS, STAG_POOL, REVEAL_DURATION } from '../constants';

declare const Peer: any;

export class GameEngine {
  private peer: any = null;
  private connections: Map<string, any> = new Map();
  private state: GameState;
  private onStateUpdate: (state: GameState) => void;
  private onStatusUpdate: (status: string) => void;
  private timerInterval: number | null = null;
  private isHost: boolean = false;
  private localPlayerId: string;

  constructor(
    roomId: string, 
    playerName: string, 
    isHost: boolean,
    onStateUpdate: (state: GameState) => void,
    onStatusUpdate: (status: string) => void
  ) {
    this.onStateUpdate = onStateUpdate;
    this.onStatusUpdate = onStatusUpdate;
    this.isHost = isHost;
    this.localPlayerId = localStorage.getItem('stag_hunt_player_id') || Math.random().toString(36).substring(2, 9);
    localStorage.setItem('stag_hunt_player_id', this.localPlayerId);
    
    this.state = this.getInitialState(roomId);
    this.initPeer(roomId, playerName);
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

  private initPeer(roomId: string, playerName: string) {
    this.onStatusUpdate('CONNECTING');
    
    // If host, use roomId as PeerID. If client, let PeerJS generate one.
    const peerId = this.isHost ? roomId : undefined;
    this.peer = new Peer(peerId);

    this.peer.on('open', (id: string) => {
      this.onStatusUpdate('CONNECTED');
      if (this.isHost) {
        // Host adds themselves
        this.addPlayer(this.localPlayerId, playerName, true);
      } else {
        // Client connects to host
        const conn = this.peer.connect(roomId);
        this.setupConnection(conn);
      }
    });

    this.peer.on('connection', (conn: any) => {
      if (this.isHost) {
        this.setupConnection(conn);
      }
    });

    this.peer.on('error', (err: any) => {
      console.error('Peer error:', err);
      this.onStatusUpdate('ERROR');
    });
  }

  private setupConnection(conn: any) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      if (!this.isHost) {
        // Client sends join request
        const playerName = localStorage.getItem('stag_hunt_player_name') || 'Hunter';
        this.sendToHost({
          type: 'PLAYER_JOIN',
          payload: { id: this.localPlayerId, name: playerName },
          senderId: this.localPlayerId
        });
      }
    });

    conn.on('data', (data: GameEvent) => {
      this.handleEvent(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      // Host should handle player removal here if needed
    });
  }

  private handleEvent(event: GameEvent, conn?: any) {
    const { type, payload, senderId } = event;

    if (this.isHost) {
      switch (type) {
        case 'PLAYER_JOIN':
          this.addPlayer(payload.id, payload.name, false, conn);
          break;
        case 'SUBMIT_CHOICE':
          this.handleChoice(senderId, payload.choice);
          break;
        case 'START_GAME':
          this.startGame();
          break;
      }
    } else {
      switch (type) {
        case 'SYNC':
          this.state = payload;
          this.onStateUpdate({ ...this.state });
          break;
      }
    }
  }

  private addPlayer(id: string, name: string, isHost: boolean, conn?: any) {
    if (this.state.phase !== GamePhase.LOBBY) return;
    if (this.state.players.length >= 5) return;
    
    const existing = this.state.players.find(p => p.id === id);
    if (!existing) {
      this.state.players.push({
        id, name, score: 0, lastChoice: Choice.NONE, isHost, isConnected: true, lastRoundPoints: 0
      });
      this.sync();
    }
  }

  private startGame() {
    if (this.state.players.length < 2) return;
    this.state.phase = GamePhase.CHOOSING;
    this.state.currentRound = 1;
    this.state.totalRounds = getRandomRounds();
    this.state.timer = this.state.config.timeoutSeconds;
    this.state.players.forEach(p => { p.score = 0; p.lastChoice = Choice.NONE; });
    this.startTimer();
    this.sync();
  }

  private handleChoice(playerId: string, choice: Choice) {
    const player = this.state.players.find(p => p.id === playerId);
    if (player && this.state.phase === GamePhase.CHOOSING) {
      player.lastChoice = choice;
      this.sync();
      if (this.state.players.every(p => p.lastChoice !== Choice.NONE)) {
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
        if (this.state.phase === GamePhase.CHOOSING) this.evaluateRound();
        else if (this.state.phase === GamePhase.REVEAL) this.nextRound();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  private evaluateRound() {
    this.stopTimer();
    const threshold = getThreshold(this.state.players.length);
    this.state.players.forEach(p => { if (p.lastChoice === Choice.NONE) p.lastChoice = Choice.HARE; });

    const finalStagPlayers = this.state.players.filter(p => p.lastChoice === Choice.STAG);
    const isSuccess = finalStagPlayers.length >= threshold;
    const pointsPerStag = isSuccess ? Math.floor(this.state.config.stagPool / finalStagPlayers.length) : 0;

    const choices: Record<string, Choice> = {};
    this.state.players.forEach(p => {
      choices[p.id] = p.lastChoice;
      const pts = p.lastChoice === Choice.STAG ? pointsPerStag : this.state.config.harePoints;
      p.lastRoundPoints = pts;
      p.score += pts;
    });

    this.state.lastRoundResult = {
      round: this.state.currentRound,
      stagCount: finalStagPlayers.length,
      hareCount: this.state.players.length - finalStagPlayers.length,
      threshold, isSuccess, pointsPerStag, choices
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
    if (!this.isHost) return;
    this.onStateUpdate({ ...this.state });
    const payload: GameEvent = { type: 'SYNC', payload: this.state, senderId: this.localPlayerId };
    this.connections.forEach(conn => conn.send(payload));
  }

  private sendToHost(event: GameEvent) {
    this.connections.forEach(conn => conn.send(event));
  }

  public sendAction(type: GameEvent['type'], payload: any) {
    const event: GameEvent = { type, payload, senderId: this.localPlayerId };
    if (this.isHost) {
      this.handleEvent(event);
    } else {
      this.sendToHost(event);
    }
  }

  public destroy() {
    this.stopTimer();
    if (this.peer) this.peer.destroy();
  }
}
