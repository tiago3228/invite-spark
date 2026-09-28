# Plano — Ativar o banco de dados e executar o SQL da Fase 1

## Objetivo
Dar acesso ao banco de dados do projeto e publicar o script SQL da Fase 1 (perfis, temas e convites), sem que você precise abrir um editor SQL manualmente.

## Passos

1. **Ativar o Lovable Cloud** — isso provisiona o banco de dados, autenticação e o editor SQL do projeto automaticamente.

2. **Executar o script da Fase 1 com dois ajustes de segurança:**
   - **Papéis (roles) em tabela separada:** em vez da coluna `role` dentro de `profiles`, criar a tabela `user_roles` com a função `has_role()`. Guardar papel na tabela de perfil permite que um usuário se promova a admin — é uma vulnerabilidade conhecida.
   - **Adicionar comandos `GRANT`:** sem eles, o app não consegue acessar as tabelas mesmo com as políticas de segurança criadas.

3. **Estrutura final criada:**
   - `profiles` — nome e WhatsApp do cliente (preenchido automaticamente no cadastro)
   - `user_roles` — papéis (`customer`, `admin`) em tabela separada e segura
   - `themes` — temas de convite, com 3 temas iniciais (Jardim, Essência, Celebre)
   - `invitations` — os convites de cada cliente, com status, data, conteúdo e configurações

4. **Verificar** que as tabelas foram criadas e que o cadastro/login do site já passa a funcionar com o banco real.

## Detalhes técnicos
- O SQL será executado como migração única, idempotente (`if not exists`), igual ao seu arquivo.
- Políticas de acesso (RLS): usuário só vê/edita o próprio perfil e os próprios convites; temas ativos são públicos para leitura.
- Trigger `handle_new_user` cria o perfil automaticamente a cada novo cadastro.
