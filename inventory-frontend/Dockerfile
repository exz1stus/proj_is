# Etap 1: Budowanie aplikacji (Node.js) - Zaktualizowano do wersji 22
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etap 2: Serwowanie przez Nginx
FROM nginx:alpine
# Kopiujemy zbudowane pliki Vite do folderu publicznego Nginxa
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiujemy domyślną konfigurację Nginx
RUN echo "server { \
    listen 80; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]