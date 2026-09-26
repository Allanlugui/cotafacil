const DEFAULT_LIMIT = 20;

const demoResults = [
  {title:'Notebook Lenovo IdeaPad 3, 15.6", 16GB, 512GB SSD',source:'Loja Exemplo A',price:'R$ 2.899,00',extracted_price:2899,rating:4.8,reviews:1820,deliveryLabel:'Frete grátis',supportLabel:'Pós-venda informado',score:92,priceScore:95,storeScore:91,deliveryScore:92,thumbnail:'' , product_link:'https://www.google.com/search?q=notebook+lenovo+ideapad+3'},
  {title:'Notebook Lenovo IdeaPad 3, Ryzen 7, 16GB, 512GB',source:'Loja Exemplo B',price:'R$ 2.949,00',extracted_price:2949,rating:4.9,reviews:920,deliveryLabel:'Entrega rápida',supportLabel:'Política publicada',score:90,priceScore:92,storeScore:93,deliveryScore:94,thumbnail:'', product_link:'https://www.google.com/search?q=lenovo+ideapad+ryzen+7'},
  {title:'Lenovo IdeaPad 3 15ALC6 16GB 512GB',source:'Loja Exemplo C',price:'R$ 2.799,90',extracted_price:2799.9,rating:4.5,reviews:410,deliveryLabel:'Frete calculado',supportLabel:'Não informado',score:87,priceScore:100,storeScore:83,deliveryScore:68,thumbnail:'',product_link:'https://www.google.com/search?q=lenovo+ideapad+15alc6'}
];

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  const product = String(req.query.product || '').trim();
  const location = String(req.query.location || 'Brasil').trim();
  const prioritizeShipping = String(req.query.prioritizeShipping || 'false') === 'true';
  const limit = Math.max(1, Math.min(30, Number(req.query.limit) || DEFAULT_LIMIT));
  if (!product) return res.status(400).json({ error: 'Informe o produto que deseja cotar.' });

  const apiKey = String(process.env.SERPAPI_KEY || '').trim();
  const isPlaceholder = !apiKey || /sua_chave|your_|changeme|placeholder|xxx/i.test(apiKey);
  if (isPlaceholder) {
    return res.status(200).json({ source: 'demo', results: demoResults.slice(0, Math.min(limit, demoResults.length)), notice: 'Configure SERPAPI_KEY para habilitar a consulta real.' });
  }

  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine','google_shopping');
    url.searchParams.set('q', product);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('gl', 'br');
    url.searchParams.set('hl', 'pt-br');
    url.searchParams.set('location', location.toLowerCase().includes('brasil') ? 'Brazil' : `${location}, Brazil`);

    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || `Erro da pesquisa (${response.status}).`);

    const raw = Array.isArray(data.shopping_results) ? data.shopping_results : [];
    const unique = [];
    const seen = new Set();
    for (const item of raw) {
      const key = `${(item.source || '').toLowerCase()}|${(item.title || '').toLowerCase()}`;
      if (!item.title || seen.has(key)) continue;
      seen.add(key); unique.push(item);
    }

    const priced = unique.filter(x => Number.isFinite(Number(x.extracted_price)) && Number(x.extracted_price) > 0);
    const minPrice = Math.min(...priced.map(x => Number(x.extracted_price)));
    const maxPrice = Math.max(...priced.map(x => Number(x.extracted_price)));

    const results = unique.slice(0, limit).map(item => {
      const price = Number(item.extracted_price);
      const priceScore = normalizeInverse(price, minPrice, maxPrice);
      const ratingScore = item.rating ? clamp(Number(item.rating) / 5 * 100) : 50;
      const reviewScore = item.reviews ? clamp(Math.log10(Number(item.reviews)+1) / 4 * 100) : 35;
      const deliveryScore = inferDeliveryScore(item);
      const supportScore = inferSupportSignal(item);
      const score = clamp((priceScore * 0.45) + (ratingScore * 0.25) + (reviewScore * 0.10) + (deliveryScore * (prioritizeShipping ? 0.14 : 0.10)) + (supportScore * (prioritizeShipping ? 0.06 : 0.10)));
      return {
        title: item.title,
        source: item.source || 'Loja não identificada',
        source_icon: item.source_icon || '',
        thumbnail: item.thumbnail || '',
        product_link: item.link || item.product_link || '#',
        price: item.price || 'Preço não informado',
        extracted_price: Number.isFinite(price) ? price : null,
        old_price: item.old_price || '',
        rating: item.rating || null,
        reviews: item.reviews || null,
        deliveryLabel: deliveryLabel(item),
        supportLabel: supportLabel(item),
        score: Number(score.toFixed(1)),
        priceScore: Number(priceScore.toFixed(1)),
        storeScore: Number(((ratingScore*0.72)+(reviewScore*0.28)).toFixed(1)),
        deliveryScore: Number(deliveryScore.toFixed(1)),
        supportScore: Number(supportScore.toFixed(1))
      };
    });

    results.sort((a,b) => b.score - a.score);
    return res.status(200).json({ source: 'serpapi', results: results.slice(0, limit), totalFound: raw.length, generatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: `Não foi possível consultar a web agora. ${error.message}` });
  }
};

function clamp(v){return Math.max(0, Math.min(100, v));}
function normalizeInverse(value,min,max){if(!Number.isFinite(value))return 35;if(max<=min)return 100;return 100-((value-min)/(max-min))*70;}
function inferDeliveryScore(item){
  const text = `${item.delivery||''} ${(item.extensions||[]).join(' ')}`.toLowerCase();
  if (/(free|gr[aá]tis).*(shipping|frete)|frete gr[aá]tis/.test(text)) return 94;
  if (/(today|amanh[aã]|1 day|2 days|3 days|r[aá]pida|fast|express)/.test(text)) return 88;
  if (text) return 72;
  return 50;
}
function inferSupportSignal(item){
  // O Shopping API expõe dados de oferta/loja, mas não um campo oficial de "pós-venda".
  // Por isso, este score é deliberadamente conservador: sinais textuais públicos recebem bônus;
  // ausência de evidência não vira uma falsa nota alta.
  const text = `${item.snippet||''} ${(item.extensions||[]).join(' ')} ${item.source||''}`.toLowerCase();
  let score = 50;
  if (/(garantia|warranty|devolu[cç][aã]o|troca|sac|atendimento|suporte|customer service)/.test(text)) score += 24;
  if (/(seller|vendedor|loja oficial|authorized|autorizada)/.test(text)) score += 10;
  if (/(marketplace|terceiro|third-party)/.test(text)) score -= 5;
  return clamp(score);
}
function deliveryLabel(item){
  const text = `${item.delivery||''}`.trim();
  return text || 'Entrega não informada';
}
function supportLabel(item){
  const s = inferSupportSignal(item);
  if (s>=74) return 'Sinais de pós-venda';
  if (s>=60) return 'Pós-venda parcial';
  return 'Pós-venda não informado';
}
