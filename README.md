
# PREGÃO - Frontend

Este é o repositório do front-end para a plataforma PREGÃO, um marketplace e ERP modular desenvolvido com React, TypeScript e Vite.

## Funcionalidades Principais

- **Módulos**: Quero Vender, Quero Comprar, Delivery, POS e Backoffice.
- **Gestão de Perfis**: Controlo de acesso baseado em papéis (Admin, Gerente, Supervisor, Vendedor).
- **Gestão de Stock Avançada**: Lotes, validade, FIFO/LIFO, embalagens, unidades de medida.
- **Importação em Massa**: UI para mapear e validar dados de ficheiros (Excel/CSV/PDF).
- **Delivery Tracking**: Acompanhamento de entregas em tempo real num mapa.
- **PWA**: Suporte offline para catálogo e carrinho, scanner de código de barras.

## Stack Tecnológica

- **Framework**: Vite + React + TypeScript
- **Estilização**: Tailwind CSS + Headless UI
- **Routing**: React Router
- **Data Fetching**: TanStack Query (React Query)
- **Formulários**: React Hook Form + Zod
- **API Client**: Axios
- **Mocking**: Mock Service Worker (MSW)
- **Mapas**: Leaflet + OpenStreetMap
- **Testes**: Jest, React Testing Library, Playwright (E2E)

---

## Configuração do Ambiente

### Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn

### 1. Clonar o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd pregao-frontend
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um ficheiro `.env` na raiz do projeto, copiando o conteúdo de `.env.example`:

```bash
cp .env.example .env
```

Edite o ficheiro `.env` e ajuste a variável `VITE_API_URL` para o URL do seu back-end. Durante o desenvolvimento com mocks, este valor pode ser ignorado.

```
VITE_API_URL=http://localhost:8000/api
```

---

## Comandos Disponíveis

### Desenvolvimento

Para iniciar o servidor de desenvolvimento com hot reload e mocks (MSW) ativados:

```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`.

### Build

Para compilar e otimizar a aplicação para produção:

```bash
npm run build
```
Os ficheiros estáticos serão gerados no diretório `dist/`.

### Preview

Para pré-visualizar a build de produção localmente:

```bash
npm run preview
```

---

## Testes

### Testes Unitários e de Integração

Para executar os testes definidos com Jest e React Testing Library:

```bash
npm run test
```

### Testes End-to-End (E2E)

Os testes E2E são executados com Playwright. Primeiro, instale os browsers necessários:

```bash
npx playwright install
```

Para executar os testes E2E em modo headless:

```bash
npm run e2e
```

Para executar os testes E2E com a UI do Playwright (modo interativo):

```bash
npx playwright test --ui
```

---

## Estrutura do Projeto

```
.
├── public/              # Ficheiros estáticos (manifest, msw worker)
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # React Contexts (ex: AuthContext)
│   ├── hooks/           # Custom Hooks (ex: useAuth)
│   ├── lib/             # Configuração de bibliotecas (ex: axios)
│   ├── mocks/           # Configuração do MSW (handlers, data)
│   ├── pages/           # Componentes de página (rotas)
│   ├── services/        # Lógica de comunicação com API
│   ├── types/           # Definições de tipos TypeScript
│   ├── utils/           # Funções utilitárias
│   ├── App.tsx          # Componente principal e rotas
│   └── index.tsx        # Ponto de entrada da aplicação
├── tests/
│   ├── e2e/             # Testes End-to-End (Playwright)
│   └── unit/            # Testes unitários (Jest)
├── .env.example         # Exemplo de variáveis de ambiente
├── package.json
└── vite.config.ts
```

## Conexão com a API

A comunicação com o back-end é gerida pelo `axios` (ver `src/lib/apiClient.ts`). O JWT é armazenado de forma segura (neste exemplo, em `localStorage`, mas para produção, `httpOnly cookies` são recomendados).

Para desativar os mocks e usar a API real, comente a linha `import('../mocks/browser')` no ficheiro `src/index.tsx`.
