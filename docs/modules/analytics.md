# Modulo: Analytics (Analiticas de Uso)

> **Estado:** Completo
> **Ultima actualizacion:** 2026-01-20
> **Ruta base:** `/api/analytics`

---

## 1. Descripcion General

El modulo de **Analytics** rastrea y analiza el uso de la aplicacion por parte de los ninos, generando reportes para los padres.

### Proposito

- Registro de eventos de sesion en tiempo real
- Agregacion de uso diario por nino
- Reportes semanales para padres
- Analisis de progreso y tendencias
- Identificacion de areas de mejora

---

## 2. Entidades

### SessionEvent

Registra eventos individuales durante las sesiones de juego.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| childProfileId | UUID | Perfil del nino |
| eventType | EventType | Tipo de evento |
| timestamp | DateTime | Momento del evento |
| metadata | JSONB | Datos adicionales |
| sessionId | string | ID de sesion (opcional) |

### DailyUsage

Estadisticas agregadas por dia para cada nino.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| childProfileId | UUID | Perfil del nino |
| date | date | Fecha (YYYY-MM-DD) |
| totalMinutes | int | Minutos totales de uso |
| sessionCount | int | Numero de sesiones |
| levelsCompleted | int | Niveles completados |
| starsEarned | int | Estrellas ganadas |
| correctExercises | int | Ejercicios correctos |
| incorrectExercises | int | Ejercicios incorrectos |
| letterActivity | JSONB | Actividad por letra |
| activityBreakdown | JSONB | Desglose por tipo |

---

## 3. Tipos de Eventos (EventType)

### Eventos de Sesion

| Evento | Descripcion |
|--------|-------------|
| `SESSION_START` | Inicio de sesion de juego |
| `SESSION_END` | Fin de sesion |
| `APP_BACKGROUND` | App enviada al fondo |
| `APP_FOREGROUND` | App regresa al frente |

### Eventos de Aprendizaje

| Evento | Descripcion |
|--------|-------------|
| `LEVEL_COMPLETE` | Nivel completado |
| `LEVEL_FAILED` | Nivel fallido |
| `LEVEL_RETRY` | Reintento de nivel |
| `EXERCISE_CORRECT` | Respuesta correcta |
| `EXERCISE_INCORRECT` | Respuesta incorrecta |
| `LETTER_STARTED` | Letra iniciada |
| `LETTER_COMPLETE` | Letra completada |

### Eventos de Mascota

| Evento | Descripcion |
|--------|-------------|
| `PET_INTERACTION` | Interaccion con mascota |
| `PET_EVOLVED` | Mascota evoluciono |
| `PET_ACCESSORY_EQUIPPED` | Accesorio equipado |

### Eventos de Logros

| Evento | Descripcion |
|--------|-------------|
| `ACHIEVEMENT_UNLOCKED` | Logro desbloqueado |
| `STREAK_MILESTONE` | Hito de racha |
| `MINIGAME_COMPLETED` | Minijuego completado |

---

## 4. Endpoints

### Registro de Eventos

```
POST /api/analytics/events
Authorization: Bearer {token}
```

**Body:**
```json
{
  "childProfileId": "uuid",
  "events": [
    {
      "eventType": "LEVEL_COMPLETE",
      "timestamp": "2026-01-20T10:30:00.000Z",
      "metadata": { "letter": "A", "levelNumber": 1, "stars": 3 },
      "sessionId": "session-123"
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "eventsRegistered": 1,
    "eventsFailed": 0,
    "dailyUsageUpdated": true
  }
}
```

### Consultar Uso Diario

```
GET /api/analytics/{childId}/daily?date=2026-01-20
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "childProfileId": "uuid",
    "date": "2026-01-20",
    "totalMinutes": 45,
    "sessionCount": 3,
    "levelsCompleted": 12,
    "starsEarned": 28,
    "accuracyRate": 86,
    "letterActivity": {
      "A": { "levelsCompleted": 3, "starsEarned": 8 }
    }
  }
}
```

