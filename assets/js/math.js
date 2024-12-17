// Math handling
const mathHandling = {
    init() {
      // Initialize MathJax rendering
      this.setupMathJax();
      this.addEquationCopy();
      this.handleReferences();
    },
  
    setupMathJax() {
      MathJax.Hub.Config({
        // Additional runtime configuration if needed
        tex2jax: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true
        }
      });
    },
  
    addEquationCopy() {
      // Add copy button to display equations
      document.querySelectorAll('.math-display').forEach(eq => {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-math absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity';
        copyBtn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
        copyBtn.onclick = () => this.copyEquation(eq);
        eq.appendChild(copyBtn);
      });
    },
  
    async copyEquation(eq) {
      // Get LaTeX source from MathJax
      const tex = eq.getAttribute('data-latex');
      await navigator.clipboard.writeText(tex);
      
      // Show copied state
      const btn = eq.querySelector('.copy-math');
      btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
      setTimeout(() => {
        btn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
      }, 2000);
    },
  
    handleReferences() {
      // Handle equation references
      document.querySelectorAll('.eqref').forEach(ref => {
        const eqNum = ref.getAttribute('href').substring(1);
        ref.textContent = `(${eqNum})`;
        
        ref.onclick = (e) => {
          e.preventDefault();
          document.querySelector(`#${eqNum}`).scrollIntoView({
            behavior: 'smooth'
          });
        };
      });
    }
  };
  
  // Initialize when document is ready
  document.addEventListener('DOMContentLoaded', () => {
    mathHandling.init();
  });



  // math.js
export function initMathJax() {
    // MathJax configuration placed in HTML (head)
    // If needed, do runtime config here.
    // If already configured in head, this file might be optional.
    // Example: 
    // window.MathJax = { ... };
    // <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js"></script>
  
    // Add equation copy buttons if desired:
    document.querySelectorAll('.math-display').forEach(eq => {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-math absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity';
      copyBtn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
      copyBtn.onclick = () => copyEquation(eq, copyBtn);
      eq.appendChild(copyBtn);
    });
  }
  
  async function copyEquation(eq, btn) {
    const tex = eq.getAttribute('data-latex') || ''; // store LaTeX source if possible
    await navigator.clipboard.writeText(tex);
    btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
    setTimeout(() => {
      btn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
    }, 2000);
  }
  