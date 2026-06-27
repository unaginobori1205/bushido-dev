/**
 * 【BUSHIDO JAPAN主催】飲食店向けハラル対応セミナー 申込フォーム
 *
 * Google Apps Script で実行すると以下を自動で行います。
 *   1. 回答保存用スプレッドシートを作成
 *   2. 申込フォームを作成（質問・検証つき）
 *   3. フォームを公開状態に設定し、回答先をスプレッドシートに接続
 *   4. 公開URLのQRコード(PNG)を生成して Google Drive に保存
 *   5. 管理メモシートに各種URLとQR画像URLを記録
 *
 * 使い方:
 *   1. Googleドライブで 新規 → その他 → Google Apps Script
 *   2. このコードを貼り付ける
 *   3. 関数 createHalalSeminarForm を選択して実行
 *   4. 初回のみ権限を承認（フォーム・スプレッドシート・ドライブ・外部通信）
 *   5. 実行ログに 各URL／QR画像URL が出力されます
 */
function createHalalSeminarForm() {
  const formTitle = '【BUSHIDO JAPAN主催】飲食店向けハラル対応セミナー 申込フォーム';
  // 回答保存用スプレッドシートを作成
  const ss = SpreadsheetApp.create('飲食店向けハラル対応セミナー_申込回答一覧');
  // フォーム作成
  const form = FormApp.create(formTitle);
  form.setDescription(
    'BUSHIDO JAPAN主催「飲食店向けハラル対応セミナー」の申込フォームです。\n\n' +
    '【オンラインセミナー】\n' +
    '日時：7月16日（木）15:00〜16:00\n' +
    '形式：オンライン\n' +
    '参加費：無料\n' +
    '講師：ハラルナビ　マーケティング責任者　ハヤトさん\n\n' +
    '【8月開催予定｜オフライン実践セミナー】\n' +
    '候補日：8月18日（火）15:00〜17:00\n' +
    '会場：名古屋駅付近予定\n' +
    '参加費：1名 30,000円予定\n' +
    '形式：スクール形式・配布資料あり'
  );
  form.setConfirmationMessage(
    'お申し込みありがとうございます。\n' +
    'BUSHIDO JAPAN事務局より、後日詳細をご案内いたします。'
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(true);
  form.setAcceptingResponses(true);
  // 回答保存先をスプレッドシートへ
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  // セクション：申込内容
  form.addSectionHeaderItem()
    .setTitle('お申し込み内容')
    .setHelpText('参加希望の内容を選択してください。');
  const participationItem = form.addMultipleChoiceItem();
  participationItem
    .setTitle('参加希望')
    .setRequired(true)
    .setChoices([
      participationItem.createChoice('7月16日（木）オンラインセミナーに申し込む'),
      participationItem.createChoice('7月16日オンラインセミナーに申し込む ＋ 8月18日オフライン実践セミナーにも関心あり'),
      participationItem.createChoice('8月18日オフライン実践セミナーのみ関心あり'),
      participationItem.createChoice('今回は情報収集のみ')
    ]);
  // セクション：参加者情報
  form.addSectionHeaderItem()
    .setTitle('参加者情報')
    .setHelpText('飲食店名・ご担当者様情報をご入力ください。');
  form.addTextItem()
    .setTitle('会社名・店舗名')
    .setRequired(true);
  form.addTextItem()
    .setTitle('ご担当者名')
    .setRequired(true);
  const emailValidation = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText('メールアドレスの形式で入力してください。')
    .build();
  form.addTextItem()
    .setTitle('メールアドレス')
    .setRequired(true)
    .setValidation(emailValidation);
  form.addTextItem()
    .setTitle('電話番号')
    .setHelpText('例：090-0000-0000')
    .setRequired(true);
  form.addTextItem()
    .setTitle('店舗所在地')
    .setHelpText('例：名古屋市中区、名古屋駅周辺など')
    .setRequired(false);
  const businessTypeItem = form.addListItem();
  businessTypeItem
    .setTitle('業種')
    .setRequired(true)
    .setChoices([
      businessTypeItem.createChoice('飲食店'),
      businessTypeItem.createChoice('宿泊施設'),
      businessTypeItem.createChoice('観光・旅行関係'),
      businessTypeItem.createChoice('行政・団体'),
      businessTypeItem.createChoice('その他')
    ]);
  const numberValidation = FormApp.createTextValidation()
    .requireWholeNumber()
    .setHelpText('半角数字で入力してください。例：1')
    .build();
  form.addTextItem()
    .setTitle('参加人数')
    .setHelpText('オンラインセミナーに参加予定の人数をご入力ください。')
    .setRequired(true)
    .setValidation(numberValidation);
  // セクション：関心テーマ
  form.addSectionHeaderItem()
    .setTitle('関心のある内容')
    .setHelpText('特に知りたい内容があれば選択してください。');
  const interestItem = form.addCheckboxItem();
  interestItem
    .setTitle('関心のあるテーマ')
    .setRequired(false)
    .setChoices([
      interestItem.createChoice('ハラル、イスラムについての基礎知識'),
      interestItem.createChoice('ムスリムのお客様への理解'),
      interestItem.createChoice('日本におけるムスリム市場の可能性やニーズ'),
      interestItem.createChoice('実際の成功事例'),
      interestItem.createChoice('アジア大会に向けて飲食店が準備すべきこと'),
      interestItem.createChoice('名古屋飯のハラル対応の考え方'),
      interestItem.createChoice('15〜20品目の具体例紹介'),
      interestItem.createChoice('調味料・原材料・商品規格書の確認ポイント'),
      interestItem.createChoice('厨房オペレーション'),
      interestItem.createChoice('スタッフ対応・接客方法')
    ]);
  form.addParagraphTextItem()
    .setTitle('講師への質問・相談したいこと')
    .setHelpText('ハラル対応、名古屋飯、厨房オペレーションなど、事前に聞きたい内容があればご記入ください。')
    .setRequired(false);
  const sourceItem = form.addListItem();
  sourceItem
    .setTitle('このセミナーをどこで知りましたか？')
    .setRequired(false)
    .setChoices([
      sourceItem.createChoice('Facebook'),
      sourceItem.createChoice('Instagram'),
      sourceItem.createChoice('LINE'),
      sourceItem.createChoice('知人からの紹介'),
      sourceItem.createChoice('BUSHIDO JAPANからの案内'),
      sourceItem.createChoice('その他')
    ]);
  // 個人情報同意
  const agreementItem = form.addCheckboxItem();
  agreementItem
    .setTitle('個人情報の取り扱いについて')
    .setHelpText('ご入力いただいた情報は、セミナー運営および今後のご案内のために使用します。')
    .setRequired(true)
    .setChoices([
      agreementItem.createChoice('上記内容に同意します')
    ]);

  // 公開URL（申込者用URL）のQRコード(PNG)を生成して Drive に保存
  const publishedUrl = form.getPublishedUrl();
  let qrFileUrl = '';
  try {
    const qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=' +
      encodeURIComponent(publishedUrl);
    const qrBlob = UrlFetchApp.fetch(qrApi).getBlob()
      .setName('ハラルセミナー申込フォーム_QR.png');
    const qrFile = DriveApp.createFile(qrBlob);
    qrFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    qrFileUrl = qrFile.getUrl();
  } catch (e) {
    Logger.log('QRコード生成に失敗しました: ' + e);
  }

  // 管理メモシート作成
  const memoSheet = ss.getSheets()[0];
  memoSheet.setName('管理メモ');
  memoSheet.getRange('A1').setValue('フォーム編集URL');
  memoSheet.getRange('B1').setValue(form.getEditUrl());
  memoSheet.getRange('A2').setValue('申込者用URL');
  memoSheet.getRange('B2').setValue(publishedUrl);
  memoSheet.getRange('A3').setValue('回答スプレッドシートURL');
  memoSheet.getRange('B3').setValue(ss.getUrl());
  memoSheet.getRange('A4').setValue('QRコード画像URL(PNG)');
  memoSheet.getRange('B4').setValue(qrFileUrl);
  Logger.log('フォーム編集URL: ' + form.getEditUrl());
  Logger.log('申込者用URL: ' + publishedUrl);
  Logger.log('回答スプレッドシートURL: ' + ss.getUrl());
  Logger.log('QRコード画像URL(PNG): ' + qrFileUrl);
}
