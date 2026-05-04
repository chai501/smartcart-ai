# ──────────────────────────────────────────────
#  Backend (Node.js / Express)  — Dockerfile
# ──────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Install deps first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000
CMD ["node", "index.js"]
