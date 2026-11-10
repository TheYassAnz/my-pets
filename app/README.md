# my-pets : PWA

Carnet de santé pour animaux, servi comme PWA (Expo Router + react-native-web + NativeWind). L'API NestJS (`../api`) sert le build web sur la même origine.

## Développement

```bash
npm install
npm run web      # serveur de dev web (http://localhost:8081)
npm test         # jest
npm run lint
npx tsc --noEmit
```

## Déploiement web

```bash
npm run deploy:web
```

Exporte la PWA avec `EXPO_PUBLIC_API_URL=/api` (`npx expo export -p web`), puis remplace le contenu de `../api/client/` par le build (en conservant `.gitkeep`). Le dossier `client/` se committe dans le dépôt `api/`.

## Variables d'environnement

- `EXPO_PUBLIC_API_URL` : URL de l'API. `/api` en production (même origine), `http://localhost:3000/api` en développement. Doit être défini à l'export.
- `EXPO_PUBLIC_VAPID_PUBLIC_KEY` : clé publique VAPID (publique par nature, intégrée au bundle) pour l'abonnement Web Push ; la clé privée reste côté API.
