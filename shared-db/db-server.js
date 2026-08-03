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
