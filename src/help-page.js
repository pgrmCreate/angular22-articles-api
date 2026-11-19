import { resources, routes, tools } from './help.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderHelp() {
    const groups = [...new Set(routes.map((r) => r.group))];
    const routeHtml = groups.map((g) => `<h2>${g}</h2>` + routes.filter((r) => r.group === g).map((r) => `
        <div class="route">
            <div class="sig"><span class="m ${r.method}">${r.method}</span><code>${esc(r.path)}</code></div>
            <p>${esc(r.description)}</p>
            ${r.query ? `<table>${Object.entries(r.query).map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}
            ${r.body ? `<p class="b"><b>Corps JSON :</b> <code>${esc(r.body)}</code></p>` : ''}
            <p class="r"><b>Réponse :</b> ${esc(r.response)}</p>
        </div>`).join('')).join('');
    const resHtml = Object.entries(resources).map(([name, r]) => `
        <div class="res"><h3>${name === 'article' ? 'Article' : 'Author'}</h3><p>${esc(r.description)}</p>
        <table>${Object.entries(r.fields).map(([k, v]) => `<tr><td><code>${k}</code></td><td>${esc(v)}</td></tr>`).join('')}</table>
        <pre>${esc(JSON.stringify(r.example, null, 2))}</pre></div>`).join('');
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>API articles – aide</title><style>
body{margin:0;font-family:Roboto,Segoe UI,Arial,sans-serif;background:#f4f4f7;color:#1a1a1a}
main{max-width:860px;margin:0 auto;padding:16px}
header{background:linear-gradient(135deg,#c3002f,#6a1b9a);color:#fff;padding:18px 16px;border-radius:12px}
header h1{margin:0 0 4px}header p{margin:0;opacity:.9}
h2{margin:26px 0 8px;color:#c3002f}h3{margin:0 0 4px}
.route,.res{background:#fff;border-radius:10px;padding:10px 12px;margin:8px 0;box-shadow:0 1px 2px #0001;break-inside:avoid}
.sig{display:flex;gap:8px;align-items:center;font-size:1.05em}.m{font:700 12px Consolas,monospace;padding:3px 7px;border-radius:5px;color:#fff;min-width:58px;text-align:center}
.GET{background:#0b6bcb}.POST{background:#2e7d32}.PUT{background:#ef6c00}.PATCH{background:#8d6e00}.DELETE{background:#c62828}
code{font-family:Consolas,Menlo,monospace;background:#eef0f7;color:#8a1538;padding:1px 4px;border-radius:4px}
.sig code{background:none;color:#1a1a1a;font-weight:700}
p{margin:6px 0}table{border-collapse:collapse;width:100%;font-size:.92em}td{border-top:1px solid #eee;padding:4px 6px;vertical-align:top}td:first-child{white-space:nowrap;width:1%}
pre{background:#1e1e2e;color:#e6e6f0;padding:10px;border-radius:8px;overflow:auto;font-size:12.5px}
.r{color:#444}.b{color:#444}
@media print{body{background:#fff}.route,.res{box-shadow:none;border:1px solid #ddd}}
</style></head><body><main>
<header><h1>API articles – aide</h1><p>API REST de démonstration pour la formation Angular 22 · base : <code style="background:#ffffff33;color:#fff">http://localhost:3000</code></p></header>
<h2>Ressources</h2>${resHtml}
${routeHtml}
<h2>Options et outils</h2><div class="route"><table>${tools.map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td>${esc(v)}</td></tr>`).join('')}</table></div>
<h2>Erreurs</h2><div class="route"><p>Toutes les erreurs ont la forme <code>{ "error": "message", "details"?: { champ: "règle" } }</code>.</p>
<table><tr><td><code>400</code></td><td>données invalides (détail par champ) ou JSON mal formé</td></tr><tr><td><code>401</code></td><td>jeton absent ou invalide</td></tr><tr><td><code>404</code></td><td>ressource ou route inconnue</td></tr><tr><td><code>409</code></td><td>conflit (supprimer un auteur qui a des articles)</td></tr></table></div>
</main></body></html>`;
}
