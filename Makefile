# ===========================================
# NutriSystem Makefile
# ===========================================

.PHONY: help build up down restart logs logs-api logs-web logs-nginx logs-db \
        migrate migrate-fresh seed seed-run \
        composer-install composer-update \
        npm-install npm-run npm-build npm-lint \
        tinker test db-reset fresh \
        stop clean ps categorize

# ===========================================
# Variables
# ===========================================
COMPOSE = docker compose
COMPOSE_API = $(COMPOSE) exec api
COMPOSE_WEB = $(COMPOSE) exec web
COMPOSE_DB = $(COMPOSE) exec db

# ===========================================
# help - Muestra los comandos disponibles
# ===========================================
help:
	@echo ""
	@echo "NutriSystem - Comandos disponibles:"
	@echo ""
	@echo "  make up              - Iniciar todos los servicios"
	@echo "  make down            - Detener todos los servicios"
	@echo "  make restart         - Reiniciar todos los servicios"
	@echo "  make logs            - Ver logs de todos los servicios"
	@echo "  make logs-api        - Ver logs del API"
	@echo "  make logs-web        - Ver logs del frontend"
	@echo "  make logs-nginx      - Ver logs de nginx"
	@echo ""
	@echo "  make migrate         - Ejecutar migraciones"
	@echo "  make migrate-fresh  - Recrear base de datos y ejecutar migraciones"
	@echo "  make seed           - Ejecutar seeders"
	@echo "  make tinker         - Abrir tinker (consola Laravel)"
	@echo "  make categorize     - Categorizar alimentos por macronutriente"
	@echo "  make categorize-dry - Simular categorización sin guardar"
	@echo "  make db-reset       - Reset completo de base de datos"
	@echo ""
	@echo "  make composer-install - Instalar dependencias PHP"
	@echo "  make composer-update - Actualizar dependencias PHP"
	@echo ""
	@echo "  make npm-install    - Instalar dependencias Node"
	@echo "  make npm-build      - Build de producción"
	@echo "  make npm-lint       - Ejecutar linter"
	@echo ""
	@echo "  make stop           - Detener servicios (sin remover)"
	@echo "  make clean          - Eliminar contenedores y volúmenes"
	@echo "  make ps             - Ver estado de contenedores"
	@echo ""

# ===========================================
# Docker Compose shortcuts
# ===========================================
up:
	$(COMPOSE) up -d
	@echo ""
	@echo "Servicios iniciados:"
	@echo "  - Frontend: http://localhost:8090"
	@echo "  - API:      http://localhost:8090/api"
	@echo "  - MySQL:    localhost:3307"

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

stop:
	$(COMPOSE) stop

logs:
	$(COMPOSE) logs -f

logs-api:
	$(COMPOSE) logs -f api

logs-web:
	$(COMPOSE) logs -f web

logs-nginx:
	$(COMPOSE) logs -f nginx

logs-db:
	$(COMPOSE) logs -f db

ps:
	$(COMPOSE) ps

# ===========================================
# Base de datos - Migraciones
# ===========================================
migrate:
	$(COMPOSE_API) php artisan migrate

migrate-fresh:
	$(COMPOSE_API) php artisan migrate:fresh

migrate-fresh-seed:
	$(COMPOSE_API) php artisan migrate:fresh --seed

seed:
	$(COMPOSE_API) php artisan db:seed

seed-run:
	$(COMPOSE_API) php artisan db:seed --class=DatabaseSeeder

tinker:
	$(COMPOSE_API) php artisan tinker

categorize:
	$(COMPOSE_API) php artisan foods:categorize

categorize-dry:
	$(COMPOSE_API) php artisan foods:categorize --dry-run

test:
	$(COMPOSE_API) php artisan test

db-reset:
	$(COMPOSE_API) php artisan migrate:fresh --seed

# ===========================================
# Composer (PHP)
# ===========================================
composer-install:
	$(COMPOSE_API) composer install

composer-update:
	$(COMPOSE_API) composer update

# ===========================================
# NPM (Node.js)
# ===========================================
npm-install:
	$(COMPOSE_WEB) npm install

npm-run:
	$(COMPOSE_WEB) npm run dev

npm-build:
	$(COMPOSE_WEB) npm run build

npm-lint:
	$(COMPOSE_WEB) npm run lint

# ===========================================
# Utilidades
# ===========================================
clean:
	$(COMPOSE) down -v
	@echo "Contenedores y volúmenes eliminados"

fresh: down up
	@echo "Reiniciando servicios..."

# ===========================================
# atajos常用
# ===========================================
install: composer-install npm-install migrate
	@echo "Proyecto configurado correctamente"

serve: up
	@echo "Proyecto iniciado. Accede a http://localhost:8090"