### Consultar Rango de Fechas

```
GET /api/analytics/{childId}/daily/range?startDate=2026-01-14&endDate=2026-01-20
Authorization: Bearer {token}
```

### Reporte Semanal

```
GET /api/analytics/{childId}/weekly?weekOffset=0
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "childProfileId": "uuid",
    "childName": "Juanito",
    "weekNumber": 3,
    "year": 2026,
    "weekStartDate": "2026-01-13",
    "weekEndDate": "2026-01-19",
    "stats": {
      "totalMinutes": 315,
      "totalSessions": 21,
      "levelsCompleted": 45,
      "starsEarned": 120,
      "averageAccuracy": 82,
      "activeDays": 7
    },
    "dailySummary": [...],
    "letterProgress": [...],
    "comparison": {
      "minutesChange": 15,
      "levelsChange": 20,
      "trend": "improving"
    },
    "motivationalMessage": "Excelente trabajo esta semana!"
  }
}
```

### Reporte Completo

```
GET /api/analytics/{childId}/report
Authorization: Bearer {token}
```

Retorna estadisticas generales desde el inicio, progreso por letra, tendencias de uso, hitos y recomendaciones.

---

## 5. Actualizacion Automatica de Daily Usage

Cuando se registran eventos, el sistema actualiza automaticamente las estadisticas diarias:

| Evento | Campos actualizados |
|--------|---------------------|
| SESSION_START | sessionCount++ |
| SESSION_END | totalMinutes += timeSpentMs |
| LEVEL_COMPLETE | levelsCompleted++, starsEarned += stars |
| EXERCISE_CORRECT | correctExercises++ |
| EXERCISE_INCORRECT | incorrectExercises++ |
| LETTER_STARTED | newLettersStarted++ |
| LETTER_COMPLETE | lettersCompleted++ |
| PET_INTERACTION | petInteractions++ |
| MINIGAME_COMPLETED | minigamesPlayed++ |

---

## 6. Metadata de Eventos

### LEVEL_COMPLETE

```json
{
  "letter": "A",
  "levelNumber": 5,
  "stars": 3,
  "timeSpentMs": 180000,
  "exercisesTotal": 10,
  "exercisesCorrect": 9
}
```

### SESSION_END

```json
{
  "timeSpentMs": 1800000,
  "levelsPlayed": 5
}
```

### ACHIEVEMENT_UNLOCKED

```json
{
  "achievementName": "Primera Vocal",
  "extra": {
    "description": "Completaste tu primera vocal",
    "icon": "star"
  }
}
```

---

## 7. Indices de Base de Datos

| Tabla | Indices |
|-------|---------|
| session_events | childProfileId, eventType, timestamp |
| daily_usage | [childProfileId, date] UNIQUE, date |

---

## 8. Integracion

### Con ChildrenProfiles

- Verifica que el perfil existe antes de registrar eventos
- Usa childProfileId como clave foranea

### Con Pet Module

- Eventos PET_INTERACTION incrementan estadisticas de mascota
- PET_EVOLVED registra evolucion de mascota

### Con Progress Module

- Los eventos de LEVEL_COMPLETE se usan para calcular progreso
- LETTER_COMPLETE marca letras como dominadas

---

## 9. Uso Tipico (App Flutter)

```dart
// Al completar un nivel
await analyticsService.registerEvents(
  childId: currentChild.id,
  events: [
    EventDto(
      eventType: EventType.LEVEL_COMPLETE,
      timestamp: DateTime.now(),
      metadata: {
        'letter': 'A',
        'levelNumber': currentLevel,
        'stars': earnedStars,
      },
      sessionId: currentSessionId,
    ),
  ],
);
```

---

## 10. Changelog

| Fecha | Version | Cambios |
|-------|---------|---------|
| 2026-01-20 | 1.0.0 | Implementacion inicial |

---

*Documentacion generada para Letrito Backend*
