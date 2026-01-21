# Módulo: Auth (Autenticación)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/auth`

---

## 1. Descripción General

El módulo de **Autenticación** gestiona todo el ciclo de vida de acceso de usuarios: registro, verificación de email, login, logout, tokens JWT, y recuperación de contraseña.

### Propósito

- Registro de usuarios con verificación de email vía OTP
- Login seguro con tokens JWT (access + refresh)
- Rotación automática de refresh tokens
- Recuperación y cambio de contraseña
- Control de sesiones

### Características de Seguridad

- **Access Token:** Expira en 15 minutos (configurable)
- **Refresh Token:** Expira en 7 días con rotación automática
- **OTP:** Código de 6 dígitos, 10 minutos de expiración, máximo 3 intentos
- **Password:** Mínimo 8 caracteres, requiere mayúscula, minúscula, número y caracter especial
- **Bcrypt:** Hash de contraseñas con 10 rounds (configurable)

---

## 2. Funcionalidades

### Implementadas ✅

| Feature | Descripción |
|---------|-------------|
| Registro | Crear cuenta con validación de datos |
| Verificación de email | OTP de 6 dígitos enviado al email |
| Reenvío de OTP | Generar y enviar nuevo código |
| Login | Autenticación con email/password |
| Refresh tokens | Renovación de tokens con rotación |
| Logout | Invalidación de refresh token |
| Forgot password | Solicitar enlace de recuperación |
| Reset password | Cambiar contraseña con token |
| Change password | Cambio directo (legacy) |
| Change password 2FA | Cambio con verificación OTP |
| Perfil del usuario | Obtener datos del usuario autenticado |

---

## 3. Endpoints API

### 3.1 Registro

```http
POST /api/auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "email": "padre@letrito.app",
  "password": "Padre123!",
  "firstName": "Carlos",
  "lastName": "Rodriguez",
  "phone": "+13058107465"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "padre@letrito.app",
      "firstName": "Carlos",
      "lastName": "Rodriguez",
      "phone": "+13058107465",
      "role": "client",
      "emailVerified": false,
      "isActive": true
    },
    "message": "Usuario registrado exitosamente. Por favor verifica tu email con el código OTP enviado."
  }
}
```

### 3.2 Verificar Email

```http
POST /api/auth/verify-email
Content-Type: application/json
```

**Body:**
```json
{
  "email": "padre@letrito.app",
  "otp": "123456"
}
```

### 3.3 Reenviar OTP

```http
POST /api/auth/resend-otp
Content-Type: application/json
```

**Body:**
```json
{
  "email": "padre@letrito.app"
}
```

### 3.4 Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "padre@letrito.app",
  "password": "Padre123!"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "padre@letrito.app",
      "firstName": "Carlos",
      "lastName": "Rodriguez",
      "role": "client",
      "emailVerified": true,
      "isActive": true,
      "lastLoginAt": "2025-01-20T10:30:00.000Z"
    }
  }
}
```

### 3.5 Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Nota:** Implementa rotación de tokens - el refresh token usado se invalida y se emite uno nuevo.

### 3.6 Logout

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

### 3.7 Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

**Body:**
```json
{
  "email": "padre@letrito.app"
}
```

**Nota:** Siempre responde éxito para no revelar si el email existe.

### 3.8 Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json
```

**Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NuevaPass123!"
}
```

### 3.9 Change Password (2 pasos)

**Paso 1 - Solicitar:**
```http
POST /api/auth/change-password/request
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```json
{
  "currentPassword": "Padre123!"
}
```

**Paso 2 - Confirmar:**
```http
POST /api/auth/change-password/confirm
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```json
{
  "otp": "123456",
  "newPassword": "NuevoPass456!"
}
```

### 3.10 Obtener Perfil

```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

---

## 4. Entidades

### User (en auth/entities/)

