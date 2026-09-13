// functions/api/cuidadores.js
// Proxy Airtable → Frontend (usado nos sites das cuidadoras e das famílias)

const AIRTABLE_BASE = 'apphAWeT91l1dMWM5';
const AIRTABLE_TABLE = 'Cuidadores';

export async function onRequest(context) {
  const AIRTABLE_API_KEY = context.env.AIRTABLE_API_KEY;

  if (!AIRTABLE_API_KEY) {
    return new Response(JSON.stringify({ 
      error: 'Configuração ausente',
      detalhe: 'AIRTABLE_API_KEY não está nas variáveis de ambiente'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Busca todos os registros da tabela (com paginação)
    let todosRegistros = [];
    let offset = null;
    let paginas = 0;
    const MAX_PAGINAS = 10; // trava de segurança

    do {
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?pageSize=100`;
      if (offset) url += `&offset=${offset}`;

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      if (!resp.ok) {
        const erro = await resp.text();
        console.error('Airtable erro:', resp.status, erro);
        return new Response(JSON.stringify({
          error: 'Falha ao buscar no Airtable',
          status: resp.status,
          detalhe: erro.substring(0, 300)
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = await resp.json();
      if (data.records) {
        todosRegistros = todosRegistros.concat(data.records);
      }
      offset = data.offset || null;
      paginas++;

    } while (offset && paginas < MAX_PAGINAS);

    return new Response(JSON.stringify({ records: todosRegistros }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // cache 60s
      }
    });

  } catch (err) {
    console.error('Erro cuidadores.js:', err);
    return new Response(JSON.stringify({
      error: 'Falha no processamento',
      detalhe: String(err && err.message ? err.message : err)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}