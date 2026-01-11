/**
 * app.js - メインアプリケーション
 * 初期化とUI制御を管理
 */

const App = {
  // DOM要素
  elements: {
    loginScreen: null,
    mainScreen: null,
    loadingOverlay: null,
    previewModal: null,
    settingsModal: null
  },
  
  /**
   * アプリケーション初期化
   */
  init() {
    // DOM要素の取得
    this.elements.loginScreen = document.getElementById('login-screen');
    this.elements.mainScreen = document.getElementById('main-screen');
    this.elements.loadingOverlay = document.getElementById('loading-overlay');
    this.elements.previewModal = document.getElementById('preview-modal');
    this.elements.settingsModal = document.getElementById('settings-modal');
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // ログイン状態の確認
    this.checkAuthState();
  },
  
  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // 認証タブ切り替え
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.auth));
    });
    
    // ログインボタン
    document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
    
    // Enterキーでログイン
    document.querySelectorAll('#auth-password input, #auth-apikey input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    });
    
    // ログアウトボタン
    document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
    
    // 設定ボタン
    document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsModal());
    
    // モーダルを閉じる
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.closeModal(modal);
      });
    });
    
　　// モーダル外クリックで閉じる（プレビューモーダル以外）
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        // プレビューモーダルは外クリックで閉じない（誤クリック防止）
        if (modal.id === 'preview-modal') return;
        if (e.target === modal) this.closeModal(modal);
      });
    });
    
    // プレビューモーダルのボタン
    document.getElementById('regenerate-btn')?.addEventListener('click', () => this.handleRegenerate());
    document.getElementById('edit-btn')?.addEventListener('click', () => this.handleEdit());
    document.getElementById('publish-btn')?.addEventListener('click', () => this.handlePublish());
  },
  
  /**
   * 認証状態を確認
   */
  checkAuthState() {
    if (API.auth.isLoggedIn()) {
      this.showMainScreen();
    } else {
      this.showLoginScreen();
    }
  },
  
  /**
   * 認証タブの切り替え
   */
  switchAuthTab(authType) {
    // タブの切り替え
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.auth === authType);
    });
    
    // パネルの切り替え
    document.querySelectorAll('.auth-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `auth-${authType}`);
    });
  },
  
  /**
   * ログイン処理
   */
  async handleLogin() {
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    
    // 現在のタブを確認
    const activeTab = document.querySelector('.auth-tab.active');
    const authType = activeTab.dataset.auth;
    
    // ボタンを無効化
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';
    errorDiv.classList.remove('show');
    
    try {
      let result;
      
      if (authType === 'password') {
        const userId = document.getElementById('user-id').value.trim();
        const password = document.getElementById('user-pw').value;
        
        if (!userId || !password) {
          throw new Error('ユーザーIDとパスワードを入力してください');
        }
        
        result = await API.auth.loginWithPassword(userId, password);
      } else {
        const apiKey = document.getElementById('api-key').value.trim();
        
        if (!apiKey) {
          throw new Error('APIキーを入力してください');
        }
        
        result = await API.auth.loginWithApiKey(apiKey);
      }
      
      if (result.status === 'success') {
        // ログイン状態を保持
        const rememberMe = document.getElementById('remember-me').checked;
        if (rememberMe) {
          Storage.set(CONFIG.STORAGE_KEYS.REMEMBER_ME, true);
        }
        
        this.showMainScreen();
      } else {
        throw new Error(result.message || 'ログインに失敗しました');
      }
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.classList.add('show');
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>ログイン</span><i class="fas fa-arrow-right"></i>';
    }
  },
  
  /**
   * ログアウト処理
   */
  handleLogout() {
    if (confirm('ログアウトしますか？')) {
      API.auth.logout();
      this.showLoginScreen();
    }
  },
  
  /**
   * ログイン画面を表示
   */
  showLoginScreen() {
    this.elements.mainScreen.classList.remove('active');
    this.elements.loginScreen.classList.add('active');
    
    // フォームをクリア
    document.getElementById('user-id').value = '';
    document.getElementById('user-pw').value = '';
    document.getElementById('api-key').value = '';
    document.getElementById('login-error').classList.remove('show');
  },
  
  /**
   * メイン画面を表示
   */
  showMainScreen() {
    this.elements.loginScreen.classList.remove('active');
    this.elements.mainScreen.classList.add('active');
    
    // ユーザー情報を表示
    this.updateUserInfo();
    
    // チャットを開始
    Chat.start();
  },
  
  /**
   * ユーザー情報を更新
   */
  async updateUserInfo() {
    const userInfo = API.auth.getUserInfo();
    
    if (userInfo) {
      document.getElementById('remaining-credits').textContent = userInfo.remainingCredits || '--';
    }
    
    // 最新の残り回数を取得
    try {
      const result = await API.status.getCredits();
      if (result.credits !== undefined) {
        document.getElementById('remaining-credits').textContent = result.credits;
      }
    } catch (error) {
      console.error('Failed to get credits:', error);
    }
  },
  
/**
 * ローディング表示
 */
showLoading(message = '処理中...', progress = null) {
  const overlay = this.elements.loadingOverlay;
  const messageEl = document.getElementById('loading-message');
  const progressBar = document.getElementById('loading-progress-bar');
  
  if (messageEl) {
    messageEl.textContent = message;
  }
  
  if (progressBar && progress !== null) {
    progressBar.style.width = `${progress}%`;
  }
  
  if (overlay) {
    overlay.classList.add('active');
  }
},

/**
 * 現在の操作をキャンセル
 */
