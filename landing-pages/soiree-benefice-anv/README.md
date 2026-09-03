# Landing page « Soirée Bénéfice — Action Nouvelle Vie Québec » pour Squarespace

Version adaptée de la maquette pour être collée dans un **bloc de code** Squarespace
(forfait Essentiel / Core ou supérieur — le JavaScript est requis pour le formulaire de don Raisely).

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `squarespace-bloc-code.html` | Le code complet à coller dans un bloc de code (83 Ko) |
| `assets/hero-soiree.jpg` | L'image héro optimisée (181 Ko, à téléverser dans Squarespace) |
| `assets/logo-anv.png` | Le logo extrait de la maquette (pour référence — il est déjà intégré au code) |

## Différences avec la maquette originale

- **CSS scopé** : tous les styles sont préfixés par `#anv-lp` pour ne pas entrer en
  conflit avec les styles du site Squarespace (et inversement).
- **Image héro externalisée** : elle était intégrée en base64 (1,9 Mo, trop lourd pour
  un bloc de code). Elle est maintenant un JPEG optimisé de 181 Ko à héberger sur
  Squarespace ; le code pointe maintenant directement vers le fichier `herosoiree.jpg` hébergé sur Squarespace.
- **Pleine largeur** : la page « sort » des marges de la zone de contenu Squarespace
  pour occuper toute la largeur de l'écran.
- Le logo (2 occurrences) reste intégré en base64 : aucun fichier à gérer pour lui.

## Installation, étape par étape

### 1. Téléverser l'image héro

1. Dans Squarespace : **Site web → Styles du site → CSS personnalisé** (ou
   **Design → CSS personnalisé** selon la version de l'interface).
2. Cliquer **Gérer les fichiers personnalisés** → **Ajouter des images ou des polices**
   → téléverser `assets/hero-soiree.jpg`.
3. Cliquer sur le fichier téléversé : son URL s'insère dans la zone de CSS
   (elle ressemble à `https://static1.squarespace.com/.../hero-soiree.jpg`).
   **Copier cette URL**, puis effacer la ligne insérée dans le CSS avant de quitter.

### 2. Préparer le code

1. Ouvrir `squarespace-bloc-code.html` dans un éditeur de texte (Notepad, TextEdit…).
2. Rechercher `HERO_IMAGE_URL` (1 seule occurrence) et le remplacer par l'URL copiée.
3. Sélectionner tout le contenu du fichier et le copier.

### 3. Créer la page

1. **Pages → +** → choisir **Page vierge** (mise en page vide).
2. Ajouter un **bloc Code** (mode HTML, ne pas cocher « Afficher la source »).
3. Coller tout le code, enregistrer.
4. Dans les réglages de la section, choisir la plus petite hauteur et une largeur
   pleine page si l'option existe, pour réduire les marges autour du bloc.

### 4. Vérifier

- **L'aperçu de l'éditeur ne rend pas fidèlement les blocs de code** (le JavaScript
  y est désactivé). Toujours vérifier sur la page publiée ou en navigation privée.
- Tester : navigation ancrée (La soirée / Notre impact / Faire un don), bouton
  « Réserver » (ouvre Raisely), bouton « Faire un don » (déplie le formulaire
  Raisely intégré), affichage mobile.

## Optionnel : masquer l'en-tête et le pied de page Squarespace

Pour que la landing page occupe tout l'écran sans la navigation du site :

1. Ouvrir la page publiée, afficher son code source et repérer
   `<body id="collection-XXXXXXXX"` — noter cet identifiant.
2. Dans **CSS personnalisé**, ajouter (en remplaçant `XXXXXXXX`) :

```css
body#collection-XXXXXXXX #header,
body#collection-XXXXXXXX footer.sections,
body#collection-XXXXXXXX .sqs-announcement-bar-dropzone { display: none; }
body#collection-XXXXXXXX #page .page-section {
  padding: 0 !important;
  min-height: 0 !important;
}
```

(Sélecteurs pour Squarespace 7.1 ; à ajuster si le modèle utilise d'autres classes.)

## Notes techniques

- Polices **Bebas Neue** et **Alex Brush** chargées via Google Fonts (`@import`).
- Le formulaire de don charge `https://cdn.raisely.com/v3/public/embed.js` à la demande,
  avec un repli vers la page de campagne Raisely si le chargement échoue.
- La page de la maquette portait `noindex, nofollow` ; une page Squarespace est
  indexée par défaut. Pour la masquer des moteurs : réglages de la page → SEO →
  masquer dans les résultats de recherche.
