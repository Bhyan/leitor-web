(() => {
  if (window.__leitorWebLoaded) return;
  window.__leitorWebLoaded = true;
  const api = globalThis.browser || globalThis.chrome;
  const COLORS = ['#ffe66d','#b7efc5','#b9dcff','#ffc5dc','#ffd0a6','#ddc7ff'];
  let host, shadow, reader, content, bar, key, selectionRange = null, currentSettings;
  let customColor = "#fff176";
  const defaultSettings = { theme: 'light', size: 18, align: 'left' };
  const storage = {
    async get(k) { const obj = await api.storage.local.get(k); return obj[k]; },
    async set(k,v) { await api.storage.local.set({[k]:v}); }
  };
  const pageKey = () => { const url = new URL(location.href); url.hash=''; return 'leitor:notes:' + url.href; };
  const notes = async () => (await storage.get(key)) || [];
  const saveNotes = async data => storage.set(key,data);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function extract() {
    const candidates = [...document.querySelectorAll('article,main,[role="main"],.article-content,.entry-content,.post-content')];
    candidates.push(document.body);
    const score = el => {
      const paragraphs = [...el.querySelectorAll('p')].reduce((sum,p)=>sum + (p.textContent||'').trim().length,0);
      const links = [...el.querySelectorAll('a')].reduce((sum,a)=>sum+(a.textContent||'').length,0);
      return paragraphs - links * .3;
    };
    candidates.sort((a,b)=>score(b)-score(a));
    const source = candidates[0] || document.body;
    const clone = source.cloneNode(true);
    clone.querySelectorAll('script,style,noscript,iframe,form,button,nav,footer,header,aside,[aria-hidden="true"],svg').forEach(e=>e.remove());
    clone.querySelectorAll('*').forEach(el=>{
      for (const attr of [...el.attributes]) {
        if (/^on/i.test(attr.name) || attr.name==='style' || attr.name==='srcdoc' || attr.name==='contenteditable') el.removeAttribute(attr.name);
        if (['href','src','poster'].includes(attr.name)) {
          const value = attr.value.trim();
          if (/^(javascript|data):/i.test(value)) el.removeAttribute(attr.name);
          else if (value && !value.startsWith('#')) {
            try { el.setAttribute(attr.name,new URL(value,location.href).href); } catch(_) { el.removeAttribute(attr.name); }
          }
        }
      }
    });
    return clone;
  }
  const css = `
    :host{all:initial}*{box-sizing:border-box}
    .reader{--bg:#fff;--fg:#222;--panel:#f3f4f6;--border:#d8dbe0;--muted:#666;position:fixed;inset:0;overflow:auto;background:var(--bg);color:var(--fg);font:14px system-ui,sans-serif;z-index:2147483647}
    .reader.dark{--bg:#17191c;--fg:#f6f6f6;--panel:#26292e;--border:#454951;--muted:#c1c5cc}
    .bar{position:sticky;top:0;z-index:15;background:var(--panel);border-bottom:1px solid var(--border);padding:9px 14px;display:flex;flex-direction:column;gap:8px;width:100%;min-width:0;max-width:100%;overflow:visible}.bar-row{display:flex;flex-wrap:wrap;gap:7px;align-items:center;min-width:0;width:100%}.color-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0;width:100%;max-width:100%}.color-tools>*{flex:0 0 auto}.custom-color-label{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;max-width:100%;font:12px system-ui,sans-serif}.bar .color-tools .color-input{flex:0 0 36px}
    button,input,textarea{font:inherit}button{border:1px solid var(--border);border-radius:7px;background:var(--bg);color:var(--fg);padding:7px 9px;cursor:pointer}button:hover{filter:brightness(.92)}button:focus-visible{outline:2px solid #508bff}
    .color{width:27px;height:27px;padding:0;border-radius:50%;border:2px solid #777}.color[aria-pressed="true"]{outline:2px solid var(--fg);outline-offset:2px}
    .color-input{display:block;flex:0 0 32px;width:32px;min-width:32px;height:29px;border:0;background:none;cursor:pointer}.spacer{flex:1 1 16px;min-width:0}.hint{font-size:12px;color:var(--muted)}
    .content{max-width:820px;margin:38px auto 100px;padding:0 28px;font-family:Georgia,'Times New Roman',serif;font-size:var(--reader-size,18px)!important;line-height:1.75;color:var(--fg)!important;text-align:var(--reader-align,left)!important;overflow-wrap:anywhere}
    .content :is(*,font){color:var(--fg)!important;text-align:inherit!important;font-family:Georgia,'Times New Roman',serif!important;font-size:var(--reader-size,18px)!important;line-height:1.75!important}
    .content :is(h1,h2,h3,h4,h5,h6){line-height:1.3!important;margin:1.4em 0 .65em}
    .content h1{font-size:calc(var(--reader-size,18px) * 1.9)!important}.content h2{font-size:calc(var(--reader-size,18px) * 1.5)!important}.content h3{font-size:calc(var(--reader-size,18px) * 1.25)!important}.content h4{font-size:calc(var(--reader-size,18px) * 1.1)!important}
    .content :is(sup,sub){font-size:calc(var(--reader-size,18px) * .75)!important}
    .content :is(table,tbody,thead,tfoot,tr,td,th,p,div,span,font){text-align:inherit!important}
    .content :is(img,video){max-width:100%;height:auto}
    .content p{margin:0 0 1.15em}.content img,.content video{max-width:100%;height:auto}.content table{display:block;overflow:auto;border-collapse:collapse}.content td,.content th{border:1px solid var(--border);padding:7px}
    .content a{color:#5c9be8!important}.content mark.reader-highlight{color:#202020!important;cursor:pointer;border-radius:2px;text-align:inherit!important}.content mark.reader-highlight *{color:#202020!important}.content .comment-dot{color:var(--fg)!important;cursor:pointer;font-size:12px!important}
    .panel{position:fixed;right:0;top:0;height:100%;width:355px;max-width:95vw;background:var(--panel);border-left:1px solid var(--border);z-index:30;overflow:auto;padding:17px;box-shadow:-5px 0 24px #0002}
    .panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:15px}.panel-head strong{font-size:17px}.item{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;margin:10px 0}.item p{margin:9px 0;overflow-wrap:anywhere;line-height:1.45}.quote{border-left:5px solid var(--note-color);padding:7px;background:var(--panel)}.actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.danger{color:#d94343!important}.muted{color:var(--muted)}
    .popup{position:fixed;z-index:45;width:310px;max-width:calc(100vw - 20px);background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:12px;box-shadow:0 8px 28px #0005;font:14px system-ui,sans-serif}.popup textarea{width:100%;min-height:88px;resize:vertical;margin:9px 0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);color:var(--fg)}.popup .actions{justify-content:flex-end;flex-wrap:wrap}.popup .popup-colors{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-top:10px}.popup .popup-colors .color{flex:0 0 27px}.popup .popup-colors .color-input{width:34px;height:30px;flex:0 0 34px}.popup .popup-colors label{display:flex;align-items:center;gap:5px;font-size:12px}.popup .popup-colors button[aria-pressed="true"]{outline:2px solid var(--fg);outline-offset:2px}.popup .actions [data-popup="delete"]{margin-right:auto;border-color:#b94040;color:#d94343;font-weight:600}.popup .actions [data-popup="delete"]:hover{background:#ffe9e9;color:#9b2525}
    .flash{outline:3px solid #4b91ef;outline-offset:3px}
    @media(max-width:600px){.content{padding:0 17px;margin-top:24px}.bar{padding:7px}.hint{display:none}.panel{width:100%;max-width:100%}}
  `;
  function applySettings() {
    reader.classList.toggle('dark',currentSettings.theme==='dark');
    content.style.setProperty('--reader-size',currentSettings.size+'px');
    content.style.setProperty('--reader-align',currentSettings.align);
    bar.querySelector('[data-action="theme"]').textContent = currentSettings.theme==='dark' ? '☀ Tema claro' : '☾ Tema escuro';
    bar.querySelector('[data-action="align"]').textContent = currentSettings.align==='left' ? '☷ Justificar' : '⇤ Alinhar à esquerda';
    storage.set('leitor:settings',currentSettings).catch(console.error);
  }
  function textNodes(root, includeMarks=true) {
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
      if(!n.nodeValue.length || n.parentElement?.closest('script,style,.comment-dot')) return NodeFilter.FILTER_REJECT;
      if(!includeMarks && n.parentElement?.closest('mark.reader-highlight')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const out=[];while(walker.nextNode())out.push(walker.currentNode);return out;
  }
  function offsetsForRange(range) {
    const ns=textNodes(content), full=ns.map(n=>n.nodeValue).join('');
    let cursor=0,start=null,end=null;
    for(const n of ns){
      if(n===range.startContainer)start=cursor+range.startOffset;
      if(n===range.endContainer)end=cursor+range.endOffset;
      cursor+=n.nodeValue.length;
    }
    if(start===null||end===null||end<=start)return null;
    return {start,end,quote:full.slice(start,end),prefix:full.slice(Math.max(0,start-50),start),suffix:full.slice(end,end+50)};
  }
  function rangeAt(start,end) {
    const ns=textNodes(content);let pos=0,a=null,b=null;
    for(const n of ns){const next=pos+n.nodeValue.length;
      if(a===null && start>=pos && start<next)a=[n,start-pos];
      if(end>pos && end<=next){b=[n,end-pos];break;}
      pos=next;
    }
    if(!a||!b)return null;
    const r=document.createRange();r.setStart(...a);r.setEnd(...b);return r;
  }
  function findRange(note) {
    const ns=textNodes(content), full=ns.map(n=>n.nodeValue).join('');
    if(note.start>=0 && full.slice(note.start,note.start+note.quote.length)===note.quote) return rangeAt(note.start,note.start+note.quote.length);
    let pos=0,best=-1,score=-1;
    while((pos=full.indexOf(note.quote,pos))!==-1){
      const before=full.slice(Math.max(0,pos-(note.prefix||'').length),pos);
      const after=full.slice(pos+note.quote.length,pos+note.quote.length+(note.suffix||'').length);
      const s=(note.prefix&&before.endsWith(note.prefix)?2:0)+(note.suffix&&after.startsWith(note.suffix)?2:0);
      if(s>score){best=pos;score=s;}pos++;
    }
    return best<0?null:rangeAt(best,best+note.quote.length);
  }
  function wrapRange(range,note) {
    if(!range || !range.toString().trim())return null;
    // Do not nest highlights; overlapping selections are intentionally ignored.
    if(range.commonAncestorContainer.parentElement?.closest('mark.reader-highlight'))return null;
    const mark=document.createElement('mark');mark.className='reader-highlight';mark.dataset.noteId=note.id;mark.style.backgroundColor=note.color;mark.title=note.comment||'Clique para comentar';
    try{range.surroundContents(mark);}catch(_){
      try{const frag=range.extractContents();mark.appendChild(frag);range.insertNode(mark);}catch(e){return null;}
    }
    if(note.comment) addDot(mark,note);
    return mark;
  }
  function addDot(mark,note) {
    const dot=document.createElement('sup');dot.className='comment-dot';dot.dataset.noteId=note.id;dot.textContent=' 💬';dot.title=note.comment;mark.after(dot);
  }
  function removeMark(id) {
    for(const el of content.querySelectorAll('mark.reader-highlight')){
      if(el.dataset.noteId!==id)continue;
      const parent=el.parentNode;while(el.firstChild)parent.insertBefore(el.firstChild,el);el.remove();parent.normalize();
    }
    for(const dot of content.querySelectorAll('.comment-dot'))if(dot.dataset.noteId===id)dot.remove();
  }
  async function restore() {
    const list=await notes();
    // Right-to-left keeps stored text offsets stable while wrapping.
    for(const note of [...list].sort((a,b)=>(b.start||0)-(a.start||0))){
      const range=findRange(note);if(range)wrapRange(range,note);
    }
  }
  function dismissPopup(){shadow?.querySelector('.popup')?.remove();}
  function popupPosition(popup,rect){
    const viewportWidth=reader.clientWidth, viewportHeight=reader.clientHeight;
    const width=popup.getBoundingClientRect().width || 310;
    const height=popup.getBoundingClientRect().height || 280;
    popup.style.left=Math.max(10,Math.min(rect.left,viewportWidth-width-10))+'px';
    popup.style.top=Math.max(10,Math.min(rect.bottom+8,viewportHeight-height-10))+'px';
  }
  function colorControls(){
    return '<div class="popup-colors"><span class="hint">Cor da marcação:</span>'+
      COLORS.map(c=>`<button type="button" class="color" data-popup-color="${c}" style="background:${c}" title="Marcar com ${c}" aria-label="Marcar com ${c}"></button>`).join('')+
      '<label>🎨 <input type="color" class="color-input" data-popup-custom aria-label="Cor personalizada" value="'+customColor+'"></label></div>';
  }
  function showSelectionPopup(){
    if(!selectionRange || !content.contains(selectionRange.startContainer) || !selectionRange.toString().trim())return;
    dismissPopup();
    const popup=document.createElement('div');popup.className='popup';
    popup.innerHTML='<strong>Nova marcação</strong>'+colorControls()+'<textarea aria-label="Comentário" placeholder="Comentário opcional..."></textarea><div class="actions"><button data-popup="cancel">Cancelar</button><button data-popup="save">Salvar marcação</button></div>';
    reader.append(popup);
    popupPosition(popup,selectionRange.getBoundingClientRect());
    popup.addEventListener('pointerdown',e=>{if(e.target.closest('button,input'))e.preventDefault();},true);
    popup.addEventListener('click',async e=>{
      const chosen=e.target.closest('[data-popup-color]');
      if(chosen){await createHighlight(chosen.dataset.popupColor,popup.querySelector('textarea').value);return;}
      const action=e.target.closest('button')?.dataset.popup;
      if(action==='cancel'){dismissPopup();selectionRange=null;}
      if(action==='save')await createHighlight(customColor,popup.querySelector('textarea').value);
    });
    popup.querySelector('[data-popup-custom]').addEventListener('input',e=>{customColor=e.target.value;});
    popup.querySelector('[data-popup-custom]').addEventListener('change',async e=>{
      customColor=e.target.value;
      await createHighlight(customColor,popup.querySelector('textarea').value);
    });
  }
  function showPopup(mark,id){
    dismissPopup();
    const popup=document.createElement('div');popup.className='popup';
    popup.innerHTML='<strong>Comentário da marcação</strong>'+colorControls()+'<textarea aria-label="Comentário" placeholder="Comentário opcional..."></textarea><div class="actions"><button data-popup="delete" title="Excluir marcação e comentário">🗑 Excluir</button><button data-popup="cancel">Cancelar</button><button data-popup="save">Salvar</button></div>';
    reader.append(popup);popupPosition(popup,mark.getBoundingClientRect());
    const textarea=popup.querySelector('textarea');
    notes().then(list=>{const note=list.find(n=>n.id===id);if(note&&popup.isConnected){textarea.value=note.comment||'';popup.querySelectorAll('[data-popup-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.popupColor===note.color)));}}).catch(console.error);
    async function updateColor(color){
      const list=await notes(),note=list.find(n=>n.id===id);if(!note)return;
      note.color=color;note.comment=textarea.value.trim();await saveNotes(list);
      mark.style.backgroundColor=color;mark.title=note.comment||'Clique para comentar';
      let dot=[...content.querySelectorAll('.comment-dot')].find(d=>d.dataset.noteId===id);
      if(note.comment){if(!dot)addDot(mark,note);else dot.title=note.comment;}else dot?.remove();
      popup.querySelectorAll('[data-popup-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.popupColor===color)));
      await refreshPanel();
    }
    popup.addEventListener('click',async e=>{
      const chosen=e.target.closest('[data-popup-color]');if(chosen){await updateColor(chosen.dataset.popupColor);return;}
      const action=e.target.closest('button')?.dataset.popup;
      if(action==='cancel'){dismissPopup();return;}
      if(action==='delete'){await deleteNote(id);dismissPopup();return;}
      if(action==='save'){
        const list=await notes(),note=list.find(n=>n.id===id);if(!note)return;
        note.comment=textarea.value.trim();await saveNotes(list);
        mark.title=note.comment||'Clique para comentar';
        let dot=[...content.querySelectorAll('.comment-dot')].find(d=>d.dataset.noteId===id);
        if(note.comment){if(!dot)addDot(mark,note);else dot.title=note.comment;}else dot?.remove();
        dismissPopup();await refreshPanel();
      }
    });
    popup.querySelector('[data-popup-custom]').addEventListener('input',e=>{customColor=e.target.value;});
    popup.querySelector('[data-popup-custom]').addEventListener('change',async e=>{customColor=e.target.value;await updateColor(customColor);});
  }
  function rememberSelection(){
    const sel=shadow.getSelection?.() || document.getSelection();
    if(sel && !sel.isCollapsed && sel.rangeCount && content.contains(sel.anchorNode) && content.contains(sel.focusNode)){
      selectionRange=sel.getRangeAt(0).cloneRange();return true;
    }
    return false;
  }
  async function createHighlight(color,comment=''){
    const range=selectionRange?.cloneRange();
    if(!range || !content.contains(range.startContainer) || !content.contains(range.endContainer))return;
    const anchor=offsetsForRange(range);
    if(!anchor || !anchor.quote.trim())return;
    const list=await notes();
    if(list.some(n=>!(anchor.end<=n.start || anchor.start>=n.end)))return;
    const note={id:globalThis.crypto?.randomUUID?.() || Date.now()+'-'+Math.random(),...anchor,color,comment:comment.trim(),createdAt:Date.now()};
    const mark=wrapRange(range,note);selectionRange=null;
    (shadow.getSelection?.() || document.getSelection())?.removeAllRanges();
    if(!mark)return;
    list.push(note);await saveNotes(list);await refreshPanel();dismissPopup();
  }
  async function deleteNote(id){
    const list=await notes();await saveNotes(list.filter(n=>n.id!==id));removeMark(id);await refreshPanel();
  }
  async function refreshPanel(){
    const panel=shadow.querySelector('.panel');if(!panel)return;
    const listEl=panel.querySelector('.annotation-list');listEl.replaceChildren();
    const list=await notes();
    const counter=document.createElement('p');counter.className='muted';counter.textContent=list.length+' marcação(ões) nesta página';listEl.append(counter);
    if(!list.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Nenhuma marcação ainda.';listEl.append(empty);return;}
    for(const note of list){
      const item=document.createElement('div');item.className='item';
      const title=document.createElement('strong');title.textContent=new Date(note.createdAt||Date.now()).toLocaleString('pt-BR');
      const quote=document.createElement('p');quote.className='quote';quote.style.setProperty('--note-color',note.color);quote.textContent=note.quote;
      const comment=document.createElement('p');comment.textContent=note.comment||'Sem comentário';comment.className=note.comment?'':'muted';
      const actions=document.createElement('div');actions.className='actions';
      const go=document.createElement('button');go.textContent='Ir ao texto';go.addEventListener('click',()=>{
        const mark=[...content.querySelectorAll('mark.reader-highlight')].find(m=>m.dataset.noteId===note.id);
        if(mark){panel.remove();mark.scrollIntoView({behavior:'smooth',block:'center'});mark.classList.add('flash');mark.addEventListener('animationend',()=>mark.classList.remove('flash'),{once:true});setTimeout(()=>mark?.classList.remove('flash'),1600);}
      });
      const edit=document.createElement('button');edit.textContent='Comentário';edit.addEventListener('click',()=>{
        const mark=[...content.querySelectorAll('mark.reader-highlight')].find(m=>m.dataset.noteId===note.id);
        if(mark){panel.remove();mark.scrollIntoView({block:'center'});showPopup(mark,note.id);}
      });
      const del=document.createElement('button');del.textContent='Excluir';del.className='danger';del.addEventListener('click',async()=>{await deleteNote(note.id);});
      actions.append(go,edit,del);item.append(title,quote,comment,actions);listEl.append(item);
    }
  }
  async function togglePanel(){
    const existing=shadow.querySelector('.panel');if(existing){existing.remove();return;}
    dismissPopup();const panel=document.createElement('aside');panel.className='panel';panel.setAttribute('aria-label','Painel de anotações');
    panel.innerHTML='<div class="panel-head"><strong>📝 Minhas anotações</strong><button data-close-panel aria-label="Fechar painel">✕</button></div><div class="annotation-list"></div>';
    panel.querySelector('[data-close-panel]').addEventListener('click',()=>panel.remove());reader.append(panel);await refreshPanel();
  }
  function onKey(e){if(e.key==='Escape'){if(shadow.querySelector('.popup'))dismissPopup();else if(shadow.querySelector('.panel'))shadow.querySelector('.panel').remove();else close();}}
  function close(){document.removeEventListener('keydown',onKey,true);host?.remove();host=shadow=reader=content=bar=null;selectionRange=null;}
  async function open(){
    if(host){close();return;}
    key=pageKey();currentSettings={...defaultSettings,...(await storage.get('leitor:settings')||{})};
    const extracted=extract();
    host=document.createElement('div');host.id='leitor-web-root';host.style.cssText='all:initial;position:fixed;inset:0;z-index:2147483647';
    shadow=host.attachShadow({mode:'open'});
    const style=document.createElement('style');style.textContent=css;shadow.append(style);
    reader=document.createElement('div');reader.className='reader';shadow.append(reader);
    bar=document.createElement('div');bar.className='bar';
    bar.innerHTML='<div class="bar-row"><button data-action="close">✕ Sair</button><button data-action="theme"></button><button data-action="smaller">A−</button><button data-action="larger">A+</button><button data-action="align"></button><button data-action="panel">📝 Anotações</button></div>';
    reader.append(bar);
    content=document.createElement('main');content.className='content';content.append(extracted);reader.append(content);
    document.documentElement.append(host);applySettings();
    // Capture selection before clicking toolbar causes the browser to collapse it.
    content.addEventListener('mouseup',()=>{if(rememberSelection())showSelectionPopup();});
    content.addEventListener('keyup',()=>{if(rememberSelection())showSelectionPopup();});
    bar.addEventListener('click',async e=>{
      const btn=e.target.closest('button');if(!btn)return;
      switch(btn.dataset.action){
        case 'close':close();break;
        case 'theme':currentSettings.theme=currentSettings.theme==='dark'?'light':'dark';applySettings();break;
        case 'smaller':currentSettings.size=Math.max(12,currentSettings.size-1);applySettings();break;
        case 'larger':currentSettings.size=Math.min(36,currentSettings.size+1);applySettings();break;
        case 'align':currentSettings.align=currentSettings.align==='left'?'justify':'left';applySettings();break;
        case 'panel':await togglePanel();break;
      }
    });
    content.addEventListener('click',e=>{
      const target=e.target.closest?.('mark.reader-highlight,.comment-dot');if(!target)return;
      const mark=target.matches('mark')?target:[...content.querySelectorAll('mark.reader-highlight')].find(m=>m.dataset.noteId===target.dataset.noteId);
      if(mark)showPopup(mark,mark.dataset.noteId);
    });
    // Fechar o pop-up ao clicar fora dele, sem interferir na seleção de texto.
    // pointerdown ocorre antes do click: clicar em outra marcação fecha o
    // pop-up anterior e permite que o novo seja aberto normalmente.
    shadow.addEventListener('pointerdown',e=>{
      const popup=shadow.querySelector('.popup');
      if(popup && !e.composedPath().includes(popup)) dismissPopup();
    },true);
    document.addEventListener('keydown',onKey,true);
    await restore();
  }
  api.runtime.onMessage.addListener(msg=>{if(msg?.type==='TOGGLE_READER')open().catch(console.error);});
})();
