# GreenTech

O GreenTech é um marketplace social de logística reversa que conecta quem possui materiais recicláveis a catadores próximos. O objetivo é retirar resíduos do descarte incorreto, facilitar a coleta e tornar visíveis o trabalho e a renda gerados na cadeia da reciclagem.

## O que o protótipo demonstra

- jornadas separadas para cidadão/empresa, catador e cooperativa;
- anúncio de resíduos com foto, peso, endereço e geolocalização;
- classificação assistida por visão computacional, com fallback de demonstração;
- mapa de oportunidades e reserva de coleta;
- rota de múltiplas coletas organizada por proximidade;
- chat entre doador e catador;
- histórico e notificações;
- Passaporte Circular com cadeia de custódia encadeada por hashes SHA-256;
- homologação pela cooperativa com peso aferido, correção do material, destino e comprovante;
- Central de Impacto baseada no histórico real do usuário;
- gamificação com GreenCoins, EcoStore e EcoJardim.

## Demonstração sugerida para o IFTech

1. Entre como cidadão e anuncie um resíduo.
2. Mostre a classificação da foto e o ponto criado no mapa.
3. Entre como catador, reserve a coleta e mostre a rota otimizada.
4. Conclua a coleta e abra **Histórico → Ver passaporte**.
5. Entre como cooperativa, confira o peso e o material e homologue o recebimento.
6. Abra o comprovante para mostrar o novo elo `COOP_RECEIPT` e a verificação SHA-256.
7. Volte ao início e abra **Meu impacto** para mostrar peso recuperado, renda viabilizada, composição dos materiais e estágio da cadeia circular.
8. Encerre relacionando os indicadores aos ODS 8 e 12.

Contas locais de demonstração:

- cidadão: `producer@test.com` / `password`
- catador: `collector@test.com` / `password`
- cooperativa: `cooperative@test.com` / `password`

## Como executar

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev:full
```

O frontend abre pelo Vite e a API local usa a porta `3002`. Sem `POSTGRES_URL` ou `DATABASE_URL`, o servidor usa SQLite. Em produção, usa PostgreSQL.

## Arquitetura

- React + Vite para a interface web/PWA;
- Capacitor para o aplicativo Android;
- Node.js + Express para a API;
- SQLite no desenvolvimento e PostgreSQL em produção;
- Leaflet para mapas;
- SHA-256 para verificar integridade da cadeia de custódia;
- integração opcional com Gemini para análise de imagem e apoio à rota.

## Transparência da automação

A triagem de imagem informa na própria tela se utilizou o Google Gemini ou o modo de demonstração. O modo de demonstração é explicitamente identificado como resultado simulado e exige conferência manual. A rota também informa pela API se a ordem veio do Gemini ou da heurística geográfica local; nesse segundo caso, o sistema não inventa distância nem economia de combustível.

O Passaporte Circular usa encadeamento de hashes SHA-256 para detectar alterações nos registros. Ele não deve ser apresentado como blockchain nem como auditoria externa.

## Integridade dos indicadores

A Central de Impacto conta como recuperado apenas o peso de itens nos estados `collected`, `homologated` ou `recycled`. A renda exibida é uma estimativa operacional do protótipo de R$ 0,50 por quilograma e não deve ser apresentada como pagamento comprovado, crédito de reciclagem ou crédito de carbono auditado.

## Próximos marcos

1. Validação de coleta por QR Code entre doador e catador.
2. Piloto com uma cooperativa e métricas de tempo, renda e taxa de conclusão.
3. Funcionamento offline com sincronização posterior em áreas de sinal instável.
4. Política de privacidade, consentimento de localização e controle de acesso por papel.

> SDN/SD-WAN é uma direção de infraestrutura para integrações futuras com cooperativas e balanças. O MVP atual opera sobre HTTPS e infraestrutura web/serverless; não deve ser apresentado como uma implantação SDN já realizada.
