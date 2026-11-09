# Leitor Web — v1.0.0

Extensão para Chrome e Firefox, com modo leitura, marcações e comentários armazenados em `storage.local`.

## Novidades
- Botão **Excluir** no pop-up de comentário, removendo a marcação e seu comentário do texto e do armazenamento local.
- Barra de ferramentas reorganizada em duas linhas responsivas, com seletor de cor personalizada sempre dentro da largura da janela.
- Ícone próprio do leitor (16, 48 e 128 px) registrado no manifesto e no botão da extensão.

## Instalação
- **Chrome:** `chrome://extensions` → Modo do desenvolvedor → Carregar sem compactação → escolha a pasta `chrome`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → Carregar extensão temporária → escolha `firefox/manifest.json`.

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