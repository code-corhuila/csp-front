# csp-front Dockerfile
# Multi-stage build: build the Angular shell, then serve it with nginx

# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/shell/browser /usr/share/nginx/html

# Per-environment files are rendered from the container environment at startup
COPY deploy/runtime/*.template /opt/csp-runtime/
COPY deploy/runtime/40-render-runtime-config.sh /docker-entrypoint.d/40-render-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-render-runtime-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1
