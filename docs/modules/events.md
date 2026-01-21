# Módulo: Events (Eventos y Analytics)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/events`

---

## 1. Descripción General

El módulo de **Events** registra y gestiona eventos de la aplicación para analytics y auditoría.

### Propósito

- Registro de eventos de usuario
- Analytics de comportamiento
- Auditoría de acciones
- Métricas de uso

---

## 2. Funcionalidades

### Para Usuarios

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Registrar evento | `POST /events` | Enviar evento desde el cliente |

### Interno

| Feature | Descripción |
|---------|-------------|
| Event Emitter | Eventos internos del sistema |
| Listeners | Procesamiento de eventos |

---

## 3. Tipos de Eventos

### Eventos de Usuario

| Evento | Descripción |
|--------|-------------|
| `user.login` | Usuario inició sesión |
| `user.logout` | Usuario cerró sesión |
| `user.profile_update` | Perfil actualizado |

### Eventos de Contenido (Legacy)

| Evento | Descripción |
|--------|-------------|
| `generation.created` | Idea generada |
| `generation.viewed` | Idea vista |
| `generation.used` | Idea marcada como usada |

### Eventos de Suscripción (Legacy)

| Evento | Descripción |
|--------|-------------|
| `subscription.created` | Suscripción creada |
| `subscription.cancelled` | Suscripción cancelada |

---

## 4. Estructura de Evento

```json
{
  "id": "uuid",
  "userId": "uuid",
  "eventType": "user.login",
  "payload": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "device": "mobile"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

---

## 5. Event Emitter (Interno)

```typescript
// Emitir evento
this.eventEmitter.emit('user.login', {
  userId: user.id,
  ip: ipAddress,
  userAgent,
});

// Escuchar evento
@OnEvent('user.login')
handleUserLogin(payload: UserLoginPayload) {
  this.logger.log(`User ${payload.userId} logged in`);
}
```

---

## 6. Eventos para Letrito

> Para Letrito, agregar eventos específicos:
>
> | Evento | Descripción |
> |--------|-------------|
> | `child.session_start` | Niño inició sesión de juego |
> | `child.session_end` | Niño terminó sesión |
> | `child.level_complete` | Nivel completado |
> | `child.letter_learned` | Letra aprendida |
> | `child.word_written` | Palabra escrita |
> | `pet.fed` | Mascota alimentada |
> | `pet.played_with` | Jugó con mascota |
> | `achievement.unlocked` | Logro desbloqueado |

---

## 7. Uso para Analytics

Los eventos se pueden usar para:

- **Métricas de engagement:** Tiempo de sesión, frecuencia de uso
- **Embudo de conversión:** Registro → Verificación → Primer uso
- **Análisis de features:** ¿Qué funciones se usan más?
- **Retención:** ¿Cuántos usuarios vuelven?

---

## 8. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.0.1 | Documentación para Letrito |
| 2024-11-01 | 1.0.0 | Implementación inicial |

---

*Documentación generada para Letrito Backend*
