# Módulo: AI (Inteligencia Artificial)

> **Estado:** ✅ Completo
> **Última actualización:** 2025-01-20
> **Uso interno:** Sí (no expone endpoints públicos directamente)

---

## 1. Descripción General

El módulo de **AI** proporciona integración con servicios de inteligencia artificial (OpenAI) para generación de contenido.

### Propósito

- Wrapper centralizado para APIs de IA
- Generación de texto con GPT
- Manejo de prompts y respuestas
- Configuración de modelos y parámetros

---

## 2. Proveedores Soportados

| Proveedor | Estado | Uso |
|-----------|--------|-----|
| OpenAI | ✅ Activo | GPT-4, GPT-3.5-turbo |
| Anthropic | 🔜 Planificado | Claude (futuro) |

---

## 3. Configuración

### Variables de Entorno

```bash
# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Configuración del modelo (opcional)
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

---

## 4. Uso Interno

### Inyección del Servicio

```typescript
import { AiService } from '../ai/ai.service';

@Injectable()
export class MiServicio {
  constructor(private readonly aiService: AiService) {}

  async generarContenido(prompt: string) {
    const respuesta = await this.aiService.generateText({
      prompt,
      maxTokens: 500,
      temperature: 0.8,
    });
    return respuesta;
  }
}
```

### Métodos Disponibles

```typescript
// Generación de texto simple
await aiService.generateText({ prompt, maxTokens, temperature });

// Chat completion (conversación)
await aiService.chatCompletion({ messages, model, maxTokens });

// Generación estructurada (JSON)
await aiService.generateStructured({ prompt, schema });
```

---

## 5. Aplicación en Letrito

> ✅ **Este módulo puede usarse en Letrito para:**
>
> - Generación de ejercicios de lectura personalizados
> - Creación de historias interactivas para niños
> - Feedback adaptativo según el progreso del niño
> - Generación de palabras y oraciones para practicar
>
> **Consideraciones:**
> - Contenido apropiado para niños (filtros de seguridad)
> - Prompts diseñados para educación infantil
> - Límites de uso para controlar costos

---

## 6. Seguridad

- API key nunca se expone al cliente
- Rate limiting para prevenir abuso
- Logs de uso para auditoría
- Filtros de contenido para niños (cuando aplique)

---

## 7. Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-01-20 | 1.0.1 | Documentación para Letrito |
| 2024-11-01 | 1.0.0 | Implementación con OpenAI |

---

*Documentación generada para Letrito Backend*
