const pptxgen = require('pptxgenjs');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';           // 13.3 x 7.5
const W=13.3, H=7.5;

const NAVY='1B3A5C', DEEP='12283D', BLUE='5B7C99', RED='C1352B',
      INK='1F2933', MUTE='6B7A8C', LINE='D8DEE5', WHITE='FFFFFF', TINT='F1F4F7';
const HF='Meiryo', BF='Meiryo';

const dark = () => { const s=p.addSlide(); s.background={color:DEEP}; return s; };
const light= () => { const s=p.addSlide(); s.background={color:WHITE}; return s; };

function title(s, t, sub){
  s.addText(t,{x:0.7,y:0.45,w:W-1.4,h:0.75,fontSize:34,bold:true,color:NAVY,fontFace:HF,margin:0});
  if(sub) s.addText(sub,{x:0.7,y:1.22,w:W-1.4,h:0.4,fontSize:14,color:MUTE,fontFace:BF,margin:0});
}
function numDot(s,x,y,n){
  s.addShape(p.ShapeType.ellipse,{x,y,w:0.46,h:0.46,fill:{color:RED}});
  s.addText(String(n),{x,y,w:0.46,h:0.46,fontSize:16,bold:true,color:WHITE,align:'center',valign:'middle',fontFace:HF,margin:0});
}

/* 1 title */
{const s=dark();
 s.addText('伊勢青少年国際キャンプ',{x:0.9,y:2.15,w:11.5,h:0.95,fontSize:44,bold:true,color:WHITE,fontFace:HF,margin:0});
 s.addText('2027',{x:0.9,y:3.05,w:11.5,h:0.85,fontSize:56,bold:true,color:RED,fontFace:HF,margin:0});
 s.addText('はじまりの場所で、世界の子どもと出会う。',{x:0.95,y:4.05,w:11.5,h:0.45,fontSize:19,color:'C7D3E0',italic:true,fontFace:BF,margin:0});
 s.addText('2027年7月26日（月）〜28日（水）　2泊3日　／　三重県伊勢市',{x:0.95,y:4.75,w:11.5,h:0.35,fontSize:14,color:BLUE,fontFace:BF,margin:0});
 s.addText('伊勢青少年国際キャンプ実行委員会',{x:0.95,y:6.45,w:11.5,h:0.35,fontSize:13,color:'9FB3C8',fontFace:BF,margin:0});
 s.addNotes('後援依頼・協賛依頼・保護者説明会で共通に使う表紙。');}

/* 2 なぜいま */
{const s=light(); title(s,'なぜ、いま','課題認識');
 const items=[
  ['同じ学区に住みながら','名古屋には多くの外国にルーツを持つ子どもが暮らしています。同じ電車に乗りながら、深く関わる機会のないまま育つ子どもが少なくありません。'],
  ['「知っているつもり」のまま','日本の子どもは、自国の作法をなぜそうするのか説明できません。問われてはじめて、自分が知らなかったことに気づきます。'],
  ['一度きりでは、変わらない','単発の国際交流イベントは、その日で終わります。私たちは寝食を共にする3日間と、事前事後のつながりをつくります。'],
 ];
 items.forEach((it,i)=>{const y=1.95+i*1.55;
   numDot(s,0.75,y,i+1);
   s.addText(it[0],{x:1.45,y:y-0.04,w:11,h:0.4,fontSize:19,bold:true,color:NAVY,fontFace:HF,margin:0});
   s.addText(it[1],{x:1.45,y:y+0.42,w:10.9,h:0.85,fontSize:13.5,color:INK,fontFace:BF,margin:0,lineSpacingMultiple:1.25});
 });}

/* 3 事業概要 */
{const s=light(); title(s,'事業概要');
 const rows=[['会期','2027年7月26日（月）〜28日（水）　2泊3日'],
  ['会場','公益財団法人修養団（SYD）伊勢青少年研修センター（三重県伊勢市宇治今在家町153）'],
  ['対象','名古屋市および周辺地域の小中学生／外国にルーツを持つ小中学生'],
  ['定員','40名（30〜50名）'],
  ['参加費','50,000円（宿泊・食事・研修・保険・往復交通費を含む）'],
  ['集合・解散','名古屋駅 西側'],
  ['主催','伊勢青少年国際キャンプ実行委員会'],
  ['構成団体','BUSHIDO JAPAN ／ 株式会社鯱バス'],
  ['協力','公益財団法人修養団（SYD）／ 教育再生いばらき']];
 s.addTable(rows.map(r=>[
   {text:r[0],options:{fontSize:13,bold:true,color:WHITE,fill:{color:NAVY},fontFace:HF,valign:'middle',margin:0.09}},
   {text:r[1],options:{fontSize:13,color:INK,fill:{color:TINT},fontFace:BF,valign:'middle',margin:0.09}}]),
  {x:0.7,y:1.75,w:W-1.4,colW:[2.2,9.7],rowH:0.52,border:{type:'solid',color:WHITE,pt:1.5}});}

