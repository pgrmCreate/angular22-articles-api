// Données de départ. Elles sont recopiées en mémoire au démarrage
// et après POST /api/reset : rien n'est écrit sur le disque.

const authors = [
    { id: 1, name: 'Ada Lovelace', email: 'ada@exemple.fr', bio: 'Pionnière de la programmation, elle écrit sur les algorithmes.' },
    { id: 2, name: 'Alan Turing', email: 'alan@exemple.fr', bio: 'Passionné de calculabilité et de tests automatisés.' },
    { id: 3, name: 'Grace Hopper', email: 'grace@exemple.fr', bio: 'Spécialiste des compilateurs et des bugs (les vrais).' },
    { id: 4, name: 'Margaret Hamilton', email: 'margaret@exemple.fr', bio: 'Ingénieure logicielle, adepte de la gestion des erreurs.' },
    { id: 5, name: 'Linus Torvalds', email: 'linus@exemple.fr', bio: 'Écrit sur Git, les branches et les revues de code.' },
];

const articles = [
    { id: 1, authorId: 1, title: 'Les signaux en Angular 22', tags: ['angular', 'signaux'], content: 'Un signal contient une valeur et prévient ceux qui la lisent quand elle change. computed dérive une valeur, effect réagit à un changement.' },
    { id: 2, authorId: 1, title: 'computed ou effect ?', tags: ['angular', 'signaux'], content: 'computed calcule une valeur à partir d\'autres signaux ; effect déclenche une action. Si vous voulez afficher quelque chose, il vous faut presque toujours un computed.' },
    { id: 3, authorId: 2, title: 'Premiers pas avec Vitest', tags: ['tests', 'vitest'], content: 'Vitest est le lanceur de tests par défaut depuis Angular 21. describe regroupe, it décrit un cas, expect vérifie.' },
    { id: 4, authorId: 2, title: 'Tester un service HTTP', tags: ['tests', 'http'], content: 'HttpTestingController remplace le réseau : on vérifie la requête avec expectOne puis on répond avec flush.' },
    { id: 5, authorId: 3, title: 'Le routeur pas à pas', tags: ['angular', 'routage'], content: 'Routes, paramètres, lazy loading avec loadComponent, resolvers et gardes : le routeur fait bien plus qu\'afficher des pages.' },
    { id: 6, authorId: 3, title: 'Les gardes fonctionnelles', tags: ['angular', 'routage'], content: 'Une garde est une fonction qui renvoie true, false ou une UrlTree. Elle guide l\'utilisateur mais ne remplace pas la sécurité côté serveur.' },
    { id: 7, authorId: 4, title: 'Gérer les erreurs HTTP', tags: ['http', 'erreurs'], content: 'Un status 0 signifie que le serveur est injoignable. Prévoyez toujours un message clair pour l\'utilisateur.' },
    { id: 8, authorId: 4, title: 'Les intercepteurs', tags: ['http', 'securite'], content: 'Un intercepteur voit passer toutes les requêtes. Idéal pour ajouter un jeton Authorization ou afficher un indicateur de chargement.' },
    { id: 9, authorId: 5, title: 'Git en formation', tags: ['outils', 'git'], content: 'Un commit par étape : on peut revenir en arrière et comparer facilement les versions du TP.' },
    { id: 10, authorId: 5, title: 'Revue de code efficace', tags: ['outils'], content: 'Une bonne revue porte sur le comportement et la lisibilité, pas sur les goûts personnels.' },
    { id: 11, authorId: 1, title: 'httpResource en pratique', tags: ['angular', 'http'], content: 'httpResource transforme une requête en signaux : value, isLoading, error. La requête repart quand un signal lu change.' },
    { id: 12, authorId: 3, title: 'Formulaires réactifs ou Signal Forms ?', tags: ['angular', 'formulaires'], content: 'Pour une application existante, gardez Reactive Forms. Pour une nouvelle application en v22, essayez Signal Forms.' },
];

export function seed() {
    const now = new Date('2026-11-19T09:00:00.000Z');
    return {
        authors: authors.map((a) => ({ ...a, createdAt: now.toISOString() })),
        articles: articles.map((a, i) => {
            const date = new Date(now.getTime() - (articles.length - i) * 86_400_000).toISOString();
            return { ...a, tags: [...a.tags], published: true, createdAt: date, updatedAt: date };
        }),
    };
}
