/* ============================================
   Propermarket Design Team Onboarding
   ai-search.js — AI Search Modal (Gemini + Claude)
   ============================================ */

(function () {
  'use strict';

  /* ----- Models ----- */
  const DEFAULT_KEYS = {
    gemini: '',
    claude: '',
  };

  const MODELS = {
    gemini: {
      id: 'gemini-2.5-flash',
      label: 'Gemini',
      storageKey: 'pm_gemini_api_key',
    },
    claude: {
      id: 'claude-sonnet-4-20250514',
      label: 'Claude',
      storageKey: 'pm_claude_api_key',
    },
  };

  const MAX_TOKENS = 1024;

  const SITE_CONTEXT = `당신은 Propermarket 디자인팀의 온보딩 어시스턴트입니다.
팀 정보, 업무 방식, 툴 사용법에 대해 친근하고 명확하게 답변하세요.
짧고 핵심적으로 답변하되, 필요하면 상세히 설명하세요.

[팀 구성]
- 김문준 (디자인 리드): BI/BX, UI/UX, 브랜드 시스템 담당
- 윤세영 (브랜드 디자이너): 상세페이지, 리플렛, 오프라인 담당
- 박민지 (브랜드 디자이너): 미디어커머스, 광고소재, CRM 담당
- 남현우 (브랜드 디자이너): 패키지 & BX 디자인 담당
- 이지솔 (브랜드 디자이너 - 신규): UI/UX 담당

[OKR]
- O1. 전환 UX (Core, 전사 최우선): 구매 전환율을 높이는 핵심 UX 개선
- O2. 마케팅 콘텐츠 운영 (필수): 지속적인 마케팅 소재 제작과 품질 관리
- O3. 신상품 런칭 (필수): 신규 상품의 브랜드 표현과 런칭 소재 기획
- O4. 브랜드 시스템 구축 (중장기): 일관된 브랜드 경험을 위한 시스템 정립

[업무 흐름]
요청시트 → Figma 작업 → 피드백 → 배포

[주요 툴]
- Figma: 디자인 및 프로토타이핑
- Notion: 문서 관리 및 프로젝트 관리
- Google Drive: 파일 공유
- Google Sheets: 요청시트, 데이터 관리

[이지솔님 역할]
- UX/UI 디자인 70%
- 마케팅·프로모션 디자인 20%
- AI 기반 디자인 프로세스 10%

[마일스톤]
- 1.5개월: 팀 업무 파악 완료, 첫 독립 작업 완수
- 3개월: UX 개선 프로젝트 주도, 팀 내 디자이너로 자리잡기`;

  /* ----- DOM References ----- */
  const overlay           = document.getElementById('ai-modal-overlay');
  const modal             = document.getElementById('ai-modal');
  const closeBtn          = document.getElementById('ai-modal-close');
  const messagesContainer = document.getElementById('ai-messages');
  const inputField        = document.getElementById('ai-input');
  const sendBtn           = document.getElementById('ai-send');
  const fileInput         = document.getElementById('ai-file-input');
  const uploadedArea      = document.getElementById('ai-uploaded');
  const uploadedFiles     = document.getElementById('ai-uploaded-files');
  const apiKeyToggle      = document.getElementById('ai-apikey-toggle');
  const apiKeyField       = document.getElementById('ai-apikey-field');
  const modelSelect       = document.getElementById('ai-model-select');

  const apiKeyInputGemini = document.getElementById('ai-apikey-gemini');
  const apiKeySaveGemini  = document.getElementById('ai-apikey-save-gemini');
  const apiKeyInputClaude = document.getElementById('ai-apikey-claude');
  const apiKeySaveClaude  = document.getElementById('ai-apikey-save-claude');

  /* ----- State ----- */
  let geminiHistory      = []; // [{role:'user'|'model', parts:[{text:''}]}]
  let claudeHistory      = []; // [{role:'user'|'assistant', content:''}]
  let uploadedDocContext  = '';
  let uploadedFileNames   = [];
  let isLoading           = false;

  /* =============================================
     1. Modal Open / Close
     ============================================= */
  function openModal(e) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputField.focus(), 300);

    // If opened with a message from hero input
    if (e && e.detail && e.detail.message) {
      setTimeout(() => sendMessage(e.detail.message), 400);
    }
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.addEventListener('openAISearch', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });
  modal.addEventListener('click', (e) => e.stopPropagation());

  /* =============================================
     2. API Key Management
     ============================================= */
  function getApiKey(provider) {
    try {
      return localStorage.getItem(MODELS[provider].storageKey) || DEFAULT_KEYS[provider] || '';
    } catch (e) {
      return DEFAULT_KEYS[provider] || '';
    }
  }
  function saveApiKey(provider, key) {
    try { localStorage.setItem(MODELS[provider].storageKey, key); } catch (e) { /* silent */ }
  }

  function getSelectedModel() {
    return modelSelect.value; // 'gemini' or 'claude'
  }

  // Load saved keys
  apiKeyInputGemini.value = getApiKey('gemini');
  apiKeyInputClaude.value = getApiKey('claude');

  // Load saved model preference
  try {
    const savedModel = localStorage.getItem('pm_ai_model');
    if (savedModel && MODELS[savedModel]) modelSelect.value = savedModel;
  } catch (e) { /* silent */ }

  modelSelect.addEventListener('change', () => {
    try { localStorage.setItem('pm_ai_model', modelSelect.value); } catch (e) { /* silent */ }
  });

  apiKeyToggle.addEventListener('click', () => {
    const visible = apiKeyField.style.display !== 'none';
    apiKeyField.style.display = visible ? 'none' : 'flex';
  });

  apiKeySaveGemini.addEventListener('click', () => {
    const key = apiKeyInputGemini.value.trim();
    if (key) {
      saveApiKey('gemini', key);
      appendMessage('ai', 'Gemini API 키가 저장되었습니다.');
    } else {
      try {
        localStorage.removeItem(MODELS.gemini.storageKey);
        appendMessage('ai', 'Gemini API 키가 초기화되었습니다. 이제 서버 공용 API 키를 사용합니다.');
      } catch (e) { /* silent */ }
    }
  });

  apiKeySaveClaude.addEventListener('click', () => {
    const key = apiKeyInputClaude.value.trim();
    if (key) {
      saveApiKey('claude', key);
      appendMessage('ai', 'Claude API 키가 저장되었습니다.');
    } else {
      try {
        localStorage.removeItem(MODELS.claude.storageKey);
        appendMessage('ai', 'Claude API 키가 초기화되었습니다.');
      } catch (e) { /* silent */ }
    }
  });

  apiKeyInputGemini.addEventListener('keydown', (e) => { if (e.key === 'Enter') apiKeySaveGemini.click(); });
  apiKeyInputClaude.addEventListener('keydown', (e) => { if (e.key === 'Enter') apiKeySaveClaude.click(); });

  /* =============================================
     3. Message Rendering
     ============================================= */
  function appendMessage(role, content) {
    const msgDiv   = document.createElement('div');
    msgDiv.className = `ai-msg ai-msg--${role}`;
    const bubble   = document.createElement('div');
    bubble.className = 'ai-msg__bubble';
    bubble.textContent = content;
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function appendLoadingIndicator() {
    const msgDiv   = document.createElement('div');
    msgDiv.className = 'ai-msg ai-msg--ai';
    msgDiv.id       = 'ai-loading-msg';
    const bubble   = document.createElement('div');
    bubble.className = 'ai-msg__bubble';
    const dots     = document.createElement('div');
    dots.className  = 'ai-loading-dots';
    dots.innerHTML  = '<span></span><span></span><span></span>';
    bubble.appendChild(dots);
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function removeLoadingIndicator() {
    const el = document.getElementById('ai-loading-msg');
    if (el) el.remove();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /* =============================================
     4. Build System Prompt
     ============================================= */
  function getSystemText() {
    let text = SITE_CONTEXT;
    if (uploadedDocContext) {
      text += `\n\n[업로드된 문서 내용]\n${uploadedDocContext}`;
    }
    return text;
  }

  /* =============================================
     5. Gemini API
     ============================================= */
  async function callGemini(userText) {
    const apiKey = getApiKey('gemini');

    geminiHistory.push({ role: 'user', parts: [{ text: userText }] });

    let response;
    // API 키가 있으면 직접 호출, 없으면 서버리스 백엔드 프록시 호출
    if (apiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini.id}:generateContent?key=${apiKey}`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: getSystemText() }] },
          contents: geminiHistory,
          generationConfig: {
            maxOutputTokens: MAX_TOKENS,
            temperature: 0.7,
          },
        }),
      });
    } else {
      const endpoint = '/api/gemini';
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: getSystemText() }] },
          contents: geminiHistory,
          generationConfig: {
            maxOutputTokens: MAX_TOKENS,
            temperature: 0.7,
          },
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg  = errorData.error?.message || errorData.error || `HTTP ${response.status}`;
      geminiHistory.pop();

      if (apiKey && (response.status === 401 || response.status === 403)) {
        throw new Error(`API 키 오류 (${response.status}): ${errorMsg}\n"API Key 설정"에서 올바른 Gemini API 키를 확인해 주세요.`);
      }
      throw new Error(`Gemini 오류 (${response.status}): ${errorMsg}`);
    }

    const data   = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 처리할 수 없습니다.';

    geminiHistory.push({ role: 'model', parts: [{ text: aiText }] });
    return aiText;
  }

  /* =============================================
     6. Claude API (Direct Browser Access)
     ============================================= */
  async function callClaude(userText) {
    const apiKey = getApiKey('claude');
    if (!apiKey) {
      appendMessage('ai', 'Claude API 키가 설정되지 않았습니다. 하단의 "API Key 설정"을 클릭하여 키를 입력해 주세요.');
      return;
    }

    claudeHistory.push({ role: 'user', content: userText });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODELS.claude.id,
        max_tokens: MAX_TOKENS,
        system: getSystemText(),
        messages: claudeHistory,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg  = errorData.error?.message || `HTTP ${response.status}`;
      claudeHistory.pop();

      if (response.status === 401 || response.status === 403) {
        throw new Error(`API 키 오류 (${response.status}): ${errorMsg}\n"API Key 설정"에서 올바른 Claude API 키를 확인해 주세요.`);
      }
      throw new Error(`Claude 오류 (${response.status}): ${errorMsg}`);
    }

    const data   = await response.json();
    const aiText = data.content?.[0]?.text || '응답을 처리할 수 없습니다.';

    claudeHistory.push({ role: 'assistant', content: aiText });
    return aiText;
  }

  /* =============================================
     7. Unified Send Message
     ============================================= */
  async function sendMessage(userText) {
    if (isLoading || !userText.trim()) return;

    const provider = getSelectedModel();
    const apiKey   = getApiKey(provider);

    // Gemini는 백엔드 프록시(/api/gemini)가 존재하므로 브라우저 API 키가 없어도 계속 진행합니다.
    if (!apiKey && provider !== 'gemini') {
      appendMessage('ai', `${MODELS[provider].label} API 키가 설정되지 않았습니다. 하단의 "API Key 설정"을 클릭하여 키를 입력해 주세요.`);
      return;
    }

    isLoading = true;
    appendMessage('user', userText);
    inputField.value = '';
    appendLoadingIndicator();

    try {
      let aiText;
      if (provider === 'gemini') {
        aiText = await callGemini(userText);
      } else {
        aiText = await callClaude(userText);
      }

      removeLoadingIndicator();
      if (aiText) appendMessage('ai', aiText);

    } catch (error) {
      removeLoadingIndicator();
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        appendMessage('ai', '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.');
      } else {
        appendMessage('ai', error.message);
      }
    }

    isLoading = false;
  }

  /* =============================================
     8. Input Handlers
     ============================================= */
  sendBtn.addEventListener('click', () => sendMessage(inputField.value));
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputField.value);
    }
  });

  /* =============================================
     9. Document Upload & Text Extraction
     ============================================= */
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['.md', '.txt', '.pdf'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      appendMessage('ai', '.md, .txt, .pdf 파일만 업로드할 수 있습니다.');
      fileInput.value = '';
      return;
    }

    try {
      let text = '';

      if (ext === '.pdf') {
        const buffer  = await file.arrayBuffer();
        const bytes   = new Uint8Array(buffer);
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(bytes);
        const matches = rawText.match(/\(([^)]+)\)/g);
        if (matches) {
          text = matches
            .map((m) => m.slice(1, -1))
            .filter((t) => t.length > 1 && !/^[\\\/\d]+$/.test(t))
            .join(' ');
        }
        if (!text.trim()) {
          text = `[PDF 파일: ${file.name} — 텍스트 기반 PDF에서 가장 잘 동작합니다.]`;
        }
      } else {
        text = await file.text();
      }

      uploadedDocContext += `\n\n--- ${file.name} ---\n${text}`;
      uploadedFileNames.push(file.name);
      uploadedArea.style.display  = 'block';
      uploadedFiles.textContent   = uploadedFileNames.join(', ');
      appendMessage('ai', `"${file.name}" 문서가 업로드되었습니다. 이 문서의 내용을 참고하여 답변할 수 있어요.`);
    } catch (error) {
      appendMessage('ai', `파일을 읽는 중 오류가 발생했습니다: ${error.message}`);
    }

    fileInput.value = '';
  });
})();