/* 4 三つの柱 */
{const s=light(); title(s,'このキャンプで起きること','3つの柱');
 const c=[['礼儀と感謝','早朝の正座、神宮前の清掃奉仕、飯盒炊さん。修養団が120年培ってきた集団生活の型に、当事者として入る。'],
          ['案内する側に立つ','日本の子どもが、自分の文化を通じない相手に説明する。答えられない自分に出会うことが、育ちになる。'],
          ['強さとは何か','合気道は相手を倒さない武道。「強いとは、打ち負かすことではない」は国籍も言語も超えて伝わる。']];
 c.forEach((it,i)=>{const x=0.7+i*4.07;
   s.addShape(p.ShapeType.roundRect,{x,y:1.95,w:3.8,h:3.9,fill:{color:TINT},rectRadius:0.09,
     shadow:{type:'outer',color:'B8C4D0',blur:9,offset:2,angle:90,opacity:0.35}});
   s.addShape(p.ShapeType.ellipse,{x:x+0.32,y:2.3,w:0.62,h:0.62,fill:{color:RED}});
   s.addText(String(i+1),{x:x+0.32,y:2.3,w:0.62,h:0.62,fontSize:21,bold:true,color:WHITE,align:'center',valign:'middle',fontFace:HF,margin:0});
   s.addText(it[0],{x:x+0.32,y:3.12,w:3.15,h:0.5,fontSize:20,bold:true,color:NAVY,fontFace:HF,margin:0});
   s.addText(it[1],{x:x+0.32,y:3.72,w:3.15,h:1.9,fontSize:13,color:INK,fontFace:BF,margin:0,lineSpacingMultiple:1.3});
 });
 s.addText('言葉が要らない時間が多いことが、この構成の強みです。翻訳が必要なのは講話と対話の場面だけです。',
   {x:0.7,y:6.15,w:W-1.4,h:0.4,fontSize:13,color:MUTE,italic:true,fontFace:BF,margin:0});}

/* 5 三日間 */
{const s=light(); title(s,'3日間の流れ');
 const days=[['1日目 7/26','名古屋駅西側 集合・出発','伊勢着・開会式','班づくり・バディ結成','班旗作成','キャンプファイヤー'],
             ['2日目 7/27','静座　宇治橋前 清掃奉仕','川遊び（五十鈴川）','野外炊事（飯盒炊さん）','合気道研修（英語）','ともしびの集い'],
             ['3日目 7/28','静座　内宮参拝','「誓いの言葉」を書く','発表','閉会式・修了証授与','名古屋駅西側 解散']];
 days.forEach((d,i)=>{const x=0.7+i*4.07;
   s.addShape(p.ShapeType.rect,{x,y:1.85,w:3.8,h:0.58,fill:{color:NAVY}});
   s.addText(d[0],{x:x+0.2,y:1.85,w:3.4,h:0.58,fontSize:15,bold:true,color:WHITE,valign:'middle',fontFace:HF,margin:0});
   d.slice(1).forEach((t,j)=>{const y=2.62+j*0.86;
     s.addShape(p.ShapeType.roundRect,{x,y,w:3.8,h:0.72,fill:{color:TINT},rectRadius:0.06});
     s.addShape(p.ShapeType.ellipse,{x:x+0.22,y:y+0.24,w:0.24,h:0.24,fill:{color:RED}});
     s.addText(t,{x:x+0.58,y,w:3.05,h:0.72,fontSize:12.5,color:INK,valign:'middle',fontFace:BF,margin:0});
   });});}

