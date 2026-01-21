# Módulo Pet - Mascota Virtual

## Descripción General

El módulo Pet implementa la mascota virtual "Letrito", un zorrito que acompaña al niño en su aprendizaje. La mascota crece y evoluciona conforme el niño aprende letras, sílabas y palabras, creando una conexión emocional que motiva el aprendizaje continuo.

## Funcionalidades

### Sistema de Mascota
- Mascota única por perfil de niño (relación 1:1)
- Niveles del 1 al 20 con experiencia progresiva
- 5 etapas de evolución basadas en progreso de aprendizaje
- Stats: felicidad, energía, hambre
- Estados de ánimo según felicidad

### Interacciones
- **Alimentar**: Reduce hambre, aumenta felicidad (cooldown: 1 hora)
- **Jugar**: Aumenta felicidad, consume energía (cooldown: 30 min)
- **Acariciar**: Pequeño boost de felicidad (sin cooldown)
- Racha de interacción diaria

### Sistema de Evolución
| Etapa | Nombre | Requisito |
|-------|--------|-----------|
| egg | Huevo | Inicial |
| baby | Bebé | 3 letras dominadas |
| child | Niño | 10 letras dominadas |
| teen | Adolescente | 20 letras + 10 sílabas |
| adult | Adulto | 27 letras + 30 sílabas + 20 palabras |

### Sistema de Accesorios
- 6 tipos: sombreros, lentes, collares, fondos, trajes, juguetes
- 5 rarezas: común, poco común, raro, épico, legendario
- Desbloqueo por logros (letras, sílabas, palabras, nivel, racha, XP)
- Equipar/desequipar accesorios

## Endpoints API

### Mascota

```
GET    /pet/child/:childId           - Obtener mascota del niño
POST   /pet/child/:childId           - Crear mascota (si no existe)
PATCH  /pet/child/:childId/name      - Cambiar nombre
PATCH  /pet/child/:childId/variant   - Cambiar variante/color
```

### Interacciones

```
POST   /pet/child/:childId/feed      - Alimentar mascota
POST   /pet/child/:childId/play      - Jugar con mascota
POST   /pet/child/:childId/pet       - Acariciar mascota
```

### Accesorios

```
GET    /pet/child/:childId/accessories         - Lista de accesorios
GET    /pet/child/:childId/accessories/summary - Resumen de colección
POST   /pet/child/:childId/accessories/equip   - Equipar accesorio
POST   /pet/child/:childId/accessories/unequip - Desequipar accesorio
```

### Utilidades

```
GET    /pet/variants                 - Variantes de color disponibles
```

## Entidades

### Pet
```typescript
{
  id: UUID
  childProfileId: UUID (único)
  name: string (default: "Letrito")
  level: int (1-20)
  experience: int
  experienceToNextLevel: int
  evolutionStage: enum (egg, baby, child, teen, adult)
  happiness: int (0-100)
  energy: int (0-100)
  hunger: int (0-100)
  variant: string
  equippedAccessories: JSONB { tipo: accessoryId }
  unlockedAccessoryIds: string[]
  lastFedAt: timestamp
  lastPlayedAt: timestamp
  lastInteractionAt: timestamp
  totalTimesFed: int
  totalTimesPlayed: int
  interactionStreak: int
  bestInteractionStreak: int
  createdAt, updatedAt
}
```

### PetAccessory
```typescript
{
  id: UUID
  name: string
  description: string
  type: enum (hat, glasses, collar, background, outfit, toy)
  rarity: enum (common, uncommon, rare, epic, legendary)
  assetId: string
  imageUrl: string?
  unlockRequirementType: enum (free, level, letters_mastered, ...)
  unlockRequirementValue: int
  unlockMessage: string
  sortOrder: int
  isActive: boolean
  createdAt, updatedAt
}
```

## DTOs

### PetResponseDto
Respuesta completa de mascota con stats calculados, cooldowns, etc.

### InteractionResultDto
Resultado de interacciones (feed, play, pet) con:
- Cambios en stats
- XP ganado
- Si subió de nivel
- Si evolucionó
- Nuevos accesorios desbloqueados

### AccessoryResponseDto
Información de accesorio con estado de desbloqueo y progreso.

## Ejemplos de Uso

### Obtener mascota
```bash
curl -X GET "http://localhost:3001/api/pet/child/{childId}" \
  -H "Authorization: Bearer {token}"
```

### Alimentar mascota
```bash
curl -X POST "http://localhost:3001/api/pet/child/{childId}/feed" \
  -H "Authorization: Bearer {token}"
```

### Equipar accesorio
```bash
curl -X POST "http://localhost:3001/api/pet/child/{childId}/accessories/equip" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"accessoryId": "uuid-del-accesorio"}'
```

## Respuesta de Mascota

```json
{
  "id": "uuid",
  "childProfileId": "uuid",
  "name": "Letrito",
  "level": 5,
  "experience": 450,
  "experienceToNextLevel": 250,
  "levelProgress": 60,
  "evolutionStage": "child",
  "happiness": 85,
  "energy": 70,
  "hunger": 20,
  "mood": "happy",
  "variant": "orange",
  "equippedAccessories": {
    "hat": "uuid-gorro",
    "glasses": "uuid-lentes"
  },
  "needsAttention": false,
  "canFeed": true,
  "canPlay": true,
  "minutesUntilCanFeed": 0,
  "minutesUntilCanPlay": 0,
  "interactionStreak": 5,
  "lastInteractionAt": "2025-01-20T15:30:00Z",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

## Respuesta de Interacción

```json
{
  "success": true,
  "message": "¡Mmm, delicioso!",
  "experienceGained": 5,
  "happinessChange": 10,
  "energyChange": 0,
  "hungerChange": -40,
  "newHappiness": 95,
  "newEnergy": 70,
  "newHunger": 0,
  "newMood": "ecstatic",
  "leveledUp": false,
  "newLevel": null,
  "evolved": false,
  "newEvolutionStage": null,
  "evolutionMessage": null,
  "newAccessoriesUnlocked": [],
  "cooldownMinutes": 60
}
```

## Integración con Progress

El módulo Pet se integra con el módulo Progress:
- Cuando el niño responde correctamente, la mascota gana XP y felicidad
- Los logros de aprendizaje desbloquean accesorios
- La evolución depende del progreso en letras/sílabas/palabras

## Accesorios Iniciales

El sistema incluye 15 accesorios pre-configurados:
- 4 sombreros (fiesta, graduación, corona, mago)
- 3 lentes (sol, lectura, estrella)
- 3 collares (simple, letras, campeón)
- 4 fondos (bosque, biblioteca, espacio, arcoíris)
- 2 trajes (héroe, científico)

## Decaimiento de Stats

Los stats decaen con el tiempo si no hay interacción:
- Felicidad: -10 cada 8 horas
- Hambre: +15 cada 6 horas
- Energía: Se recupera +10 cada 12 horas

---

*Última actualización: 2025-01-21*
