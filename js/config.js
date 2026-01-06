/**
 * config.js - 設定ファイル
 * APIエンドポイントと定数の定義
 */

const CONFIG = {
  // Google Apps Script WebアプリのURL（デプロイ後に設定）
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbxuR0q6FseR6zyvPygFVU2NX4Rm9BX-T9QOjLFZV1f7UPzDhIFjhaIJTuYsmEqLu8R-/exec',
  
  // ローカルストレージのキー
  STORAGE_KEYS: {
    AUTH_TOKEN: 'cpg_auth_token',
    USER_INFO: 'cpg_user_info',
    REMEMBER_ME: 'cpg_remember_me',
    CURRENT_PERSONA: 'cpg_current_persona',
    SAVED_PERSONAS: 'cpg_saved_personas'
  },
  
  // チャットフロー定義
  CHAT_FLOW: [
    {
      id: 'welcome',
      type: 'message',
      content: 'こんにちは！コンテンツページを作成するお手伝いをします😊\nまず、いくつか質問させてください。',
      next: 'genre'
    },
    {
      id: 'genre',
      type: 'question',
      content: 'あなたのお店について教えてください。\nどんな商品を扱っていますか？',
      hint: '例：花・観葉植物、木のおもちゃ、食品、アパレルなど',
      inputType: 'text',
      field: 'genre',
      next: 'target'
    },
    {
      id: 'target',
      type: 'question',
      content: 'お客様はどんな方が多いですか？',
      hint: '例：30代女性、子育て中のママ、ビジネスマンなど',
      inputType: 'text',
      field: 'targetCustomer',
      next: 'tone'
    },
    {
      id: 'tone',
      type: 'question',
      content: '文章のトーンはどれがお好みですか？',
      inputType: 'buttons',
      field: 'tone',
      options: [
        { value: 'casual', label: 'カジュアル', desc: '親しみやすい' },
        { value: 'polite', label: '丁寧', desc: 'きちんとした' },
        { value: 'professional', label: '専門的', desc: 'プロ向け' }
      ],
      next: 'emoji'
    },
    {
      id: 'emoji',
      type: 'question',
      content: '絵文字は使いますか？',
      inputType: 'buttons',
      field: 'emojiUsage',
      options: [
        { value: 'yes', label: '使う✨' },
        { value: 'moderate', label: '少なめ' },
        { value: 'no', label: '使わない' }
      ],
      next: 'persona_complete'
    },
    {
      id: 'persona_complete',
      type: 'message',
      content: '設定が完了しました！✨\nこの設定を保存しますか？',
      inputType: 'buttons',
      options: [
        { value: 'save', label: '保存する', action: 'savePersona' },
        { value: 'skip', label: '保存せず進む' }
      ],
      next: 'product_url'
    },
    {
      id: 'product_url',
      type: 'question',
      content: '次に、紹介したい商品のURLを教えてください📦',
      hint: '楽天市場の商品ページURLを入力してください',
      inputType: 'url',
      field: 'productUrl',
      next: 'analyzing'
    },
    {
      id: 'analyzing',
      type: 'loading',
      content: '商品ページを解析中...',
      action: 'analyzeProduct',
      next: 'product_confirm'
    },
    {
      id: 'product_confirm',
      type: 'product_display',
      content: '商品情報を取得しました！',
      next: 'price_include'
    },
    {
      id: 'price_include',
      type: 'question',
      content: '価格を記事に含めますか？',
      inputType: 'buttons',
      field: 'includePrice',
      options: [
        { value: true, label: '含める' },
        { value: false, label: '含めない' }
      ],
      next: 'image_source'
    },
    {
      id: 'image_source',
      type: 'question',
      content: '記事に使用する画像を選んでください🖼️',
      inputType: 'image_select',
      field: 'images',
      next: 'generating'
    },
    {
      id: 'generating',
      type: 'loading',
      content: 'コンテンツを生成中...',
      action: 'generateContent',
      next: 'preview'
    },
    {
      id: 'preview',
      type: 'preview',
      content: 'コンテンツが完成しました！🎉',
      next: 'publish'
    }
  ],
  
  // 画像生成AIモデル
  IMAGE_MODELS: [
    { id: 'gemini', name: 'Gemini', icon: '🌟', desc: 'Google AI' },
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', desc: 'OpenAI DALL-E' },
    { id: 'midjourney', name: 'Midjourney', icon: '🎨', desc: '高品質アート' }
  ],
  
  // トーン設定の詳細
  TONE_SETTINGS: {
    casual: {
      name: 'カジュアル',
      description: '親しみやすく、フレンドリーな口調',
      example: '〜なんです！〜ちゃうんです😊'
    },
    polite: {
      name: '丁寧',
      description: '敬語を使用した丁寧な表現',
      example: '〜でございます。〜いたします。'
    },
    professional: {
      name: '専門的',
      description: '専門用語を交えたプロフェッショナルな表現',
      example: '〜を推奨します。〜が有効です。'
    }
  },
  
  // 絵文字設定
  EMOJI_SETTINGS: {
    yes: {
      name: '使う',
      frequency: 'high',
      examples: ['😊', '✨', '🎁', '💕', '🌸', '👍']
    },
    moderate: {
      name: '少なめ',
      frequency: 'low',
      examples: ['✨', '🎁']
    },
    no: {
      name: '使わない',
      frequency: 'none',
      examples: []
    }
  }
};

// 設定を変更不可にする
Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.CHAT_FLOW);
Object.freeze(CONFIG.IMAGE_MODELS);
Object.freeze(CONFIG.TONE_SETTINGS);
Object.freeze(CONFIG.EMOJI_SETTINGS);
