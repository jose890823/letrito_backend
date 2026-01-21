import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';

export interface GeneratedContent {
  hook: string;
  script: string;
  format: string;
  cta: string;
  metadata: {
    audioSuggestion: string;
    visualHints: string[];
    estimatedDuration: string;
  };
}

export interface GenerateContentOptions {
  nicheName: string;
  nichePromptTemplate: string;
  platform: string;
  recentHooks?: string[]; // Hooks de los últimos 7 días para evitar repetición
  // Campos estructurados del nicho
  toneKeywords?: string[];
  forbiddenPhrases?: string[];
  exampleContent?: string;
  maxHookLength?: number;
  maxScriptLength?: number;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private isConfigured = false;

  onModuleInit() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
      this.logger.log('OpenAI API configurada correctamente');
    } else {
      this.logger.warn(
        'OPENAI_API_KEY no configurada - usando contenido placeholder',
      );
    }
  }

  /**
   * Verifica si la API de OpenAI está configurada
   */
  isAvailable(): boolean {
    return this.isConfigured && this.openai !== null;
  }

  /**
   * Genera contenido para un nicho específico
   * @param options - Opciones de generación incluyendo historial para anti-repetición
   */
  async generateContent(
    options: GenerateContentOptions,
  ): Promise<GeneratedContent> {
    const {
      nicheName,
      nichePromptTemplate,
      platform,
      recentHooks = [],
      toneKeywords = [],
      forbiddenPhrases = [],
      exampleContent,
      maxHookLength = 120,
      maxScriptLength = 600,
    } = options;

    if (!this.isAvailable()) {
      this.logger.debug('OpenAI no disponible, usando placeholder');
      return this.getPlaceholderContent(nicheName);
    }

    // Intentar hasta 3 veces si el contenido no pasa validación
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const systemPrompt = this.buildSystemPrompt(platform);
        const userPrompt = this.buildUserPrompt({
          nicheName,
          promptTemplate: nichePromptTemplate,
          platform,
          recentHooks,
          toneKeywords,
          forbiddenPhrases,
          exampleContent,
          maxHookLength,
          maxScriptLength,
        });

        const response = await this.openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8 + attempt * 0.05, // Aumentar creatividad en reintentos
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new Error('No se recibió respuesta de OpenAI');
        }

        const parsed = JSON.parse(content) as GeneratedContent;
        const validated = this.validateAndSanitize(parsed);

        // Verificar si pasa las validaciones de calidad con límites del nicho
        const validationResult = this.checkContentQuality(
          validated,
          recentHooks,
          forbiddenPhrases,
          maxHookLength,
          maxScriptLength,
        );
        if (validationResult.isValid) {
          this.logger.debug(
            `Contenido generado para ${nicheName} (intento ${attempt})`,
          );
          return validated;
        }

        this.logger.warn(
          `Intento ${attempt}/${maxAttempts} falló: ${validationResult.reason}`,
        );
      } catch (error) {
        this.logger.error(`Error en intento ${attempt}: ${error.message}`);
      }
    }

    // Si todos los intentos fallan, usar placeholder
    this.logger.warn(
      `Usando placeholder después de ${maxAttempts} intentos fallidos`,
    );
    return this.getPlaceholderContent(nicheName);
  }

  /**
   * Verifica la calidad del contenido generado
   */
  private checkContentQuality(
    content: GeneratedContent,
    recentHooks: string[],
    nicheForbiddenPhrases: string[] = [],
    maxHookLength: number = 120,
    maxScriptLength: number = 600,
  ): { isValid: boolean; reason?: string } {
    // Validar longitud del hook (usando límite del nicho)
    if (content.hook.length > maxHookLength) {
      return {
        isValid: false,
        reason: `Hook demasiado largo (>${maxHookLength} chars)`,
      };
    }

    // Validar longitud del script (usando límite del nicho)
    if (content.script.length > maxScriptLength) {
      return {
        isValid: false,
        reason: `Script demasiado largo (>${maxScriptLength} chars)`,
      };
    }

    // Verificar que no sea similar a hooks recientes
    if (recentHooks.length > 0) {
      const hookLower = content.hook.toLowerCase();
      for (const recent of recentHooks) {
        const similarity = this.calculateSimilarity(
          hookLower,
          recent.toLowerCase(),
        );
        if (similarity > 0.7) {
          return {
            isValid: false,
            reason: `Hook muy similar a uno reciente (${Math.round(similarity * 100)}%)`,
          };
        }
      }
    }

    // Frases globales prohibidas (lenguaje corporativo/robótico)
    const globalForbiddenPhrases = [
      'estimado usuario',
      'le informamos',
      'a continuación',
      'en conclusión',
      'por lo tanto',
    ];

    // Combinar frases prohibidas globales + del nicho
    const allForbiddenPhrases = [
      ...globalForbiddenPhrases,
      ...nicheForbiddenPhrases,
    ];

    const contentLower = (content.hook + ' ' + content.script).toLowerCase();
    for (const phrase of allForbiddenPhrases) {
      if (contentLower.includes(phrase.toLowerCase())) {
        return {
          isValid: false,
          reason: `Contiene frase prohibida: "${phrase}"`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Calcula similitud entre dos strings (Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/).filter((w) => w.length > 2));
    const words2 = new Set(str2.split(/\s+/).filter((w) => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Construye el prompt del sistema
   */
  private buildSystemPrompt(platform: string): string {
    return `Eres un experto creador de contenido viral para ${platform} en español latinoamericano.
Tu objetivo es crear contenido corto, impactante y altamente compartible para creadores que NO muestran su cara.

REGLAS IMPORTANTES:
- El contenido debe ser en español neutro latinoamericano (no usar "vosotros", "tío", etc.)
- Debe poder grabarse con texto en pantalla + video de fondo genérico
- El hook debe captar la atención en los primeros 2 segundos
- El script debe ser conciso (máximo 100 palabras)
- El CTA debe invitar a la interacción (comentar, guardar, compartir)
- NO uses humor ofensivo, político o religioso
- NO menciones marcas específicas
- El contenido debe sentirse auténtico, no corporativo

FORMATO DE RESPUESTA (JSON):
{
  "hook": "Frase inicial que captura la atención",
  "script": "Guión completo del contenido",
  "format": "Descripción breve del formato visual sugerido",
  "cta": "Call to action final",
  "metadata": {
    "audioSuggestion": "Tipo de música o audio sugerido",
    "visualHints": ["elemento visual 1", "elemento visual 2"],
    "estimatedDuration": "duración estimada en segundos"
  }
}`;
  }

  /**
   * Opciones para construir el prompt del usuario
   */
  private buildUserPrompt(options: {
    nicheName: string;
    promptTemplate: string;
    platform: string;
    recentHooks?: string[];
    toneKeywords?: string[];
    forbiddenPhrases?: string[];
    exampleContent?: string;
    maxHookLength?: number;
    maxScriptLength?: number;
  }): string {
    const {
      nicheName,
      promptTemplate,
      platform,
      recentHooks = [],
      toneKeywords = [],
      forbiddenPhrases = [],
      exampleContent,
      maxHookLength = 120,
      maxScriptLength = 600,
    } = options;

    // Sección de tono
    let toneSection = '';
    if (toneKeywords.length > 0) {
      toneSection = `
TONO DEL CONTENIDO:
El contenido debe sentirse: ${toneKeywords.join(', ')}.
`;
    }

    // Sección de frases prohibidas del nicho
    let forbiddenSection = '';
    if (forbiddenPhrases.length > 0) {
      forbiddenSection = `
EVITAR ESTAS FRASES/PALABRAS:
${forbiddenPhrases.map((p) => `- "${p}"`).join('\n')}
`;
    }

    // Sección de ejemplo (few-shot learning)
    let exampleSection = '';
    if (exampleContent) {
      exampleSection = `
EJEMPLO DE CONTENIDO IDEAL PARA ESTE NICHO:
---
${exampleContent}
---
Usa este ejemplo como referencia del estilo y estructura esperados, pero crea algo ORIGINAL.
`;
    }

    // Sección anti-repetición
    let antiRepetitionSection = '';
    if (recentHooks.length > 0) {
      antiRepetitionSection = `
IMPORTANTE - NO REPETIR:
Los siguientes hooks ya fueron usados recientemente. NO uses ideas similares:
${recentHooks.map((h, i) => `${i + 1}. "${h}"`).join('\n')}

Genera algo COMPLETAMENTE DIFERENTE a estos temas y estructuras.
`;
    }

    return `Genera una idea de contenido para el nicho "${nicheName}" en ${platform}.

INSTRUCCIONES ESPECÍFICAS DEL NICHO:
${promptTemplate}
${toneSection}${forbiddenSection}${exampleSection}${antiRepetitionSection}
RESTRICCIONES DE LONGITUD (MUY IMPORTANTES):
- Hook: máximo ${maxHookLength} caracteres
- Script: máximo ${maxScriptLength} caracteres (15-30 segundos al leerlo)
- CTA: máximo 50 caracteres

Genera contenido ÚNICO y ORIGINAL. No repitas ideas comunes.
El contenido debe ser relevante para la audiencia de LATAM.
Debe sentirse como algo que diría una persona real, no una IA.
Responde SOLO con el JSON, sin texto adicional.`;
  }

  /**
   * Valida y sanitiza el contenido generado
   */
  private validateAndSanitize(content: GeneratedContent): GeneratedContent {
    return {
      hook: content.hook?.substring(0, 200) || 'Esto te va a sorprender...',
      script: content.script?.substring(0, 1000) || 'Contenido no disponible',
      format:
        content.format?.substring(0, 255) ||
        'Texto en pantalla con video de fondo',
      cta: content.cta?.substring(0, 255) || 'Comenta qué opinas',
      metadata: {
        audioSuggestion:
          content.metadata?.audioSuggestion || 'música de fondo suave',
        visualHints: Array.isArray(content.metadata?.visualHints)
          ? content.metadata.visualHints.slice(0, 5)
          : ['video genérico'],
        estimatedDuration:
          content.metadata?.estimatedDuration || '15-20 segundos',
      },
    };
  }

  /**
   * Contenido placeholder cuando OpenAI no está disponible
   */
  private getPlaceholderContent(nicheName: string): GeneratedContent {
    const placeholders: Record<string, GeneratedContent> = {
      chistes: {
        hook: 'Esto le pasa a todo el mundo pero nadie lo dice...',
        script: `¿Alguna vez has dicho "ya voy" y te has quedado 20 minutos más en el sofá?

Porque yo sí. Y lo peor es que lo digo con total convicción.

"Ya voy" es la mentira más honesta que existe.`,
        format: 'Texto en pantalla con video de fondo lifestyle',
        cta: 'Comenta "culpable" si te ha pasado',
        metadata: {
          audioSuggestion: 'música alegre y casual',
          visualHints: ['persona en sofá', 'expresión culpable'],
          estimatedDuration: '15-20 segundos',
        },
      },
      reflexiones: {
        hook: 'Algo que aprendí demasiado tarde...',
        script: `No tienes que tener todo resuelto.

Solo tienes que dar el siguiente paso.

El resto se va construyendo mientras caminas.`,
        format: 'Voz en off con imágenes cinemáticas',
        cta: 'Guarda esto para cuando lo necesites',
        metadata: {
          audioSuggestion: 'música tranquila, piano suave',
          visualHints: ['camino', 'amanecer', 'naturaleza'],
          estimatedDuration: '20-25 segundos',
        },
      },
      frases: {
        hook: 'Frase del día:',
        script: `"No es que no tenga tiempo.
Es que algunas cosas dejaron de ser prioridad."`,
        format: 'Texto grande centrado con fondo minimalista',
        cta: 'Etiqueta a alguien que necesita leer esto',
        metadata: {
          audioSuggestion: 'trending sound suave',
          visualHints: ['fondo neutro', 'tipografía bold'],
          estimatedDuration: '8-12 segundos',
        },
      },
      curiosidades: {
        hook: 'Dato que te va a volar la cabeza:',
        script: `Los pulpos tienen 3 corazones.

Y cuando nadan, uno de ellos deja de latir.

Por eso prefieren caminar - nadar literalmente los cansa del corazón.`,
        format: 'Texto dinámico con imágenes o clips',
        cta: 'Sígueme para más datos así',
        metadata: {
          audioSuggestion: 'música de misterio/descubrimiento',
          visualHints: ['pulpo', 'océano', 'infografía simple'],
          estimatedDuration: '18-22 segundos',
        },
      },
      motivacion: {
        hook: 'Recordatorio para hoy:',
        script: `Estás haciendo lo mejor que puedes con lo que tienes.

Y eso ya es suficiente.

Deja de compararte con gente que no conoce tu historia.`,
        format: 'Texto en pantalla, fondo inspiracional',
        cta: 'Guárdalo y míralo cuando lo necesites',
        metadata: {
          audioSuggestion: 'música motivacional suave',
          visualHints: ['amanecer', 'persona caminando', 'luz'],
          estimatedDuration: '15-20 segundos',
        },
      },
    };

    const nicheKey = nicheName.toLowerCase();
    return placeholders[nicheKey] || placeholders['chistes'];
  }
}
