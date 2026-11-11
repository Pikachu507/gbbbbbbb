# GOAL DISTRICT — Loja de camisolas de futebol

Projeto **Next.js (App Router), React, TypeScript, Tailwind, Supabase/PostgreSQL e Stripe**, criado a partir das três referências visuais fornecidas. Layout português (Portugal), mobile-first, cores preto/branco com detalhes dourados e o logótipo original anexado.

> **IMPORTANTE — Estado real:** o código é um projeto funcional a configurar, **não uma loja de produção já ativada**. Sem contas externas, credenciais de acesso, preços/stock autênticos, fotografias autorizadas e dados fiscais, não se pode concluir que os pagamentos ou a comercialização estejam prontos. Não afirmar que foi testado em produção. É necessário instalar dependências, executar build e testar os fluxos antes de publicar.

## O que está implementado

- Página inicial premium, barra de promoção, cabeçalho fixo, slider automático/manual, categorias visuais, novidades e ligações.
- Catálogo de **165 rascunhos** das categorias Premier League, La Liga, Liga Portugal, Serie A, Bundesliga, Ligue 1, Scottish Premiership, Eredivisie, Brasileirão, seleções e retro. Modelos, épocas, fotografias, preços e existência **por confirmar**: não são um inventário real e não podem ser comprados sem validação.
- Catálogo com pesquisa, categorias, tipo, tamanho, ordenação; rota independente `/produto/[slug]` para cada artigo publicado.
- Galeria frente/trás quando existe, zoom, seleção obrigatória de tamanhos e stock por variante.
- Personalização **+5,00 € por camisola**, nome, número e pré-visualização indicativa. Duas camisolas iguais com personalizações diferentes permanecem linhas diferentes no carrinho.
- Favoritos dos clientes autenticados na base de dados e favoritos locais de visitantes. Carrinho persistido no browser, drawer lateral, página de carrinho e checkout com validação.
- Autenticação com Supabase Auth: registo, email de confirmação, login, recuperação de palavra-passe, alteração de palavra-passe, perfil, moradas e histórico de encomendas.
- Checkout de encomendas verificadas por **reserva atómica de stock**, preços e portes calculados **no PostgreSQL**, desconto de cupão, promoção «Leva 5, paga 4» (mais barato de cada cinco, não cobre personalização). Os pagamentos só passam a **pagos com webhook Stripe assinado**.
- Painel `/admin` verificado no servidor, com produtos, rascunhos, imagens, variantes, stock, encomendas, rastreios, clientes, cupões, banners, portas e conteúdos legais.
- Stripe Checkout: apresenta métodos que estejam efetivamente disponíveis na conta Stripe, nomeadamente cartão e, quando elegíveis e ativados, MB WAY / Multibanco. Não inventa confirmações de pagamento. Integrado com webhooks `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` e `charge.refunded`.
- Emails transacionais **opcionais** com Resend após confirmação de pagamento e atualização de estado, se a chave e o remetente estiverem configurados. Sem credenciais, não se envia qualquer email.
- Informações, FAQ, política e páginas legais a completar, página 404, skeleton, metadata de produtos, robots e sitemap.

## 1 — Preparar ambiente

Requisitos: **Node.js 20 ou 22+** e npm atualizado. Executar na pasta onde está este ficheiro (`package.json` tem de estar na raiz):

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrir `http://localhost:3000`. **Sem Supabase configurado, o site abre em modo de visualização:** os 165 artigos aparecem claramente identificados como rascunhos por validar. Login, registo, administração e checkout real ficam desativados até existir infraestrutura.

Para produção, é necessário primeiro correr as migrações e configurar todas as variáveis obrigatórias, antes de tentar efetuar compras.

## 2 — Criar Supabase

1. Criar projeto em https://supabase.com/dashboard.
2. Ir a **SQL Editor** e executar, por esta ordem, os ficheiros:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_catalog_drafts.sql`
3. Em **Project Settings / API**, copiar a **Project URL**, a **anon/publishable key** e a **service role secret** para `.env.local`. A service role secret **só existe no servidor**, nunca com prefixo `NEXT_PUBLIC_`.
4. Em **Authentication / URL Configuration**, configurar o Site URL e Redirect URLs, por exemplo `https://teu-dominio.pt/auth/callback` e `http://localhost:3000/auth/callback`.
5. Ativar email de confirmação conforme a política da loja e o remetente de emails de Auth.
6. A migração cria bucket `product-images` para upload de fotografias (JPEG, PNG, WEBP até 10 MB) através da administração, com URL pública e permissões de escrita só na API do servidor.

### Primeiro administrador

