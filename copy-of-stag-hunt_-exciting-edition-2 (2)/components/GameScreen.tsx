
import React from 'react';
import { GameState, Choice, GamePhase } from '../types';
import { Card, Button } from './Layout';

interface GameScreenProps {
  state: GameState;
  onChoose: (choice: Choice) => void;
  playerId: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({ state, onChoose, playerId }) => {
  const me = state.players.find(p => p.id === playerId);
  const submitted = me?.lastChoice !== Choice.NONE;
  const submittedCount = state.players.filter(p => p.lastChoice !== Choice.NONE).length;
  
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Round</div>
          <div className="text-xl font-black text-white">{state.currentRound} <span className="text-slate-500 text-sm">/ ?</span></div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Left</div>
          <div className={`text-2xl font-black tabular-nums ${state.timer <= 5 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
            {state.timer}s
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Threshold</div>
          <div className="text-xl font-black text-amber-500">{state.lastRoundResult?.threshold || '...'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChoiceButton 
          type={Choice.STAG} 
          onClick={() => onChoose(Choice.STAG)} 
          active={me?.lastChoice === Choice.STAG}
          disabled={submitted}
          description={`High Risk. Needs ${state.lastRoundResult?.threshold || 'Coordination'}. Split 18 points.`}
          icon="🦌"
        />
        <ChoiceButton 
          type={Choice.HARE} 
          onClick={() => onChoose(Choice.HARE)} 
          active={me?.lastChoice === Choice.HARE}
          disabled={submitted}
          description="Low Risk. Safe 3 points. Always succeeds."
          icon="🐇"
        />
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-200">Waiting for players</h3>
          <span className="text-emerald-400 font-mono font-bold">{submittedCount} / {state.players.length}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {state.players.map(p => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                p.lastChoice !== Choice.NONE ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700 bg-slate-900'
              }`}>
                {p.lastChoice !== Choice.NONE ? '✓' : p.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] text-slate-400 truncate w-full text-center">{p.id === playerId ? 'You' : p.name}</span>
            </div>
          ))}
        </div>
      </Card>
      
      {submitted && (
        <div className="text-center p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-medium">
          Choice submitted! Waiting for others...
        </div>
      )}
    </div>
  );
};

const ChoiceButton: React.FC<{ 
  type: Choice; 
  onClick: () => void; 
  active: boolean; 
  disabled: boolean;
  description: string;
  icon: string;
}> = ({ type, onClick, active, disabled, description, icon }) => {
  const isStag = type === Choice.STAG;
  return (
    <button
      onClick={onClick}
      disabled={disabled && !active}
      className={`relative group h-64 p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-between text-center ${
        active 
          ? isStag ? 'bg-amber-900/30 border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-500/20'
          : disabled 
            ? 'bg-slate-900 border-slate-800 opacity-50 grayscale cursor-not-allowed'
            : isStag ? 'bg-slate-800/50 border-slate-700 hover:border-amber-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'
      }`}
    >
      <div className="text-6xl group-hover:scale-110 transition-transform">{icon}</div>
      <div className="space-y-1">
        <div className={`text-2xl font-black uppercase tracking-tight ${isStag ? 'text-amber-400' : 'text-blue-400'}`}>
          {isStag ? 'The Stag' : 'The Hare'}
        </div>
        <p className="text-xs text-slate-400 leading-tight px-2">{description}</p>
      </div>
      {active && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
          Locked In
        </div>
      )}
    </button>
  );
};
