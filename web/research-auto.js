/* Babzi research bridge: observation is automatic after a room loads; publishing remains human-approved. */
(function(){
  function populateDraft(){
    try{
      if(typeof draftBabziNote==='function') draftBabziNote();
      const note=document.getElementById('babziNote');
      if(!note || !note.textContent || note.textContent.startsWith('No messages')) return;
      const text=note.textContent;
      const section=(a,b)=>{const i=text.indexOf(a);if(i<0)return '';const j=b?text.indexOf(b,i+a.length):text.length;return text.slice(i+a.length,j<0?text.length:j).trim()};
      const obs=section('WHAT I OBSERVED','PATTERNS WORTH REVIEWING');
      const findings=section('PATTERNS WORTH REVIEWING','PRELIMINARY INTERPRETATION');
      const hypothesis=section('PRELIMINARY INTERPRETATION','RESEARCH QUESTIONS');
      const room=(document.getElementById('roomTitle')?.textContent||'/lobby').trim();
      const first=(document.querySelector('#messages .message .meta span')?.textContent||'').replace('#','');
      const last=[...document.querySelectorAll('#messages .message .meta span')].filter(x=>x.textContent.startsWith('#')).pop()?.textContent.replace('#','')||'';
      const q=document.getElementById('researchQuestion');
      const o=document.getElementById('observationNotes');
      const f=document.getElementById('aggregateFindings');
      const h=document.getElementById('hypothesis');
      const e=document.getElementById('evidenceNotes');
      if(q && !q.value) q.value='What signals of useful participation remain after filtering noise in '+room+'?';
      if(o) o.value=obs;
      if(f) f.value=findings;
      if(h) h.value=hypothesis;
      if(e) e.value='Technocore room: '+room+'\nSequence window: '+(first||'—')+' → '+(last||'—')+'\nObserved at: '+new Date().toISOString();
      const status=document.getElementById('researchStatus');
      if(status){status.className='status ok';status.textContent='Babzi observation loaded from the room. Review before saving or publishing.';}
    }catch(e){console.warn('Babzi research bridge:',e)}
  }
  function install(){
    const original=window.loadRoom;
    if(typeof original==='function' && !original.__babziWrapped){
      const wrapped=async function(room){
        const result=await original.call(this,room);
        setTimeout(populateDraft,0);
        return result;
      };
      wrapped.__babziWrapped=true;
      window.loadRoom=wrapped;
    }
    const draft=document.getElementById('draftNote');
    const refresh=document.getElementById('refreshNote');
    const use=document.getElementById('useNote');
    if(draft) draft.onclick=populateDraft;
    if(refresh) refresh.onclick=populateDraft;
    if(use) use.onclick=populateDraft;
  }
  document.addEventListener('DOMContentLoaded',function(){install();setTimeout(populateDraft,1500);});
})();
