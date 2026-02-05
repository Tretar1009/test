
import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Choice, ConnectionStatus } from '../types';
import { GameEngine } from '../services/gameEngine';

export const useGame = (roomId: string, playerName: string, isHostRole: boolean) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('IDLE');
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!roomId || !playerName) return;

    const engine = new GameEngine(
      roomId, 
      playerName, 
      isHostRole, 
      (newState) => setGameState(newState),
      (status) => setConnectionStatus(status as ConnectionStatus)
    );
    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, [roomId, playerName, isHostRole]);

  const startGame = useCallback(() => {
    engineRef.current?.sendAction('START_GAME', {});
  }, []);

  const submitChoice = useCallback((choice: Choice) => {
    engineRef.current?.sendAction('SUBMIT_CHOICE', { choice });
  }, []);

  const localPlayer = gameState?.players.find(p => p.id === localStorage.getItem('stag_hunt_player_id'));

  return {
    gameState,
    connectionStatus,
    localPlayer,
    isHost: isHostRole,
    startGame,
    submitChoice
  };
};
