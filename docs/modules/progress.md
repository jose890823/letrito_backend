# Módulo Progress

**Estado:** ✅ Completo
**Última actualización:** 2025-01-20

## Descripción General

El módulo Progress rastrea el progreso de aprendizaje de lectura y escritura de cada niño. Incluye el seguimiento de letras, sílabas y palabras con sistema automático de niveles de dominio (mastery) y gamificación mediante XP.

## Funcionalidades

- ✅ Registro de intentos individuales por elemento
- ✅ Registro de sesiones de práctica completas
- ✅ Cálculo automático de niveles de dominio (mastery)
- ✅ Sistema de niveles por categoría (1-5) y nivel general (1-10)
- ✅ Sistema de XP y recompensas
- ✅ Recomendaciones inteligentes de elementos a practicar
- ✅ Dashboard para padres con actividad semanal
- ✅ Historial de sesiones con paginación
- ✅ Línea de tiempo de logros

## Endpoints API

### Registro de Progreso

#### POST `/api/progress/attempt`
Registra un intento individual de lectura o escritura.

**Request Body:**
```json
{
  "childProfileId": "uuid",
  "elementType": "letter",
  "elementId": "A",
  "skillType": "reading",
  "correct": true,
  "responseTimeMs": 1500,
  "givenAnswer": "A"
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "id": "uuid",
    "childProfileId": "uuid",
    "elementType": "letter",
    "elementId": "A",
    "skillType": "reading",
    "totalAttempts": 15,
    "correctAttempts": 12,
    "currentStreak": 5,
    "bestStreak": 8,
    "accuracyPercentage": 80,
    "masteryLevel": "practicing",
    "masteredAt": null,
    "lastPracticedAt": "2025-01-20T10:30:00.000Z"
  },
  "xpEarned": 10,
  "leveledUp": false,
  "newMasteryLevel": null
}
```

#### POST `/api/progress/session`
Registra una sesión de práctica completa.

**Request Body:**
```json
{
  "childProfileId": "uuid",
  "durationMinutes": 15,
  "results": [
    {
      "elementType": "letter",
      "elementId": "A",
      "skillType": "reading",
      "correct": true,
      "responseTimeMs": 1200
    }
  ],
  "focusArea": "letters"
}
```

### Consultas de Progreso

#### GET `/api/progress/child/:id/summary`
Obtiene un resumen completo del progreso del niño.

#### GET `/api/progress/child/:id/letters`
Obtiene el progreso detallado de todas las letras.

#### GET `/api/progress/child/:id/syllables`
Obtiene el progreso de sílabas practicadas.

#### GET `/api/progress/child/:id/words`
Obtiene el progreso de palabras practicadas.

#### GET `/api/progress/child/:id/level`
Obtiene los niveles actuales del niño.

#### GET `/api/progress/child/:id/recommended`
Obtiene elementos recomendados para practicar.

**Query Parameters:**
- `limit`: Número máximo de recomendaciones (default: 10)

### Dashboard de Padres

#### GET `/api/progress/child/:id/weekly-activity`
Obtiene actividad de los últimos 7 días.

#### GET `/api/progress/child/:id/sessions`
Obtiene historial de sesiones.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)

#### GET `/api/progress/child/:id/timeline`
Obtiene línea de tiempo de logros.

**Query Parameters:**
- `limit`: Número máximo de eventos (default: 20)

## Entidades

### LearningProgress

Registra el progreso por elemento individual.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| childProfileId | UUID | FK a ChildProfile |
| elementType | enum | letter, syllable, word |
| elementId | string | Identificador del elemento (A, ma, casa) |
| skillType | enum | reading, writing |
| totalAttempts | int | Total de intentos |
| correctAttempts | int | Intentos correctos |
| currentStreak | int | Racha actual |
| bestStreak | int | Mejor racha |
| accuracyRate | decimal | Tasa de precisión (0-1) |
| masteryLevel | enum | not_started, learning, practicing, mastered |
| masteredAt | date | Fecha de dominio |
| metadata | JSONB | Datos adicionales |
| lastPracticedAt | timestamp | Última práctica |

**Índices:**
- `[childProfileId, elementType]`
- `[childProfileId, skillType]`
- `[childProfileId, masteryLevel]`
- `UNIQUE [childProfileId, elementType, elementId, skillType]`

### LearningSession

