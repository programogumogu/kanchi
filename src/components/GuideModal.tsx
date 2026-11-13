import { X } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#1A2026]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="bg-white border border-[#DED9CE] rounded-lg max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DED9CE] bg-[#FAF9F5] flex items-center justify-between">
          <h2 id="guide-modal-title" className="font-display text-lg font-bold text-[#1A2026]">
            換地設計マニュアル — 区画整理の基本
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="マニュアルを閉じる"
            className="p-1.5 rounded-md text-[#5A6572] hover:text-[#1A2026] hover:bg-[#EAE6DC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#2F3742] leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-display font-bold text-base text-[#1A2026]">
              1. 道路ネットワークの接続ルール
            </h3>
            <p>
              地図上の<strong>「幹線接続点」</strong>または<strong>「駅」</strong>から、
              「6m区画道路」または「12m幹線道路」を途切れなく繋いでください。幹線に接続されていない孤立道路には「!」マークが表示され、地価上昇や接道達成として認められません。
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-base text-[#1A2026]">
              2. 減歩（げんぶ）と換地（かんち）の考え方
            </h3>
            <p>
              道路や公園を造るために地権者の古い区画を取り壊すと、その地権者の所有面積は減ります（これを<strong>減歩</strong>と呼びます）。そのままでは不満が高まりますが、新しい道路沿いや公園のそばに<strong>「換地：整形宅地」</strong>や<strong>「換地：立体商業」</strong>を割り当てて<strong>総評価額（資産増進率）をプラスにする</strong>ことで同意率が大きく上昇します。
            </p>
            <p className="text-xs text-[#5A6572]">
              ヒント：右側の「地権者台帳」で各地権者をクリックすると所有地がハイライトされ、そのまま「換地」ツールで新しい区画へ移設・整形できます。古い「木密家屋」は「更地整理」や道路敷設で解体し、新しい街区へ再配置しましょう。
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-base text-[#1A2026]">
              3. 保留地（ほりゅうち）による自己資金循環
            </h3>
            <p>
              <strong>「更地化・整理」で整備した公有の整理済空地</strong>を<strong>「保留地指定」</strong>し、周辺に12m幹線道路や公園を整備して坪単価を引き上げた後、区画を選択して<strong>「売却」</strong>すると多額の事業資金が得られます（農地や既存建物はそのまま保留地にできません）。保留地の創出と売却タイミングが最大の戦略となります。
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-base text-[#1A2026]">
              4. 換地処分（クリア）と事業中止（ゲームオーバー）の条件
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#4A5562]">
              <li>全地権者の所有区画がすべて道路ネットワークに接道している（接道率 100%）</li>
              <li>地権者所有区画に「木密老朽家屋」「老朽工場」が残っていない</li>
              <li>公園数と地区平均地価の上昇率が目標値に達している</li>
              <li>強硬反対（同意45%未満）の地権者が0名で、平均同意率が目標以上である</li>
              <li className="text-[#DC2626] font-semibold">
                注意：いずれか1名でも地権者の同意率が10%未満の状態で期を進めると、信頼破綻により即座に事業中止（ゲームオーバー）となります。
              </li>
            </ul>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-[#DED9CE] bg-[#FAF9F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF] transition-colors cursor-pointer"
          >
            図面に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
