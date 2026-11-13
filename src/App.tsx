import { useCallback, useEffect, useMemo, useState } from 'react';
import { Undo2, Volume2, VolumeX } from 'lucide-react';
import { DistrictGrid } from './components/DistrictGrid';
import { EventModal } from './components/EventModal';
import { GuideModal } from './components/GuideModal';
import { LandownerPanel } from './components/LandownerPanel';
import { ResultModal } from './components/ResultModal';
import { ToolSidebar } from './components/ToolSidebar';
import { TitleScreen } from './components/TitleScreen';
import { SCENARIOS, TURN_EVENTS } from './data/scenarios';
import {
  TOOLS,
  ZONE_LABELS,
  computeDistrict,
  evaluateTileAction,
  initializeScenarioSynced,
} from './engine/simulation';
import {
  ComputedTile,
  EventChoice,
  FinanceLedger,
  GameState,
  Landowner,
  LogEntry,
  ScenarioConfig,
  Tile,
  ToolType,
  TurnEvent,
} from './types/game';
import { sound } from './utils/sound';

interface Snapshot {
  tiles: Tile[];
  landowners: Landowner[];
  budget: number;
  ap: number;
  ledger: FinanceLedger;
  logs: LogEntry[];
  townHallUsedThisTurn: boolean;
}

