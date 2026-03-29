  // ==========================================
  // Week 1: スプレッドシート読み書き + メール送信
  // ==========================================

  const SHEET_NAME = 'フォーム回答';

  // スプレッドシートに1行書き込む
  function writeRow(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // シートがなければ作成
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // ヘッダー行
      sheet.appendRow(['タイムスタンプ', '回答内容', 'ステータス']);
    }

    sheet.appendRow(data);
  }

  // シートの全データを読み込む（1行目はヘッダーなのでスキップ）
  function readAllRows() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) return [];

    const values = sheet.getDataRange().getValues();
    return values.slice(1); // ヘッダーを除く
  }

  // 動作確認用：手動で実行してテスト
  function testWrite() {
    const now = new Date().toLocaleString('ja-JP');
    writeRow([now, 'テスト回答です', '未処理']);
    Logger.log('書き込み完了');
  }

  function testRead() {
    const rows = readAllRows();
    rows.forEach((row, i) => Logger.log(`行${i + 1}: ${row}`));
  }

  // メール送信
  function sendSummaryEmail(subject, body) {
    const recipient = Session.getActiveUser().getEmail(); // 自分のアドレスに送る
    MailApp.sendEmail(recipient, subject, body);
  }

  // 動作確認用：手動で実行してテスト
  function testEmail() {
    const rows = readAllRows();
    const body = rows.map((r, i) => `${i + 1}. ${r[1]}`).join('\n');
    sendSummaryEmail('【GASテスト】回答一覧', body || 'データなし');
    Logger.log('メール送信完了');
  }

 // ==========================================
  // Week 3-4: フォーム連携 統合ロジック
  // ==========================================

  const RESULT_SHEET_NAME = '分析結果';

  // フォーム送信時に自動実行される関数
  function onFormSubmit(e) {
     if (!isEnabled()) return;
    const items = e.response.getItemResponses();

    // フォームの全回答をテキストにまとめる
    const formText = items.map(item => {
      return `【${item.getItem().getTitle()}】\n${item.getResponse()}`;
    }).join('\n\n');

    // Claudeに分析させる
    const prompt = buildPrompt(formText);
    const rawResult = callClaude(prompt);

    // JSONをパース
    let analysis;
    try {
      analysis = JSON.parse(rawResult);
    } catch (err) {
      analysis = { category: '解析失敗', summary: rawResult, priority: '不明' };
    }

    // 結果をシートに書き込む
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    writeResultRow([
      timestamp,
      formText,
      analysis.category,
      analysis.summary,
      analysis.priority
    ]);
  }

  // 分析結果を書き込む
  function writeResultRow(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(RESULT_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(RESULT_SHEET_NAME);
      sheet.appendRow(['タイムスタンプ', '回答原文', 'カテゴリ', '要約', '優先度']);

      // ヘッダー行を見やすくする
      sheet.getRange(1, 1, 1, 5).setBackground('#4a86e8').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow(data);
  }

  // 動作確認用：フォームなしでテスト実行
  function testIntegration() {
    const dummyText = '【お問い合わせ内容】\nログインできなくなりました。パスワードを変更しようとしてもエラーが出ます。';
    const prompt = buildPrompt(dummyText);
    const rawResult = callClaude(prompt);

    Logger.log('Claude生レスポンス:\n' + rawResult);

    let analysis;
    try {
      analysis = JSON.parse(rawResult);
      Logger.log('カテゴリ: ' + analysis.category);
      Logger.log('要約: ' + analysis.summary);
      Logger.log('優先度: ' + analysis.priority);
    } catch (e) {
      Logger.log('JSONパース失敗: ' + e.message);
    }
  }

 //disableappを実行するとon/off切り替え
  function enableApp()  { PropertiesService.getScriptProperties().setProperty('ENABLED', 'true');  Logger.log('有効にしました'); }
  function disableApp() { PropertiesService.getScriptProperties().setProperty('ENABLED', 'false'); Logger.log('無効にしました'); }
  function isEnabled()  { return PropertiesService.getScriptProperties().getProperty('ENABLED') === 'true'; }
