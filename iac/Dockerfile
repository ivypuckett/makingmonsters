FROM golang:1.24-alpine AS builder

WORKDIR /build

# Cache dependencies
COPY server/go.mod server/go.sum ./
RUN go mod download

# Build the server binary
COPY server/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o pocketbase .

# --- Runtime image ---
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /build/pocketbase .

# pb_public is populated at build time with the compiled Svelte frontend
COPY build/public/ ./pb_public/

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
