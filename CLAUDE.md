# lesto.cc — instruções para o Claude Code

Site estático (HTML + CSS + JavaScript, sem build). Publicado no GitHub Pages a partir do ramo `main`, domínio `lesto.cc` (ficheiro `CNAME`).

## Ficheiros
- `conteudo.js` — **todo o conteúdo**: nome, sobre, contacto e a lista `projetos`. Quase todos os pedidos mexem só aqui.
- `fotos/` — imagens dos projetos.
- `index.html`, `style.css`, `app.js` — estrutura, estilo e comportamento. Não mexer salvo pedido explícito.

## Acrescentar um cartão de projeto
Quando o Oleg disser "acrescenta um cartão…":
1. Acrescenta um objeto no **início** do array `projetos` em `conteudo.js`, com esta forma:
   ```js
   {
     titulo: 'Nome da peça',
     local: 'Cidade',
     data: { pt: 'março 2026', en: 'march 2026' },
     tipo: { pt: 'instalação sonora', en: 'sound installation' },
     com: 'artista ou coletivo',
     link: 'https://…',            // site da peça/artista ('' se não houver)
     fotos: ['fotos/nome-1.jpg', 'fotos/nome-2.jpg'],  // a 1.ª é a capa; o cartão mostra só a 1.ª ([] se não houver)
     videos: ['https://youtu.be/J-SL541mAvs'],          // opcional: links do YouTube (youtu.be, watch?v=, shorts/, embed/)
     texto: { pt: '', en: '' }     // descrição opcional; parágrafos separados por linha em branco
   }
   ```
2. Escreve sempre PT (português de Portugal, minúsculas no tipo/data) **e** EN (também em minúsculas: `june 2025`, nunca `June 2025`). Se faltar a tradução, traduz tu.
3. Não inventes informação. Campos desconhecidos ficam `''`. Mantém o texto do Oleg tal como ele escreveu (corrige só gralhas óbvias e avisa).
4. Fotos: copia para `fotos/`, nome em minúsculas sem espaços nem acentos (`nome-da-peca-1.jpg`), converte para JPG e reduz para no máximo 1600 px no lado maior (qualidade ~82). Ex.: `sips -Z 1600 -s format jpeg -s formatOptions 82 in.heic --out fotos/x.jpg` (macOS) ou `magick in.jpg -resize 1600x1600\> -quality 82 fotos/x.jpg`.
5. Vídeos: o campo `videos` é opcional (omite ou `[]` se não houver). Sem fotos, a capa do cartão é a miniatura do 1.º vídeo. O contador do cartão mostra fotos e vídeos (ex.: `6 · ▶ 1`). Na janela, os vídeos aparecem depois do texto e antes das restantes fotos (embed `youtube-nocookie.com`). Aberto como `file://` o YouTube recusa o leitor (erro 153, falta o Referer), por isso aí aparece a miniatura com ▶ a ligar para o YouTube; para testar o leitor embutido localmente usa `python -m http.server` e abre `http://localhost:8000`.
6. Testa localmente abrindo `index.html` no browser (funciona sem servidor).
7. `git add -A && git commit -m "projeto: <titulo>" && git push`. O site atualiza em ~1 minuto.

## Outros pedidos comuns
- Editar/remover projeto: edita/apaga o bloco correspondente em `conteudo.js`.
- Mudar texto do "sobre" ou contactos: `sobre` / `contacto` em `conteudo.js`.

## Estilo (não alterar sem pedido)
Fonte Archivo; fundo #f3f2f2 / tinta #201e1d (escuro: #171615 / #f3f2f2); acento rosa #fb72f3; cantos retos, contornos de 2px, sombras sólidas deslocadas. Imagens a cores.
