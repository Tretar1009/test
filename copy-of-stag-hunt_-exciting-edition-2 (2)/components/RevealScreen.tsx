
import React from 'react';
import { GameState, Choice } from '../types';
import { Card } from './Layout';

interface RevealScreenProps {
  state: GameState;
  playerId: string;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({ state, playerId }) => {
  const result = state.lastRoundResult;
  if (!result) return null;

  const me = state.players.find(p => p.id === playerId);
  const myChoice = result.choices[playerId];
  const myPoints = me?.lastRoundPoints ?? 0;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center space-y-2">
        <h2 className={`text-4xl font-black uppercase tracking-tighter ${result.isSuccess ? 'text-emerald-400' : 'text-rose-500'}`}>
          {result.isSuccess ? 'The Hunt Succeeded!' : 'The Hunt Failed!'}
        </h2>
        <p className="text-slate-400 font-medium">
          {result.stagCount} hunters chose the Stag. Needed {result.threshold}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Stag Choice" value={result.stagCount} color="text-amber-400" />
        <Stat label="Hare Choice" value={result.hareCount} color="text-blue-400" />
        <Stat label="Needed" value={result.threshold} color="text-slate-400" />
      </div>

      <Card className={`p-8 text-center transition-all ${myPoints > 0 ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-rose-900/20 border-rose-500/50'}`}>
        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Your Result</div>
        <div className="text-6xl mb-4">{myChoice === Choice.STAG ? '🦌' : '🐇'}</div>
        <div className="text-5xl font-black text-white">
          {myPoints > 0 ? `+${myPoints}` : '0'} <span className="text-lg text-slate-400 font-normal">pts</span>
        </div>
        <p className="mt-4 text-sm text-slate-400 italic">
          {myChoice === Choice.STAG 
            ? result.isSuccess ? `The stag was shared among ${result.stagCount} people.` : 'Not enough people joined the hunt. You went hungry.'
            : 'You caught a rabbit. Stable food, but lonely.'}
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-slate-200 mb-4">Player Choices</h3>
        <div className="space-y-2">
          {state.players.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">{p.name}</span>
                {p.id === playerId && <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-400 uppercase font-bold">You</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">+{p.lastRoundPoints}</span>
                <span className="text-2xl">{result.choices[p.id] === Choice.STAG ? '🦌' : '🐇'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-center text-slate-500 animate-pulse">
        Next round in {state.timer}s...
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => (
  <Card className="p-4 text-center bg-slate-800/30">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</div>
    <div className={`text-2xl font-black ${color}`}>{value}</div>
  </Card>
);
