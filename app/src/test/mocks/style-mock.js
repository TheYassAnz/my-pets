// Jest ne passe jamais par Metro (voir metro.config.js -> withNativeWind), donc les imports
// de fichiers .css (ex: `import '@/global.css'` dans constants/theme.ts) n'ont aucun
// transform disponible en test et font planter le parseur avec une SyntaxError.
// On les mappe vers ce module vide : seul l'effet de bord d'import compte en environnement JS.
module.exports = {};
