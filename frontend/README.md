# NoSQL Dashboard - Frontend

Dashboard moderno para análise e visualização de dados em tempo real.

## Features

- 📤 **Upload de Ficheiros**: Suporta CSV e XLSX
- 📊 **Gráficos Interativos**: Gráficos de barras, pizza e linhas
- 📈 **Análise de Dados**: Resumo estatístico de valores numéricos
- 🎨 **Interface Moderna**: Construído com Next.js, Tailwind CSS e shadcn/ui

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Certifique-se de que o backend está rodando em `http://localhost:3001`.

## Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Estrutura do Projeto

```
frontend/
├── app/                    # Aplicação Next.js
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── Dashboard.tsx      # Componente de dashboard com gráficos
│   ├── FileUpload.tsx     # Componente de upload de ficheiros
│   ├── MainApp.tsx        # Componente principal
│   └── ui/                # Componentes shadcn/ui
├── lib/                   # Utilitários e tipos
│   ├── api.ts            # Cliente HTTP
│   ├── types.ts          # Tipos TypeScript
│   └── utils.ts          # Funções utilitárias
└── public/               # Arquivos estáticos
```

## Fluxo da Aplicação

1. **Upload**: Selecione um ficheiro CSV ou XLSX
2. **Envio**: Ficheiro enviado para backend via POST `/upload`
3. **Dashboard**: Após sucesso, exibem-se gráficos e análises
4. **Visualização**: Dados visualizados em gráficos interativos

## Componentes

### FileUpload
Upload de ficheiros com validação e feedback.

### Dashboard
Exibe gráficos e estatísticas:
- Total de registos e colunas
- Resumo numérico (mín, máx, média)
- Distribuição de categorias
- Amostra de dados

### MainApp
Componente raiz que alterna entre upload e dashboard.

## Build

```bash
npm run build
npm start
```

## Tecnologias

- ✅ Next.js 15+ com App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ shadcn/ui
- ✅ Recharts
- ✅ Axios
