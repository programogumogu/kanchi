import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Handshake,
  MapPinned,
  Users,
} from 'lucide-react';
import { ComputedLandowner, FinanceLedger, LogEntry } from '../types/game';

interface LandownerPanelProps {
  landowners: ComputedLandowner[];
  selectedOwnerId: string | null;
  budget: number;
  ap: number;
  townHallUsedThisTurn: boolean;
  ledger: FinanceLedger;
  logs: LogEntry[];
  onSelectOwner: (ownerId: string | null) => void;
  onCompensateOwner: (ownerId: string) => void;
  onHoldTownHall: () => void;
}

export function LandownerPanel({
  landowners,
  selectedOwnerId,
  budget,
  ap,
  townHallUsedThisTurn,
  ledger,
  logs,
  onSelectOwner,
  onCompensateOwner,
  onHoldTownHall,
}: LandownerPanelProps) {
  const [tab, setTab] = useState<'owners' | 'finance'>('owners');

  return (
    <aside className="bg-white border border-[#DED9CE] rounded-lg flex flex-col overflow-hidden">
      {/* Segmented Tab Switcher */}
      <div className="p-2 border-b border-[#DED9CE] bg-[#FAF9F5]">
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#EBE7DD] rounded-md">
          <button
            type="button"
            onClick={() => setTab('owners')}
            className={`py-1.5 px-3 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'owners'
                ? 'bg-white text-[#1A2026] shadow-xs'
                : 'text-[#5A6572] hover:text-[#1A2026]'
            }`}
          >
            地権者台帳 ({landowners.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('finance')}
            className={`py-1.5 px-3 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'finance'
                ? 'bg-white text-[#1A2026] shadow-xs'
                : 'text-[#5A6572] hover:text-[#1A2026]'
            }`}
          >
            事業収支・記録
          </button>
        </div>
      </div>

      {tab === 'owners' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Town Hall Action */}
          <div className="p-3 border-b border-[#ECE8DF] bg-[#FAF9F5]/60 flex items-center justify-between gap-2">
            <div className="text-xs text-[#4A5562]">
              <span className="font-semibold text-[#1A2026]">住民説明会</span>
              <span className="block text-[11px] text-[#64748B]">全員の同意+7% (毎期1回)</span>
            </div>
            <button
              type="button"
              disabled={townHallUsedThisTurn || budget < 100 || ap < 2}
              onClick={onHoldTownHall}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                !townHallUsedThisTurn && budget >= 100 && ap >= 2
                  ? 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer'
                  : 'bg-[#E5E1D8] text-[#7A8490] cursor-not-allowed'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              開催 ¥100万·2AP
            </button>
          </div>

          {/* Landowners List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#ECE8DF] max-h-[640px]">
            {landowners.map((lo) => {
              const isSelected = selectedOwnerId === lo.id;
              return (
                <div
                  key={lo.id}
                  className={`p-3.5 space-y-2.5 transition-colors ${
                    isSelected ? 'bg-[#EFF6FF]/60' : 'hover:bg-[#FAF9F5]'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectOwner(isSelected ? null : lo.id)}
                      className="text-left flex items-center gap-2 min-w-0 cursor-pointer group"
                    >
                      <span
                        className="w-5 h-5 rounded-[3px] text-[11px] font-bold text-white flex items-center justify-center shrink-0"
                        style={{ backgroundColor: lo.color }}
                      >
                        {lo.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#1A2026] group-hover:text-[#1D4ED8] truncate">
                          {lo.name}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">{lo.role}</div>
                      </div>
                    </button>

                    {/* Explicit Status Icon + Label + Score */}
                    <div className="text-right shrink-0">
                      <div
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          lo.status === 'agreed'
                            ? 'text-[#15803D]'
                            : lo.status === 'pending'
                            ? 'text-[#B45309]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {lo.status === 'agreed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {lo.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {lo.status === 'opposed' && <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>
                          {lo.status === 'agreed'
                            ? '同意'
                            : lo.status === 'pending'
                            ? '保留'
                            : '反対'}
                        </span>
                        <span className="font-mono-num ml-0.5">{lo.approval}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid (Tabular Numerals) */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#FAF9F5] border border-[#ECE8DF] rounded p-2">
                    <div>
                      <span className="block text-[#64748B]">区画(減歩率)</span>
                      <span className="font-mono-num font-semibold text-[#1A2026]">
                        {lo.afterTilesCount}筆{' '}
                        <span
                          className={
                            lo.genbuRate > 35 ? 'text-[#DC2626]' : 'text-[#4A5562]'
                          }
                        >
                          ({lo.genbuRate > 0 ? `${lo.genbuRate}%` : `+${Math.abs(lo.genbuRate)}%`})
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[#64748B]">資産増進率</span>
                      <span
                        className={`font-mono-num font-semibold ${
                          lo.valueGainRate >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'
                        }`}
                      >
                        {lo.valueGainRate >= 0 ? '+' : ''}
                        {lo.valueGainRate}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[#64748B]">接道率</span>
                      <span
                        className={`font-mono-num font-semibold ${
                          lo.roadAccessRate === 100 ? 'text-[#15803D]' : 'text-[#B45309]'
                        }`}
                      >
                        {lo.roadAccessRate}%
                      </span>
                    </div>
                  </div>

                  {/* Preference & Actions */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`truncate ${
                        lo.preferenceMet ? 'text-[#15803D] font-medium' : 'text-[#5A6572]'
                      }`}
                      title={lo.preferenceText}
                    >
                      {lo.preferenceMet ? '✓ 要望達成: ' : '要望: '}
                      {lo.preferenceText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectOwner(isSelected ? null : lo.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded border transition-colors whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                          : 'bg-white text-[#2F3742] border-[#D4CFC3] hover:bg-[#F4F2EC]'
                      }`}
                    >
                      <MapPinned className="w-3 h-3" />
                      {isSelected ? 'ハイライト中' : '所有地を表示'}
                    </button>
                    <button
                      type="button"
                      disabled={lo.talkedThisTurn || budget < 150}
                      onClick={() => onCompensateOwner(lo.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold rounded border transition-colors whitespace-nowrap ${
                        !lo.talkedThisTurn && budget >= 150
                          ? 'bg-white text-[#B45309] border-[#D4CFC3] hover:bg-[#FEF3C7] cursor-pointer'
                          : 'bg-[#F4F2EC] text-[#94A3B8] border-[#E5E1D8] cursor-not-allowed'
                      }`}
                    >
                      <Handshake className="w-3 h-3" />
                      {lo.talkedThisTurn ? '今期交渉済' : '補償交渉 ¥150万'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Finance Ledger Summary */}
          <div className="p-3.5 border-b border-[#ECE8DF] space-y-2 text-xs">
            <h3 className="font-display font-bold text-[#1A2026]">累計事業収支内訳</h3>
            <div className="space-y-1.5 font-mono-num">
              <div className="flex justify-between text-[#15803D]">
                <span>保留地処分収入</span>
                <span>+¥{ledger.reserveSalesIncome.toLocaleString()}万</span>
              </div>
              <div className="flex justify-between text-[#15803D]">
                <span>補助金・特別収入</span>
                <span>+¥{ledger.subsidyIncome.toLocaleString()}万</span>
              </div>
              <div className="flex justify-between text-[#DC2626]">
                <span>道路・公園・換地工事費</span>
                <span>-¥{ledger.infrastructureSpend.toLocaleString()}万</span>
              </div>
              <div className="flex justify-between text-[#DC2626]">
                <span>解体・補償・公債利子</span>
                <span>
                  -¥{(ledger.demolitionSpend + ledger.compensationSpend).toLocaleString()}万
                </span>
              </div>
              {ledger.bondDebt > 0 && (
                <div className="flex justify-between text-[#B45309] pt-1 border-t border-[#ECE8DF]">
                  <span>都市整備公債残高</span>
                  <span>¥{ledger.bondDebt.toLocaleString()}万</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2 max-h-[500px]">
            <h3 className="font-display text-xs font-bold text-[#1A2026]">施行記録</h3>
            {logs.length === 0 ? (
              <p className="text-xs text-[#7A8490]">まだ施行記録はありません。</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {logs.map((entry) => (
                  <li
                    key={entry.id}
                    className="pb-2 border-b border-[#F1EFE9] last:border-b-0 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono-num text-[10px] text-[#64748B]">
                        第{entry.turn}期
                      </span>
                      <p className="text-[#2F3742] leading-snug">{entry.text}</p>
                    </div>
                    {entry.amount !== undefined && entry.amount !== 0 && (
                      <span
                        className={`font-mono-num text-[11px] font-semibold shrink-0 ${
                          entry.amount > 0 ? 'text-[#15803D]' : 'text-[#DC2626]'
                        }`}
                      >
                        {entry.amount > 0 ? '+' : ''}¥{entry.amount.toLocaleString()}万
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
