// Keep-alive script untuk Replit
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Valkyrion Radio Bot is alive!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Keep-alive server running on port ${port}`);
});

// Ping diri sendiri setiap 5 menit untuk tetap aktif
setInterval(() => {
  const http = require('http');
  const options = {
    hostname: process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co',
    port: port,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Keep-alive ping status: ${res.statusCode}`);
  });

  req.on('error', (e) => {
    console.log(`Keep-alive ping error: ${e.message}`);
  });

  req.end();
}, 5 * 60 * 1000); // Setiap 5 menit