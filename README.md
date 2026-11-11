# Leitor Web

Extensão para Chrome e Firefox, com modo leitura, marcações e comentários armazenados em `storage.local`.

## Funcionalidades
- Modo leitura.
- Aumentar e diminuir fonte.
- Justificar ou alinha a esquerda o texto.
- Dark mode.
- Marcador de texto com opções de cores.
- Campo para comentário.
- Menu geral como todos os documentários do documento.
- Todo as marcações e comentários são armazenadas no local storege do navegador.

<img width="800" height="431" alt="demo" src="https://github.com/user-attachments/assets/0e525675-d6fb-40d9-8805-da5e847624f1" />

## Atualização sem perder anotações
Substitua os arquivos da pasta da extensão já carregada e use **Recarregar** na página de extensões. Não desinstale a extensão anterior se quiser manter o armazenamento local.

## Limitações
- Extração de texto heurística, podendo falhar em páginas complexas.
- Seleções sobrepostas não são suportadas.
- A posição de marcações pode mudar se o artigo original for reescrito.
- Não funciona em páginas internas protegidas do navegador.
- Instalação permanente no Firefox requer assinatura da extensão.

# Instalação no Google Chrome
- Extraia o arquivo ZIP.
- Acesse chrome://extensions.
- Ative o modo do desenvolvedor.
- Clique em "Carregar sem compactação".
- Selecione a pasta leitor-web-extension/chrome.

# Instalação no Firefox
- Extraia o arquivo ZIP.
- Acesse about:debugging#/runtime/this-firefox.
- Clique em "Carregar extensão temporária".
- Selecione leitor-web-extension/firefox/manifest.json.
