# Módulo Parental - Control Parental

## Descripción General

El módulo Parental proporciona herramientas completas de control parental para que los padres puedan:
- Establecer límites de tiempo de uso diario y semanal
- Configurar horarios permitidos de acceso
- Monitorear la actividad y progreso de sus hijos
- Recibir notificaciones sobre eventos importantes
- Proteger la configuración con PIN

## Funcionalidades

### 1. Control de Tiempo
- **Límites diarios**: Configura máximo de minutos de uso por día
- **Límites semanales**: Configura máximo de minutos por semana
- **Duración de sesión**: Limita tiempo máximo de sesión continua
- **Descansos obligatorios**: Configura tiempo mínimo entre sesiones

### 2. Horarios Permitidos
- **Horario semanal**: Define rangos de tiempo permitidos por día
- **Múltiples rangos**: Soporta múltiples franjas horarias por día
- **Modo estricto**: Bloquea acceso fuera de horario o solo advierte

### 3. PIN Parental
- **PIN de 4 dígitos**: Protege acceso a configuración
- **Bloqueo por intentos**: Se bloquea tras 5 intentos fallidos
- **Desbloqueo automático**: Se desbloquea después de 30 minutos

### 4. Monitoreo de Actividad
- **Uso diario**: Minutos, sesiones, hora de inicio/fin
- **Métricas de aprendizaje**: Ejercicios, precisión, elementos revisados
- **Interacción con mascota**: Alimentar, jugar, acariciar
- **Log de eventos**: Historial detallado de actividades

### 5. Notificaciones
- Inicio/fin de sesión
- Límite diario/semanal alcanzado
- Nuevos logros desbloqueados
- Resúmenes diarios y semanales

## Endpoints API

### Control Parental

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/parental/child/:childId/settings` | Obtener configuración |
| PATCH | `/parental/child/:childId/settings` | Actualizar configuración |
| POST | `/parental/child/:childId/settings/preset` | Aplicar preset |
| GET | `/parental/presets` | Listar presets disponibles |

### PIN

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/parental/child/:childId/pin` | Configurar PIN |
| DELETE | `/parental/child/:childId/pin` | Eliminar PIN |
| POST | `/parental/child/:childId/pin/verify` | Verificar PIN |

### Estado de Acceso

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/parental/child/:childId/access-status` | Verificar si puede usar la app |

### Uso y Estadísticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/parental/child/:childId/stats` | Estadísticas rápidas |
| GET | `/parental/child/:childId/usage` | Historial de uso |
| GET | `/parental/child/:childId/usage/weekly` | Resumen semanal |

### Log de Actividad

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/parental/child/:childId/activity` | Obtener logs |
| GET | `/parental/child/:childId/activity/counts` | Conteos por tipo |
| POST | `/parental/child/:childId/activity/mark-read` | Marcar como leídos |

## Entidades

### ParentalControl

Configuración de control parental por niño (1:1 con ChildProfile).

```typescript
{
  id: string;
  childProfileId: string;

  // PIN
  pinEnabled: boolean;
  pinHash: string | null;
  pinAttempts: number;
  pinLockedUntil: Date | null;

  // Límites de tiempo
  dailyTimeLimitMinutes: number | null;
  weeklyTimeLimitMinutes: number | null;
  maxSessionDurationMinutes: number | null;
  breakDurationMinutes: number | null;

  // Horarios
  weeklySchedule: DaySchedule[];
  strictScheduleEnforcement: boolean;

  // Notificaciones
  notifications: NotificationSettings;

  // Restricciones
  allowPetInteraction: boolean;
  allowProfileChanges: boolean;
}
```

### DailyUsageSummary

Resumen de uso diario (uno por día por niño).

```typescript
{
  id: string;
  childProfileId: string;
  date: string; // YYYY-MM-DD

  totalMinutes: number;
  sessionsCount: number;
  firstSessionTime: string | null;
  lastSessionTime: string | null;

  activityBreakdown: {
    learningMinutes: number;
    petInteractionMinutes: number;
    freePlayMinutes: number;
  };

  learningMetrics: {
    exercisesCompleted: number;
    correctAnswers: number;
    accuracy: number;
    lettersReviewed: string[];
    syllablesReviewed: string[];
    wordsReviewed: string[];
    newMasteries: number;
  };

  dailyLimitMinutes: number | null;
  limitReached: boolean;

  petFeedCount: number;
  petPlayCount: number;
  petPetCount: number;
}
```

### ActivityLog

Log de eventos importantes.

```typescript
{
  id: string;
  childProfileId: string;

  activityType: ActivityType;
  severity: ActivitySeverity;

  title: string;
  description: string | null;
  metadata: object;

  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}
