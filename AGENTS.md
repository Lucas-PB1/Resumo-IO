<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Guidelines (Resume.io CMS)

## 🎨 Design System: Midnight Premium

Toda a interface deve seguir a estética profissional e moderna de Dashboards (Linear/Stripe style):

- **Cores base:** Dark Background, Cards com `bg-card/60` e `backdrop-blur-2xl`.
- **Cantos:** Arredondamento agressivo mas elegante (`rounded-2xl` para cards, `rounded-xl` para inputs).
- **Acentos:** Usar a escala `brand-500` (roxo/azul) para ações principais e `white/5` ou `white/10` para bordas sutis.
- **Micro-interações:** Uso de `motion/react` para estados de entrada e hover (sem elevação excessiva).

## 🏗️ Arquitetura: Clean & Modular

- **Services:** Toda lógica de Firebase, Storage ou manipulação de arquivos deve estar em arquivos `.service.ts` dentro da feature correspondente.
- **Hooks:** Lógica de estado e formulários deve ser extraída para Hooks customizados.
- **DRY:** Reutilizar componentes de UI de `components/ui/` em vez de criar ad-hoc.

## 📄 Automação de Documentos

- **Templating:** Usar `docxtemplater` com sintaxe `{etiqueta}` em arquivos `.docx`.
- **Imagens:** Chaves começando com `foto_` ou `imagem_` são detectadas automaticamente como fotos.
- **PDF:** Geração via API Route (`/api/convert/pdf`) usando Puppeteer/Chromium para manter alta fidelidade sem dependências externas.
- **Storage:** Modelos em `/templates` e relatórios gerados em `/reports`.
