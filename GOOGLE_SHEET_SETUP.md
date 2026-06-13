# RSVP → Google Sheet (and CSV)

Each RSVP is appended as a row in a Google Sheet. To get a CSV at any
point: in the sheet, **File → Download → Comma-separated values (.csv)**.

## One-time setup (~5 minutes)

1. Create a new Google Sheet (sheets.new).
2. In that sheet: **Extensions → Apps Script**.
3. Delete the placeholder code, paste the contents of `Code.gs`, and Save.
4. **Deploy → New deployment**.
   - Gear icon → select type **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - **Deploy**, then authorize when prompted (choose your account →
     Advanced → "Go to … (unsafe)" → Allow — this warning is normal for
     your own script).
5. Copy the **Web app URL** (ends with `/exec`).
6. Open `js/main.js`, find:
   ```js
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
   Replace it with your `/exec` URL. Save and push.

The header row (`timestamp, attendance, name, plusone, message`) is created
automatically on the first submission.

## Test it

- Open the `/exec` URL in a browser — it should show
  `{"ok":true,"msg":"ENTROPIA RSVP endpoint is live."}`.
- Submit the form on the site — a new row should appear in the sheet.

## If you change `Code.gs` later

Apps Script keeps the same URL only if you redeploy the **existing**
deployment: **Deploy → Manage deployments → (edit/pencil) → New version →
Deploy**. Creating a brand-new deployment gives a different URL.

## Note on delivery

Apps Script Web Apps don't send CORS headers, so the site posts in
`no-cors` mode. The row is written reliably, but the browser can't read the
server's reply — so the success screen shows as long as the network request
itself completes. For a birthday RSVP this is the standard, expected
trade-off.
