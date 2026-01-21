# Módulo: Children Profiles (Perfiles de Niños)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/children`

---

## 1. Descripción General

El módulo de **Perfiles de Niños** permite a los padres/tutores crear y gestionar múltiples perfiles para sus hijos dentro de la aplicación Letrito. Cada perfil tiene su propia configuración, progreso y preferencias.

### Propósito

- Permitir que una cuenta de padre tenga múltiples niños
- Personalizar la experiencia de aprendizaje por niño
- Configurar límites de tiempo y restricciones horarias
- Gestionar preferencias de audio y accesibilidad

### Casos de Uso

1. **Familia con múltiples hijos**: Un padre crea perfiles separados para cada hijo
2. **Límites de uso**: Configurar máximo 30 minutos diarios para un niño
3. **Horarios permitidos**: Restringir uso a horario diurno (8:00-20:00)
4. **Preferencias de accesibilidad**: Activar/desactivar TTS, sonidos, vibraciones

---

## 2. Funcionalidades

### Implementadas ✅

| Feature | Descripción |
|---------|-------------|
| Crear perfil | Crear un nuevo perfil de niño |
| Listar perfiles | Ver todos los perfiles del padre |
| Obtener perfil | Ver detalles de un perfil específico |
| Actualizar perfil | Modificar nombre, avatar, fecha de nacimiento |
| Actualizar configuración | Modificar límites de tiempo, sonidos, etc. |
| Eliminar perfil | Soft delete de un perfil |
| Límite de perfiles | Máximo configurable por padre (default: 5) |
| Verificar límite | Consultar si puede crear más perfiles |

### Planificadas 🔜

| Feature | Descripción |
|---------|-------------|
| Avatar personalizado | Subir foto personalizada como avatar |
| Temas por perfil | Diferentes temas visuales por niño |
| PIN de acceso | PIN opcional para acceder al perfil |

---

## 3. Endpoints API

### 3.1 Listar Perfiles

```http
GET /api/children
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "id": "uuid",
        "name": "Sofía",
        "avatarId": "avatar_01",
        "avatarUrl": null,
        "birthDate": "2019-05-15",
        "age": 5,
        "settings": {
          "dailyTimeLimit": 30,
          "allowedHours": { "start": "08:00", "end": "20:00" },
          "soundEnabled": true,
          "ttsEnabled": true,
          "musicEnabled": true,
          "hapticEnabled": true
        },
        "isActive": true,
        "lastPlayedAt": "2025-01-20T10:30:00.000Z",
        "createdAt": "2025-01-15T08:00:00.000Z",
        "updatedAt": "2025-01-20T10:30:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### 3.2 Obtener Perfil

```http
GET /api/children/:id
Authorization: Bearer {token}
```

**Parámetros:**
- `id` (UUID): ID del perfil del niño

**Respuesta exitosa (200):** Mismo formato que un item de la lista

**Errores posibles:**
- `404`: Perfil no encontrado
- `403`: No tienes permiso para acceder a este perfil

### 3.3 Crear Perfil

```http
POST /api/children
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Mateo",
  "avatarId": "avatar_02",
  "birthDate": "2020-03-10",
  "age": 4,
  "settings": {
    "dailyTimeLimit": 45,
    "soundEnabled": true,
    "ttsEnabled": true
  }
}
```

**Campos requeridos:**
- `name` (string, 2-100 caracteres): Nombre del niño

**Campos opcionales:**
- `avatarId` (string): ID del avatar predefinido
- `birthDate` (string, YYYY-MM-DD): Fecha de nacimiento
- `age` (number, 1-18): Edad manual (si no se proporciona birthDate)
- `settings` (object): Configuración inicial

**Respuesta exitosa (201):** Perfil creado

**Errores posibles:**
- `400`: Datos inválidos o límite de perfiles alcanzado

### 3.4 Actualizar Perfil

```http
PATCH /api/children/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (todos opcionales):**
```json
{
  "name": "Mateo García",
  "avatarId": "avatar_05",
  "avatarUrl": "https://...",
  "birthDate": "2020-03-10",
  "age": 5,
  "isActive": true
}
```

### 3.5 Actualizar Configuración

