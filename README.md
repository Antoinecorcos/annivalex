# 🎉 L'anniv d'Alex

Site d'invitation festif pour les 17 ans d'Alex (samedi 14 novembre, 19h30, Maisons-Laffitte) : infos de la soirée, compte à rebours, gâteau dont on souffle les bougies **au micro**, musique « Joyeux anniversaire » synthétisée en direct, **RSVP présent / pas présent** avec la liste des invités, et **playlist participative** (recherche Deezer + extraits).

🌐 En ligne (une fois GitHub Pages activé) : <https://antoinecorcos.github.io/annivalex/>

Aucun outil à installer : du HTML, du CSS et du JavaScript, sans bibliothèque.

## Ce qu'il y a dedans

- Le prénom d'Alex est dessiné avec des milliers de particules qui fuient la souris et explosent au clic.
- Un moteur de confettis et de feux d'artifice en Canvas, avec gravité et rotation 3D.
- Un compte à rebours animé. Le jour J, le site lance un feu d'artifice automatique.
- Des cartes en verre dépoli qui s'inclinent en 3D au survol, un bouton « magnétique » et un halo qui suit le curseur.
- Le gâteau : le site analyse le son du micro en temps réel (Web Audio) et éteint les bougies quand on souffle.
- La musique est générée par le navigateur (aucun fichier audio).
- La playlist : recherche en direct dans le catalogue Deezer, écoute des extraits de 30 s, ajout en un clic à la liste partagée des invités.
- Le bouton « Ajouter à mon agenda » télécharge un fichier `.ics`.
- Le site fonctionne sur mobile et respecte le réglage « réduire les animations ».

## 1. Modifier les infos

Tout se trouve dans **`config.js`** : date, lieu, dress code, programme, contact, date limite de réponse, etc. Un champ laissé vide fait disparaître le bloc correspondant (par exemple, `program: []` masque la section Programme).

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

Les réponses arrivent dans l'onglet **Réponses** de la Sheet (date, nom, présent/absent, nombre de personnes, message), et les sons proposés dans l'onglet **Playlist** (avec un lien Deezer par titre). Les messages restent privés : le site n'affiche que les noms des présents et les compteurs. Si quelqu'un renvoie une réponse avec le même nom, sa ligne est mise à jour au lieu d'être dupliquée.

> Si tu modifies `Code.gs` plus tard, fais **Déployer → Gérer les déploiements → Modifier → Nouvelle version** pour garder la même URL.

## 3. La playlist Deezer

Sur le site, les invités cherchent un titre (catalogue Deezer), écoutent l'extrait et l'ajoutent. Les sons s'affichent pour tout le monde et arrivent dans l'onglet **Playlist** de la Google Sheet.

Le site ne peut pas ajouter directement les titres dans une vraie playlist Deezer : il faudrait que chaque invité se connecte à Deezer, et Deezer ne permet plus de créer de nouvelles applications développeur. Deux façons d'y remédier :

- **Avant la soirée**, ouvre l'onglet **Playlist** de la Sheet : chaque ligne a un lien Deezer, et l'ajout à ta playlist se fait en deux clics.
- **Playlist collaborative** : dans l'appli Deezer, crée une playlist, ouvre ses options et active « Playlist collaborative », puis copie son lien de partage dans `config.js` (`deezerPlaylistUrl`). Un bouton « Ouvrir la playlist sur Deezer » apparaît sur le site, et les invités qui ont Deezer peuvent y ajouter des titres eux-mêmes.

## 4. Mettre le site en ligne (GitHub Pages)

Le dépôt est public, donc GitHub Pages est gratuit. À faire une seule fois :

1. Sur GitHub, va dans **Settings → Pages**.
2. Dans *Build and deployment*, choisis **Source : Deploy from a branch**.
3. Choisis la branche **`claude/busy-ride-1sjq8n`** et le dossier **`/ (root)`**, puis clique sur **Save**.
4. Une à deux minutes plus tard, le site est en ligne sur <https://antoinecorcos.github.io/annivalex/>.

Chaque nouveau push sur cette branche met le site à jour automatiquement.

Attention : `config.js` est public. N'y mets pas d'informations sensibles, comme un digicode, si le lien risque de circuler.

## Tester en local

```bash
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

Le micro ne fonctionne qu'en HTTPS ou sur `localhost`.
