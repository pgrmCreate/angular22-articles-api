// Description des ressources : sert à /help (HTML) et /help.json.

export const resources = {
    article: {
        description: 'Un article écrit par un auteur.',
        fields: {
            id: 'number – attribué par le serveur',
            title: 'string – obligatoire, 3 à 120 caractères',
            content: 'string – obligatoire',
            authorId: 'number – obligatoire, doit exister dans /api/authors',
            tags: 'string[] – facultatif, [] par défaut',
            published: 'boolean – facultatif, true par défaut',
            createdAt: 'string (date ISO) – attribué par le serveur',
            updatedAt: 'string (date ISO) – mis à jour à chaque modification',
        },
        example: { id: 1, authorId: 1, title: 'Les signaux en Angular 22', content: 'Un signal contient une valeur…', tags: ['angular', 'signaux'], published: true, createdAt: '2026-11-07T09:00:00.000Z', updatedAt: '2026-11-07T09:00:00.000Z' },
    },
    author: {
        description: 'Une personne qui écrit des articles.',
        fields: {
            id: 'number – attribué par le serveur',
            name: 'string – obligatoire, 2 caractères minimum',
            email: 'string – obligatoire, e-mail valide',
            bio: 'string – facultatif',
            createdAt: 'string (date ISO) – attribué par le serveur',
        },
        example: { id: 1, name: 'Ada Lovelace', email: 'ada@exemple.fr', bio: 'Pionnière de la programmation…', createdAt: '2026-11-19T09:00:00.000Z' },
    },
};

export const routes = [
    { group: 'Articles', method: 'GET', path: '/api/articles', description: 'Liste des articles (du plus récent au plus ancien).', query: { q: 'texte cherché dans le titre et le contenu', authorId: 'articles d\'un auteur', tag: 'articles portant ce tag', _expand: '« author » : ajoute l\'objet author à chaque article', _page: 'numéro de page (à partir de 1)', _limit: 'taille de page (10 par défaut si _page est donné)' }, response: '200 – Article[] ; en-tête X-Total-Count = nombre total avant pagination' },
    { group: 'Articles', method: 'GET', path: '/api/articles/:id', description: 'Un article.', query: { _expand: '« author »' }, response: '200 – Article · 404 si introuvable' },
    { group: 'Articles', method: 'POST', path: '/api/articles', description: 'Créer un article.', body: '{ title, content, authorId, tags?, published? }', response: '201 – Article créé (en-tête Location) · 400 si invalide' },
    { group: 'Articles', method: 'PUT', path: '/api/articles/:id', description: 'Remplacer un article (tous les champs obligatoires).', body: '{ title, content, authorId, tags?, published? }', response: '200 – Article · 400 · 404' },
    { group: 'Articles', method: 'PATCH', path: '/api/articles/:id', description: 'Modifier seulement certains champs.', body: '{ title? , content?, authorId?, tags?, published? }', response: '200 – Article · 400 · 404' },
    { group: 'Articles', method: 'DELETE', path: '/api/articles/:id', description: 'Supprimer un article.', response: '204 – sans contenu · 404' },
    { group: 'Auteurs', method: 'GET', path: '/api/authors', description: 'Liste des auteurs.', query: { q: 'texte cherché dans le nom' }, response: '200 – Author[]' },
    { group: 'Auteurs', method: 'GET', path: '/api/authors/:id', description: 'Un auteur.', response: '200 – Author · 404' },
    { group: 'Auteurs', method: 'GET', path: '/api/authors/:id/articles', description: 'Les articles d\'un auteur.', response: '200 – Article[] · 404' },
    { group: 'Auteurs', method: 'POST', path: '/api/authors', description: 'Créer un auteur.', body: '{ name, email, bio? }', response: '201 – Author · 400' },
    { group: 'Auteurs', method: 'PUT', path: '/api/authors/:id', description: 'Remplacer un auteur.', body: '{ name, email, bio? }', response: '200 – Author · 400 · 404' },
    { group: 'Auteurs', method: 'PATCH', path: '/api/authors/:id', description: 'Modifier certains champs.', body: '{ name?, email?, bio? }', response: '200 – Author · 400 · 404' },
    { group: 'Auteurs', method: 'DELETE', path: '/api/authors/:id', description: 'Supprimer un auteur sans article.', response: '204 · 404 · 409 si l\'auteur a encore des articles' },
    { group: 'Connexion', method: 'POST', path: '/api/login', description: 'Obtenir un jeton de démonstration (mot de passe : angular22).', body: '{ email, password }  (email d\'un auteur)', response: '200 – { token, user } · 401' },
    { group: 'Connexion', method: 'GET', path: '/api/me', description: 'L\'auteur connecté. Exige l\'en-tête Authorization: Bearer <token>.', response: '200 – Author · 401' },
    { group: 'Outils', method: 'POST', path: '/api/reset', description: 'Remettre les données de départ.', response: '200 – { articles, authors } (nombres)' },
    { group: 'Outils', method: 'GET', path: '/help', description: 'Cette page. /help.json pour la version JSON.', response: '200 – HTML' },
];

export const tools = [
    ['?_delay=2000', 'ajoute 2 s de délai à n\'importe quelle requête (pour voir un indicateur de chargement).'],
    ['?_fail=500', 'renvoie l\'erreur demandée (400 à 599) au lieu de la vraie réponse.'],
    ['npm run start:secure', 'mode sécurisé : POST, PUT, PATCH et DELETE exigent Authorization: Bearer <token> (sinon 401). Pour tester un intercepteur.'],
    ['Données', 'en mémoire : un redémarrage ou POST /api/reset remet les données de départ.'],
    ['CORS', 'ouvert à toutes les origines (http://localhost:4200 compris).'],
];
