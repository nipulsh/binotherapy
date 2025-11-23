# Game Migration Guide

## Overview

The games from `HTML/games/` need to be migrated to work with Next.js. Each game should:

1. Call `window.gameAdapter.saveGameResult()` when the game ends
2. Be placed in `public/games/[game-name]/` directory
3. Have a corresponding page in `app/games/[category]/[game-name]/page.tsx`

## Game Mapping

### Depth Perception Games
- **angry-birds** → `/games/depth-perception/angry-birds`
- **depth-matching** → `/games/depth-perception/depth-matching`

### Eye-Hand Coordination Games
- **bike-racing** → `/games/eye-hand-coordination/bike-racing`
- **hit-the-mole** → `/games/eye-hand-coordination/hit-the-mole`

### Pursuit & Follow Games
- **find-the-queen** → `/games/pursuit-follow/find-the-queen`
- **bunny-hop** → `/games/pursuit-follow/bunny-hop`

### Saccadic Movement Games
- **magic-tile** → `/games/saccadic-movement/magic-tile`
- **fruit-ninja** → `/games/saccadic-movement/fruit-ninja`

## Migration Steps

1. Copy game files from `HTML/games/[game-name]/` to `public/games/[game-name]/`
2. Update game code to use `gameAdapter` instead of `scoreManager`:

```javascript
// OLD (scoreManager)
if (window.scoreManager) {
  scoreManager.updateScore(
    'saccadic-moment',
    'magic-tile',
    gameState.score,
    level,
    gameState.difficulty,
    { accuracy, duration, metadata }
  )
}

// NEW (gameAdapter)
if (window.gameAdapter) {
  window.gameAdapter.saveGameResult({
    score: gameState.score,
    accuracy: accuracy,
    duration: gameDuration,
    level: level,
    metadata: { ... }
  })
}
```

3. Create game page in `app/games/[category]/[game-name]/page.tsx`
4. Load required scripts (Phaser, Three.js, GSAP, etc.)
5. Initialize game adapter with correct gameType and gameName

## Database Schema Update

The `game_sessions` table needs a `game_name` column:

```sql
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS game_name TEXT;
```

## Testing

After migration:
1. Play each game
2. Verify data saves to backend
3. Check analysis page shows game data
4. Verify game_name appears in recent activity

