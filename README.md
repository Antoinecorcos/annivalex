# 🎉 L'anniv d'Alex

Site d'invitation festif : infos de la soirée, programme, compte à rebours, gâteau dont on souffle les bougies **au micro**, musique « Joyeux anniversaire » synthétisée en direct, et **RSVP présent / pas présent** avec la liste des invités qui viennent.

Aucun outil à installer : du HTML, du CSS et du JavaScript, sans bibliothèque.

## Ce qu'il y a dedans

- Le prénom d'Alex est dessiné avec des milliers de particules qui fuient la souris et explosent au clic.
- Un moteur de confettis et de feux d'artifice en Canvas, avec gravité et rotation 3D.
- Un compte à rebours animé. Le jour J, le site lance un feu d'artifice automatique.
- Des cartes en verre dépoli qui s'inclinent en 3D au survol, un bouton « magnétique » et un halo qui suit le curseur.
- Le gâteau : le site analyse le son du micro en temps réel (Web Audio) et éteint les bougies quand on souffle.
- La musique est générée par le navigateur (aucun fichier audio).
- Le bouton « Ajouter à mon agenda » télécharge un fichier `.ics`.
- Le site fonctionne sur mobile et respecte le réglage « réduire les animations ».

## 1. Modifier les infos

Tout se trouve dans **`config.js`** : date, lieu, dress code, programme, contact, etc.

## 2. Enregistrer les réponses (Google Sheets, gratuit)

Sans configuration, le site est en **mode démo** : les réponses restent dans le navigateur de chaque personne. Pour que tout le monde voie la même liste :

1. Crée une nouvelle **Google Sheet** (par exemple « Anniv Alex – RSVP »).
2. Menu **Extensions → Apps Script**. Efface le code présent et colle le contenu de `apps-script/Code.gs`. Enregistre.
3. **Déployer → Nouveau déploiement**, choisis le type **Application Web** :
   - *Exécuter en tant que* : **Moi**
   - *Qui a accès* : **Tout le monde**
4. Autorise l'accès demandé par Google. Sur l'écran « application non validée », clique sur *Paramètres avancés → Accéder au projet*.
5. Copie l'URL obtenue (`https://script.google.com/macros/s/.../exec`) et colle-la dans `config.js` :
   ```js
   rsvpEndpoint: "https://script.google.com/macros/s/XXXX/exec",
   ```

Les réponses arrivent dans l'onglet **Réponses** de la Sheet (date, nom, présent/absent, nombre de personnes, message). Les messages restent privés : le site n'affiche que les noms des présents et les compteurs. Si quelqu'un renvoie une réponse avec le même nom, sa ligne est mise à jour au lieu d'être dupliquée.

> Si tu modifies `Code.gs` plus tard, fais **Déployer → Gérer les déploiements → Modifier → Nouvelle version** pour garder la même URL.

## 3. Mettre le site en ligne

Au choix :

- **Netlify Drop** (le plus simple) : glisse le dossier du projet sur <https://app.netlify.com/drop>. Tu obtiens un lien immédiatement.
- **GitHub Pages** : *Settings → Pages → Deploy from a branch*, choisis la branche et `/ (root)`. Sur un dépôt privé, il faut un compte GitHub payant.
- **Vercel** : importe le dépôt, sans aucune configuration.

## Tester en local

```bash
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

Le micro ne fonctionne qu'en HTTPS ou sur `localhost`.
