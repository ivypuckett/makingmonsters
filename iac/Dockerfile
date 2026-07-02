# --- Stage 1: build the Svelte frontend ---
FROM node:22-alpine AS frontend

WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
# vite.config.js outputs to ../build/pb_public relative to client/ → /app/build/pb_public
RUN cd client && npm run build

# --- Stage 2: fetch the stock PocketBase release ---
FROM alpine:latest AS pocketbase

ARG PB_VERSION=0.23.0
RUN apk add --no-cache ca-certificates unzip wget
RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip -d /pb

# --- Runtime image ---
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=pocketbase /pb/pocketbase ./pocketbase
# PocketBase serves ./pb_public and stores ./pb_data next to the binary
COPY --from=frontend /app/build/pb_public ./pb_public/

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
