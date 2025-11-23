/**
 * Migration Script for Games
 * Copies game files from HTML/games to public/games and adapts them for Next.js
 */

const fs = require('fs')
const path = require('path')

const gameMappings = {
  'magic-tile': {
    category: 'saccadic-movement',
    gameType: 'saccadic-movement',
    gameName: 'magic-tile',
  },
  'fruit-ninja': {
    category: 'saccadic-movement',
    gameType: 'saccadic-movement',
    gameName: 'fruit-ninja',
  },
  'depth-matching': {
    category: 'depth-perception',
    gameType: 'depth-perception',
    gameName: 'depth-matching',
  },
  'angry-birds': {
    category: 'depth-perception',
    gameType: 'depth-perception',
    gameName: 'angry-birds',
  },
  'hit-the-mole': {
    category: 'eye-hand-coordination',
    gameType: 'eye-hand-coordination',
    gameName: 'hit-the-mole',
  },
  'bike-racing': {
    category: 'eye-hand-coordination',
    gameType: 'eye-hand-coordination',
    gameName: 'bike-racing',
  },
  'find-the-queen': {
    category: 'pursuit-follow',
    gameType: 'pursuit-follow',
    gameName: 'find-the-queen',
  },
  'bunny-hop': {
    category: 'pursuit-follow',
    gameType: 'pursuit-follow',
    gameName: 'bunny-hop',
  },
}

function adaptGameCode(content, gameConfig) {
  // Replace scoreManager calls with gameAdapter calls
  let adapted = content

  // Pattern 1: scoreManager.updateScore(...)
  adapted = adapted.replace(
    /scoreManager\.updateScore\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*(?:,\s*({[^}]*}))?\s*\)/g,
    (match, defectType, gameName, score, level, difficulty, additionalData) => {
      return `window.gameAdapter?.saveGameResult({
        score: ${score},
        level: ${level},
        metadata: {
          difficulty: ${difficulty},
          ...(${additionalData || '{}'})
        }
      })`
    }
  )

  // Pattern 2: window.scoreManager.updateScore(...)
  adapted = adapted.replace(
    /window\.scoreManager\.updateScore/g,
    'window.gameAdapter?.saveGameResult'
  )

  // Add game adapter initialization at the top
  if (!adapted.includes('gameAdapter')) {
    adapted = `// Game Adapter initialized by Next.js page\n${adapted}`
  }

  return adapted
}

function copyGameFiles() {
  const sourceDir = path.join(__dirname, '../../HTML/games')
  const targetDir = path.join(__dirname, '../public/games')

  Object.keys(gameMappings).forEach((gameName) => {
    const sourcePath = path.join(sourceDir, gameName)
    const targetPath = path.join(targetDir, gameName)

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Game not found: ${gameName}`)
      return
    }

    // Create target directory
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true })
    }

    // Copy all files
    const files = fs.readdirSync(sourcePath)
    files.forEach((file) => {
      if (file.endsWith('.js')) {
        const sourceFile = path.join(sourcePath, file)
        const targetFile = path.join(targetPath, file)
        let content = fs.readFileSync(sourceFile, 'utf8')
        
        // Adapt the code
        content = adaptGameCode(content, gameMappings[gameName])
        
        fs.writeFileSync(targetFile, content)
        console.log(`✓ Copied and adapted: ${gameName}/${file}`)
      } else if (file.endsWith('.css') || file.endsWith('.html')) {
        // Copy CSS and HTML as-is
        const sourceFile = path.join(sourcePath, file)
        const targetFile = path.join(targetPath, file)
        fs.copyFileSync(sourceFile, targetFile)
        console.log(`✓ Copied: ${gameName}/${file}`)
      }
    })
  })

  console.log('\n✅ Game files migrated successfully!')
}

// Run migration
if (require.main === module) {
  copyGameFiles()
}

module.exports = { copyGameFiles, adaptGameCode }

