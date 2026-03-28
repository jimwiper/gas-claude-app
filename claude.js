 // ==========================================
  // Week 2: Claude API接続
  // ==========================================

  const CLAUDE_MODEL = 'claude-opus-4-6';
  const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

  // APIキーをPropertiesServiceに保存（初回1回だけ実行）
  function saveApiKey() {
    const key = 'YOUR_API_KEY_HERE'; // ← ここだけ書き換えて実行後、元に戻す
    PropertiesService.getScriptProperties().setProperty('ANTHROPIC_API_KEY', key);
    Logger.log('APIキーを保存しました');
  }

  // APIキーを取得
  function getApiKey() {
    const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
    if (!key) throw new Error('APIキーが設定されていません。saveApiKey()を実行してください');
    return key;
  }

  // Claude APIを呼び出す
  function callClaude(prompt) {
    const payload = {
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // エラーレスポンスもログで見られるように
    };

    const response = UrlFetchApp.fetch(CLAUDE_API_URL, options);
    const json = JSON.parse(response.getContentText());

    // エラーチェック
    if (json.error) throw new Error(`Claude APIエラー: ${json.error.message}`);

    return json.content[0].text;
  }

  // 動作確認用
  function testClaude() {
    const result = callClaude('「テスト成功」と一言だけ日本語で返してください');
    Logger.log('Claudeの返答: ' + result);
  }

// プロンプトを組み立てる
  function buildPrompt(formText) {
    return `以下のフォーム回答を分析し、必ずJSON形式のみで返してください。説明文は不要です。

  【回答内容】
  ${formText}

  【出力形式】
  {
    "category": "カテゴリ（例：技術的問題/料金・請求/機能要望/その他）",
    "summary": "50文字以内の要約",
    "priority": "高・中・低のいずれか"
  }`;
  }