```typescript
@Entity('users')
class User {
  id: string;                    // UUID
  email: string;                 // Único
  password: string;              // Hashed (bcrypt)
  firstName: string;
  lastName: string;
  phone: string;
  roles: UserRole[];             // ['client'] | ['admin'] | ['super_admin']
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  isSystemUser: boolean;
  lastLoginAt: Date | null;

  // Perfil extendido
  profilePhoto: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  dateOfBirth: Date | null;

  // Stripe
  stripeCustomerId: string | null;

  // Tokens sensibles (excluidos de respuestas)
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  otpCode: string | null;
  otpExpiresAt: Date | null;
  otpAttempts: number;
  resetPasswordToken: string | null;
  resetPasswordExpiresAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### UserRole (Enum)

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CLIENT = 'client',
}
```

---

## 5. Guards y Decoradores

### Guards

| Guard | Uso |
|-------|-----|
| `JwtAuthGuard` | Requiere access token válido |
| `JwtRefreshGuard` | Requiere refresh token válido |
| `RolesGuard` | Verifica roles del usuario |

### Decoradores

| Decorador | Uso |
|-----------|-----|
| `@Public()` | Marca ruta como pública (sin auth) |
| `@CurrentUser()` | Obtiene usuario del request |
| `@CurrentUser('id')` | Obtiene propiedad específica |
| `@Roles(UserRole.ADMIN)` | Requiere rol específico |

---

## 6. Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret para access tokens | (requerido) |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens | (requerido) |
| `JWT_EXPIRATION` | Expiración access token | `15m` |
| `JWT_REFRESH_EXPIRATION` | Expiración refresh token | `7d` |
| `BCRYPT_ROUNDS` | Rounds para hash | `10` |
| `OTP_LENGTH` | Longitud del OTP | `6` |
| `OTP_EXPIRATION_MINUTES` | Expiración OTP | `10` |
| `OTP_MAX_ATTEMPTS` | Intentos máximos OTP | `3` |

---

## 7. Validaciones de Password

```typescript
// Regex de validación
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/

// Requisitos:
// - Mínimo 8 caracteres
// - Al menos 1 mayúscula
// - Al menos 1 minúscula
// - Al menos 1 número
// - Al menos 1 caracter especial (@$!%*?&)
```

---

## 8. Flujos de Uso

### Registro Completo

```
1. POST /auth/register
   └─> Usuario creado, OTP enviado por email

2. POST /auth/verify-email
   └─> Email verificado

3. POST /auth/login
   └─> Access token + Refresh token
```

### Renovación de Sesión

```
1. Access token expira (15 min)

2. POST /auth/refresh (con refresh token)
   └─> Nuevos access + refresh tokens

3. Continuar usando nuevo access token
```

### Recuperación de Contraseña

```
1. POST /auth/forgot-password
   └─> Email con token de reset enviado

2. POST /auth/reset-password (con token)
   └─> Contraseña actualizada

3. POST /auth/login
   └─> Acceso con nueva contraseña
```

---

## 9. Notas para Documentación de Usuario

### Para Padres

> **Crear tu cuenta**
>
> 1. Ingresa tu email, contraseña y datos personales
> 2. Recibirás un código de 6 dígitos en tu email
> 3. Ingresa el código para verificar tu cuenta
> 4. ¡Listo! Ya puedes iniciar sesión
>
> **¿Olvidaste tu contraseña?**
>
> 1. Toca "¿Olvidaste tu contraseña?"
> 2. Ingresa tu email
> 3. Recibirás un enlace para crear una nueva contraseña
>
> **Seguridad de tu cuenta**
>
> - Tu contraseña debe tener al menos 8 caracteres
> - Incluye mayúsculas, minúsculas, números y símbolos
> - Nunca compartas tu contraseña con nadie

---

## 10. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.1.0 | Actualización para Letrito |
| 2024-11-01 | 1.0.0 | Implementación inicial |

---

*Documentación generada para Letrito Backend*
