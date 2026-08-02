import React, { useRef, useEffect, useState } from 'react';
import { Prize } from '../../types';
import confetti from 'canvas-confetti';
import { Sparkles, Hand, Gift } from 'lucide-react';

interface ScratchCardProps {
  prizes: Prize[];
  onFinish: (prize: Prize) => void;
  disabled?: boolean;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({ prizes, onFinish, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratched, setScratched] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    // Pick winning prize
    const randomVal = Math.random() * 100;
    let accumulated = 0;
    let winningIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
      accumulated += prizes[i].probability;
      if (randomVal <= accumulated) {
        winningIndex = i;
        break;
      }
    }
    const prize = prizes[winningIndex] || prizes[0];
    setWonPrize(prize);

    // Initialize Canvas Surface
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill canvas with luxury gold scratch coating
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#eab308');
    gradient.addColorStop(0.5, '#fef08a');
    gradient.addColorStop(1, '#ca8a04');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add pattern or text overlay
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 16px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙 اینجا رو بکش تا جایزه‌ت رو ببینی!', canvas.width / 2, canvas.height / 2);
  }, [prizes]);

  const scratch = (clientX: number, clientY: number) => {
    if (scratched || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    if (scratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const percentage = (transparentCount / (pixels.length / 4)) * 100;

    if (percentage > 45) {
      setScratched(true);
      // Clear remaining surface
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (wonPrize?.isWin) {
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }

      if (wonPrize) {
        onFinish(wonPrize);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawing.current = true;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing.current) {
      scratch(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-sm mx-auto p-2">
      {/* Scratch Card Outer Wrapper */}
      <div className="relative w-full h-64 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 p-1.5 shadow-[0_0_40px_rgba(234,179,8,0.25)] overflow-hidden border-2 border-amber-300">
        
        {/* Hidden Prize Revealed Underneath */}
        <div className="w-full h-full rounded-xl bg-slate-900 flex flex-col items-center justify-center p-6 text-center border border-amber-500/30">
          <Gift className="w-12 h-12 text-amber-400 animate-bounce mb-2" />
          <span className="text-xs text-amber-300/80 mb-1 font-medium">جایزه کشف شده:</span>
          <h3 className="text-xl font-black text-white mb-2 leading-tight">
            {wonPrize ? wonPrize.label : 'در حال بارگذاری...'}
          </h3>
          {wonPrize?.subLabel && (
            <p className="text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              {wonPrize.subLabel}
            </p>
          )}
        </div>

        {/* Scratch Coating Canvas Layer */}
        {!scratched && (
          <canvas
            ref={canvasRef}
            width={340}
            height={240}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={() => (isDrawing.current = true)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => (isDrawing.current = false)}
            className="absolute top-1.5 left-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] rounded-xl cursor-crosshair touch-none z-10 shadow-inner"
          />
        )}
      </div>

      <div className="mt-4 text-center text-xs text-slate-300 flex items-center gap-1.5 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
        <Hand className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>انگشتت یا ماوس رو روی کارت بکش تا پاک بشه!</span>
      </div>
    </div>
  );
};
