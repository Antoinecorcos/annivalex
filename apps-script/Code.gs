/**
 * Backend RSVP — Google Apps Script lié à une Google Sheet.
 * Installation : voir README.md à la racine du projet.
 *
 * GET  → { ok, guests: [{ name, status, guests }] }   (les messages restent privés)
 * POST → body JSON { name, status: "present"|"absent", guests, message }
 *        Une même personne (même nom) qui renvoie sa réponse met à jour sa ligne.
 */
const SHEET_NAME = 'Réponses';
const HEADERS = ['Date', 'Nom', 'Réponse', 'Personnes', 'Message', 'Clé'];

function doGet() {
  return json_({ ok: true, guests: list_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const name = String(d.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    if (name.length < 2) throw new Error('Nom manquant');
    const present = d.status === 'present';
    const guests = present ? Math.min(5, Math.max(1, parseInt(d.guests, 10) || 1)) : 0;
    const message = String(d.message || '').slice(0, 400);
    const key = key_(name);

    const sh = sheet_();
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
    return json_({ ok: true, guests: list_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function list_() {
  const sh = sheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(r => r[1])
    .map(r => ({ name: String(r[1]), status: r[2] === 'Présent' ? 'present' : 'absent', guests: Number(r[3]) || 0 }));
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function key_(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Empêche qu'un texte commençant par = + - @ soit interprété comme une formule
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
