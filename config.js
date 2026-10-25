/* =========================================================
   ✏️  TOUTES LES INFOS DE LA FÊTE SE MODIFIENT ICI
   ========================================================= */
window.PARTY = {
  name: "Alex",
  age: 30,

  // Date et heure de début (format ISO, avec le fuseau horaire)
  date: "2026-12-12T20:00:00+01:00",

  tagline: "Une soirée légendaire pour un frère légendaire.",

  venue: {
    name: "Le Rooftop",
    address: "12 rue de la Fête, 75011 Paris",
    access: "Métro Oberkampf (ligne 5/9) · Digicode : 2026A · 5e étage",
  },

  dressCode: "Paillettes & couleurs vives ✨",

  program: [
    { time: "20:00", title: "Apéro & accueil", desc: "Cocktails, bulles et retrouvailles." },
    { time: "21:00", title: "Dîner", desc: "Buffet géant, il y en aura pour tout le monde." },
    { time: "22:30", title: "Gâteau & surprise", desc: "Chut… on compte sur vous pour garder le secret." },
    { time: "23:00", title: "Dancefloor", desc: "DJ set jusqu'au bout de la nuit." },
  ],

  infos: [
    { icon: "🎁", title: "Cadeau", text: "Cagnotte commune, le lien arrive par message." },
    { icon: "🤫", title: "Surprise", text: "Alex ne doit rien savoir. Zéro story avant 22h30 !" },
    { icon: "🚗", title: "Retour", text: "Covoiturages organisés, dites-le dans votre message." },
  ],

  contact: { name: "David", phone: "06 00 00 00 00" },

  rsvpDeadline: "1er décembre",

  // URL de l'application web Google Apps Script (voir README.md).
  // Laisser vide = mode démo : les réponses restent dans le navigateur.
  rsvpEndpoint: "",
};
