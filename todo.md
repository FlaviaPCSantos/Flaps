# Flaps - TODO List

## Itens Concluídos com Sucesso
- [x] Design system elegante (branco, bege, rosa pó, dourado)
- [x] Página inicial com hero section e vitrine responsiva
- [x] Integração com API pública do Mercado Livre
- [x] Scraper com Puppeteer para extrair produtos de página de afiliado
- [x] Painel administrativo com gerenciamento de produtos
- [x] Categorização automática com IA (LLM)
- [x] Badges de destaque e "Mais Vendido"
- [x] Otimização mobile (lazy loading, layout responsivo)
- [x] Página de detalhes do produto
- [x] Página "Sobre" com informações da marca
- [x] Filtro por categoria
- [x] Busca por palavra-chave
- [x] 55 testes passando

## Itens Finais Pendentes
- [x] Configurar Heartbeat/cron real para sincronização automática a cada 6 horas (task_uid: GrWdJxipxoBWwnSwzwiyLL, cron: 0 0 */6 * * *)
- [x] Lazy loading de imagens (nativo com loading="lazy")


## Implementação da API do Mercado Livre (Concluído)
- [x] Criar serviço de busca de produtos via API pública do ML
- [x] Implementar endpoint tRPC para buscar produtos por palavra-chave
- [x] Criar formulário no painel admin para importar produtos
- [x] Atualizar handlers de sincronização periódica
- [x] Remover dependência do Puppeteer
- [x] Testar fluxo completo (55 testes passando)


## Modo Mock/Teste (Temporário - Aguardando API do ML)
- [x] Implementar modo mock em mlApi.ts com dados de teste
- [x] Produtos mock: iPhone, Fone, Smartwatch, Laptop
- [x] Funcionalidade de busca funcionando com dados mock
- [x] Painel admin "Importar Produtos" testável com dados mock
- [x] Quando API for liberada: alterar USE_MOCK_MODE = false em mlApi.ts (instrução documentada no código)


## Integração OAuth do Mercado Livre (Concluído)
- [x] Criar fluxo de autenticação OAuth 2.0
- [x] Implementar endpoint `/api/ml/auth` para iniciar autenticação
- [x] Implementar callback handler `/api/ml/callback` para receber código
- [x] Criar tabela `ml_tokens` para armazenar tokens
- [x] Implementar refresh automático de tokens
- [x] Adicionar botão "Conectar Mercado Livre" no painel admin
- [x] Testar fluxo completo (57 testes passando)

## Melhorias Implementadas
- [x] Adicionar filtro de preço na vitrine (slider com range R$ 0 - R$ 10.000)
- [x] Criar página de "Novidades" com produtos recém-adicionados (12 produtos mais recentes)
- [x] Implementar wishlist/favoritos (endpoints tRPC: list, add, remove, isFavorite)

## Suporte a Links de Afiliado (Concluído)
- [x] Criar função extractProductFromAffiliateLink para extrair dados do HTML
- [x] Integrar extracção no endpoint products.add
- [x] Preservar link de afiliado original para rastreamento de comissão
- [x] Tornar mlId opcional no schema (permite produtos sem ID do ML)
- [x] Implementar fallback para API pública se extração falhar
- [x] Adicionar 7 testes para validação (64 testes passando)
- [x] Melhorar expandMeliLink para detectar páginas de promoção
- [x] Filtrar IDs de produtos em contexto de "meli+" ou "promoção"
- [x] Usar API do ML com ID correto ao invés de extrair do HTML

## Melhorias Futuras (Não Críticas)
- [x] Usar token OAuth para sincronizar produtos em tempo real
- [x] Adicionar avaliações de produtos
- [x] Integrar com sistema de notificações
- [x] Implementar UI de favoritos no frontend
- [x] Criar página de wishlist do usuário

## Suporte a Links de Afiliado com Dois Campos (Concluído)
- [x] Atualizar schema para adicionar campo mlLink (link original) separado de affiliateLink
- [x] Criar migração do banco de dados para os novos campos
- [x] Modificar endpoint products.add para aceitar mlLink e affiliateLink separadamente
- [x] Implementar extração de dados usando mlLink como fonte principal
- [x] Adicionar suporte a preenchimento manual de dados (título, preço, imagem)
- [x] Implementar fallback para manual se extração automática falhar
- [x] Garantir que produto seja sempre salvo mesmo com erro de extração
- [x] Atualizar UI do painel admin para aceitar dois links
- [x] Testar cadastro com links de afiliado do perfil FLAVIASTS
- [x] Garantir que botão "Comprar" usa o link de afiliado correto


