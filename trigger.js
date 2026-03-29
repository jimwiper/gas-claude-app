// ==========================================
  // Week 1: 時間トリガーの設定
  // ==========================================

  // 毎日9時に実行するトリガーを登録（1回だけ実行すればOK）
  function setDailyTrigger() {
    // 既存のトリガーを削除してから再登録（重複防止）
    deleteTrigger('dailyReport');

    ScriptApp.newTrigger('dailyReport')
      .timeBased()
      .everyDays(1)
      .atHour(9)
      .create();

    Logger.log('毎日9時のトリガーを登録しました');
  }

  // トリガーから呼ばれる関数
  function dailyReport() {
    if (!isEnabled()) return;
    const rows = readAllRows();
    const unprocessed = rows.filter(r => r[2] === '未処理');

    const subject = `【日次レポート】未処理回答 ${unprocessed.length}件`;
    const body = unprocessed.length > 0
      ? unprocessed.map((r, i) => `${i + 1}. ${r[1]}`).join('\n')
      : '未処理の回答はありません';

    sendSummaryEmail(subject, body);
  }

  // 特定の関数名のトリガーを削除
  function deleteTrigger(functionName) {
    ScriptApp.getProjectTriggers()
      .filter(t => t.getHandlerFunction() === functionName)
      .forEach(t => ScriptApp.deleteTrigger(t));
  }

  // 登録済みトリガーの確認
  function listTriggers() {
    ScriptApp.getProjectTriggers().forEach(t => {
      Logger.log(`関数: ${t.getHandlerFunction()}, タイプ: ${t.getEventType()}`);
    });
  }

 // フォーム送信トリガーを登録（1回だけ実行）
  function setFormTrigger() {
    deleteTrigger('onFormSubmit');

    // このスプレッドシートに紐づくフォームのトリガー
    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onFormSubmit()
      .create();

    Logger.log('フォーム送信トリガーを登録しました');
  }
