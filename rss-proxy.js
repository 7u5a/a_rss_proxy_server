const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const xml2js = require('xml2js');

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/rss', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing ?url=');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (CasparCG RSS Proxy)',
        'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
      }
    });

    const xml = await response.text();

    // Fejlkontrol: HTML i stedet for XML
    if (xml.trim().startsWith('<!DOCTYPE html') || xml.trim().startsWith('<html')) {
      console.error('⚠️ Modtog HTML i stedet for XML. Feed blokeret.');
      return res.status(502).json({ error: 'Blokeret af kilden. Modtog HTML i stedet for XML.' });
    }

    const result = await xml2js.parseStringPromise(xml, { mergeAttrs: true });
    const items = result.rss.channel[0].item.slice(0, 10).map(item => ({
      title: item.title[0],
      description: item.description[0],
      pubDate: item.pubDate[0]
    }));

    res.json(items);
  } catch (err) {
    console.error('Fejl:', err.message);
    res.status(500).json({ error: 'Intern serverfejl ved hentning af RSS' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxyserver kører på http://localhost:${PORT}/rss?url=...`);
});
