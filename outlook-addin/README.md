# Converge Outlook add-in (new Outlook)

A small side panel for Outlook. Open an email, click **Converge**, and the email is
checked against the policy documents of each ADP business (HR, Payroll, Insurance,
Retirement). You get a headline, key facts and next steps for each business. The same
case also shows up in the Converge dashboard in Live mode.

This is a learning project. The data flow is:

```
Outlook email  ->  side panel (taskpane.js)  ->  POST /api/insights/analyze-all  ->  Converge backend
```

## What is in this folder

| File | What it does |
|---|---|
| `manifest.xml` | Tells Outlook the add-in name, the ribbon button and the page address |
| `taskpane.html / .css / .js` | The side panel: reads the email and shows the answers |
| `serve_addin.py` | Serves this folder over HTTPS on `https://localhost:3100` |
| `assets/` | Icons for the ribbon button |

## Set up (one time)

1. Make sure the backend works: in `backend`, run `python main.py` (port 8000).
2. Make a trusted local HTTPS certificate. In any terminal:
   ```
   npx office-addin-dev-certs install
   ```
   Windows asks for permission to trust the certificate. Say yes.
3. Start the add-in server in this folder:
   ```
   python serve_addin.py
   ```
   Check `https://localhost:3100/taskpane.html` in your browser. It should open without a
   certificate warning.

## Add it to new Outlook

1. Open any email in new Outlook.
2. Open the apps menu (the **Apps** button in the ribbon, or **...** then **Get Add-ins**).
3. Go to **My add-ins**, then under **Custom add-ins** choose **Add a custom add-in**,
   then **Add from file**.
4. Pick `manifest.xml` from this folder and confirm the warning.
5. Open an email again. You should see a **Converge** button. Click it.

Shortcut: open `https://aka.ms/olksideload` in a browser, it opens the same add-ins dialog.

If you change `manifest.xml` later, remove the add-in and add it again.

## Use it

1. Open an email, for example one like: "I got married last Saturday. Can I add my wife
   to my health insurance?"
2. Click **Converge**, then **Analyze this email**.
3. Wait a few seconds. Cards appear, one per business the email touches.
4. In the Converge dashboard, switch to **Live** mode to see the same cases.

## If something does not work

- **No Converge button:** the add-in was not added, or a work account blocks custom add-ins.
  Ask your admin, or try a personal Outlook account.
- **Blank panel or certificate error:** `serve_addin.py` is not running, or step 2 of the
  setup was skipped.
- **"Something went wrong ... Is the backend running":** start `python main.py`. The panel
  calls `http://localhost:8000`. You can change the address under **Settings** in the panel.
  If your Outlook refuses to call an http address from an https page, run the backend over
  HTTPS too, with the same certificate:
  `uvicorn main:app --port 8000 --ssl-keyfile %USERPROFILE%\.office-addin-dev-certs\localhost.key --ssl-certfile %USERPROFILE%\.office-addin-dev-certs\localhost.crt`
  and set the backend address to `https://localhost:8000`.
- **Backend says 429 or quota:** the Gemini free tier is rate limited. Wait a minute.

## Privacy note

The email subject and the first 4000 characters of the body are sent to the backend, and
from there to the AI provider (Gemini or OpenAI). Only try it with emails you are fine with
sending there. Use made-up emails for testing.

## Ideas for later

- Sign the user in with Microsoft so the manager is the real user, not `outlook-user`.
- A "Reply with this answer" button using the suggested reply text.
- A real hosted address instead of localhost, so other people can install it.
