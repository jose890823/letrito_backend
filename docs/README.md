# Documentación de Módulos - Letrito Backend

Esta carpeta contiene la documentación técnica y funcional de cada módulo del backend de Letrito.

## Estructura de la Documentación

Cada módulo tiene su propio archivo `.md` en la carpeta `modules/` con la siguiente estructura:

1. **Descripción General** - Qué hace el módulo y para qué sirve
2. **Funcionalidades** - Lista de features implementados
3. **Endpoints API** - Rutas disponibles con ejemplos
4. **Entidades** - Estructura de datos en la base de datos
5. **DTOs** - Objetos de transferencia de datos
6. **Configuración** - Variables de entorno y opciones
7. **Ejemplos de Uso** - Casos de uso comunes
8. **Notas para el Usuario Final** - Información relevante para documentación pública

## Índice de Módulos

### Módulos Core (Infraestructura)

| Módulo | Descripción | Estado | Documentación |
|--------|-------------|--------|---------------|
| [auth](./modules/auth.md) | Autenticación y autorización JWT | ✅ Completo | 📄 |
| [users](./modules/users.md) | Gestión de usuarios y perfiles | ✅ Completo | 📄 |
| [email](./modules/email.md) | Envío de emails (Resend/Gmail) | ✅ Completo | 📄 |
| [payments](./modules/payments.md) | Integración con Stripe | ✅ Completo | 📄 |

### Módulos de Soporte Reutilizables

| Módulo | Descripción | Estado | Documentación |
|--------|-------------|--------|---------------|
| [streaks](./modules/streaks.md) | Sistema de rachas | ✅ Completo | 📄 |
| [ai](./modules/ai.md) | Integración con OpenAI | ✅ Completo | 📄 |

### Módulos de Dominio (Letrito - App Educativa)

| Módulo | Descripción | Estado | Documentación |
|--------|-------------|--------|---------------|
| [children-profiles](./modules/children-profiles.md) | Perfiles de niños | ✅ Completo | 📄 |
| [progress](./modules/progress.md) | Progreso de aprendizaje | ✅ Completo | 📄 |
| [pet](./modules/pet.md) | Mascota virtual Letrito | ✅ Completo | 📄 |
| [parental](./modules/parental.md) | Control parental | ✅ Completo | 📄 |
| [analytics](./modules/analytics.md) | Analiticas de uso | ✅ Completo | 📄 |

### Módulos de Soporte

| Módulo | Descripción | Estado | Documentación |
|--------|-------------|--------|---------------|
| [dashboard](./modules/dashboard.md) | Dashboard administrativo | ✅ Completo | 📄 |
| [contact](./modules/contact.md) | Formulario de contacto | ✅ Completo | 📄 |
| [events](./modules/events.md) | Sistema de eventos/analytics | ✅ Completo | 📄 |

## Convenciones

### Estados de Módulos

- ✅ **Completo**: Módulo implementado y funcional
- 🔨 **En Desarrollo**: Módulo en proceso de implementación
- 🔜 **Pendiente**: Módulo planificado pero no iniciado
- ⚠️ **Deprecado**: Módulo marcado para eliminación

### Versionado

La documentación se actualiza junto con los cambios en el código. Cada archivo incluye:
- Fecha de última actualización
- Versión del módulo (si aplica)
- Changelog de cambios significativos

## Generación de Documentación Pública

Esta documentación técnica sirve como base para generar:

1. **Documentación de API** (Swagger/OpenAPI) - Automática desde decoradores
2. **Guía de Usuario** - Manual para usuarios finales de la app
3. **Guía de Integración** - Para desarrolladores que consuman la API

---

*Ultima actualizacion: 2026-01-20*
