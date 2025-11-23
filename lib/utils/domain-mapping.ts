/**
 * Domain Mapping Utility
 * 
 * Maps game types to their corresponding domain performance tables
 * and provides helper functions for domain-level analysis.
 */

import type { GameType, DomainKey } from '@/lib/types/game.types'

/**
 * The 4 cognitive/visual defect domains
 */
export const DOMAINS: DomainKey[] = [
  'depth-perception',
  'eye-hand-coordination',
  'pursuit-follow',
  'saccadic-movement',
]

/**
 * Domain metadata with human-readable names and descriptions
 */
export const DOMAIN_INFO = {
  'depth-perception': {
    name: 'Depth Perception',
    description: 'Ability to judge distances and spatial relationships',
    icon: '📦',
    color: '#3b82f6', // blue
  },
  'eye-hand-coordination': {
    name: 'Eye-Hand Coordination',
    description: 'Hand-eye coordination and precision targeting',
    icon: '🎮',
    color: '#10b981', // green
  },
  'pursuit-follow': {
    name: 'Pursuit & Follow',
    description: 'Ability to track moving objects smoothly',
    icon: '🎯',
    color: '#f59e0b', // amber
  },
  'saccadic-movement': {
    name: 'Saccadic Movement',
    description: 'Rapid eye movements between fixed points',
    icon: '⚡',
    color: '#8b5cf6', // purple
  },
} as const

/**
 * Maps a game type to its domain table name
 */
export function getDomainTableName(domain: DomainKey): string {
  const tableNames: Record<DomainKey, string> = {
    'depth-perception': 'depth_perception_performance',
    'eye-hand-coordination': 'eye_hand_coordination_performance',
    'pursuit-follow': 'pursuit_follow_performance',
    'saccadic-movement': 'saccadic_movement_performance',
  }
  return tableNames[domain]
}

/**
 * Maps a game type to its domain key
 * (In this case, they're the same, but this provides abstraction)
 */
export function getGameDomain(gameType: GameType): DomainKey {
  return gameType as DomainKey
}

/**
 * Gets all game types for a specific domain
 */
export function getGamesForDomain(domain: DomainKey): GameType[] {
  // Since game_type directly maps to domain, return the domain itself
  return [domain]
}

/**
 * Validates if a string is a valid domain key
 */
export function isValidDomain(value: string): value is DomainKey {
  return DOMAINS.includes(value as DomainKey)
}

/**
 * Gets domain display name
 */
export function getDomainName(domain: DomainKey): string {
  return DOMAIN_INFO[domain].name
}

/**
 * Gets domain description
 */
export function getDomainDescription(domain: DomainKey): string {
  return DOMAIN_INFO[domain].description
}

/**
 * Gets domain icon
 */
export function getDomainIcon(domain: DomainKey): string {
  return DOMAIN_INFO[domain].icon
}

/**
 * Gets domain color
 */
export function getDomainColor(domain: DomainKey): string {
  return DOMAIN_INFO[domain].color
}