/* 6 バディ */
{const s=light(); title(s,'バディ制度','本事業の中核');
 s.addShape(p.ShapeType.roundRect,{x:0.7,y:1.9,w:6.1,h:4.5,fill:{color:NAVY},rectRadius:0.09});
 s.addText('日本の子どもと外国にルーツを持つ子どもを\n1対1で組み、3日間を共に過ごします。',
   {x:1.05,y:2.3,w:5.4,h:1.0,fontSize:17,bold:true,color:WHITE,fontFace:HF,margin:0,lineSpacingMultiple:1.3});
 [['移動・食事・班・部屋割りをバディ単位で'],['通訳は呼ばれるまで介入しない'],
  ['困ったら 身ぶり → 絵 → 単語 → 通訳 の順'],['「誓いの言葉」を互いの言語に訳し合う']]
  .forEach((t,i)=>{const y=3.5+i*0.68;
   s.addShape(p.ShapeType.ellipse,{x:1.05,y:y+0.13,w:0.2,h:0.2,fill:{color:RED}});
   s.addText(t[0],{x:1.4,y,w:5.1,h:0.5,fontSize:13.5,color:'DCE5EE',valign:'middle',fontFace:BF,margin:0});});
 s.addShape(p.ShapeType.roundRect,{x:7.15,y:1.9,w:5.45,h:2.1,fill:{color:TINT},rectRadius:0.09});
 s.addText('日本の子どもへ伝えるのは、\n一行で足ります。',{x:7.5,y:2.15,w:4.8,h:0.7,fontSize:14,color:MUTE,fontFace:BF,margin:0,lineSpacingMultiple:1.25});
 s.addText('「英語ができる必要はありません。\n伝えようとすることが役目です」',
   {x:7.5,y:2.95,w:4.8,h:0.85,fontSize:16,bold:true,color:RED,fontFace:HF,margin:0,lineSpacingMultiple:1.25});
 s.addShape(p.ShapeType.roundRect,{x:7.15,y:4.3,w:5.45,h:2.1,fill:{color:TINT},rectRadius:0.09});
 s.addText('事前と事後',{x:7.5,y:4.5,w:4.8,h:0.4,fontSize:16,bold:true,color:NAVY,fontFace:HF,margin:0});
 s.addText('出発4週間前にオンラインで顔合わせ。\n終了1か月後に再会の会。\n初日に「はじめまして」から始めません。',
   {x:7.5,y:5.0,w:4.8,h:1.2,fontSize:13,color:INK,fontFace:BF,margin:0,lineSpacingMultiple:1.3});}

/* 7 合気道 */
{const s=dark();
 s.addText('合気道研修（英語）',{x:0.85,y:1.15,w:11.6,h:0.8,fontSize:34,bold:true,color:WHITE,fontFace:HF,margin:0});
 s.addText('強いとは、勝つことじゃない。',{x:0.9,y:2.05,w:11.6,h:0.6,fontSize:26,bold:true,color:RED,italic:true,fontFace:HF,margin:0});
 const b=[['相手を倒さない武道','受け身から入るため、体格差・年齢差があっても成立します'],
          ['言語の壁が存在しない','株式会社鯱バス代表・宇津木滋が自ら英語で指導します'],
          ['説明が要らない','合気道は世界に広く普及しており、海外の保護者にも通じます']];
 b.forEach((t,i)=>{const x=0.85+i*3.95;
  s.addShape(p.ShapeType.roundRect,{x,y:3.35,w:3.7,h:2.5,fill:{color:'1B3A5C'},rectRadius:0.09});
  s.addShape(p.ShapeType.ellipse,{x:x+0.3,y:3.62,w:0.5,h:0.5,fill:{color:RED}});
  s.addText(String(i+1),{x:x+0.3,y:3.62,w:0.5,h:0.5,fontSize:17,bold:true,color:WHITE,align:'center',valign:'middle',fontFace:HF,margin:0});
  s.addText(t[0],{x:x+0.3,y:4.28,w:3.1,h:0.42,fontSize:16,bold:true,color:WHITE,fontFace:HF,margin:0});
  s.addText(t[1],{x:x+0.3,y:4.75,w:3.1,h:0.95,fontSize:12.5,color:'BCCBD9',fontFace:BF,margin:0,lineSpacingMultiple:1.25});});}