## Melhorias de Extração de Preço (Concluído)
- [x] Melhorar tratamento de erro para produtos de outros países (API 403)
- [x] Adicionar instruções claras para preenchimento manual de dados
- [x] Adicionar logging detalhado para debug de extração
- [x] Suportar preenchimento manual quando API falha (ex: produtos argentinos)


## Correção de Extração de Preço e Imagem (Concluído)
- [x] Priorizar preço com desconto quando disponível (não o preço original)
- [x] Melhorar regex para detectar padrões "R$ XX,XX" com desconto
- [x] Extrair imagem principal do produto corretamente
- [x] Testar com links reais de produtos do Mercado Livre
- [x] Validar extração em múltiplos formatos de página do ML


## Simplificação da UI (Concluído)
- [x] Remover coluna "Preço" da tabela de produtos no painel admin
- [x] Remover exibição de preço da vitrine pública
- [x] Converter "Destaque" em toggle Sim/Não no painel admin
- [x] Simplificar componentes de vitrine: apenas foto + descrição + botão de link
- [x] Testar mudanças na vitrine pública


## Melhorias de Busca e Filtros (Completo)
- [x] Melhorar barra de pesquisa com sugestões em tempo real
- [x] Adicionar filtro por faixa de preço (slider)
- [x] Adicionar filtro por categoria
- [x] Adicionar filtro por popularidade/mais vendidos
- [x] Adicionar opção de ordenação (preço, relevância, novidade)
- [x] Implementar busca avançada com múltiplos filtros


## Configuração de SEO (Completo)
- [x] Adicionar títulos e meta descrições otimizados para cada página
- [x] Estruturar cabeçalhos (H1, H2, H3) corretamente
- [x] Implementar dados estruturados (Schema.org)
- [x] Gerar sitemap.xml
- [x] Criar robots.txt
- [x] Configurar URLs amigáveis
- [x] Adicionar textos otimizados para Google
- [x] Configurar Open Graph e Twitter Cards

## Aplicação de SEO em Todas as Páginas (Completo)
- [x] Aplicar SEO em Home.tsx com Organization schema
- [x] Aplicar SEO em Novidades.tsx com BreadcrumbList
- [x] Aplicar SEO em About.tsx com BreadcrumbList
- [x] Aplicar SEO em ProductDetail.tsx com Product schema
- [x] Revisar hierarquia H1/H2/H3 em todas as páginas
- [x] Remover H1 duplicado no branding da navbar (usar span)
- [x] Adicionar aria-labels para acessibilidade

## Skill Reutilizável (Completo)
- [x] Criar dev-oauth-helper skill para padrão de OAuth em desenvolvimento
- [x] Documentar processo de mock OAuth para testes locais
- [x] Incluir referências de padrões de sessão
- [x] Documentar workaround para domínios dinâmicos de pré-visualização


## Sistema de Autenticação Admin (Completo)
- [x] Criar tabela de admin no banco de dados
- [x] Implementar hash de senha (bcrypt)
- [x] Criar endpoint de login com email/senha
- [x] Criar página de login com formulário
- [x] Proteger rota /admin com middleware de autenticação
- [x] Adicionar logout funcional
- [x] Testar sistema de login completo


## Configurações de Conta Admin (Completo)
- [x] Criar página de configurações de conta no painel admin
- [x] Implementar formulário para alterar email (com verificação de senha atual)
- [x] Implementar formulário para alterar senha (com validação de força)
- [x] Criar endpoints tRPC para atualizar email e senha
- [x] Adicionar validações de segurança (senha atual correta, nova senha forte)
- [x] Implementar confirmação de mudanças
- [x] Testar fluxo completo de alteração de credenciais
- [x] Corrigir autenticação para suportar ambos os tipos de login (OAuth e Email/Senha)
- [x] Estender contexto tRPC para ler admin session cookie
- [x] Testar página de configurações de conta com login seguro


## Correção de Bugs Pós-Publicação
- [x] Corrigir erro 404 ao clicar em "Admin Dev" no site publicado
- [x] Verificar rota /admin/dev-login e garantir que funciona em produção
- [x] Testar login e adição de produtos no domínio publicado
- [x] Teste completo de fluxo: Homepage → Admin Login → Dashboard → Adicionar Produto
- [x] Validação de dados (rejeita produtos sem preço válido)
- [x] Verificação de SEO em todas as páginas
- [x] Teste de responsividade mobile
- [x] Teste de busca e filtros na homepage


