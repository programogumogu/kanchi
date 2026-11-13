import {
  Building2,
  CheckCircle2,
  Circle,
  Eraser,
  Home,
  Landmark,
  MapPin,
  MousePointerClick,
  Route,
  Trees,
} from 'lucide-react';
import { TOOLS } from '../engine/simulation';
import {
  ComputedLandowner,
  DistrictSummary,
  ScenarioConfig,
  ToolType,
} from '../types/game';

interface ToolSidebarProps {
  activeTool: ToolType;
  selectedOwnerId: string | null;
  landowners: ComputedLandowner[];
  summary: DistrictSummary;
  scenario: ScenarioConfig;
  bondsIssued: number;
  onSelectTool: (tool: ToolType) => void;
  onSelectOwner: (ownerId: string) => void;
  onIssueBond: () => void;
  onFinalize: () => void;
}

const TOOL_ICONS: Record<ToolType, typeof MousePointerClick> = {
  inspect: MousePointerClick,
  road_6m: Route,
  road_12m: Route,
  park: Trees,
  clear: Eraser,
  replot_res: Home,
  replot_com: Building2,
  reserve: MapPin,
};

export function ToolSidebar({
  activeTool,
  selectedOwnerId,
  landowners,
  summary,
  scenario,
  bondsIssued,
  onSelectTool,
  onSelectOwner,
  onIssueBond,
  onFinalize,
}: ToolSidebarProps) {
  const isReplotTool = activeTool === 'replot_res' || activeTool === 'replot_com';

  return (
    <aside className="flex flex-col gap-4">
      {/* Tool Palette */}
      <div className="bg-white border border-[#DED9CE] rounded-lg p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[#1A2026]">設計・施工ツール</h2>
          <span className="text-[11px] text-[#64748B]">キー 1–8</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
          {TOOLS.map((tool) => {
            const Icon = TOOL_ICONS[tool.id];
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                className={`w-full text-left px-3 py-2 rounded-md border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                    : 'bg-[#FAF9F5] text-[#1A2026] border-[#E5E1D8] hover:bg-[#F0ECE3]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#4A5562]'}`} />
                  <span className="text-xs font-semibold truncate">{tool.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono-num text-[11px]">
                  {tool.baseCost > 0 ? (
                    <span className={isActive ? 'text-blue-100' : 'text-[#5A6572]'}>
                      ¥{tool.baseCost}万·{tool.apCost}AP
                    </span>
                  ) : (
                    <span className={isActive ? 'text-blue-100' : 'text-[#7A8490]'}>
                      [{tool.shortcut}]
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Tool Description */}
        <p className="text-[11px] text-[#4A5562] leading-relaxed pt-1 border-t border-[#ECE8DF]">
          {TOOLS.find((t) => t.id === activeTool)?.description}
        </p>

        {/* Target Landowner Selector when using Replot Tools */}
        {isReplotTool && (
          <div className="pt-2 border-t border-[#ECE8DF] space-y-1.5">
            <label
              htmlFor="replot-owner-select"
              className="block text-[11px] font-semibold text-[#1A2026]"
            >
              換地の割付先（地権者）
            </label>
            <select
              id="replot-owner-select"
              value={selectedOwnerId || ''}
              onChange={(e) => onSelectOwner(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-[#FAF9F5] border border-[#D4CFC3] rounded-md text-[#1A2026] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              {landowners.map((lo) => (
                <option key={lo.id} value={lo.id}>
                  {lo.name}（現在 {lo.afterTilesCount}区画 / 同意 {lo.approval}%）
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Completion Targets Checklist */}
      <div className="bg-white border border-[#DED9CE] rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[#1A2026]">換地処分 達成基準</h2>
          <span className="font-mono-num text-[11px] text-[#5A6572]">
            {Object.values(summary.goalsMet).filter(Boolean).length}/6 達成
          </span>
        </div>

        <ul className="space-y-2 text-xs">
          <GoalRow
            met={summary.goalsMet.roadAccess}
            label="全地権者区画の接道率"
            value={`${summary.roadAccessPct}% / 100%`}
          />
          <GoalRow
            met={summary.goalsMet.allClear}
            label="所有内の老朽木密・工場解消"
            value={summary.unservicedParcelCount === 0 ? '解消済' : `残 ${summary.unservicedParcelCount}区画`}
          />
          <GoalRow
            met={summary.goalsMet.parks}
            label="街区公園の整備数"
            value={`${summary.parkCount} / ${scenario.targets.minParks}区画`}
          />
          <GoalRow
            met={summary.goalsMet.valueGain}
            label="地区平均地価の上昇率"
            value={`${summary.valueIncreasePct >= 0 ? '+' : ''}${summary.valueIncreasePct}% / +${scenario.targets.minValueIncreasePct}%`}
          />
          <GoalRow
            met={summary.goalsMet.approval}
            label="地権者の平均同意率"
            value={`${summary.overallApprovalPct}% / ${scenario.targets.minApprovalPct}%`}
          />
          <GoalRow
            met={summary.goalsMet.noOpposed}
            label="強硬反対の地権者"
            value={summary.opposedCount === 0 ? '0名' : `${summary.opposedCount}名`}
          />
        </ul>

        <button
          type="button"
          disabled={!summary.canFinalize}
          onClick={onFinalize}
          className={`w-full py-2.5 px-4 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
            summary.canFinalize
              ? 'bg-[#15803D] text-white hover:bg-[#166534] cursor-pointer'
              : 'bg-[#E5E1D8] text-[#7A8490] cursor-not-allowed'
          }`}
        >
          {summary.canFinalize ? '換地処分を完了する' : '全基準の達成で完了可能'}
        </button>
      </div>

      {/* Emergency Financing */}
      <div className="bg-white border border-[#DED9CE] rounded-lg p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#1A2026] flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-[#5A6572]" />
            資金調達の補助手段
          </span>
          <span className="font-mono-num text-[11px] text-[#64748B]">残 {2 - bondsIssued}回</span>
        </div>
        <button
          type="button"
          disabled={bondsIssued >= 2}
          onClick={onIssueBond}
          className={`w-full py-2 px-3 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
            bondsIssued < 2
              ? 'bg-[#FAF9F5] text-[#1A2026] border-[#D4CFC3] hover:bg-[#EAE6DC] cursor-pointer'
              : 'bg-[#F4F2EC] text-[#94A3B8] border-[#E5E1D8] cursor-not-allowed'
          }`}
        >
          都市整備公債を発行 (+¥600万)
        </button>
        <p className="text-[11px] text-[#64748B] leading-snug">
          基本は「保留地指定→接道→売却」で資金を回しますが、逼迫時は公債（毎期利子¥40万）を発行できます。
        </p>
      </div>
    </aside>
  );
}

function GoalRow({ met, label, value }: { met: boolean; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        {met ? (
          <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-[#94A3B8] shrink-0" />
        )}
        <span className={`truncate ${met ? 'text-[#1A2026] font-medium' : 'text-[#4A5562]'}`}>
          {label}
        </span>
      </div>
      <span
        className={`font-mono-num shrink-0 font-semibold ${
          met ? 'text-[#15803D]' : 'text-[#5A6572]'
        }`}
      >
        {value}
      </span>
    </li>
  );
}
