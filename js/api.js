/**
 * api.js - API通信モジュール
 * Google Apps Script WebアプリとのHTTP通信を管理
 */

const API = {
  /**
   * 基本のfetchラッパー
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = CONFIG.API_BASE_URL;
    
    const options = {
      method: 'POST', // GASは基本的にPOSTで受ける
      headers: {
        'Content-Type': 'text/plain', // GASのCORS対策
      },
      body: JSON.stringify({
        endpoint: endpoint,
        method: method,
        data: data,
        token: Storage.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN)
      })
    };
    
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message || 'APIエラーが発生しました');
      }
      
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  /**
   * 認証API
   */
  auth: {
    /**
     * ID/パスワードでログイン
     */
    async loginWithPassword(userId, password) {
      const result = await API.request('/auth', 'POST', {
        authType: 'password',
        userId: userId,
        password: password
      });
      
      if (result.status === 'success') {
        Storage.set(CONFIG.STORAGE_KEYS.AUTH_TOKEN, result.token);
        Storage.set(CONFIG.STORAGE_KEYS.USER_INFO, result.user);
      }
      
      return result;
    },
    
    /**
     * APIキーでログイン
     */
    async loginWithApiKey(apiKey) {
      const result = await API.request('/auth', 'POST', {
        authType: 'apikey',
        apiKey: apiKey
      });
      
      if (result.status === 'success') {
        Storage.set(CONFIG.STORAGE_KEYS.AUTH_TOKEN, result.token);
        Storage.set(CONFIG.STORAGE_KEYS.USER_INFO, result.user);
      }
      
      return result;
    },
    
    /**
     * ログアウト
     */
    logout() {
      Storage.remove(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      Storage.remove(CONFIG.STORAGE_KEYS.USER_INFO);
    },
    
    /**
     * ログイン状態確認
     */
    isLoggedIn() {
      return !!Storage.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    },
    
    /**
     * ユーザー情報取得
     */
    getUserInfo() {
      return Storage.get(CONFIG.STORAGE_KEYS.USER_INFO);
    }
  },
  
  /**
   * ペルソナAPI
   */
  persona: {
    /**
     * ペルソナを保存
     */
    async save(persona, saveName) {
      return await API.request('/persona', 'POST', {
        action: 'save',
        persona: persona,
        saveName: saveName
      });
    },
    
    /**
     * 保存済みペルソナ一覧を取得
     */
    async list() {
      return await API.request('/persona', 'GET', {
        action: 'list'
      });
    },
    
    /**
     * ペルソナを削除
     */
    async delete(personaId) {
      return await API.request('/persona', 'DELETE', {
        action: 'delete',
        personaId: personaId
      });
    }
  },
  
  /**
   * 商品解析API
   */
  product: {
    /**
     * 商品URLを解析
     */
    async analyze(productUrl) {
      return await API.request('/analyze', 'POST', {
        productUrl: productUrl
      });
    }
  },
  
  /**
   * 画像API
   */
  image: {
    /**
     * AI画像生成
     */
    async generate(provider, prompt, options = {}) {
      return await API.request('/image/generate', 'POST', {
        provider: provider,
        prompt: prompt,
        count: options.count || 4,
        aspectRatio: options.aspectRatio || '3:2'
      });
    },
    
    /**
     * 画像アップロード
     */
    async upload(base64Data, filename) {
      return await API.request('/image/upload', 'POST', {
        imageData: base64Data,
        filename: filename
      });
    },
    
    /**
     * 商品画像をリサイズしてアップロード
     */
    async resizeAndUpload(imageUrl, options = {}) {
      return await API.request('/image/resize', 'POST', {
        imageUrl: imageUrl,
        width: options.width || 1200,
        height: options.height || 800
      });
    }
  },
  
  /**
   * コンテンツ生成API
   */
  content: {
    /**
     * コンテンツ生成
     */
    async generate(persona, product, options) {
      return await API.request('/content/generate', 'POST', {
        persona: persona,
        product: product,
        options: options
      });
    },
    
/**
 * 楽天に公開
 */
async publish(collectedData) {
  // デバッグ: 送信データ確認
  console.log('=== API.content.publish ===');
  console.log('collectedData:', collectedData);
  
  const publishData = {
    generatedContent: collectedData.generatedContent,
    product: collectedData.product,
    images: collectedData.images || []
  };
  
  console.log('publishData:', publishData);
  
  return await API.request('/publish', 'POST', publishData);
}
  },
  
  /**
   * ステータスAPI
   */
  status: {
    /**
     * 残り回数を取得
     */
    async getCredits() {
      return await API.request('/status', 'GET', {
        action: 'credits'
      });
    }
  }
};

/**
 * ローカルストレージ管理
 */
const Storage = {
  /**
   * データを保存
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  /**
   * データを取得
   */
  get(key) {
    try {
      const serialized = localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  /**
   * データを削除
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
  
  /**
   * 全データをクリア
   */
  clear() {
    try {
      // CONFIG.STORAGE_KEYSに定義されたキーのみ削除
      Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};