## Autenticação com Email/Senha (Concluído)
- [x] Instalar cookie-parser middleware
- [x] Configurar Express para parsear cookies
- [x] Corrigir nome do cookie (app_session_id)
- [x] Implementar login com email/senha funcional
- [x] Testar formulário de login
- [x] Testar redirecionamento para /admin após login bem-sucedido
- [x] Verificar persistência de sessão no banco de dados
- [x] Testar logout funcional


## Mudanças de Transparência e Posicionamento (Concluído)
- [x] Trocar botão "Comprar" para "Ver no Mercado Livre" em todos os produtos
- [x] Adicionar aviso "Preço e disponibilidade podem mudar no site do vendedor"
- [x] Adicionar aviso "A Flaps pode receber uma comissão pelas compras realizadas por meio dos links indicados, sem custo adicional para você"
- [x] Atualizar tagline da homepage: "Flaps: curadoria de moda acessível para você que quer se vestir bem sem perder horas procurando"
- [x] Criar seção "Como funciona" na homepage com 4 passos
- [x] Testar responsividade dos novos avisos em mobile
- [x] Testar links de afiliado funcionando corretamente


## Melhorias de UX e Conteúdo (Concluído)
- [x] Remover "Admin" e "Admin Dev" do menu público
- [x] Corrigir erros de português (você, peças, preço, acessível)
- [x] Padronizar menu em todas as páginas públicas
- [x] Reescrever nomes exibidos nos cards para uma apresentação mais natural
- [x] Adicionar explicações transparentes de por que cada peça foi selecionada
- [x] Reorganizar o aviso de comissão para aparecer uma vez no topo da vitrine
- [x] Criar categorias por ocasião (trabalho, festa, básicos, achados baratos)
- [x] Melhorar contraste e foco visível dos botões
- [x] Reescrever página "Sobre" com critérios reais de curadoria
- [x] Remover promessas de "alta qualidade" não testada diretamente


## Ajustes de Validação Antes do Checkpoint
- [x] Tornar a justificativa de curadoria específica por produto, com campo editorial persistido e fallback contextual
- [x] Padronizar contraste e foco visível em todos os botões públicos, incluindo hero da Home e CTA da página Sobre


## Revisão Final de Acessibilidade dos Botões
- [x] Padronizar Favoritar e Compartilhar em ProductDetail com foco visível e contraste consistente
- [x] Fazer varredura final de ações públicas e validar o mesmo padrão visual


## Auditoria Final de Ações com Ícone
- [x] Padronizar os botões de favorito nos cards da Home e de Novidades com contraste e foco visível
- [x] Auditar ações públicas restantes, incluindo botões de ícone, antes do checkpoint


## Correção de Produtos Ausentes e Imagens Quebradas (Concluído)
- [x] Identificar quais registros são dados de teste e quais são produtos reais
- [x] Identificar por que algumas URLs de imagem não carregam
- [x] Corrigir fallback e validação de imagens sem apagar produtos reais
- [x] Revisar filtros e contagem de produtos exibidos na vitrine
- [x] Testar a vitrine após a correção


## Validação Final da Origem das Imagens
- [x] Validar URLs de imagem no fluxo de criação/importação e marcar URLs placeholder para revisão
- [x] Testar manualmente Home, Novidades e detalhe do produto após a correção


## Revisão Administrativa de Imagens (Concluído)
- [x] Adicionar campo imageNeedsReview ao produto e migrar o banco
- [x] Aplicar a validação de imagem nos fluxos de criação e importação via createProduct centralizado
- [x] Exibir sinalização de imagem pendente no painel admin
- [x] Testar a sinalização e a validação de URLs inválidas


## Verificação de Sincronização com GitHub (Concluído)
- [x] Comparar o repositório público FlaviaPCSantos/Flaps com o projeto atual
- [x] Confirmar se as alterações recentes estão presentes no histórico público
- [x] Orientar a sincronização segura sem expor senha ou token


## Orientação de Sincronização com GitHub (Concluído)
- [x] Concluir a análise informando que o repositório público está desatualizado
- [x] Orientar o uso de token de acesso pessoal (PAT) ou autenticação via chave SSH no GitHub


## Sincronização para o repositório renomeado
- [ ] Atualizar o destino para `FlaviaPCSantos/Flaps-afiliado`, autorizar somente esse repositório e verificar o push público
