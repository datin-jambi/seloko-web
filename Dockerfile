# SELOKO WEB — image produksi (static SPA + nginx sebagai reverse proxy /api).
#
# Build:  docker build -t seloko-web .
# Nilai VITE_* TIDAK dikirim sebagai build-arg: semuanya punya fallback di
# src/config/constants.ts yang sudah benar untuk produksi (/api relatif, kode
# aplikasi `seloko`). `.env` sengaja di-.dockerignore agar image tidak
# bergantung pada konfigurasi mesin pengembang.
#
# Lokasi API diatur saat RUNTIME lewat env API_UPSTREAM (default `api:3000`),
# bukan saat build — jadi satu image bisa dipakai di server mana pun.

# ─── Tahap 1: build aset ────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Tahap 2: sajikan + proxy ───────────────────────────────────────────────
FROM nginx:1.29-alpine AS runtime

ENV API_UPSTREAM=api:3000

RUN rm -f /etc/nginx/conf.d/default.conf

COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1
