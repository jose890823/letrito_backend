# Módulo: Users (Usuarios)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/users`

---

## 1. Descripción General

El módulo de **Usuarios** gestiona los perfiles de usuario, incluyendo actualización de datos personales, foto de perfil, verificación de teléfono, onboarding y administración de usuarios.

### Propósito

- Gestión del perfil del usuario autenticado
- Subida y gestión de fotos de perfil
- Verificación de número de teléfono
- Flujo de onboarding para nuevos usuarios
- Administración de usuarios (panel admin)
- Registro de actividad de usuarios

---

## 2. Funcionalidades

### Usuario Autenticado ✅

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Ver perfil | `GET /users/profile` | Obtener mi perfil completo |
| Actualizar perfil | `PATCH /users/profile` | Modificar datos personales |
| Subir foto | `POST /users/profile/photo` | Subir foto de perfil |
| Eliminar foto | `DELETE /users/profile/photo` | Eliminar foto de perfil |
| Enviar OTP teléfono | `POST /users/phone/send-otp` | Enviar código al teléfono |
| Verificar teléfono | `POST /users/phone/verify` | Verificar código OTP |
| Estado onboarding | `GET /users/onboarding/status` | Ver progreso de onboarding |
| Actualizar nicho | `PATCH /users/onboarding/niche` | Seleccionar nicho (legacy) |
| Actualizar plataforma | `PATCH /users/onboarding/platform` | Seleccionar plataforma (legacy) |
| Completar onboarding | `POST /users/onboarding/complete` | Finalizar onboarding |
| Eliminar mi cuenta | `DELETE /users/account` | Soft delete de la cuenta |

### Administración (Admin) ✅

| Feature | Endpoint | Descripción |
|---------|----------|-------------|
| Listar usuarios | `GET /users/admin/all` | Lista paginada con filtros |
| Usuarios con planes | `GET /users/admin/all-with-plans` | Lista con info de suscripción |
| Buscar usuarios | `GET /users/admin/search` | Búsqueda por email/nombre |
| Ver usuario | `GET /users/admin/:id` | Detalle de un usuario |
| Actualizar usuario | `PUT /users/admin/:id` | Modificar datos de usuario |
| Cambiar roles | `PATCH /users/admin/:id/roles` | Modificar roles |
| Activar/desactivar | `PATCH /users/admin/:id/toggle-active` | Toggle estado activo |
| Eliminar usuario | `DELETE /users/admin/:id` | Soft delete |
| Ver actividad | `GET /users/admin/:id/activity` | Log de actividad |
| Estadísticas | `GET /users/admin/stats/summary` | Métricas de usuarios |

---

## 3. Endpoints API (Usuario)

### 3.1 Ver Perfil

```http
GET /api/users/profile
Authorization: Bearer {token}
```

### 3.2 Actualizar Perfil

```http
PATCH /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Carlos",
  "lastName": "Rodriguez",
  "phone": "+13058107465",
  "address": "123 Main St",
  "city": "Miami",
  "state": "FL",
  "zipCode": "33101",
  "country": "USA",
  "dateOfBirth": "1990-05-15",
  "timezone": "America/New_York"
}
```

### 3.3 Subir Foto de Perfil

```http
POST /api/users/profile/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:** `file` (image/jpeg, image/png, image/webp, max 5MB)

### 3.4 Completar Onboarding

```http
POST /api/users/onboarding/complete
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "nicheId": "uuid-del-nicho",
  "preferredPlatform": "tiktok",
  "timezone": "America/Mexico_City"
}
```

---

## 4. Endpoints API (Admin)

### 4.1 Listar Usuarios

```http
GET /api/users/admin/all?page=1&limit=10&role=client&isActive=true
Authorization: Bearer {token}
```

**Query params:**
- `page`: Página (default: 1)
- `limit`: Items por página (default: 10)
- `role`: Filtrar por rol
- `isActive`: Filtrar por estado
- `search`: Búsqueda por email/nombre

### 4.2 Actualizar Roles

```http
PATCH /api/users/admin/:id/roles
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "roles": ["admin", "client"]
}
```

---

## 5. Entidades

### UserActivity

```typescript
@Entity('user_activities')
class UserActivity {
  id: string;
  userId: string;
  action: string;        // 'login', 'logout', 'profile_update', etc.
  details: object;       // Detalles adicionales (JSONB)
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

---

## 6. Servicios

| Servicio | Descripción |
|----------|-------------|
| `UsersService` | Lógica principal de usuarios |
| `UserActivityService` | Registro de actividades |
| `FileUploadService` | Manejo de archivos/fotos |

---

## 7. Notas para Documentación de Usuario

### Para Padres

> **Tu Perfil**
>
> En tu perfil puedes:
> - Actualizar tu nombre y datos de contacto
> - Cambiar tu foto de perfil
> - Verificar tu número de teléfono
>
> **Eliminar tu cuenta**
>
> Si deseas eliminar tu cuenta, puedes hacerlo desde Configuración.
> Tus datos serán eliminados y no podrás recuperarlos.

---

## 8. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.1.0 | Actualización para Letrito |
| 2024-11-01 | 1.0.0 | Implementación inicial |

---

*Documentación generada para Letrito Backend*
