
import React, { useState, useEffect } from 'react';
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
  const [isHostRole, setIsHostRole] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const { 
    gameState, 
    connectionStatus,
    localPlayer, 
    isHost, 
    startGame, 
    submitChoice 
  } = useGame(activeRoomId, name, isHostRole);

  const handleJoin = (rid: string, hostMode: boolean) => {
    if (!name) return alert('Please enter your name');
    localStorage.setItem('stag_hunt_player_name', name);
    setIsHostRole(hostMode);
    setActiveRoomId(rid.toUpperCase());
    setIsJoined(true);
  };

  const createRoom = () => {
    const rid = Math.random().toString(36).substring(2, 6).toUpperCase();
    handleJoin(rid, true);
  };

  if (!isJoined) {
    return (
      <Container>
        <div className="flex-1 flex flex-col justify-center items-center gap-12 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-amber-500 drop-shadow-2xl">
              STAG HUNT
            </h1>
            <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-sm">Online Multi-Player</p>
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
                  <Button onClick={() => handleJoin(inputRoomId, false)} disabled={!inputRoomId || !name}>Join</Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-slate-800 px-4 text-slate-500 tracking-widest">OR</span></div>
            </div>

            <Button onClick={createRoom} variant="ghost" className="w-full py-4" disabled={!name}>
              Host New Session
            </Button>
          </Card>
        </div>
      </Container>
    );
  }

  if (connectionStatus === 'CONNECTING') {
    return (
      <Container>
        <div className="flex-1 flex flex-col justify-center items-center gap-6">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Connecting to Forest...</h2>
            <p className="text-slate-500 text-sm mt-2">Finding other hunters in the wild</p>
          </div>
        </div>
      </Container>
    );
  }

  if (connectionStatus === 'ERROR') {
    return (
      <Container>
        <div className="flex-1 flex flex-col justify-center items-center gap-6">
          <div className="text-6xl">⚠️</div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Connection Failed</h2>
            <p className="text-rose-500 text-sm mt-2">Could not connect to room {activeRoomId}.</p>
            <Button onClick={() => window.location.reload()} variant="ghost" className="mt-6">Back to Start</Button>
          </div>
        </div>
      </Container>
    );
  }

  if (!gameState) return null;

  return (
    <Container>
      <header className="flex justify-between items-center py-6 border-b border-slate-800 mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-black font-black italic">SH</div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full pulse-emerald"></div>
          </div>
          <div>
            <h1 className="font-black tracking-tight text-white leading-none uppercase">STAG HUNT</h1>
            <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">Room: {gameState.roomId} • Online</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Score</div>
          <div className="text-xl font-black text-emerald-400 tabular-nums">{localPlayer?.score ?? 0}</div>
        </div>
      </header>

      {gameState.phase === GamePhase.LOBBY && (
        <Lobby roomId={gameState.roomId} players={gameState.players} isHost={isHost} onStart={startGame} />
      )}

      {gameState.phase === GamePhase.CHOOSING && (
        <GameScreen state={gameState} onChoose={submitChoice} playerId={localPlayer?.id ?? ''} />
      )}

      {gameState.phase === GamePhase.REVEAL && (
        <RevealScreen state={gameState} playerId={localPlayer?.id ?? ''} />
      )}

      {gameState.phase === GamePhase.ENDED && (
        <EndScreen state={gameState} onReset={() => window.location.reload()} />
      )}

      <footer className="mt-auto py-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest border-t border-slate-800 flex justify-center gap-4">
        <span>Global Server Active</span>
        <span className="text-slate-800">•</span>
        <span>Survival is Teamwork</span>
      </footer>
    </Container>
  );
};

export default App;
