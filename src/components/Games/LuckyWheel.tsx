import React, { useState } from 'react';
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

    // Calculate rotation angle so the winning slice lands at the top pointer
    const targetSliceCenter = winningIndex * sliceAngle + sliceAngle / 2;
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
            particleCount: 100,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#8b5cf6', '#ec4899', '#ffffff']
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
      <div className="z-20 -mb-5 relative drop-shadow-lg">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,1)] mb-0.5" />
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[26px] border-t-amber-400 animate-bounce" />
        </div>
      </div>

      {/* Outer Golden Ring */}
      <div className="relative p-3 sm:p-4 bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-400 rounded-full shadow-[0_0_70px_rgba(245,158,11,0.45)] border-[6px] border-amber-200/80 max-w-full">

        {/* Wheel + LED rim */}
        <div className="relative w-[260px] h-[260px] xs:w-72 xs:h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden shadow-[inset_0_0_25px_rgba(0,0,0,0.35)]">

          {/* Static LED lights around the rim (don't rotate with the wheel) */}
          <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {Array.from({ length: 20 }).map((_, i) => {
              const a = (i * 18 * Math.PI) / 180;
              return (
                <circle
                  key={i}
                  cx={200 + 186 * Math.cos(a)}
                  cy={200 + 186 * Math.sin(a)}
                  r="5"
                  fill={i % 2 === 0 ? '#fef3c7' : '#f59e0b'}
                  opacity="0.95"
                />
              );
            })}
          </svg>

          {/* Rotating SVG Wheel */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full transform transition-transform duration-[4500ms] ease-[cubic-bezier(0.15,0.95,0.2,1.0)]"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <defs>
              <radialGradient id="wheelShine" cx="38%" cy="35%" r="75%">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="45%" stopColor="white" stopOpacity="0.08" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {prizes.map((prize, idx) => {
              const startAngle = idx * sliceAngle;
              const endAngle = (idx + 1) * sliceAngle;

              const x1 = 200 + 200 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 200 + 200 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 200 + 200 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 200 + 200 * Math.sin((Math.PI * endAngle) / 180);

              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              const pathData = `M 200 200 L ${x1} ${y1} A 200 200 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              const midAngle = startAngle + sliceAngle / 2;
              const textRadius = 128;
              const textX = 200 + textRadius * Math.cos((Math.PI * midAngle) / 180);
              const textY = 200 + textRadius * Math.sin((Math.PI * midAngle) / 180);

              const isWinner = selectedPrizeIndex === idx;

              return (
                <g key={prize.id || idx}>
                  {/* Slice */}
                  <path
                    d={pathData}
                    fill={prize.color}
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Winner glow ring */}
                  {isWinner && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="7"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 0 12px rgba(253,224,71,0.95))' }}
                    />
                  )}
                  {/* Golden stud at each slice boundary */}
                  <circle
                    cx={200 + 155 * Math.cos((Math.PI * startAngle) / 180)}
                    cy={200 + 155 * Math.sin((Math.PI * startAngle) / 180)}
                    r="6"
                    fill="#fde68a"
                    stroke="#92400e"
                    strokeWidth="1.5"
                    opacity="0.95"
                  />
                  {/* Label */}
                  <g transform={`translate(${textX}, ${textY}) rotate(${midAngle + 180}, 0, 0)`}>
                    <text
                      x="0"
                      y="0"
                      fill="#ffffff"
                      fontSize="14.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="select-none font-['Vazirmatn']"
                      style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.65))' }}
                    >
                      {prize.label.length > 16 ? prize.label.slice(0, 14) + '…' : prize.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Inner edge ring */}
            <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
            {/* Glass shine overlay */}
            <circle cx="200" cy="200" r="200" fill="url(#wheelShine)" pointerEvents="none" />
          </svg>

          {/* Center Spin Hub Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || disabled}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[86px] h-[86px] rounded-full border-[5px] border-amber-300/90 bg-gradient-to-b from-indigo-500 via-purple-600 to-purple-900 text-white shadow-[0_8px_30px_rgba(0,0,0,0.55),inset_0_2px_8px_rgba(255,255,255,0.25)] flex flex-col items-center justify-center font-bold text-xs z-20 transition-all cursor-pointer ${
              spinning ? 'opacity-95 animate-pulse' : 'hover:scale-105 active:scale-95 hover:from-indigo-400 hover:via-purple-500 hover:to-purple-800'
            }`}
          >
            <span className="absolute inset-2 rounded-full border border-white/25 pointer-events-none" />
            <Sparkles className={`w-5 h-5 text-amber-300 mb-0.5 ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'در حال چرخش…' : 'بچرخون!'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Action Helper */}
      <div className="mt-5 text-center text-xs text-slate-300 flex items-center gap-1.5 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
        <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span>روی دکمه وسط کلیک کن تا گردونه بچرخه!</span>
      </div>
    </div>
  );
};
