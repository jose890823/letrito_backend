# Módulo: Payments (Pagos)

> **Estado:** ✅ Completo (Legacy - PublishSparks)
> **Última actualización:** 2025-01-20
> **Ruta base:** `/api/payments`
> **Nota:** Este módulo fue diseñado para PublishSparks. Para Letrito, evaluar si se requieren pagos.

---

## 1. Descripción General

El módulo de **Pagos** integra Stripe para gestionar suscripciones, métodos de pago y webhooks de Stripe.

### Propósito

- Crear y gestionar clientes en Stripe
- Manejar suscripciones mensuales
- Procesar webhooks de Stripe
- Gestionar métodos de pago
- Portal del cliente para autogestión

---

## 2. Funcionalidades

### Implementadas ✅

| Feature | Descripción |
|---------|-------------|
| Crear cliente Stripe | Sincronizar usuario con Stripe |
| Crear suscripción | Suscripción con trial de 7 días |
| Cancelar suscripción | Cancelación al final del período |
| Portal del cliente | Acceso al portal de Stripe |
| Webhooks | Procesamiento de eventos de Stripe |
| Métodos de pago | Agregar/quitar tarjetas |

---

## 3. Endpoints API

### 3.1 Crear Checkout Session

```http
POST /api/payments/create-checkout
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "priceId": "price_xxxxx",
  "successUrl": "https://letrito.app/success",
  "cancelUrl": "https://letrito.app/cancel"
}
```

### 3.2 Portal del Cliente

```http
POST /api/payments/portal
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "returnUrl": "https://letrito.app/settings"
}
```

### 3.3 Estado de Suscripción

```http
GET /api/payments/subscription
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "hasActiveSubscription": true,
  "subscription": {
    "id": "sub_xxxxx",
    "status": "active",
    "currentPeriodEnd": "2025-02-20T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  },
  "isInTrial": false,
  "trialEndsAt": null
}
```

### 3.4 Webhook de Stripe

```http
POST /api/payments/webhook
Stripe-Signature: {signature}
```

---

## 4. Eventos de Webhook

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Activar suscripción |
| `customer.subscription.updated` | Actualizar estado |
| `customer.subscription.deleted` | Marcar como cancelada |
| `invoice.payment_failed` | Notificar fallo de pago |
| `invoice.payment_succeeded` | Confirmar pago |

---

## 5. Configuración

### Variables de Entorno

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx
```

---

## 6. Modelo de Precios (PublishSparks)

| Plan | Precio | Trial |
|------|--------|-------|
| Mensual | $7 USD/mes | 7 días gratis |

---

## 7. Notas para Letrito

> ⚠️ **Este módulo es legacy de PublishSparks**
>
> Para Letrito (app educativa para niños), evaluar:
> - ¿Se requiere modelo de suscripción?
> - ¿Compras in-app para la app Flutter?
> - ¿Modelo freemium?
>
> Si Letrito no requiere pagos, este módulo puede desactivarse.

---

## 8. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.0.1 | Documentación para Letrito |
| 2024-11-01 | 1.0.0 | Implementación para PublishSparks |

---

*Documentación generada para Letrito Backend*
