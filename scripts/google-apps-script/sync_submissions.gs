/**
 * Brainmoto submissions sync to Google Sheets.
 *
 * Setup once in Apps Script:
 * 1) Open Extensions > Apps Script from your sheet.
 * 2) Paste this file.
 * 3) Set Script Properties:
 *    - BRAINMOTO_BASE_URL (e.g. https://checkup.brainmoto.in)
 *    - BRAINMOTO_ADMIN_KEY (same value as INTERNAL_ADMIN_KEY in app env)
 *    - BRAINMOTO_SHEET_NAME (optional, default: Submissions)
 *    - BRAINMOTO_LIMIT (optional, default: 2000)
 * 4) Run syncBrainmotoSubmissions once.
 * 5) Add trigger (time-driven) for periodic refresh.
 */

function syncBrainmotoSubmissions() {
  var props = PropertiesService.getScriptProperties();
  var baseUrl = (props.getProperty("BRAINMOTO_BASE_URL") || "").trim();
  var adminKey = (props.getProperty("BRAINMOTO_ADMIN_KEY") || "").trim();
  var sheetName = (props.getProperty("BRAINMOTO_SHEET_NAME") || "Submissions").trim();
  var limit = Number(props.getProperty("BRAINMOTO_LIMIT") || "2000");

  if (!baseUrl) {
    throw new Error("Missing script property: BRAINMOTO_BASE_URL");
  }
  if (!adminKey) {
    throw new Error("Missing script property: BRAINMOTO_ADMIN_KEY");
  }
  if (!Number.isFinite(limit) || limit < 1) {
    limit = 2000;
  }

  if (baseUrl.slice(-1) === "/") {
    baseUrl = baseUrl.slice(0, -1);
  }

  var rows = [];
  var offset = 0;
  var hasMore = true;

  while (hasMore) {
    var endpoint =
      baseUrl +
      "/api/internal/submissions/export?format=json&limit=" +
      encodeURIComponent(String(limit)) +
      "&offset=" +
      encodeURIComponent(String(offset));

    var response = UrlFetchApp.fetch(endpoint, {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        "x-admin-key": adminKey,
      },
    });

    var status = response.getResponseCode();
    var bodyText = response.getContentText();
    if (status !== 200) {
      throw new Error("Export API failed (" + status + "): " + bodyText);
    }

    var payload = JSON.parse(bodyText);
    var batchRows = payload.rows || [];
    rows = rows.concat(batchRows);

    hasMore = Boolean(payload.hasMore);
    if (hasMore) {
      offset = Number(payload.nextOffset || 0);
      if (!Number.isFinite(offset) || offset < 0) {
        throw new Error("Invalid pagination metadata from export API.");
      }
    }
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  var headers = [
    "submissionId",
    "createdAtUtc",
    "createdAtIst",
    "sourceType",
    "checkupSlug",
    "contextName",
    "childName",
    "parentName",
    "parentEmail",
    "parentWhatsapp",
    "grade",
    "gradeBand",
    "schoolName",
    "division",
    "housingSocietyName",
    "finalScore",
    "finalLevel",
    "retakeNumber",
    "resultToken",
    "resultUrl",
    "reportToken",
    "reportUrl",
    "downloadReportUrl",
    "emailStatus",
    "emailSentAtUtc",
    "pdfStatus",
    "pdfBlobUrl",
  ];

  var values = [headers];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    values.push(headers.map(function (key) {
      var value = row[key];
      return value === null || value === undefined ? "" : value;
    }));
  }

  sheet.clearContents();
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.autoResizeColumns(1, headers.length);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Synced " + rows.length + " submissions from Brainmoto API.",
    "Brainmoto Sync",
    8,
  );
}
