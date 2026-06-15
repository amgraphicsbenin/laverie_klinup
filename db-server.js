const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5050;
const DB_FILE = path.join(__dirname, 'db.json');

// Helper to send JSON responses
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Read database file
function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error("Error parsing db.json, returning empty:", err);
    return null;
  }
}

// Write to database file
function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.url === '/api/db') {
    if (req.method === 'GET') {
      const data = readDb();
      if (!data) {
        // Return 404 so the client initializes it with its default structure
        sendJSON(res, 404, { error: 'Database not initialized yet' });
      } else {
        sendJSON(res, 200, data);
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          writeDb(payload);
          sendJSON(res, 200, { success: true });
        } catch (err) {
          sendJSON(res, 400, { error: 'Invalid JSON payload' });
        }
      });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } else if (req.url === '/api/send-whatsapp') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const { phone, text } = payload;
          
          const dbData = readDb();
          const config = dbData ? dbData.whatsappConfig : null;

          if (!config || !config.enabled) {
            console.log(`[WHATSAPP AUTOMATIQUE] Désactivé ou non configuré. Message non envoyé vers ${phone}.`);
            sendJSON(res, 200, { success: true, status: 'disabled' });
            return;
          }

          console.log(`[WHATSAPP AUTOMATIQUE] Tentative d'envoi automatique vers ${phone} via ${config.apiUrl}...`);

          const headers = {
            'Content-Type': 'application/json'
          };
          if (config.headerName && config.headerValue) {
            headers[config.headerName] = config.headerValue;
          }

          let targetUrl = config.apiUrl;
          let reqBody = {};
          
          reqBody[config.phoneParam || 'to'] = phone;
          reqBody[config.messageParam || 'body'] = text;

          if (config.extraParams) {
            const params = new URLSearchParams(config.extraParams);
            for (const [key, value] of params.entries()) {
              reqBody[key] = value;
            }
          }

          const response = await fetch(targetUrl, {
            method: config.method || 'POST',
            headers: headers,
            body: config.method === 'GET' ? null : JSON.stringify(reqBody)
          });

          const respText = await response.text();
          console.log(`[WHATSAPP AUTOMATIQUE] Réponse de la passerelle (Status ${response.status}):`, respText);
          
          if (response.ok) {
            sendJSON(res, 200, { success: true });
          } else {
            sendJSON(res, 502, { error: `La passerelle a répondu avec le statut ${response.status}`, details: respText });
          }
        } catch (err) {
          console.error("[WHATSAPP AUTOMATIQUE] Erreur:", err);
          sendJSON(res, 500, { error: err.message });
        }
      });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } else if (req.url === '/api/send-whatsapp-test') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const { config, phone, text } = payload;

          if (!config || !config.apiUrl) {
            sendJSON(res, 400, { error: 'Configuration invalide' });
            return;
          }

          console.log(`[WHATSAPP AUTOMATIQUE - TEST] Tentative d'envoi test vers ${phone}...`);

          const headers = {
            'Content-Type': 'application/json'
          };
          if (config.headerName && config.headerValue) {
            headers[config.headerName] = config.headerValue;
          }

          let reqBody = {};
          reqBody[config.phoneParam || 'to'] = phone;
          reqBody[config.messageParam || 'body'] = text;

          if (config.extraParams) {
            const params = new URLSearchParams(config.extraParams);
            for (const [key, value] of params.entries()) {
              reqBody[key] = value;
            }
          }

          const response = await fetch(config.apiUrl, {
            method: config.method || 'POST',
            headers: headers,
            body: config.method === 'GET' ? null : JSON.stringify(reqBody)
          });

          const respText = await response.text();
          console.log(`[WHATSAPP AUTOMATIQUE - TEST] Réponse (Status ${response.status}):`, respText);
          
          if (response.ok) {
            sendJSON(res, 200, { success: true });
          } else {
            sendJSON(res, 502, { error: `La passerelle a répondu avec le statut ${response.status}`, details: respText });
          }
        } catch (err) {
          console.error("[WHATSAPP AUTOMATIQUE - TEST] Erreur:", err);
          sendJSON(res, 500, { error: err.message });
        }
      });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } else {
    sendJSON(res, 404, { error: 'Not found' });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('[KLIN UP DB SERVER] Port 5050 is already in use. Assuming server is already running.');
    process.exit(0);
  } else {
    console.error('[KLIN UP DB SERVER] Server error:', err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`[KLIN UP DB SERVER] Shared database server running on http://localhost:${PORT}`);
});
