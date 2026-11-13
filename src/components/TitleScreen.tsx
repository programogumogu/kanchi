import { useState } from 'react';
import { ArrowRight, BookOpen, Compass, Layers, Landmark, ShieldCheck } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import { ScenarioConfig } from '../types/game';

interface TitleScreenProps {
  onStartScenario: (scenario: ScenarioConfig) => void;
  onOpenGuide: () => void;
}

export function TitleScreen({ onStartScenario, onOpenGuide }: TitleScreenProps) {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const selectedScenario = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  return (
    <div className="min-h-screen drafting-canvas flex flex-col">
      {/* Top Bar: 3-zone contract */}
      <header className="bg-[#FAF9F5]/95 backdrop-blur border-b border-[#DED9CE] px-6 py-4">
        <div className="max-w-[1320px] mx-auto flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-[#1A2026] whitespace-nowrap shrink-0">
            換地設計 KANCHI
          </span>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A5562]">
            <a href="#scenarios" className="hover:text-[#1A2026] transition-colors whitespace-nowrap shrink-0">
              対象地区
            </a>
            <a href="#mechanics" className="hover:text-[#1A2026] transition-colors whitespace-nowrap shrink-0">
              事業の基本構造
            </a>
            <button
              type="button"
              onClick={onOpenGuide}
              className="hover:text-[#1A2026] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              設計マニュアル
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onStartScenario(selectedScenario)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              事業を開始する
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-6 py-10 space-y-12">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-[#DED9CE] rounded-lg p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5A6572]">
                <span>都市計画シミュレーション</span>
                <span aria-hidden="true">·</span>
                <span>土地区画整理事業</span>
                <span aria-hidden="true">·</span>
                <span>10×8街区設計</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#1A2026] leading-tight text-balance">
                狭隘な街を解きほぐし、
                <br />
                合意と価値を生み出す換地設計。
              </h1>
              <p className="text-[15px] leading-relaxed text-[#4A5562] max-w-2xl">
                あなたは土地区画整理事業の施行責任者として、老朽木造密集地や無秩序なスプロール地区の再編を担います。道路と公園を敷設して路線価を引き上げ、減歩への理解を得ながら地権者の土地を美しく換地し、保留地の売却益で事業を完遂してください。
              </p>
            </div>

            <div className="pt-8 mt-8 border-t border-[#ECE8DF] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs text-[#4A5562]">
                <div>
                  <span className="block text-[#7A8490]">選択中の地区</span>
                  <span className="font-semibold text-sm text-[#1A2026]">{selectedScenario.title}</span>
                </div>
                <div className="h-8 w-px bg-[#DED9CE]" />
                <div>
                  <span className="block text-[#7A8490]">初期事業資金</span>
                  <span className="font-mono-num font-semibold text-sm text-[#1A2026]">
                    ¥{selectedScenario.startingBudget.toLocaleString()}万
                  </span>
                </div>
                <div className="h-8 w-px bg-[#DED9CE]" />
                <div>
                  <span className="block text-[#7A8490]">工期上限</span>
                  <span className="font-mono-num font-semibold text-sm text-[#1A2026]">
                    全{selectedScenario.maxTurns}期
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#2F3742] bg-[#F4F2EC] border border-[#D4CFC3] rounded-md hover:bg-[#EAE6DC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  ルールを見る
                </button>
                <button
                  type="button"
                  onClick={() => onStartScenario(selectedScenario)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  この地区で着工する
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Selected District Scale Model Showcase */}
          <div className="lg:col-span-5 bg-white border border-[#DED9CE] rounded-lg overflow-hidden flex flex-col">
            <div className="relative flex-1 min-h-[240px] bg-[#E8E4DA]">
              {!imgErrors[selectedScenario.id] ? (
                <img
                  src={selectedScenario.imagePath}
                  alt={selectedScenario.title}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [selectedScenario.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#5A6572]">
                  <Compass className="w-10 h-10 mb-2 text-[#1D4ED8]" />
                  <span className="font-display font-bold text-base text-[#1A2026]">
                    {selectedScenario.title}
                  </span>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-[#DED9CE] bg-[#FAF9F5] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#5A6572]">
                <span>難易度 {selectedScenario.difficulty}</span>
                <span aria-hidden="true">·</span>
                <span>地権者 {selectedScenario.landowners.length}名</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">基準坪単価 ¥{selectedScenario.baseUnitValue}万</span>
              </div>
              <p className="text-sm text-[#2F3742] leading-relaxed">
                {selectedScenario.description}
              </p>
            </div>
          </div>
        </section>

        {/* Scenario Selector Cards */}
        <section id="scenarios" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-[#1A2026]">
              01. 施行対象地区の選択
            </h2>
            <span className="text-xs text-[#5A6572]">
              地区ごとに地勢・予算制約・地権者の要望が異なります
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedId;
              return (
                <div
                  key={sc.id}
                  className={`bg-white rounded-lg border transition-all flex flex-col overflow-hidden ${
                    isSelected
                      ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20'
                      : 'border-[#DED9CE] hover:border-[#B8B0A0]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(sc.id)}
                    className="text-left flex-1 flex flex-col cursor-pointer focus-visible:outline-none"
                  >
                    <div className="aspect-[4/3] w-full bg-[#E8E4DA] overflow-hidden">
                      {!imgErrors[sc.id] ? (
                        <img
                          src={sc.imagePath}
                          alt={sc.title}
                          referrerPolicy="no-referrer"
                          onError={() => setImgErrors((prev) => ({ ...prev, [sc.id]: true }))}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5A6572]">
                          <Layers className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-[#5A6572]">
                          <span className="font-semibold text-[#1D4ED8]">{sc.difficulty}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">全{sc.maxTurns}期</span>
                          <span aria-hidden="true">·</span>
                          <span>地権者{sc.landowners.length}名</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#1A2026]">{sc.title}</h3>
                        <p className="text-xs text-[#4A5562] leading-relaxed">{sc.subtitle}</p>
                      </div>

                      <div className="pt-3 border-t border-[#ECE8DF] grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="block text-[#7A8490]">初期資金</span>
                          <span className="font-mono-num font-semibold text-[#1A2026]">
                            ¥{sc.startingBudget}万
                          </span>
                        </div>
                        <div>
                          <span className="block text-[#7A8490]">公園目標</span>
                          <span className="font-mono-num font-semibold text-[#1A2026]">
                            {sc.targets.minParks}区画
                          </span>
                        </div>
                        <div>
                          <span className="block text-[#7A8490]">地価目標</span>
                          <span className="font-mono-num font-semibold text-[#1A2026]">
                            +{sc.targets.minValueIncreasePct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => onStartScenario(sc)}
                      className={`w-full py-2 px-4 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF]'
                          : 'bg-[#F4F2EC] text-[#1A2026] border border-[#D4CFC3] hover:bg-[#EAE6DC]'
                      }`}
                    >
                      {isSelected ? 'この地区で着工する' : '選択して着工する'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Core Mechanics Summary */}
        <section id="mechanics" className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#1A2026]">
            02. 土地区画整理の戦略サイクル
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#DED9CE] rounded-lg p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#1D4ED8]">
                <Compass className="w-5 h-5" />
                <h3 className="font-display font-bold text-base text-[#1A2026]">
                  道路ネットワークと防災公園
                </h3>
              </div>
              <p className="text-sm text-[#4A5562] leading-relaxed">
                既存の幹線接続点・駅から6m区画道路や12m幹線道路を伸ばし、すべての区画へ緊急車両が入れる接道環境を構築します。公園を隣接させると周辺地価と住民満足度が大きく向上します。
              </p>
            </div>

            <div className="bg-white border border-[#DED9CE] rounded-lg p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#15803D]">
                <Layers className="w-5 h-5" />
                <h3 className="font-display font-bold text-base text-[#1A2026]">
                  減歩と換地による価値増進
                </h3>
              </div>
              <p className="text-sm text-[#4A5562] leading-relaxed">
                道路・公園用地の捻出により各地権者の面積は減少（減歩）しますが、路線価の高い整形宅地や立体商業ビルへ換地することで「総資産額」を増進させ、地権者の同意を獲得します。
              </p>
            </div>

            <div className="bg-white border border-[#DED9CE] rounded-lg p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#B45309]">
                <Landmark className="w-5 h-5" />
                <h3 className="font-display font-bold text-base text-[#1A2026]">
                  保留地処分による資金循環
                </h3>
              </div>
              <p className="text-sm text-[#4A5562] leading-relaxed">
                整理した公有空地を「保留地」に指定し、幹線道路や公園で地価を高めたうえで売却して事業資金を回収します。限られた予算と工期の中で破綻せず換地処分を完了させましょう。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DED9CE] bg-[#FAF9F5] px-6 py-4 text-xs text-[#5A6572]">
        <div className="max-w-[1320px] mx-auto flex items-center justify-between">
          <span>換地設計 KANCHI — 土地区画整理シミュレーション</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            <span>1区画 = 100㎡（約30坪）換算</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
