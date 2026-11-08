<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Guidelines (Minuta)

Produto: transforma modelos `.docx` com `{etiquetas}` em formulários e gera documentos (petições, relatórios, pareceres). Público principal: advogados(as) que querem acelerar peças repetitivas. O nome do produto fica em `lib/brand.ts` — nunca escreva o nome direto no código.

## 🎨 Design System: Editorial sóbrio

Visual de ferramenta de trabalho, não de landing page. Referências: Linear, Notion, Stripe Dashboard em modo claro.

- **Temas:** claro (padrão) e escuro, via classe `.dark` no `<html>` (`components/theme`). Use sempre os tokens semânticos (`bg-background`, `bg-card`, `bg-surface`, `text-muted-foreground`, `text-subtle-foreground`, `border-border`, `border-border-strong`, `bg-primary`, `text-danger`, `bg-success-soft`…). Nunca use cores fixas (`white/5`, `red-500`, hex) em componentes.
- **Tipografia:** Inter para interface; Newsreader (`font-serif`) só para títulos de página e marca. Pesos 400/500/600 — sem `font-black`, sem `tracking-widest uppercase` em rótulos.
- **Cor:** `primary` (azul-tinta) só para a ação principal da tela e estados ativos. O resto é neutro.
- **Superfícies:** cards `rounded-xl border bg-card shadow-xs`; inputs `rounded-lg` (via `components/ui`). Sem gradientes, sem glassmorphism, sem `shadow-2xl`.
- **Movimento:** `motion/react` apenas para entrada de overlays (dialog, toast, menus). Nada de animar cada card ou `scale` no hover.
- **Feedback:** nunca `alert()`/`confirm()`. Use `useToast()` e `useConfirm()` (`components/ui`). Carregamento com `Skeleton`, listas vazias com `EmptyState`.
- **Texto:** português claro e direto, sem jargão de marketing ("inteligência", "premium", "tempo real").

## 🏗️ Arquitetura: Clean & Modular

- **Services:** Toda lógica de Firebase, Storage ou manipulação de arquivos deve estar em arquivos `.service.ts` dentro da feature correspondente.
- **Hooks:** Lógica de estado e formulários deve ser extraída para Hooks customizados.
- **DRY:** Reutilizar componentes de UI de `components/ui/` (Button/`buttonVariants`, Input, Select, Dialog, Toast, Confirm, PageHeader, EmptyState, Skeleton, Badge, FileChip) em vez de criar ad-hoc.
- **Links com cara de botão:** use `<Link className={buttonVariants(...)}>` — nunca `<Link><Button/></Link>`.

## 📄 Automação de Documentos

- **Templating:** Usar `docxtemplater` com sintaxe `{etiqueta}` em arquivos `.docx`.
- **Imagens:** Chaves começando com `foto_` ou `imagem_` são detectadas automaticamente como fotos.
- **PDF:** Geração via API Route (`/api/convert/pdf`) usando Puppeteer/Chromium para manter alta fidelidade sem dependências externas.
- **Storage:** Modelos em `/templates` e relatórios gerados em `/reports`.