cancelCurrentOperation() {
  this.isCancelled = true;
  this.hideLoading();
  
  // 確認ダイアログ
  if (confirm('処理をキャンセルしました。\n前のステップに戻りますか？')) {
    Chat.goToPreviousStep();
  }
},

/**
 * キャンセルフラグをリセット
 */
resetCancelFlag() {
  this.isCancelled = false;
},
  
  /**
   * ローディング非表示
   */
  hideLoading() {
    this.elements.loadingOverlay.classList.remove('active');
    document.getElementById('loading-progress-bar').style.width = '0%';
  },
  
  /**
   * プレビューモーダルを表示
   */
  showPreviewModal(data) {
    const previewContent = document.getElementById('preview-content');
    
    if (data.generatedContent) {
      const content = data.generatedContent;
      
      let html = `
        <div class="preview-section">
          <div class="preview-section-title">📝 ページタイトル</div>
          <div class="preview-section-content">${content.pageTitle || ''}</div>
        </div>
        <div class="preview-section">
          <div class="preview-section-title">🔗 ページURL</div>
          <div class="preview-section-content">${content.pageUrl || ''}</div>
        </div>
        <div class="preview-section">
          <div class="preview-section-title">📋 SEO説明文</div>
          <div class="preview-section-content">${content.seoDescription || ''}</div>
        </div>
      `;
      
      if (content.sections) {
        content.sections.forEach((section, index) => {
          html += `
            <div class="preview-section">
              <div class="preview-section-title">セクション${index + 1}: ${section.role || ''}</div>
              <h4 style="margin-bottom: 8px;">${section.title || ''}</h4>
              <div class="preview-section-content">${section.text?.replace(/\n/g, '<br>') || ''}</div>
            </div>
          `;
        });
      }
      
      previewContent.innerHTML = html;
    } else {
      previewContent.innerHTML = '<p>プレビューデータがありません</p>';
    }
    
    this.openModal(this.elements.previewModal);
  },
  
  /**
   * 設定モーダルを表示
   */
  async showSettingsModal() {
    // 保存済みペルソナを取得
    try {
      const result = await API.persona.list();
      const listContainer = document.getElementById('saved-personas-list');
      
      if (result.personas && result.personas.length > 0) {
        listContainer.innerHTML = result.personas.map(p => `
          <div class="persona-item" data-id="${p.id}">
            <span class="persona-item-name">${p.saveName}</span>
            <div class="persona-item-actions">
              <button class="icon-btn use-persona-btn" title="使用">
                <i class="fas fa-check"></i>
              </button>
              <button class="icon-btn delete-persona-btn" title="削除">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('');
        
        // イベントリスナー
        listContainer.querySelectorAll('.use-persona-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const item = e.target.closest('.persona-item');
            const personaId = item.dataset.id;
            this.usePersona(personaId);
          });
        });
        
        listContainer.querySelectorAll('.delete-persona-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const item = e.target.closest('.persona-item');
            const personaId = item.dataset.id;
            this.deletePersona(personaId, item);
          });
        });
      } else {
        listContainer.innerHTML = '<p style="color: var(--text-light);">保存済みの設定はありません</p>';
      }
    } catch (error) {
      console.error('Failed to load personas:', error);
    }
    
    this.openModal(this.elements.settingsModal);
  },
  
  /**
   * ペルソナを使用
   */
  async usePersona(personaId) {
    // TODO: 実装
    this.closeModal(this.elements.settingsModal);
    alert('この機能は開発中です');
  },
  
  /**
   * ペルソナを削除
   */
  async deletePersona(personaId, element) {
    if (confirm('この設定を削除しますか？')) {
      try {
        await API.persona.delete(personaId);
        element.remove();
      } catch (error) {
        alert('削除に失敗しました');
      }
    }
  },
  
  /**
   * モーダルを開く
   */
  openModal(modal) {
    modal.classList.add('active');
  },
  
  /**
   * モーダルを閉じる
   */
  closeModal(modal) {
    modal.classList.remove('active');
  },
  
  /**
   * 再生成処理
   */
  async handleRegenerate() {
    this.closeModal(this.elements.previewModal);
    Chat.goToStep('generating');
  },
  
  /**
   * 編集処理
   */
  handleEdit() {
    // TODO: 編集機能の実装
    alert('編集機能は開発中です');
  },
  
  /**
   * 公開処理
   */
  async handlePublish() {
    // デバッグ: データ確認
    console.log('=== handlePublish ===');
    console.log('Chat.collectedData:', Chat.collectedData);
    console.log('generatedContent:', Chat.collectedData.generatedContent);
    console.log('images:', Chat.collectedData.images);
  
    // generatedContentの確認
    if (!Chat.collectedData.generatedContent) {
      alert('コンテンツが生成されていません。先にコンテンツを生成してください。');
      return;
    }
  
  if (!confirm('楽天にコンテンツページを公開しますか？')) {
    return;
  }
  
  this.showLoading('楽天に公開中...', 50);
  
  try {
    const result = await API.content.publish(Chat.collectedData);
    
    console.log('Publish result:', result);
    
    if (result.status === 'success') {
      this.hideLoading();
      this.closeModal(this.elements.previewModal);
      
      // 完了メッセージ
      await Chat.showBotMessage(`🎉 コンテンツページを公開しました！\n\n📎 URL: ${result.pageUrl || ''}`);
      
      // 残り回数を更新
      this.updateUserInfo();
    } else {
      throw new Error(result.message || '公開に失敗しました');
    }
  } catch (error) {
    this.hideLoading();
    console.error('Publish error:', error);
    alert('公開に失敗しました: ' + error.message);
  }
}
};

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