```http
PATCH /api/children/:id/settings
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (todos opcionales):**
```json
{
  "dailyTimeLimit": 60,
  "allowedHours": {
    "start": "09:00",
    "end": "19:00"
  },
  "soundEnabled": true,
  "ttsEnabled": false,
  "musicEnabled": true,
  "hapticEnabled": false
}
```

**Nota:** Enviar `null` para `dailyTimeLimit` o `allowedHours` elimina la restricción.

```json
{
  "dailyTimeLimit": null,
  "allowedHours": null
}
```

### 3.6 Eliminar Perfil

```http
DELETE /api/children/:id
Authorization: Bearer {token}
```

**Respuesta exitosa:** `204 No Content`

**Nota:** Es un soft delete, el perfil se marca como eliminado pero no se borra físicamente.

### 3.7 Verificar si Puede Crear Más

```http
GET /api/children/can-create/check
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "canCreate": true,
    "currentCount": 2,
    "maxAllowed": 5
  }
}
```

---

## 4. Entidades

### ChildProfile

```typescript
@Entity('child_profiles')
class ChildProfile {
  id: string;              // UUID, PK
  name: string;            // Nombre del niño (max 100)
  avatarId: string | null; // ID de avatar predefinido
  avatarUrl: string | null;// URL de avatar personalizado
  birthDate: Date | null;  // Fecha de nacimiento
  age: number | null;      // Edad manual
  settings: ChildSettings; // Configuración (JSONB)
  isActive: boolean;       // Estado activo
  lastPlayedAt: Date | null; // Última sesión de juego
  parentId: string;        // FK a User
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;  // Soft delete
}
```

### ChildSettings (JSONB)

```typescript
interface ChildSettings {
  dailyTimeLimit?: number;   // Minutos por día (5-480)
  allowedHours?: {
    start: string;           // HH:mm (ej: "08:00")
    end: string;             // HH:mm (ej: "20:00")
  };
  soundEnabled: boolean;     // Efectos de sonido
  ttsEnabled: boolean;       // Text-to-speech
  musicEnabled: boolean;     // Música de fondo
  hapticEnabled: boolean;    // Vibraciones
}
```

### Valores por Defecto

```typescript
const DEFAULT_CHILD_SETTINGS = {
  dailyTimeLimit: undefined,  // Sin límite
  allowedHours: undefined,    // Sin restricción horaria
  soundEnabled: true,
  ttsEnabled: true,
  musicEnabled: true,
  hapticEnabled: true,
};
```

---

## 5. Relaciones

```
User (padre/tutor)
  │
  └──< ChildProfile (1:N)
         │
         └──< Progress (1:N) [futuro]
         └──< PetState (1:1) [futuro]
```

---

## 6. Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MAX_CHILDREN_PER_PARENT` | Máximo de perfiles por padre | `5` |

---

## 7. Validaciones

### Crear Perfil

| Campo | Validación |
|-------|------------|
| name | Requerido, 2-100 caracteres |
| avatarId | Opcional, max 50 caracteres |
| birthDate | Opcional, formato YYYY-MM-DD |
| age | Opcional, entero 1-18 |

### Actualizar Configuración

| Campo | Validación |
|-------|------------|
| dailyTimeLimit | Entero 5-480, o null para quitar |
| allowedHours.start | Formato HH:mm |
| allowedHours.end | Formato HH:mm |
| soundEnabled | Booleano |
| ttsEnabled | Booleano |
| musicEnabled | Booleano |
| hapticEnabled | Booleano |

---

## 8. Seguridad

- **Autenticación**: Todos los endpoints requieren JWT válido
- **Autorización**: Un padre solo puede acceder a sus propios perfiles de niños
- **Soft Delete**: Los perfiles eliminados se mantienen para auditoría

---

## 9. Ejemplos de Uso

### Flujo de Onboarding

1. El padre crea su cuenta
2. El padre crea perfiles para sus hijos:
   ```json
   POST /api/children
   { "name": "Sofía", "age": 5 }
   ```
3. La app móvil muestra selector de perfiles al iniciar

### Configurar Límites

```json
PATCH /api/children/{id}/settings
{
  "dailyTimeLimit": 30,
  "allowedHours": {
    "start": "08:00",
    "end": "20:00"
  }
}
```

### Quitar Límites

```json
PATCH /api/children/{id}/settings
{
  "dailyTimeLimit": null,
  "allowedHours": null
}
```

---

## 10. Notas para Documentación de Usuario

### Para Padres

> **Perfiles de Niños**
>
> Letrito te permite crear perfiles separados para cada uno de tus hijos. Cada perfil guarda su propio progreso de aprendizaje y configuración.
>
> **¿Cómo crear un perfil?**
> 1. Ve a Configuración > Perfiles
> 2. Toca "Agregar niño"
> 3. Ingresa el nombre y selecciona un avatar
> 4. (Opcional) Configura límites de tiempo
>
> **Límites de Tiempo**
> - Puedes establecer cuántos minutos al día puede jugar cada niño
> - También puedes definir horarios permitidos (ej: solo de 8am a 8pm)
>
> **Límite de Perfiles**
> Puedes crear hasta 5 perfiles de niños por cuenta.

---

## 11. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.0.0 | Implementación inicial del módulo |

---

*Documentación generada para Letrito Backend*
