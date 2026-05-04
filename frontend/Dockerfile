# ──────────────────────────────────────────────
#  Frontend (React / Vite)  — Dockerfile
#  Multi-stage: build then serve via Nginx
# ──────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL is injected at build time via --build-arg
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Single-page app: all routes → index.html
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
