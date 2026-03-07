# 🤖 AI_CONTEXT.md — Contexto para Agentes IA

> Este archivo existe para que cualquier agente de IA (GitHub Copilot, Cursor, Claude, etc.)
> entienda la arquitectura del proyecto y pueda continuar el desarrollo sin ambigüedades.
> Última actualización: Fase 2 completada.

---

## 📦 Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Laravel | 11.48.0 |
| Frontend | Next.js | 14+ |
| Base de datos | MySQL | 8.0 |
| Proxy | Nginx | 1.25-alpine |
| Contenedores | Docker Compose | v2+ |
| PHP | PHP-FPM | 8.2 (Alpine) |
| Node | Node.js | 20 (Alpine) |

---

## 🏗️ Arquitectura general

```
[Usuario]
    │
    ▼
[Nginx :80]  ← Proxy inverso único
    ├── /          → Next.js (frontend :3000)
    └── /api       → Laravel (backend :9000 PHP-FPM)
                        │
                        ▼
                   [MySQL :3306 interno / :3307 host]
```

El sistema es un **monorepo** con dos aplicaciones independientes que se comunican a través de Nginx.

---

## 🐳 Docker

### Contenedores

| Nombre | Imagen | Puerto host | Puerto interno |
|--------|--------|-------------|----------------|
| `nutrisystem_api` | `nutrisystem-api` (PHP 8.2-FPM Alpine) | — | 9000 |
| `nutrisystem_web` | `nutrisystem-web` (Node 20 Alpine) | — | 3000 |
| `nutrisystem_db` | `mysql:8.0` | 3307 | 3306 |
| `nutrisystem_nginx` | `nginx:1.25-alpine` | 80, 443 | 80, 443 |

### Comandos frecuentes

```bash
# Desde la raíz /nutrisystem
docker compose up -d           # Levantar todos los servicios
docker compose down -v         # Bajar y limpiar volúmenes
docker compose ps              # Ver estado de contenedores
docker compose logs -f db      # Ver logs de MySQL
docker compose exec api sh     # Entrar al contenedor API (Alpine = sh, no bash)

# Dentro del contenedor api
php artisan migrate
php artisan migrate:fresh --seed
php artisan route:list --path=api
```

### Variables de entorno (raíz /.env)

```
DB_DATABASE=nutrisystem
DB_USERNAME=nutri_user
DB_PASSWORD=nutri_pass
DB_ROOT_PASSWORD=root_pass
```

> ⚠️ El archivo `backend/.env` usa `DB_HOST=db` (nombre del servicio Docker), NO `127.0.0.1`.

---

## 🔐 Autenticación

- El sistema **NO gestiona usuarios directamente**. Los JWT provienen de un **Hub externo**.
- El backend Laravel actúa de forma **stateless**: valida el JWT en cada request, no crea sesiones.
- Middleware: `App\Http\Middleware\ValidateExternalJwt` → alias `auth.jwt`
- Registrado en: `bootstrap/app.php`
- El JWT debe contener: `user_id`, `email`. Opcional: `roles`, `exp`.
- **Nunca generes código que use `Auth::login()` o sesiones de Laravel para este sistema.**

---

## 📁 Estructura de directorios relevante

```
nutrisystem/
├── .env                          ← Variables Docker (raíz)
├── docker-compose.yml
├── nginx/conf.d/default.conf     ← Proxy inverso
├── docs/
│   ├── commits.md                ← Conventional Commits en español
│   ├── standards.md              ← StandardJS + PSR-12
│   └── AI_CONTEXT.md             ← Este archivo
│
├── backend/                      ← Laravel 11.48.0
│   ├── bootstrap/app.php         ← Registro de rutas API y middleware
│   ├── routes/api.php            ← Todas las rutas bajo /api/v1
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── BaseApiController.php   ← success() / error() helpers
│   │   │   │   ├── FoodController.php
│   │   │   │   ├── PlanController.php
│   │   │   │   └── UserController.php
│   │   │   └── Middleware/
│   │   │       └── ValidateExternalJwt.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Food.php           ← helper: caloriesForGrams(float $grams)
│   │   │   ├── Unit.php           ← helper: toGrams(float $quantity)
│   │   │   ├── FoodEquivalent.php
│   │   │   ├── Plan.php           ← helper: totalDays()
│   │   │   └── PlanMeal.php       ← helper: calculatedCalories()
│   │   └── Services/
│   │       └── NutritionService.php
│   └── database/
│       ├── migrations/            ← 6 migraciones custom + 3 de Laravel 11
│       └── seeders/
│           ├── DatabaseSeeder.php
│           └── UnitSeeder.php     ← 11 unidades de medida pre-cargadas
│
└── frontend/                     ← Next.js 14 (JS, no TypeScript)
    ├── src/app/                  ← App Router
    └── Dockerfile
```

