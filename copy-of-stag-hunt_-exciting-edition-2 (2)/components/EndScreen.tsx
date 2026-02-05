
import React from 'react';
import { GameState } from '../types';
import { Card, Button } from './Layout';

interface EndScreenProps {
  state: GameState;
  onReset: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ state, onReset }) => {
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center space-y-2 py-8">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400 uppercase italic tracking-tighter">
          Hunting Over!
        </h1>
        <p className="text-slate-400">Survival of the most coordinated.</p>
      </div>

      <div className="space-y-4">
        {sortedPlayers.map((p, i) => (
          <Card key={p.id} className={`p-6 flex items-center justify-between border-2 ${i === 0 ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl ${
                i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-800 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {i + 1}
              </div>
              <div>
                <div className="font-black text-xl text-white uppercase tracking-tight">{p.name}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Final Score</div>
              </div>
            </div>
            <div className="text-4xl font-black text-white tabular-nums">
              {p.score}
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={() => window.location.reload()} variant="primary" className="w-full py-4 text-xl">
        Back to Lobby
      </Button>
    </div>
  );
};
