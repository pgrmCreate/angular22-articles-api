import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createApp } from '../src/app.js';

let server;
let base;

before(async () => {
    server = createApp({ log: false }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://localhost:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => fetch(`${base}/api/reset`, { method: 'POST' }));

const send = (method, body, headers = {}) => ({
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
});

test('liste les articles avec X-Total-Count', async () => {
    const res = await fetch(`${base}/api/articles`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-total-count'), '12');
    assert.equal((await res.json()).length, 12);
});

test('filtre, pagine et ajoute l’auteur', async () => {
    const byAuthor = await (await fetch(`${base}/api/articles?authorId=2`)).json();
    assert.ok(byAuthor.every((a) => a.authorId === 2));
    const page = await fetch(`${base}/api/articles?_page=2&_limit=5`);
    assert.equal((await page.json()).length, 5);
    assert.equal(page.headers.get('x-total-count'), '12');
    const one = await (await fetch(`${base}/api/articles/1?_expand=author`)).json();
    assert.equal(one.author.name, 'Ada Lovelace');
    const search = await (await fetch(`${base}/api/articles?q=vitest`)).json();
    assert.ok(search.length >= 1);
});

test('404 pour un article inconnu', async () => {
    const res = await fetch(`${base}/api/articles/999`);
    assert.equal(res.status, 404);
    assert.match((await res.json()).error, /introuvable/);
});

test('crée un article (201 + Location)', async () => {
    const res = await fetch(`${base}/api/articles`, send('POST', { title: 'Nouveau', content: 'Texte', authorId: 1 }));
    assert.equal(res.status, 201);
    const article = await res.json();
    assert.equal(article.id, 13);
    assert.equal(res.headers.get('location'), '/api/articles/13');
    assert.deepEqual(article.tags, []);
});

test('refuse un article invalide avec le détail des champs', async () => {
    const res = await fetch(`${base}/api/articles`, send('POST', { title: 'a', authorId: 99 }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(Object.keys(body.details).sort(), ['authorId', 'content', 'title']);
});

test('PUT, PATCH puis DELETE', async () => {
    const put = await fetch(`${base}/api/articles/1`, send('PUT', { title: 'Remplacé', content: 'C', authorId: 2 }));
    assert.equal((await put.json()).authorId, 2);
    const patch = await fetch(`${base}/api/articles/1`, send('PATCH', { published: false }));
    const patched = await patch.json();
    assert.equal(patched.published, false);
    assert.equal(patched.title, 'Remplacé');
    const del = await fetch(`${base}/api/articles/1`, { method: 'DELETE' });
    assert.equal(del.status, 204);
    assert.equal((await fetch(`${base}/api/articles/1`)).status, 404);
});

test('auteurs : CRUD et conflit 409', async () => {
    assert.equal((await (await fetch(`${base}/api/authors`)).json()).length, 5);
    assert.equal((await fetch(`${base}/api/authors/1`, { method: 'DELETE' })).status, 409);
    const created = await (await fetch(`${base}/api/authors`, send('POST', { name: 'Hedy Lamarr', email: 'hedy@exemple.fr' }))).json();
    assert.equal(created.id, 6);
    assert.equal((await fetch(`${base}/api/authors/6`, { method: 'DELETE' })).status, 204);
    const articles = await (await fetch(`${base}/api/authors/1/articles`)).json();
    assert.ok(articles.every((a) => a.authorId === 1));
});

test('connexion puis /api/me', async () => {
    assert.equal((await fetch(`${base}/api/me`)).status, 401);
    const bad = await fetch(`${base}/api/login`, send('POST', { email: 'ada@exemple.fr', password: 'faux' }));
    assert.equal(bad.status, 401);
    const { token } = await (await fetch(`${base}/api/login`, send('POST', { email: 'ada@exemple.fr', password: 'angular22' }))).json();
    const me = await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal((await me.json()).name, 'Ada Lovelace');
});

test('_fail et _delay', async () => {
    assert.equal((await fetch(`${base}/api/articles?_fail=500`)).status, 500);
    const t = Date.now();
    await fetch(`${base}/api/articles?_delay=300`);
    assert.ok(Date.now() - t >= 290);
});

test('aide HTML, JSON, route inconnue et JSON invalide', async () => {
    assert.match(await (await fetch(`${base}/help`)).text(), /API articles/);
    assert.ok((await (await fetch(`${base}/help.json`)).json()).routes.length > 10);
    assert.equal((await fetch(`${base}/api/inconnu`)).status, 404);
    const res = await fetch(`${base}/api/articles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oups' });
    assert.equal(res.status, 400);
});

test('mode sécurisé : écriture refusée sans jeton', async () => {
    const secureServer = createApp({ secure: true, log: false }).listen(0);
    await new Promise((resolve) => secureServer.once('listening', resolve));
    const url = `http://localhost:${secureServer.address().port}`;
    try {
        const refused = await fetch(`${url}/api/articles`, send('POST', { title: 'Titre', content: 'C', authorId: 1 }));
        assert.equal(refused.status, 401);
        const { token } = await (await fetch(`${url}/api/login`, send('POST', { email: 'ada@exemple.fr', password: 'angular22' }))).json();
        const ok = await fetch(`${url}/api/articles`, send('POST', { title: 'Titre', content: 'C', authorId: 1 }, { Authorization: `Bearer ${token}` }));
        assert.equal(ok.status, 201);
        assert.equal((await fetch(`${url}/api/articles`)).status, 200);
    } finally {
        secureServer.close();
    }
});
