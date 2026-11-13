export type GameState = 'TITLE_MENU' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';

export type ZoneType =
  | 'old_wood'
  | 'alley'
  | 'farmland'
  | 'factory'
  | 'vacant'
  | 'road_6m'
  | 'road_12m'
  | 'park'
  | 'residential'
  | 'commercial'
  | 'reserve'
  | 'reserve_sold'
  | 'station'
  | 'arterial_entry';

export type ToolType =
  | 'inspect'
  | 'road_6m'
  | 'road_12m'
  | 'park'
  | 'clear'
  | 'replot_res'
  | 'replot_com'
  | 'reserve';

export type PreferenceType =
  | 'park_lover'
  | 'arterial_commercial'
  | 'keep_area'
  | 'vertical_ok'
  | 'safety_first';

export interface Landowner {
  id: string;
  name: string;
  role: string;
  color: string;
  preference: PreferenceType;
  preferenceText: string;
  beforeTilesCount: number;
  beforeValue: number;
  compensationReceived: number;
  bonusApproval: number;
  talkedThisTurn: boolean;
}

export interface ComputedLandowner extends Landowner {
  afterTilesCount: number;
  effectiveFootprint: number;
  genbuRate: number;
  afterValue: number;
  valueGainRate: number;
  roadAccessRate: number;
  preferenceMet: boolean;
  approval: number;
  status: 'agreed' | 'pending' | 'opposed';
}

export interface Tile {
  x: number;
  y: number;
  id: string;
  zone: ZoneType;
  ownerId: string | null;
  beforeOwnerId: string | null;
  isFixed: boolean;
}

export interface ComputedTile extends Tile {
  unitValue: number;
  totalValue: number;
  roadAccess: 'none' | 'road_6m' | 'road_12m';
  roadNetworkConnected: boolean;
  adjacentPark: boolean;
  adjacentStationOrSold: boolean;
  adjacentHazard: boolean;
  fireSafe: boolean;
}

export interface DistrictSummary {
  averageUnitValue: number;
  beforeAverageUnitValue: number;
  valueIncreasePct: number;
  roadAccessPct: number;
  fireSafetyPct: number;
  overallApprovalPct: number;
  agreedCount: number;
  opposedCount: number;
  criticalCount: number;
  parkCount: number;
  reserveCount: number;
  soldReserveCount: number;
  unservicedParcelCount: number;
  averageGenbuRate: number;
  goalsMet: {
    roadAccess: boolean;
    approval: boolean;
    parks: boolean;
    valueGain: boolean;
    noOpposed: boolean;
    allClear: boolean;
  };
  canFinalize: boolean;
}

export interface ScenarioConfig {
  id: string;
  title: string;
  subtitle: string;
  difficulty: '初級' | '中級' | '上級';
  description: string;
  imagePath: string;
  startingBudget: number;
  apPerTurn: number;
  maxTurns: number;
  baseUnitValue: number;
  demolitionMultiplier?: number;
  strictConsensus?: boolean;
  targets: {
    minApprovalPct: number;
    minParks: number;
    minValueIncreasePct: number;
  };
  landowners: Omit<Landowner, 'beforeTilesCount' | 'beforeValue' | 'compensationReceived' | 'bonusApproval' | 'talkedThisTurn'>[];
  initialLayout: string[]; // 8 rows of 10 chars
  ownerMap: Record<string, string>; // char -> ownerId or custom grid mapping
  initialOwnerLayout: string[]; // 8 rows of 10 chars ('-' for none, '1'..'7' for landowner index)
}

export interface EventChoice {
  label: string;
  description: string;
  budgetDelta: number;
  apNextTurnDelta?: number;
  approvalDeltaAll?: number;
  targetPreferenceApprovalDelta?: { preference: PreferenceType; delta: number };
  requiresReserveConnected?: boolean;
  sellsOneReserve?: boolean;
}

export interface TurnEvent {
  id: string;
  title: string;
  category: string;
  description: string;
  choices: EventChoice[];
}

export interface LogEntry {
  id: string;
  turn: number;
  type: 'action' | 'finance' | 'event' | 'consensus';
  text: string;
  amount?: number;
}

export interface FinanceLedger {
  infrastructureSpend: number;
  demolitionSpend: number;
  compensationSpend: number;
  reserveSalesIncome: number;
  subsidyIncome: number;
  bondDebt: number;
  bondsIssued: number;
}
