/**
 * BUSHIDO JAPAN 弓道体験 申込フォーム自動作成
 * 日本語・英語併記
 * 希望日程：2週間以上先、第一希望・第二希望の2日入力
 */
const CONFIG = {
  ownerEmail: 'ken.pp.1205@gmail.com',
  formTitle: '名古屋で本格弓道体験 申込フォーム / Authentic Kyudo Experience in Nagoya',
  spreadsheetTitle: '名古屋で本格弓道体験 申込一覧 / Kyudo Experience Applications',
  minDaysAhead: 14,
  timezone: 'Asia/Tokyo'
};

function createKyudoApplicationForm() {
  const form = FormApp.create(CONFIG.formTitle);
  form.setDescription(
    'BUSHIDO JAPANの弓道体験申込フォームです。\n' +
    'This is the application form for the BUSHIDO JAPAN Kyudo Experience.\n\n' +
    '体験時間：12:00集合 / 12:30〜15:00体験\n' +
    'Meeting time: 12:00 / Experience time: 12:30–15:00\n\n' +
    '※希望日は本日から2週間以上先の日程を2日ご入力ください。\n' +
    'Please select two preferred dates at least 14 days from today.'
  );
  form.setConfirmationMessage(
    'お申込みありがとうございます。内容を確認のうえ、担当者よりご連絡いたします。\n\n' +
    'Thank you for your application. We will review your request and contact you shortly.'
  );
  form.setAllowResponseEdits(true);
  form.setAcceptingResponses(true);

  const ss = SpreadsheetApp.create(CONFIG.spreadsheetTitle);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  const minDate = getMinimumDate_();
  const minDateText = Utilities.formatDate(minDate, CONFIG.timezone, 'yyyy/MM/dd');

  // 基本情報
  form.addSectionHeaderItem()
    .setTitle('お客様情報 / Guest Information');
  form.addTextItem()
    .setTitle('お名前 / Full Name')
    .setRequired(true);

  const emailValidation = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText('正しいメールアドレスを入力してください / Please enter a valid email address.')
    .build();
  form.addTextItem()
    .setTitle('メールアドレス / Email Address')
    .setValidation(emailValidation)
    .setRequired(true);

  form.addTextItem()
    .setTitle('電話番号・WhatsApp / Phone Number or WhatsApp')
    .setRequired(true);
  form.addTextItem()
    .setTitle('国籍・居住地 / Nationality or Country of Residence')
    .setRequired(false);

  const participantValidation = FormApp.createTextValidation()
    .requireNumberBetween(1, 20)
    .setHelpText('1〜20の数字で入力してください / Please enter a number between 1 and 20.')
    .build();
  form.addTextItem()
    .setTitle('参加人数 / Number of Participants')
    .setValidation(participantValidation)
    .setRequired(true);

  // 希望日程
  form.addSectionHeaderItem()
    .setTitle('希望日程 / Preferred Dates')
    .setHelpText(
      '希望日は2週間以上先の日程を、第一希望・第二希望の2日ご入力ください。\n' +
      'Please select two preferred dates at least 14 days from today.'
    );
  form.addDateItem()
    .setTitle('第1希望日 / First Preferred Date')
    .setHelpText(
      minDateText + '以降の日程をご選択ください。\n' +
      'Please select a date on or after ' + minDateText + '.'
    )
    .setRequired(true);
  form.addDateItem()
    .setTitle('第2希望日 / Second Preferred Date')
    .setHelpText(
      '第1希望日とは別の日程をご選択ください。' + minDateText + '以降の日程のみ有効です。\n' +
      'Please select a different date from your first choice, on or after ' + minDateText + '.'
    )
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('体験時間 / Experience Time')
    .setChoiceValues([
      '12:00集合 / 12:30〜15:00体験',
      'その他希望あり / Other request'
    ])
    .setRequired(true);

  // プラン選択
  form.addSectionHeaderItem()
    .setTitle('ご希望プラン / Preferred Plan');
  form.addListItem()
    .setTitle('ご希望プラン / Preferred Plan')
    .setChoiceValues([
      'スタンダードプラン 30,000円／人 / Standard Plan 30,000 JPY per person',
      'サムライスタイルプラン 40,000円／人 / Samurai Style Plan 40,000 JPY per person',
      '着物弓道プラン 男性 50,000円／人 / Kimono Kyudo Plan Men 50,000 JPY per person',
      '着物弓道プラン 女性 65,000円／人 / Kimono Kyudo Plan Women 65,000 JPY per person',
      'VIPマスタープラン 88,000円〜／人 / VIP Master Plan from 88,000 JPY per person',
      '相談して決めたい / I would like to consult first'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('参加者情報・サイズ等 / Participant Details and Sizes')
    .setHelpText(
      '着物・道着希望の場合、身長・性別・服のサイズ等をご記入ください。\n' +
      'If you wish to wear kimono or uniform, please provide height, gender, and clothing size if possible.'
    )
    .setRequired(false);

  // 経験・安全確認
  form.addSectionHeaderItem()
    .setTitle('経験・安全確認 / Experience and Safety');
  form.addMultipleChoiceItem()
    .setTitle('弓道・弓術・アーチェリー経験 / Kyudo, Japanese Archery, or Archery Experience')
    .setChoiceValues([
      '初心者 / Beginner',
      '少し経験あり / Some experience',
      '経験者 / Experienced',
      '有段者・指導者 / Ranked practitioner or instructor'
    ])
    .setRequired(true);
  form.addCheckboxItem()
    .setTitle('安全事項への同意 / Safety Agreement')
    .setChoiceValues([
      '安全説明と講師の指示に従います / I agree to follow the safety instructions and instructor guidance.'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('ご要望・質問 / Requests or Questions')
    .setHelpText(
      '記念日、VIPゲスト対応、通訳、送迎、撮影希望などがあればご記入ください。\n' +
      'Please let us know any requests such as anniversary, VIP guest support, interpreter, transportation, or photography.'
    )
    .setRequired(false);

  // 送信後チェック用トリガー
  ScriptApp.newTrigger('validateKyudoApplicationOnSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log('フォーム編集URL / Edit URL: ' + form.getEditUrl());
  Logger.log('申込フォームURL / Public Form URL: ' + form.getPublishedUrl());
  Logger.log('回答スプレッドシートURL / Spreadsheet URL: ' + ss.getUrl());

  MailApp.sendEmail({
    to: CONFIG.ownerEmail,
    subject: '弓道体験申込フォームを作成しました',
    body:
      '弓道体験申込フォームを作成しました。\n\n' +
      '編集URL:\n' + form.getEditUrl() + '\n\n' +
      '申込フォームURL:\n' + form.getPublishedUrl() + '\n\n' +
      '回答スプレッドシートURL:\n' + ss.getUrl()
  });
}

/**
 * フォーム送信後の自動チェック
 * - 希望日が2週間以上先か
 * - 第1希望日と第2希望日が別日か
 * - 申込者と管理者へメール通知
 */
function validateKyudoApplicationOnSubmit(e) {
  const itemResponses = e.response.getItemResponses();

  const name = getResponseByTitleStart_(itemResponses, 'お名前') || 'No Name';
  const email = getResponseByTitleStart_(itemResponses, 'メールアドレス');
  const firstDate = getResponseByTitleStart_(itemResponses, '第1希望日');
  const secondDate = getResponseByTitleStart_(itemResponses, '第2希望日');
  const plan = getResponseByTitleStart_(itemResponses, 'ご希望プラン');
  const participants = getResponseByTitleStart_(itemResponses, '参加人数');

  const minDate = stripTime_(getMinimumDate_());
  const d1 = stripTime_(new Date(firstDate));
  const d2 = stripTime_(new Date(secondDate));

  const minDateText = Utilities.formatDate(minDate, CONFIG.timezone, 'yyyy/MM/dd');
  const d1Text = Utilities.formatDate(d1, CONFIG.timezone, 'yyyy/MM/dd');
  const d2Text = Utilities.formatDate(d2, CONFIG.timezone, 'yyyy/MM/dd');

  const errors = [];
  if (d1 < minDate) {
    errors.push('第1希望日が2週間以上先ではありません / First preferred date is not at least 14 days ahead.');
  }
  if (d2 < minDate) {
    errors.push('第2希望日が2週間以上先ではありません / Second preferred date is not at least 14 days ahead.');
  }
  if (d1.getTime() === d2.getTime()) {
    errors.push('第1希望日と第2希望日が同じ日です / The first and second preferred dates are the same.');
  }

  const allResponsesText = buildAllResponsesText_(itemResponses);

  if (errors.length > 0) {
    const subjectOwner = '【要確認】弓道体験申込：日程条件外の可能性あり';
    const bodyOwner =
      '以下の申込は日程条件の確認が必要です。\n\n' +
      'お名前: ' + name + '\n' +
      'メール: ' + email + '\n' +
      '参加人数: ' + participants + '\n' +
      'プラン: ' + plan + '\n' +
      '第1希望日: ' + d1Text + '\n' +
      '第2希望日: ' + d2Text + '\n' +
      '有効な最短日: ' + minDateText + '\n\n' +
      '確認事項:\n' + errors.join('\n') + '\n\n' +
      '--- 全回答 ---\n' +
      allResponsesText;
    MailApp.sendEmail(CONFIG.ownerEmail, subjectOwner, bodyOwner);

    if (email && String(email).includes('@')) {
      MailApp.sendEmail({
        to: email,
        subject: '【BUSHIDO JAPAN】希望日程の再確認をお願いします / Please Review Your Preferred Dates',
        body:
          name + ' 様\n\n' +
          'BUSHIDO JAPANへのお申込みありがとうございます。\n\n' +
          'ご入力いただいた希望日程について、以下の確認が必要です。\n' +
          '希望日は本日から2週間以上先の日程を、2日ご入力いただく必要があります。\n\n' +
          '有効な最短日: ' + minDateText + '\n' +
          '第1希望日: ' + d1Text + '\n' +
          '第2希望日: ' + d2Text + '\n\n' +
          errors.join('\n') + '\n\n' +
          '担当者より改めてご連絡いたします。\n\n' +
          'Thank you for your application to BUSHIDO JAPAN.\n' +
          'Please note that your preferred dates need to be at least 14 days from today, and two different dates are required.\n\n' +
          'We will contact you shortly.\n\n' +
          'BUSHIDO JAPAN\n' +
          'Contact: ' + CONFIG.ownerEmail
      });
    }
    return;
  }

  const subjectOwner = '【新規申込】名古屋で本格弓道体験';
  const bodyOwner =
    '新しい申込がありました。\n\n' +
    'お名前: ' + name + '\n' +
    'メール: ' + email + '\n' +
    '参加人数: ' + participants + '\n' +
    'プラン: ' + plan + '\n' +
    '第1希望日: ' + d1Text + '\n' +
    '第2希望日: ' + d2Text + '\n\n' +
    '--- 全回答 ---\n' +
    allResponsesText;
  MailApp.sendEmail(CONFIG.ownerEmail, subjectOwner, bodyOwner);

  if (email && String(email).includes('@')) {
    MailApp.sendEmail({
      to: email,
      subject: '【BUSHIDO JAPAN】お申込みありがとうございます / Thank you for your application',
      body:
        name + ' 様\n\n' +
        'BUSHIDO JAPANの弓道体験へお申込みいただき、ありがとうございます。\n' +
        '以下の内容で申込を受け付けました。\n\n' +
        '第1希望日: ' + d1Text + '\n' +
        '第2希望日: ' + d2Text + '\n' +
        '参加人数: ' + participants + '\n' +
        'プラン: ' + plan + '\n\n' +
        '内容を確認のうえ、担当者より日程調整のご連絡をいたします。\n\n' +
        'Thank you for applying for the BUSHIDO JAPAN Kyudo Experience.\n' +
        'We have received your request and will contact you after reviewing the details.\n\n' +
        'BUSHIDO JAPAN\n' +
        'Contact: ' + CONFIG.ownerEmail
    });
  }
}

/**
 * 今日からCONFIG.minDaysAhead日後の日付を返す
 */
function getMinimumDate_() {
  const now = new Date();
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() + CONFIG.minDaysAhead);
  return minDate;
}

/**
 * 日付比較用に時刻を0:00へそろえる
 */
function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 指定タイトルで始まる回答を取得
 */
function getResponseByTitleStart_(itemResponses, titleStart) {
  for (const itemResponse of itemResponses) {
    const title = itemResponse.getItem().getTitle();
    if (title.indexOf(titleStart) === 0) {
      return itemResponse.getResponse();
    }
  }
  return '';
}

/**
 * 全回答をメール本文用に整形
 */
function buildAllResponsesText_(itemResponses) {
  return itemResponses.map(function(itemResponse) {
    return itemResponse.getItem().getTitle() + '\n' + itemResponse.getResponse();
  }).join('\n\n');
}
