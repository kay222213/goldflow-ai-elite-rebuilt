/** GoldFlow AI Elite market-data proxy for Cloudflare Workers.
 * Set secret TWELVE_DATA_API_KEY in Worker settings. Deploy this file as Worker.
 * Endpoints: GET /health, /quote, /candles?interval=5min&outputsize=500
 */
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store'
};
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ok:true, service:'GoldFlow market-data proxy', configured:!!env.TWELVE_DATA_API_KEY, serverTime:new Date().toISOString()});
    if (!env.TWELVE_DATA_API_KEY) return json({error:'Worker secret TWELVE_DATA_API_KEY is not configured'},503);
    if (!['/quote','/candles'].includes(url.pathname)) return json({error:'Use /health, /quote or /candles'},404);
    const endpoint = url.pathname === '/quote' ? 'quote' : 'time_series';
    const params = new URLSearchParams({symbol:'XAU/USD', apikey:env.TWELVE_DATA_API_KEY, format:'JSON'});
    if (endpoint === 'time_series') {
      const interval = url.searchParams.get('interval') || '5min';
      const allowed = new Set(['1min','5min','15min','30min','1h','4h','1day']);
      if (!allowed.has(interval)) return json({error:'Unsupported interval'},400);
      params.set('interval',interval);
      params.set('outputsize',String(Math.min(500,Math.max(50,Number(url.searchParams.get('outputsize'))||500))));
      params.set('timezone','UTC');
    }
    const upstream = await fetch(`https://api.twelvedata.com/${endpoint}?${params}`,{headers:{'Accept':'application/json'}});
    const data = await upstream.json();
    if (!upstream.ok || data.status === 'error' || data.code || data.message && !data.values && !data.price) return json({error:data.message||data.status||`Provider HTTP ${upstream.status}`,provider:data},502);
    if (endpoint === 'quote') {
      const price = Number(data.close ?? data.price);
      if (!Number.isFinite(price) || price <= 0) return json({error:'Provider returned no valid XAU/USD price',provider:data},502);
      return json({price, timestamp:data.timestamp || data.datetime || new Date().toISOString(), source:'Twelve Data XAU/USD', symbol:'XAU/USD', providerTime:data.datetime||null});
    }
    const values = Array.isArray(data.values) ? data.values : [];
    if (values.length < 40) return json({error:'Provider returned too few candles',count:values.length,provider:data},502);
    return json({symbol:'XAU/USD',source:'Twelve Data',interval:data.meta?.interval||'5min',timezone:data.meta?.timezone||'UTC',values:values.map(v=>({datetime:v.datetime,open:Number(v.open),high:Number(v.high),low:Number(v.low),close:Number(v.close),volume:Number(v.volume)||0})).reverse(),meta:data.meta||{},receivedAt:new Date().toISOString()});
  }
};
