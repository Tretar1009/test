
import React, { useState } from 'react';
import { Container, Card, Button } from './components/Layout';
import { useGame } from './hooks/useGame';
import { GamePhase, Choice } from './types';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';
import { RevealScreen } from './components/RevealScreen';
import { EndScreen } from './components/EndScreen';

const App: React.FC = () => {
  const [name, setName] = useState(() => localStorage.getItem('stag_hunt_player_name') || '');
  const [inputRoomId, setInputRoomId] = useState('');
  const [activeRoomId, setActiveRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const { 
    gameState, 
    localPlayer, 
    isHost, 
    startGame, 
    submitChoice 
  } = useGame(activeRoomId, name);

  const handleJoin = (rid: string) => {
    if (!name) return alert('Please enter your name');
    localStorage.setItem('stag_hunt_player_name', name);
    setActiveRoomId(rid.toUpperCase());
    setIsJoined(true);
  };

  const createRoom = () => {
    const rid = Math.random().toString(36).substring(2, 8).toUpperCase();
    handleJoin(rid);
  };

  if (!isJoined) {
    return (
      <Container>
        <div className="flex-1 flex flex-col justify-center items-center gap-12 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-amber-500 drop-shadow-2xl">
              STAG HUNT
            </h1>
            <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-sm">Exciting Edition 2</p>
          </div>

          <Card className="w-full p-8 space-y-8 bg-slate-800/30 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hunter Nickname</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Join a Room</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputRoomId} 
                    onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-mono font-bold outline-none focus:border-emerald-500 transition-colors uppercase"
                  />
                  <Button onClick={() => handleJoin(inputRoomId)} disabled={!inputRoomId || !name}>Join</Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-slate-800 px-4 text-slate-500 tracking-widest">OR</span></div>
            </div>

            <Button onClick={createRoom} variant="ghost" className="w-full py-4" disabled={!name}>
              Create Private Room
            </Button>
          </Card>

          <div className="grid grid-cols-2 gap-4 w-full">
             <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                <div className="text-2xl mb-1">🦌</div>
                <div className="text-[10px] font-black uppercase text-amber-500">Stag Strategy</div>
                <p className="text-[10px] text-slate-500 mt-1">High risk, but if enough hunters join, the reward is massive.</p>
             </div>
             <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                <div className="text-2xl mb-1">🐇</div>
                <div className="text-[10px] font-black uppercase text-blue-500">Hare Strategy</div>
                <p className="text-[10px] text-slate-500 mt-1">Safe and steady. You'll never go hungry, but you'll never feast.</p>
             </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!gameState) return <div className="min-h-screen flex items-center justify-center text-emerald-500 animate-pulse font-bold tracking-widest">CONNECTING TO ROOM...</div>;

  return (
    <Container>
      <header className="flex justify-between items-center py-6 border-b border-slate-800 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-black font-black italic">SH</div>
          <div>
            <h1 className="font-black tracking-tight text-white leading-none">STAG HUNT</h1>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Room: {gameState.roomId}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Score</div>
          <div className="text-xl font-black text-emerald-400 tabular-nums">{localPlayer?.score ?? 0}</div>
        </div>
      </header>

      {gameState.phase === GamePhase.LOBBY && (
        <Lobby 
          roomId={gameState.roomId} 
          players={gameState.players} 
          isHost={isHost} 
          onStart={startGame} 
        />
      )}

      {gameState.phase === GamePhase.CHOOSING && (
        <GameScreen 
          state={gameState} 
          onChoose={submitChoice} 
          playerId={localPlayer?.id ?? ''} 
        />
      )}

      {gameState.phase === GamePhase.REVEAL && (
        <RevealScreen 
          state={gameState} 
          playerId={localPlayer?.id ?? ''} 
        />
      )}

      {gameState.phase === GamePhase.ENDED && (
        <EndScreen 
          state={gameState} 
          onReset={() => {}} 
        />
      )}

      <footer className="mt-auto py-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest border-t border-slate-800">
        Coordination is the key to survival.
      </footer>
    </Container>
  );
};

export default App;
