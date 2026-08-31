/*******************************************************************
 * プレジャーハウス 問合せ顧客管理システム — バックエンド
 * Google Apps Script（スプレッドシートに紐づけて使用）
 *
 * ■ 使い方
 *  1. Googleスプレッドシートを新規作成し、シート名を「問合せ」にする
 *  2. 拡張機能 > Apps Script を開き、このコードを貼り付ける
 *  3. setup() を1度だけ実行してヘッダー行を作成
 *  4. デプロイ > 新しいデプロイ > 種類「ウェブアプリ」
 *       実行ユーザー：自分 ／ アクセスできるユーザー：全員
 *  5. 発行された /exec の URL を assets/config.js の API_URL に貼る
 *******************************************************************/

var SHEET_NAME  = '問合せ';
var TOKEN       = 'pleasure-house-2026';        // assets/config.js の ADMIN_TOKEN と揃える
var NOTIFY_TO   = '';                            // 例）'sales@example.com' 空なら通知なし

var HEADERS = [
  'id','createdAt','updatedAt','storeCode','storeName','name','tel','email','area',
  'contactTime','inquiry','diagRank','diagTitle','diagScore','diagAnswers',
  'source','referrer','status','owner','nextDate','memo'
];

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.clear();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#0f2b4a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { setup(); sh = ss.getSheetByName(SHEET_NAME); }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- 一覧取得（管理画面） ---------------- */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.token !== TOKEN) return json_({ ok: false, error: '認証エラー' });
    if (p.action !== 'list') return json_({ ok: false, error: '不明なアクション' });

    var sh = sheet_();
    var last = sh.getLastRow();
    if (last < 2) return json_({ ok: true, rows: [] });

    var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
    var rows = values.map(function (v) {
      var o = {};
      HEADERS.forEach(function (h, i) {
        var val = v[i];
        if (val instanceof Date) val = Utilities.formatDate(val, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss");
        o[h] = val;
      });
      return o;
    }).filter(function (o) { return o.id; }).reverse();

    return json_({ ok: true, rows: rows });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ---------------- 新規登録 / 更新 ---------------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.action === 'submit') return json_(insert_(body.data || {}));

    if (body.action === 'update') {
      if (body.token !== TOKEN) return json_({ ok: false, error: '認証エラー' });
      return json_(update_(body.id, body.patch || {}));
    }
    return json_({ ok: false, error: '不明なアクション' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function insert_(d) {
  var sh = sheet_();
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss");
  var id = 'L' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyMMdd') + '-' +
           Utilities.getUuid().slice(0, 4).toUpperCase();

  var row = HEADERS.map(function (h) {
    if (h === 'id') return id;
    if (h === 'createdAt' || h === 'updatedAt') return now;
    if (h === 'status') return '新規';
    if (h === 'owner' || h === 'nextDate' || h === 'memo') return '';
    return d[h] != null ? String(d[h]) : '';
  });
  sh.appendRow(row);

  if (NOTIFY_TO) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_TO,
        subject: '【新規問合せ】' + (d.storeName || '') + ' / ' + (d.name || '') + ' 様（' + id + '）',
        body: [
          '店内ポスターQRから新しいお問い合わせが入りました。', '',
          '受付番号：' + id,
          '受付日時：' + now,
          '流入店舗：' + (d.storeName || ''),
          'お名前　：' + (d.name || ''),
          'お電話　：' + (d.tel || ''),
          'メール　：' + (d.email || ''),
          '地域　　：' + (d.area || ''),
          '希望時間：' + (d.contactTime || '指定なし'),
          '診断結果：' + (d.diagRank || '') + ' ' + (d.diagTitle || ''),
          'ご相談　：' + (d.inquiry || ''), '',
          '回答内容：' + (d.diagAnswers || '')
        ].join('\n')
      });
    } catch (err) { /* 通知失敗は登録を妨げない */ }
  }
  return { ok: true, id: id };
}

function update_(id, patch) {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return { ok: false, error: '対象が見つかりません' };

  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  var rowIdx = -1;
  for (var i = 0; i < ids.length; i++) { if (String(ids[i][0]) === String(id)) { rowIdx = i + 2; break; } }
  if (rowIdx === -1) return { ok: false, error: '対象が見つかりません' };

  var allowed = ['status', 'owner', 'nextDate', 'memo'];
  allowed.forEach(function (key) {
    if (patch[key] === undefined) return;
    var col = HEADERS.indexOf(key) + 1;
    sh.getRange(rowIdx, col).setValue(String(patch[key]));
  });
  sh.getRange(rowIdx, HEADERS.indexOf('updatedAt') + 1)
    .setValue(Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss"));

  return { ok: true };
}

/* ---------------- 任意：フォロー漏れの日次リマインド ----------------
   トリガー（時間主導型・日次）に dailyReminder を設定すると、
   次回連絡予定日が到来した未対応案件をメールで通知します。          */
function dailyReminder() {
  if (!NOTIFY_TO) return;
  var res = JSON.parse(doGet({ parameter: { token: TOKEN, action: 'list' } }).getContent());
  if (!res.ok) return;
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var due = res.rows.filter(function (r) {
    return r.nextDate && String(r.nextDate).slice(0, 10) <= today &&
           ['成約', '見送り'].indexOf(r.status) === -1;
  });
  var fresh = res.rows.filter(function (r) { return r.status === '新規'; });
  if (!due.length && !fresh.length) return;

  var line = function (r) {
    return '・' + r.id + '　' + r.name + ' 様（' + r.tel + '／' + r.storeName + '）' +
           (r.nextDate ? '　予定日 ' + String(r.nextDate).slice(0, 10) : '');
  };
  MailApp.sendEmail({
    to: NOTIFY_TO,
    subject: '【本日の対応リスト】未対応 ' + fresh.length + '件／フォロー期日 ' + due.length + '件',
    body: '■ 未対応（新規）\n' + (fresh.map(line).join('\n') || '（なし）') +
          '\n\n■ フォロー期日が到来\n' + (due.map(line).join('\n') || '（なし）')
  });
}