---

## 🗄️ Esquema de base de datos

### `users` (extendida de Laravel)
```sql
id, name, email, password,
weight_kg DECIMAL(5,2), height_cm DECIMAL(5,2), age TINYINT,
sex ENUM('male','female'),
activity_factor ENUM('sedentary','light','moderate','active','very_active'),
created_at, updated_at
```

### `foods`
```sql
id, name, slug UNIQUE,
calories_per_100g DECIMAL(8,2),
protein_g DECIMAL(8,2), carbs_g DECIMAL(8,2),
fat_g DECIMAL(8,2), fiber_g DECIMAL(8,2),
image_path VARCHAR(255),
created_at, updated_at, deleted_at  ← SoftDeletes
```

### `units`
```sql
id, name, abbreviation, conversion_to_grams DECIMAL(8,4),
created_at, updated_at
```

Unidades pre-cargadas: `g, kg, pz, tz, cda, cdita, ml, l, oz, reb, por`

### `food_equivalents`
```sql
id, group_name VARCHAR,
food_id FK(foods), quantity DECIMAL(8,2),
unit_id FK(units), grams_equivalent DECIMAL(8,2),
created_at, updated_at
```

Grupos de intercambio: `Cereales`, `Proteínas`, `Frutas`, `Verduras`, `Lácteos`, `Grasas`

### `plans`
```sql
id, user_id FK(users), title, duration ENUM('weekly','biweekly','monthly'),
total_calories DECIMAL(8,2), protein_goal_g, carbs_goal_g, fat_goal_g,
created_at, updated_at, deleted_at  ← SoftDeletes
```

### `plan_meals`
```sql
id, plan_id FK(plans), day_number TINYINT,
meal_moment ENUM('breakfast','morning_snack','lunch','afternoon_snack','dinner'),
food_id FK(foods), quantity DECIMAL(8,2), unit_id FK(units),
created_at, updated_at
```

---

## 📡 Endpoints disponibles (verificados con `php artisan route:list`)

Base URL: `/api/v1` | Todas las rutas excepto `/health` requieren header `Authorization: Bearer <jwt>`

| Método | Ruta | Controller | Descripción |
|--------|------|-----------|-------------|
| `GET` | `/api/v1/health` | — | Health check público |
| `GET` | `/api/v1/foods` | `FoodController@index` | Lista paginada, params: `search`, `group` |
| `POST` | `/api/v1/foods` | `FoodController@store` | Crea alimento |
| `GET` | `/api/v1/foods/{id}` | `FoodController@show` | Detalle de alimento |
| `PUT` | `/api/v1/foods/{id}` | `FoodController@update` | Actualiza alimento |
| `DELETE` | `/api/v1/foods/{id}` | `FoodController@destroy` | Soft delete |
| `GET` | `/api/v1/foods/{id}/equivalences` | `FoodController@equivalences` | Alimentos del mismo grupo |
| `POST` | `/api/v1/plans` | `PlanController@store` | Genera plan nutricional |
| `GET` | `/api/v1/plans/{id}` | `PlanController@show` | Plan enriquecido con calorías y equivalencias |
| `DELETE` | `/api/v1/plans/{id}` | `PlanController@destroy` | Soft delete |
| `GET` | `/api/v1/users/{id}/requirements` | `UserController@requirements` | Requerimiento calórico diario |
| `PUT` | `/api/v1/users/{id}/profile` | `UserController@updateProfile` | Actualiza perfil nutricional |

