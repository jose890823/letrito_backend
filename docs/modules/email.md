# Módulo: Email (Correo Electrónico)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Uso interno:** Sí (no expone endpoints públicos)

---

## 1. Descripción General

El módulo de **Email** proporciona un servicio centralizado para el envío de correos electrónicos con soporte para múltiples proveedores y fallback automático.

### Propósito

- Envío de emails transaccionales (verificación, OTP, recuperación de contraseña)
- Soporte para múltiples proveedores de email
- Fallback automático si el proveedor principal falla
- Modo simulado para desarrollo/testing

### Proveedores Soportados

1. **Resend** (Recomendado para producción)
2. **Gmail SMTP** (Backup/desarrollo)
3. **Modo Simulado** (Solo logs, sin configuración)

---

## 2. Funcionalidades

### Tipos de Email ✅

| Template | Descripción | Trigger |
|----------|-------------|---------|
| OTP de verificación | Código de 6 dígitos | Registro de usuario |
| Bienvenida | Email de bienvenida | Verificación exitosa |
| Reset password | Enlace de recuperación | Forgot password |
| Cambio de contraseña | OTP para confirmar cambio | Change password request |
| Nuevo login | Notificación de acceso | Login desde nuevo dispositivo |

---

## 3. Configuración

### Variables de Entorno

```bash
# Resend (Proveedor principal)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Gmail SMTP (Fallback)
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# General
EMAIL_FROM=noreply@letrito.app
```

### Prioridad de Proveedores

1. Si `RESEND_API_KEY` está configurado → Usa Resend
2. Si `GMAIL_USER` y `GMAIL_APP_PASSWORD` están configurados → Usa Gmail
3. Si ninguno está configurado → Modo simulado (logs solamente)

---

## 4. Uso Interno

### Inyección del Servicio

```typescript
import { EmailService } from '../email/email.service';

@Injectable()
export class MiServicio {
  constructor(
    @Optional() @Inject('EmailService')
    private emailService?: EmailService,
  ) {}

  async enviarNotificacion() {
    if (this.emailService) {
      await this.emailService.sendOtpEmail(email, otp);
    }
  }
}
```

### Métodos Disponibles

```typescript
// OTP de verificación
await emailService.sendOtpEmail(email, otpCode);

// Email de bienvenida
await emailService.sendWelcomeEmail(email, firstName);

// Reset de contraseña
await emailService.sendResetPasswordEmail(email, resetToken, frontendUrl);

// Notificación de nuevo login
await emailService.sendNewLoginNotification(email, { ip, userAgent, date });
```

---

## 5. Plantillas de Email

Los emails usan templates HTML con diseño responsive y branding de Letrito.

### Estructura de un Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>/* Estilos inline */</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="logo.png" alt="Letrito" />
    </div>
    <div class="content">
      <!-- Contenido del email -->
    </div>
    <div class="footer">
      <p>© 2025 Letrito</p>
    </div>
  </div>
</body>
</html>
```

---

## 6. Modo Simulado

Cuando no hay proveedor configurado, el servicio funciona en modo simulado:

```
[EmailService] 📧 MODO SIMULADO - Email que se enviaría:
  To: usuario@example.com
  Subject: Tu código de verificación
  OTP: 123456
```

Útil para:
- Desarrollo local sin configurar proveedores
- Testing automatizado
- Ambientes de CI/CD

---

## 7. Notas para Documentación de Usuario

### Para Padres

> **Emails de Letrito**
>
> Te enviaremos emails para:
> - Verificar tu cuenta cuando te registres
> - Recuperar tu contraseña si la olvidas
> - Notificarte de nuevos accesos a tu cuenta
>
> **¿No recibes nuestros emails?**
> - Revisa tu carpeta de spam
> - Asegúrate de que tu email esté bien escrito
> - Agrega noreply@letrito.app a tus contactos

---

## 8. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.1.0 | Actualización de branding para Letrito |
| 2024-11-01 | 1.0.0 | Implementación inicial con Resend y Gmail |

---

*Documentación generada para Letrito Backend*
