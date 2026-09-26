const form = document.getElementById('quoteForm');
const productInput = document.getElementById('productInput');
const locationInput = document.getElementById('locationInput');
const resultsInput = document.getElementById('resultsInput');
const shippingToggle = document.getElementById('shippingToggle');
const resultsSection = document.getElementById('resultsSection');
const resultsTitle = document.getElementById('resultsTitle');
const resultsMeta = document.getElementById('resultsMeta');
const resultsGrid = document.getElementById('resultsGrid');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');
const searchButton = document.getElementById('searchButton');
const template = document.getElementById('resultTemplate');
const exportBtn = document.getElementById('exportBtn');
let lastProduct = '';
let lastData = null;
let currentResults = [];
let currentSort = 'score';

exportBtn.addEventListener('click', exportQuote);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const product = productInput.value.trim();
  if (!product) return;
  await quote(product);
});

document.querySelectorAll('.sort-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    currentSort = button.dataset.sort;
    renderResults(sortResults(currentResults, currentSort));
  });
});

async function quote(product) {
  resultsSection.classList.remove('hidden');
  loading.classList.remove('hidden');
  errorBox.classList.add('hidden');
  resultsGrid.innerHTML = '';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  searchButton.disabled = true;
  searchButton.querySelector('span').textContent = 'Pesquisando…';

  try {
    const params = new URLSearchParams({
      product,
      location: locationInput.value.trim() || 'Brasil',
      limit: resultsInput.value,
      prioritizeShipping: shippingToggle.checked ? 'true' : 'false'
    });
    const response = await fetch(`/api/quote?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a cotação.');
    currentResults = data.results || [];
    lastProduct = product;
    lastData = data;
    exportBtn.disabled = currentResults.length === 0;
    resultsTitle.textContent = `${currentResults.length} ofertas para “${product}”`;
    resultsMeta.textContent = data.source === 'serpapi' ? `Busca atualizada na web • ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}` : 'Modo demonstração: configure SERPAPI_KEY para resultados reais.';
    renderResults(sortResults(currentResults, currentSort));
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
    searchButton.disabled = false;
    searchButton.querySelector('span').textContent = 'Fazer cotação';
  }
}

function sortResults(list, sort) {
  return [...list].sort((a,b) => {
    if (sort === 'price') return (a.extracted_price ?? Infinity) - (b.extracted_price ?? Infinity);
    if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0);
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

function renderResults(list) {
  resultsGrid.innerHTML = '';
  list.forEach((item, index) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.rank').textContent = index + 1;
    const img = node.querySelector('.product-thumb');
    img.src = item.thumbnail || makePlaceholder(item.title);
    img.alt = item.title || 'Produto';
    const sourceIcon = node.querySelector('.source-icon');
    if (item.source_icon) sourceIcon.src = item.source_icon; else sourceIcon.style.display='none';
    node.querySelector('.source').textContent = item.source || 'Loja não identificada';
    node.querySelector('.product-title').textContent = item.title;
    node.querySelector('.stars').textContent = starString(item.rating);
    node.querySelector('.rating').textContent = item.rating ? Number(item.rating).toFixed(1) : '—';
    node.querySelector('.reviews').textContent = item.reviews ? `${formatNumber(item.reviews)} avaliações` : 'Sem avaliações informadas';
    node.querySelector('.delivery-chip').textContent = item.deliveryLabel || 'Entrega não informada';
    node.querySelector('.support-chip').textContent = item.supportLabel || 'Pós-venda não informado';
    node.querySelector('.score').textContent = `${Math.round(item.score ?? 0)}/100`;
    node.querySelector('.score-bar span').style.width = `${Math.max(0,Math.min(100,item.score ?? 0))}%`;
    node.querySelector('.sp').textContent = `${Math.round(item.priceScore ?? 0)}`;
    node.querySelector('.ss').textContent = `${Math.round(item.storeScore ?? 0)}`;
    node.querySelector('.sd').textContent = `${Math.round(item.deliveryScore ?? 0)}`;
    node.querySelector('.price').textContent = item.price || 'Preço indisponível';
    node.querySelector('.old-price').textContent = item.old_price || '';
    const link = node.querySelector('.offer-btn'); link.href = item.product_link || '#';
    resultsGrid.appendChild(node);
  });
}

function starString(rating) {
  if (!rating) return '☆☆☆☆☆';
  const r = Math.round(Number(rating));
  return '★'.repeat(Math.min(5,r)) + '☆'.repeat(Math.max(0,5-r));
}
function formatNumber(n){return new Intl.NumberFormat('pt-BR').format(n)}
function makePlaceholder(text){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f5f7fb"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="18" fill="#778299">${escapeXml((text||'Produto').slice(0,28))}</text></svg>`)}
function escapeXml(s){return s.replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;','\\':'\\'}[c]||c))}

productInput.focus();


function exportQuote() {
  if (!currentResults.length) return;
  const menu = document.createElement('div');
  menu.className = 'export-menu';
  menu.innerHTML = `
    <button type="button" data-export="xlsx"><span>📊</span><div><strong>Excel (.xlsx)</strong><small>Planilha completa da cotação</small></div></button>
    <button type="button" data-export="pdf"><span>📄</span><div><strong>PDF</strong><small>Relatório pronto para compartilhar</small></div></button>
    <button type="button" data-export="csv"><span>📋</span><div><strong>CSV</strong><small>Dados para outros sistemas</small></div></button>
    <button type="button" data-export="print"><span>🖨️</span><div><strong>Imprimir</strong><small>Versão otimizada para impressão</small></div></button>`;
  document.body.appendChild(menu);
  const rect = exportBtn.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
  menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
  menu.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const type = b.dataset.export;
    menu.remove();
    if (type === 'xlsx') downloadXlsx();
    if (type === 'pdf') downloadPdf();
    if (type === 'csv') downloadCsv();
    if (type === 'print') printQuote();
  }));
  const close = e => { if (!menu.contains(e.target) && e.target !== exportBtn) { menu.remove(); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 0);
}

