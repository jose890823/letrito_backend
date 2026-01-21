# Módulo: Contact (Contacto)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/contact`

---

## 1. Descripción General

El módulo de **Contacto** gestiona el formulario de contacto público y la administración de mensajes recibidos.

### Propósito

- Formulario de contacto para usuarios y visitantes
- Gestión de mensajes por administradores
- Rate limiting para prevenir spam
- Sistema de respuestas

---

## 2. Funcionalidades

### Público

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Enviar mensaje | `POST /contact` | Enviar formulario de contacto |
| Verificar límite | `GET /contact/can-send` | ¿Puede enviar mensaje? |

### Admin

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Listar mensajes | `GET /admin/contact` | Lista de mensajes |
| Estadísticas | `GET /admin/contact/stats` | Métricas de contacto |
| Ver mensaje | `GET /admin/contact/:id` | Detalle de mensaje |
| Cambiar estado | `PATCH /admin/contact/:id/status` | Marcar como leído/respondido |
| Responder | `POST /admin/contact/:id/reply` | Enviar respuesta |
| Eliminar | `DELETE /admin/contact/:id` | Eliminar mensaje |

---

## 3. Endpoints API

### 3.1 Enviar Mensaje (Público)

```http
POST /api/contact
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "subject": "Consulta sobre la app",
  "message": "Hola, tengo una duda sobre cómo usar la app..."
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message": "Mensaje enviado correctamente. Te responderemos pronto."
  }
}
```

### 3.2 Verificar si Puede Enviar

```http
GET /api/contact/can-send?email=juan@example.com
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "canSend": true,
    "remainingMessages": 3,
    "nextAllowedAt": null
  }
}
```

---

## 4. Entidad

```typescript
@Entity('contact_messages')
class ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  repliedAt: Date | null;
  replyMessage: string | null;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. Rate Limiting

| Límite | Valor |
|--------|-------|
| Por email | 3 mensajes/día |
| Por IP | 5 mensajes/día |

---

## 6. Notas para Documentación de Usuario

### Para Usuarios

> **¿Tienes preguntas o sugerencias?**
>
> Puedes contactarnos a través del formulario de contacto en la app o en nuestra web.
>
> - Nombre completo
> - Tu email (para responderte)
> - Asunto
> - Tu mensaje
>
> Te responderemos en un plazo de 24-48 horas.

---

## 7. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.0.1 | Documentación para Letrito |
| 2024-11-01 | 1.0.0 | Implementación inicial |

---

*Documentación generada para Letrito Backend*
