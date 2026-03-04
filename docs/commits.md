# 📝 Convención de Commits — Nutrisystem

Este proyecto sigue el estándar **Conventional Commits** para mantener un historial de Git limpio, legible y automatizable.

---

## Formato

```
<tipo>(<alcance>): <descripción corta>

[cuerpo opcional]

[pie opcional]
```

### Reglas generales
- La **descripción corta** va en **minúsculas** y en **español**.
- Máximo **72 caracteres** en la primera línea.
- Usa el **imperativo**: "agrega", "corrige", "elimina" (no "agregado", "corregido").
- Sin punto final en la descripción corta.

---

## Tipos permitidos

| Tipo | Cuándo usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad para el usuario |
| `fix` | Corrección de un bug |
| `docs` | Cambios solo en documentación |
| `style` | Formato, espacios, comas (sin cambio de lógica) |
| `refactor` | Refactorización de código sin nuevas features ni fixes |
| `perf` | Mejora de rendimiento |
| `test` | Agrega o corrige tests |
| `build` | Cambios en build system o dependencias externas |
| `ci` | Cambios en configuración de CI/CD |
| `chore` | Tareas de mantenimiento que no modifican src ni tests |
| `revert` | Revierte un commit anterior |

---

## Alcances sugeridos

| Alcance | Área |
|---------|------|
| `auth` | Autenticación y JWT |
| `foods` | Módulo de alimentos |
| `plans` | Planes nutricionales |
| `equivalences` | Sistema de equivalencias |
| `users` | Gestión de usuarios |
| `api` | Capa de API REST |
| `ui` | Componentes de interfaz |
| `db` | Base de datos y migraciones |
| `docker` | Configuración de contenedores |
| `nginx` | Configuración del proxy |

---

## Ejemplos

```bash
# ✅ Correcto
feat(foods): agrega endpoint para listar alimentos por grupo
fix(auth): corrige validación de token JWT expirado
docs(api): actualiza documentación de endpoints de planes
refactor(plans): extrae cálculo de calorías a NutritionService
test(equivalences): agrega pruebas unitarias para grupos de intercambio
chore(docker): actualiza imagen de PHP a 8.2.18

# ❌ Incorrecto
Agregué nueva funcionalidad
fix: Fixed the bug
FEAT: nueva pantalla
update stuff
```

---

## Commits con cambios importantes (Breaking Changes)

Si el cambio rompe compatibilidad, agrega `!` después del tipo y explícalo en el pie:

```
feat(api)!: cambia estructura de respuesta en endpoint /plans

BREAKING CHANGE: el campo `meals` ahora es un arreglo de objetos
con la propiedad `equivalences` incluida. Actualizar clientes que
consuman este endpoint.
```

---

## Recomendación

Instala **commitlint** para validar automáticamente cada commit:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```
