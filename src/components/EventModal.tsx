import { useState } from 'react';
import { AlertCircle, Eye, Maximize2 } from 'lucide-react';
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
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className="fixed inset-x-0 bottom-5 z-50 pointer-events-none flex justify-center px-4">
        <div
          className="pointer-events-auto bg-white border-2 border-[#1D4ED8] rounded-lg shadow-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 max-w-2xl w-full"
          role="region"
          aria-label="保留中の協議事項"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
            <div className="text-xs min-w-0">
              <div className="font-bold text-[#1A2026] truncate">
                第{turn}期 協議事項：{event.title}
              </div>
              <div className="text-[#5A6572]">
                地図のクリック確認や、地権者台帳・収支の閲覧ができます
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            協議事項に戻って選ぶ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1A2026]/25 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="bg-white border border-[#DED9CE] rounded-lg max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-3.5 border-b border-[#ECE8DF] bg-[#FAF9F5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#5A6572]">
            <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
            <span className="font-mono-num font-semibold">第{turn}期 協議事項</span>
            <span aria-hidden="true">·</span>
            <span>{event.category}</span>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#1D4ED8] bg-white border border-[#D4CFC3] rounded hover:bg-[#EFF6FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            地図・台帳を見る
          </button>
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
                      ※ 幹線とつながった道路沿いの「保留地」が1区画以上必要です
                    </div>
                  )}
                  {cannotAfford && (
                    <div className="text-[11px] font-medium text-[#DC2626] mt-1">
                      ※ 現在の事業資金が足りません
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