/* 8 会場 */
{const s=light(); title(s,'会場','公益財団法人修養団（SYD）伊勢青少年研修センター');
 const L=[['1906年（明治39年）創立','2026年に創立120年。内閣総理大臣認可の公益財団法人'],
   ['特定の宗教や政党に属さない','社会教育団体として青少年の健全育成を目的とする'],
   ['伊勢神宮 内宮に至近','宇治橋まで徒歩圏。五十鈴川での川遊びも徒歩で移動できる'],
   ['青少年の受け入れ実績','宿泊室・食堂・大講堂・キャンプファイヤー場を備える']];
 L.forEach((t,i)=>{const y=2.0+i*1.12;
   s.addShape(p.ShapeType.roundRect,{x:0.7,y,w:11.9,h:0.95,fill:{color:i%2?WHITE:TINT},rectRadius:0.06});
   s.addShape(p.ShapeType.ellipse,{x:1.0,y:y+0.28,w:0.38,h:0.38,fill:{color:RED}});
   s.addText(t[0],{x:1.6,y:y+0.08,w:4.3,h:0.42,fontSize:15,bold:true,color:NAVY,fontFace:HF,margin:0});
   s.addText(t[1],{x:6.0,y:y+0.1,w:6.4,h:0.75,fontSize:13,color:INK,fontFace:BF,margin:0,lineSpacingMultiple:1.2});});
 s.addText('本事業のプログラム進行は、修養団が担当します。',{x:0.7,y:6.6,w:11.9,h:0.35,fontSize:13,color:MUTE,italic:true,fontFace:BF,margin:0});}

/* 9 安全 */
{const s=light(); title(s,'安全への取り組み');
 const g=[['引率体制','引率者1名あたりの子どもは8名以下。常に班行動とする'],
   ['看護担当','看護師資格保持者が夜間を含めて常駐'],
   ['医療連携','研修センターのホームドクター（原則24時間対応）と連携'],
   ['傷害保険','参加者・スタッフ全員に付保'],
   ['熱中症対策','屋外活動を早朝に集中。暑さ指数による中止基準を事前に設定'],
   ['水の事故','泳力の事前申告を必須化。エリア分けと入水前後の人数確認']];
 g.forEach((t,i)=>{const x=0.7+(i%3)*4.07, y=1.95+Math.floor(i/3)*2.25;
   s.addShape(p.ShapeType.roundRect,{x,y,w:3.8,h:1.95,fill:{color:TINT},rectRadius:0.09});
   s.addShape(p.ShapeType.ellipse,{x:x+0.3,y:y+0.28,w:0.42,h:0.42,fill:{color:NAVY}});
   s.addText(t[0],{x:x+0.88,y:y+0.26,w:2.7,h:0.46,fontSize:15,bold:true,color:NAVY,valign:'middle',fontFace:HF,margin:0});
   s.addText(t[1],{x:x+0.3,y:y+0.85,w:3.2,h:0.95,fontSize:12.5,color:INK,fontFace:BF,margin:0,lineSpacingMultiple:1.25});});
 s.addText('期間中は毎日、活動の様子を写真つきで保護者に配信します。',{x:0.7,y:6.6,w:11.9,h:0.35,fontSize:13,color:MUTE,italic:true,fontFace:BF,margin:0});}

/* 10 配慮 */
{const s=light(); title(s,'多様な背景への配慮','参加者には、さまざまな信仰・食習慣・文化的背景を持つ家庭の子どもが含まれます');
 const r=[['神宮参拝','日本文化の作法を学ぶ体験として実施します。一礼や手水は礼儀として全員が学びますが、何を祈るか、あるいは祈らないかは本人の自由です'],
   ['食事','ハラル・ベジタリアン等の対応を事前に確認・手配します。野外炊事の食材も成分まで確認します'],
   ['入浴','日本の大浴場文化を事前に説明します。抵抗のある参加者には個別の入浴時間を用意します'],
   ['言語','日英2言語で書類を用意し、説明会にも通訳を配置します']];
 r.forEach((t,i)=>{const y=2.15+i*1.15;
   s.addShape(p.ShapeType.rect,{x:0.7,y,w:1.85,h:0.95,fill:{color:NAVY}});
   s.addText(t[0],{x:0.7,y,w:1.85,h:0.95,fontSize:15,bold:true,color:WHITE,align:'center',valign:'middle',fontFace:HF,margin:0});
   s.addShape(p.ShapeType.rect,{x:2.55,y,w:10.05,h:0.95,fill:{color:TINT}});
   s.addText(t[1],{x:2.85,y,w:9.5,h:0.95,fontSize:13,color:INK,valign:'middle',fontFace:BF,margin:0,lineSpacingMultiple:1.2});});}

