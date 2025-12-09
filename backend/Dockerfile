FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Puerto de la aplicación
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/index.js"]
