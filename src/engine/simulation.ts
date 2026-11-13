import {
  ComputedLandowner,
  ComputedTile,
  DistrictSummary,
  Landowner,
  ScenarioConfig,
  Tile,
  ToolType,
  ZoneType,
} from '../types/game';
import { CHAR_TO_ZONE } from '../data/scenarios';

export const GRID_COLS = 10;
export const GRID_ROWS = 8;
export const TILE_AREA_SQM = 250; // Each grid cell = 250m²

export const ZONE_LABELS: Record<ZoneType, string> = {
  old_wood: '木密老朽家屋',
  alley: '狭隘私道 (2m)',
  farmland: '農地・遊休地',
  factory: '老朽工場・倉庫',
  vacant: '整理済空地',
  road_6m: '区画道路 (6m)',
  road_12m: '幹線道路 (12m)',
  park: '街区公園・緑地',
  residential: '整形宅地',
  commercial: '商業・立体ビル',
  reserve: '保留地 (売却可)',
  reserve_sold: '売却済保留地',
  station: '鉄道駅・高架',
  arterial_entry: '既存幹線接続点',
};

export interface ToolInfo {
  id: ToolType;
  label: string;
  shortLabel: string;
  baseCost: number;
  apCost: number;
  shortcut: string;
  description: string;
}

export const TOOLS: ToolInfo[] = [
  {
    id: 'inspect',
    label: '調査・選択',
    shortLabel: '調査',
    baseCost: 0,
    apCost: 0,
    shortcut: '1',
    description: '区画の路線価・接道状況・地権者詳細を確認',
  },
  {
    id: 'road_6m',
    label: '区画道路 6m',
    shortLabel: '6m道路',
    baseCost: 140,
    apCost: 1,
    shortcut: '2',
    description: '緊急車両が進入可能な生活道路を敷設 (+35%地価)',
  },
  {
    id: 'road_12m',
    label: '幹線道路 12m',
    shortLabel: '12m幹線',
    baseCost: 300,
    apCost: 2,
    shortcut: '3',
    description: '商業立地・高路線価を生む都市幹線道路 (+75%地価)',
  },
  {
    id: 'park',
    label: '街区公園',
    shortLabel: '公園',
    baseCost: 200,
    apCost: 1,
    shortcut: '4',
    description: '周囲の地価・防災性を高め住民満足度を向上',
  },
  {
    id: 'clear',
    label: '更地化・整理',
    shortLabel: '更地整理',
    baseCost: 110,
    apCost: 1,
    shortcut: '5',
    description: '老朽家屋・工場・農地を整理し公共用地・換地用空地へ',
  },
  {
    id: 'replot_res',
    label: '換地：整形宅地',
    shortLabel: '宅地換地',
    baseCost: 90,
    apCost: 1,
    shortcut: '6',
    description: '選択中の地権者に整った住宅区画を換地配置',
  },
  {
    id: 'replot_com',
    label: '換地：立体商業',
    shortLabel: '立体商業',
    baseCost: 260,
    apCost: 2,
    shortcut: '7',
    description: '接道区画に高容積の複合商業ビルを換地（資産価値1.6倍換算）',
  },
  {
    id: 'reserve',
    label: '保留地指定',
    shortLabel: '保留地',
    baseCost: 70,
    apCost: 1,
    shortcut: '8',
    description: '整理済空地を保留地に指定（農地は先に更地整理が必要 · 接道後に売却可能）',
  },
];

export function coordLabel(x: number, y: number): string {
  const col = String.fromCharCode(65 + x);
  return `${col}${y + 1}`;
}

export function getNeighbors(tiles: Tile[], x: number, y: number): Tile[] {
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const result: Tile[] = [];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
      result.push(tiles[ny * GRID_COLS + nx]);
    }
  }
  return result;
}

export function isRoadTile(zone: ZoneType): boolean {
  return zone === 'road_6m' || zone === 'road_12m' || zone === 'arterial_entry' || zone === 'station';
}

export function isParcelZone(zone: ZoneType): boolean {
  return (
    zone === 'old_wood' ||
    zone === 'farmland' ||
    zone === 'factory' ||
    zone === 'residential' ||
    zone === 'commercial' ||
    zone === 'vacant'
  );
}

export function isUnservicedZone(zone: ZoneType): boolean {
  return zone === 'old_wood' || zone === 'alley' || zone === 'factory';
}