/* 11 収支 */
{const s=light(); title(s,'収支予算（40名）','本事業は営利を目的とせず、剰余金は参加費の減免および次年度事業に充てます');
 const inc=[['参加費　50,000円 × 40名','2,000,000'],['協賛金（目標）','400,000'],['合計','2,400,000']];
 const exp=[['研修センター負担金','1,000,000'],['引率スタッフ宿泊費','200,000'],['貸切バス（鯱バス様 協賛）','0'],
  ['通訳費','150,000'],['看護担当','120,000'],['傷害保険','104,000'],['教材・しおり・修了証','120,000'],
  ['広報費','150,000'],['保護者説明会 運営費','60,000'],['通信・事務費','80,000'],
  ['参加費減免枠（2名分）','100,000'],['予備費','200,000'],['次年度繰越金','116,000'],['合計','2,400,000']];
 s.addText('収入の部',{x:0.7,y:1.85,w:5.6,h:0.4,fontSize:16,bold:true,color:NAVY,fontFace:HF,margin:0});
 s.addTable(inc.map((r,i)=>[
   {text:r[0],options:{fontSize:12,bold:i===2,color:INK,fill:{color:i===2?'DCE4EC':TINT},fontFace:BF,margin:0.07}},
   {text:r[1],options:{fontSize:12,bold:i===2,color:INK,fill:{color:i===2?'DCE4EC':TINT},align:'right',fontFace:BF,margin:0.07}}]),
  {x:0.7,y:2.32,w:5.6,colW:[3.9,1.7],rowH:0.38,border:{type:'solid',color:WHITE,pt:1.2}});
 s.addText('支出の部',{x:6.75,y:1.85,w:5.85,h:0.4,fontSize:16,bold:true,color:NAVY,fontFace:HF,margin:0});
 s.addTable(exp.map((r,i)=>[
   {text:r[0],options:{fontSize:11,bold:i===13,color:INK,fill:{color:i===13?'DCE4EC':TINT},fontFace:BF,margin:0.05}},
   {text:r[1],options:{fontSize:11,bold:i===13,color:INK,fill:{color:i===13?'DCE4EC':TINT},align:'right',fontFace:BF,margin:0.05}}]),
  {x:6.75,y:2.32,w:5.85,colW:[4.1,1.75],rowH:0.31,border:{type:'solid',color:WHITE,pt:1.2}});
 s.addText('実行委員4名は宿泊費を自己負担とし、無報酬で運営にあたります。収支報告は事業終了後に公開します。',
   {x:0.7,y:6.75,w:11.9,h:0.35,fontSize:12,color:MUTE,italic:true,fontFace:BF,margin:0});}

/* 12 体制 */
{const s=light(); title(s,'実施体制');
 const rows=[['実行委員長','上岡 賢輔','BUSHIDO JAPAN'],
   ['実行委員','嶺田 英智','スカイウォーカー株式会社'],
   ['実行委員','大久保 雅弘','株式会社キュリオシティ 代表取締役'],
   ['実行委員','山本 かな','株式会社鯱バス'],
   ['合気道研修 主任講師','宇津木 滋','株式会社鯱バス']];
 s.addTable([[{text:'役職',options:{fontSize:12,bold:true,color:WHITE,fill:{color:NAVY},fontFace:HF,margin:0.08}},
   {text:'氏名',options:{fontSize:12,bold:true,color:WHITE,fill:{color:NAVY},fontFace:HF,margin:0.08}},
   {text:'所属',options:{fontSize:12,bold:true,color:WHITE,fill:{color:NAVY},fontFace:HF,margin:0.08}}]]
  .concat(rows.map(r=>r.map(c=>({text:c,options:{fontSize:12.5,color:INK,fill:{color:TINT},fontFace:BF,valign:'middle',margin:0.08}})))),
  {x:0.7,y:1.85,w:11.9,colW:[3.2,3.0,5.7],rowH:0.5,border:{type:'solid',color:WHITE,pt:1.5}});
 const st=[['ボランティアスタッフ','5名程度'],['通訳','2〜3名'],['看護担当','1名'],['合気道研修 講師','宇津木氏ほか2名']];
 st.forEach((t,i)=>{const x=0.7+i*3.05;
   s.addShape(p.ShapeType.roundRect,{x,y:5.0,w:2.85,h:1.3,fill:{color:TINT},rectRadius:0.08});
   s.addText(t[1],{x:x+0.2,y:5.18,w:2.45,h:0.5,fontSize:20,bold:true,color:RED,fontFace:HF,margin:0});
   s.addText(t[0],{x:x+0.2,y:5.72,w:2.45,h:0.4,fontSize:11.5,color:MUTE,fontFace:BF,margin:0});});
 s.addText('プログラムの進行は修養団が担当し、実行委員会は引率と国際交流プログラムの運営にあたります。',
   {x:0.7,y:6.6,w:11.9,h:0.35,fontSize:12.5,color:MUTE,italic:true,fontFace:BF,margin:0});}

