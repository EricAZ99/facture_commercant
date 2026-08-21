import type { ID, ProductCategory } from '@/types'

/** Option de categorie aplatie pour un `<select>`, avec sa profondeur (indentation) dans l'arbre. */
export interface CategoryOption {
  id: ID
  label: string
  depth: number
}

/**
 * Aplati l'arborescence de categories en options triees (parents avant
 * enfants, freres tries alphabetiquement), pour peupler un `<select>` avec
 * une indentation visuelle representant la hierarchie.
 */
export function buildCategoryOptions(categories: ProductCategory[]): CategoryOption[] {
  const byParent = new Map<ID | undefined, ProductCategory[]>()
  for (const category of categories) {
    const key = category.parentId
    const siblings = byParent.get(key) ?? []
    siblings.push(category)
    byParent.set(key, siblings)
  }
  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  const options: CategoryOption[] = []
  function visit(parentId: ID | undefined, depth: number): void {
    for (const category of byParent.get(parentId) ?? []) {
      options.push({ id: category.id, label: category.name, depth })
      visit(category.id, depth + 1)
    }
  }
  visit(undefined, 0)
  return options
}
