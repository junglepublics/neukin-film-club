/**
 * NeuKin Film Club — storage backend for the HTML app.
 *
 * SETUP
 * 1. Create a new Google Sheet (any name, can stay blank).
 * 2. In it: Extensions > Apps Script. Delete whatever starter code is
 *    there and paste this whole file in its place.
 * 3. Click Deploy > New deployment.
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    (Not "Anyone with Google account" — that would force people to sign
 *    in just to vote, which defeats the point.)
 * 4. Click Deploy. The first time, Google shows an "unverified app"
 *    warning since this is your own personal script, not something
 *    Google has reviewed. Click Advanced, then "Go to (project name),
 *    unsafe", then Allow. This is normal for a personal script and only
 *    happens once.
 * 5. Copy the URL that ends in /exec. Paste it into the BACKEND_URL
 *    constant near the top of neukin-film-club.html.
 *
 * If you edit this file later, editing alone does not update the live
 * URL. Deploy > Manage deployments > edit (pencil icon) > New version
 * > Deploy, or the changes won't take effect.
 *
 * A "data" sheet gets created automatically the first time this runs,
 * you don't need to set up columns yourself.
 */

var SHEET_NAME = 'data';
var LOCK_WAIT_MS = 10000;

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['scope', 'key', 'value', 'updatedAt']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Linear scan is plenty fast for the handful of rows this app needs
// (a few shared keys, plus one row per visitor who has ever voted).
function findRow_(sheet, scope, key) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === scope && data[i][1] === key) return i + 1; // 1-indexed
  }
  return -1;
}

function scopeFor_(shared, visitor) {
  return shared ? 'shared' : ('visitor:' + (visitor || ''));
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch (lockErr) {
    return jsonOut_({ ok: false, error: 'busy, try again' });
  }
  try {
    var key = e.parameter.key;
    var shared = e.parameter.shared === '1';
    var scope = scopeFor_(shared, e.parameter.visitor);
    if (!key) return jsonOut_({ ok: false, error: 'missing key' });

    var sheet = getSheet_();
    var row = findRow_(sheet, scope, key);
    var value = row === -1 ? '' : sheet.getRange(row, 3).getValue();
    return jsonOut_({ ok: true, value: value });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch (lockErr) {
    return jsonOut_({ ok: false, error: 'busy, try again' });
  }
  try {
    var body = JSON.parse(e.postData.contents);
    var key = body.key;
    var value = body.value;
    var shared = body.shared === '1';
    var scope = scopeFor_(shared, body.visitor);
    if (!key) return jsonOut_({ ok: false, error: 'missing key' });

    var sheet = getSheet_();
    var row = findRow_(sheet, scope, key);
    var now = new Date().toISOString();
    if (row === -1) {
      sheet.appendRow([scope, key, value, now]);
    } else {
      sheet.getRange(row, 3, 1, 2).setValues([[value, now]]);
    }
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
