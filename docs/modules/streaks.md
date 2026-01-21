# Módulo: Streaks (Rachas)

> **Estado:** ✅ Completo (Legacy - PublishSparks)
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/streaks`
> **Nota:** Este módulo puede adaptarse para Letrito (gamificación).

---

## 1. Descripción General

El módulo de **Streaks** implementa un sistema de rachas para gamificación, motivando a los usuarios a usar la app diariamente.

### Propósito

- Registrar días consecutivos de uso
- Motivar engagement diario
- Sistema de recompensas por rachas
- Estadísticas de consistencia

---

## 2. Funcionalidades

### Para Usuarios

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Mi racha | `GET /streaks` | Ver racha actual |
| Check-in | `POST /streaks/check-in` | Registrar día |

### Admin

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Listar rachas | `GET /admin/streaks` | Todas las rachas |
| Estadísticas | `GET /admin/streaks/stats` | Métricas globales |
| Leaderboard | `GET /admin/streaks/leaderboard` | Top usuarios |
| Ver racha | `GET /admin/streaks/:id` | Detalle |
| Resetear | `PATCH /admin/streaks/:id/reset` | Reiniciar racha |
| Ajustar | `PATCH /admin/streaks/:id/adjust` | Modificar valores |
| Eliminar | `DELETE /admin/streaks/:id` | Eliminar |

---

## 3. Estructura de Streak

```json
{
  "id": "uuid",
  "userId": "uuid",
  "currentStreak": 5,
  "longestStreak": 12,
  "totalDays": 30,
  "lastCheckIn": "2025-01-20",
  "streakStartDate": "2025-01-16",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-20T10:00:00Z"
}
```

---

## 4. Lógica de Rachas

```
Día 1: Check-in → currentStreak = 1
Día 2: Check-in → currentStreak = 2
Día 3: No check-in
Día 4: Check-in → currentStreak = 1 (se reinicia)
```

- **Check-in:** Incrementa `currentStreak` si es día consecutivo
- **Sin check-in:** `currentStreak` se reinicia a 0
- **Longest streak:** Se actualiza si `currentStreak > longestStreak`

---

## 5. Aplicación en Letrito

> ✅ **Este módulo SÍ puede adaptarse para Letrito**
>
> Usar para:
> - Racha de días que el niño practica lectura/escritura
> - Sistema de recompensas (alimentar la mascota, desbloquear contenido)
> - Motivación para padres e hijos
>
> Modificaciones sugeridas:
> - Asociar streak al `ChildProfile` en lugar de `User`
> - Agregar recompensas por milestones (7 días, 30 días, etc.)
> - Integrar con el módulo `pet` para gamificación

---

## 6. Notas para Documentación de Usuario

### Para Padres (Letrito)

> **Sistema de Rachas**
>
> Letrito registra cuántos días seguidos tu hijo practica.
> Cada día que practique, su racha crece y puede:
> - Desbloquear nuevos avatares
> - Alimentar a su mascota virtual
> - Ganar estrellas especiales
>
> ¡Motiva a tu hijo a practicar todos los días!

---

## 7. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.0.1 | Documentación para Letrito |
| 2024-11-01 | 1.0.0 | Implementación para PublishSparks |

---

*Documentación generada para Letrito Backend*
