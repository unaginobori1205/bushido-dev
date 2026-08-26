const pptxgen = require("pptxgenjs");
const path = require("path");
const A = path.join(__dirname, "assets");

/* ---------- BUSHIDO house style ---------- */
const INK       = "0A0A0A";
const INK_SOFT  = "16150F";
const INK_CARD  = "1B1914";
const GOLD      = "C9A86A";
const GOLD_LT   = "E2C98A";
const GOLD_DP   = "8B7340";
const WASHI     = "F5F0E8";
const MUTED     = "A29B8E";
const DIM       = "77716A";
const VERMIL    = "8B1A1A";

const SERIF = "Yu Mincho";   // 見出し（游明朝）
const SANS  = "Yu Gothic";   // 本文（游ゴシック）

const W = 13.33, H = 7.5, M = 0.75;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "上岡 賢輔 / 合同会社BUSHIDO";
pres.company = "BUSHIDO JAPAN";
pres.title = "ご挨拶 — BUSHIDO JAPAN 上岡賢輔";

const T = (o) => Object.assign({ isTextBox: true, margin: 0, fontFace: SANS, color: WASHI }, o);

/* 見出し（各コンテンツスライド共通） */
function heading(s, jp, en) {
  s.addText(en, T({ x: M, y: 0.52, w: 8, h: 0.28, fontSize: 10.5, color: GOLD_DP,
                    charSpacing: 3, fontFace: "Calibri" }));
  s.addText(jp, T({ x: M, y: 0.84, w: 10, h: 0.62, fontSize: 30, bold: true,
                    fontFace: SERIF, color: WASHI }));
}

/* 漢字を金の円に入れた反復モチーフ */
function kanjiMark(s, ch, x, y, d, fs) {
  s.addShape(pres.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: INK }, line: { color: GOLD, width: 1 },
  });
  s.addText(ch, T({ x, y, w: d, h: d, align: "center", valign: "middle",
                    fontSize: fs, color: GOLD, fontFace: SERIF, margin: 0 }));
}

function card(s, x, y, w, h) {
  s.addShape(pres.ShapeType.rect, {
    x, y, w, h, fill: { color: INK_CARD },
    line: { color: GOLD, width: 0.75, transparency: 72 },
  });
}

function caption(s, text, x, y, w) {
  s.addText(text, T({ x, y, w, h: 0.26, fontSize: 9.5, color: DIM, align: "center" }));
}

