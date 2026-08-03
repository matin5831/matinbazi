import React, { useState, useRef } from 'react';
import { Prize } from '../../types';
import confetti from 'canvas-confetti';
import { pickPrizeIndexByProbability } from '../../utils/game';
import { Play, Sparkles } from 'lucide-react';

interface LuckyWheelProps {
  prizes: Prize[];
  onFinish: (prize: Prize) => void;
  disabled?: boolean;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ prizes, onFinish, disabled }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | null>(null);

  const numSlices = prizes.length;
  const sliceAngle = 360 / numSlices;

  const handleSpin = () => {
    if (spinning || disabled || prizes.length === 0) return;

    setSpinning(true);
    setSelectedPrizeIndex(null);

    // Pick winning prize based on probabilities (normalized)
    const winningIndex = pickPrizeIndexByProbability(prizes);

    // Calculate rotation angle
    // Note: slice 0 starts at angle 0. Pointer is usually at top (270deg or -90deg in SVG space)
    // To land slice I at top pointer:
    const targetSliceCenter = winningIndex * sliceAngle + sliceAngle / 2;
    // We want targetSliceCenter to align with pointer at top (270 degrees clockwise or 90 counter-clockwise)
    const baseRounds = 360 * 5; // 5 full spins
    const offset = 270 - targetSliceCenter;
    const finalRotation = rotation + baseRounds + (offset - (rotation % 360));

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      setSelectedPrizeIndex(winningIndex);
      const wonPrize = prizes[winningIndex];

      if (wonPrize.isWin) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // fallback
        }
      }

      onFinish(wonPrize);
    }, 4500); // 4.5 seconds animation time
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-sm mx-auto p-2">
      {/* Top Pointer Indicator */}
      <div className="z-20 -mb-5 relative filter drop-shadow-md">
        <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[28px] border-t-amber-400 animate-bounce" />
      </div>

      {/* Outer Golden Glow & Border Ring */}
      <div className="relative p-2 sm:p-3 bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-500 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.3)] border-4 border-amber-300/60 max-w-full">
        
        {/* SVG Wheel */}
        <div className="w-[260px] h-[260px] xs:w-72 xs:h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden shadow-2xl relative">
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full transform transition-transform duration-[4500ms] ease-[cubic-bezier(0.15,0.95,0.2,1.0)]"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {prizes.map((prize, idx) => {
              const startAngle = idx * sliceAngle;
              const endAngle = (idx + 1) * sliceAngle;

              // Convert polar to Cartesian coords
              const x1 = 200 + 200 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 200 + 200 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 200 + 200 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 200 + 200 * Math.sin((Math.PI * endAngle) / 180);

              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              const pathData = `M 200 200 L ${x1} ${y1} A 200 200 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              const midAngle = startAngle + sliceAngle / 2;
              const textRadius = 135;
              const textX = 200 + textRadius * Math.cos((Math.PI * midAngle) / 180);
              const textY = 200 + textRadius * Math.sin((Math.PI * midAngle) / 180);

              return (
                <g key={prize.id || idx}>
                  <path
                    d={pathData}
                    fill={prize.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  <g transform={`translate(${textX}, ${textY}) rotate(${midAngle + 180}, 0, 0)`}>
                    <text
                      x="0"
                      y="0"
                      fill="#ffffff"
                      fontSize="13"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="select-none font-['Vazirmatn'] filter drop-shadow"
                    >
                      {prize.label.length > 18 ? prize.label.slice(0, 16) + '...' : prize.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Center Spin Hub Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || disabled}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-amber-300 bg-gradient-to-b from-indigo-600 to-purple-800 text-white shadow-2xl flex flex-col items-center justify-center font-bold text-xs hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer ${
              spinning ? 'opacity-90 animate-pulse' : 'hover:from-indigo-500 hover:to-purple-700'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin mb-0.5" />
            <span>{spinning ? 'در حال چرخش...' : 'بچرخون!'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Action Helper */}
      <div className="mt-4 text-center text-xs text-slate-300 flex items-center gap-1 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
        <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span>روی دکمه وسط کلیک کن تا گردونه بچرخه!</span>
      </div>
    </div>
  );
};
