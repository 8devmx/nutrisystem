# 📐 Estándares de Código — Nutrisystem

Este documento define las guías de estilo para los dos entornos del proyecto.

---

## 🟨 Frontend — StandardJS (JavaScript / TypeScript / React)

### Configuración base

El proyecto usa **ESLint** con las reglas de [StandardJS](https://standardjs.com/) adaptadas para TypeScript y React.

```bash
# Instalación
npm install --save-dev eslint eslint-config-standard eslint-plugin-react \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Reglas clave

| Regla | Valor |
|-------|-------|
| Indentación | 2 espacios |
| Punto y coma | ❌ No usar |
| Comillas | Simples `'` |
| Espacios antes de paréntesis de función | ✅ Sí |
| `===` sobre `==` | ✅ Obligatorio |
| `var` | ❌ Prohibido (usar `const` / `let`) |
| Línea en blanco al final del archivo | ✅ Requerida |

### Ejemplos

```js
// ✅ Correcto
const calcularCalorias = (peso, altura, edad) => {
  return (10 * peso) + (6.25 * altura) - (5 * edad)
}

// ❌ Incorrecto
const calcularCalorias = (peso,altura,edad) =>{
  return (10*peso)+(6.25*altura)-(5*edad);
}
```

### Nombrado en Frontend

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `PlanViewer.tsx` |
| Hooks | camelCase con prefijo `use` | `useNutrition.ts` |
| Funciones y variables | camelCase | `calcularCalorias` |
| Constantes globales | UPPER_SNAKE_CASE | `MAX_CALORIAS_DIA` |
| Archivos de utilidades | kebab-case | `nutrition-helpers.ts` |

---

## 🟦 Backend — PSR-12 (PHP / Laravel)

El proyecto sigue el estándar **[PSR-12](https://www.php-fig.org/psr/psr-12/)** para todo el código PHP.

```bash
# Instalación de PHP CS Fixer
composer require --dev friendsofphp/php-cs-fixer
```

### Reglas clave

| Regla | Valor |
|-------|-------|
| Indentación | 4 espacios |
| Llave de apertura de clase | Misma línea que `class` |
| Llave de apertura de método | Nueva línea |
| Visibilidad | Siempre declarada (`public`, `protected`, `private`) |
| Imports | Un `use` por línea, ordenados alfabéticamente |
| Línea en blanco al final | ✅ Requerida |

### Ejemplos

```php
<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class NutritionService
{
    public function calculateDailyRequirements(User $user): float
    {
        // Fórmula de Harris-Benedict revisada (Mifflin-St Jeor)
        $bmr = (10 * $user->weight)
            + (6.25 * $user->height)
            - (5 * $user->age)
            + ($user->sex === 'male' ? 5 : -161);

        return $bmr * $user->activity_factor;
    }
}
```

### Nombrado en Backend

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Clases | PascalCase | `NutritionService` |
| Métodos | camelCase | `calculateDailyRequirements` |
| Variables | camelCase | `$activityFactor` |
| Columnas DB | snake_case | `activity_factor` |
| Tablas DB | snake_case plural | `food_equivalents` |
| Rutas API | kebab-case | `/api/food-equivalents` |

---

## 🗂️ Estructura de directorios

```
nutrisystem/
├── backend/              # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   └── Middleware/
│   │   ├── Models/
│   │   └── Services/     # Lógica de negocio (NutritionService, etc.)
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
├── frontend/             # Next.js App
│   ├── app/              # App Router
│   ├── components/
│   │   ├── ui/           # Componentes base (Shadcn)
│   │   └── features/     # Componentes por dominio
│   ├── lib/              # Helpers y utilidades
│   └── hooks/            # Custom hooks
│
├── docs/                 # Gobernanza y contexto
├── nginx/                # Config del proxy
└── docker-compose.yml
```

---

## 🔧 Comandos útiles

```bash
# Frontend — lint
npm run lint
npm run lint:fix

# Backend — fix de estilo
./vendor/bin/php-cs-fixer fix

# Backend — análisis estático
./vendor/bin/phpstan analyse
```
