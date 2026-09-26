# CotaFácil

Landing page de cotação inteligente, pronta para publicar na Vercel.

## O que já está implementado
- Busca por produto em uma interface premium e responsiva.
- Consulta real ao Google Shopping usando a SerpApi quando `SERPAPI_KEY` estiver configurada.
- Até 30 ofertas por consulta, com padrão de 20.
- Ranking de "Melhor compra" separado de "Menor preço" e "Melhor avaliação".
- Índice ponderado: preço 45%, avaliação 25%, reputação 10%, entrega 10% e sinais de pós-venda 10%.
- Tratamento conservador do pós-venda: a API de compras não fornece um campo oficial específico para suporte; a aplicação só aumenta esse componente quando há sinais textuais públicos como garantia, troca, devolução, SAC ou atendimento.
- Fallback de demonstração quando a chave não estiver configurada.

## Publicar na Vercel
1. Suba esta pasta para um repositório Git.
2. Importe o repositório na Vercel.
3. Crie a variável de ambiente `SERPAPI_KEY` com sua chave.
4. Faça o deploy.

A SerpApi documenta o endpoint `https://serpapi.com/search?engine=google_shopping`, com campos como título, loja, preço, avaliação, reviews, entrega e miniatura.

## Observação importante sobre o ranking
Preço e avaliações vêm dos resultados retornados pelo Google Shopping. Pós-venda não possui um campo oficial equivalente no Shopping API, então a interface sinaliza quando o dado não está informado em vez de inventar uma avaliação da loja.


## Exportação

Após uma cotação, o botão **Exportar cotação** permite baixar os resultados em **Excel (.xlsx)**, **PDF**, **CSV** ou abrir uma versão pronta para impressão. O Excel contém uma aba completa com as ofertas e uma aba de resumo. O PDF inclui produto, data/hora, ordenação e principais indicadores.

As exportações são feitas no navegador; as bibliotecas SheetJS e jsPDF são carregadas por CDN. Para ambientes sem internet no frontend, hospede essas bibliotecas localmente.