**Não há administrador por defeito nem senha escrita no repositório.** Depois de registares uma conta e confirmares o email, identifica-a na tabela `auth.users` (no dashboard do Supabase) e executa no SQL Editor, substituindo o UUID real:

```sql
update public.profiles
set role='admin'
where id='COLOCA-AQUI-O-UUID-DO-UTILIZADOR';
```

Depois volta a iniciar sessão e abre `/admin`. A API verifica a identidade e o cargo através do Supabase, no servidor. **Não uses palavras-passe previsíveis** e ativa MFA nas contas administrativas quando possível.

## 3 — Preparar produtos

1. Entrar em `/admin` → **Produtos**.
2. Selecionar `Editar` num dos 165 rascunhos ou criar um artigo novo.
3. Confirmar **clube, tipo, época/modelo e descrição**. O catálogo gerado sugere equipas, não prova que todos os modelos existam nessa época.
4. Introduzir **preço real**, quantidades por tamanho (`S:3, M:5, L:0`), fotografia frontal e, quando disponível, traseira.
5. Marcar **Modelo e fotografias confirmados** e alterar para **Publicado**; guardar.
6. Artigo passa a aparecer no site, com URL própria e compra disponível em tamanhos com stock.

Para imagens com marcas e logótipos de equipas, verifica direitos de utilização e a legitimidade comercial dos produtos. **Não reutilizes fotografias de sites sem autorização**. O próprio recorte do banner e das categorias foi extraído da imagem de referência enviada e a sua licença comercial tem de ser confirmada antes de publicar. Pode ser substituído por arte com direitos de utilização adequados em `public/images/` ou pelo editor de banners.

O logótipo original está preservado em `public/images/logo-original.png`; `logo-oficial.png` é um recorte da mesma imagem, sem redesenho.

## 4 — Configurar portes e promoção

Em `/admin` → **Configurações** definir os portes (euros) para Portugal Continental, Açores e Madeira. **O checkout não aceita encomendas enquanto os portes não estiverem configurados**. Zero euros pode ser utilizado se o envio gratuito for efetivamente oferecido.

A promoção **Leva 5, paga 4** vem ativada por defeito; o servidor desconta o artigo base de preço mais baixo por cada grupo de cinco. Uma eventual personalização não fica gratuita. Pode desligar-se no painel e podem ser criados cupões com data de validade, utilizações máximas e valor mínimo.

## 5 — Stripe e MB WAY / Multibanco

1. Abrir https://dashboard.stripe.com e configurar uma conta adequada e verificada para o negócio.
2. Em **Payment methods**, ativar os métodos efetivamente disponíveis para a conta/região; verificar a elegibilidade de **MB WAY** e **Multibanco** e eventuais requisitos. A loja usa Stripe Checkout, **não um MB WAY pessoal nem um formulário que aceita comprovativos**.
3. Colocar `STRIPE_SECRET_KEY` em `.env.local` e no Vercel.
4. Adicionar endpoint de webhook Stripe: `https://teu-dominio.pt/api/stripe/webhook` e ouvir `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
5. Guardar o **Signing secret** como `STRIPE_WEBHOOK_SECRET`.
6. Definir `NEXT_PUBLIC_SITE_URL` para a origem correta (`https://teu-dominio.pt`).
7. **Testar num ambiente Stripe Test antes de ativar live**, usando casos com sucesso, pagamento pendente, falha, expiração, duplicação de webhook e reembolso. Não basta chegar à página de sucesso.

**Importante:** A Stripe define elegibilidade e disponibilidade dos métodos de pagamento. Este projeto não garante aceitação de métodos específicos sem ativação no dashboard e testes na conta. A lógica de confirmação e recuperação de stock foi preparada; a prova de operação real exige testes integrados com o teu projeto Supabase/Stripe.

## 6 — Emails automáticos

Opcional: criar conta no **Resend**, verificar um domínio e adicionar `RESEND_API_KEY` + `MAIL_FROM`. A loja tenta enviar email de confirmação depois de o Stripe confirmar um pagamento e email de alteração de estado ao atualizar a encomenda no painel. **Sem credenciais de email, não são enviados emails transacionais.** O histórico de envio e a garantia de entrega ainda não têm fila de retries; para produção com volume elevado recomenda-se job queue/outbox.

## 7 — Publicar na Vercel

