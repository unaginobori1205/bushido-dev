/**
 * AI時代のSNS実践セミナー アンケート — Googleフォーム 自動生成スクリプト
 * 名古屋JC SNS戦略部会
 *
 * 【使い方】
 *  1. https://script.google.com/ を開く →「新しいプロジェクト」
 *  2. 既存コードを全部消して、この内容を丸ごと貼り付け
 *  3. 上部の関数選択で createSurveyForm を選び「▶ 実行」
 *  4. 初回は権限の承認を求められるので承認（自分のGoogleアカウント）
 *  5. 実行ログ（表示 → ログ）に、フォームの編集URL・回答URL・集計シートURLが出ます
 *
 * 生成されるもの：
 *  - Googleフォーム（全14設問・氏名と区分は必須）
 *  - 回答集計用スプレッドシート（フォームと自動連携／回答が自動で行追加）
 *  ※ フォームの「回答」タブでも自動でグラフ集計されます（追加設定不要）。
 */
function createSurveyForm() {
  var form = FormApp.create('AI時代のSNS実践セミナー アンケート')
    .setDescription(
      '本日はありがとうございました。今後のセミナー運営と、皆さんへの個別フォロー・資料送付のためにご協力ください。所要2〜3分。\n' +
      '※「お名前」と「ご区分」は必須です。オブザーバーの方は最後に入会のご意思をお聞きします。')
    .setProgressBar(true)
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false);

  // 1. ご区分（必須）
  form.addMultipleChoiceItem()
    .setTitle('ご区分')
    .setChoiceValues(['SNS戦略部会員', 'オブザーバー（部会員以外）'])
    .setRequired(true);

  // 2. 本日の満足度（必須）
  form.addMultipleChoiceItem()
    .setTitle('本日の満足度')
    .setChoiceValues(['★5 とても良かった', '★4 良かった', '★3 普通', '★2 物足りない', '★1 良くなかった'])
    .setRequired(true);

  // 3. 一番印象に残った内容（複数可）
  form.addCheckboxItem()
    .setTitle('一番印象に残った内容（複数選択可）')
    .setChoiceValues(['なぜSNSなのか（目的）', 'AI秘書システム', '実演1：例会をSNS化',
      '実演2：画像・動画生成', '実演3：AI秘書・AIチーム', '補助金・助成金の話', 'その他']);

  // 4. 気になったAIツール（複数可）
  form.addCheckboxItem()
    .setTitle('気になった・使ってみたいAIツール（複数選択可）')
    .setChoiceValues(['ChatGPT', 'Claude / Claude Code', 'NotebookLM', '画像生成AI',
      '動画生成AI（Google Flow 等）', 'Notion', 'Google Drive', 'まだ決めていない']);

  // 5. 気になった補助金（複数可）
  form.addCheckboxItem()
    .setTitle('気になった・相談したい補助金（複数選択可）')
    .setChoiceValues(['①デジタル化・AI導入補助金', '②省力化投資補助金', '③持続化補助金',
      '④リスキリング助成金（研修）', '⑤ものづくり補助金', 'よく分からないので相談したい', '特になし']);

  // 6. 今日・明日やること
  form.addTextItem().setTitle('今日または明日、まず何を実行しますか？');

  // 7. 誰に伝えるか
  form.addTextItem().setTitle('今日の学びを、誰に伝えますか？');

  // 8. 今後知りたいこと
  form.addParagraphTextItem().setTitle('今後もっと知りたい内容・テーマ');

  // 9. 個別相談
  form.addMultipleChoiceItem()
    .setTitle('個別相談を希望しますか？')
    .setChoiceValues(['はい、希望する', '内容によっては', 'いいえ']);

  // 10. 共有資料の送付希望
  form.addMultipleChoiceItem()
    .setTitle('共有資料（プロンプト集・スライド等）の送付を希望しますか？')
    .setChoiceValues(['はい', 'いいえ']);

  // 11. 感想（自由記述）
  form.addParagraphTextItem().setTitle('ご感想・自由記述（良かった点・改善点など）');

  // 12. お名前（必須）
  form.addTextItem().setTitle('お名前').setRequired(true);

  // 13. ご連絡先（任意）
  form.addTextItem().setTitle('ご連絡先（メール／SNS等・任意。資料送付・個別相談をご希望の方）');

  // ── ここからオブザーバーの方向け ──
  form.addSectionHeaderItem()
    .setTitle('【オブザーバーの方へ】')
    .setHelpText('SNS戦略部会員の方は、ここから先は未記入のままご送信ください。');

  // 14. 入会意思（オブザーバー向け）
  form.addMultipleChoiceItem()
    .setTitle('SNS戦略部会への入会のご意思（オブザーバーの方のみ）')
    .setChoiceValues(['ぜひ入会したい', '前向きに検討したい', 'まず話を聞いてみたい', '今回は見送る']);

  form.addParagraphTextItem()
    .setTitle('入会について気になる点・ご質問（オブザーバーの方のみ・任意）');

  // 回答集計用スプレッドシートを作成し、フォームに自動連携（=自動集計）
  var ss = SpreadsheetApp.create('AI SNSセミナー アンケート回答（自動集計）');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('▼ フォーム編集URL（設問の手直し用）:\n' + form.getEditUrl());
  Logger.log('▼ 回答してもらうURL（配布・QR化用）:\n' + form.getPublishedUrl());
  Logger.log('▼ 集計スプレッドシートURL（回答が自動で溜まります）:\n' + ss.getUrl());
}
