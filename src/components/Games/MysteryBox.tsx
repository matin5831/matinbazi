import React, { useState } from 'react';
import { Prize } from '../../types';
import confetti from 'canvas-confetti';
import { pickPrizeIndexByProbability } from '../../utils/game';
import { Gift, Sparkles } from 'lucide-react';

interface MysteryBoxProps {
  prizes: Prize[];
  onFinish: (prize: Prize) => void;
  disabled?: boolean;
}

export const MysteryBox: React.FC<MysteryBoxProps> = ({ prizes, onFinish, disabled }) => {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  const handleOpenBox = (boxIdx: number) => {
    if (selectedBox !== null || disabled) return;

    setSelectedBox(boxIdx);

    // Pick winning prize
    // انتخاب جایزه بر اساس شانس (نرمال‌شده)
    const winningIndex = pickPrizeIndexByProbability(prizes);

    const prize = prizes[winningIndex] || prizes[0];

    setTimeout(() => {
      setOpened(true);
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
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-sm mx-auto p-2">
      <div className="text-center mb-4">
        <p className="text-xs text-fuchsia-300 font-medium">یک جعبه کادو را انتخاب کنید تا جایزه آن باز شود 🎁</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[0, 1, 2].map((boxIdx) => {
          const isThisSelected = selectedBox === boxIdx;
          return (
            <button
              key={boxIdx}
              onClick={() => handleOpenBox(boxIdx)}
              disabled={selectedBox !== null || disabled}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                isThisSelected
                  ? 'bg-gradient-to-b from-fuchsia-600 to-pink-700 border-amber-300 scale-105 shadow-[0_0_30px_rgba(236,72,153,0.5)]'
                  : selectedBox !== null
                  ? 'opacity-40 bg-slate-900 border-slate-800 scale-95'
                  : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-fuchsia-500/40 hover:border-fuchsia-400 hover:scale-105 shadow-xl'
              }`}
            >
              <div className={`relative ${isThisSelected && !opened ? 'animate-bounce' : ''}`}>
                <Gift className={`w-12 h-12 ${isThisSelected ? 'text-amber-300' : 'text-fuchsia-400'}`} />
                {isThisSelected && !opened && (
                  <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-spin" />
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-200 mt-2">
                جعبه شماره {boxIdx + 1}
              </span>
            </button>
          );
        })}
      </div>

      {opened && wonPrize && (
        <div className="mt-6 bg-slate-900/90 border border-fuchsia-500/40 p-4 rounded-2xl text-center w-full animate-fade-in">
          <Sparkles className="w-6 h-6 text-amber-300 mx-auto mb-1 animate-spin" />
          <p className="text-xs text-fuchsia-300 font-bold mb-1">جایزه جعبه رازآلود شما:</p>
          <h3 className="text-base font-black text-white">{wonPrize.label}</h3>
          {wonPrize.subLabel && <p className="text-xs text-slate-300 mt-1">{wonPrize.subLabel}</p>}
        </div>
      )}
    </div>
  );
};
