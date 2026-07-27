# Guia de Hospedagem do Mini-Site: GitHub Pages & Netlify

Parabéns! Nós adaptamos e configuramos o seu mini-site para ser **100% compatível com plataformas de hospedagem estática** como o **GitHub Pages** e o **Netlify**.

---

## 🛠️ Como funciona a nossa arquitetura Estática?

Como o GitHub Pages e o Netlify são plataformas estáticas (sem servidor Node.js rodando em segundo plano), eles não conseguem processar as rotas de API dinâmica (como `/api/posts` e `/api/config`).

Para resolver isso, nós desenvolvemos um **mecanismo inteligente de fallback estático**:
1. **Compilação Inteligente**: Toda vez que o comando `npm run build` é executado, a versão mais recente das suas configurações (`config.json`) e dos seus artigos do blog (`posts.json`) é importada e incorporada diretamente dentro do pacote JavaScript estático final da aplicação.
2. **Fallback Automático**: Se o site é acessado e detecta que a API do servidor não está disponível (como em um ambiente de hospedagem estática), ele automaticamente passa a usar os dados locais embutidos de forma transparente, garantindo que o seu cliente veja todo o conteúdo do site sem nenhuma lentidão ou tela em branco!

---

## 🚀 Método 1: Hospedagem Simples com o Netlify (Recomendado)

O Netlify é a forma mais fácil e rápida de colocar o seu mini-site no ar em menos de 1 minuto.

### Opção A: Arrastar e Soltar (Sem código)
1. Faça o download da pasta do seu projeto (exportando em ZIP pelas configurações do AI Studio) ou compile o projeto localmente com `npm run build`.
2. Acesse o site do [Netlify](https://www.netlify.com/) e faça login ou crie uma conta gratuita.
3. Acesse a aba **Sites** e role a tela até encontrar a área para arrastar arquivos (**"Drag and drop your site folder here"**).
4. Arraste e solte a pasta **`dist`** (que é gerada após a compilação do projeto).
5. Pronto! O seu site já está publicado em um link profissional gerado pelo Netlify.

### Opção B: Conectado com seu GitHub (Hospedagem Automática)
1. Crie um repositório no seu GitHub e suba todo o código do projeto para lá.
2. Acesse sua conta no Netlify, clique em **Add new site** e selecione **Import an existing project**.
3. Conecte com sua conta do GitHub e selecione o repositório do projeto.
4. O Netlify lerá automaticamente o nosso arquivo `netlify.toml` que já configuramos para você. Ele definirá sozinho os comandos:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Clique em **Deploy** e o seu site será compilado e publicado instantaneamente!

---

## 🐙 Método 2: Hospedagem Automática com GitHub Pages

Nós já criamos um fluxo automatizado de integração contínua (GitHub Actions) em `.github/workflows/deploy.yml` para compilar e publicar o seu site sempre que você enviar atualizações para o GitHub!

### Passo a Passo:
1. Crie um novo repositório público ou privado no seu **GitHub** (ex: `andmicrocell-site`).
2. Suba o código deste projeto para o seu repositório do GitHub.
3. No GitHub, acesse as **Settings (Configurações)** do seu repositório.
4. Vá no menu lateral esquerdo em **Actions** -> **General**.
5. Role até o final da página em **Workflow permissions** (Permissões de fluxo de trabalho) e marque a opção **"Read and write permissions"** (Permissões de leitura e escrita). Clique em **Save**. *(Isso permite que a automação salve os arquivos compilados de volta na pasta de hospedagem).*
6. Faça um pequeno "push" de código ou clique em **Actions** no topo do GitHub, selecione o fluxo **"Deploy to GitHub Pages"** e clique em **"Run workflow"**.
7. Uma nova branch chamada `gh-pages` será criada de forma 100% automática com todos os arquivos compilados do seu site.
8. Agora, acesse as **Settings (Configurações)** do repositório, clique em **Pages** no menu lateral esquerdo.
9. Em **Build and deployment**, selecione:
   - **Source**: `Deploy from a branch`
   - **Branch**: Escolha `gh-pages` e defina a pasta como `/ (root)`.
10. Clique em **Save**. O link oficial do seu site será exibido no topo da página (ex: `https://seu-usuario.github.io/seu-repositorio/`).

---

## 🎨 Vantagens dessa Configuração:
- **Gratuito para sempre**: Ambas as plataformas oferecem hospedagem de altíssima performance de forma totalmente gratuita.
- **Paths Relativos**: Configuramos o Vite com `base: "./"`, de forma que todas as imagens, logotipos e scripts carreguem perfeitamente quer o site esteja na raiz de um domínio customizado ou dentro de uma subpasta do GitHub Pages.
- **Portabilidade**: O seu site de cliente funciona de forma independente e sem depender de servidores ativos para exibir as informações e dicas aos seus clientes!
