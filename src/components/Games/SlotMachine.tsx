import React, { useState } from 'react';
import { Prize } from '../../types';
import confetti from 'canvas-confetti';
import { pickPrizeIndexByProbability } from '../../utils/game';
import { Sparkles, Trophy, RotateCcw } from 'lucide-react';

interface SlotMachineProps {
  prizes: Prize[];
  onFinish: (prize: Prize) => void;
  disabled?: boolean;
}

const SLOT_ICONS = ['🍔', '🎁', '💎', '👑', '⚡', '🎟️', '🪙', '✨'];

export const SlotMachine: React.FC<SlotMachineProps> = ({ prizes, onFinish, disabled }) => {
  const [reels, setReels] = useState(['🎁', '🎁', '🎁']);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  const handlePullLever = () => {
    if (spinning || disabled) return;

    setSpinning(true);
    setWonPrize(null);

    // Pick prize
    // انتخاب جایزه بر اساس شانس (نرمال‌شده)
    const winningIndex = pickPrizeIndexByProbability(prizes);

    const prize = prizes[winningIndex] || prizes[0];

    // Decide winning icons on reels
    const winningIcon = SLOT_ICONS[winningIndex % SLOT_ICONS.length];
    
    // Fast spin animation effect
    let spinCount = 0;
    const interval = setInterval(() => {
      spinCount++;
      setReels([
        SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)],
        SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)],
        SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)],
      ]);

      if (spinCount > 25) {
        clearInterval(interval);
        
        // Final reel state
        if (prize.isWin) {
          // All 3 reels match!
          setReels([winningIcon, winningIcon, winningIcon]);
        } else {
          // Mixed icons
          setReels([winningIcon, SLOT_ICONS[(winningIndex + 1) % SLOT_ICONS.length], winningIcon]);
        }

        setSpinning(false);
        setWonPrize(prize);

        if (prize.isWin) {
          try {
            confetti({
              particleCount: 100,
              spread: 90,
              origin: { y: 0.6 }
            });
          } catch (e) {}
        }

        onFinish(prize);
      }
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-sm mx-auto p-2">
      {/* Slot Machine Frame */}
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-red-600 via-red-800 to-amber-900 p-4 border-4 border-amber-400 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        
        {/* Top Lights Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-300 animate-ping" />
            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
          </div>
          <div className="text-xs font-black text-amber-200 tracking-wider flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-amber-400/40">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>JACKPOT SLOT</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
            <span className="w-3 h-3 rounded-full bg-amber-300 animate-ping" />
          </div>
        </div>

        {/* Reels Window Screen */}
        <div className="bg-slate-950 p-4 rounded-2xl border-4 border-amber-500/80 shadow-inner flex justify-center gap-3 relative overflow-hidden">
          {/* Glass glare effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

          {reels.map((icon, idx) => (
            <div
              key={idx}
              className={`w-20 h-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-400/60 rounded-xl flex items-center justify-center text-4xl shadow-2xl transition-all transform ${
                spinning ? 'scale-95 blur-[0.5px] animate-bounce' : 'scale-100'
              }`}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Spin Lever Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handlePullLever}
            disabled={spinning || disabled}
            className={`w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-2 border-yellow-200 ${
              spinning ? 'opacity-80 animate-pulse' : ''
            }`}
          >
            <Sparkles className="w-5 h-5 text-slate-900 animate-spin" />
            <span>{spinning ? 'در حال شانس‌آزمایی...' : 'کشیدن اهرم شانس 🎰'}</span>
          </button>
        </div>
      </div>

      {wonPrize && (
        <div className="mt-4 bg-slate-900 border border-amber-500/40 p-3 rounded-xl text-center w-full animate-fade-in">
          <p className="text-xs text-amber-300 font-bold mb-1">نتیجه اسپین:</p>
          <p className="text-sm font-black text-white">{wonPrize.label}</p>
        </div>
      )}
    </div>
  );
};