```

## Tipos de Actividad

| Tipo | Descripción | Severidad |
|------|-------------|-----------|
| SESSION_START | Sesión iniciada | INFO |
| SESSION_END | Sesión finalizada | INFO |
| DAILY_LIMIT_WARNING | 80% del límite usado | WARNING |
| DAILY_LIMIT_REACHED | Límite diario alcanzado | ALERT |
| WEEKLY_LIMIT_REACHED | Límite semanal alcanzado | ALERT |
| LETTER_MASTERED | Nueva letra dominada | SUCCESS |
| SYLLABLE_MASTERED | Nueva sílaba dominada | SUCCESS |
| WORD_MASTERED | Nueva palabra dominada | SUCCESS |
| LEVEL_UP | Subió de nivel | SUCCESS |
| PET_EVOLUTION | Mascota evolucionó | SUCCESS |
| PIN_FAILED_ATTEMPT | Intento de PIN fallido | WARNING |
| PIN_LOCKED | PIN bloqueado | ALERT |

## Presets de Configuración

### UNRESTRICTED
- Sin límites de tiempo
- Sin horarios restringidos
- Acceso libre

### MODERATE (Recomendado)
- 60 minutos diarios
- 300 minutos semanales
- Todos los días de 8am a 8pm

### RESTRICTED
- 30 minutos diarios
- 150 minutos semanales
- Horario escolar (antes y después de clases)
- Bloqueo estricto

### WEEKENDS_ONLY
- Solo sábados y domingos
- 90 minutos por día de fin de semana
- 180 minutos semanales

## Ejemplos de Uso

### Configurar límites de tiempo

```bash
curl -X PATCH http://localhost:3001/api/parental/child/{childId}/settings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "dailyTimeLimitMinutes": 60,
    "weeklyTimeLimitMinutes": 300,
    "maxSessionDurationMinutes": 30,
    "breakDurationMinutes": 15
  }'
```

### Configurar horario semanal

```bash
curl -X PATCH http://localhost:3001/api/parental/child/{childId}/settings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "weeklySchedule": [
      {
        "day": "monday",
        "enabled": true,
        "timeRanges": [
          { "start": "15:00", "end": "18:00" }
        ]
      },
      {
        "day": "saturday",
        "enabled": true,
        "timeRanges": [
          { "start": "09:00", "end": "12:00" },
          { "start": "15:00", "end": "20:00" }
        ]
      }
    ],
    "strictScheduleEnforcement": true
  }'
```

### Configurar PIN

```bash
curl -X POST http://localhost:3001/api/parental/child/{childId}/pin \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "pin": "1234" }'
```

### Verificar estado de acceso

```bash
curl -X GET http://localhost:3001/api/parental/child/{childId}/access-status \
  -H "Authorization: Bearer {token}"
```

Respuesta:
```json
{
  "allowed": true,
  "reason": null,
  "withinSchedule": true,
  "hasTimeRemaining": true,
  "minutesUsedToday": 25,
  "minutesRemainingToday": 35,
  "minutesUsedThisWeek": 120,
  "minutesRemainingThisWeek": 180,
  "nextAllowedTime": null
}
```

### Obtener estadísticas rápidas

```bash
curl -X GET http://localhost:3001/api/parental/child/{childId}/stats \
  -H "Authorization: Bearer {token}"
```

### Obtener resumen semanal

```bash
curl -X GET http://localhost:3001/api/parental/child/{childId}/usage/weekly \
  -H "Authorization: Bearer {token}"
```

### Obtener logs de actividad

```bash
curl -X GET "http://localhost:3001/api/parental/child/{childId}/activity?severity=alert&unreadOnly=true" \
  -H "Authorization: Bearer {token}"
```

## Integración con Otros Módulos

### Con Progress Module
El módulo Parental registra automáticamente las métricas de aprendizaje cuando se reportan sesiones de estudio.

### Con Pet Module
Se registran las interacciones con la mascota (alimentar, jugar, acariciar) en el resumen diario.

### Con Children-Profiles Module
Verifica que el padre tenga acceso al perfil del niño antes de cualquier operación.

## Notas de Seguridad

1. **Verificación de acceso**: Todos los endpoints verifican que el usuario autenticado sea el padre del niño.
2. **PIN hasheado**: El PIN se almacena hasheado con bcrypt.
3. **Protección contra fuerza bruta**: Bloqueo tras 5 intentos fallidos de PIN.
4. **Logs de seguridad**: Se registran intentos fallidos de PIN y cambios de configuración.

---

*Última actualización: 2025-01-21*
