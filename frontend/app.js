// 自动识别环境：本地开发用 localhost，生产环境用 Worker 地址
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8787'
  : 'https://pm-dev-translator.yanghouguang.workers.dev';

const state = {
  direction: 'pm-to-dev',
  isLoading: false,
  outputText: '',
};

const elements = {
  toggleBtns: document.querySelectorAll('.toggle-btn'),
  inputText: document.getElementById('input-text'),
  outputText: document.getElementById('output-text'),
  translateBtn: document.getElementById('translate-btn'),
  copyBtn: document.getElementById('copy-btn'),
  inputTitle: document.querySelector('.input-title'),
  outputTitle: document.querySelector('.output-title'),
  btnText: document.querySelector('.btn-text'),
  btnLoading: document.querySelector('.btn-loading'),
};

const titles = {
  'pm-to-dev': {
    input: '产品需求',
    output: '技术方案',
    inputPlaceholder: '请输入产品需求描述...',
  },
  'dev-to-pm': {
    input: '技术描述',
    output: '业务价值',
    inputPlaceholder: '请输入技术实现描述...',
  },
};

function updateDirection(direction) {
  state.direction = direction;

  elements.toggleBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.direction === direction);
  });

  const config = titles[direction];
  elements.inputTitle.textContent = config.input;
  elements.outputTitle.textContent = config.output;
  elements.inputText.placeholder = config.inputPlaceholder;
}

function setLoading(loading) {
  state.isLoading = loading;
  elements.translateBtn.disabled = loading;
  elements.btnText.style.display = loading ? 'none' : 'inline';
  elements.btnLoading.style.display = loading ? 'inline' : 'none';
}

function renderOutput(text) {
  if (!text) {
    elements.outputText.innerHTML = '<p class="placeholder">翻译结果将显示在这里...</p>';
    elements.copyBtn.style.display = 'none';
    return;
  }

  elements.outputText.innerHTML = marked.parse(text);
  elements.copyBtn.style.display = 'block';
}

async function translate() {
  const content = elements.inputText.value.trim();

  if (!content) {
    alert('请输入内容');
    return;
  }

  setLoading(true);
  state.outputText = '';
  renderOutput('');

  try {
    const response = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        direction: state.direction,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;

            if (content) {
              state.outputText += content;
              renderOutput(state.outputText);
            }
          } catch {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
    elements.outputText.innerHTML = `<p style="color: #ef4444;">翻译失败: ${error.message}</p>`;
  } finally {
    setLoading(false);
  }
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(state.outputText);
    elements.copyBtn.textContent = '已复制';
    elements.copyBtn.classList.add('copied');

    setTimeout(() => {
      elements.copyBtn.textContent = '复制';
      elements.copyBtn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Copy failed:', error);
  }
}

// Event listeners
elements.toggleBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!state.isLoading) {
      updateDirection(btn.dataset.direction);
    }
  });
});

elements.translateBtn.addEventListener('click', translate);
elements.copyBtn.addEventListener('click', copyOutput);

// Ctrl+Enter to translate
elements.inputText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    translate();
  }
});

// Initialize
updateDirection('pm-to-dev');
