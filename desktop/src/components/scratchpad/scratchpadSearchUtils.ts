import { ScratchpadItem } from "@campfire/core";

export function filterItemTree(
  item: ScratchpadItem,
  queryLower: string,
  expandedIds: Set<string>
): { matched: boolean; filteredItem: ScratchpadItem } {
  const isSelfMatch = item.text.toLowerCase().includes(queryLower);
  let hasChildMatch = false;
  const filteredChildren: ScratchpadItem[] = [];

  for (const child of item.children) {
    const childRes = filterItemTree(child, queryLower, expandedIds);
    if (childRes.matched) {
      hasChildMatch = true;
      filteredChildren.push(childRes.filteredItem);
    }
  }

  if (hasChildMatch) {
    expandedIds.add(item.id);
  }

  if (isSelfMatch || hasChildMatch) {
    return {
      matched: true,
      filteredItem: {
        ...item,
        children: hasChildMatch ? filteredChildren : item.children,
      },
    };
  }

  return { matched: false, filteredItem: item };
}

export function countMatches(items: ScratchpadItem[]): number {
  let count = 0;
  for (const item of items) {
    count += 1;
    if (item.children && item.children.length > 0) {
      count += countMatches(item.children);
    }
  }
  return count;
}
