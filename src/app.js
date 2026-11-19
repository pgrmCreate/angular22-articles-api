import cors from 'cors';
import express from 'express';
import { seed } from './data.js';
import { renderHelp } from './help-page.js';
import { resources, routes, tools } from './help.js';

const PASSWORD = 'angular22';

export function createApp({ secure = false, log = true } = {}) {
    let db = seed();
    const tokens = new Map(); // jeton -> id de l'auteur

    const app = express();
    app.use(cors({ exposedHeaders: ['X-Total-Count', 'Location'] }));
    app.use(express.json());

    // Journal : méthode, URL, statut, durée, présence d'un jeton
    if (log) {
        app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const auth = req.headers.authorization ? ' [Authorization]' : '';
                console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms${auth}`);
            });
            next();
        });
    }

    // Outils de démonstration : ?_delay=ms et ?_fail=status
    app.use(async (req, res, next) => {
        const delay = Number(req.query._delay);
        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 10_000)));
        }
        const fail = Number(req.query._fail);
        if (fail >= 400 && fail <= 599) {
            return res.status(fail).json({ error: `Erreur ${fail} simulée (paramètre _fail)` });
        }
        next();
    });

    const userFromToken = (req) => {
        const [type, token] = (req.headers.authorization ?? '').split(' ');
        return type === 'Bearer' ? tokens.get(token) : undefined;
    };

    // Mode sécurisé : les écritures exigent un jeton
    if (secure) {
        app.use('/api', (req, res, next) => {
            const write = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
            const open = req.path === '/login' || req.path === '/reset';
            if (write && !open && !userFromToken(req)) {
                return res.status(401).json({ error: 'Jeton manquant ou invalide (en-tête Authorization: Bearer <token>)' });
            }
            next();
        });
    }

    // ---------- utilitaires
    const nextId = (list) => Math.max(0, ...list.map((x) => x.id)) + 1;
    const findArticle = (id) => db.articles.find((a) => a.id === Number(id));
    const findAuthor = (id) => db.authors.find((a) => a.id === Number(id));
    const expand = (article, req) =>
        req.query._expand === 'author' ? { ...article, author: findAuthor(article.authorId) ?? null } : article;
    const notFound = (res, what, id) => res.status(404).json({ error: `${what} ${id} introuvable` });
    const invalid = (res, details) => res.status(400).json({ error: 'Données invalides', details });

    function validateArticle(body, partial) {
        const details = {};
        const has = (k) => body[k] !== undefined;
        if (!partial || has('title')) {
            if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.length > 120) {
                details.title = 'obligatoire, 3 à 120 caractères';
            }
        }
        if (!partial || has('content')) {
            if (typeof body.content !== 'string' || !body.content.trim()) details.content = 'obligatoire';
        }
        if (!partial || has('authorId')) {
            if (!findAuthor(body.authorId)) details.authorId = 'obligatoire, doit correspondre à un auteur existant';
        }
        if (has('tags') && (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== 'string'))) {
            details.tags = 'tableau de chaînes';
        }
        if (has('published') && typeof body.published !== 'boolean') details.published = 'booléen';
        return details;
    }

    function validateAuthor(body, partial) {
        const details = {};
        const has = (k) => body[k] !== undefined;
        if (!partial || has('name')) {
            if (typeof body.name !== 'string' || body.name.trim().length < 2) details.name = 'obligatoire, 2 caractères minimum';
        }
        if (!partial || has('email')) {
            if (typeof body.email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) details.email = 'obligatoire, e-mail valide';
        }
        if (has('bio') && typeof body.bio !== 'string') details.bio = 'chaîne';
        return details;
    }

    const pickArticle = (b) => ({
        title: b.title?.trim(), content: b.content, authorId: Number(b.authorId),
        tags: b.tags ?? [], published: b.published ?? true,
    });

    // ---------- aide
    app.get('/', (req, res) => res.redirect('/help'));
    app.get('/help', (req, res) => res.type('html').send(renderHelp()));
    app.get('/help.json', (req, res) => res.json({ resources, routes, tools }));

    // ---------- articles
    app.get('/api/articles', (req, res) => {
        let list = [...db.articles].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const { q, authorId, tag } = req.query;
        if (q) {
            const t = String(q).toLowerCase();
            list = list.filter((a) => a.title.toLowerCase().includes(t) || a.content.toLowerCase().includes(t));
        }
        if (authorId) list = list.filter((a) => a.authorId === Number(authorId));
        if (tag) list = list.filter((a) => a.tags.includes(String(tag)));
        res.set('X-Total-Count', String(list.length));
        if (req.query._page) {
            const page = Math.max(1, Number(req.query._page) || 1);
            const limit = Math.max(1, Number(req.query._limit) || 10);
            list = list.slice((page - 1) * limit, page * limit);
        }
        res.json(list.map((a) => expand(a, req)));
    });

    app.get('/api/articles/:id', (req, res) => {
        const article = findArticle(req.params.id);
        if (!article) return notFound(res, 'Article', req.params.id);
        res.json(expand(article, req));
    });

    app.post('/api/articles', (req, res) => {
        const body = req.body ?? {};
        const details = validateArticle(body, false);
        if (Object.keys(details).length) return invalid(res, details);
        const now = new Date().toISOString();
        const article = { id: nextId(db.articles), ...pickArticle(body), createdAt: now, updatedAt: now };
        db.articles.push(article);
        res.status(201).location(`/api/articles/${article.id}`).json(article);
    });

    app.put('/api/articles/:id', (req, res) => {
        const article = findArticle(req.params.id);
        if (!article) return notFound(res, 'Article', req.params.id);
        const body = req.body ?? {};
        const details = validateArticle(body, false);
        if (Object.keys(details).length) return invalid(res, details);
        Object.assign(article, pickArticle(body), { updatedAt: new Date().toISOString() });
        res.json(article);
    });

    app.patch('/api/articles/:id', (req, res) => {
        const article = findArticle(req.params.id);
        if (!article) return notFound(res, 'Article', req.params.id);
        const body = req.body ?? {};
        const details = validateArticle(body, true);
        if (Object.keys(details).length) return invalid(res, details);
        for (const k of ['title', 'content', 'authorId', 'tags', 'published']) {
            if (body[k] !== undefined) article[k] = k === 'authorId' ? Number(body[k]) : k === 'title' ? body[k].trim() : body[k];
        }
        article.updatedAt = new Date().toISOString();
        res.json(article);
    });

    app.delete('/api/articles/:id', (req, res) => {
        const article = findArticle(req.params.id);
        if (!article) return notFound(res, 'Article', req.params.id);
        db.articles = db.articles.filter((a) => a !== article);
        res.status(204).end();
    });

    // ---------- auteurs
    app.get('/api/authors', (req, res) => {
        let list = db.authors;
        if (req.query.q) {
            const t = String(req.query.q).toLowerCase();
            list = list.filter((a) => a.name.toLowerCase().includes(t));
        }
        res.json(list);
    });

    app.get('/api/authors/:id', (req, res) => {
        const author = findAuthor(req.params.id);
        if (!author) return notFound(res, 'Auteur', req.params.id);
        res.json(author);
    });

    app.get('/api/authors/:id/articles', (req, res) => {
        const author = findAuthor(req.params.id);
        if (!author) return notFound(res, 'Auteur', req.params.id);
        res.json(db.articles.filter((a) => a.authorId === author.id));
    });

    app.post('/api/authors', (req, res) => {
        const body = req.body ?? {};
        const details = validateAuthor(body, false);
        if (Object.keys(details).length) return invalid(res, details);
        const author = { id: nextId(db.authors), name: body.name.trim(), email: body.email, bio: body.bio ?? '', createdAt: new Date().toISOString() };
        db.authors.push(author);
        res.status(201).location(`/api/authors/${author.id}`).json(author);
    });

    app.put('/api/authors/:id', (req, res) => {
        const author = findAuthor(req.params.id);
        if (!author) return notFound(res, 'Auteur', req.params.id);
        const body = req.body ?? {};
        const details = validateAuthor(body, false);
        if (Object.keys(details).length) return invalid(res, details);
        Object.assign(author, { name: body.name.trim(), email: body.email, bio: body.bio ?? '' });
        res.json(author);
    });

    app.patch('/api/authors/:id', (req, res) => {
        const author = findAuthor(req.params.id);
        if (!author) return notFound(res, 'Auteur', req.params.id);
        const body = req.body ?? {};
        const details = validateAuthor(body, true);
        if (Object.keys(details).length) return invalid(res, details);
        for (const k of ['name', 'email', 'bio']) if (body[k] !== undefined) author[k] = body[k];
        res.json(author);
    });

    app.delete('/api/authors/:id', (req, res) => {
        const author = findAuthor(req.params.id);
        if (!author) return notFound(res, 'Auteur', req.params.id);
        const count = db.articles.filter((a) => a.authorId === author.id).length;
        if (count) return res.status(409).json({ error: `L'auteur a encore ${count} article(s) : supprimez-les d'abord` });
        db.authors = db.authors.filter((a) => a !== author);
        res.status(204).end();
    });

    // ---------- connexion
    app.post('/api/login', (req, res) => {
        const { email, password } = req.body ?? {};
        const author = db.authors.find((a) => a.email === email);
        if (!author || password !== PASSWORD) {
            return res.status(401).json({ error: 'E-mail ou mot de passe incorrect (mot de passe de démo : angular22)' });
        }
        const token = `demo-${author.id}-${Math.random().toString(36).slice(2, 10)}`;
        tokens.set(token, author.id);
        res.json({ token, user: author });
    });

    app.get('/api/me', (req, res) => {
        const id = userFromToken(req);
        if (!id) return res.status(401).json({ error: 'Jeton manquant ou invalide' });
        res.json(findAuthor(id));
    });

    // ---------- outils
    app.post('/api/reset', (req, res) => {
        db = seed();
        tokens.clear();
        res.json({ articles: db.articles.length, authors: db.authors.length });
    });

    // ---------- erreurs
    app.use((req, res) => res.status(404).json({ error: `Route inconnue : ${req.method} ${req.path}. Voir /help` }));
    app.use((err, req, res, next) => {
        if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide dans le corps de la requête' });
        console.error(err);
        res.status(500).json({ error: 'Erreur interne' });
    });

    return app;
}
