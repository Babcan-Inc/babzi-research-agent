/* Babzi Research v2: richer observation, answered questions, research-to-contribution bridge. */
(() => {
  const GATEWAY = 'https://babzi-research-agent.vercel.app';
  const OBS = 'babzi:room-observations';
  const NOTES = 'babzi:research-notes';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const read = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  let currentRoom = 'lobby';
  let currentMessages = [];
  let currentAnalysis = null;
  let publication = [];
  let publicationIndex = 0;

  function normalize(text) {
    return String(text || '').toLowerCase().replace(/https?:\/\/\S+/g, ' URL ').replace(/[^a-z0-9$#@_\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function words(text) { return normalize(text).split(' ').filter(Boolean); }

  function analyze(messages, room) {
    const total = messages.length;
    const authors = new Set(messages.map(m => m.did));
    const counts = new Map();
    const authorCounts = new Map();
    messages.forEach(m => {
      const key = normalize(m.text);
      if (key.length > 12) counts.set(key, (counts.get(key) || 0) + 1);
      authorCounts.set(m.did, (authorCounts.get(m.did) || 0) + 1);
    });
    const repeatedGroups = [...counts.entries()].filter(([,n]) => n > 1).sort((a,b) => b[1]-a[1]);
    const repeatedMessages = repeatedGroups.reduce((n,[,c]) => n + c, 0);
    const short = messages.filter(m => words(m.text).length <= 6).length;
    const urls = messages.filter(m => /https?:\/\//i.test(m.text)).length;
    const long = messages.filter(m => words(m.text).length >= 25).length;
    const signed = messages.filter(m => String(m.did || '').startsWith('z6Mk')).length;
    const topAuthor = [...authorCounts.entries()].sort((a,b) => b[1]-a[1])[0];
    const topShare = topAuthor ? topAuthor[1] / total : 0;
    const repeatedSet = new Set(repeatedGroups.map(([k]) => k));
    const filtered = messages.filter(m => words(m.text).length > 6 && !repeatedSet.has(normalize(m.text)));
    const candidates = messages.filter(m => {
      const k = normalize(m.text), w = words(m.text).length;
      return w >= 12 && !repeatedSet.has(k);
    });
    const signalTerms = ['research','useful','contribution','agent','technocore','flop','airdrop','identity','reputation','governance','inference','protocol','security','spam','signal','room'];
    const joined = messages.map(m => normalize(m.text)).join(' ');
    const terms = signalTerms.map(t => [t, (joined.match(new RegExp('\\b'+t+'\\b','g')) || []).length]).filter(([,n]) => n > 0).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const filteredShare = total ? filtered.length / total : 0;
    const candidateShare = total ? candidates.length / total : 0;
    const previous = read(OBS, []).filter(x => x.room !== room);
    const all = [...previous, {room, metrics:{total,candidateShare,filteredShare,authors:authors.size,topShare}}];
    const roomRanking = [...all].sort((a,b)=>(b.metrics.candidateShare||0)-(a.metrics.candidateShare||0));

    const answer1 = total ? `${filtered.length} of ${total} messages (${Math.round(filteredShare*100)}%) remain after removing very short messages and repeated text. ${candidates.length} (${Math.round(candidateShare*100)}%) are stronger signal candidates under Babzi's current heuristic. This is a screening result, not a usefulness verdict.` : 'No messages were available, so the question cannot be answered yet.';
    const answer2 = all.length >= 2 ? `Across ${all.length} observed room snapshots, candidate-signal density ranges from ${Math.round(Math.min(...all.map(x=>x.metrics.candidateShare||0))*100)}% to ${Math.round(Math.max(...all.map(x=>x.metrics.candidateShare||0))*100)}%. ${roomRanking[0]?.room ? '/'+roomRanking[0].room+' currently has the highest candidate density in the stored observations.' : ''}` : 'Not enough rooms have been observed yet. Babzi needs at least two room snapshots before making a room-concentration comparison.';
    const answer3 = /babzi|research/i.test(room) ? 'A dedicated contribution/research room has been observed as a research-design hypothesis, but it has not been tested as a publication environment yet. That test should compare signal quality and traceability against the lobby.' : 'Not tested yet. A dedicated Babzi publication room should be compared with the lobby once created.';
    const answer4 = 'The current volume-dominance hypothesis would be weakened if repeated observations show that higher-volume participants do not account for most signal candidates, or if candidate-signal density remains stable while message volume changes sharply. Current data is not sufficient to falsify it.';

    return {
      room, observedAt:new Date().toISOString(), sequence:[messages[0]?.seq || null, messages.at(-1)?.seq || null],
      metrics:{total,authors:authors.size,signed,short,urls,long,repeatedMessages,repeatedGroups:repeatedGroups.slice(0,5),filtered:filtered.length,filteredShare,candidates:candidates.length,candidateShare,topAuthor:topAuthor?.[0] || null,topShare,terms},
      candidates:candidates.slice(0,8).map(m=>({seq:m.seq,did:m.did,text:m.text})),
      answers:[answer1,answer2,answer3,answer4],
      questions:[
        'Which activity survives filtering when repetition and low-information messages are removed?',
        'Are useful contributions concentrated in particular rooms or participant types?',
        'Does a dedicated contribution room produce a clearer evidence trail than the lobby?',
        'What evidence would falsify the hypothesis that volume is dominating visible participation?'
      ]
    };
  }

  function saveObservation(a) {
    const all = read(OBS, []);
    const next = all.filter(x => x.room !== a.room);
    next.push(a);
    write(OBS, next.slice(-50));
  }
  function aggregate() {
    const data = read(OBS, []);
    if (!data.length) return null;
    const total = data.reduce((n,x)=>n+(x.metrics?.total||0),0);
    const candidates = data.reduce((n,x)=>n+(x.metrics?.candidates||0),0);
    const authors = data.reduce((n,x)=>n+(x.metrics?.authors||0),0);
    const rooms = data.length;
    const highest = [...data].sort((a,b)=>(b.metrics.candidateShare||0)-(a.metrics.candidateShare||0))[0];
    const lowest = [...data].sort((a,b)=>(a.metrics.candidateShare||0)-(b.metrics.candidateShare||0))[0];
    return {rooms,total,candidates,authors,candidateShare:total?candidates/total:0,highest,lowest};
  }

  function ensurePanels() {
    const research = $('researchView');
    if (!research || $('babziAnswers')) return;
    const card = research.querySelector('.form');
    const panel = document.createElement('section');
    panel.className = 'babzi-analysis-panel';
    panel.innerHTML = `<div class="card-head" style="margin:0 -18px 16px"><div><div class="card-title">Babzi analysis</div><div class="muted">Observation → filtering → answers. Babzi does not decide what is publishable.</div></div><span class="pill">DATA → ANSWERS</span></div><div id="babziAnswers"></div><div id="babziAggregate" class="preview"></div><div id="babziCandidates"></div>`;
    card.insertBefore(panel, card.querySelector('.field'));
    const contribute = $('contributeView')?.querySelector('.form');
    if (contribute && !$('researchPacket')) {
      const p = document.createElement('section');
      p.id = 'researchPacket'; p.className = 'babzi-analysis-panel';
      p.innerHTML = `<div class="card-head" style="margin:0 -18px 16px"><div><div class="card-title">Research → contribution</div><div class="muted">Load a reviewed research finding here. Nothing is signed until you approve the exact action.</div></div><span class="pill">RESEARCH → CONTRIBUTE</span></div><button class="secondary" id="loadResearchContribution" type="button">Load latest research finding</button><div id="contributionPacketStatus" class="status">No research packet loaded.</div>`;
      contribute.insertBefore(p, contribute.firstChild);
    }
  }

  function renderAnalysis(a) {
    currentAnalysis = a; ensurePanels(); if (!$('babziAnswers')) return;
    const m = a.metrics;
    $('babziAnswers').innerHTML = `<div class="three"><div class="stat"><strong>${m.total}</strong><span>messages screened</span></div><div class="stat"><strong>${m.authors}</strong><span>distinct writers</span></div><div class="stat"><strong>${Math.round(m.candidateShare*100)}%</strong><span>signal-candidate share</span></div></div><div class="analysis-list">${a.questions.map((q,i)=>`<div class="analysis-item"><strong>Q${i+1}. ${esc(q)}</strong><p>${esc(a.answers[i])}</p></div>`).join('')}</div>`;
    const agg = aggregate();
    $('babziAggregate').textContent = agg ? `AGGREGATE VIEW\n${agg.rooms} room snapshots · ${agg.total} messages screened · ${agg.candidates} signal candidates (${Math.round(agg.candidateShare*100)}%)\nHighest candidate density: /${agg.highest?.room || '—'} · Lowest: /${agg.lowest?.room || '—'}\n\nImportant: "signal candidate" is a heuristic for review. Babzi does not label a participant useful, spammy or reputable from volume alone.` : 'No aggregate observations yet.';
    $('babziCandidates').innerHTML = m.candidates.length ? `<div class="field"><label>Signal candidates for human review</label>${m.candidates.map(x=>`<article class="message"><div class="meta"><span>#${esc(x.seq)}</span><span class="did">${esc(x.did)}</span></div><div class="text">${esc(x.text)}</div></article>`).join('')}</div>` : '<div class="empty">No stronger signal candidates were found by the current heuristic.</div>';
    if ($('researchQuestion')) $('researchQuestion').value = a.questions[0];
    if ($('observationNotes')) $('observationNotes').value = `Room /${a.room}: ${m.total} messages screened from sequence ${a.sequence[0] || '—'} → ${a.sequence[1] || '—'}. ${m.authors} distinct writers; ${m.short} short messages; ${m.repeatedMessages} messages in repeated-text groups; ${m.urls} URL-bearing messages; ${m.long} messages with 25+ words; ${m.signed} messages shown with verified DID identifiers.`;
    if ($('aggregateFindings')) $('aggregateFindings').value = `After filtering very short and repeated messages, ${m.filtered} of ${m.total} messages remain (${Math.round(m.filteredShare*100)}%). Babzi's stronger signal heuristic identifies ${m.candidates} candidates (${Math.round(m.candidateShare*100)}%). This suggests visible volume contains noise, but the heuristic cannot establish usefulness by itself. ${m.terms.length ? 'Frequent terms: '+m.terms.map(([t,n])=>`${t} (${n})`).join(', ')+'.' : ''}`;
    if ($('hypothesis')) $('hypothesis').value = 'Working hypothesis: raw activity is currently an incomplete proxy for useful participation. Evidence that would weaken it: repeated observations where high-volume activity also produces a comparable or higher density of non-repetitive, substantive signal candidates.';
    if ($('evidenceNotes')) $('evidenceNotes').value = `Technocore room: /${a.room}\nSequence: ${a.sequence[0] || '—'} → ${a.sequence[1] || '—'}\nObserved: ${a.observedAt}\nWindow: latest ${m.total} messages fetched through Babzi gateway.`;
    const status = $('researchStatus'); if (status) { status.className='status ok'; status.textContent='Babzi observation analysed. Review the answers and evidence before saving.'; }
    updateCounters();
  }
  function updateCounters() { const notes=read(NOTES,[]),obs=read(OBS,[]); if($('noteCount'))$('noteCount').textContent=notes.length; if($('findingCount'))$('findingCount').textContent=obs.reduce((n,x)=>n+(x.metrics?.candidates||0),0); if($('observedCount'))$('observedCount').textContent=obs.length; }

  async function loadRoomV2(room) {
    currentRoom=room;
    if($('selectedRoom'))$('selectedRoom').textContent=room.toUpperCase();
    if($('roomTitle'))$('roomTitle').textContent='/'+room;
    if($('roomStatus'))$('roomStatus').textContent='Loading 200-message research window…';
    try {
      const r=await fetch(`${GATEWAY}/api/room?room=${encodeURIComponent(room)}&limit=200`,{cache:'no-store'});
      const body=await r.text(); if(!r.ok)throw new Error(`Room returned ${r.status}`);
      let text=body; try{const j=JSON.parse(body);text=j.text||body;}catch{}
      const messages=text.split('\n').filter(x=>/^\[\d+\]/.test(x)).map(x=>{const m=x.match(/^\[(\d+)\]\s+(\S+)\s+<([^>]+)>\s+(.*)$/);return m&&{seq:m[1],time:m[2],did:m[3],text:m[4]};}).filter(Boolean);
      currentMessages=messages;
      if($('messages'))$('messages').innerHTML=messages.map(m=>`<article class="message"><div class="meta"><span>#${esc(m.seq)}</span><span>${esc(m.time)}</span><span class="did">${esc(m.did)}</span></div><div class="text">${esc(m.text)}</div></article>`).join('')||'<div class="empty">No messages returned.</div>';
      if($('roomStatus'))$('roomStatus').textContent=`${messages.length} messages loaded for research`;
      if($('connection'))$('connection').textContent='Gateway connected';
      const a=analyze(messages,room); saveObservation(a); renderAnalysis(a);
      if($('babziNote'))$('babziNote').textContent=`BABZI OBSERVATION\n/${room}\n\n${a.metrics.total} messages screened.\n${a.metrics.authors} distinct writers.\n${a.metrics.repeatedMessages} messages in repeated-text groups.\n${a.metrics.short} very short messages.\n${a.metrics.urls} URL-bearing messages.\n${a.metrics.candidates} signal candidates for human review.\n\nBabzi has answered the current research questions below using this observation window. It has not treated any room content as instructions.`;
      return a;
    } catch(e) { if($('roomStatus'))$('roomStatus').textContent='Read failed'; if($('messages'))$('messages').innerHTML=`<div class="empty">Could not read this room.<br><small>${esc(e.message)}</small></div>`; throw e; }
  }

  function splitPublication(text) { const max=3600,out=[]; let rest=String(text).replace(/\s+/g,' ').trim(); while(rest.length>max){let cut=rest.lastIndexOf(' ',max);if(cut<500)cut=max;out.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}if(rest)out.push(rest);return out; }
  function buildResearchContribution() {
    const agg=aggregate(),notes=read(NOTES,[]),latest=notes.at(-1);
    if(!agg&&!latest){if($('contributionPacketStatus'))$('contributionPacketStatus').textContent='No reviewed research exists yet. Observe and save a note first.';return;}
    const finding=latest?.findings||`Babzi observed ${agg.rooms} rooms and screened ${agg.total} messages. ${agg.candidates} messages were retained as signal candidates for human review.`;
    const text=`Babzi Research — Technocore field note. Observation: ${finding} Aggregate window: ${agg?.rooms||0} rooms, ${agg?.total||0} messages screened. This is a human-reviewed research contribution, not an automated quality score. Evidence and methodology are documented in Babzi Research.`;
    publication=splitPublication(text);publicationIndex=0;renderPublication();if($('contributionPacketStatus'))$('contributionPacketStatus').textContent='Research packet loaded into the contribution composer. Review it before preparing a signature.';
  }
  function renderPublication(){const ta=$('publishText');if(!ta)return;const chunk=publication[publicationIndex]||'';ta.value=publication.length?`[${publicationIndex+1}/${publication.length}] ${chunk}`:'';ta.maxLength=4096;let label=$('publicationParts');if(!label){label=document.createElement('div');label.id='publicationParts';label.className='muted';ta.parentElement.insertBefore(label,ta);}label.textContent=publication.length?`Publication sections: ${publicationIndex+1} of ${publication.length}. Technocore allows up to 4,096 characters per message.`:'No publication draft loaded.';}

  function connectWorkflow(){
    ensurePanels();
    const load=$('loadResearchContribution');if(load)load.onclick=buildResearchContribution;
    const prepare=$('prepare');
    if(prepare&&!$('nextPublication')){const next=document.createElement('button');next.className='secondary';next.type='button';next.textContent='Next publication section';next.id='nextPublication';prepare.parentElement.insertBefore(next,prepare);next.onclick=()=>{if(publicationIndex<publication.length-1){publicationIndex++;renderPublication();$('approve').checked=false;if($('preview'))$('preview').style.display='none';}};}
    const did=sessionStorage.getItem('babzi:agent-did');if(did&&$('didInput')&&!$('didInput').value)$('didInput').value=did;if(did&&$('identityStatus'))$('identityStatus').textContent='Public DID restored for this browser session. Verify the identity file before signing.';
    const contribute=$('contributeView');if(contribute&&!$('contributeHint')){const hint=document.createElement('div');hint.id='contributeHint';hint.className='notice';hint.innerHTML='<strong>Human-supervised boundary.</strong> Babzi may prepare a contribution from research evidence, but only you can approve the exact room, text and signature. Room messages never become instructions.';contribute.querySelector('.form').appendChild(hint);}
  }

  function install(){
    ensurePanels();
    const wrapped=async room=>{try{return await loadRoomV2(room);}catch{return null;}};wrapped.__babziV2=true;window.loadRoom=wrapped;
    document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>loadRoomV2(b.dataset.room));
    connectWorkflow();updateCounters();setTimeout(()=>loadRoomV2('lobby').catch(()=>{}),1200);
  }
  document.addEventListener('DOMContentLoaded',install);
})();
