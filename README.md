# API articles – formation Angular 22

Petite API REST (Node.js + Express) qui sert des **articles** et des **auteurs** à l'application Angular *Article Reader*. Les données sont en mémoire : rien à installer à part Node.js.

## Démarrer

```bash
npm install
npm start          # http://localhost:3000
```

- Documentation complète : **http://localhost:3000/help** (version JSON : `/help.json`)
- Exemple : http://localhost:3000/api/articles
- `npm run dev` : redémarre à chaque modification du code
- `npm run start:secure` : les écritures exigent `Authorization: Bearer <token>` (pour tester un intercepteur)
- `npm test` : tests de l'API (node:test)
- Autre port : `PORT=3001 npm start` (PowerShell : `$env:PORT=3001; npm start`)

## Ressources

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/articles` | liste (`?q=`, `?authorId=`, `?tag=`, `?_expand=author`, `?_page=&_limit=`) |
| GET | `/api/articles/:id` | un article (`?_expand=author`) |
| POST | `/api/articles` | créer `{ title, content, authorId, tags?, published? }` |
| PUT | `/api/articles/:id` | remplacer |
| PATCH | `/api/articles/:id` | modifier certains champs |
| DELETE | `/api/articles/:id` | supprimer |
| GET | `/api/authors`, `/api/authors/:id`, `/api/authors/:id/articles` | auteurs |
| POST, PUT, PATCH, DELETE | `/api/authors…` | gérer les auteurs (409 si l'auteur a des articles) |
| POST | `/api/login` | `{ email, password: "angular22" }` → `{ token, user }` |
| GET | `/api/me` | auteur connecté (en-tête `Authorization: Bearer <token>`) |
| POST | `/api/reset` | remettre les données de départ |

## Pour les démos

- `?_delay=2000` sur n'importe quelle requête : 2 s d'attente (indicateur de chargement).
- `?_fail=500` : renvoie l'erreur demandée (gestion des erreurs).
- La liste renvoie l'en-tête `X-Total-Count` (pagination) ; CORS est ouvert.

## Côté Angular

```ts
// app.config.ts
provideHttpClient(),

// articles-api.ts
@Service()
export class ArticlesApi {
    private readonly http = inject(HttpClient);
    private readonly url = 'http://localhost:3000/api/articles';

    list() { return this.http.get<Article[]>(this.url); }
    get(id: number) { return this.http.get<Article>(`${this.url}/${id}`); }
    create(article: NewArticle) { return this.http.post<Article>(this.url, article); }
    update(id: number, changes: Partial<NewArticle>) { return this.http.patch<Article>(`${this.url}/${id}`, changes); }
    remove(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
```
