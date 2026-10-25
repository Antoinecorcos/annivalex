/* =========================================================
   ✏️  TOUTES LES INFOS DE LA FÊTE SE MODIFIENT ICI
   Un champ laissé vide ("" ou []) fait disparaître le bloc correspondant.
   ========================================================= */
window.PARTY = {
  name: "Alex",
  age: 17,

  // Date et heure de début (format ISO, avec le fuseau horaire)
  date: "2026-11-14T19:30:00+01:00",

  tagline: "17 ans, ça se fête comme il se doit.",

  venue: {
    name: "Maisons-Laffitte",
    address: "16 avenue Jean-Jacques Rousseau, 78600 Maisons-Laffitte",
    access: "", // ex : "Digicode 1234 · sonner chez …"
  },

  dressCode: "Plutôt chic 👔✨",
  theme: "Pas de thème : viens comme tu es… mais en mieux.",

  // Laisser vide pour masquer la section Programme
  program: [],

  infos: [
    { icon: "🍬", title: "Gourmandises", text: "Si tu peux, ramène quelques petites gourmandises (sucrées ou salées) à partager !" },
    { icon: "🎵", title: "Playlist", text: "Ajoute tes sons à la playlist de la soirée, plus bas sur cette page." },
    { icon: "🎂", title: "Le gâteau", text: "Entraîne-toi à souffler les bougies : c'est un peu plus bas !" },
  ],

  contact: { name: "", phone: "" }, // ex : { name: "David", phone: "06 12 34 56 78" }

  rsvpDeadline: "", // ex : "7 novembre"

  // Nombre max de personnes par réponse (1 = pas d'accompagnant)
  maxGuestsPerReply: 1,

  // Lien d'une playlist Deezer collaborative (facultatif, voir README.md)
  deezerPlaylistUrl: "",

  // URL de l'application web Google Apps Script (voir README.md).
  // Laisser vide = mode démo : les réponses restent dans le navigateur.
  rsvpEndpoint: "",
};