/* ============ 1. 表紙 ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-title.png` };
  s.addImage({ path: `${A}/enso-lg.png`, x: 7.35, y: 0.32, w: 6.35, h: 6.35 });

  s.addText("PHLIGHT ENGLISH　嶋村 卓亮 様", T({
    x: M, y: 1.28, w: 7.5, h: 0.32, fontSize: 13, color: MUTED }));
  s.addText("ご 挨 拶", T({
    x: M, y: 1.72, w: 7.5, h: 0.95, fontSize: 46, bold: true,
    fontFace: SERIF, color: GOLD, charSpacing: 4 }));
  s.addText("BUSHIDO JAPAN", T({
    x: M, y: 2.92, w: 7.5, h: 0.34, fontSize: 13, color: GOLD_DP,
    charSpacing: 5, fontFace: "Calibri" }));
  s.addText("合同会社BUSHIDO　代表", T({
    x: M, y: 3.42, w: 7.5, h: 0.36, fontSize: 15, color: MUTED }));
  s.addText("上岡 賢輔", T({
    x: M, y: 3.82, w: 7.5, h: 0.75, fontSize: 36, bold: true,
    fontFace: SERIF, color: WASHI }));

  s.addText("BUSHIDO is not tourism.  It is transformation.", T({
    x: M, y: 5.05, w: 7.5, h: 0.36, fontSize: 15, italic: true,
    color: GOLD_LT, fontFace: "Cambria" }));

  s.addText("中村 公一 様よりご紹介いただきました", T({
    x: M, y: 6.15, w: 7.5, h: 0.3, fontSize: 12, color: MUTED }));
  s.addText("2026年8月", T({
    x: M, y: 6.5, w: 7.5, h: 0.28, fontSize: 11, color: DIM }));

  s.addNotes("初回ご挨拶。中村公一様からのご紹介である旨を最初に伝える。");
}

/* ============ 2. 自己紹介 ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-slide.png` };
  heading(s, "自己紹介", "WHO I AM");

  s.addImage({ path: `${A}/ph-portrait.png`, x: M, y: 1.72, w: 3.25, h: 4.15 });
  caption(s, "※ご本人のお写真に差し替え", M, 5.98, 3.25);

  const x = 4.62, w = 13.33 - x - M;
  s.addText("上岡 賢輔", T({ x, y: 1.72, w, h: 0.55, fontSize: 30, bold: true, fontFace: SERIF }));
  s.addText("Kensuke Ueoka", T({ x, y: 2.3, w, h: 0.3, fontSize: 12, color: GOLD,
                                 charSpacing: 2, fontFace: "Calibri" }));
  s.addText("合同会社BUSHIDO 代表　／　BUSHIDO JAPAN Founder", T({
    x, y: 2.68, w, h: 0.3, fontSize: 12.5, color: MUTED }));

  s.addText([
    { text: "愛知・名古屋を拠点に、訪日外国人向けの武士道・日本文化体験を企画・運営しています。",
      options: { bullet: true, breakLine: true } },
    { text: "弓道を修行として続ける実践者です。竹弓の工房を訪ね、流鏑馬・小笠原流の教えに学び続けています。",
      options: { bullet: true, breakLine: true } },
    { text: "掲げているのは「観光ではなく、変容を」。的に当てる体験ではなく、自分の軸が整う体験を設計しています。",
      options: { bullet: true, breakLine: true } },
    { text: "一人の親として、完璧な姿ではなく、挑戦し失敗しながら前に進む背中を子どもに見せることを大切にしています。",
      options: { bullet: true } },
  ], T({ x, y: 3.25, w, h: 2.6, fontSize: 13.5, color: WASHI,
        lineSpacing: 22, paraSpaceAfter: 12 }));

  s.addText("I train, and then I invite. Everything we offer, I practice myself.", T({
    x, y: 6.15, w, h: 0.34, fontSize: 12.5, italic: true, color: GOLD_DP,
    fontFace: "Cambria" }));

  s.addNotes("弓道の実践者であること、事業が思想に根ざしていることを伝える。");
}

/* ============ 3. なぜ、武士道か ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-slide.png` };
  heading(s, "なぜ、武士道か", "OUR PHILOSOPHY");

  const items = [
    ["道", "技ではなく、道である",
     "武道は技術の習得ではありません。丹田、姿勢、呼吸、足さばき。日常の所作そのものを整える道です。一流の人は、歩き方から違います。"],
    ["生", "竹弓は、生きている",
     "竹弓は一本ごとに個性があり、気温や時間帯で状態が変わります。均一ではないからこそ、扱う人間の内面が問われます。"],
    ["守", "曲げてはいけない本質",
     "伝統文化を事業にするとき、売れる形に変えることと、本質を曲げることは違います。守るべき芯を持ち続けます。"],
  ];
  const cw = 3.68, gap = 0.49;
  items.forEach(([k, title, body], i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.78, cw, 3.95);
    kanjiMark(s, k, x + cw / 2 - 0.44, 2.16, 0.88, 26);
    s.addText(title, T({ x: x + 0.3, y: 3.28, w: cw - 0.6, h: 0.66, fontSize: 16.5,
                         bold: true, fontFace: SERIF, color: GOLD_LT, align: "center" }));
    s.addText(body, T({ x: x + 0.34, y: 4.02, w: cw - 0.68, h: 1.5, fontSize: 12,
                        color: MUTED, lineSpacing: 19 }));
  });

  s.addText("Japanese martial arts are not only techniques. They are a way to refine the body, mind, and spirit.",
    T({ x: M, y: 6.12, w: W - M * 2, h: 0.34, fontSize: 12.5, italic: true,
        color: GOLD_DP, fontFace: "Cambria" }));

  s.addNotes("3つの柱：道／生／守。永野一翠工房での学びが土台。");
}

/* ============ 4. 会社概要 ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-slide.png` };
  heading(s, "会社概要", "COMPANY");

  const rows = [
    ["会 社 名", "合同会社BUSHIDO（BUSHIDO JAPAN）"],
    ["代 表 者", "上岡 賢輔"],
    ["設 立", "2023年3月"],
    ["所 在 地", "愛知県稲沢市"],
    ["事 業 内 容", "訪日外国人向け 武士道・日本文化体験の企画・運営／コーディネート"],
    ["販売チャネル", "GetYourGuide（B2C）／ 日本旅行「Miyabi」（インバウンド B2B）"],
  ];
  const lx = M, lw = 1.75, vx = M + 2.05, vw = 5.45;
  rows.forEach(([k, v], i) => {
    const y = 1.82 + i * 0.66;
    s.addText(k, T({ x: lx, y, w: lw, h: 0.36, fontSize: 11.5, color: GOLD, charSpacing: 1 }));
    s.addText(v, T({ x: vx, y: y - 0.04, w: vw, h: 0.44, fontSize: 13, color: WASHI }));
  });

  s.addImage({ path: `${A}/ph-square.png`, x: 8.6, y: 1.78, w: 3.98, h: 3.98 });
  caption(s, "※活動風景のお写真に差し替え", 8.6, 5.88, 3.98);

  s.addText("名古屋・愛知の道場、寺社、職人の方々と直接お付き合いしながら、体験を一つずつ組み立てています。",
    T({ x: M, y: 6.05, w: 7.5, h: 0.6, fontSize: 12, color: MUTED, lineSpacing: 20 }));

  s.addNotes("会社の基本情報。販売チャネルの信頼性（日本旅行との連携）を補足。");
}

/* ============ 5. ご提供している体験 ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-slide.png` };
  heading(s, "ご提供している体験", "EXPERIENCES");

  const items = [
    ["弓", "弓道", "射法八節を通じて自分の軸を整える。名古屋の道場での本格体験。"],
    ["茶", "茶道", "一服の茶に宿る「一期一会」。静けさと所作を味わう時間。"],
    ["書", "書道", "呼吸と筆先が一致する感覚。一文字に心を込める体験。"],
    ["装", "着物・侍体験", "装いから所作が変わる。武士の佇まいを身体で知る。"],
    ["社", "寺社・熱田神宮", "名古屋の信仰の中心地を、文脈とともに歩く。"],
    ["静", "リトリート", "武士道哲学に根ざした少人数のプライベート・リトリート。"],
  ];
  const cw = 3.68, ch = 2.15, gx = 0.49, gy = 0.32;
  items.forEach(([k, title, body], i) => {
    const x = M + (i % 3) * (cw + gx);
    const y = 1.72 + Math.floor(i / 3) * (ch + gy);
    card(s, x, y, cw, ch);
    kanjiMark(s, k, x + 0.3, y + 0.32, 0.72, 21);
    s.addText(title, T({ x: x + 1.16, y: y + 0.42, w: cw - 1.42, h: 0.42,
                         fontSize: 16, bold: true, fontFace: SERIF, color: GOLD_LT }));
    s.addText(body, T({ x: x + 0.3, y: y + 1.24, w: cw - 0.6, h: 0.72,
                        fontSize: 11.5, color: MUTED, lineSpacing: 17 }));
  });

  s.addText("いずれも英語でご案内しています。ご要望に応じて組み合わせ・貸切での設計も承ります。",
    T({ x: M, y: 6.42, w: W - M * 2, h: 0.34, fontSize: 12, color: GOLD_DP }));

  s.addNotes("弓道が旗艦。他は名古屋の地域資源と組み合わせて展開中。");
}

/* ============ 6. 弓道体験（旗艦プログラム） ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-slide.png` };
  s.addImage({ path: `${A}/ph-tall.png`, x: 7.05, y: 0, w: 6.28, h: 7.5 });

  const w = 7.05 - M - 0.45;
  s.addText("FLAGSHIP PROGRAM", T({ x: M, y: 1.05, w, h: 0.28, fontSize: 10.5,
    color: GOLD_DP, charSpacing: 3, fontFace: "Calibri" }));
  s.addText("Kyudo — The Way of the Bow", T({ x: M, y: 1.42, w, h: 0.55,
    fontSize: 23, bold: true, fontFace: "Cambria", color: GOLD }));
  s.addText("名古屋・弓道体験", T({ x: M, y: 2.06, w, h: 0.44, fontSize: 19,
    bold: true, fontFace: SERIF, color: WASHI }));

  s.addText("見学でも、演武の鑑賞でもありません。地元の弓道家が日々稽古する道場で、ご自身が弓を引きます。射法八節に沿って、一射に向き合っていただく90分です。",
    T({ x: M, y: 2.78, w, h: 1.0, fontSize: 13, color: MUTED, lineSpacing: 21 }));

  s.addText([
    { text: "2026年8月12日　日本旅行「Miyabi」にて販売開始", options: { bullet: true, breakLine: true } },
    { text: "世界の旅行会社様へ B2B で提供（英語対応）", options: { bullet: true, breakLine: true } },
    { text: "少人数プライベート形式。初めての方でも引けます", options: { bullet: true } },
  ], T({ x: M, y: 4.0, w, h: 1.35, fontSize: 12.5, color: WASHI,
        lineSpacing: 20, paraSpaceAfter: 9 }));

  s.addText("The bow is not just a tool. It reflects the condition of the person who holds it.",
    T({ x: M, y: 5.62, w, h: 0.6, fontSize: 13, italic: true, color: GOLD_LT,
        fontFace: "Cambria", lineSpacing: 20 }));

  caption(s, "※弓道体験のお写真に差し替え", 7.05, 6.88, 6.28);
  s.addNotes("旗艦商品。実際に弓を引く点が他社との差別化。");
}

/* ============ 7. これまでの歩み ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-slide.png` };
  heading(s, "これまでの歩み", "MILESTONES");

  const items = [
    ["2023.03", "BUSHIDO 設立", "合同会社BUSHIDO を愛知県稲沢市に設立。名古屋を拠点に活動を開始。"],
    ["通年", "GetYourGuide 掲載", "世界最大級の体験予約プラットフォームで個人旅行者へ提供。"],
    ["2026.07", "日本旅行と基本合意", "インバウンド向けBtoB予約基盤「Miyabi」での委託販売について合意。"],
    ["2026.08", "Miyabi 販売開始", "第1弾「Kyudo: The Way of the Bow」を世界の旅行会社へ。"],
  ];
  const cw = 2.66, gx = 0.39;
  items.forEach(([date, title, body], i) => {
    const x = M + i * (cw + gx);
    card(s, x, 1.8, cw, 2.9);
    s.addText(date, T({ x: x + 0.28, y: 2.06, w: cw - 0.56, h: 0.34, fontSize: 13.5,
                        bold: true, color: GOLD, fontFace: "Calibri", charSpacing: 1 }));
    s.addText(title, T({ x: x + 0.28, y: 2.5, w: cw - 0.56, h: 0.72, fontSize: 14,
                         bold: true, fontFace: SERIF, color: WASHI, lineSpacing: 19 }));
    s.addText(body, T({ x: x + 0.28, y: 3.35, w: cw - 0.56, h: 1.1, fontSize: 11,
                        color: MUTED, lineSpacing: 16 }));
  });

  card(s, M, 5.05, W - M * 2, 1.55);
  kanjiMark(s, "展", M + 0.34, 5.42, 0.8, 22);
  s.addText("今後の展開", T({ x: M + 1.4, y: 5.4, w: 9.5, h: 0.36, fontSize: 15,
    bold: true, fontFace: SERIF, color: GOLD_LT }));
  s.addText("熱田神宮参拝、書道、味噌煮込みうどん、有松絞り、瀬戸焼など、名古屋・愛知の文化資源を組み合わせた体験を順次追加してまいります。",
    T({ x: M + 1.4, y: 5.84, w: W - M * 2 - 1.75, h: 0.62, fontSize: 12, color: MUTED, lineSpacing: 18 }));

  s.addNotes("設立3年で日本旅行との連携まで到達。地域資源との掛け合わせが今後の軸。");
}

/* ============ 8. 大切にしていること ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-quote.png` };
  s.addImage({ path: `${A}/enso-lg.png`, x: (W - 6.4) / 2, y: 0.45, w: 6.4, h: 6.4 });

  s.addText("大切にしていること", T({ x: 0, y: 0.62, w: W, h: 0.32, fontSize: 11.5,
    color: GOLD_DP, align: "center", charSpacing: 4 }));

  s.addText("伝統は、売れる形に合わせて\n曲げてはいけない。", T({
    x: 1.6, y: 2.4, w: W - 3.2, h: 1.7, fontSize: 32, bold: true,
    fontFace: SERIF, color: GOLD, align: "center", lineSpacing: 52 }));

  s.addText("— 竹弓師・永野一翠工房 訪問記録（2026年5月）より", T({
    x: 1.6, y: 4.3, w: W - 3.2, h: 0.32, fontSize: 12, color: MUTED, align: "center" }));

  s.addText("小笠原流には、流派の名を商売に使ってはならないという掟があります。相手に合わせて教えを曲げないためです。伝統文化を事業として扱う私たちも、この姿勢を事業判断の基準に置いています。",
    T({ x: 2.5, y: 5.05, w: W - 5.0, h: 0.9, fontSize: 12.5, color: MUTED,
        align: "center", lineSpacing: 21 }));

  s.addNotes("事業の倫理観。ここが共感いただけるかどうかが、良いご縁の分かれ目。");
}

/* ============ 9. ご一緒できそうなこと ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-slide.png` };
  heading(s, "PHLIGHT様とご一緒できそうなこと", "POSSIBLE COLLABORATION");

  const items = [
    ["語", "英語 × 武士道体験",
     "御社の英会話・海外研修の受講者様へ、日本文化を英語で体験するプログラムとして弓道体験をご提供できないかと考えております。"],
    ["研", "法人・学校研修への組み込み",
     "御社の海外研修・留学プログラムの往路／帰路に、日本国内での武士道体験を組み込む形での連携。"],
    ["越", "フィリピン・東南アジアへの発信",
     "御社のマニラ・セブ拠点と観光省ネットワークを通じ、東南アジアからの訪日層に向けた発信のご相談。"],
    ["育", "教育コンテンツの共同開発",
     "「英語で武士道を語る」教材など、iU様での客員講師のご知見と掛け合わせた教育コンテンツの可能性。"],
  ];
  const cw = 5.58, ch = 2.25, gx = 0.67, gy = 0.28;
  items.forEach(([k, title, body], i) => {
    const x = M + (i % 2) * (cw + gx);
    const y = 1.72 + Math.floor(i / 2) * (ch + gy);
    card(s, x, y, cw, ch);
    kanjiMark(s, k, x + 0.34, y + 0.36, 0.78, 22);
    s.addText(title, T({ x: x + 1.32, y: y + 0.48, w: cw - 1.62, h: 0.42,
                         fontSize: 16, bold: true, fontFace: SERIF, color: GOLD_LT }));
    s.addText(body, T({ x: x + 0.34, y: y + 1.28, w: cw - 0.68, h: 0.9,
                        fontSize: 11.5, color: MUTED, lineSpacing: 18 }));
  });

  s.addText("まずはお話を伺えれば幸いです。ご関心のある切り口からご相談させてください。",
    T({ x: M, y: 6.62, w: W - M * 2, h: 0.32, fontSize: 12, color: GOLD_DP }));

  s.addNotes("押し売りにしない。あくまで「可能性のご相談」として提示する。");
}

/* ============ 10. お問い合わせ ============ */
{
  const s = pres.addSlide();
  s.background = { path: `${A}/bg-title.png` };
  s.addImage({ path: `${A}/enso-lg.png`, x: -1.55, y: 0.15, w: 7.1, h: 7.1 });

  const x = 6.0, w = W - x - M;
  s.addText("お会いできる日を\n楽しみにしております。", T({
    x, y: 1.75, w, h: 1.55, fontSize: 27, bold: true, fontFace: SERIF,
    color: GOLD, lineSpacing: 46 }));

  s.addText([
    { text: "合同会社BUSHIDO ／ BUSHIDO JAPAN", options: { breakLine: true } },
    { text: "代表　上岡 賢輔（Kensuke Ueoka）", options: { breakLine: true } },
    { text: "愛知県稲沢市", options: { breakLine: true } },
    { text: "ueoka@bsd-pro.com", options: { breakLine: true } },
    { text: "bsd-pro.com", options: {} },
  ], T({ x, y: 3.75, w, h: 1.9, fontSize: 13.5, color: WASHI, lineSpacing: 24 }));

  s.addText("Thank you for your time. — From Nagoya, with gratitude.", T({
    x, y: 6.05, w, h: 0.34, fontSize: 12.5, italic: true, color: GOLD_DP,
    fontFace: "Cambria" }));

  s.addNotes("連絡先。メール・サイトともに正確か送付前に確認すること。");
}

const out = path.join(__dirname, "BUSHIDO_ご挨拶_上岡賢輔.pptx");
pres.writeFile({ fileName: out }).then(() => console.log("wrote", out));
