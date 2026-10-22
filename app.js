(() => {
'use strict';
const $ = id => document.getElementById(id);
let candles = [], quote = null, lastAnalysis = null;
const money = (n, currency = $('currency')?.value || 'USD') => Number.isFinite(n) ? new Intl.NumberFormat('en-ZA',{style:'currency',currency,maximumFractionDigits:2}).format(n) : '—';
const num = (id, fallback=0) => { const v=Number($(id).value); return Number.isFinite(v)?v:fallback; };
const fmt = n => Number.isFinite(n) ? n.toLocaleString('en-US',{maximumFractionDigits:2}) : '—';
function switchTab(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
function parseCSV(text){
 const lines=text.trim().split(/\r?\n/).filter(Boolean); if(lines.length<2) throw Error('CSV needs a header and at least one data row.');
 const split=line=>line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));
 const headers=split(lines[0]).map(x=>x.toLowerCase());
 const idx=name=>headers.findIndex(h=>h===name || (name==='time'&&['timestamp','datetime','date'].includes(h)));
 const oi=idx('open'),hi=idx('high'),li=idx('low'),ci=idx('close'),ti=idx('time'),vi=idx('volume');
 if([oi,hi,li,ci].some(i=>i<0)) throw Error('CSV must include open, high, low and close columns.');
 const out=[];
 for(let r=1;r<lines.length;r++){const a=split(lines[r]);const c={time:ti>=0?(a[ti]||''):String(r),open:Number(a[oi]),high:Number(a[hi]),low:Number(a[li]),close:Number(a[ci]),volume:vi>=0?Number(a[vi])||0:0};
 if(![c.open,c.high,c.low,c.close].every(Number.isFinite)||c.high<Math.max(c.open,c.close)||c.low>Math.min(c.open,c.close)||c.high<c.low) continue;out.push(c);}
 if(out.length<2) throw Error('No valid OHLC rows found. Check CSV columns and values.');
 return out;
}
function renderCandles(){const body=$('candleRows');if(!candles.length){body.innerHTML='<tr><td colspan="6" class="muted">No candles loaded</td></tr>';return;}body.innerHTML=candles.slice(-12).reverse().map(c=>`<tr><td>${esc(c.time)}</td><td>${fmt(c.open)}</td><td>${fmt(c.high)}</td><td>${fmt(c.low)}</td><td>${fmt(c.close)}</td><td>${fmt(c.volume)}</td></tr>`).join('');}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function atrCalc(cs,period=14){if(cs.length<2)return NaN;let trs=[];for(let i=1;i<cs.length;i++){const c=cs[i],p=cs[i-1];trs.push(Math.max(c.high-c.low,Math.abs(c.high-p.close),Math.abs(c.low-p.close)));}return trs.slice(-period).reduce((a,b)=>a+b,0)/Math.min(period,trs.length);}
function analyze(){
 const n=candles.length;
 if(!n){$('marketState').textContent='NO TRADE · DATA REQUIRED';$('signalState').textContent='NO TRADE';$('signalExplanation').textContent='Import candles before analysis. No signal is manufactured.';$('buyScore').textContent=$('sellScore').textContent='—';$('buyReason').textContent=$('sellReason').textContent='Need candle data';$('structure').textContent='Unavailable';$('swingHigh').textContent=$('swingLow').textContent=$('atr').textContent='—';$('sweep').textContent='—';$('tradePlan').textContent='No qualified setup. Load candle data and review the conditions before considering a trade.';return;}
 const cs=candles, last=cs[n-1], a=atrCalc(cs), range=cs.slice(Math.max(0,n-21),n-1);
 const sh=Math.max(...range.map(c=>c.high)),sl=Math.min(...range.map(c=>c.low));
 const bullish=last.close>last.open,bearish=last.close<last.open;
 const upBreak=last.close>sh,downBreak=last.close<sl;
 const sweepHigh=last.high>sh&&last.close<sh,sweepLow=last.low<sl&&last.close>sl;
 const body=Math.abs(last.close-last.open), displacement=Number.isFinite(a)&&body>=a*.7;
 const buy= (upBreak?2:0)+(bullish?1:0)+(displacement?1:0)+(sweepLow?1:0);
 const sell=(downBreak?2:0)+(bearish?1:0)+(displacement?1:0)+(sweepHigh?1:0);
 $('latestPrice').textContent=quote?`${fmt(quote.price)}*`:fmt(last.close);
 $('latestTime').textContent=quote?`${quote.time} (manual)`:String(last.time||'Imported candle');
 $('structure').textContent=upBreak?'Bullish break (candle proxy)':downBreak?'Bearish break (candle proxy)':bullish?'Bullish candle, no confirmed break':bearish?'Bearish candle, no confirmed break':'Neutral';
 $('swingHigh').textContent=fmt(sh);$('swingLow').textContent=fmt(sl);$('sweep').textContent=sweepHigh?'Possible high sweep':sweepLow?'Possible low sweep':'No sweep detected';$('atr').textContent=fmt(a);
 $('buyScore').textContent=`${buy}/5`; $('sellScore').textContent=`${sell}/5`;
 $('buyReason').textContent=upBreak?'Close broke prior 20-candle high':sweepLow?'Low swept then reclaimed':bullish?'Bullish candle only':'No bullish confirmation';
 $('sellReason').textContent=downBreak?'Close broke prior 20-candle low':sweepHigh?'High swept then rejected':bearish?'Bearish candle only':'No bearish confirmation';
 const minRR=num('minRR',2), mult=num('atrMult',1.5);
 let dir=null,entry=last.close,stop,tp1,tp2,reason='';
 if(n>=22&&Number.isFinite(a)&&a>0&&buy>=4&&buy>sell){dir='BUY';stop=entry-a*mult;tp1=entry+a*mult*minRR;tp2=entry+a*mult*(minRR+1);reason='Bullish close beyond prior 20-candle range with supporting candle momentum.';}
 else if(n>=22&&Number.isFinite(a)&&a>0&&sell>=4&&sell>buy){dir='SELL';stop=entry+a*mult;tp1=entry-a*mult*minRR;tp2=entry-a*mult*(minRR+1);reason='Bearish close beyond prior 20-candle range with supporting candle momentum.';}
 const qualified=!!dir;
 $('marketState').textContent=qualified?'TRADE SETUP · CANDLE PROXY':'WAIT · NO QUALIFIED SETUP';
 $('signalState').textContent=qualified?`${dir} CANDIDATE`:'WAIT / NO TRADE';
 $('signalExplanation').textContent=qualified?`${reason} Confidence score ${Math.max(buy,sell)}/5 is a rule score, not win probability.`:'Rules not satisfied or fewer than 22 candles. A no-trade result is valid.';
 $('tradePlan').innerHTML=qualified?`<div class="metric-list"><div><span>Direction / type</span><b>${dir} · range breakout proxy</b></div><div><span>Entry reference</span><b>${fmt(entry)}</b></div><div><span>Stop-loss</span><b>${fmt(stop)}</b></div><div><span>Target 1</span><b>${fmt(tp1)}</b></div><div><span>Target 2</span><b>${fmt(tp2)}</b></div><div><span>Reward:risk</span><b>${minRR.toFixed(1)}:1 minimum target</b></div><div><span>Invalidation</span><b>Close beyond stop / setup expires on new structure</b></div></div><p class="note">Candidate only. Confirm spread, session, macro events and opposing liquidity. No true bid/ask order-flow evidence is present.</p>`:'No qualified setup. The rule score is not a probability. Check candle quality and use WAIT/NO TRADE if evidence is insufficient.';
 lastAnalysis={a,sh,sl,buy,sell,dir,entry,stop,tp1,tp2};
}
$('csvFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{candles=parseCSV(await f.text());quote=null;renderCandles();analyze();$('importStatus').textContent=`Loaded ${candles.length} valid candles from ${f.name}. Dataset is user-supplied; not verified live.`;}catch(err){$('importStatus').textContent=err.message;}});
$('loadSample').addEventListener('click',()=>{candles=[];let p=4000;for(let i=0;i<160;i++){let drift=(i>110?.8:-.1)+(Math.sin(i/6)*.8),o=p,c=o+drift+(Math.random()-.5)*1.2,h=Math.max(o,c)+Math.random()*1.2,l=Math.min(o,c)-Math.random()*1.2;p=c;candles.push({time:`DEMO-${String(i+1).padStart(3,'0')}`,open:+o.toFixed(2),high:+h.toFixed(2),low:+l.toFixed(2),close:+c.toFixed(2),volume:0});}quote=null;renderCandles();analyze();$('importStatus').textContent='DEMO DATA ONLY — synthetic candles, not market prices. Do not trade from this dataset.';});
$('clearCandles').addEventListener('click',()=>{candles=[];quote=null;renderCandles();analyze();$('importStatus').textContent='Candle data cleared.';});
$('saveQuote').addEventListener('click',()=>{const price=num('manualPrice',NaN),time=$('manualTime').value;if(!(price>0)){alert('Enter a valid positive quote.');return;}quote={price,time:time||'timestamp not supplied'};$('dataStatus').textContent='MANUAL QUOTE · UNVERIFIED';$('updatedAt').textContent='User entered';$('statusDot').style.background='var(--gold)';analyze();});
$('reanalyze').addEventListener('click',analyze);
function calculateRisk(){
 const balance=num('balance'),equity=num('equity'),rp=num('riskPct'),target=num('target'),dl=num('dailyLoss'),pl=num('dayPL'),dd=num('maxDD'),pos=num('positions'),maxPos=num('maxPositions'),tr=num('tradesToday'),maxTr=num('maxTrades'),maxL=num('maxLosses'),losses=num('lossesNow'),stopT=$('stopThreshold').value.trim()===''?NaN:num('stopThreshold');
 const risk=equity*rp/100, draw=balance>0?Math.max(0,(balance-equity)/balance*100):NaN, remaining=Math.max(0,dl+Math.min(0,pl)), targetRem=Math.max(0,target-pl);
 $('riskMoney').textContent=money(risk);$('drawdown').textContent=Number.isFinite(draw)?`${draw.toFixed(2)}%`:'—';$('lossRemaining').textContent=money(remaining);$('targetRemaining').textContent=money(targetRem);
 const warns=[];if(balance<=0||equity<=0)warns.push('Balance and equity must be positive.');if(rp<=0||rp>5)warns.push('Risk percentage must be above 0 and no more than 5% in this calculator.');if(draw>=dd&&dd>0)warns.push('Maximum drawdown limit reached or exceeded: stop trading and review.');if(pl<=-dl&&dl>0)warns.push('Daily maximum loss reached: stop trading for the day.');if(pos>=maxPos)warns.push('Maximum simultaneous positions reached.');if(tr>=maxTr)warns.push('Maximum trades per day reached.');if(losses>=maxL)warns.push('Maximum consecutive losses reached: stop and review.');if(Number.isFinite(stopT)&&Math.abs(Math.min(0,pl))>=stopT&&stopT>0)warns.push('Optional daily stop threshold reached.');if(target>balance)warns.push(`Target is ${(target/balance*100).toFixed(0)}% of starting balance. This is an extreme target, not a realistic or assured daily outcome.`);if(!warns.length)warns.push('No configured stop condition currently triggered. This is not a recommendation to trade.');
 $('riskWarnings').innerHTML=warns.map(w=>`<div class="warning ${w.startsWith('No configured')?'success':''}">${esc(w)}</div>`).join('');
}
$('calcRisk').addEventListener('click',calculateRisk);
$('calcPosition').addEventListener('click',()=>{
 const entry=num('entry',NaN),stop=num('stop',NaN),tp1=num('tp1',NaN),tp2=num('tp2',NaN),v=num('moveValue',NaN),step=num('lotStep',.01),risk=num('equity')*num('riskPct')/100;
 if(!(entry>0&&stop>0&&v>0&&step>0)||entry===stop){$('positionResult').textContent='Enter positive entry and stop prices, a non-zero stop distance, verified value-per-$1-per-lot and valid lot step.';return;}
 const distance=Math.abs(entry-stop),raw=risk/(distance*v),lots=Math.floor(raw/step)*step,loss=lots*distance*v;
 const profit=t=>Number.isFinite(t)&&t>0?Math.abs(t-entry)*v*lots:NaN;
 $('positionResult').innerHTML=`<div class="metric-list"><div><span>Risk budget</span><b>${money(risk)}</b></div><div><span>Stop distance</span><b>${fmt(distance)} price units</b></div><div><span>Estimated lot size (rounded down)</span><b>${lots.toFixed(3)}</b></div><div><span>Potential stop loss, before costs</span><b>${money(loss)}</b></div><div><span>Potential target 1 profit</span><b>${money(profit(tp1))}</b></div><div><span>Potential target 2 profit</span><b>${money(profit(tp2))}</b></div><div><span>R:R to target 1</span><b>${Number.isFinite(tp1)?(Math.abs(tp1-entry)/distance).toFixed(2)+':1':'—'}</b></div></div><p class="note">Verify volume min/max, tick value, contract size and conversion with your broker. This estimate excludes commission, spread, swaps and slippage.</p>`;
});
function runBacktest(){
 const n=candles.length;if(n<100){$('backtestResults').textContent='Need at least 100 valid candles. Import history first; demo data is synthetic and unsuitable for judging a real strategy.';return;}
 const frac=Math.min(90,Math.max(10,num('testFraction',30)))/100,split=Math.floor(n*(1-frac)),commission=num('commission'),slip=num('slippage'),start=num('btBalance',10000);
 let equity=start,peak=start,maxDD=0,trades=[],lossStreak=0,maxStreak=0;
 for(let i=Math.max(22,split);i<n-1;i++){
  const hist=candles.slice(i-20,i),cur=candles[i],a=atrCalc(candles.slice(Math.max(0,i-15),i+1));
  const hh=Math.max(...hist.map(c=>c.high)),ll=Math.min(...hist.map(c=>c.low));
  let dir=cur.close>hh?'BUY':cur.close<ll?'SELL':null;if(!dir||!Number.isFinite(a)||a<=0)continue;
  const entry=candles[i+1].open+(dir==='BUY'?slip:-slip),stop=entry+(dir==='BUY'?-1:1)*a*1.5,target=entry+(dir==='BUY'?1:-1)*a*2.5;
  let exit=candles[i+1].close,why='end';for(let j=i+1;j<Math.min(n,i+13);j++){const c=candles[j];if(dir==='BUY'&&c.low<=stop){exit=stop;why='stop';break;}if(dir==='SELL'&&c.high>=stop){exit=stop;why='stop';break;}if(dir==='BUY'&&c.high>=target){exit=target;why='target';break;}if(dir==='SELL'&&c.low<=target){exit=target;why='target';break;}exit=c.close;}
  const pnl=(dir==='BUY'?exit-entry:entry-exit)-commission;equity+=pnl;peak=Math.max(peak,equity);maxDD=Math.max(maxDD,(peak-equity)/peak*100);trades.push({pnl,why});if(pnl<0){lossStreak++;maxStreak=Math.max(maxStreak,lossStreak);}else lossStreak=0;
 }
 if(!trades.length){$('backtestResults').textContent='No trades triggered in the out-of-sample portion.';return;}
 const wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0),grossWin=wins.reduce((s,t)=>s+t.pnl,0),grossLoss=Math.abs(losses.reduce((s,t)=>s+t.pnl,0)),net=trades.reduce((s,t)=>s+t.pnl,0);
 $('backtestResults').innerHTML=`<div class="kpi-grid"><div class="kpi"><span>Out-of-sample trades</span><b>${trades.length}</b></div><div class="kpi"><span>Win rate</span><b>${(wins.length/trades.length*100).toFixed(1)}%</b></div><div class="kpi"><span>Net P/L (1-unit size proxy)</span><b>${fmt(net)}</b></div><div class="kpi"><span>Profit factor</span><b>${grossLoss?fmt(grossWin/grossLoss):'∞ / no losses'}</b></div><div class="kpi"><span>Maximum drawdown</span><b>${maxDD.toFixed(2)}%</b></div><div class="kpi"><span>Max consecutive losses</span><b>${maxStreak}</b></div><div class="kpi"><span>Expectancy / trade</span><b>${fmt(net/trades.length)}</b></div><div class="kpi"><span>Average win / loss</span><b>${fmt(wins.length?grossWin/wins.length:0)} / ${fmt(losses.length?grossLoss/losses.length:0)}</b></div></div><p class="note">Chronological out-of-sample segment begins at candle ${split+1}/${n}. Approximate OHLC fills; stop/target order within a candle is ambiguous. Costs are simplified; sizing is a 1-unit price-change proxy, not a broker lot simulation.</p>`;
}
$('runBacktest').addEventListener('click',runBacktest);
function savePrefs(){const ids=['balance','equity','currency','riskPct','target','dailyLoss','dayPL','maxDD','positions','maxPositions','tradesToday','maxTrades','riskRR','maxLosses','lossesNow','stopThreshold','minRR','atrMult'];const o={};ids.forEach(id=>o[id]=$(id).value);if($('savePrefs').checked)localStorage.setItem('goldflow-prefs',JSON.stringify(o));$('settingsStatus').textContent=$('savePrefs').checked?'Settings saved on this device.':'Preference saving disabled.';}
$('saveSettings').addEventListener('click',()=>{savePrefs();calculateRisk();});
$('resetSettings').addEventListener('click',()=>{localStorage.removeItem('goldflow-prefs');$('settingsStatus').textContent='Saved preferences removed. Refresh to use defaults.';});
try{const saved=JSON.parse(localStorage.getItem('goldflow-prefs')||'{}');Object.entries(saved).forEach(([id,val])=>{if($(id))$(id).value=val;});}catch(_){}
$('exportData').addEventListener('click',()=>{if(!candles.length){$('settingsStatus').textContent='No candles to export.';return;}const csv='time,open,high,low,close,volume\n'+candles.map(c=>[c.time,c.open,c.high,c.low,c.close,c.volume].join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='goldflow-candles.csv';a.click();URL.revokeObjectURL(a.href);});
$('updatedAt').textContent='No feed connected';calculateRisk();analyze();
})();