import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const secure = process.argv.includes('--secure');

createApp({ secure }).listen(port, () => {
    console.log(`API articles prête : http://localhost:${port}`);
    console.log(`Documentation       : http://localhost:${port}/help`);
    console.log(`Exemple             : http://localhost:${port}/api/articles`);
    if (secure) console.log('Mode sécurisé : les écritures exigent Authorization: Bearer <token>');
});
