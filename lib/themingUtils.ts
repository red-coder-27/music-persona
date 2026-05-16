import type { ArchetypeId } from '@/types/personality';

export function getArchetypeThemeClass(archetypeId: ArchetypeId) {
  return `theme-${archetypeId}`;
}

export function getShareCardThemeClass(archetypeId: ArchetypeId) {
  return `theme-${archetypeId}-card`;
}
