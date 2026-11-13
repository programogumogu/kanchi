import { AlertCircle } from 'lucide-react';
import { EventChoice, TurnEvent } from '../types/game';

interface EventModalProps {
  event: TurnEvent;
  turn: number;
  budget: number;
  hasConnectedReserve: boolean;
  onSelectChoice: (choice: EventChoice) => void;
}

export function EventModal({
  event,
  turn,
  budget,
  hasConnectedReserve,
  onSelectChoice,
}: EventModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#1A2026]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="bg-white border border-[#DED9CE] rounded-lg max-w-lg w-full shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ECE8DF] bg-[#FAF9F5] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#5A6572]">
            <AlertCircle className="w-4 h-4 text-[#B45309]" />
            <span className="font-mono-num">第{turn}期 協議事項</span>
            <span aria-hidden="true">·</span>
            <span>{event.category}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h2 id="event-modal-title" className="font-display text-xl font-bold text-[#1A2026]">
            {event.title}
          </h2>
          <p className="text-sm text-[#4A5562] leading-relaxed">{event.description}</p>

          <div className="space-y-2.5 pt-2">
            {event.choices.map((choice, idx) => {
              const cannotAfford = choice.budgetDelta < 0 && budget + choice.budgetDelta < 0;
              const missingReserve = choice.requiresReserveConnected && !hasConnectedReserve;
              const disabled = cannotAfford || missingReserve;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectChoice(choice)}
                  className={`w-full text-left p-3.5 rounded-md border transition-colors ${
                    disabled
                      ? 'bg-[#F4F2EC] border-[#E5E1D8] opacity-60 cursor-not-allowed'
                      : 'bg-[#FAF9F5] border-[#D4CFC3] hover:border-[#1D4ED8] hover:bg-[#EFF6FF]/60 cursor-pointer'
                  }`}
                >
                  <div className="font-semibold text-sm text-[#1A2026]">{choice.label}</div>
                  <div className="text-xs text-[#5A6572] mt-1">{choice.description}</div>
                  {missingReserve && (
                    <div className="text-[11px] font-medium text-[#DC2626] mt-1">
                      ※ 道路ネットワークに接続済みの「保留地」が1区画以上必要です
                    </div>
                  )}
                  {cannotAfford && (
                    <div className="text-[11px] font-medium text-[#DC2626] mt-1">
                      ※ 現在の事業資金が不足しています
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