const EMPTY_LEDGER: FinanceLedger = {
  infrastructureSpend: 0,
  demolitionSpend: 0,
  compensationSpend: 0,
  reserveSalesIncome: 0,
  subsidyIncome: 0,
  bondDebt: 0,
  bondsIssued: 0,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [scenario, setScenario] = useState<ScenarioConfig>(SCENARIOS[0]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [landowners, setLandowners] = useState<Landowner[]>([]);
  const [turn, setTurn] = useState(1);
  const [budget, setBudget] = useState(0);
  const [ap, setAp] = useState(0);
  const [nextTurnApModifier, setNextTurnApModifier] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolType>('road_6m');
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [townHallUsedThisTurn, setTownHallUsedThisTurn] = useState(false);
  const [ledger, setLedger] = useState<FinanceLedger>(EMPTY_LEDGER);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [activeEvent, setActiveEvent] = useState<TurnEvent | null>(null);
  const [usedEventIds, setUsedEventIds] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [muted, setMuted] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [endReason, setEndReason] = useState('');

  const showToast = useCallback((msg: string) => {
    setFeedbackMsg(msg);
  }, []);

  useEffect(() => {
    if (!feedbackMsg) return;
    const timer = setTimeout(() => setFeedbackMsg(null), 3200);
    return () => clearTimeout(timer);
  }, [feedbackMsg]);

  const startScenario = useCallback((sc: ScenarioConfig) => {
    const init = initializeScenarioSynced(sc);
    setScenario(sc);
    setTiles(init.tiles);
    setLandowners(init.landowners);
    setTurn(1);
    setBudget(sc.startingBudget);
    setAp(sc.apPerTurn);
    setNextTurnApModifier(0);
    setActiveTool('road_6m');
    setSelectedTileId(null);
    setSelectedOwnerId(init.landowners[0]?.id || null);
    setHoveredTileId(null);
    setTownHallUsedThisTurn(false);
    setLedger(EMPTY_LEDGER);
    setLogs([
      {
        id: 'init',
        turn: 1,
        type: 'action',
        text: `${sc.title}の区画整理事業に着工しました。`,
      },
    ]);
    setUndoStack([]);
    setActiveEvent(null);
    setUsedEventIds([]);
    setEndReason('');
    setGameState('PLAYING');
    sound.playTurn();
  }, []);

  const { computedTiles, computedLandowners, summary } = useMemo(() => {
    if (tiles.length === 0) {
      return computeDistrict([], [], scenario);
    }
    return computeDistrict(tiles, landowners, scenario);
  }, [tiles, landowners, scenario]);

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-14),
      {
        tiles: tiles.map((t) => ({ ...t })),
        landowners: landowners.map((l) => ({ ...l })),
        budget,
        ap,
        ledger: { ...ledger },
        logs: [...logs],
        townHallUsedThisTurn,
      },
    ]);
  }, [tiles, landowners, budget, ap, ledger, logs, townHallUsedThisTurn]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setTiles(last.tiles);
    setLandowners(last.landowners);
    setBudget(last.budget);
    setAp(last.ap);
    setLedger(last.ledger);
    setLogs(last.logs);
    setTownHallUsedThisTurn(last.townHallUsedThisTurn);
    setUndoStack((prev) => prev.slice(0, -1));
    sound.playStamp();
    showToast('直前の施工操作を取り消しました。');
  }, [undoStack, showToast]);

  const handleSelectTool = useCallback(
    (tool: ToolType) => {
      setActiveTool(tool);
      if ((tool === 'replot_res' || tool === 'replot_com') && !selectedOwnerId && landowners[0]) {
        setSelectedOwnerId(landowners[0].id);
      }
    },
    [selectedOwnerId, landowners]
  );

  // Keyboard shortcuts 1-8 and Escape
  useEffect(() => {
    if (gameState !== 'PLAYING' || activeEvent) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Escape') {
        if (showGuide) setShowGuide(false);
        else setActiveTool('inspect');
        return;
      }
      const matchedTool = TOOLS.find((t) => t.shortcut === e.key);
      if (matchedTool) {
        handleSelectTool(matchedTool.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, activeEvent, showGuide, handleSelectTool]);

  const appendLog = useCallback(
    (type: LogEntry['type'], text: string, amount?: number) => {
      setLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          turn,
          type,
          text,
          amount,
        },
        ...prev.slice(0, 49),
      ]);
    },
    [turn]
  );

  const handleTileClick = useCallback(
    (tile: ComputedTile) => {
      if (gameState !== 'PLAYING' || activeEvent) return;

      setSelectedTileId(tile.id);

      // If inspecting, also highlight owner if tile has one
      if (activeTool === 'inspect') {
        if (tile.ownerId) {
          setSelectedOwnerId(tile.ownerId);
        }
        sound.playStamp();
        return;
      }

      // Clicking an already-designated reserve lot while using reserve tool selects it for quick sale
      if (activeTool === 'reserve' && tile.zone === 'reserve') {
        sound.playStamp();
        showToast(`保留地 ${tile.id} を選択しました。下部バーから売却できます。`);
        return;
      }

      const preview = evaluateTileAction(tile, activeTool, selectedOwnerId, budget, ap);
      if (!preview.allowed || !preview.newZone) {
        sound.playError();
        if (preview.reason) showToast(preview.reason);
        return;
      }

      pushUndo();

      const newZone = preview.newZone;
      const nextOwnerId =
        newZone === 'road_6m' ||
        newZone === 'road_12m' ||
        newZone === 'park' ||
        newZone === 'vacant' ||
        newZone === 'reserve'
          ? null
          : newZone === 'residential' || newZone === 'commercial'
          ? selectedOwnerId
          : tile.ownerId;

      setTiles((prev) =>
        prev.map((t) =>
          t.id === tile.id ? { ...t, zone: newZone, ownerId: nextOwnerId } : t
        )
      );
      setBudget((b) => b - preview.cost);
      setAp((a) => a - preview.apCost);

      const surcharge = preview.demolitionSurcharge ?? 0;
      const infraCost = preview.cost - surcharge;
      setLedger((prev) => ({
        ...prev,
        infrastructureSpend: prev.infrastructureSpend + infraCost,
        demolitionSpend: prev.demolitionSpend + surcharge,
      }));

      const ownerName = nextOwnerId
        ? landowners.find((o) => o.id === nextOwnerId)?.name
        : null;
      const actionMsg = ownerName
        ? `${tile.id} を「${ZONE_LABELS[newZone]}」（${ownerName}）へ換地`
        : `${tile.id} を「${ZONE_LABELS[newZone]}」に整備`;

      appendLog('action', actionMsg, -preview.cost);

      if (newZone === 'road_6m' || newZone === 'road_12m') sound.playRoad();
      else sound.playStamp();
    },
    [
      gameState,
      activeEvent,
      activeTool,
      selectedOwnerId,
      budget,
      ap,
      pushUndo,
      landowners,
      appendLog,
      showToast,
    ]
  );

  const handleSellReserve = useCallback(
    (tileId: string) => {
      const tile = computedTiles.find((t) => t.id === tileId);
      if (!tile || tile.zone !== 'reserve') return;
      if (tile.roadAccess === 'none' || !tile.roadNetworkConnected) {
        sound.playError();
        showToast('道路ネットワークに接続済みの保留地のみ売却できます。');
        return;
      }

      pushUndo();
      const salePrice = tile.totalValue;

      setTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, zone: 'reserve_sold', ownerId: null } : t))
      );
      setBudget((b) => b + salePrice);
      setLedger((prev) => ({
        ...prev,
        reserveSalesIncome: prev.reserveSalesIncome + salePrice,
      }));
      appendLog('finance', `保留地 ${tileId} を売却処分`, salePrice);
      sound.playSale();
      showToast(`保留地 ${tileId} を ¥${salePrice.toLocaleString()}万 で売却しました。`);
    },
    [computedTiles, pushUndo, appendLog, showToast]
  );

  const handleCompensateOwner = useCallback(
    (ownerId: string) => {
      const owner = landowners.find((o) => o.id === ownerId);
      if (!owner || owner.talkedThisTurn || budget < 150) return;

      pushUndo();
      setBudget((b) => b - 150);
      setLandowners((prev) =>
        prev.map((o) =>
          o.id === ownerId
            ? {
                ...o,
                compensationReceived: o.compensationReceived + 150,
                bonusApproval: o.bonusApproval + 10,
                talkedThisTurn: true,
              }
            : o
        )
      );
      setLedger((prev) => ({
        ...prev,
        compensationSpend: prev.compensationSpend + 150,
      }));
      appendLog('consensus', `${owner.name} へ移転・減歩補償交渉を実施`, -150);
      sound.playStamp();
      showToast(`${owner.name} の納得度が向上しました。`);
    },
    [landowners, budget, pushUndo, appendLog, showToast]
  );

  const handleHoldTownHall = useCallback(() => {
    if (townHallUsedThisTurn || budget < 100 || ap < 2) return;
    pushUndo();
    setBudget((b) => b - 100);
    setAp((a) => a - 2);
    setTownHallUsedThisTurn(true);
    setLandowners((prev) =>
      prev.map((o) => ({
        ...o,
        bonusApproval: o.bonusApproval + 7,
      }))
    );
    setLedger((prev) => ({
      ...prev,
      compensationSpend: prev.compensationSpend + 100,
    }));
    appendLog('consensus', '地区住民説明会を開催（全地権者の同意+7%）', -100);
    sound.playTurn();
    showToast('住民説明会を開催し、全地権者の理解が進みました。');
  }, [townHallUsedThisTurn, budget, ap, pushUndo, appendLog, showToast]);

  const handleIssueBond = useCallback(() => {
    if (ledger.bondsIssued >= 2) return;
    pushUndo();
    setBudget((b) => b + 600);
    setLedger((prev) => ({
      ...prev,
      bondDebt: prev.bondDebt + 600,
      bondsIssued: prev.bondsIssued + 1,
    }));
    appendLog('finance', '都市整備公債を発行（毎期利子 ¥40万）', 600);
    sound.playSale();
    showToast('都市整備公債を発行し ¥600万 を調達しました。');
  }, [ledger.bondsIssued, pushUndo, appendLog, showToast]);

  const handleAdvanceTurn = useCallback(() => {
    if (gameState !== 'PLAYING' || activeEvent) return;

    const nextTurn = turn + 1;
    const interest = ledger.bondsIssued * 40;
    const nextBudget = budget - interest;

    if (interest > 0) {
      setLedger((prev) => ({
        ...prev,
        compensationSpend: prev.compensationSpend + interest,
      }));
      setLogs((prev) => [
        {
          id: `int-${nextTurn}`,
          turn: nextTurn,
          type: 'finance',
          text: '都市整備公債の期別利払い',
          amount: -interest,
        },
        ...prev,
      ]);
    }

    // Check failure conditions
    if (nextTurn > scenario.maxTurns) {
      setBudget(nextBudget);
      setEndReason(
        `工期上限（全${scenario.maxTurns}期）を超過し、換地処分の法定手続きを完了できませんでした。`
      );
      setGameState('GAME_OVER');
      sound.playError();
      return;
    }

    const hasAnyReserveToSell = computedTiles.some(
      (t) => t.zone === 'reserve' && t.roadNetworkConnected
    );
    if (nextBudget < -200 && !hasAnyReserveToSell && ledger.bondsIssued >= 2) {
      setBudget(nextBudget);
      setEndReason('事業資金が枯渇し、これ以上の都市整備・補償の継続が困難となりました。');
      setGameState('GAME_OVER');
      sound.playError();
      return;
    }

    setBudget(nextBudget);
    setTurn(nextTurn);
    setAp(Math.max(2, scenario.apPerTurn + nextTurnApModifier));
    setNextTurnApModifier(0);
    setTownHallUsedThisTurn(false);
    setUndoStack([]); // Clear turn undo stack on new turn
    setLandowners((prev) => prev.map((o) => ({ ...o, talkedThisTurn: false })));
    sound.playTurn();

    // Trigger periodic strategic event on turns 3, 5, 7, 9, 11, 13
    if (nextTurn >= 3 && nextTurn % 2 === 1) {
      const available = TURN_EVENTS.filter((ev) => !usedEventIds.includes(ev.id));
      const pool = available.length > 0 ? available : TURN_EVENTS;
      const chosen = pool[(nextTurn + scenario.title.length) % pool.length];
      setActiveEvent(chosen);
      setUsedEventIds((prev) => [...prev, chosen.id]);
    }
  }, [
    gameState,
    activeEvent,
    turn,
    ledger.bondsIssued,
    budget,
    scenario,
    computedTiles,
    nextTurnApModifier,
    usedEventIds,
  ]);

  const handleEventChoice = useCallback(
    (choice: EventChoice) => {
      if (!activeEvent) return;

      let delta = choice.budgetDelta;

      if (choice.sellsOneReserve) {
        const target = computedTiles.find(
          (t) => t.zone === 'reserve' && t.roadAccess !== 'none' && t.roadNetworkConnected
        );
        if (target) {
          setTiles((prev) =>
            prev.map((t) =>
              t.id === target.id ? { ...t, zone: 'reserve_sold', ownerId: null } : t
            )
          );
          setLedger((prev) => ({
            ...prev,
            reserveSalesIncome: prev.reserveSalesIncome + delta,
          }));
        }
      } else if (delta > 0) {
        setLedger((prev) => ({ ...prev, subsidyIncome: prev.subsidyIncome + delta }));
      } else if (delta < 0) {
        setLedger((prev) => ({
          ...prev,
          compensationSpend: prev.compensationSpend + Math.abs(delta),
        }));
      }

      setBudget((b) => b + delta);

      if (choice.apNextTurnDelta) {
        setNextTurnApModifier((m) => m + (choice.apNextTurnDelta || 0));
      }

      if (choice.approvalDeltaAll || choice.targetPreferenceApprovalDelta) {
        setLandowners((prev) =>
          prev.map((o) => {
            let add = choice.approvalDeltaAll || 0;
            if (
              choice.targetPreferenceApprovalDelta &&
              o.preference === choice.targetPreferenceApprovalDelta.preference
            ) {
              add += choice.targetPreferenceApprovalDelta.delta;
            }
            return { ...o, bonusApproval: o.bonusApproval + add };
          })
        );
      }

      appendLog('event', `【${activeEvent.title}】${choice.label}`, delta);
      if (delta > 0) sound.playSale();
      else sound.playStamp();
      setActiveEvent(null);
    },
    [activeEvent, computedTiles, appendLog]
  );

  const handleFinalizeProject = useCallback(() => {
    if (!summary.canFinalize) return;
    if (budget < 0) {
      sound.playError();
      showToast('換地処分を完了するには事業収支を黒字（¥0以上）にする必要があります。保留地を売却してください。');
      return;
    }
    sound.playSale();
    setEndReason(
      `${scenario.title}において全区画の接道確保・公園整備・地権者合意および健全な事業収支を達成し、無事に換地処分を完了しました。`
    );
    setGameState('VICTORY');
  }, [summary.canFinalize, budget, scenario.title, showToast]);

  const toggleMute = () => {
    sound.muted = !muted;
    setMuted(!muted);
  };

  if (gameState === 'TITLE_MENU') {
    return (
      <>
        <TitleScreen
          onStartScenario={startScenario}
          onOpenGuide={() => setShowGuide(true)}
        />
        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  const hasConnectedReserve = computedTiles.some(
    (t) => t.zone === 'reserve' && t.roadAccess !== 'none' && t.roadNetworkConnected
  );

  return (
    <div className="min-h-screen drafting-canvas flex flex-col">
      {/* Top Bar: 3-zone contract */}
      <header className="bg-[#FAF9F5] border-b border-[#DED9CE] px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-[#1A2026] whitespace-nowrap shrink-0">
            換地設計 KANCHI
          </span>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#4A5562]">
            <span className="text-[#1A2026] font-semibold whitespace-nowrap shrink-0">
              {scenario.title}
            </span>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="hover:text-[#1A2026] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              設計マニュアル
            </button>
            <button
              type="button"
              onClick={() => startScenario(scenario)}
              className="hover:text-[#1A2026] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              最初からやり直す
            </button>
            <button
              type="button"
              onClick={() => setGameState('TITLE_MENU')}
              className="hover:text-[#1A2026] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              地区選択へ
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? '効果音をオンにする' : '効果音をミュートする'}
              className="inline-flex items-center gap-1 hover:text-[#1A2026] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{muted ? '消音' : '効果音'}</span>
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleAdvanceTurn}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              第{turn + 1}期へ進む
            </button>
          </div>
        </div>
      </header>

      {/* District Telemetry Strip */}
      <div className="bg-white border-b border-[#DED9CE] px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-[#64748B] mr-1.5">現在工期</span>
              <span className="font-mono-num font-bold text-sm text-[#1A2026]">
                第{turn} / {scenario.maxTurns}期
              </span>
            </div>
            <span className="text-[#DED9CE]" aria-hidden="true">|</span>
            <div>
              <span className="text-[#64748B] mr-1.5">事業資金</span>
              <span
                className={`font-mono-num font-bold text-sm ${
                  budget < 200 ? 'text-[#DC2626]' : 'text-[#1A2026]'
                }`}
              >
                ¥{budget.toLocaleString()}万
              </span>
            </div>
            <span className="text-[#DED9CE]" aria-hidden="true">|</span>
            <div>
              <span className="text-[#64748B] mr-1.5">今期行動力</span>
              <span className="font-mono-num font-bold text-sm text-[#1D4ED8]">
                {ap} / {scenario.apPerTurn} AP
              </span>
            </div>
            <span className="text-[#DED9CE]" aria-hidden="true">|</span>
            <div>
              <span className="text-[#64748B] mr-1.5">平均同意率</span>
              <span
                className={`font-mono-num font-bold text-sm ${
                  summary.overallApprovalPct >= scenario.targets.minApprovalPct
                    ? 'text-[#15803D]'
                    : 'text-[#B45309]'
                }`}
              >
                {summary.overallApprovalPct}%
              </span>
            </div>
            <span className="text-[#DED9CE]" aria-hidden="true">|</span>
            <div>
              <span className="text-[#64748B] mr-1.5">接道率</span>
              <span
                className={`font-mono-num font-bold text-sm ${
                  summary.roadAccessPct === 100 ? 'text-[#15803D]' : 'text-[#1A2026]'
                }`}
              >
                {summary.roadAccessPct}%
              </span>
            </div>
            <span className="text-[#DED9CE]" aria-hidden="true">|</span>
            <div>
              <span className="text-[#64748B] mr-1.5">平均地価上昇</span>
              <span
                className={`font-mono-num font-bold text-sm ${
                  summary.valueIncreasePct >= scenario.targets.minValueIncreasePct
                    ? 'text-[#15803D]'
                    : 'text-[#1A2026]'
                }`}
              >
                {summary.valueIncreasePct >= 0 ? '+' : ''}
                {summary.valueIncreasePct}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {feedbackMsg && (
              <span className="text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded">
                {feedbackMsg}
              </span>
            )}
            <button
              type="button"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors whitespace-nowrap shrink-0 ${
                undoStack.length > 0
                  ? 'bg-[#FAF9F5] text-[#1A2026] border-[#D4CFC3] hover:bg-[#EAE6DC] cursor-pointer'
                  : 'bg-[#F4F2EC] text-[#94A3B8] border-[#E5E1D8] cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              一手戻す
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Tactical Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[248px_1fr_320px] gap-5 items-start">
        <ToolSidebar
          activeTool={activeTool}
          selectedOwnerId={selectedOwnerId}
          landowners={computedLandowners}
          summary={summary}
          scenario={scenario}
          bondsIssued={ledger.bondsIssued}
          onSelectTool={handleSelectTool}
          onSelectOwner={(id) => setSelectedOwnerId(id)}
          onIssueBond={handleIssueBond}
          onFinalize={handleFinalizeProject}
        />

        <DistrictGrid
          tiles={computedTiles}
          landowners={computedLandowners}
          activeTool={activeTool}
          selectedTileId={selectedTileId}
          selectedOwnerId={selectedOwnerId}
          hoveredTileId={hoveredTileId}
          budget={budget}
          ap={ap}
          onTileClick={handleTileClick}
          onTileHover={setHoveredTileId}
          onSellReserve={handleSellReserve}
        />

        <LandownerPanel
          landowners={computedLandowners}
          selectedOwnerId={selectedOwnerId}
          budget={budget}
          ap={ap}
          townHallUsedThisTurn={townHallUsedThisTurn}
          ledger={ledger}
          logs={logs}
          onSelectOwner={(id) => setSelectedOwnerId(id)}
          onCompensateOwner={handleCompensateOwner}
          onHoldTownHall={handleHoldTownHall}
        />
      </main>

      {/* Modals */}
      {activeEvent && (
        <EventModal
          event={activeEvent}
          turn={turn}
          budget={budget}
          hasConnectedReserve={hasConnectedReserve}
          onSelectChoice={handleEventChoice}
        />
      )}

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {(gameState === 'VICTORY' || gameState === 'GAME_OVER') && (
        <ResultModal
          outcome={gameState}
          reason={endReason}
          scenario={scenario}
          turn={turn}
          budget={budget}
          summary={summary}
          ledger={ledger}
          onReplay={() => startScenario(scenario)}
          onBackToTitle={() => setGameState('TITLE_MENU')}
        />
      )}
    </div>
  );
}
