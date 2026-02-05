
import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GamePhase, Choice, Player } from '../types';
import { GameEngine } from '../services/gameEngine';

export const useGame = (roomId: string, playerName: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId] = useState(() => {
    const stored = localStorage.getItem('stag_hunt_player_id');
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(2, 9);
    localStorage.setItem('stag_hunt_player_id', newId);
    return newId;
  });

  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const engine = new GameEngine(roomId, (newState) => {
      setGameState(newState);
    });
    engineRef.current = engine;

    // Join room
    engine.send({
      type: 'PLAYER_JOIN',
      payload: { id: playerId, name: playerName }
    });

    return () => {
      engine.send({ type: 'PLAYER_LEAVE', payload: { id: playerId } });
      engine.destroy();
    };
  }, [roomId, playerId, playerName]);

  const startGame = useCallback(() => {
    engineRef.current?.send({ type: 'START_GAME', payload: {} });
  }, []);

  const submitChoice = useCallback((choice: Choice) => {
    engineRef.current?.send({ type: 'SUBMIT_CHOICE', payload: { choice } });
  }, []);

  const resetGame = useCallback(() => {
     engineRef.current?.send({ type: 'RESET', payload: {} });
  }, []);

  const localPlayer = gameState?.players.find(p => p.id === playerId);
  const isHost = localPlayer?.isHost ?? false;

  return {
    gameState,
    playerId,
    localPlayer,
    isHost,
    startGame,
    submitChoice,
    resetGame
  };
};
