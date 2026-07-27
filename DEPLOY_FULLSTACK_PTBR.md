# Guia de Implantação Completa (Full-Stack): Hospedando seu Robô WhatsApp 24/7

Este guia explica exatamente por que seu webhook está dando erro na Meta atualmente e como colocar sua automação no ar de forma **definitiva, profissional e segura** usando o domínio `app.andmicrocell.com.br`.

---

## 🔍 Por que está dando erro de validação na Meta atualmente?

Para o webhook da Meta funcionar, ela precisa enviar uma requisição de teste para o endereço `https://app.andmicrocell.com.br/api/webhook/whatsapp` e receber uma resposta instantânea do seu servidor Node.js (`server.ts`).

Atualmente, isso falha por dois motivos:
1. **Ambiente de Preview (AI Studio):** O link do AI Studio (`ais-pre-...`) possui uma barreira de segurança interna (autenticação por cookies). Quando a Meta tenta acessar, ela é redirecionada para a tela de login do Google, falhando na validação.
2. **Hospedagem Estática (GitHub Pages / Netlify / Firebase Hosting básico):** Se o seu domínio `app.andmicrocell.com.br` estiver apontado para o GitHub Pages ou Netlify, essas plataformas servem apenas arquivos estáticos (HTML/JS/CSS). Elas **não executam código de servidor Node.js**, logo o arquivo `server.ts` (onde está o webhook) não roda lá, retornando erro 404.

---

## 🚀 A Solução Definitiva: Hospedagem Full-Stack com Render.com (Recomendado)

A plataforma **Render** (https://render.com) é a mais simples, robusta e barata (possui plano gratuito e planos pagos de baixo custo para alta performance) para hospedar aplicativos que possuem servidor **Express (Node.js) + React (Vite)** de forma contínua 24/7.

Aqui está o passo a passo exato para configurar tudo em menos de 10 minutos:

### Passo 1: Obter o Código do seu Projeto
1. No menu superior ou de configurações do **Google AI Studio Build**, clique em **Export** (Exportar) e baixe o projeto em formato **ZIP**, ou envie o código para um repositório no seu **GitHub** (recomendado).

### Passo 2: Criar Conta no Render
1. Acesse [Render.com](https://render.com) e crie uma conta gratuita (você pode entrar usando sua conta do GitHub).

### Passo 3: Criar um Novo Serviço Web ("Web Service")
1. No painel do Render, clique no botão **New +** e escolha **Web Service**.
2. Conecte com o seu repositório do GitHub onde você subiu o código, ou faça o upload direto dos arquivos.
3. Defina as seguintes configurações de build que já deixamos prontas e testadas no seu `package.json`:
   - **Runtime:** `Node`
   - **Build Command:** `npm run build` (isso irá compilar o site estático e empacotar o backend de forma inteligente)
   - **Start Command:** `npm run start` (isso iniciará o seu servidor Node.js Express de alta performance)

### Passo 4: Adicionar as Variáveis de Ambiente
No menu lateral do seu serviço no Render, vá em **Environment** (Ambiente) e adicione as variáveis necessárias para o seu robô funcionar:
- `GEMINI_API_KEY` = *Sua chave paga da API do Gemini (que você já ativou)*
- Adicione quaisquer outras chaves que estejam no seu `.env.example`.

### Passo 5: Configurar seu Domínio Personalizado
1. No painel do Render, vá na aba **Settings** (Configurações) do seu serviço.
2. Role até a seção **Custom Domains** e clique em **Add Custom Domain**.
3. Insira o seu subdomínio: `app.andmicrocell.com.br`.
4. O Render lhe dará as instruções de DNS para atualizar na sua zona DNS (geralmente no Cloudflare ou Registro.br):
   - Crie um registro do tipo **CNAME** apontando `app` para o endereço gerado pelo Render (ex: `andmicrocell.onrender.com`).
   - Se estiver usando o Cloudflare, certifique-se de que a nuvenzinha laranja (Proxy) esteja **Ativada** para garantir SSL automático e proteção.

---

## 🤖 Configurando na Meta Developer Portal

Assim que o Render terminar de compilar o seu projeto (aparecerá um status verde de "Live"), o seu servidor estará ativo globalmente.

Acesse o portal de desenvolvedores da Meta e configure os seguintes dados:

1. **Callback URL:** `https://app.andmicrocell.com.br/api/webhook/whatsapp`
2. **Verify Token:** `andersonti2026` (Este é o token de verificação que já está configurado no seu banco de dados e servidor).

Clique em **Verificar e Salvar**. A Meta fará a validação em milissegundos e o status ficará ativo imediatamente!

---

## 💎 Vantagens do Render/Railway em relação a Servidores Locais:
- **Segurança Máxima:** HTTPS/SSL automático configurado por padrão pela plataforma.
- **Sem PC Ligado:** Seu robô responderá aos clientes mesmo se o seu computador estiver desligado ou sem internet.
- **Automação Séria:** É um ambiente de nível de produção confiável e estável para a AndMicrocell.
