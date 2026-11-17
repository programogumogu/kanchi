import { X } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#1A2026]/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="bg-white border border-[#DED9CE] rounded-lg max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DED9CE] bg-[#FAF9F5] flex items-center justify-between">
          <h2 id="guide-modal-title" className="font-display text-lg font-bold text-[#1A2026]">
            換地設計マニュアル — 区画整理のルール
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
              1. 道路ネットワークと接道（せつどう）のルール
            </h3>
            <p>
              地図上の<strong>「幹線接続点」</strong>または<strong>「駅」</strong>から、
              「区画道路 6m」や「幹線道路 12m」を途切れずにつなげてください。入口とつながっていない孤立した道路には「!」マークが表示され、地価アップや接道達成として認められません。
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-base text-[#1A2026]">
              2. 減歩（げんぶ）と換地（かんち）の仕組み
            </h3>
            <p>
              道路や公園を作るために地権者の土地を整理すると、その人の所有面積は少しずつ減ります（これを<strong>減歩</strong>と呼びます）。そのままでは不満が出ますが、新しい道路沿いや公園のそばに<strong>「換地：整形宅地」</strong>や<strong>「換地：立体商業」</strong>を用意して<strong>総資産額（資産増進率）を増やす</strong>ことで、高い同意率を得られます。
            </p>
            <p className="text-xs text-[#5A6572]">
              ヒント：右側の「地権者台帳」で人を選ぶと所有地が光ります。また、すでに地権者が持っている区画（木密家屋・宅地・農地）を「換地」ツールでクリックしたときは、自動でその地権者本人に割り付けられます。
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-base text-[#1A2026]">
              3. 保留地（ほりゅうち）で事業資金をつくる
            </h3>
            <p>
              <strong>「更地化・整理」で公有化した「整理済空地」</strong>を<strong>「保留地指定」</strong>し、近くに12m幹線道路や公園を作って坪単価を高めたあと、区画を選んで<strong>「売却」</strong>すると多額の資金が手に入ります（農地や古い建物は、先に「更地化・整理」を行ってから保留地にできます）。
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-base text-[#1A2026]">
              4. 換地処分（クリア）と事業中止（ゲームオーバー）の条件
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4A5562]">
              <li>すべての地権者の土地が、幹線につながる道路に面していること（接道率 100%）</li>
              <li>地権者の土地に「木密老朽家屋」「老朽工場」が残っていないこと</li>
              <li>街区公園の数と、地区平均地価の上昇率が目標に達していること</li>
              <li>「反対（45%未満）」の地権者が0人で、平均同意率が目標以上かつ残り資金が¥0以上であること</li>
              <li className="text-[#DC2626] font-semibold">
                注意：1人でも同意率が10%未満の地権者がいる状態で次の期へ進むと、信頼関係が崩れて即座に事業中止（ゲームオーバー）になります。
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
