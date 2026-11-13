import { Building2, Factory, Home, LandPlot, ShieldAlert, TrainFront, Trees, Warehouse } from 'lucide-react';
import {
  ActionPreview,
  GRID_COLS,
  GRID_ROWS,
  ZONE_LABELS,
  evaluateTileAction,
  isRoadTile,
} from '../engine/simulation';
import { ComputedLandowner, ComputedTile, ToolType } from '../types/game';

interface DistrictGridProps {
  tiles: ComputedTile[];
  landowners: ComputedLandowner[];
  activeTool: ToolType;
  selectedTileId: string | null;
  selectedOwnerId: string | null;
  hoveredTileId: string | null;
  budget: number;
  ap: number;
  demolitionMultiplier?: number;
  onTileClick: (tile: ComputedTile) => void;
  onTileHover: (tileId: string | null) => void;
  onSellReserve: (tileId: string) => void;
}

export function DistrictGrid({
  tiles,
  landowners,
  activeTool,
  selectedTileId,
  selectedOwnerId,
  hoveredTileId,
  budget,
  ap,
  demolitionMultiplier = 1,
  onTileClick,
  onTileHover,
  onSellReserve,
}: DistrictGridProps) {
  const ownerMap = new Map(landowners.map((o) => [o.id, o]));

  const inspectedTile =
    tiles.find((t) => t.id === hoveredTileId) ||
    tiles.find((t) => t.id === selectedTileId) ||
    null;

  const hoverPreview: ActionPreview | null = inspectedTile
    ? evaluateTileAction(
        inspectedTile,
        activeTool,
        selectedOwnerId,
        budget,
        ap,
        demolitionMultiplier
      )
    : null;

  const selectedTile = tiles.find((t) => t.id === selectedTileId) || null;
  const selectedTileOwner = selectedTile?.ownerId ? ownerMap.get(selectedTile.ownerId) : null;
  const inspectedOwner = inspectedTile?.ownerId ? ownerMap.get(inspectedTile.ownerId) : null;

  // Helper to check road adjacency for seamless road connection rendering
  const hasRoadNeighbor = (x: number, y: number, dx: number, dy: number): boolean => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) return false;
    const nb = tiles[ny * GRID_COLS + nx];
    return isRoadTile(nb.zone);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main Blueprint Drafting Frame */}
      <div className="bg-white border border-[#DED9CE] rounded-lg p-3 sm:p-4 shadow-xs">
        {/* Top Coordinate Ruler A - J */}
        <div className="grid grid-cols-[24px_1fr] gap-1.5 mb-1.5">
          <div />
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: GRID_COLS }).map((_, idx) => (
              <div
                key={idx}
                className="text-center font-mono-num text-[11px] font-semibold text-[#64748B]"
              >
                {String.fromCharCode(65 + idx)}
              </div>
            ))}
          </div>
        </div>

        {/* Left Ruler + 10x8 Cadastral Grid */}
        <div className="grid grid-cols-[24px_1fr] gap-1.5">
          <div className="grid grid-rows-8 gap-1">
            {Array.from({ length: GRID_ROWS }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center font-mono-num text-[11px] font-semibold text-[#64748B]"
              >
                {idx + 1}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-10 gap-1 bg-[#E5E1D8] p-1 rounded border border-[#D4CFC3]"
            onMouseLeave={() => onTileHover(null)}
          >
            {tiles.map((tile) => {
              const owner = tile.ownerId ? ownerMap.get(tile.ownerId) : undefined;
              const isSelectedTile = tile.id === selectedTileId;
              const isHighlightedOwner =
                selectedOwnerId !== null && tile.ownerId === selectedOwnerId;
              const isHovered = tile.id === hoveredTileId;

              const preview = isHovered
                ? evaluateTileAction(
                    tile,
                    activeTool,
                    selectedOwnerId,
                    budget,
                    ap,
                    demolitionMultiplier
                  )
                : null;

              const nUp = hasRoadNeighbor(tile.x, tile.y, 0, -1);
              const nRight = hasRoadNeighbor(tile.x, tile.y, 1, 0);
              const nDown = hasRoadNeighbor(tile.x, tile.y, 0, 1);
              const nLeft = hasRoadNeighbor(tile.x, tile.y, -1, 0);

              // Base zone styling
              let tileBg = 'bg-[#FAF8F4]';
              if (tile.zone === 'old_wood') tileBg = 'bg-[#F5E6D3] hatch-wood';
              else if (tile.zone === 'alley') tileBg = 'bg-[#E5E7EB] hatch-alley';
              else if (tile.zone === 'farmland') tileBg = 'bg-[#E9F2DF]';
              else if (tile.zone === 'factory') tileBg = 'bg-[#E7E5E4]';
              else if (tile.zone === 'vacant') tileBg = 'bg-[#F8FAFC]';
              else if (tile.zone === 'road_6m') tileBg = 'bg-[#52606D]';
              else if (tile.zone === 'road_12m') tileBg = 'bg-[#334155]';
              else if (tile.zone === 'park') tileBg = 'bg-[#DCFCE7]';
              else if (tile.zone === 'residential') tileBg = 'bg-[#FEF9EC]';
              else if (tile.zone === 'commercial') tileBg = 'bg-[#FFEFE6]';
              else if (tile.zone === 'reserve') tileBg = 'bg-[#FEF3C7] hatch-reserve';
              else if (tile.zone === 'reserve_sold') tileBg = 'bg-[#EFF6FF]';
              else if (tile.zone === 'station') tileBg = 'bg-[#1E293B]';
              else if (tile.zone === 'arterial_entry') tileBg = 'bg-[#1E3A8A]';

              const showUnconnectedWarning =
                (tile.zone === 'road_6m' || tile.zone === 'road_12m') &&
                !tile.roadNetworkConnected;

              const isUnservicedParcel =
                tile.ownerId !== null &&
                (tile.roadAccess === 'none' || !tile.roadNetworkConnected || tile.zone === 'old_wood' || tile.zone === 'factory');

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => onTileClick(tile)}
                  onMouseEnter={() => onTileHover(tile.id)}
                  aria-label={`${tile.id} ${ZONE_LABELS[tile.zone]} ${owner ? owner.name : '公有地'}`}
                  className={`relative aspect-square min-h-[48px] rounded-[3px] flex flex-col items-center justify-center transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] cursor-pointer overflow-hidden ${tileBg} ${
                    isSelectedTile
                      ? 'ring-2 ring-[#1A2026] z-10'
                      : isHighlightedOwner
                      ? 'ring-2 ring-offset-1 z-10'
                      : 'border border-black/10'
                  } ${
                    isHovered && activeTool !== 'inspect'
                      ? preview?.allowed
                        ? 'ring-2 ring-[#1D4ED8] z-20 scale-[1.03]'
                        : 'ring-2 ring-[#DC2626] z-20'
                      : ''
                  }`}
                  style={
                    isHighlightedOwner && !isSelectedTile && owner
                      ? { boxShadow: `0 0 0 2px ${owner.color}` }
                      : undefined
                  }
                >
                  {/* Seamless Road Geometry Overlay */}
                  {(tile.zone === 'road_6m' || tile.zone === 'road_12m') && (
                    <svg
                      viewBox="0 0 40 40"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      aria-hidden="true"
                    >
                      {/* Center hub */}
                      <circle
                        cx="20"
                        cy="20"
                        r={tile.zone === 'road_12m' ? 3 : 2}
                        fill={tile.zone === 'road_12m' ? '#FBBF24' : '#E2E8F0'}
                      />
                      {nUp && (
                        <line
                          x1="20"
                          y1="0"
                          x2="20"
                          y2="20"
                          stroke={tile.zone === 'road_12m' ? '#FBBF24' : '#E2E8F0'}
                          strokeWidth={tile.zone === 'road_12m' ? 2.5 : 1.5}
                          strokeDasharray={tile.zone === 'road_12m' ? undefined : '3 3'}
                        />
                      )}
                      {nDown && (
                        <line
                          x1="20"
                          y1="20"
                          x2="20"
                          y2="40"
                          stroke={tile.zone === 'road_12m' ? '#FBBF24' : '#E2E8F0'}
                          strokeWidth={tile.zone === 'road_12m' ? 2.5 : 1.5}
                          strokeDasharray={tile.zone === 'road_12m' ? undefined : '3 3'}
                        />
                      )}
                      {nLeft && (
                        <line
                          x1="0"
                          y1="20"
                          x2="20"
                          y2="20"
                          stroke={tile.zone === 'road_12m' ? '#FBBF24' : '#E2E8F0'}
                          strokeWidth={tile.zone === 'road_12m' ? 2.5 : 1.5}
                          strokeDasharray={tile.zone === 'road_12m' ? undefined : '3 3'}
                        />
                      )}
                      {nRight && (
                        <line
                          x1="20"
                          y1="20"
                          x2="40"
                          y2="20"
                          stroke={tile.zone === 'road_12m' ? '#FBBF24' : '#E2E8F0'}
                          strokeWidth={tile.zone === 'road_12m' ? 2.5 : 1.5}
                          strokeDasharray={tile.zone === 'road_12m' ? undefined : '3 3'}
                        />
                      )}
                    </svg>
                  )}

                  {/* Zone Visual Icon / Architectural Footprint */}
                  <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                    {tile.zone === 'old_wood' && (
                      <Home className="w-4 h-4 text-[#78350F]" strokeWidth={2.2} />
                    )}
                    {tile.zone === 'alley' && (
                      <span className="text-[10px] font-mono-num font-semibold text-[#64748B]">
                        2m
                      </span>
                    )}
                    {tile.zone === 'farmland' && (
                      <LandPlot className="w-4 h-4 text-[#4D7C0F]" strokeWidth={1.8} />
                    )}
                    {tile.zone === 'factory' && (
                      <Factory className="w-4 h-4 text-[#57534E]" strokeWidth={2} />
                    )}
                    {tile.zone === 'park' && (
                      <Trees className="w-4 h-4 text-[#15803D]" strokeWidth={2.2} />
                    )}
                    {tile.zone === 'residential' && (
                      <Home className="w-4 h-4 text-[#B45309]" strokeWidth={2.2} />
                    )}
                    {tile.zone === 'commercial' && (
                      <Building2 className="w-4 h-4 text-[#C2410C]" strokeWidth={2.2} />
                    )}
                    {tile.zone === 'reserve' && (
                      <span className="text-[10px] font-bold text-[#B45309] bg-white/85 px-1 rounded">
                        保留
                      </span>
                    )}
                    {tile.zone === 'reserve_sold' && (
                      <Warehouse className="w-4 h-4 text-[#1D4ED8]" strokeWidth={2} />
                    )}
                    {tile.zone === 'station' && (
                      <div className="flex flex-col items-center text-white">
                        <TrainFront className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">駅</span>
                      </div>
                    )}
                    {tile.zone === 'arterial_entry' && (
                      <div className="flex flex-col items-center text-white">
                        <span className="text-[9px] font-bold tracking-tight">幹線</span>
                        <span className="text-[8px] opacity-85">接続点</span>
                      </div>
                    )}
                    {(tile.zone === 'road_6m' || tile.zone === 'road_12m') && (
                      <span className="text-[9px] font-mono-num font-bold text-white bg-black/40 px-1 rounded">
                        {tile.zone === 'road_12m' ? '12m' : '6m'}
                      </span>
                    )}
                  </div>

                  {/* Owner Initial Badge (Corner Stamp) */}
                  {owner && (
                    <span
                      className="absolute top-0.5 left-0.5 px-1 text-[9px] font-bold text-white rounded-[2px] leading-[13px] shadow-xs"
                      style={{ backgroundColor: owner.color }}
                    >
                      {owner.name.slice(0, 1)}
                    </span>
                  )}

                  {/* Unconnected / Hazard Indicator */}
                  {showUnconnectedWarning && (
                    <span
                      className="absolute top-0.5 right-0.5 text-[9px] font-bold bg-[#DC2626] text-white px-1 rounded-[2px] leading-[12px]"
                      title="既存幹線または駅に接続されていません"
                    >
                      !
                    </span>
                  )}
                  {!showUnconnectedWarning && isUnservicedParcel && (
                    <span
                      className="absolute bottom-0.5 right-0.5 text-[#DC2626]"
                      title="未接道または老朽区画"
                    >
                      <ShieldAlert className="w-3 h-3" />
                    </span>
                  )}

                  {/* Subtle Unit Value on Parcels */}
                  {!isRoadTile(tile.zone) &&
                    tile.zone !== 'alley' &&
                    tile.zone !== 'park' && (
                      <span className="mt-0.5 font-mono-num text-[9px] font-medium text-[#334155]">
                        ¥{tile.unitValue}
                      </span>
                    )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Legend Strip */}
        <div className="mt-3 pt-2.5 border-t border-[#ECE8DF] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4A5562]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#F5E6D3] border border-[#78350F]/40" />
              木密家屋
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#52606D]" />
              6m道路
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#334155]" />
              12m幹線
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DCFCE7] border border-[#15803D]/40" />
              公園
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FEF9EC] border border-[#B45309]/40" />
              整形宅地
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FFEFE6] border border-[#C2410C]/40" />
              立体商業
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FEF3C7] border border-[#D97706]/50" />
              保留地
            </span>
          </div>
          <span className="font-mono-num text-[#64748B]">1区画 = 100㎡ (約30坪) · 単価=万円/坪</span>
        </div>
      </div>

      {/* Active Tile Inspector & Contextual Action Bar */}
      <div className="bg-white border border-[#DED9CE] rounded-lg px-4 py-3 min-h-[76px] flex flex-wrap items-center justify-between gap-3">
        {inspectedTile ? (
          <>
            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5A6572]">
                <span className="font-mono-num font-bold text-[#1A2026]">{inspectedTile.id}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#1A2026]">{ZONE_LABELS[inspectedTile.zone]}</span>
                <span aria-hidden="true">·</span>
                <span>
                  所有:{' '}
                  <strong className="text-[#1A2026]">
                    {inspectedOwner ? inspectedOwner.name : '公有地・保留地枠'}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">
                  坪単価 ¥{inspectedTile.unitValue}万（評価 ¥{inspectedTile.totalValue.toLocaleString()}万）
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={
                    inspectedTile.roadAccess !== 'none' && inspectedTile.roadNetworkConnected
                      ? 'text-[#15803D] font-medium'
                      : 'text-[#DC2626] font-medium'
                  }
                >
                  {inspectedTile.roadAccess === 'road_12m' && inspectedTile.roadNetworkConnected
                    ? '● 12m幹線接道済'
                    : inspectedTile.roadAccess === 'road_6m' && inspectedTile.roadNetworkConnected
                    ? '● 6m道路接道済'
                    : inspectedTile.roadAccess !== 'none'
                    ? '▲ 道路未接続（拠点へ繋いでください）'
                    : '▲ 未接道（緊急車両進入不可）'}
                </span>
                {inspectedTile.adjacentPark && (
                  <>
                    <span aria-hidden="true" className="text-[#94A3B8]">·</span>
                    <span className="text-[#15803D]">公園隣接 +22%</span>
                  </>
                )}
                {inspectedTile.adjacentStationOrSold && (
                  <>
                    <span aria-hidden="true" className="text-[#94A3B8]">·</span>
                    <span className="text-[#1D4ED8]">駅/開発拠点隣接 +25%</span>
                  </>
                )}
                {inspectedTile.adjacentHazard && (
                  <>
                    <span aria-hidden="true" className="text-[#94A3B8]">·</span>
                    <span className="text-[#B45309]">老朽施設隣接 -12%</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Preview or Selected Reserve Sell Button */}
            <div className="flex items-center gap-3 shrink-0">
              {selectedTile &&
                selectedTile.zone === 'reserve' &&
                (selectedTile.roadAccess !== 'none' && selectedTile.roadNetworkConnected ? (
                  <button
                    type="button"
                    onClick={() => onSellReserve(selectedTile.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#D97706] rounded-md hover:bg-[#B45309] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    保留地 {selectedTile.id} を売却 (+¥{selectedTile.totalValue.toLocaleString()}万)
                  </button>
                ) : (
                  <span className="text-xs font-medium text-[#B45309]">
                    {selectedTile.id} の保留地売却には接続道路が必要です
                  </span>
                ))}

              {activeTool !== 'inspect' && hoverPreview && hoveredTileId && (
                <div className="text-right text-xs">
                  {hoverPreview.allowed ? (
                    <span className="font-mono-num font-semibold text-[#1D4ED8]">
                      施工可: ¥{hoverPreview.cost}万 · {hoverPreview.apCost}AP
                      {(hoverPreview.demolitionSurcharge ?? 0) > 0 && ` (解体費¥${hoverPreview.demolitionSurcharge}万含)`}
                    </span>
                  ) : (
                    <span className="text-[#DC2626] font-medium">{hoverPreview.reason}</span>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-xs text-[#5A6572]">
            <span>
              地図上の区画にカーソルを合わせるかクリックすると、路線価・接道状況・換地詳細が表示されます。
            </span>
            {selectedTile && selectedTile.zone === 'reserve' && selectedTile.roadNetworkConnected && (
              <button
                type="button"
                onClick={() => onSellReserve(selectedTile.id)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#D97706] rounded-md hover:bg-[#B45309] transition-colors whitespace-nowrap cursor-pointer"
              >
                選択中の保留地 {selectedTile.id} を売却 (+¥{selectedTile.totalValue.toLocaleString()}万)
              </button>
            )}
            {selectedTileOwner && selectedTile?.zone !== 'reserve' && (
              <span className="font-medium text-[#1A2026]">
                選択中: {selectedTile?.id} ({selectedTileOwner.name})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
