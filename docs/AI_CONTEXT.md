# 🤖 AI_CONTEXT.md — Contexto para Agentes IA

> Este archivo existe para que cualquier agente de IA (GitHub Copilot, Cursor, Claude, etc.)
> entienda la arquitectura del proyecto y evite errores comunes al generar código.

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
                   [MySQL :3306]
```

El sistema es un **monorepo** con dos aplicaciones independientes que se comunican a través de Nginx.

---

## 🔐 Autenticación

- El sistema **NO gestiona usuarios directamente**. Los JWT provienen de un **Hub externo**.
- El backend Laravel actúa de forma **stateless**: valida el JWT en cada request, no crea sesiones.
- Middleware clave: `App\Http\Middleware\ValidateExternalJwt`
- El JWT contiene: `user_id`, `email`, `roles`.
- **Nunca generes código que use `Auth::login()` o sesiones de Laravel para este sistema.**

---

## 🧮 Cálculos Nutricionales — Reglas críticas

### Fórmula de Harris-Benedict (Mifflin-St Jeor)

```
Hombres: BMR = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) + 5
Mujeres: BMR = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) - 161

Calorías totales = BMR × factor_actividad
```

### Factores de actividad

| Factor | Nivel | Valor |
|--------|-------|-------|
| `sedentary` | Sin ejercicio | 1.2 |
| `light` | 1-3 días/semana | 1.375 |
| `moderate` | 3-5 días/semana | 1.55 |
| `active` | 6-7 días/semana | 1.725 |
| `very_active` | Atleta / trabajo físico | 1.9 |

### ⚠️ Reglas anti-alucinación para gramajes

1. **Nunca inventes valores nutricionales.** Todos los macros y calorías deben venir de la tabla `foods` en la base de datos.
2. **Las porciones son por 100g.** Cualquier cálculo debe escalar desde `calorias_por_100g`.
3. **Los gramajes de la tabla `food_equivalents`** son los únicos valores válidos para intercambios. No uses valores "aproximados" de conocimiento general.
4. **Si un alimento no está en la DB**, retorna un error `404` con el mensaje `"Alimento no registrado en el sistema"`. **Nunca calcules con datos estimados.**

---

## 🗄️ Esquema de base de datos

### `users`
```sql
id, name, email, weight_kg, height_cm, age, sex ENUM('male','female'),
activity_factor ENUM('sedentary','light','moderate','active','very_active'),
created_at, updated_at
```

### `foods`
```sql
id, name, slug, calories_per_100g DECIMAL(8,2),
protein_g DECIMAL(8,2), carbs_g DECIMAL(8,2), fat_g DECIMAL(8,2),
image_path VARCHAR(255), created_at, updated_at
```

### `units`
```sql
id, name (ej: "gramos", "pieza", "taza"), abbreviation (ej: "g", "pz", "tz"),
conversion_to_grams DECIMAL(8,4)
```

### `food_equivalents`
```sql
id, group_name (ej: "Cereales", "Proteínas", "Frutas"),
food_id FK(foods), quantity DECIMAL(8,2), unit_id FK(units),
grams_equivalent DECIMAL(8,2)
```
> `grams_equivalent` = gramos exactos que representan 1 equivalente del grupo.

### `plans`
```sql
id, user_id FK(users), title, duration ENUM('weekly','biweekly','monthly'),
total_calories DECIMAL(8,2), created_at, updated_at
```

### `plan_meals`
```sql
id, plan_id FK(plans), day_number TINYINT,
meal_moment ENUM('breakfast','morning_snack','lunch','afternoon_snack','dinner'),
food_id FK(foods), quantity DECIMAL(8,2), unit_id FK(units)
```

---

## 📡 Endpoints de la API

Base URL: `/api/v1`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/validate` | Valida JWT externo |
| `GET` | `/foods` | Lista alimentos (paginado) |
| `POST` | `/foods` | Crea alimento |
| `GET` | `/foods/{id}/equivalences` | Equivalencias de un alimento |
| `POST` | `/plans` | Genera plan nutricional |
| `GET` | `/plans/{id}` | Obtiene plan con detalle enriquecido |
| `GET` | `/users/{id}/requirements` | Requerimiento calórico del usuario |

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

## 🎨 Frontend — Convenciones

- **Framework**: Next.js 14 con App Router (`/app` directory).
- **Estilos**: Tailwind CSS + Shadcn/UI.
- **Estado del servidor**: React Query (`@tanstack/react-query`).
- **Formularios**: React Hook Form + Zod para validación.
- **Nunca uses `useEffect` para fetching de datos**; usa React Query.
- Los componentes de Shadcn van en `/components/ui/`, los de dominio en `/components/features/`.

---

## 🚫 Patrones prohibidos

```php
// ❌ No usar sesiones
Auth::login($user);
session(['user' => $user]);

// ❌ No calcular con datos fuera de la DB
$calorias = 250; // valor hardcodeado
```

```js
// ❌ No usar fetch directo en componentes
useEffect(() => { fetch('/api/foods').then(...) }, [])

// ✅ Usar React Query
const { data } = useQuery({ queryKey: ['foods'], queryFn: fetchFoods })
```

---

## 🔄 Flujo de generación de un plan

1. Frontend envía datos físicos del usuario.
2. `NutritionService::calculateDailyRequirements()` calcula el BMR × factor.
3. El sistema distribuye calorías entre momentos del día (ver tabla de distribución).
4. Para cada momento, selecciona alimentos de la DB que sumen las calorías objetivo.
5. Por cada alimento, adjunta sus equivalencias del mismo grupo.
6. Respuesta incluye calorías totales, macros sumados y lista de equivalencias por alimento.

### Distribución calórica sugerida por momento

| Momento | % del total |
|---------|-------------|
| Desayuno | 25% |
| Colación mañana | 10% |
| Comida | 35% |
| Colación tarde | 10% |
| Cena | 20% |
