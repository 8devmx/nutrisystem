FROM node:20-alpine

WORKDIR /app

# Dependencias del sistema
RUN apk add --no-cache libc6-compat

# Instalar dependencias primero (cache de Docker)
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
