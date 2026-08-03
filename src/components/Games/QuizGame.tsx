import React, { useState } from 'react';
import { Prize, QuizQuestion } from '../../types';
import confetti from 'canvas-confetti';
import { HelpCircle, CheckCircle2, XCircle, Award, ArrowLeft } from 'lucide-react';
import { pickPrizeByProbability } from '../../utils/game';

interface QuizGameProps {
  questions: QuizQuestion[];
  prizes: Prize[];
  onFinish: (prize: Prize) => void;
  disabled?: boolean;
}

export const QuizGame: React.FC<QuizGameProps> = ({ questions, prizes, onFinish, disabled }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = questions[currentIdx] || {
    question: 'سوال پیش‌فرض: بهترین روش تخفیف در فروشگاه آنلاین چیست؟',
    options: ['استفاده از کد تخفیف', 'ارسال رایگان', 'هر دو مورد بالا'],
    correctOptionIndex: 2
  };

  const handleSelectOption = (optIdx: number) => {
    if (selectedOption !== null || disabled || quizFinished) return;
    setSelectedOption(optIdx);

    const isCorrect = optIdx === currentQ.correctOptionIndex;
    if (isCorrect) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(prev => prev + 1);
        setSelectedOption(null);
      } else {
        // Quiz completed — award a prize BY PROBABILITY (like the other games)
        setQuizFinished(true);
        const picked = pickPrizeByProbability(prizes);
        const winPrize = picked || {
          id: 'quiz-win',
          label: 'کد تخفیف ویژه برندگان کوییز',
          probability: 100,
          couponCode: '',
          isWin: true,
          color: '#3b82f6'
        };

        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        onFinish(winPrize);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-sm mx-auto p-2">
      <div className="w-full bg-slate-900 border border-blue-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="flex items-center justify-between text-xs text-blue-300 mb-3 font-medium">
          <span>سوال {currentIdx + 1} از {questions.length}</span>
          <span>امتیاز: {score}</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-5">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {!quizFinished ? (
          <div>
            <h3 className="text-base font-bold text-white mb-5 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <span>{currentQ.question}</span>
            </h3>

            <div className="space-y-3">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrect = optIdx === currentQ.correctOptionIndex;
                let btnStyle = 'bg-slate-800 border-slate-700 hover:border-blue-500 text-slate-200';

                if (selectedOption !== null) {
                  if (isCorrect) btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold';
                  else if (isSelected && !isCorrect) btnStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={selectedOption !== null}
                    className={`w-full p-3.5 rounded-xl border text-right text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {selectedOption !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 animate-fade-in">
            <Award className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-black text-white mb-1">تبریک! آزمون به پایان رسید 🎉</h3>
            <p className="text-xs text-slate-300">شما با موفقیت به سوالات پاسخ دادید و جایزه ویژه را دریافت کردید!</p>
          </div>
        )}
      </div>
    </div>
  );
};
