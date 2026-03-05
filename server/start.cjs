'use strict';
var http = require('http');
var path = require('path');

var PORT = parseInt(process.env.PORT || '5000', 10);
var isReady = false;
var HEALTH = { '/': 1, '/health': 1, '/healthz': 1 };

var server = http.createServer(function (req, res) {
  if (HEALTH[req.url]) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"ok"}');
    return;
  }

  if (isReady && global.__expressApp) {
    global.__expressApp(req, res);
    return;
  }

  res.writeHead(503, { 'Content-Type': 'application/json' });
  res.end('{"error":"warming_up"}');
});

server.listen(PORT, '0.0.0.0', function () {
  console.log('[boot] Health server listening on ' + PORT);
});

global.__preloadServer = server;

setTimeout(function () {
  try {
    require(path.join(__dirname, '..', 'dist', 'index.cjs'));
    console.log('[boot] App module loaded');
  } catch (err) {
    console.error('[boot] Failed to load app:', err && err.message);
  }
}, 100);

setInterval(function () {
  if (!isReady && global.__APP_READY__ === true) {
    isReady = true;
    console.log('[boot] App fully ready, routing traffic');
  }
}, 200);
