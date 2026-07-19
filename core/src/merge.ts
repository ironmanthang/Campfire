// Shared merge helpers. Used by the core sync engine. Originally
// duplicated in src/services/merge.ts and mobile/src/services/merge.ts;
// this is the single source of truth.

export interface Hunk {
  baseStart: number; // inclusive
  baseEnd: number;   // exclusive
  lines: string[];
}

function getLcs(x: string[], y: string[]): { xIndex: number; yIndex: number }[] {
  const m = x.length;
  const n = y.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (x[i - 1] === y[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const matches: { xIndex: number; yIndex: number }[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (x[i - 1] === y[j - 1]) {
      matches.unshift({ xIndex: i - 1, yIndex: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return matches;
}

export function getHunks(base: string[], modified: string[]): Hunk[] {
  const matches = getLcs(base, modified);
  const hunks: Hunk[] = [];
  
  let lastBaseIdx = 0;
  let lastModIdx = 0;
  
  for (const match of matches) {
    if (match.xIndex > lastBaseIdx || match.yIndex > lastModIdx) {
      hunks.push({
        baseStart: lastBaseIdx,
        baseEnd: match.xIndex,
        lines: modified.slice(lastModIdx, match.yIndex),
      });
    }
    lastBaseIdx = match.xIndex + 1;
    lastModIdx = match.yIndex + 1;
  }
  
  if (lastBaseIdx < base.length || lastModIdx < modified.length) {
    hunks.push({
      baseStart: lastBaseIdx,
      baseEnd: base.length,
      lines: modified.slice(lastModIdx),
    });
  }
  
  return hunks;
}

function reconstructSegment(
  base: string[],
  hunks: Hunk[],
  hunkIdx: number,
  start: number,
  end: number
): { segment: string[] } {
  const result: string[] = [];
  let curr = start;
  let idx = hunkIdx;
  
  // Output any insertion hunks at the start of the range
  while (idx < hunks.length && hunks[idx].baseStart === start && hunks[idx].baseEnd === start) {
    result.push(...hunks[idx].lines);
    idx++;
  }
  
  while (curr < end) {
    if (idx < hunks.length && hunks[idx].baseStart <= curr && hunks[idx].baseEnd > curr) {
      const hunk = hunks[idx];
      result.push(...hunk.lines);
      curr = hunk.baseEnd;
      idx++;
    } else if (idx < hunks.length && hunks[idx].baseStart < curr) {
      idx++;
    } else {
      if (idx < hunks.length && hunks[idx].baseStart < end) {
        const nextStart = hunks[idx].baseStart;
        result.push(...base.slice(curr, nextStart));
        curr = nextStart;
      } else {
        result.push(...base.slice(curr, end));
        curr = end;
      }
    }
    
    // Output any insertion hunks at the new curr position
    while (idx < hunks.length && hunks[idx].baseStart === curr && hunks[idx].baseEnd === curr) {
      result.push(...hunks[idx].lines);
      idx++;
    }
  }
  return { segment: result };
}

/**
 * Perform a 3-way merge on three strings: base (common ancestor), mine (local), theirs (remote).
 * If base is missing, it falls back to a 2-way append with clear separators.
 */
export function merge3Way(
  base: string,
  mine: string,
  theirs: string,
  mineLabel: string,
  theirsLabel: string
): { merged: string; hasConflict: boolean } {
  // If base is empty or missing, do not attempt to run the 3-way merge algorithm.
  // Fall back directly to a 2-way append to prevent merge engine crashes.
  if (!base || base.trim() === '') {
    const merged = `<<<<<<< Local (${mineLabel})
${mine}
=======
Remote (${theirsLabel})
${theirs}
>>>>>>>`;
    return {
      merged,
      hasConflict: true
    };
  }

  const baseLines = base.split('\n');
  const mineLines = mine.split('\n');
  const theirsLines = theirs.split('\n');

  const mineHunks = getHunks(baseLines, mineLines);
  const theirsHunks = getHunks(baseLines, theirsLines);

  const resultLines: string[] = [];
  let i = 0;
  let mineHunkIdx = 0;
  let theirsHunkIdx = 0;
  let hasConflict = false;

  while (i < baseLines.length || mineHunkIdx < mineHunks.length || theirsHunkIdx < theirsHunks.length) {
    const nextMineStart = mineHunkIdx < mineHunks.length ? mineHunks[mineHunkIdx].baseStart : Infinity;
    const nextTheirsStart = theirsHunkIdx < theirsHunks.length ? theirsHunks[theirsHunkIdx].baseStart : Infinity;

    if (i < nextMineStart && i < nextTheirsStart) {
      // Unmodified by both sides
      resultLines.push(baseLines[i]);
      i++;
    } else {
      // One or both sides have hunks starting here or overlapping
      const start = Math.min(nextMineStart, nextTheirsStart);
      const startMineHunkIdx = mineHunkIdx;
      const startTheirsHunkIdx = theirsHunkIdx;

      let end = -1;
      if (mineHunkIdx < mineHunks.length && mineHunks[mineHunkIdx].baseStart === start) {
        end = Math.max(end, mineHunks[mineHunkIdx].baseEnd);
      }
      if (theirsHunkIdx < theirsHunks.length && theirsHunks[theirsHunkIdx].baseStart === start) {
        end = Math.max(end, theirsHunks[theirsHunkIdx].baseEnd);
      }

      // Advance the indices past the starting hunk(s)
      if (mineHunkIdx < mineHunks.length && mineHunks[mineHunkIdx].baseStart === start) {
        mineHunkIdx++;
      }
      if (theirsHunkIdx < theirsHunks.length && theirsHunks[theirsHunkIdx].baseStart === start) {
        theirsHunkIdx++;
      }

      // Expand the union range for any overlapping hunks
      let expanded = true;
      while (expanded) {
        expanded = false;
        if (mineHunkIdx < mineHunks.length && mineHunks[mineHunkIdx].baseStart <= end) {
          end = Math.max(end, mineHunks[mineHunkIdx].baseEnd);
          mineHunkIdx++;
          expanded = true;
        }
        if (theirsHunkIdx < theirsHunks.length && theirsHunks[theirsHunkIdx].baseStart <= end) {
          end = Math.max(end, theirsHunks[theirsHunkIdx].baseEnd);
          theirsHunkIdx++;
          expanded = true;
        }
      }

      // Reconstruct the individual segments for this range
      const { segment: mineSeg } = reconstructSegment(baseLines, mineHunks, startMineHunkIdx, start, end);
      const { segment: theirsSeg } = reconstructSegment(baseLines, theirsHunks, startTheirsHunkIdx, start, end);

      const mineText = mineSeg.join('\n');
      const theirsText = theirsSeg.join('\n');

      const baseText = baseLines.slice(start, end).join('\n');

      if (mineText === theirsText) {
        if (mineText !== '') {
          resultLines.push(...mineSeg);
        }
      } else if (mineText === baseText) {
        if (theirsText !== '') {
          resultLines.push(...theirsSeg);
        }
      } else if (theirsText === baseText) {
        if (mineText !== '') {
          resultLines.push(...mineSeg);
        }
      } else {
        hasConflict = true;
        resultLines.push(`<<<<<<< Local (${mineLabel})`);
        if (mineText !== '') {
          resultLines.push(...mineSeg);
        }
        resultLines.push('=======');
        resultLines.push(`Remote (${theirsLabel})`);
        if (theirsText !== '') {
          resultLines.push(...theirsSeg);
        }
        resultLines.push('>>>>>>>');
      }

      i = end;
    }
  }

  return {
    merged: resultLines.join('\n'),
    hasConflict
  };
}

/**
 * Build a full-file conflict block in the same format merge3Way uses for
 * inline conflict hunks. Use this when local and cloud disagree on the
 * whole file and we want to surface the conflict to the user.
 */
export function buildConflictBlock(
  localContent: string,
  remoteContent: string,
  localLabel: string,
  remoteLabel: string
): string {
  return `<<<<<<< Local (${localLabel})
${localContent}
=======
Remote (${remoteLabel})
${remoteContent}
>>>>>>>`;
}

/**
 * Detect whether a file's content is a conflict block. A file is considered
 * in conflict if it contains the standard merge markers (`<<<<<<<`, `=======`,
 * `>>>>>>>`) in the right structural order. The user is expected to remove
 * these markers after resolving the conflict.
 */
export function hasConflictMarkers(content: string): boolean {
  if (!content) return false;
  // Use regex with multiline so ^ and $ work per line.
  return /<<<<<<<.*?\n[\s\S]*?=======\n[\s\S]*?>>>>>>>/m.test(content);
}
