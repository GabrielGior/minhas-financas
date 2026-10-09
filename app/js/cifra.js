// Cofrim — Dados cifrados no navegador (versão web e iPhone), sem senha. Os dados do app (financas-v1 no localStorage
// e a cópia no IndexedDB) ficam gravados cifrados com AES-GCM de 256 bits. A chave é criada pelo próprio navegador
// como "não exportável" e guardada no IndexedDB: o app consegue usá-la, mas ninguém consegue copiá-la nem lê-la pelo
// "Inspecionar"; quem olhar o armazenamento só vê texto cifrado. Não protege quem usa o mesmo navegador aberto (o app
// decifra para mostrar), nem substitui a senha do computador. No APK não entra: lá os dados ficam no armazenamento
// isolado do app. Carregado antes de dados.js, que lê os dados ao abrir.
const CIFRA_ATIVA = !window.TESTE && !temNativo() && !!(window.crypto && crypto.subtle && window.indexedDB && window.TextEncoder);
const ehCifrado = t => typeof t === 'string' && t.startsWith('{"cifra":1');
const b64 = u => { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
const deB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
// Chave do aparelho: lida do IndexedDB ou criada na primeira vez. "add" em vez de "put": se outra aba criar a chave ao
// mesmo tempo, vale a que foi gravada primeiro (as duas abas passam a usar a mesma).
let chaveCifra = null;
function cifraChave(){
  if (!chaveCifra) chaveCifra = new Promise((ok, falha) => {
    const r = indexedDB.open('financas', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onerror = () => falha(r.error);
    r.onsuccess = () => {
      const d = r.result, ler = () => new Promise((res, rej) => { const g = d.transaction('kv').objectStore('kv').get('chave-cifra');
        g.onsuccess = () => res(g.result || null); g.onerror = () => rej(g.error); });
      ler().then(async k => {
        if (k) return ok(k);
        const nova = await crypto.subtle.generateKey({name:'AES-GCM', length:256}, false, ['encrypt', 'decrypt']);
        await new Promise(res => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').add(nova, 'chave-cifra');
          t.oncomplete = res; t.onerror = t.onabort = res; });
        ok(await ler() || nova);
      }).catch(falha);
    };
  });
  // Alguns navegadores deixam o pedido ao IndexedDB parado: depois de 5 s, desiste (e tenta de novo na próxima vez).
  chaveCifra = Promise.race([chaveCifra, new Promise((_, falha) => setTimeout(() => falha(new Error('IndexedDB não respondeu')), 5000))]);
  chaveCifra.catch(() => { chaveCifra = null; });
  return chaveCifra;
}
// Texto → texto cifrado ({"cifra":1,"z":1,"iv":…,"d":…}); comprime antes (gzip) quando o navegador sabe.
async function cifrarTexto(txt){
  let bytes = new TextEncoder().encode(txt), z = 0;
  if (window.CompressionStream){ bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); z = 1; }
  const k = await cifraChave(), iv = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, k, bytes));
  return JSON.stringify({cifra:1, z, iv:b64(iv), d:b64(c)});
}
async function decifrarTexto(t){
  const o = JSON.parse(t), k = await cifraChave();
  let bytes = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv:deB64(o.iv)}, k, deB64(o.d)));
  if (o.z) bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  return new TextDecoder().decode(bytes);
}
// A abertura espera os dados decifrados: inicio.js passa tudo o que faz por esperarDados(fn). Sem dados cifrados
// (APK, testes, primeira vez), roda na hora, como antes.
let dadosPendentes = false;
const filaDados = [];
function esperarDados(fn){ if (dadosPendentes) filaDados.push(fn); else fn(); }
function dadosProntos(){ dadosPendentes = false; while (filaDados.length) filaDados.shift()(); }
// Gravações cifradas em fila: cada uma termina antes da próxima começar (a última sempre vence).
let filaCifra = Promise.resolve();
function gravarCifrado(json, grava){ return (filaCifra = filaCifra.catch(() => {}).then(() => cifrarTexto(json)).then(grava)); }
