# Módulo: Dashboard (Panel Administrativo)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/admin/dashboard`

---

## 1. Descripción General

El módulo de **Dashboard** proporciona estadísticas consolidadas para el panel de administración.

### Propósito

- Métricas generales del sistema
- Estadísticas de usuarios
- Datos de uso y actividad
- KPIs para administradores

---

## 2. Funcionalidades

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Estadísticas | `GET /admin/dashboard/stats` | Métricas consolidadas |

---

## 3. Endpoint API

### Obtener Estadísticas

```http
GET /api/admin/dashboard/stats
Authorization: Bearer {token}
```

**Requiere:** Rol `admin` o `super_admin`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 120,
      "newThisMonth": 25,
      "newThisWeek": 8
    },
    "subscriptions": {
      "active": 45,
      "trial": 30,
      "cancelled": 10
    },
    "generations": {
      "total": 1500,
      "thisMonth": 450,
      "thisWeek": 120
    },
    "streaks": {
      "averageStreak": 5.2,
      "longestActive": 45
    }
  }
}
```

---

## 4. Métricas Disponibles

### Usuarios

| Métrica | Descripción |
|---------|-------------|
| `total` | Total de usuarios registrados |
| `active` | Usuarios activos (no eliminados) |
| `newThisMonth` | Registros del mes actual |
| `newThisWeek` | Registros de la semana actual |

### Suscripciones (Legacy)

| Métrica | Descripción |
|---------|-------------|
| `active` | Suscripciones activas |
| `trial` | En período de prueba |
| `cancelled` | Canceladas |

### Actividad

| Métrica | Descripción |
|---------|-------------|
| `generations.total` | Total de generaciones |
| `streaks.averageStreak` | Promedio de rachas |

---

## 5. Adaptación para Letrito

> Para Letrito, agregar métricas específicas:
>
> - `childProfiles.total` - Total de perfiles de niños
> - `progress.averageLevel` - Nivel promedio de aprendizaje
> - `activity.dailyActiveChildren` - Niños activos por día
> - `pet.happinessAverage` - Felicidad promedio de mascotas

---

## 6. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.0.1 | Documentación para Letrito |
| 2024-11-01 | 1.0.0 | Implementación inicial |

---

*Documentación generada para Letrito Backend*
