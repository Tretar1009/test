
import React from 'react';
import { Player, GamePhase } from '../types';
import { Card, Button } from './Layout';

interface LobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStart: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ roomId, players, isHost, onStart }) => {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-emerald-400 mb-2">Game Lobby</h2>
        <p className="text-slate-400">Share the code below with your friends</p>
      </div>

      <Card className="p-8 text-center bg-emerald-900/10 border-emerald-500/30">
        <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Room Code</span>
        <div className="text-5xl font-mono font-black tracking-tighter text-white mt-2 select-all">
          {roomId}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex justify-between">
          <span>Players ({players.length}/5)</span>
          {players.length < 2 && <span className="text-xs text-rose-400 font-normal">Need at least 2 players</span>}
        </h3>
        <div className="space-y-3">
          {players.map((player) => (
            <div 
              key={player.id} 
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-200">{player.name}</span>
                {player.isHost && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wider">Host</span>
                )}
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          ))}
          {Array.from({ length: 5 - players.length }).map((_, i) => (
            <div key={i} className="h-14 border border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-600 italic text-sm">
              Waiting for player...
            </div>
          ))}
        </div>
      </Card>

      {isHost && (
        <Button 
          onClick={onStart} 
          disabled={players.length < 2}
          className="w-full py-4 text-xl shadow-emerald-500/20"
        >
          {players.length < 2 ? 'Need more players' : 'Start Hunt!'}
        </Button>
      )}
      {!isHost && (
        <div className="text-center text-slate-500 animate-pulse">
          Waiting for the host to start the game...
        </div>
      )}
    </div>
  );
};
