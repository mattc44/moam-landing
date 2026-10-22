// Matt's newest long-form YouTube videos (no Shorts), for the free apps.
// Reads YouTube's public "long-form uploads" feed (UULF + channel id), no API key.
// Cached at Vercel's edge for a day, so the list refreshes daily on its own.
const CHANNEL = 'UCxqfQGgiyquf_A0DQJZyKwQ';
const FEED = 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULF' + CHANNEL.slice(2);

const decode = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

module.exports = async (req, res) => {
  try {
    const r = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 (manonmission.ca)' } });
    if (!r.ok) throw new Error('feed ' + r.status);
    const xml = await r.text();
    const items = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
      const e = m[1];
      const get = re => { const x = e.match(re); return x ? x[1] : ''; };
      const id = get(/<yt:videoId>([^<]+)</);
      return {
        id,
        title: decode(get(/<title>([^<]*)<\/title>/)),
        published: get(/<published>([^<]+)</).slice(0, 10),
        thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
      };
    }).filter(v => v.id);
    if (!items.length) throw new Error('empty feed');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ updated: new Date().toISOString(), items });
  } catch (err) {
    res.setHeader('Cache-Control', 'public, s-maxage=600');
    res.status(502).json({ error: String(err.message || err), items: [] });
  }
};
