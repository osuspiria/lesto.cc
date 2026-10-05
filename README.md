# lesto.cc

Site pessoal de Oleg Yermak (lesto): eletrónica, programação e sistemas para arte e cultura.
HTML + CSS + JavaScript simples, sem dependências nem build. Abre `index.html` diretamente no browser para ver.

## Publicar (uma vez)

1. **Pôr os ficheiros no repositório** `osuspiria/lesto.cc`
   - Mais simples: no GitHub, abre o repositório → *Add file → Upload files* → arrasta o conteúdo desta pasta (não a pasta em si) → *Commit*.
   - Ou no terminal:
     ```
     git clone https://github.com/osuspiria/lesto.cc && cd lesto.cc
     # copia para aqui o conteúdo desta pasta
     git add -A && git commit -m "site" && git push
     ```
2. **Ligar o GitHub Pages**: repositório → *Settings → Pages* → *Source: Deploy from a branch* → `main` / `(root)` → *Save*.
3. **Domínio** (no sítio onde compraste lesto.cc, secção DNS):
   - 4 registos `A` para `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 registo `CNAME` para `www` → `osuspiria.github.io`
   - Em *Settings → Pages*, escreve `lesto.cc` em *Custom domain* e, depois de validar (pode demorar até 24 h), ativa *Enforce HTTPS*.

## Acrescentar conteúdo

Abre o Claude Code dentro da pasta do repositório e pede, por exemplo:

> acrescenta um cartão: "Nome da peça", Porto, março 2026, instalação sonora, com Fulana, link https://…, fotos em ~/Desktop/peca/

O ficheiro `CLAUDE.md` explica-lhe como o fazer (editar `conteudo.js`, otimizar fotos para `fotos/`, commit e push). Também podes editar `conteudo.js` à mão.

## A confirmar
- Instagram `@lesto.cc` é provisório — muda em `conteudo.js` → `contacto`.
- O endereço de email precisa de existir (ex.: reencaminhamento de email no registador do domínio).

## Estrutura
```
index.html    estrutura
style.css     estilo (claro/escuro)
app.js        cartões arrastáveis, janela de projeto, idioma, tema, bicho + multímetro
conteudo.js   TODO o conteúdo
fotos/        imagens
CNAME         domínio para o GitHub Pages
CLAUDE.md     instruções para o Claude Code
```