Registra sesiones de práctica completas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| childProfileId | UUID | FK a ChildProfile |
| sessionDate | date | Fecha de la sesión |
| durationMinutes | int | Duración en minutos |
| exercisesCompleted | int | Ejercicios completados |
| correctCount | int | Ejercicios correctos |
| accuracyRate | decimal | Precisión de la sesión |
| results | JSONB | Array de resultados |
| focusArea | string | Área de enfoque |

### ChildLevel

Cache de niveles calculados (1:1 con ChildProfile).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| childProfileId | UUID | FK única a ChildProfile |
| lettersReadingLevel | int | Nivel lectura letras (1-5) |
| lettersWritingLevel | int | Nivel escritura letras (1-5) |
| syllablesReadingLevel | int | Nivel lectura sílabas (1-5) |
| syllablesWritingLevel | int | Nivel escritura sílabas (1-5) |
| wordsReadingLevel | int | Nivel lectura palabras (1-5) |
| wordsWritingLevel | int | Nivel escritura palabras (1-5) |
| overallLevel | int | Nivel general (1-10) |
| totalXp | int | XP total acumulado |
| lettersMastered | int | Letras dominadas |
| syllablesMastered | int | Sílabas dominadas |
| wordsMastered | int | Palabras dominadas |

## Lógica de Dominio

### Criterios de Mastery

| Nivel | Intentos mín | Precisión mín | Racha mín |
|-------|--------------|---------------|-----------|
| not_started | 0 | - | - |
| learning | 1 | - | - |
| practicing | 5 | 60% | 2 |
| mastered | 10 | 85% | 5 |

### Cálculo de Niveles (1-5 por categoría)

**Letras (27 total):**
- Nivel 2: 20% dominadas (5-6 letras)
- Nivel 3: 40% dominadas (10-11 letras)
- Nivel 4: 60% dominadas (16-17 letras)
- Nivel 5: 85% dominadas (23+ letras)

### Sistema de XP

| Acción | XP |
|--------|-----|
| Respuesta correcta | 10 |
| Racha de 3 | +5 |
| Racha de 5 | +10 |
| Racha de 10 | +25 |
| Dominar elemento | +50 |
| Completar sesión | +20 |
| Sesión >80% precisión | +15 |

### Nivel General (1-10)

Basado en XP total:
- Nivel 1: 0 XP
- Nivel 2: 100 XP
- Nivel 3: 300 XP
- Nivel 4: 600 XP
- Nivel 5: 1000 XP
- Nivel 6: 1500 XP
- Nivel 7: 2200 XP
- Nivel 8: 3000 XP
- Nivel 9: 4000 XP
- Nivel 10: 5500 XP

## Eventos Emitidos

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `progress.mastery_level_changed` | Cambio de nivel de dominio | childProfileId, elementType, elementId, skillType, previousLevel, newLevel |

## Dependencias

- `ChildrenProfilesModule`: Para verificar pertenencia del perfil
- `EventEmitterModule`: Para emitir eventos de progreso

## Estructura de Archivos

```
src/modules/progress/
├── dto/
│   ├── index.ts
│   ├── record-attempt.dto.ts
│   ├── record-session.dto.ts
│   ├── progress-summary.dto.ts
│   ├── progress-response.dto.ts
│   ├── child-level.dto.ts
│   └── weekly-activity.dto.ts
├── entities/
│   ├── learning-progress.entity.ts
│   ├── learning-session.entity.ts
│   └── child-level.entity.ts
├── constants/
│   └── mastery.constants.ts
├── progress.controller.ts
├── progress.service.ts
└── progress.module.ts
```

## Ejemplos de Uso

### Registrar intento desde la app Flutter

```dart
final response = await api.post('/progress/attempt', {
  'childProfileId': childId,
  'elementType': 'letter',
  'elementId': 'A',
  'skillType': 'reading',
  'correct': isCorrect,
  'responseTimeMs': responseTime,
});

if (response.data['leveledUp']) {
  // Mostrar celebración
  showLevelUpAnimation(response.data['newMasteryLevel']);
}
```

### Obtener progreso para dashboard de padres

```dart
final summary = await api.get('/progress/child/$childId/summary');
final weeklyActivity = await api.get('/progress/child/$childId/weekly-activity');

// Mostrar estadísticas
showProgressChart(summary.data);
showWeeklyChart(weeklyActivity.data['dailyActivity']);
```

---

*Documentación generada el 2025-01-20*
