import { describe, it, expect } from 'vitest';
import {
  parseLegacyMarkdown,
  toDocument,
  fromDocument,
  toggleItem,
  toggleItemWithChildren,
  addItem,
  addChildItem,
  addGroup,
  renameGroup,
  updateItemText,
  removeItem,
  clearCompleted,
  isRootDuplicate,
  togglePinItem,
  moveItem,
  moveChildItem,
  mergeScratchpadDocs,
  mergeScratchpadKeepBoth,
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

    it('deserializes valid JSON document with isGroup property', () => {
      const doc = {
        version: 1,
        items: [
          {
            id: 'group-1',
            text: 'Shopping',
            isChecked: false,
            isGroup: true,
            children: [
              {
                id: 'item-1',
                text: 'Milk',
                isChecked: true,
                children: [],
                createdAt: 1000,
                updatedAt: 2000,
              },
            ],
            createdAt: 1000,
            updatedAt: 2000,
          },
        ],
      };

      const result = fromDocument(JSON.stringify(doc));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('group-1');
      expect(result[0].text).toBe('Shopping');
      expect(result[0].isGroup).toBe(true);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].text).toBe('Milk');
      expect(result[0].children[0].isChecked).toBe(true);
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

    it('adds a top level item at the top of unpinned items', () => {
      const added = addItem(initialItems, 'New Item');
      expect(added).toHaveLength(3);
      expect(added[0].text).toBe('New Item');
      expect(added[0].isChecked).toBe(false);
      expect(added[0].children).toEqual([]);
      expect(added[1].id).toBe('1');
      expect(added[2].id).toBe('2');

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

    it('adds a named group node at the top of unpinned items with isGroup: true and empty children', () => {
      const withGroup = addGroup(initialItems, 'Work Tasks');
      expect(withGroup).toHaveLength(3);
      const groupNode = withGroup[0];
      expect(groupNode.text).toBe('Work Tasks');
      expect(groupNode.isGroup).toBe(true);
      expect(groupNode.isChecked).toBe(false);
      expect(groupNode.children).toEqual([]);

      // Ignores empty name
      expect(addGroup(initialItems, '   ')).toHaveLength(2);
    });

    it('inserts new items below pinned items but above existing unpinned items', () => {
      const pinnedAndUnpinned: ScratchpadItem[] = [
        { id: 'p1', text: 'Pinned Note', isPinned: true, isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
        { id: 'u1', text: 'Old Unpinned Note', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
      ];

      const withNewItem = addItem(pinnedAndUnpinned, 'New Note');
      expect(withNewItem.map((i) => i.text)).toEqual(['Pinned Note', 'New Note', 'Old Unpinned Note']);

      const withNewGroup = addGroup(pinnedAndUnpinned, 'New Group');
      expect(withNewGroup.map((i) => i.text)).toEqual(['Pinned Note', 'New Group', 'Old Unpinned Note']);
    });

    it('updates text of an existing group or item via updateItemText and renameGroup', () => {
      const withGroup = addGroup(initialItems, 'Old Name');
      const groupId = withGroup[0].id;
      const renamed = renameGroup(withGroup, groupId, 'New Name');
      expect(renamed[0].text).toBe('New Name');

      // Update top-level task
      const updatedTask = updateItemText(withGroup, '1', 'Updated Item 1');
      expect(updatedTask[1].text).toBe('Updated Item 1');

      // Update nested subtask
      const updatedChild = updateItemText(withGroup, '1-1', 'Updated Subitem 1-1');
      expect(updatedChild[1].children[0].text).toBe('Updated Subitem 1-1');

      // Ignores empty text
      const ignored = updateItemText(withGroup, '1', '   ');
      expect(ignored[1].text).toBe('Item 1');
    });

    it('toggles all children in a group when toggleItemWithChildren is called on the group', () => {
      const groupWithKids: ScratchpadItem[] = [
        {
          id: 'group-1',
          text: 'Groceries',
          isChecked: false,
          isGroup: true,
          children: [
            { id: 'c-1', text: 'Apples', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
            { id: 'c-2', text: 'Bread', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
            { id: 'c-3', text: 'Milk', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
          ],
          createdAt: 1,
          updatedAt: 1,
        },
      ];

      const toggledAll = toggleItemWithChildren(groupWithKids, 'group-1', true);
      expect(toggledAll[0].children[0].isChecked).toBe(true);
      expect(toggledAll[0].children[1].isChecked).toBe(true);
      expect(toggledAll[0].children[2].isChecked).toBe(true);
    });

    it('preserves group container during clearCompleted while removing completed children', () => {
      const groupWithMixedKids: ScratchpadItem[] = [
        {
          id: 'group-1',
          text: 'Project Tasks',
          isChecked: false,
          isGroup: true,
          children: [
            { id: 'c-1', text: 'Done Task 1', isChecked: true, children: [], createdAt: 1, updatedAt: 1 },
            { id: 'c-2', text: 'Done Task 2', isChecked: true, children: [], createdAt: 1, updatedAt: 1 },
            { id: 'c-3', text: 'Pending Task', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
          ],
          createdAt: 1,
          updatedAt: 1,
        },
      ];

      const cleared = clearCompleted(groupWithMixedKids);
      expect(cleared).toHaveLength(1);
      expect(cleared[0].id).toBe('group-1');
      expect(cleared[0].isGroup).toBe(true);
      expect(cleared[0].children).toHaveLength(1);
      expect(cleared[0].children[0].id).toBe('c-3');
    });
  });

  describe('Root-Level Uniqueness Validation', () => {
    const rootItems: ScratchpadItem[] = [
      {
        id: 'task-1',
        text: 'Buy Groceries',
        isChecked: false,
        children: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'task-2',
        text: 'Read Book',
        isChecked: true,
        children: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'group-1',
        text: 'Work',
        isChecked: false,
        isGroup: true,
        children: [
          {
            id: 'subtask-1',
            text: 'Send Email',
            isChecked: false,
            children: [],
            createdAt: 1000,
            updatedAt: 1000,
          },
        ],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    it('identifies case-insensitive and trimmed duplicates at root level', () => {
      expect(isRootDuplicate(rootItems, 'buy groceries')).toBe(true);
      expect(isRootDuplicate(rootItems, '  BUY GROCERIES  ')).toBe(true);
      expect(isRootDuplicate(rootItems, 'work')).toBe(true);
      expect(isRootDuplicate(rootItems, '  Work  ')).toBe(true);
      expect(isRootDuplicate(rootItems, 'read book')).toBe(true); // Checked items count toward duplicates
      expect(isRootDuplicate(rootItems, 'New Unique Item')).toBe(false);
    });

    it('excludes specified id when checking duplicates during renames', () => {
      expect(isRootDuplicate(rootItems, 'Buy Groceries', 'task-1')).toBe(false);
      expect(isRootDuplicate(rootItems, 'Work', 'task-1')).toBe(true);
    });

    it('guards addItem against duplicate root items', () => {
      const result = addItem(rootItems, 'buy groceries');
      expect(result).toHaveLength(3); // Unchanged

      const unique = addItem(rootItems, 'Call Mom');
      expect(unique).toHaveLength(4);
      expect(unique[0].text).toBe('Call Mom');
    });

    it('guards addGroup against duplicate root items', () => {
      const result = addGroup(rootItems, 'WORK');
      expect(result).toHaveLength(3); // Unchanged

      const unique = addGroup(rootItems, 'Personal');
      expect(unique).toHaveLength(4);
      expect(unique[0].text).toBe('Personal');
    });

    it('guards updateItemText against renaming root item to an existing sibling name', () => {
      const duplicateRename = updateItemText(rootItems, 'task-1', 'Work');
      expect(duplicateRename[0].text).toBe('Buy Groceries'); // Rejected

      const selfRename = updateItemText(rootItems, 'task-1', 'Buy Groceries');
      expect(selfRename[0].text).toBe('Buy Groceries'); // Allowed

      const validRename = updateItemText(rootItems, 'task-1', 'Buy Fresh Groceries');
      expect(validRename[0].text).toBe('Buy Fresh Fresh'.replace('Fresh Fresh', 'Fresh Groceries'));
    });

    it('does not restrict subtasks from having duplicate names across different groups or matching root items', () => {
      // Subtasks can match root items
      const withSubtask = addChildItem(rootItems, 'group-1', 'Buy Groceries');
      expect(withSubtask[2].children).toHaveLength(2);
      expect(withSubtask[2].children[1].text).toBe('Buy Groceries');

      // Updating a subtask to match another item is permitted
      const updatedSubtask = updateItemText(withSubtask, 'subtask-1', 'Buy Groceries');
      expect(updatedSubtask[2].children[0].text).toBe('Buy Groceries');
    });
  });

  describe('Root-Level Pinning', () => {
    const items: ScratchpadItem[] = [
      {
        id: '1',
        text: 'Item 1',
        isChecked: false,
        children: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: '2',
        text: 'Group 2',
        isChecked: false,
        isGroup: true,
        isPinned: true,
        children: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    it('toggles isPinned flag on top-level item and updates timestamp', () => {
      const pinned = togglePinItem(items, '1');
      expect(pinned[0].isPinned).toBe(true);
      expect(pinned[0].updatedAt).toBeGreaterThanOrEqual(1000);

      const unpinned = togglePinItem(pinned, '2');
      expect(unpinned[1].isPinned).toBe(false);
    });

    it('preserves isPinned in serialization and sanitization', () => {
      const doc = toDocument(items);
      const json = JSON.stringify(doc);
      const restored = fromDocument(json);

      expect(restored[0].isPinned).toBe(false);
      expect(restored[1].isPinned).toBe(true);
    });
  });

  describe('Partition-Aware Reordering (moveItem & moveChildItem)', () => {
    const mixedItems: ScratchpadItem[] = [
      { id: 'p1', text: 'Pinned 1', isChecked: false, isPinned: true, children: [], createdAt: 1, updatedAt: 1 },
      { id: 'p2', text: 'Pinned 2', isChecked: false, isPinned: true, children: [], createdAt: 1, updatedAt: 1 },
      { id: 'u1', text: 'Unpinned 1', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
      {
        id: 'u2',
        text: 'Unpinned 2 Group',
        isChecked: false,
        isGroup: true,
        children: [
          { id: 'c1', text: 'Child 1', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
          { id: 'c2', text: 'Child 2', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
          { id: 'c3', text: 'Child 3', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
        ],
        createdAt: 1,
        updatedAt: 1,
      },
      { id: 'u3', text: 'Unpinned 3', isChecked: false, children: [], createdAt: 1, updatedAt: 1 },
    ];

    it('moves unpinned items up and down within unpinned partition', () => {
      // Move u2 up among unpinned items
      const movedUp = moveItem(mixedItems, 'u2', 'up');
      expect(movedUp.map((i) => i.id)).toEqual(['p1', 'p2', 'u2', 'u1', 'u3']);

      // Move u1 down among unpinned items
      const movedDown = moveItem(mixedItems, 'u1', 'down');
      expect(movedDown.map((i) => i.id)).toEqual(['p1', 'p2', 'u2', 'u1', 'u3']);
    });

    it('moves pinned items up and down within pinned partition', () => {
      // Move p2 up
      const movedUp = moveItem(mixedItems, 'p2', 'up');
      expect(movedUp.map((i) => i.id)).toEqual(['p2', 'p1', 'u1', 'u2', 'u3']);

      // Move p1 down
      const movedDown = moveItem(mixedItems, 'p1', 'down');
      expect(movedDown.map((i) => i.id)).toEqual(['p2', 'p1', 'u1', 'u2', 'u3']);
    });

    it('handles partition boundary conditions gracefully without crossing partitions', () => {
      // First pinned item cannot move up
      const p1Up = moveItem(mixedItems, 'p1', 'up');
      expect(p1Up.map((i) => i.id)).toEqual(['p1', 'p2', 'u1', 'u2', 'u3']);

      // Last pinned item cannot move down into unpinned
      const p2Down = moveItem(mixedItems, 'p2', 'down');
      expect(p2Down.map((i) => i.id)).toEqual(['p1', 'p2', 'u1', 'u2', 'u3']);

      // First unpinned item cannot move up into pinned
      const u1Up = moveItem(mixedItems, 'u1', 'up');
      expect(u1Up.map((i) => i.id)).toEqual(['p1', 'p2', 'u1', 'u2', 'u3']);

      // Last unpinned item cannot move down
      const u3Down = moveItem(mixedItems, 'u3', 'down');
      expect(u3Down.map((i) => i.id)).toEqual(['p1', 'p2', 'u1', 'u2', 'u3']);
    });

    it('reorders child subtasks within parent group using moveChildItem', () => {
      // Move c2 up
      const movedChildUp = moveChildItem(mixedItems, 'u2', 'c2', 'up');
      const childrenAfterUp = movedChildUp.find((i) => i.id === 'u2')!.children;
      expect(childrenAfterUp.map((c) => c.id)).toEqual(['c2', 'c1', 'c3']);

      // Move c2 down
      const movedChildDown = moveChildItem(mixedItems, 'u2', 'c2', 'down');
      const childrenAfterDown = movedChildDown.find((i) => i.id === 'u2')!.children;
      expect(childrenAfterDown.map((c) => c.id)).toEqual(['c1', 'c3', 'c2']);

      // Boundary: first child cannot move up
      const c1Up = moveChildItem(mixedItems, 'u2', 'c1', 'up');
      expect(c1Up.find((i) => i.id === 'u2')!.children.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);

      // Boundary: last child cannot move down
      const c3Down = moveChildItem(mixedItems, 'u2', 'c3', 'down');
      expect(c3Down.find((i) => i.id === 'u2')!.children.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    });
  });

  describe('3-Way Scratchpad Document Merge (mergeScratchpadDocs & mergeScratchpadKeepBoth)', () => {
    it('merges when only local modified an item', () => {
      const base = toDocument([
        { id: '1', text: 'Base task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      const local = toDocument([
        { id: '1', text: 'Local updated task', isChecked: true, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);
      const remote = toDocument([
        { id: '1', text: 'Base task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      expect(result.hasConflict).toBe(false);

      const items = fromDocument(result.merged);
      expect(items).toHaveLength(1);
      expect(items[0].text).toBe('Local updated task');
      expect(items[0].isChecked).toBe(true);
    });

    it('merges when only remote modified an item', () => {
      const base = toDocument([
        { id: '1', text: 'Base task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      const local = toDocument([
        { id: '1', text: 'Base task', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      const remote = toDocument([
        { id: '1', text: 'Remote updated task', isChecked: true, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      expect(result.hasConflict).toBe(false);

      const items = fromDocument(result.merged);
      expect(items).toHaveLength(1);
      expect(items[0].text).toBe('Remote updated task');
      expect(items[0].isChecked).toBe(true);
    });

    it('merges independent additions from both local and remote', () => {
      const base = toDocument([]);
      const local = toDocument([
        { id: 'loc-1', text: 'Local new note', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      const remote = toDocument([
        { id: 'rem-1', text: 'Remote new note', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      expect(result.hasConflict).toBe(false);

      const items = fromDocument(result.merged);
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.id)).toEqual(['loc-1', 'rem-1']);
    });

    it('honors deletions when one side deleted and the other side did not edit', () => {
      const base = toDocument([
        { id: '1', text: 'Task 1', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
        { id: '2', text: 'Task 2', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      // Local deleted '1'
      const local = toDocument([
        { id: '2', text: 'Task 2', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      // Remote kept both untouched
      const remote = toDocument([
        { id: '1', text: 'Task 1', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
        { id: '2', text: 'Task 2', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      expect(result.hasConflict).toBe(false);

      const items = fromDocument(result.merged);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('2');
    });

    it('preserves remote edit if local deleted the item concurrently', () => {
      const base = toDocument([
        { id: '1', text: 'Task 1', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      // Local deleted '1'
      const local = toDocument([]);
      // Remote edited '1'
      const remote = toDocument([
        { id: '1', text: 'Task 1 (critical edit)', isChecked: true, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      const items = fromDocument(result.merged);
      expect(items).toHaveLength(1);
      expect(items[0].text).toBe('Task 1 (critical edit)');
    });

    it('merges hierarchical children inside groups concurrently', () => {
      const base = toDocument([
        {
          id: 'group-1',
          text: 'Project Group',
          isChecked: false,
          isGroup: true,
          children: [
            { id: 'c-base', text: 'Initial subtask', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
          ],
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      // Local added subtask-local
      const local = toDocument([
        {
          id: 'group-1',
          text: 'Project Group',
          isChecked: false,
          isGroup: true,
          children: [
            { id: 'c-base', text: 'Initial subtask', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
            { id: 'c-loc', text: 'Subtask from Desktop', isChecked: false, children: [], createdAt: 2000, updatedAt: 2000 },
          ],
          createdAt: 1000,
          updatedAt: 2000,
        },
      ]);
      // Remote added subtask-remote
      const remote = toDocument([
        {
          id: 'group-1',
          text: 'Project Group',
          isChecked: false,
          isGroup: true,
          children: [
            { id: 'c-base', text: 'Initial subtask', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
            { id: 'c-rem', text: 'Subtask from Mobile', isChecked: false, children: [], createdAt: 2000, updatedAt: 2000 },
          ],
          createdAt: 1000,
          updatedAt: 2000,
        },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      expect(result.hasConflict).toBe(false);

      const items = fromDocument(result.merged);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('group-1');
      expect(items[0].children).toHaveLength(3);
      expect(items[0].children.map((c) => c.id)).toEqual(['c-base', 'c-loc', 'c-rem']);
    });

    it('resolves conflicting edits on the same item by choosing newer updatedAt', () => {
      const base = toDocument([
        { id: '1', text: 'Original text', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      const local = toDocument([
        { id: '1', text: 'Older local edit', isChecked: false, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);
      const remote = toDocument([
        { id: '1', text: 'Newer remote edit', isChecked: true, children: [], createdAt: 1000, updatedAt: 3000 },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      expect(result.hasConflict).toBe(false);

      const items = fromDocument(result.merged);
      expect(items[0].text).toBe('Newer remote edit');
      expect(items[0].isChecked).toBe(true);
    });

    it('detects ambiguous conflict if both sides edit same item with identical timestamp and different text', () => {
      const base = toDocument([
        { id: '1', text: 'Original text', isChecked: false, children: [], createdAt: 1000, updatedAt: 1000 },
      ]);
      const local = toDocument([
        { id: '1', text: 'Local edit version', isChecked: false, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);
      const remote = toDocument([
        { id: '1', text: 'Remote edit version', isChecked: false, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);

      const result = mergeScratchpadDocs(JSON.stringify(base), JSON.stringify(local), JSON.stringify(remote));
      expect(result.hasConflict).toBe(true);
    });

    it('merges both sides cleanly using mergeScratchpadKeepBoth', () => {
      const local = toDocument([
        { id: '1', text: 'Local version', isChecked: false, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);
      const remote = toDocument([
        { id: '1', text: 'Remote version', isChecked: false, children: [], createdAt: 1000, updatedAt: 2000 },
      ]);

      const mergedJson = mergeScratchpadKeepBoth(JSON.stringify(local), JSON.stringify(remote));
      const items = fromDocument(mergedJson);

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe('1');
      expect(items[0].text).toBe('Local version');
      expect(items[1].id).not.toBe('1'); // New ID generated for remote copy
      expect(items[1].text).toBe('Remote version');
    });
  });
});
