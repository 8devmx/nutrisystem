FROM node:20-alpine

WORKDIR /app

# Dependencias del sistema
RUN apk add --no-cache libc6-compat

# Copiar código fuente completo
COPY . .

# Instalar dependencias
RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev"]
