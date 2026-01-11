/**
 * chat.js - チャットUIモジュール
 * メッセージ表示と入力処理を管理
 */

const Chat = {
  // 現在のステップ
  currentStep: null,
  
  // 収集したデータ
  collectedData: {
    persona: {},
    product: null,
    images: [],
    options: {}
  },
  
  // DOM要素
  elements: {
    messagesContainer: null,
    inputArea: null,
    progressSteps: null
  },
  
  /**
   * 初期化
   */
  init() {
    this.elements.messagesContainer = document.getElementById('chat-messages');
    this.elements.inputArea = document.getElementById('chat-input-area');
    this.elements.progressSteps = document.querySelectorAll('.progress-step');
    
    // データリセット
    this.collectedData = {
      persona: {},
      product: null,
      images: [],
      options: {}
    };
    
    // 保存済みペルソナがあればロード
    const savedPersona = Storage.get(CONFIG.STORAGE_KEYS.CURRENT_PERSONA);
    if (savedPersona) {
      this.collectedData.persona = savedPersona;
    }
  },
  
  /**
   * チャットを開始
   */
  start() {
    this.init();
    this.clearMessages();
    this.goToStep('welcome');
  },
  
  /**
   * 特定のステップに移動
   */
  async goToStep(stepId) {
    const step = CONFIG.CHAT_FLOW.find(s => s.id === stepId);
    if (!step) {
      console.error('Step not found:', stepId);
      return;
    }
    
    this.currentStep = step;
    this.updateProgress(stepId);
    
    // ステップタイプに応じた処理
    switch (step.type) {
      case 'message':
        await this.showBotMessage(step.content);
        if (step.inputType === 'buttons') {
          this.showButtonInput(step.options, step.next);
        } else if (step.next) {
          // 少し待ってから次へ
          await this.delay(1000);
          this.goToStep(step.next);
        }
        break;
        
      case 'question':
        await this.showBotMessage(step.content, step.hint);
        this.showInput(step);
        break;
        
      case 'loading':
        await this.showBotMessage(step.content);
        await this.executeAction(step.action);
        if (step.next) {
          this.goToStep(step.next);
        }
        break;
        
      case 'product_display':
        await this.showProductCard();
        if (step.next) {
          await this.delay(500);
          this.goToStep(step.next);
        }
        break;
        
      case 'preview':
        await this.showBotMessage(step.content);
        this.showPreview();
        break;
    }
  },
  
  /**
   * プログレスバーを更新
   */
  updateProgress(stepId) {
    const stepMapping = {
      'welcome': 1, 'genre': 1, 'target': 1, 'tone': 1, 'emoji': 1, 'persona_complete': 1,
      'product_url': 2, 'analyzing': 2, 'product_confirm': 2, 'price_include': 2,
      'image_source': 3,
      'generating': 4, 'preview': 4
    };
    
    const currentStepNum = stepMapping[stepId] || 1;
    
    this.elements.progressSteps.forEach((el, index) => {
      const stepNum = index + 1;
      el.classList.remove('active', 'completed');
      
      if (stepNum < currentStepNum) {
        el.classList.add('completed');
      } else if (stepNum === currentStepNum) {
        el.classList.add('active');
      }
    });
  },
  
  /**
   * ボットメッセージを表示
   */
  async showBotMessage(content, hint = null) {
    const template = document.getElementById('bot-message-template');
    const clone = template.content.cloneNode(true);
    const messageText = clone.querySelector('.message-text');
    
    // 改行をHTMLに変換
    const htmlContent = content.replace(/\n/g, '<br>');
    messageText.innerHTML = `<p>${htmlContent}</p>`;
    
    if (hint) {
      const hintEl = document.createElement('p');
      hintEl.className = 'message-hint';
      hintEl.textContent = hint;
      messageText.appendChild(hintEl);
    }
    
    this.elements.messagesContainer.appendChild(clone);
    this.scrollToBottom();
    
    // タイピングアニメーション風の遅延
    await this.delay(300);
  },
  
  /**
   * ユーザーメッセージを表示
   */
  showUserMessage(content) {
    const template = document.getElementById('user-message-template');
    const clone = template.content.cloneNode(true);
    const messageText = clone.querySelector('.message-text');
    messageText.innerHTML = `<p>${content}</p>`;
    
    this.elements.messagesContainer.appendChild(clone);
    this.scrollToBottom();
  },
  
  /**
   * 入力エリアを表示
   */
  showInput(step) {
    this.elements.inputArea.innerHTML = '';
    
    switch (step.inputType) {
      case 'text':
        this.showTextInput(step);
        break;
      case 'url':
        this.showUrlInput(step);
        break;
      case 'buttons':
        this.showButtonInput(step.options, step.next, step.field);
        break;
      case 'image_select':
        this.showImageSelect(step);
        break;
      case 'image_confirm':
        this.showImageConfirm(step);
        break;
    }
  },
  
  /**
   * テキスト入力を表示
   */
  showTextInput(step) {
    const template = document.getElementById('text-input-template');
    const clone = template.content.cloneNode(true);
    const input = clone.querySelector('.chat-text-input');
    const sendBtn = clone.querySelector('.send-btn');
    
    input.placeholder = step.hint || '入力してください...';
    
    const handleSubmit = () => {
      const value = input.value.trim();
      if (value) {
        this.showUserMessage(value);
        this.collectedData.persona[step.field] = value;
        this.elements.inputArea.innerHTML = '';
        
        if (step.next) {
          this.goToStep(step.next);
        }
      }
    };
    
    sendBtn.addEventListener('click', handleSubmit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });
    
    this.elements.inputArea.appendChild(clone);
    input.focus();
  },
  
  /**
   * URL入力を表示
   */
  showUrlInput(step) {
    const template = document.getElementById('url-input-template');
    const clone = template.content.cloneNode(true);
    const input = clone.querySelector('.chat-url-input');
    const sendBtn = clone.querySelector('.send-btn');
    
    const handleSubmit = () => {
      const value = input.value.trim();
      if (value && this.isValidUrl(value)) {
        this.showUserMessage(value);
        this.collectedData[step.field] = value;
        this.elements.inputArea.innerHTML = '';
        
        if (step.next) {
          this.goToStep(step.next);
        }
      } else {
        this.showError('有効なURLを入力してください');
      }
    };
    
    sendBtn.addEventListener('click', handleSubmit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });
    
    this.elements.inputArea.appendChild(clone);
    input.focus();
  },
  
  /**
   * ボタン入力を表示
   */
  showButtonInput(options, nextStep, field = null) {
    const template = document.getElementById('button-input-template');
    const clone = template.content.cloneNode(true);
    const buttonContainer = clone.querySelector('.button-options');
    
    options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `
        <span class="option-label">${option.label}</span>
        ${option.desc ? `<span class="option-desc">${option.desc}</span>` : ''}
      `;
      
      btn.addEventListener('click', async () => {
        // ユーザーメッセージ表示
        this.showUserMessage(option.label);
        
        // データ保存
        if (field) {
          this.collectedData.persona[field] = option.value;
        }
        
        // 特別なアクション
        if (option.action === 'savePersona') {
          await this.savePersona();
        }
        
        // 入力エリアクリア
        this.elements.inputArea.innerHTML = '';
        
        // AI選択でスキップを選んだ場合は商品画像選択へ
        if (field === 'imageAI' && option.value === 'skip') {
          this.collectedData.images = this.collectedData.product?.images || [];
          this.goToStep('image_confirm');
          return;
        }
        
        // 次のステップへ
        if (nextStep) {
          this.goToStep(nextStep);
        }
      });
      
      buttonContainer.appendChild(btn);
    });
    
    this.elements.inputArea.appendChild(clone);
  },
  
  /**
   * 画像選択を表示
   */
  showImageSelect(step) {
    const template = document.getElementById('image-select-template');
    const clone = template.content.cloneNode(true);
    
    const tabs = clone.querySelectorAll('.source-tab');
    const contentArea = clone.querySelector('.image-source-content');
    
    // タブ切り替え
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderImageSourceContent(tab.dataset.source, contentArea, step);
      });
    });
    
    this.elements.inputArea.appendChild(clone);
    
    // 初期表示（商品画像）
    this.renderImageSourceContent('product', contentArea, step);
  },
  
  /**
   * 画像ソースコンテンツを描画
   */
  renderImageSourceContent(source, container, step) {
    container.innerHTML = '';
    
    switch (source) {
      case 'product':
        this.renderProductImages(container, step);
        break;
      case 'generate':
        this.renderAIGenerate(container, step);
        break;
      case 'upload':
        this.renderFileUpload(container, step);
        break;
    }
  },
  
  /**
   * 商品画像を表示
   */
  renderProductImages(container, step) {
    if (!this.collectedData.product || !this.collectedData.product.images) {
      container.innerHTML = '<p>商品画像が見つかりません</p>';
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'image-grid';
    
    this.collectedData.product.images.forEach((imgUrl, index) => {
      const imgOption = document.createElement('div');
      imgOption.className = 'image-option';
      imgOption.dataset.url = imgUrl;
      imgOption.innerHTML = `<img src="${imgUrl}" alt="商品画像${index + 1}">`;
      
      imgOption.addEventListener('click', () => {
        this.toggleImageSelection(imgOption, imgUrl);
      });
      
      grid.appendChild(imgOption);
    });
    
    container.appendChild(grid);
    
    // 確定ボタン
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.style.marginTop = '16px';
    confirmBtn.innerHTML = '<i class="fas fa-check"></i> 選択を確定';
    confirmBtn.addEventListener('click', () => {
      if (this.collectedData.images.length > 0) {
        this.elements.inputArea.innerHTML = '';
        this.goToStep(step.next);
      } else {
        this.showError('画像を1つ以上選択してください');
      }
    });
    
    container.appendChild(confirmBtn);
  },
  
  /**
   * 画像確認・選択画面を表示（サムネイル選択＋差し替え機能）
   */
  showImageConfirm(step) {
    const container = document.createElement('div');
    container.className = 'image-confirm-container';
    
    // 画像一覧
    const images = this.collectedData.images || [];
    
    if (images.length === 0) {
      container.innerHTML = '<p style="color: var(--text-light);">画像がありません</p>';
      this.elements.inputArea.appendChild(container);
      return;
    }
    
    // 説明
    const desc = document.createElement('p');
    desc.style.marginBottom = '16px';
    desc.innerHTML = '<strong>1枚目</strong>がサムネイルになります。ドラッグで順序を変更できます。';
    container.appendChild(desc);
    
    // 画像グリッド
    const grid = document.createElement('div');
    grid.className = 'image-grid image-confirm-grid';
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;';
    
    images.forEach((imgUrl, index) => {
      const url = typeof imgUrl === 'object' ? (imgUrl.url || imgUrl.path) : imgUrl;
      
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'image-confirm-item';
      imgWrapper.dataset.index = index;
      imgWrapper.style.cssText = `
        position: relative;
        border: 3px solid ${index === 0 ? 'var(--primary)' : 'var(--border-color)'};
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      
      // サムネイルバッジ
      if (index === 0) {
        const badge = document.createElement('div');
        badge.className = 'thumbnail-badge';
        badge.style.cssText = `
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--primary);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
          z-index: 2;
        `;
        badge.textContent = 'サムネイル';
        imgWrapper.appendChild(badge);
      }
      
      // 画像番号
      const numBadge = document.createElement('div');
      numBadge.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.6);
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: bold;
        z-index: 2;
      `;
      numBadge.textContent = index + 1;
      imgWrapper.appendChild(numBadge);
      
      // 画像
      const img = document.createElement('img');
      img.src = url;
      img.alt = `画像${index + 1}`;
      img.style.cssText = 'width: 100%; height: 150px; object-fit: cover;';
      imgWrapper.appendChild(img);
      
      // 差し替えボタン
      const replaceBtn = document.createElement('button');
      replaceBtn.className = 'replace-btn';
      replaceBtn.style.cssText = `
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.75rem;
        cursor: pointer;
        z-index: 2;
      `;
      replaceBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 差替';
      replaceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showImageReplaceModal(index);
      });
      imgWrapper.appendChild(replaceBtn);
      
      // クリックでサムネイルに設定
      imgWrapper.addEventListener('click', () => {
        this.setAsThumbnail(index);
        this.showImageConfirm(step); // 再描画
      });
      
      grid.appendChild(imgWrapper);
    });
    
    container.appendChild(grid);
    
    // 確定ボタン
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.style.cssText = 'margin-top: 20px; width: 100%;';
    confirmBtn.innerHTML = '<i class="fas fa-check"></i> この画像で進む';
    confirmBtn.addEventListener('click', () => {
      // サムネイルと他の画像を設定
      this.collectedData.options.thumbnailImage = this.collectedData.images[0];
      this.collectedData.options.otherImages = this.collectedData.images.slice(1);
      
      this.elements.inputArea.innerHTML = '';
      this.goToStep(step.next);
    });
    container.appendChild(confirmBtn);
    
    this.elements.inputArea.innerHTML = '';
    this.elements.inputArea.appendChild(container);
  },
  
  /**
   * サムネイルとして設定（配列の先頭に移動）
   */
  setAsThumbnail(index) {
    if (index === 0) return; // 既に先頭
    
    const images = this.collectedData.images;
    const selected = images.splice(index, 1)[0];
    images.unshift(selected);
    this.collectedData.images = images;
  },
  
  /**
   * 画像差し替えモーダルを表示
   */
  showImageReplaceModal(index) {
    // モーダル作成
    const modal = document.createElement('div');
    modal.className = 'image-replace-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
    `;
    
    content.innerHTML = `
      <h3 style="margin-bottom: 16px;">画像を差し替え</h3>
      <div class="file-upload-area" style="
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        padding: 32px;
        text-align: center;
        cursor: pointer;
        margin-bottom: 16px;
      ">
        <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--primary); margin-bottom: 8px;"></i>
        <p>クリックして画像を選択</p>
        <p style="font-size: 0.85rem; color: var(--text-light);">PNG, JPG, WEBP（最大5MB）</p>
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary" id="cancel-replace" style="flex: 1;">キャンセル</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // ファイル入力
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    content.appendChild(fileInput);
    
    // イベント
    content.querySelector('.file-upload-area').addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        App.showLoading('画像をアップロード中...', 50);
        try {
          const base64 = await this.fileToBase64(file);
          const result = await API.image.upload(base64, file.name);
          
          if (result.path) {
            this.collectedData.images[index] = result.path;
            App.hideLoading();
            modal.remove();
            // 再描画
            const step = CONFIG.CHAT_FLOW.find(s => s.id === 'image_confirm');
            this.showImageConfirm(step);
          }
        } catch (error) {
          App.hideLoading();
          this.showError('アップロードに失敗しました');
        }
      }
    });
    
    content.querySelector('#cancel-replace').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },
  
  /**
   * AI画像生成を表示
   */
  renderAIGenerate(container, step) {
    const modelSelection = document.createElement('div');
    modelSelection.className = 'model-selection';
    
    CONFIG.IMAGE_MODELS.forEach(model => {
      const modelOption = document.createElement('div');
      modelOption.className = 'model-option';
      modelOption.dataset.model = model.id;
      modelOption.innerHTML = `
        <div class="model-icon">${model.icon}</div>
        <div class="model-name">${model.name}</div>
        <div class="model-desc">${model.desc}</div>
      `;
      
      modelOption.addEventListener('click', () => {
        document.querySelectorAll('.model-option').forEach(el => el.classList.remove('selected'));
        modelOption.classList.add('selected');
        this.selectedImageModel = model.id;
      });
      
      modelSelection.appendChild(modelOption);
    });
    
    container.appendChild(modelSelection);
    
    // プロンプト入力
    const promptGroup = document.createElement('div');
    promptGroup.className = 'form-group';
    promptGroup.style.marginTop = '16px';
    promptGroup.innerHTML = `
      <label>画像のイメージを入力</label>
      <input type="text" id="image-prompt" placeholder="例: 木製の手押し車、赤ちゃんが遊んでいる様子">
    `;
    container.appendChild(promptGroup);
    
    // 生成ボタン
    const generateBtn = document.createElement('button');
    generateBtn.className = 'btn btn-primary';
    generateBtn.style.marginTop = '16px';
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> 画像を生成';
    generateBtn.addEventListener('click', async () => {
      const prompt = document.getElementById('image-prompt').value;
      if (!this.selectedImageModel) {
        this.showError('AIモデルを選択してください');
        return;
      }
      if (!prompt) {
        this.showError('プロンプトを入力してください');
        return;
      }
      
      App.showLoading('画像を生成中...', 0);
      try {
        const result = await API.image.generate(this.selectedImageModel, prompt);
        if (result.images) {
          this.collectedData.images = result.images;
          App.hideLoading();
          this.elements.inputArea.innerHTML = '';
          this.goToStep(step.next);
        }
      } catch (error) {
        App.hideLoading();
        this.showError('画像生成に失敗しました: ' + error.message);
      }
    });
    
    container.appendChild(generateBtn);
  },
  
  /**
   * ファイルアップロードを表示
   */
  renderFileUpload(container, step) {
    const uploadArea = document.createElement('div');
    uploadArea.className = 'file-upload-area';
    uploadArea.innerHTML = `
      <i class="fas fa-cloud-upload-alt"></i>
      <p>クリックまたはドラッグ&ドロップで画像をアップロード</p>
      <p style="font-size: 0.85rem; margin-top: 8px;">PNG, JPG, WEBP（最大5MB）</p>
    `;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--border-color)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--border-color)';
      const files = e.dataTransfer.files;
      this.handleFileUpload(files, step);
    });
    
    fileInput.addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files, step);
    });
    
    container.appendChild(uploadArea);
    container.appendChild(fileInput);
  },
  
  /**
   * ファイルアップロード処理
   */
  async handleFileUpload(files, step) {
    App.showLoading('画像をアップロード中...', 0);
    
    try {
      const uploadedImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await this.fileToBase64(file);
        const result = await API.image.upload(base64, file.name);
        
        if (result.path) {
          uploadedImages.push(result.path);
        }
        
        App.showLoading(`画像をアップロード中... (${i + 1}/${files.length})`, ((i + 1) / files.length) * 100);
      }
      
      this.collectedData.images = uploadedImages;
      App.hideLoading();
      this.elements.inputArea.innerHTML = '';
      this.goToStep(step.next);
      
    } catch (error) {
      App.hideLoading();
      this.showError('アップロードに失敗しました: ' + error.message);
    }
  },
  
  /**
   * ファイルをBase64に変換
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * 画像選択をトグル
   */
  toggleImageSelection(element, url) {
    const isSelected = element.classList.contains('selected');
    
    if (isSelected) {
      element.classList.remove('selected', 'main-selected');
      this.collectedData.images = this.collectedData.images.filter(img => img !== url);
    } else {
      element.classList.add('selected');
      this.collectedData.images.push(url);
      
      // 最初に選択した画像をメインに
      if (this.collectedData.images.length === 1) {
        element.classList.add('main-selected');
        this.collectedData.options.mainImage = url;
      }
    }
  },
  
  /**
   * 商品カードを表示
   */
  async showProductCard() {
    if (!this.collectedData.product) return;
    
    const product = this.collectedData.product;
    
    // 価格表示の作成
    let priceDisplay = '¥---';
    if (product.priceRange && product.priceRange.min !== product.priceRange.max) {
      priceDisplay = `¥${product.priceRange.min?.toLocaleString()}～${product.priceRange.max?.toLocaleString()}`;
    } else if (product.price) {
      priceDisplay = `¥${product.price.toLocaleString()}`;
    }
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card-header">
        <img src="${product.images[0] || ''}" class="product-card-image" alt="${product.name}">
        <div class="product-card-info">
          <div class="product-card-name">${product.name}</div>
          <div class="product-card-price">${priceDisplay}</div>
          <div class="product-card-review">
            <i class="fas fa-star"></i>
            <span>${product.reviews?.average || '--'} (${product.reviews?.count || 0}件)</span>
          </div>
        </div>
      </div>
    `;
    
    // 最後のボットメッセージに追加
    const lastBotMessage = this.elements.messagesContainer.querySelector('.bot-message:last-child .message-content');
    if (lastBotMessage) {
      lastBotMessage.appendChild(card);
    }
  },
  
  /**
   * プレビューを表示
   */
  showPreview() {
    App.showPreviewModal(this.collectedData);
  },
  
  /**
   * アクションを実行
   */
  async executeAction(action) {
    switch (action) {
      case 'analyzeProduct':
        await this.analyzeProduct();
        break;
      case 'generateImages':
        await this.generateImages();
        break;
      case 'generateContent':
        await this.generateContent();
        break;
    }
  },
  
  /**
   * 商品を解析
   */
  async analyzeProduct() {
    App.showLoading('商品ページを解析中...', 30);
    
    try {
      const result = await API.product.analyze(this.collectedData.productUrl);
      
      if (result.product) {
        this.collectedData.product = result.product;
        App.hideLoading();
      } else {
        throw new Error('商品情報を取得できませんでした');
      }
    } catch (error) {
      App.hideLoading();
      await this.showBotMessage('申し訳ありません。商品ページの解析に失敗しました😢\n別のURLを試すか、もう一度お試しください。');
      this.goToStep('product_url');
    }
  },
  
  /**
   * AI画像を生成
   */
  async generateImages() {
    const aiType = this.collectedData.persona.imageAI;
    const prompt = this.collectedData.persona.imagePrompt;
    
    // スキップの場合は商品画像を使用
    if (aiType === 'skip' || !aiType) {
      this.collectedData.images = this.collectedData.product?.images || [];
      return;
    }
    
    App.showLoading('画像を生成中...（1〜2分かかります）', 0);
    
    try {
      // 商品情報を含めたプロンプトを作成
      const productName = this.collectedData.product?.name || '';
      const fullPrompt = prompt || productName;
      
      const result = await API.image.generate(aiType, fullPrompt, { count: 4 });
      
      if (result.images && result.images.length > 0) {
        this.collectedData.generatedImages = result.images;
        this.collectedData.images = result.images.map(img => img.url || img.path || img);
        App.hideLoading();
      } else {
        throw new Error('画像生成に失敗しました');
      }
    } catch (error) {
      App.hideLoading();
      // エラー時は商品画像を使用
      await this.showBotMessage('画像生成に失敗しました。商品画像を使用します。');
      this.collectedData.images = this.collectedData.product?.images || [];
    }
  },
  
  /**
   * コンテンツを生成
   */
  async generateContent() {
    App.showLoading('コンテンツを生成中...', 0);
    
    try {
      // 進捗表示
      const stages = [
        { text: 'ペルソナを分析中...', progress: 20 },
        { text: 'セクション1を生成中...', progress: 35 },
        { text: 'セクション2を生成中...', progress: 50 },
        { text: 'セクション3を生成中...', progress: 65 },
        { text: 'セクション4を生成中...', progress: 80 },
        { text: '最終調整中...', progress: 95 }
      ];
      
      // 実際のAPI呼び出し
      const result = await API.content.generate(
        this.collectedData.persona,
        this.collectedData.product,
        {
          includePrice: this.collectedData.persona.includePrice,
          mainImage: this.collectedData.options.mainImage,
          images: this.collectedData.images
        }
      );
      
      if (result.content) {
        this.collectedData.generatedContent = result.content;
        App.hideLoading();
      } else {
        throw new Error('コンテンツ生成に失敗しました');
      }
    } catch (error) {
      App.hideLoading();
      this.showError('コンテンツ生成に失敗しました: ' + error.message);
    }
  },
  
  /**
   * ペルソナを保存
   */
  async savePersona() {
    const saveName = prompt('保存名を入力してください:', '設定1');
    if (saveName) {
      try {
        await API.persona.save(this.collectedData.persona, saveName);
        await this.showBotMessage(`「${saveName}」として保存しました！✨`);
      } catch (error) {
        this.showError('保存に失敗しました');
      }
    }
  },
  
  /**
   * エラーメッセージを表示
   */
  showError(message) {
    // 簡易的なエラー表示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #f44336;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  },
  
  /**
   * メッセージをクリア
   */
  clearMessages() {
    this.elements.messagesContainer.innerHTML = '';
  },
  
  /**
   * 最下部にスクロール
   */
  scrollToBottom() {
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  },
  
  /**
   * URLバリデーション
   */
  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  },
  
  /**
   * 遅延処理
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