1. Descompactar o ZIP. Confirmar que `package.json` está diretamente na **raiz do projeto**, não numa subpasta adicional.
2. Enviar os ficheiros para um repositório GitHub.
3. No Vercel → **Add New Project** → importar o repositório, Framework Preset **Next.js**, Root Directory `./`.
4. Em **Environment Variables**, introduzir os segredos e chaves de `.env.example` (não enviar `.env.local` para GitHub).
5. Deploy. Depois de atribuir o domínio, atualizar `NEXT_PUBLIC_SITE_URL`, URLs de autenticação Supabase e endpoint de webhook Stripe.
6. Testar registo, login, autorização, fotografias, filtros, tamanhos, personalização, checkout com pagamento de teste, estados de encomenda, favoritos, atualização de stock e responsive antes de aceitar encomendas reais.
7. Confirmar dados fiscais, direitos de venda de produtos e imagens, políticas RGPD, livros/regras de reclamação aplicáveis e direitos dos consumidores com apoio jurídico competente.

## 8 — Testes

```bash
npm run check:project    # existência de ficheiros e imports relativos
npm test                 # testes de preços e catálogo (tsx)
npm run lint             # TypeScript
npm run build            # compilação Next.js
```

**Limitação do ambiente em que o ZIP foi criado:** o registo npm estava inacessível por DNS, pelo que **não foi possível instalar pacotes nem executar `npm run build`, nem testar o checkout contra credenciais reais**. Foi feita uma verificação sintática do código TypeScript/TSX via parser instalado no ambiente, além da revisão de ficheiros. Não apresentar compilação, integração com Supabase ou pagamentos como verificados até correres os testes acima.

## 9 — Estrutura resumida

```text
app/                 páginas públicas, auth, conta, admin e APIs
components/          interface, slider, produtos, carrinho, formulários, dashboard
lib/                 integração Supabase, dados, modelos, cálculo, emails
public/images/       logótipo oficial e imagens recortadas das referências
supabase/migrations/ modelo relacional, RLS, stock atómico, rascunhos
scripts/             verificação de integridade
 tests/              testes de catálogo, preços e personalização
.env.example         nomes das variáveis (sem segredos)
package.json         scripts e dependências, na raiz
```

## Limitações e trabalho de ativação

- **Fotografias e produtos**: os 165 rascunhos são sugestões, não modelos/stock confirmados. É preciso validar preços, fotos, disponibilidade, época e direitos antes da publicação.
- **Contas e pedidos**: requerem projeto Supabase online e migrações executadas.
- **Pagamentos**: requerem Stripe real, métodos elegíveis e webhook assinado; não há simulação de pagamento marcado como concluído.
- **Portes**: ficam por configurar pelo administrador.
- **Comércio legal**: páginas com textos de orientação e campos editáveis, não políticas finais prontas a publicar.
- **Emails**: opcionais, dependentes do Resend.
- **Carrinho**: persistência local no browser. A tabela `cart_items` existe para evolução para sincronização entre dispositivos; esta sincronização não está implementada.
- **Mais vendidos**: ainda não existe ordenação por vendas reais agregadas; a secção usa os produtos disponíveis, não inventa métricas.
- **Segurança operacional**: aplicar WAF/rate limit persistente na API de checkout, monitorização de webhooks e backups antes de escala real.

---

**Objetivo:** entregar uma base de e-commerce muito mais completa do que uma landing page, sem inventar inventário nem declarar integrações reais como testadas.

## Correção de compilação (11/11/2026)

O cliente Supabase do browser está em `lib/supabase.ts`. As funções que usam `next/headers` e a chave de serviço ficaram em `lib/supabase-server.ts`, importado apenas por Server Components e Route Handlers. Isto resolve o erro de compilação causado por `app/favoritos/page.tsx` importar indiretamente `next/headers`.

Verifique as variáveis de ambiente do Supabase antes de usar funcionalidades com contas, produtos ou encomendas.

## Correção de compilação TypeScript — 11/11/2026

A condição `i.personalized` no painel de administração passou a usar uma comparação booleana explícita (`i.personalized === true`), evitando o erro `Type unknown is not assignable to type ReactNode` em `components/admin-client.tsx` durante a verificação de tipos do Next.js.

Verificações disponíveis neste ambiente: 7 testes unitários passaram e `node scripts/check-project.mjs` passou. Não foi possível executar o `next build` completo, porque a instalação de dependências npm não terminou neste ambiente. Confirma o resultado na Vercel antes de considerar o deployment validado.


## Correção de tipos Supabase (Vercel, 11/11/2026)

`lib/supabase-server.ts` e `middleware.ts` tipam explicitamente os elementos passados a `setAll` com `CookieOptions` de `@supabase/ssr`. Isto corrige `Parameter 'values' implicitly has an 'any' type` durante o build TypeScript com `strict: true`. Não foram modificadas credenciais de acesso, produtos nem encomendas.

