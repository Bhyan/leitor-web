const api = globalThis.browser || globalThis.chrome;
api.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  try { await api.tabs.sendMessage(tab.id, {type:'TOGGLE_READER'}); }
  catch(err) { console.warn('Modo leitura indisponível nesta página:',err); }
});