/* 13 スケジュール */
{const s=light(); title(s,'今後のスケジュール');
 const sc=[['2026年 9月','実行委員会 設立　後援名義の申請'],['2026年 10月〜11月','協賛募集　募集要項・チラシ・LP制作'],
  ['2027年 1月1日','募集開始'],['2027年 3月','一次締切・参加者確定'],
  ['2027年 5・6・7月','保護者説明会（名古屋市内・全3回／オンライン併催）'],
  ['2027年 7月26〜28日','伊勢青少年国際キャンプ2027 開催'],['2027年 8月〜9月','実施報告書・収支報告の作成と公開']];
 sc.forEach((t,i)=>{const y=1.9+i*0.71;
   s.addShape(p.ShapeType.rect,{x:0.7,y,w:2.75,h:0.6,fill:{color:i===5?RED:NAVY}});
   s.addText(t[0],{x:0.7,y,w:2.75,h:0.6,fontSize:13,bold:true,color:WHITE,align:'center',valign:'middle',fontFace:HF,margin:0});
   s.addShape(p.ShapeType.rect,{x:3.45,y,w:9.15,h:0.6,fill:{color:i===5?'F6E4E2':TINT}});
   s.addText(t[1],{x:3.75,y,w:8.6,h:0.6,fontSize:13,bold:i===5,color:i===5?RED:INK,valign:'middle',fontFace:BF,margin:0});});}

/* 14 closing */
{const s=dark();
 s.addText('ご支援のお願い',{x:0.9,y:1.35,w:11.5,h:0.8,fontSize:34,bold:true,color:WHITE,fontFace:HF,margin:0});
 s.addText('この事業は、毎年続く事業として育てたいと考えています。\n参加した子どもが翌年は上級生として、やがては運営に関わる側として\n戻ってくる。そのような循環をつくります。',
  {x:0.9,y:2.3,w:11.4,h:1.4,fontSize:16,color:'C7D3E0',fontFace:BF,margin:0,lineSpacingMultiple:1.45});
 const a=[['後援','名義のご承認をいただくことで、より多くのご家庭に届きます'],
  ['協賛','いただいたご支援は減免枠と通訳の配置に充てます'],
  ['ご紹介','関心を持たれそうな学校・団体をお教えください']];
 a.forEach((t,i)=>{const x=0.9+i*3.85;
  s.addShape(p.ShapeType.roundRect,{x,y:4.0,w:3.6,h:1.85,fill:{color:NAVY},rectRadius:0.09});
  s.addText(t[0],{x:x+0.3,y:4.25,w:3.0,h:0.45,fontSize:19,bold:true,color:RED,fontFace:HF,margin:0});
  s.addText(t[1],{x:x+0.3,y:4.78,w:3.0,h:0.9,fontSize:12.5,color:'BCCBD9',fontFace:BF,margin:0,lineSpacingMultiple:1.25});});
 s.addText('伊勢青少年国際キャンプ実行委員会 事務局（BUSHIDO JAPAN）　愛知県豊明市西川町島原14-12　TEL 090-5101-5064　担当 上岡賢輔',
  {x:0.9,y:6.55,w:11.5,h:0.35,fontSize:11.5,color:'8FA5BA',fontFace:BF,margin:0});}

p.writeFile({fileName:'伊勢青少年国際キャンプ2027_事業説明資料.pptx'}).then(f=>console.log('OK',f));