function exportRows() {
  return sortResults(currentResults, currentSort).map((item, i) => ({
    'Posição': i + 1,
    'Produto': item.title || '',
    'Loja': item.source || '',
    'Preço': item.extracted_price ?? '',
    'Preço exibido': item.price || '',
    'Preço antigo': item.old_price || '',
    'Avaliação': item.rating ?? '',
    'Avaliações': item.reviews ?? '',
    'Entrega': item.deliveryLabel || '',
    'Pós-venda': item.supportLabel || '',
    'Índice de compra': Math.round(item.score ?? 0),
    'Score preço': Math.round(item.priceScore ?? 0),
    'Score loja': Math.round(item.storeScore ?? 0),
    'Score entrega': Math.round(item.deliveryScore ?? 0),
    'Link da oferta': item.product_link || ''
  }));
}

function fileStamp() {
  const d = new Date();
  return d.toISOString().slice(0,16).replace('T','-').replace(':','h');
}
function safeName(s) { return (s || 'cotacao').replace(/[^a-z0-9À-ÿ]+/gi,'-').replace(/^-|-$/g,'').slice(0,70); }

function downloadXlsx() {
  if (!window.XLSX) return alert('A biblioteca de Excel não foi carregada. Verifique sua conexão e tente novamente.');
  const rows = exportRows();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.min(55, Math.max(14, k.length + 4)) }));
  XLSX.utils.book_append_sheet(wb, ws, 'Cotação');
  const info = XLSX.utils.json_to_sheet([
    { Campo: 'Produto pesquisado', Valor: lastProduct },
    { Campo: 'Data e hora', Valor: new Date().toLocaleString('pt-BR') },
    { Campo: 'Ordenação exportada', Valor: currentSort === 'score' ? 'Melhor compra' : currentSort === 'price' ? 'Menor preço' : 'Melhor avaliação' },
    { Campo: 'Quantidade de ofertas', Valor: rows.length }
  ]);
  info['!cols'] = [{wch:24},{wch:70}];
  XLSX.utils.book_append_sheet(wb, info, 'Resumo');
  XLSX.writeFile(wb, `cotacao-${safeName(lastProduct)}-${fileStamp()}.xlsx`);
}

