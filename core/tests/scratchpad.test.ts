import { describe, it, expect } from 'vitest';
import {
  parseLegacyMarkdown,
  toDocument,
  fromDocument,
  toggleItem,
  toggleItemWithChildren,
  addItem,
  addChildItem,
  removeItem,
  clearCompleted,
  type ScratchpadItem,
} from '../src';

describe('Scratchpad Core Logic', () => {
  describe('parseLegacyMarkdown', () => {
    it('returns empty array for empty or whitespace string', () => {
      expect(parseLegacyMarkdown('')).toEqual([]);
      expect(parseLegacyMarkdown('   \n  \n  ')).toEqual([]);
    });

    it('parses standard flat markdown tasks correctly', () => {
      const md = `- [ ] Task 1\n- [x] Task 2\n* [X] Task 3\n- [ ] Task 4`;
      const items = parseLegacyMarkdown(md);

      expect(items).toHaveLength(4);
      expect(items[0].text).toBe('Task 1');
      expect(items[0].isChecked).toBe(false);
      expect(items[1].text).toBe('Task 2');
      expect(items[1].isChecked).toBe(true);
      expect(items[2].text).toBe('Task 3');
      expect(items[2].isChecked).toBe(true);
      expect(items[3].text).toBe('Task 4');
      expect(items[3].isChecked).toBe(false);
      expect(items.every((i) => typeof i.id === 'string' && i.id.length > 0)).toBe(true);
    });

    it('parses indented tasks as children of the previous item', () => {
      const md = `- [ ] Parent Task\n  - [ ] Subtask 1\n  - [x] Subtask 2\n- [ ] Another Parent`;
      const items = parseLegacyMarkdown(md);

      expect(items).toHaveLength(2);
      expect(items[0].text).toBe('Parent Task');
      expect(items[0].children).toHaveLength(2);
      expect(items[0].children[0].text).toBe('Subtask 1');
      expect(items[0].children[0].isChecked).toBe(false);
      expect(items[0].children[1].text).toBe('Subtask 2');
      expect(items[0].children[1].isChecked).toBe(true);

      expect(items[1].text).toBe('Another Parent');
      expect(items[1].children).toHaveLength(0);
    });

    it('handles non-task plain text lines', () => {
      const md = `General notes line\n- [ ] Real task`;
      const items = parseLegacyMarkdown(md);

      expect(items).toHaveLength(2);
      expect(items[0].text).toBe('General notes line');
      expect(items[0].isChecked).toBe(false);
      expect(items[1].text).toBe('Real task');
      expect(items[1].isChecked).toBe(false);
    });
  });

  describe('toDocument and fromDocument serialization', () => {
    it('serializes items to versioned document', () => {
      const items: ScratchpadItem[] = [
        {
          id: 'item-1',
          text: 'Test task',
          isChecked: false,
          children: [],
          createdAt: 1000,
          updatedAt: 1000,
        },
      ];

      const doc = toDocument(items);
      expect(doc).toEqual({
        version: 1,
        items,
      });
    });

    it('deserializes valid JSON document', () => {
      const doc = {
        version: 1,
        items: [
          {
            id: 'item-1',
            text: 'Test task',
            isChecked: true,
            children: [],
            createdAt: 1000,
            updatedAt: 2000,
          },
        ],
      };

      const result = fromDocument(JSON.stringify(doc));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item-1');
      expect(result[0].text).toBe('Test task');
      expect(result[0].isChecked).toBe(true);
    });

    it('migrates legacy flat-markdown string if JSON parsing fails', () => {
      const legacyMd = `- [ ] Legacy item 1\n- [x] Legacy item 2`;
      const result = fromDocument(legacyMd);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Legacy item 1');
      expect(result[0].isChecked).toBe(false);
      expect(result[1].text).toBe('Legacy item 2');
      expect(result[1].isChecked).toBe(true);
    });

    it('returns empty array for empty string', () => {
      expect(fromDocument('')).toEqual([]);
      expect(fromDocument('   ')).toEqual([]);
    });
  });

  describe('Tree manipulation operations', () => {
    const initialItems: ScratchpadItem[] = [
      {
        id: '1',
        text: 'Item 1',
        isChecked: false,
        children: [
          {
            id: '1-1',
            text: 'Subitem 1-1',
            isChecked: false,
            children: [],
            createdAt: 1000,
            updatedAt: 1000,
          },
        ],
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: '2',
        text: 'Item 2',
        isChecked: true,
        children: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    it('toggles single item by id', () => {
      const toggledTop = toggleItem(initialItems, '1');
      expect(toggledTop[0].isChecked).toBe(true);
      expect(toggledTop[0].children[0].isChecked).toBe(false);

      const toggledChild = toggleItem(initialItems, '1-1');
      expect(toggledChild[0].isChecked).toBe(false);
      expect(toggledChild[0].children[0].isChecked).toBe(true);
    });

    it('toggles item and all nested children recursively', () => {
      const toggledWithKids = toggleItemWithChildren(initialItems, '1', true);
      expect(toggledWithKids[0].isChecked).toBe(true);
      expect(toggledWithKids[0].children[0].isChecked).toBe(true);

      const toggledOff = toggleItemWithChildren(toggledWithKids, '1', false);
      expect(toggledOff[0].isChecked).toBe(false);
      expect(toggledOff[0].children[0].isChecked).toBe(false);
    });

    it('adds a top level item', () => {
      const added = addItem(initialItems, 'New Item');
      expect(added).toHaveLength(3);
      expect(added[2].text).toBe('New Item');
      expect(added[2].isChecked).toBe(false);
      expect(added[2].children).toEqual([]);

      // Ignores empty string
      expect(addItem(initialItems, '   ')).toHaveLength(2);
    });

    it('adds a child item under a specific parent', () => {
      const withChild = addChildItem(initialItems, '2', 'Child of 2');
      expect(withChild[1].children).toHaveLength(1);
      expect(withChild[1].children[0].text).toBe('Child of 2');
      expect(withChild[1].children[0].isChecked).toBe(false);
    });

    it('removes item by id (top-level or nested)', () => {
      const withoutTop = removeItem(initialItems, '2');
      expect(withoutTop).toHaveLength(1);
      expect(withoutTop[0].id).toBe('1');

      const withoutChild = removeItem(initialItems, '1-1');
      expect(withoutChild[0].children).toHaveLength(0);
    });

    it('clears completed items at any nesting level', () => {
      const complex: ScratchpadItem[] = [
        {
          id: '1',
          text: 'Unchecked parent',
          isChecked: false,
          children: [
            {
              id: '1-1',
              text: 'Checked child',
              isChecked: true,
              children: [],
              createdAt: 1000,
              updatedAt: 1000,
            },
            {
              id: '1-2',
              text: 'Unchecked child',
              isChecked: false,
              children: [],
              createdAt: 1000,
              updatedAt: 1000,
            },
          ],
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: '2',
          text: 'Checked parent',
          isChecked: true,
          children: [],
          createdAt: 1000,
          updatedAt: 1000,
        },
      ];

      const cleared = clearCompleted(complex);
      expect(cleared).toHaveLength(1);
      expect(cleared[0].id).toBe('1');
      expect(cleared[0].children).toHaveLength(1);
      expect(cleared[0].children[0].id).toBe('1-2');
    });
  });
});