### Estructura de respuesta estándar

```json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa",
  "errors": null
}
```

---

## 🧮 NutritionService — Reglas críticas

### Ubicación
`App\Services\NutritionService` — inyectable vía constructor.

### Método principal
```php
$service->calculateDailyRequirements(User $user): array
// Retorna: bmr, tdee, protein_g, carbs_g, fat_g, meal_distribution
```

### Fórmula de Mifflin-St Jeor
```
Hombres: BMR = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) + 5
Mujeres: BMR = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) - 161
TDEE = BMR × factor_actividad
```

### Factores de actividad
| Valor DB | Factor |
|----------|--------|
| `sedentary` | 1.2 |
| `light` | 1.375 |
| `moderate` | 1.55 |
| `active` | 1.725 |
| `very_active` | 1.9 |

### Distribución calórica por momento
| Momento | % |
|---------|---|
| `breakfast` | 25% |
| `morning_snack` | 10% |
| `lunch` | 35% |
| `afternoon_snack` | 10% |
| `dinner` | 20% |

### ⚠️ Reglas anti-alucinación para gramajes
1. **Nunca inventes valores nutricionales.** Todos los macros y calorías deben venir de la tabla `foods`.
2. **Las porciones son por 100g.** Escala desde `calories_per_100g` usando `Food::caloriesForGrams()`.
3. **Los gramajes de `food_equivalents`** son los únicos válidos para intercambios.
4. **Si un alimento no está en la DB**, retorna `404` con `"Alimento no registrado en el sistema"`. Nunca estimes.

---

## 🎨 Frontend — Estado actual

- Next.js 16 (App Router), JavaScript, Tailwind CSS v4, src/ directory.
- ✅ Fase 3 completada: Shadcn/UI configurado, formulario de cálculo dinámico, Plan Viewer con equivalencias.
- Variables de entorno: `NEXT_PUBLIC_API_URL=http://localhost/api`

### Estructura de componentes
```
frontend/src/
├── app/
│   ├── page.js              ← Página principal con calculadora y plan viewer
│   ├── layout.js            ← Root layout con Providers
│   └── globals.css         ← Tailwind v4 + variables Shadcn
├── components/
│   ├── ui/                 ← Componentes Shadcn (button, card, input, select, badge, label)
│   ├── features/            ← Componentes de dominio
│   │   ├── NutritionCalculator.jsx
│   │   └── PlanViewer.jsx
│   └── providers.jsx       ← React Query provider
├── hooks/
│   └── useNutritionCalculator.js  ← Hook con fórmula Mifflin-St Jeor
└── lib/
    ├── api.js               ← Cliente API con fetch + JWT
    └── utils.js             ← Utilidad cn() para Tailwind
```

### Convenciones frontend
- **Estado del servidor**: React Query (`@tanstack/react-query`).
- **Formularios**: React Hook Form + Zod.
- **Nunca uses `useEffect` para fetching**; usa React Query.
- Componentes Shadcn → `/components/ui/`, dominio → `/components/features/`.

---

## 🔄 Fases del proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 0 | Docker, Nginx, docs de gobernanza | ✅ Completada |
| Fase 1 | Migraciones, modelos Eloquent, seeders | ✅ Completada |
| Fase 2 | NutritionService, middleware JWT, API REST | ✅ Completada |
| Fase 3 | Frontend — UI/UX, dashboard, plan viewer | ✅ Completada |
| Fase 4 | Documentación para IAs | ✅ Completada |
| Fase 5 | Admin panel — CRUD completo (users, foods, plans) | ✅ Completada |
| Fase 6 | Módulo de Recetas — backend + frontend admin | ✅ Completada |

---

## 🚫 Patrones prohibidos

```php
// ❌ No usar sesiones
Auth::login($user);
session(['user' => $user]);

// ❌ No calcular con datos hardcodeados
$calorias = 250;
```

```js
// ❌ No usar fetch directo en componentes
useEffect(() => { fetch('/api/foods').then(...) }, [])

// ✅ Usar React Query
const { data } = useQuery({ queryKey: ['foods'], queryFn: fetchFoods })
```