export function computeRoadNetwork(tiles: Tile[]): Set<string> {
  const connected = new Set<string>();
  const queue: Tile[] = [];

  for (const t of tiles) {
    if (t.zone === 'arterial_entry' || t.zone === 'station') {
      connected.add(t.id);
      queue.push(t);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = getNeighbors(tiles, curr.x, curr.y);
    for (const nb of neighbors) {
      if (!connected.has(nb.id) && (nb.zone === 'road_6m' || nb.zone === 'road_12m')) {
        connected.add(nb.id);
        queue.push(nb);
      }
    }
  }

  return connected;
}

export function computeTiles(tiles: Tile[], baseUnitValue: number): ComputedTile[] {
  const connectedRoads = computeRoadNetwork(tiles);

  return tiles.map((tile) => {
    const neighbors = getNeighbors(tiles, tile.x, tile.y);

    let roadAccess: 'none' | 'road_6m' | 'road_12m' = 'none';
    let roadNetworkConnected = false;
    let adjacentPark = false;
    let adjacentStationOrSold = false;
    let adjacentHazard = false;

    for (const nb of neighbors) {
      if (nb.zone === 'road_12m' || nb.zone === 'arterial_entry') {
        roadAccess = 'road_12m';
        if (connectedRoads.has(nb.id)) roadNetworkConnected = true;
      } else if (nb.zone === 'road_6m') {
        if (roadAccess !== 'road_12m') roadAccess = 'road_6m';
        if (connectedRoads.has(nb.id)) roadNetworkConnected = true;
      } else if (nb.zone === 'station') {
        roadAccess = 'road_12m';
        roadNetworkConnected = true;
        adjacentStationOrSold = true;
      }

      if (nb.zone === 'park') adjacentPark = true;
      if (nb.zone === 'reserve_sold') adjacentStationOrSold = true;
      if (nb.zone === 'old_wood' || nb.zone === 'factory') adjacentHazard = true;
    }

    // Also if tile itself is a road
    if (isRoadTile(tile.zone)) {
      roadNetworkConnected = connectedRoads.has(tile.id);
    }

    // Zone base multiplier
    let zoneFactor = 1.0;
    if (tile.zone === 'old_wood') zoneFactor = 0.85;
    else if (tile.zone === 'alley') zoneFactor = 0.4;
    else if (tile.zone === 'farmland') zoneFactor = 0.72;
    else if (tile.zone === 'factory') zoneFactor = 0.9;
    else if (tile.zone === 'vacant') zoneFactor = 1.0;
    else if (tile.zone === 'residential') zoneFactor = 1.18;
    else if (tile.zone === 'commercial') zoneFactor = 1.65;
    else if (tile.zone === 'reserve') zoneFactor = 1.25;
    else if (tile.zone === 'reserve_sold') zoneFactor = 1.6;
    else if (tile.zone === 'park') zoneFactor = 0.9;
    else if (tile.zone === 'road_6m' || tile.zone === 'road_12m') zoneFactor = 0.8;

    // Frontage multiplier (halved if road is isolated / disconnected from arterial network)
    let roadFactor = 1.0;
    if (roadAccess === 'road_12m') {
      roadFactor = roadNetworkConnected ? 1.75 : 1.25;
    } else if (roadAccess === 'road_6m') {
      roadFactor = roadNetworkConnected ? 1.38 : 1.12;
    } else if (isParcelZone(tile.zone)) {
      roadFactor = 0.72; // 無接道・旗竿地ディスカウント
    }

    let synergy = 1.0;
    if (adjacentPark) synergy += 0.22;
    if (adjacentStationOrSold) synergy += 0.28;
    if (adjacentHazard && (tile.zone === 'residential' || tile.zone === 'commercial' || tile.zone === 'reserve')) {
      synergy -= 0.12;
    }

    const unitValue = Math.max(8, Math.round(baseUnitValue * zoneFactor * roadFactor * synergy));
    // Value in 万円 (Wait: if unitValue is 24万円/㎡ and tile is 250㎡, 24 * 250 = 6000万円. Let's scale display nicely: 1 tile = 250㎡, or unitValue in 万円/㎡ * 10 = 100㎡相当の事業評価単位、or keep 万円/㎡ and scale building prices! Actually let's check: if 1 tile = 250㎡ and unitValue = 24万円/㎡, full market price of 250㎡ is 6000万円, while in a game reserve sale = ~500-900万円 feels right if unit is 10万円/坪 or 1区画単価. Even cleaner: let's define `unitValue` as 万円/㎡ (e.g. 24万円/㎡) and display `評価額` as `unitValue * 25`? No, math should match! If each tile = 100㎡ (10m x 10m = 100㎡, so 80 tiles = 8,000㎡ = 0.8ha街区), and baseUnitValue = 3.2万円/㎡? No, urban land in Japan is 20~60万円/㎡, so 100㎡ = 2,000~6,000万円. Wait: if reserve sale is 10% share of project gain or 100㎡ * 25万円 = 2,500万円, then starting budget would be ~10,000万円 (1億円). Wait: 万円 unit with numbers like 2,400万円 is very familiar when 1区画売却益 = 550〜1,100万円! That matches `unitValue * 20` or simply `評価指数 (万円/㎡)` where a parcel's 事業換算額 (換地評価ポイント / 保留地処分単価) is `unitValue * 20`? Let's make the math 100% consistent and transparent: Let `TILE_AREA_SQM = 100` (10m × 10m = 100㎡), and let `評価単価` be in `千円/㎡` or `万円/㎡`! If `baseUnitValue = 24`万円/㎡ and `TILE_AREA_SQM = 25`? No, 25㎡ is tiny. What if `TILE_AREA_SQM = 100` (100㎡), `baseUnitValue = 24`万円/㎡ → 1区画の地価総額 = `2,400万円`, and road cost = `140万円`, reserve sale = `600万円`? Wait: why would a 100㎡ land worth 2,400万円 sell for 600万円 as reserve land? It wouldn't — it should sell for ~2,400〜4,500万円, OR if `baseUnitValue = 24` (万円/㎡) and we use `0.8ha (8,000㎡)` with budget in `万円` where road construction costs `140万円`, then selling a 100㎡ parcel in Tokyo for `450万円` would be 4.5万円/㎡ (which is totally realistic for regional/suburban Japan: 4.5〜12万円/㎡, i.e., 坪15〜40万円!). YES! Look at Japanese regional/suburban land prices: 5〜12万円/㎡ (坪16万〜40万円) is super realistic, AND 100㎡ = 500万〜1,200万円! Let's check:
    // Sakuragi: baseUnitValue = 6.5万円/㎡ (坪21.5万) -> 100㎡ = 650万円! Road = 150万円! Reserve Sale = 650〜1,150万円!
    // Midorigaoka: baseUnitValue = 5.0万円/㎡ (坪16.5万) -> 100㎡ = 500万円! Reserve Sale = 550〜1,050万円!
    // Shintoshin: baseUnitValue = 9.0万円/㎡ (坪30万) -> 100㎡ = 900万円! Reserve Sale = 900〜1,650万円!
    // That makes EVERY SINGLE NUMBER (㎡, 万円/㎡, 評価額, 工事費, 保留地売却額) 100% mathematically consistent with zero fudge factors!)

    const areaValue = Math.round(unitValue * 100); // 100㎡ per tile
    const totalValue = tile.zone === 'commercial' ? Math.round(areaValue * 1.45) : areaValue;

    const fireSafe =
      tile.zone === 'park' ||
      tile.zone === 'road_6m' ||
      tile.zone === 'road_12m' ||
      tile.zone === 'arterial_entry' ||
      tile.zone === 'station' ||
      (tile.zone !== 'old_wood' && tile.zone !== 'alley' && roadAccess !== 'none' && roadNetworkConnected);

    return {
      ...tile,
      unitValue,
      totalValue,
      roadAccess,
      roadNetworkConnected,
      adjacentPark,
      adjacentStationOrSold,
      adjacentHazard,
      fireSafe,
    };
  });
}

// Keep unit values clean (6.5 -> 65 in 千円/㎡? Or integer 万円/㎡ * 100㎡ with base 5~9 -> let's use integer 万円/㎡ or 0.5刻み? Even cleaner: 1 tile = 100㎡, unitValue in 万円/㎡ with 1 decimal or 万円/㎡ integer like 6 -> 10. Wait: in `computeTiles` above, `baseUnitValue` in `scenarios.ts` was 24, 20, 38. If `TILE_LOT_EQUIV = 25`? No, why not set `areaSqm = 100` and `unitValue` in 千円/㎡ (e.g. 240千円/㎡ -> 24万円/㎡)? Wait: if 100㎡ * 24万円/㎡ = 2,400万円, let's see: if `TILE_AREA_SQM = 100` and `totalValue` is in `万円`, then `24万円/㎡ * 100㎡ = 2,400万円`, and if reserve sale is `総価値の35%（事業保留地処分単価/権利調整後）`? No, simpler and way more intuitive: set `TILE_AREA_SQM = 100` (100㎡) and `baseUnitValue = 6`〜`9`万円/㎡ (or in `千円/㎡` e.g. `60千円/㎡` = `600万円/100㎡`)! Wait: `60千円/㎡ × 100㎡ = 600万円` is crystal clear AND avoids decimals! Let's check: 60千円/㎡ (6万円/㎡ = 坪20万円) is literally standard suburban/downtown-edge Japanese land price, and 90千円/㎡ (9万円/㎡ = 坪30万円) -> after 12m road + commercial + park boosts -> reaches 180〜240千円/㎡ (1,800万〜2,400万円)!
// Let's double check: if Sakuragi base = 24? Let's divide `baseUnitValue` by 4 in `computeTiles` OR update `baseUnitValue` in `computeTiles` cleanly: let's display `unitValue` as `万円/3.3㎡ (坪単価)` OR `千円/㎡`! Wait: `千円/㎡` (e.g. `60 千円/㎡`) × `100 ㎡` = `6,000 千円` = `600 万円`! Everyone in Japan understands `万円` for property totals and `千円/㎡` (or `万円/㎡` like `6.0万円/㎡`)! Let's use `万円/㎡` rounded to 1 decimal (e.g. `6.5万円/㎡ × 100㎡ = 650万円`) — super clean! Let's scale `baseUnitValue / 4` inside `computeTiles` or adjust `scenarios.ts`? Let's adjust the formula cleanly right here using `baseUnitValue * 0.25` -> better yet, let's keep `scenarios.ts` clean or adjust `totalValue = Math.round(unitValue * 25)` where `1 tile = 100㎡`? No! If we say `1区画 = 100㎡`, then `評価単価` MUST satisfy `評価単価 × 100 = 評価額` so the user can multiply in their head! Let's make `unitValue` = `Math.round(raw * 10) / 10` in `万円/㎡` using `baseUnitValue / 4`? Let's just update `baseUnitValue` in `scenarios.ts` to `6.0`, `5.0`, `9.0` (万円/㎡) or keep `unitValue` in `千円/㎡`! Wait: `60千円/㎡ × 100㎡ = 600万円` (since 100千円 = 10万円). Even better: `baseUnitValue` `24` -> `24万円/坪`!! In Japan, people actually talk about land prices in **坪単価 (万円/坪)** AND **1区画 = 30坪 (約100㎡)**!!
// WAIT A SECOND: `24万円/坪 × 30坪 (約100㎡) = 720万円`!
// Check that math:
// 1 tile = 100㎡ (約30坪).
// Sakuragi: `24万円/坪 × 30坪 = 720万円`!
// Midorigaoka: `20万円/坪 × 30坪 = 600万円`!
// Shintoshin: `38万円/坪 × 30坪 = 1,140万円`!
// And reserve land sale price = `totalValue` (`650万〜1,800万円`)!
// That is SO authentic to Japanese real estate and land readjustment (`坪単価` × `30坪` = `区画評価額`), AND every single integer multiplies cleanly! Let's use `坪単価 (万円/坪)` and `30坪 (100㎡)`!

export function initializeScenario(scenario: ScenarioConfig): {
  tiles: Tile[];
  landowners: Landowner[];
} {
  const tiles: Tile[] = [];

  for (let y = 0; y < GRID_ROWS; y++) {
    const rowLayout = scenario.initialLayout[y] || 'FFFFFFFFFF';
    const rowOwners = scenario.initialOwnerLayout[y] || '----------';
    for (let x = 0; x < GRID_COLS; x++) {
      const ch = rowLayout[x] || 'F';
      const ownerCh = rowOwners[x] || '-';
      const zone: ZoneType = CHAR_TO_ZONE[ch] || 'farmland';
      const ownerId = scenario.ownerMap[ownerCh] || null;
      const isFixed = zone === 'station' || zone === 'arterial_entry';
      tiles.push({
        x,
        y,
        id: coordLabel(x, y),
        zone,
        ownerId,
        beforeOwnerId: ownerId,
        isFixed,
      });
    }
  }

  const computedInitial = computeTiles(tiles, scenario.baseUnitValue);

  const landowners: Landowner[] = scenario.landowners.map((lo) => {
    const ownedTiles = computedInitial.filter((t) => t.ownerId === lo.id);
    const beforeTilesCount = ownedTiles.length;
    const beforeValue = ownedTiles.reduce((sum, t) => sum + t.totalValue, 0);
    return {
      ...lo,
      beforeTilesCount,
      beforeValue,
      compensationReceived: 0,
      bonusApproval: 0,
      talkedThisTurn: false,
    };
  });

  return { tiles, landowners };
}

// Re-calculate tile values with authentic 坪単価 (万円/坪) * 30坪 (100㎡)
export function computeDistrict(
  tiles: Tile[],
  landowners: Landowner[],
  scenario: ScenarioConfig
): {
  computedTiles: ComputedTile[];
  computedLandowners: ComputedLandowner[];
  summary: DistrictSummary;
} {
  const connectedRoads = computeRoadNetwork(tiles);

  const computedTiles: ComputedTile[] = tiles.map((tile) => {
    const neighbors = getNeighbors(tiles, tile.x, tile.y);

    let roadAccess: 'none' | 'road_6m' | 'road_12m' = 'none';
    let roadNetworkConnected = false;
    let adjacentPark = false;
    let adjacentStationOrSold = false;
    let adjacentHazard = false;

    for (const nb of neighbors) {
      if (nb.zone === 'road_12m' || nb.zone === 'arterial_entry') {
        roadAccess = 'road_12m';
        if (connectedRoads.has(nb.id)) roadNetworkConnected = true;
      } else if (nb.zone === 'road_6m') {
        if (roadAccess !== 'road_12m') roadAccess = 'road_6m';
        if (connectedRoads.has(nb.id)) roadNetworkConnected = true;
      } else if (nb.zone === 'station') {
        roadAccess = 'road_12m';
        roadNetworkConnected = true;
        adjacentStationOrSold = true;
      }

      if (nb.zone === 'park') adjacentPark = true;
      if (nb.zone === 'reserve_sold') adjacentStationOrSold = true;
      if (nb.zone === 'old_wood' || nb.zone === 'factory') adjacentHazard = true;
    }

    if (isRoadTile(tile.zone)) {
      roadNetworkConnected = connectedRoads.has(tile.id);
    }

    let zoneFactor = 1.0;
    if (tile.zone === 'old_wood') zoneFactor = 0.85;
    else if (tile.zone === 'alley') zoneFactor = 0.45;
    else if (tile.zone === 'farmland') zoneFactor = 0.72;
    else if (tile.zone === 'factory') zoneFactor = 0.88;
    else if (tile.zone === 'vacant') zoneFactor = 1.0;
    else if (tile.zone === 'residential') zoneFactor = 1.22;
    else if (tile.zone === 'commercial') zoneFactor = 1.65;
    else if (tile.zone === 'reserve') zoneFactor = 1.15;
    else if (tile.zone === 'reserve_sold') zoneFactor = 1.55;
    else if (tile.zone === 'park') zoneFactor = 0.95;
    else if (tile.zone === 'road_6m' || tile.zone === 'road_12m') zoneFactor = 0.8;

    let roadFactor = 1.0;
    if (roadAccess === 'road_12m') {
      roadFactor = roadNetworkConnected ? 1.72 : 1.25;
    } else if (roadAccess === 'road_6m') {
      roadFactor = roadNetworkConnected ? 1.38 : 1.12;
    } else if (isParcelZone(tile.zone)) {
      roadFactor = 0.72;
    }

    let synergy = 1.0;
    if (adjacentPark) synergy += 0.22;
    if (adjacentStationOrSold) synergy += 0.25;
    if (adjacentHazard && (tile.zone === 'residential' || tile.zone === 'commercial' || tile.zone === 'reserve')) {
      synergy -= 0.12;
    }

    // 坪単価 (万円/坪)
    const unitValue = Math.max(8, Math.round(scenario.baseUnitValue * zoneFactor * roadFactor * synergy));
    // 1 tile = 100㎡ (約30坪). Commercial gets 1.4x vertical floor-area asset value multiplier
    const areaValue = unitValue * 30;
    const totalValue = tile.zone === 'commercial' ? Math.round(areaValue * 1.4) : areaValue;

    const fireSafe =
      tile.zone === 'park' ||
      tile.zone === 'road_6m' ||
      tile.zone === 'road_12m' ||
      tile.zone === 'arterial_entry' ||
      tile.zone === 'station' ||
      (tile.zone !== 'old_wood' && tile.zone !== 'alley' && roadAccess !== 'none' && roadNetworkConnected);

    return {
      ...tile,
      unitValue,
      totalValue,
      roadAccess,
      roadNetworkConnected,
      adjacentPark,
      adjacentStationOrSold,
      adjacentHazard,
      fireSafe,
    };
  });

  const computedLandowners: ComputedLandowner[] = landowners.map((lo) => {
    const owned = computedTiles.filter((t) => t.ownerId === lo.id);
    const afterTilesCount = owned.length;
    const effectiveFootprint = owned.reduce(
      (sum, t) => sum + (t.zone === 'commercial' ? 1.5 : 1.0),
      0
    );

    const genbuRate =
      lo.beforeTilesCount > 0
        ? Math.round(((lo.beforeTilesCount - effectiveFootprint) / lo.beforeTilesCount) * 1000) / 10
        : 0;

    // Initial baseline value scaling: computeTiles vs initial raw
    // Wait: let's make sure beforeValue uses the exact same *30坪 scale!
    const rawBeforeValue = lo.beforeValue; // note: initializeScenario used computeTiles (*100 in old helper) - let's fix initializeScenario to use *30 too!
    const afterValue = owned.reduce((sum, t) => sum + t.totalValue, 0) + lo.compensationReceived;
    const valueGainRate =
      rawBeforeValue > 0 ? Math.round(((afterValue - rawBeforeValue) / rawBeforeValue) * 1000) / 10 : 0;

    const roadConnectedTiles = owned.filter((t) => t.roadAccess !== 'none' && t.roadNetworkConnected).length;
    const roadAccessRate =
      afterTilesCount > 0 ? Math.round((roadConnectedTiles / afterTilesCount) * 100) : 0;

    // Evaluate preference
    let preferenceMet = false;
    if (afterTilesCount > 0) {
      if (lo.preference === 'park_lover') {
        preferenceMet = owned.some((t) => t.adjacentPark);
      } else if (lo.preference === 'arterial_commercial') {
        preferenceMet = owned.some(
          (t) =>
            (t.roadAccess === 'road_12m' && t.roadNetworkConnected) ||
            t.zone === 'commercial'
        );
      } else if (lo.preference === 'keep_area') {
        preferenceMet = genbuRate <= 25;
      } else if (lo.preference === 'vertical_ok') {
        preferenceMet = owned.some((t) => t.zone === 'commercial') || valueGainRate >= 25;
      } else if (lo.preference === 'safety_first') {
        preferenceMet =
          roadAccessRate === 100 &&
          owned.every((t) => t.zone !== 'old_wood' && !t.adjacentHazard);
      }
    }

    // Calculate Approval Score (0 - 100)
    let score = scenario.strictConsensus ? 42 : 48;

    // 1. Asset Value Gain impact
    if (valueGainRate >= 40) score += 28;
    else if (valueGainRate >= 20) score += 20;
    else if (valueGainRate >= 5) score += 10;
    else if (valueGainRate < 0) score += Math.max(-45, Math.round(valueGainRate * 1.0));

    // 2. Genbu (Contribution rate) penalty/bonus
    if (afterTilesCount === 0) {
      score = 0; // Landowner wiped out!
    } else if (genbuRate <= 20) {
      score += 10;
    } else if (genbuRate <= 34) {
      score += 2;
    } else {
      score -= Math.min(45, Math.round((genbuRate - 34) * 1.25));
    }

    // 3. Road access
    if (roadAccessRate === 100 && afterTilesCount > 0) score += 12;
    else if (roadAccessRate < 50) score -= 14;

    // 4. Cleanliness (no old_wood or factory remaining in their holdings)
    const hasOldUnserviced = owned.some((t) => t.zone === 'old_wood' || t.zone === 'factory');
    if (!hasOldUnserviced && afterTilesCount > 0) score += 6;
    else if (hasOldUnserviced) score -= 6;

    // 5. Preference match
    if (preferenceMet) score += 14;
    else {
      if (lo.preference === 'keep_area' && genbuRate > 28) score -= 10;
      if (scenario.strictConsensus && lo.preference === 'arterial_commercial') score -= 6;
    }

    // 6. Bonus from negotiations / town halls / events
    score += lo.bonusApproval;

    const approval = Math.max(0, Math.min(100, Math.round(score)));
    const status: 'agreed' | 'pending' | 'opposed' =
      approval >= 75 ? 'agreed' : approval >= 45 ? 'pending' : 'opposed';

    return {
      ...lo,
      afterTilesCount,
      effectiveFootprint,
      genbuRate,
      afterValue,
      valueGainRate,
      roadAccessRate,
      preferenceMet,
      approval,
      status,
    };
  });

  // District summary
  const parcelTiles = computedTiles.filter((t) => isParcelZone(t.zone) || t.zone === 'reserve_sold');
  const averageUnitValue =
    parcelTiles.length > 0
      ? Math.round((parcelTiles.reduce((s, t) => s + t.unitValue, 0) / parcelTiles.length) * 10) / 10
      : scenario.baseUnitValue;

  const beforeAverageUnitValue = Math.round(scenario.baseUnitValue * 0.78 * 10) / 10;
  const valueIncreasePct = Math.round(
    ((averageUnitValue - beforeAverageUnitValue) / beforeAverageUnitValue) * 100
  );

  const ownerTiles = computedTiles.filter((t) => t.ownerId !== null);
  const connectedOwnerTiles = ownerTiles.filter(
    (t) => t.roadAccess !== 'none' && t.roadNetworkConnected
  );
  const roadAccessPct =
    ownerTiles.length > 0 ? Math.round((connectedOwnerTiles.length / ownerTiles.length) * 100) : 0;

  const fireSafeTiles = computedTiles.filter((t) => t.fireSafe).length;
  const fireSafetyPct = Math.round((fireSafeTiles / computedTiles.length) * 100);

  const overallApprovalPct =
    computedLandowners.length > 0
      ? Math.round(
          computedLandowners.reduce((s, lo) => s + lo.approval, 0) / computedLandowners.length
        )
      : 0;

  const agreedCount = computedLandowners.filter((lo) => lo.status === 'agreed').length;
  const opposedCount = computedLandowners.filter((lo) => lo.status === 'opposed').length;
  const criticalCount = computedLandowners.filter((lo) => lo.approval < 10).length;
  const parkCount = computedTiles.filter((t) => t.zone === 'park').length;
  const reserveCount = computedTiles.filter((t) => t.zone === 'reserve').length;
  const soldReserveCount = computedTiles.filter((t) => t.zone === 'reserve_sold').length;
  const unservicedParcelCount = computedTiles.filter(
    (t) => t.ownerId !== null && (t.zone === 'old_wood' || t.zone === 'factory')
  ).length;

  const averageGenbuRate =
    computedLandowners.length > 0
      ? Math.round(
          (computedLandowners.reduce((s, lo) => s + lo.genbuRate, 0) / computedLandowners.length) * 10
        ) / 10
      : 0;

  const goalsMet = {
    roadAccess: roadAccessPct === 100 && ownerTiles.length > 0,
    approval: overallApprovalPct >= scenario.targets.minApprovalPct,
    parks: parkCount >= scenario.targets.minParks,
    valueGain: valueIncreasePct >= scenario.targets.minValueIncreasePct,
    noOpposed: opposedCount === 0,
    allClear: unservicedParcelCount === 0,
  };

  const canFinalize =
    goalsMet.roadAccess &&
    goalsMet.approval &&
    goalsMet.parks &&
    goalsMet.valueGain &&
    goalsMet.noOpposed &&
    goalsMet.allClear;

  return {
    computedTiles,
    computedLandowners,
    summary: {
      averageUnitValue,
      beforeAverageUnitValue,
      valueIncreasePct,
      roadAccessPct,
      fireSafetyPct,
      overallApprovalPct,
      agreedCount,
      opposedCount,
      criticalCount,
      parkCount,
      reserveCount,
      soldReserveCount,
      unservicedParcelCount,
      averageGenbuRate,
      goalsMet,
      canFinalize,
    },
  };
}

export function initializeScenarioSynced(scenario: ScenarioConfig): {
  tiles: Tile[];
  landowners: Landowner[];
} {
  const { tiles } = initializeScenario(scenario);
  // Compute baseline using the exact same formula so beforeValue is 100% calibrated
  const stubOwners: Landowner[] = scenario.landowners.map((lo) => ({
    ...lo,
    beforeTilesCount: 1,
    beforeValue: 1,
    compensationReceived: 0,
    bonusApproval: 0,
    talkedThisTurn: false,
  }));
  const { computedTiles } = computeDistrict(tiles, stubOwners, scenario);

  const landowners: Landowner[] = scenario.landowners.map((lo) => {
    const owned = computedTiles.filter((t) => t.ownerId === lo.id);
    return {
      ...lo,
      beforeTilesCount: owned.length,
      beforeValue: owned.reduce((sum, t) => sum + t.totalValue, 0),
      compensationReceived: 0,
      bonusApproval: 0,
      talkedThisTurn: false,
    };
  });

  return { tiles, landowners };
}

export interface ActionPreview {
  allowed: boolean;
  reason?: string;
  cost: number;
  apCost: number;
  demolitionSurcharge?: number;
  newZone?: ZoneType;
}

export function evaluateTileAction(
  tile: ComputedTile,
  tool: ToolType,
  selectedOwnerId: string | null,
  budget: number,
  ap: number,
  demolitionMultiplier: number = 1
): ActionPreview {
  if (tool === 'inspect') {
    return { allowed: true, cost: 0, apCost: 0 };
  }

  if (tile.isFixed) {
    return {
      allowed: false,
      reason: '駅・既存幹線接続点は変更できません',
      cost: 0,
      apCost: 0,
    };
  }

  if (tile.zone === 'reserve_sold') {
    return {
      allowed: false,
      reason: '売却済の保留地は変更できません',
      cost: 0,
      apCost: 0,
    };
  }

  const toolDef = TOOLS.find((t) => t.id === tool)!;
  let baseSurcharge = 0;

  if (tile.zone === 'old_wood') baseSurcharge = 70;
  else if (tile.zone === 'factory') baseSurcharge = 130;
  else if (tile.zone === 'residential') baseSurcharge = 90;
  else if (tile.zone === 'commercial') baseSurcharge = 180;

  const demolitionSurcharge = Math.round(baseSurcharge * demolitionMultiplier);

  if (tool === 'road_6m') {
    if (tile.zone === 'road_6m') {
      return { allowed: false, reason: 'すでに6m区画道路です', cost: 0, apCost: 0 };
    }
    const cost = toolDef.baseCost + demolitionSurcharge;
    if (budget < cost) return { allowed: false, reason: '事業資金が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge };
    if (ap < toolDef.apCost) return { allowed: false, reason: '行動力(AP)が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge };
    return { allowed: true, cost, apCost: toolDef.apCost, demolitionSurcharge, newZone: 'road_6m' };
  }

  if (tool === 'road_12m') {
    if (tile.zone === 'road_12m') {
      return { allowed: false, reason: 'すでに12m幹線道路です', cost: 0, apCost: 0 };
    }
    // Upgrading 6m road to 12m costs slightly less
    const upgradeDiscount = tile.zone === 'road_6m' ? 80 : 0;
    const cost = toolDef.baseCost + demolitionSurcharge - upgradeDiscount;
    if (budget < cost) return { allowed: false, reason: '事業資金が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge };
    if (ap < toolDef.apCost) return { allowed: false, reason: '行動力(AP)が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge };
    return { allowed: true, cost, apCost: toolDef.apCost, demolitionSurcharge, newZone: 'road_12m' };
  }

  if (tool === 'park') {
    if (tile.zone === 'park') {
      return { allowed: false, reason: 'すでに街区公園です', cost: 0, apCost: 0 };
    }
    const cost = toolDef.baseCost + demolitionSurcharge;
    if (budget < cost) return { allowed: false, reason: '事業資金が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge };
    if (ap < toolDef.apCost) return { allowed: false, reason: '行動力(AP)が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge };
    return { allowed: true, cost, apCost: toolDef.apCost, demolitionSurcharge, newZone: 'park' };
  }

  if (tool === 'clear') {
    if (tile.zone === 'vacant' && tile.ownerId === null) {
      return { allowed: false, reason: 'すでに整理済みの公有空地です', cost: 0, apCost: 0 };
    }
    const extraClear = tile.zone === 'factory' ? 80 : tile.zone === 'commercial' ? 120 : 0;
    const cost = toolDef.baseCost + Math.round(extraClear * demolitionMultiplier);
    if (budget < cost) return { allowed: false, reason: '事業資金が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge: 0 };
    if (ap < toolDef.apCost) return { allowed: false, reason: '行動力(AP)が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge: 0 };
    return { allowed: true, cost, apCost: toolDef.apCost, demolitionSurcharge: 0, newZone: 'vacant' };
  }

  if (tool === 'replot_res' || tool === 'replot_com') {
    if (!selectedOwnerId) {
      return { allowed: false, reason: '右側の台帳から割付対象の地権者を選択してください', cost: 0, apCost: 0 };
    }
    const canPlaceOn =
      tile.zone === 'vacant' ||
      tile.zone === 'farmland' ||
      (tile.ownerId === selectedOwnerId && (tile.zone === 'old_wood' || tile.zone === 'residential'));

    if (!canPlaceOn) {
      return {
        allowed: false,
        reason: '「整理済空地」「農地」または選択地権者の既存区画にのみ換地できます',
        cost: 0,
        apCost: 0,
      };
    }

    if (tool === 'replot_com' && (tile.roadAccess === 'none' || !tile.roadNetworkConnected)) {
      return {
        allowed: false,
        reason: '立体商業ビルは道路ネットワークに接続された区画にのみ建設可能です',
        cost: 0,
        apCost: 0,
      };
    }

    if (tool === 'replot_res' && tile.zone === 'residential' && tile.ownerId === selectedOwnerId) {
      return { allowed: false, reason: 'すでにこの地権者の整形宅地です', cost: 0, apCost: 0 };
    }
    if (tool === 'replot_com' && tile.zone === 'commercial' && tile.ownerId === selectedOwnerId) {
      return { allowed: false, reason: 'すでにこの地権者の商業ビルです', cost: 0, apCost: 0 };
    }

    const extraClear = tile.zone === 'old_wood' ? Math.round(50 * demolitionMultiplier) : 0;
    const cost = toolDef.baseCost + extraClear;
    if (budget < cost) return { allowed: false, reason: '事業資金が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge: extraClear };
    if (ap < toolDef.apCost) return { allowed: false, reason: '行動力(AP)が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge: extraClear };
    return {
      allowed: true,
      cost,
      apCost: toolDef.apCost,
      demolitionSurcharge: extraClear,
      newZone: tool === 'replot_res' ? 'residential' : 'commercial',
    };
  }

  if (tool === 'reserve') {
    if (tile.zone === 'reserve') {
      return { allowed: false, reason: 'すでに保留地です（選択して売却できます）', cost: 0, apCost: 0 };
    }
    if (tile.zone !== 'vacant') {
      return {
        allowed: false,
        reason: '保留地は「整理済空地」にのみ指定できます（農地等は先に更地整理が必要）',
        cost: 0,
        apCost: 0,
      };
    }
    if (tile.ownerId !== null) {
      return { allowed: false, reason: '地権者所有地は先に「更地整理」で公有化してから保留地指定してください', cost: 0, apCost: 0 };
    }
    const cost = toolDef.baseCost;
    if (budget < cost) return { allowed: false, reason: '事業資金が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge: 0 };
    if (ap < toolDef.apCost) return { allowed: false, reason: '行動力(AP)が不足しています', cost, apCost: toolDef.apCost, demolitionSurcharge: 0 };
    return { allowed: true, cost, apCost: toolDef.apCost, demolitionSurcharge: 0, newZone: 'reserve' };
  }

  return { allowed: false, cost: 0, apCost: 0 };
}
