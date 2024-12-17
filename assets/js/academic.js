// academic.js
// Requires `bibtexParse` if using directly in Jekyll/HTML (include via a script tag or bundler).
// In a React environment, ensure that `bibtexParse` is available globally or import it.

const citations = {
    bibliography: new Map(),
    
    async init(bibFile) {
      if (!bibFile) return;
      const res = await fetch(`/assets/docs/bibliography/${bibFile}`);
      const bib = await res.text();
      const entries = bibtexParse.toJSON(bib);
      for (const entry of entries) {
        this.bibliography.set(entry.citationKey, entry);
      }
      this.processCitations();
    },
    
    processCitations() {
      document.querySelectorAll('z-cite[key]').forEach((cite, i) => {
        const key = cite.getAttribute('key');
        const entry = this.bibliography.get(key);
        if (entry) {
          cite.setAttribute('number', i + 1);
          
          const preview = document.createElement('div');
          preview.className = 'citation-preview';
          preview.innerHTML = this.formatCitation(entry);
          cite.appendChild(preview);
        }
      });
    },
    
    formatCitation(entry) {
      return `
        <div class="font-medium">${entry.title}</div>
        <div class="mt-1">${entry.author}</div>
        <div class="mt-1 text-sm opacity-75">
          ${entry.journal || entry.booktitle || ''} ${entry.year ? `(${entry.year})` : ''}
        </div>
      `;
    }
  };
  
  const codeBlocks = {
    init() {
      document.querySelectorAll('z-code').forEach(block => {
        const header = block.querySelector('.header');
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i data-lucide="copy"></i>';
        copyBtn.onclick = () => this.copyCode(block, copyBtn);
        header.appendChild(copyBtn);
      });
    },
  
    async copyCode(block, btn) {
      const code = block.querySelector('pre').textContent;
      await navigator.clipboard.writeText(code);
      btn.innerHTML = '<i data-lucide="check"></i>';
      setTimeout(() => {
        btn.innerHTML = '<i data-lucide="copy"></i>';
      }, 2000);
    }
  };
  
  // Initialize functions
  export function initAcademic(bibFile) {
    citations.init(bibFile);
    codeBlocks.init();
  }
  