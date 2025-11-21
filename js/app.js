// Lógica principal del Visor Markdown Pro
(function () {
    // Dependencias esperadas: marked, hljs, renderMathInElement (KaTeX), mermaid, Chart

    const root = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileNameLabel = document.getElementById('fileName');
    const emptyState = document.getElementById('emptyState');
    const markdownBody = document.getElementById('markdownBody');
    const exportBtn = document.getElementById('exportBtn');
    const viewerShell = document.querySelector('.viewer-shell');
    const exportModal = document.getElementById('exportModal');

    // Defensive checks: if critical elements are missing, warn and avoid throwing
    function elName(el) { return el ? el.id || el.className || el.tagName : 'missing'; }
    if (!markdownBody) console.warn('`markdownBody` element not found — rendering disabled');

    let currentFileName = '';

    // Theme
    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (theme === 'dark') { themeIcon.textContent = '🌙'; themeLabel.textContent = 'Oscuro'; }
        else { themeIcon.textContent = '🌞'; themeLabel.textContent = 'Claro'; }
        localStorage.setItem('md-viewer-theme', theme);
    }
    const savedTheme = (() => { try { return localStorage.getItem('md-viewer-theme'); } catch (e) { return null; } })();
    if (savedTheme === 'dark' || savedTheme === 'light') applyTheme(savedTheme);
    else applyTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => { const cur = root.getAttribute('data-theme') || 'light'; applyTheme(cur === 'light' ? 'dark' : 'light'); });

    // File handling
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    function handleFileSelect(e) {
        const file = e.target.files && e.target.files[0]; if (!file) return;
        currentFileName = file.name; fileNameLabel.textContent = file.name;
        fileInfo.innerHTML = `<strong>Archivo:</strong> ${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
        exportBtn.style.display = 'inline-flex';
        const reader = new FileReader();
        reader.onload = function (ev) { renderMarkdown(ev.target.result); };
        reader.readAsText(file, 'utf-8');
    }

    // Drag & drop
    if (viewerShell) {
        viewerShell.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; try { viewerShell.style.borderColor = 'rgba(96,165,250,0.9)'; } catch (_) { } });
        viewerShell.addEventListener('dragleave', () => { try { viewerShell.style.borderColor = 'rgba(148,163,184,0.5)'; } catch (_) { } });
        viewerShell.addEventListener('drop', (e) => { e.preventDefault(); try { viewerShell.style.borderColor = 'rgba(148,163,184,0.5)'; } catch (_) { } const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return; if (!/\.(md|markdown|txt)$/i.test(f.name)) { alert('Por favor suelta un archivo .md, .markdown o .txt'); return; } currentFileName = f.name; if (fileNameLabel) fileNameLabel.textContent = f.name; if (fileInfo) fileInfo.innerHTML = `<strong>Archivo:</strong> ${f.name} · ${(f.size / 1024).toFixed(1)} KB`; if (exportBtn) exportBtn.style.display = 'inline-flex'; const reader = new FileReader(); reader.onload = (ev) => renderMarkdown(ev.target.result); reader.readAsText(f, 'utf-8'); });
    }

    // Helper: shield math segments (not inside code fences or inline code) and return placeholders
    function shieldMath(input) {
        const codeFenceRegex = /```[\s\S]*?```/g;
        const inlineCodeRegex = /`[^`]*`/g;
        // find ignore ranges (code fences and inline code)
        const ignore = [];
        let m;
        while ((m = codeFenceRegex.exec(input)) !== null) ignore.push([m.index, m.index + m[0].length]);
        while ((m = inlineCodeRegex.exec(input)) !== null) ignore.push([m.index, m.index + m[0].length]);

        function inIgnore(pos) {
            for (let r of ignore) if (pos >= r[0] && pos < r[1]) return true; return false;
        }

        // collect math matches: display ($$...$$) and inline ($...$) but skip if inside ignore
        const mathMatches = [];
        const displayRegex = /\$\$([\s\S]*?)\$\$/g;
        const inlineRegex = /\$([^\$\n]+?)\$/g;

        let matches = [];
        while ((m = displayRegex.exec(input)) !== null) matches.push({ i: m.index, len: m[0].length, text: m[1], display: true });
        while ((m = inlineRegex.exec(input)) !== null) matches.push({ i: m.index, len: m[0].length, text: m[1], display: false });
        matches.sort((a, b) => a.i - b.i);

        let out = ''; let last = 0; const math = [];
        for (let idx = 0; idx < matches.length; idx++) {
            const mm = matches[idx];
            if (inIgnore(mm.i)) continue;
            out += input.slice(last, mm.i);
            const placeholder = `@@MATH${math.length}@@`;
            out += placeholder;
            math.push(mm);
            last = mm.i + mm.len;
        }
        out += input.slice(last);
        return { text: out, math };
    }

    function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    function restoreMathInDOM(container, mathList) {
        if (!mathList || mathList.length === 0) return;
        let html = container.innerHTML;
        for (let i = 0; i < mathList.length; i++) {
            const item = mathList[i];
            let rendered = '';
            try {
                // Normalize common double-escaping that AI generators add (e.g. "\\text{" -> "\text{")
                try { item.text = item.text.replace(/\\\\(?=[a-zA-Z\\\{])/g, '\\'); } catch (e) { }
                if (window.katex && katex.renderToString) {
                    rendered = katex.renderToString(item.text, { displayMode: !!item.display, throwOnError: false });
                } else {
                    // fallback: keep original with a class so MathJax can process it later
                    const content = item.display ? `$$${item.text}$$` : `$${item.text}$`;
                    rendered = `<span class="math-raw">${escapeHtml(content)}</span>`;
                }
            } catch (e) { rendered = `<span class="math-raw">${escapeHtml(item.text)}</span>`; }
            const placeholder = `@@MATH${i}@@`;
            // replace all occurrences of placeholder
            html = html.split(placeholder).join(rendered);
        }
        container.innerHTML = html;
    }

    // Render markdown with marked, highlight.js and KaTeX/MathJax fallback
    function renderMarkdown(text) {
        const shield = shieldMath(text);
        const { marked } = window;
        marked.setOptions({ gfm: true, breaks: false, headerIds: true, mangle: false });
        const html = marked.parse(shield.text);
        markdownBody.innerHTML = html;
        // restore and render math now
        restoreMathInDOM(markdownBody, shield.math);
        emptyState.style.display = 'none'; markdownBody.style.display = 'block';

        // Make tables responsive
        if (markdownBody) markdownBody.querySelectorAll('table').forEach(t => { const wrap = document.createElement('div'); wrap.className = 'table-wrap'; t.parentNode.insertBefore(wrap, t); wrap.appendChild(t); });

        // Highlight code
        if (window.hljs && markdownBody) markdownBody.querySelectorAll('pre code').forEach(block => { try { hljs.highlightElement(block); } catch (e) { } });

        // Render mermaid diagrams
        if (window.mermaid && markdownBody) {
            // initialize mermaid if not already
            try { if (mermaid.initialize) mermaid.initialize({ startOnLoad: false }); } catch (e) { }
            markdownBody.querySelectorAll('code.language-mermaid').forEach((code, idx) => {
                const pre = code.closest('pre');
                const container = document.createElement('div');
                container.className = 'mermaid';
                container.textContent = code.textContent;
                pre.parentNode.replaceChild(container, pre);
            });
            try { mermaid.init(undefined, markdownBody.querySelectorAll('.mermaid')); } catch (e) { }
        }

        // Chart.js: detect code blocks language-chartjs (JSON config) and render canvas
        if (markdownBody) markdownBody.querySelectorAll('code.language-chartjs').forEach((code, i) => {
            try {
                const cfg = JSON.parse(code.textContent);
                const canvas = document.createElement('canvas');
                const pre = code.closest('pre');
                pre.parentNode.replaceChild(canvas, pre);
                // eslint-disable-next-line no-undef
                new Chart(canvas.getContext('2d'), cfg);
            } catch (err) { console.warn('Chart render failed', err); }
        });

        // If KaTeX auto-render not available, let MathJax typeset remaining math (e.g., math-raw)
        if (!window.katex && window.MathJax) { MathJax.typesetPromise([markdownBody]).catch(e => console.warn(e)); }

        // open links in new tab
        markdownBody.querySelectorAll('a').forEach(a => a.setAttribute('target', '_blank'));
    }

    // Export modal
    if (exportBtn && exportModal) {
        exportBtn.addEventListener('click', () => exportModal.classList.add('active'));
        window.closeExportModal = () => exportModal.classList.remove('active');
        exportModal.addEventListener('click', (e) => { if (e.target === exportModal) closeExportModal(); });
    } else {
        window.closeExportModal = () => { };
    }

    window.performExport = function () {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const spinner = document.getElementById('exportSpinner');
        const btnText = document.getElementById('exportBtnText');
        const btn = document.querySelector('.modal-btn.export');
        spinner.style.display = 'inline-block'; btnText.textContent = 'Exportando...'; btn.disabled = true;
        setTimeout(async () => {
            if (format === 'pdf') await exportToPDF(); else exportToHTML();
            spinner.style.display = 'none'; btnText.textContent = 'Exportar'; btn.disabled = false; closeExportModal();
        }, 300);
    };

    async function ensureMathRendered() {
        if (window.renderMathInElement) return Promise.resolve();
        if (window.MathJax) return MathJax.typesetPromise();
        return Promise.resolve();
    }

    async function exportToPDF() {
        const element = document.getElementById('markdownBody');
        const fileName = (currentFileName || 'document').replace(/\.(md|markdown|txt)$/i, '') + '.pdf';
        await ensureMathRendered();
        // Force light theme while rendering PDF so exported file looks like light mode
        const prevTheme = root.getAttribute('data-theme');
        try {
            root.setAttribute('data-theme', 'light');
            const opt = {
                margin: [15, 15, 15, 15],
                filename: fileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // html2pdf returns a Promise in modern bundles; await to ensure restore after save
            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.warn('Export to PDF failed', err);
        } finally {
            // restore previous theme
            if (prevTheme) root.setAttribute('data-theme', prevTheme);
            else root.removeAttribute('data-theme');
        }
    }

    function exportToHTML() {
        const element = document.getElementById('markdownBody');
        const fileName = (currentFileName || 'document').replace(/\.(md|markdown|txt)$/i, '') + '.html';
        const htmlContent = buildExportHTML(element.innerHTML, fileName);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function buildExportHTML(innerHTML, title) {
        // Export includes CDN links to KaTeX, highlight.js, mermaid and Chart.js so exported file renders standalone
        return `<!doctype html>
<html lang="es" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github.min.css">
  <style>
    body{font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width:900px; margin:40px auto; padding:20px; background:#f5f5f5; color:#111827}
    pre{background:#f3f4f6; padding:12px; border-radius:8px; overflow:auto}
    code{background:#f3f4f6; padding:0.1em 0.3em; border-radius:4px}
    img{max-width:100%; border-radius:10px}
  </style>
  <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js"></script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
  <article>
    ${innerHTML}
  </article>
  <script>
    try{ if(window.hljs) hljs.highlightAll(); }catch(e){}
    try{ if(window.renderMathInElement) renderMathInElement(document.body, { delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false}], throwOnError:false }); }catch(e){}
    try{ if(window.mermaid) mermaid.init(undefined, document.querySelectorAll('.mermaid')); }catch(e){}
    try{ document.querySelectorAll('code.language-chartjs').forEach((c)=>{ try{ const cfg=JSON.parse(c.textContent); const canvas=document.createElement('canvas'); c.closest('pre').parentNode.replaceChild(canvas, c.closest('pre')); new Chart(canvas.getContext('2d'), cfg); }catch(e){} }); }catch(e){}
  </script>
</body>
</html>`;
    }

})();
