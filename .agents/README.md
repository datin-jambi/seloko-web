# SELOKO WEB — AI Agent System

Repositori ini dilengkapi dengan sistem agen terstruktur untuk memastikan setiap pengembangan frontend mengikuti standar arsitektur BPKPD Provinsi Jambi, berdaya tahan tinggi, dan terbebas dari kesan template generik buatan AI (*Anti-AI-Slop*).

## Struktur Direktori `.agents/`
```text
.agents/
├── prd/                                    # Living Product Requirements Documents
│   ├── README.md                           # Indeks seluruh PRD
│   ├── 01-seloko-web-architecture.prd.md   # Fondasi frontend & App Switcher
│   ├── 02-design-system.prd.md             # Panduan tema, token, dan shadcn components
│   └── 03-api-integration.prd.md          # Standar komunikasi dengan seloko-api
├── rules/                                  # Standar dan aturan baku pengkodean
│   └── seloko-web-standards.md             # Aturan TypeScript, React, Tailwind & State
└── skills/                                 # SOP dan workflow praktis agen
    ├── human-ui-crafting/                  # Standar UI manusiawi & anti-template AI
    ├── component-crafting-workflow/        # SOP pembuatan komponen shadcn atomik
    ├── api-query-workflow/                 # SOP TanStack Query & multi-app cache
    ├── resilience-error-workflow/          # SOP Error Boundary, 403, 404, dan visual state
    └── add-page-workflow/                  # SOP penambahan modul/halaman baru
```
