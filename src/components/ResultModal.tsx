import { Award, RotateCcw, ShieldAlert } from 'lucide-react';
import { DistrictSummary, FinanceLedger, ScenarioConfig } from '../types/game';

interface ResultModalProps {
  outcome: 'VICTORY' | 'GAME_OVER';
  reason: string;
  scenario: ScenarioConfig;
  turn: number;
  budget: number;
  summary: DistrictSummary;
  ledger: FinanceLedger;
  onReplay: () => void;
  onBackToTitle: () => void;
}

export function ResultModal({
  outcome,
  reason,
  scenario,
  turn,
  budget,
  summary,
  ledger,
  onReplay,
  onBackToTitle,
}: ResultModalProps) {
  const isWin = outcome === 'VICTORY';

  // Compute Rank S / A / B / C for Victory
  let rank = 'C';
  if (isWin) {
    let points = 0;
    if (summary.overallApprovalPct >= 95) points += 3;
    else if (summary.overallApprovalPct >= 88) points += 2;
    else points += 1;

    if (summary.valueIncreasePct >= scenario.targets.minValueIncreasePct + 25) points += 3;
    else if (summary.valueIncreasePct >= scenario.targets.minValueIncreasePct + 10) points += 2;
    else points += 1;

    if (turn <= scenario.maxTurns - 3) points += 2;
    else if (turn <= scenario.maxTurns - 1) points += 1;

    if (budget >= 500 && ledger.bondsIssued === 0) points += 2;
    else if (budget >= 0) points += 1;

    if (points >= 9) rank = 'S';
    else if (points >= 7) rank = 'A';
    else if (points >= 5) rank = 'B';
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1A2026]/65 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
    >
      <div className="bg-white border border-[#DED9CE] rounded-lg max-w-xl w-full shadow-2xl overflow-hidden">
        <div
          className={`px-6 py-5 border-b border-[#DED9CE] flex items-center justify-between ${
            isWin ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'
          }`}
        >
          <div className="flex items-center gap-3">
            {isWin ? (
              <Award className="w-7 h-7 text-[#15803D]" />
            ) : (
              <ShieldAlert className="w-7 h-7 text-[#DC2626]" />
            )}
            <div>
              <span className="text-xs font-medium text-[#5A6572]">{scenario.title}</span>
              <h2
                id="result-modal-title"
                className="font-display text-xl font-bold text-[#1A2026]"
              >
                {isWin ? '換地処分認可証 — 事業完了' : '区画整理事業 中止報告'}
              </h2>
            </div>
          </div>

          {isWin && (
            <div className="text-center px-4 py-1.5 bg-white border border-[#BBF7D0] rounded-md">
              <span className="block text-[10px] text-[#5A6572]">総合評価</span>
              <span className="font-display text-2xl font-bold text-[#15803D]">{rank}</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-[#2F3742] leading-relaxed">{reason}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF9F5] border border-[#ECE8DF] rounded-lg p-4 text-xs">
            <div>
              <span className="block text-[#64748B]">完了期 / 工期</span>
              <span className="font-mono-num text-base font-bold text-[#1A2026]">
                第{turn} / {scenario.maxTurns}期
              </span>
            </div>
            <div>
              <span className="block text-[#64748B]">最終平均同意率</span>
              <span className="font-mono-num text-base font-bold text-[#1A2026]">
                {summary.overallApprovalPct}%
              </span>
            </div>
            <div>
              <span className="block text-[#64748B]">平均地価上昇率</span>
              <span className="font-mono-num text-base font-bold text-[#15803D]">
                {summary.valueIncreasePct >= 0 ? '+' : ''}
                {summary.valueIncreasePct}%
              </span>
            </div>
            <div>
              <span className="block text-[#64748B]">平均減歩率</span>
              <span className="font-mono-num text-base font-bold text-[#1A2026]">
                {summary.averageGenbuRate}%
              </span>
            </div>
            <div>
              <span className="block text-[#64748B]">保留地売却収入</span>
              <span className="font-mono-num text-base font-bold text-[#B45309]">
                ¥{ledger.reserveSalesIncome.toLocaleString()}万
              </span>
            </div>
            <div>
              <span className="block text-[#64748B]">最終事業残高</span>
              <span
                className={`font-mono-num text-base font-bold ${
                  budget >= 0 ? 'text-[#1A2026]' : 'text-[#DC2626]'
                }`}
              >
                ¥{budget.toLocaleString()}万
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToTitle}
              className="px-4 py-2 text-xs font-semibold text-[#2F3742] bg-[#F4F2EC] border border-[#D4CFC3] rounded-md hover:bg-[#EAE6DC] transition-colors whitespace-nowrap cursor-pointer"
            >
              地区選択へ戻る
            </button>
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF] transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              この地区をもう一度設計する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
