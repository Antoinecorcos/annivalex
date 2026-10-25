/**
 * Backend RSVP — Google Apps Script lié à une Google Sheet.
 * Installation : voir README.md à la racine du projet.
 *
 * GET  → { ok, guests: [{ name, status, guests }], songs: [{ id, title, artist, cover, by }] }
 *        (les messages restent privés)
 * POST → { type: "rsvp", name, status: "present"|"absent", guests, message }
 *        Une même personne (même nom) qui renvoie sa réponse met à jour sa ligne.
 * POST → { type: "song", id, title, artist, cover, by }   (titre Deezer, sans doublon)
 */
const SHEET_NAME = 'Réponses';
const HEADERS = ['Date', 'Nom', 'Réponse', 'Personnes', 'Message', 'Clé'];
const SONGS_SHEET = 'Playlist';
const SONG_HEADERS = ['Date', 'Titre', 'Artiste', 'Ajouté par', 'Lien Deezer', 'Pochette', 'ID'];
const MAX_SONGS = 300;
const MAX_GUESTS = 5;

function doGet() {
  return json_({ ok: true, guests: list_(), songs: songs_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.type === 'song') addSong_(d);
    else saveRsvp_(d);
    return json_({ ok: true, guests: list_(), songs: songs_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function saveRsvp_(d) {
  const name = String(d.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (name.length < 2) throw new Error('Nom manquant');
  const present = d.status === 'present';
  const guests = present ? Math.min(MAX_GUESTS, Math.max(1, parseInt(d.guests, 10) || 1)) : 0;
  const message = String(d.message || '').slice(0, 400);
  const key = key_(name);

  const sh = sheet_(SHEET_NAME, HEADERS);
  const row = [new Date(), safe_(name), present ? 'Présent' : 'Absent', guests, safe_(message), key];
  const keys = sh.getLastRow() > 1 ? sh.getRange(2, 6, sh.getLastRow() - 1, 1).getValues().flat() : [];
  const idx = keys.indexOf(key);
  if (idx >= 0) {
    // On garde l'ancien message si la nouvelle réponse n'en contient pas
    if (!message) row[4] = sh.getRange(idx + 2, 5).getValue();
    sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
}

function addSong_(d) {
  const id = String(d.id || '');
  if (!/^\d{1,15}$/.test(id)) throw new Error('Titre invalide');
  const title = String(d.title || '').slice(0, 120);
  const artist = String(d.artist || '').slice(0, 120);
  if (!title) throw new Error('Titre manquant');
  const cover = /^https:\/\/[\w.-]*(dzcdn\.net|deezer\.com)\//.test(d.cover || '') ? d.cover : '';
  const by = String(d.by || '').trim().slice(0, 40);

  const sh = sheet_(SONGS_SHEET, SONG_HEADERS);
  const n = sh.getLastRow() - 1;
  const ids = n > 0 ? sh.getRange(2, 7, n, 1).getValues().flat().map(String) : [];
  if (ids.indexOf(id) >= 0) return; // déjà dans la playlist
  if (ids.length >= MAX_SONGS) throw new Error('Playlist pleine');
  sh.appendRow([new Date(), safe_(title), safe_(artist), safe_(by), 'https://www.deezer.com/track/' + id, cover, id]);
}

function songs_() {
  const sh = sheet_(SONGS_SHEET, SONG_HEADERS);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues()
    .filter(r => r[6])
    .map(r => ({ id: String(r[6]), title: String(r[1]), artist: String(r[2]), by: String(r[3]), cover: String(r[5]) }));
}

function list_() {
  const sh = sheet_(SHEET_NAME, HEADERS);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(r => r[1])
    .map(r => ({ name: String(r[1]), status: r[2] === 'Présent' ? 'present' : 'absent', guests: Number(r[3]) || 0 }));
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

function key_(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Empêche qu'un texte commençant par = + - @ soit interprété comme une formule
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
