// Converge Outlook add-in: side panel logic.
//
// What it does:
//   1. Reads the open email (sender, subject, body) with Office.js.
//   2. Sends it to the Converge backend: POST /api/insights/analyze-all
//   3. Shows the answer from each ADP business (HR, Payroll, Insurance, Retirement).
//
// The backend also saves the result in its feed, so the same case shows up in the
// Converge dashboard in Live mode.

var DEFAULT_API = 'http://localhost:8000';
var DEFAULT_DASHBOARD = 'http://localhost:3000';
var MAX_BODY_CHARS = 4000; // keep very long emails (reply chains) short

var BUSINESS_NAMES = {
  hr: 'HR',
  payroll: 'Payroll',
  insurance: 'Insurance & Benefits',
  retirement: 'Retirement',
};

// ---------- small helpers ----------

function $(id) {
  return document.getElementById(id);
}

// Makes an element with text. We use textContent (not innerHTML) so AI text can never run as HTML.
function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function getSetting(key, fallback) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    // storage can be blocked, that is fine
  }
}

function setStatus(text, isError) {
  var box = $('status');
  box.textContent = text || '';
  box.className = isError ? 'status error' : 'status';
}

// ---------- start up ----------

Office.onReady(function (info) {
  if (info.host !== Office.HostType.Outlook) {
    setStatus('Please open this add-in inside Outlook.', true);
    return;
  }

  $('api-url').value = getSetting('converge_api', DEFAULT_API);
  $('dash-url').value = getSetting('converge_dash', DEFAULT_DASHBOARD);
  $('dashboard-link').href = $('dash-url').value;

  $('analyze-btn').onclick = analyzeEmail;
  $('save-btn').onclick = saveSettings;

  showEmail();

  // If the panel is pinned and the user clicks another email, refresh it.
  Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, function () {
    $('results').innerHTML = '';
    setStatus('');
    showEmail();
  });
});

function saveSettings() {
  saveSetting('converge_api', $('api-url').value.trim() || DEFAULT_API);
  saveSetting('converge_dash', $('dash-url').value.trim() || DEFAULT_DASHBOARD);
  $('dashboard-link').href = $('dash-url').value.trim() || DEFAULT_DASHBOARD;
  setStatus('Saved.');
}

// ---------- reading the email ----------

function showEmail() {
  var item = Office.context.mailbox.item;
  if (!item) {
    $('email-from').textContent = 'No email selected.';
    $('email-subject').textContent = '';
    $('analyze-btn').disabled = true;
    return;
  }
  var from = item.from;
  $('email-from').textContent = from ? from.displayName + ' <' + from.emailAddress + '>' : 'Unknown sender';
  $('email-subject').textContent = item.subject || '(no subject)';
  $('analyze-btn').disabled = false;
}

// Office.js reads the body with a callback. This wraps it so we can use "await".
function getBodyText() {
  return new Promise(function (resolve, reject) {
    Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, function (result) {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value);
      } else {
        reject(new Error('Could not read the email body.'));
      }
    });
  });
}

// ---------- calling the backend ----------

async function analyzeEmail() {
  var item = Office.context.mailbox.item;
  if (!item) return;

  var api = ($('api-url').value.trim() || DEFAULT_API).replace(/\/$/, '');
  var button = $('analyze-btn');
  button.disabled = true;
  $('results').innerHTML = '';
  setStatus('Reading the email and checking policy documents... this can take a few seconds.');

  try {
    var body = await getBodyText();
    body = body.trim().slice(0, MAX_BODY_CHARS);

    var from = item.from || { displayName: 'Unknown', emailAddress: 'unknown' };
    var message = 'Email subject: ' + (item.subject || '(no subject)') + '\n\n' + body;

    var response = await fetch(api + '/api/insights/analyze-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: from.emailAddress,
        employee_name: from.displayName,
        manager_id: 'outlook-user',
        message: message,
        channel: 'email',
      }),
    });

    if (!response.ok) {
      var detail = '';
      try {
        detail = (await response.json()).detail || '';
      } catch (e) {
        // ignore
      }
      throw new Error('Backend error ' + response.status + '. ' + detail);
    }

    var data = await response.json();
    showResults(data);
    setStatus('Done. The same case is now in the Converge dashboard (Live mode).');
  } catch (err) {
    setStatus(
      'Something went wrong: ' +
        err.message +
        ' Is the backend running at ' +
        api +
        '? (python main.py)',
      true
    );
  } finally {
    button.disabled = false;
  }
}

// ---------- showing the answer ----------

function showResults(data) {
  var box = $('results');
  box.innerHTML = '';

  // Tell the user if the backend hid sensitive data (SSN, birth date...) before the AI call
  var redactions = (data.privacy && data.privacy.redactions) || {};
  var hidden = Object.keys(redactions).map(function (k) {
    return k + ' x' + redactions[k];
  });
  if (hidden.length) {
    box.appendChild(el('div', 'route', 'Privacy: hidden before the AI call (' + hidden.join(', ') + ').'));
  }

  var routing = data.routing || {};
  var names = (routing.domains || []).map(function (d) {
    return BUSINESS_NAMES[d] || d;
  });
  if (names.length) {
    box.appendChild(el('div', 'route', 'This email touches: ' + names.join(', ') + (routing.reason ? '. ' + routing.reason : '')));
  }

  (data.results || []).forEach(function (r) {
    box.appendChild(buildCard(r));
  });

  var errors = data.errors || {};
  Object.keys(errors).forEach(function (d) {
    box.appendChild(el('div', 'status error', (BUSINESS_NAMES[d] || d) + ' failed: ' + errors[d]));
  });
}

function buildCard(result) {
  var ai = result.insight || {};
  var card = el('section', 'card biz');

  var head = el('div', 'biz-head');
  head.appendChild(el('span', 'biz-name', BUSINESS_NAMES[result.domain] || result.domain));
  var status = ai.eligibility_status || 'Conditional';
  var pillClass = status === 'Eligible' ? 'pill' : status === 'Ineligible' ? 'pill no' : 'pill cond';
  head.appendChild(el('span', pillClass, status));
  card.appendChild(head);

  card.appendChild(el('div', 'headline', ai.headline || ai.eligibility_summary || ''));

  var highlights = ai.highlights || [];
  if (highlights.length) {
    var tiles = el('div', 'tiles');
    highlights.slice(0, 4).forEach(function (h) {
      var tile = el('div', 'tile');
      tile.appendChild(el('div', 'k', h.label));
      tile.appendChild(el('div', 'v', h.value));
      tiles.appendChild(tile);
    });
    card.appendChild(tiles);
  }

  var steps = ai.checklist || [];
  if (steps.length) {
    var list = el('ul', 'steps');
    steps.slice(0, 4).forEach(function (s) {
      list.appendChild(el('li', null, s));
    });
    card.appendChild(list);
  }

  if (ai.adp_api_endpoint) {
    card.appendChild(el('div', 'endpoint', ai.adp_api_endpoint));
  }
  return card;
}