function csvEscape(v) { return `"${String(v ?? '').replace(/"/g,'""')}"`; }
function downloadCsv() {
  const rows = exportRows();
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = '\ufeff' + [headers.map(csvEscape).join(';'), ...rows.map(r => headers.map(h => csvEscape(r[h])).join(';'))].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cotacao-${safeName(lastProduct)}-${fileStamp()}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function downloadPdf() {
  if (!window.jspdf?.jsPDF) return alert('A biblioteca de PDF não foi carregada. Verifique sua conexão e tente novamente.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:'a4'});
  const rows = exportRows();
  const margin = 14; let y = 16;
  doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.text('CotaFácil', margin, y); y += 8;
  doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.text('Relatório de cotação', margin, y); y += 7;
  doc.setFontSize(9); doc.text(`Produto: ${lastProduct}`, margin, y); y += 5;
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}  •  ${rows.length} ofertas`, margin, y); y += 9;
  const sortedLabel = currentSort === 'score' ? 'Melhor compra' : currentSort === 'price' ? 'Menor preço' : 'Melhor avaliação';
  doc.setFont('helvetica','bold'); doc.text(`Ordenação: ${sortedLabel}`, margin, y); y += 7;
  doc.setFont('helvetica','normal');
  const pageW = 210 - margin * 2;
  const cols = [12, 58, 29, 20, 18, 20, 29];
  const headers = ['#','Produto','Loja','Preço','Nota','Avaliações','Índice'];
  const x = [margin]; for (let i=1;i<cols.length;i++) x.push(x[i-1]+cols[i-1]);
  function header() {
    doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.rect(margin, y-4, pageW, 7); headers.forEach((h,i)=>doc.text(h,x[i]+2,y)); y += 6;
    doc.setFont('helvetica','normal');
  }
  header();
  rows.forEach((r, i) => {
    const values = [String(r['Posição']), String(r['Produto']), String(r['Loja']), String(r['Preço exibido'] || r['Preço']), r['Avaliação'] ? String(r['Avaliação']) : '—', r['Avaliações'] ? formatNumber(r['Avaliações']) : '—', `${r['Índice de compra']}/100`];
    const wrapped = values.map((v,j) => doc.splitTextToSize(v, cols[j]-4));
    const h = Math.max(6, ...wrapped.map(a => a.length*4));
    if (y+h > 280) { doc.addPage(); y=16; header(); }
    if (i % 2 === 0) doc.rect(margin, y-4, pageW, h, 'F');
    wrapped.forEach((arr,j)=>doc.text(arr, x[j]+2, y));
    y += h + 2;
  });
  y += 5; doc.setFontSize(7); doc.setTextColor(100); doc.text('CotaFácil • Os dados refletem as informações disponíveis no momento da pesquisa.', margin, y);
  doc.save(`cotacao-${safeName(lastProduct)}-${fileStamp()}.pdf`);
}

function printQuote() {
  const rows = exportRows();
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cotação CotaFácil</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{margin-bottom:4px}small{color:#666}table{border-collapse:collapse;width:100%;margin-top:20px;font-size:11px}th,td{border:1px solid #ddd;padding:7px;text-align:left}th{background:#f1f3f7}a{color:#111}@media print{body{padding:10px}}</style></head><body><h1>CotaFácil</h1><small>Produto: ${escapeHtml(lastProduct)} • ${new Date().toLocaleString('pt-BR')}</small><table><thead><tr>${Object.keys(rows[0]||{}).slice(0,14).map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${Object.keys(rows[0]||{}).slice(0,14).map(h=>`<td>${escapeHtml(r[h])}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`;
  const w = window.open('', '_blank'); if (!w) return alert('Permita pop-ups para imprimir a cotação.'); w.document.write(html); w.document.close();
}
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
