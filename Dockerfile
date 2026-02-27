# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package files e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# La URL del backend se inyecta en el build como argumento
# Dokploy lo pasa como build-arg en la configuración del servicio
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Generar build de producción
RUN npm run build

# ─── Stage 2: Serve con Nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Copiar el build al directorio de nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
