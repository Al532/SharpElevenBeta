export type QuarterTimeSignature = {
  numerator: number;
  denominator: 4;
  timeSignature: string;
};

export type MetricGroup = {
  index: number;
  size: number;
  startBeat: number;
  endBeat: number;
};

export type MetricBeatStrength = 'strong' | 'weak';

export type DistributedMeterResult<T> = {
  beatSlots: T[];
  groups: MetricGroup[];
  groupPriority: number[];
  errors: string[];
};

const DEFAULT_NUMERATOR = 4;

function cloneValue<T>(value: T): T {
  return value && typeof value === 'object'
    ? JSON.parse(JSON.stringify(value)) as T
    : value;
}

export function parseQuarterTimeSignature(
  value: unknown,
  fallback: unknown = '4/4'
): QuarterTimeSignature {
  const raw = String(value || '').trim();
  const fallbackRaw = String(fallback || '').trim();
  const match = raw.match(/^(\d+)\/4$/);
  const fallbackMatch = fallbackRaw.match(/^(\d+)\/4$/);
  const numerator = match
    ? Number(match[1])
    : (fallbackMatch ? Number(fallbackMatch[1]) : DEFAULT_NUMERATOR);
  const normalizedNumerator = Number.isInteger(numerator) && numerator > 0
    ? numerator
    : DEFAULT_NUMERATOR;

  return {
    numerator: normalizedNumerator,
    denominator: 4,
    timeSignature: `${normalizedNumerator}/4`
  };
}

export function createMetricGroups(beatsPerBar: number): MetricGroup[] {
  const normalizedBeats = Math.max(1, Math.floor(Number(beatsPerBar) || DEFAULT_NUMERATOR));
  if (normalizedBeats === 1) {
    return [{ index: 0, size: 1, startBeat: 0, endBeat: 1 }];
  }

  const sizes: number[] = [];
  let threeCount = Math.floor(normalizedBeats / 3);
  const remainder = normalizedBeats % 3;

  if (remainder === 1 && threeCount > 0) {
    threeCount -= 1;
  }

  for (let index = 0; index < threeCount; index += 1) {
    sizes.push(3);
  }

  if (remainder === 2) {
    sizes.push(2);
  } else if (remainder === 1) {
    sizes.push(2, 2);
  }

  if (sizes.length === 0) {
    sizes.push(normalizedBeats);
  }

  let cursor = 0;
  return sizes.map((size, index) => {
    const group = {
      index,
      size,
      startBeat: cursor,
      endBeat: cursor + size
    };
    cursor += size;
    return group;
  });
}

export function getMetricGroupPriority(groups: MetricGroup[] = []): number[] {
  if (!Array.isArray(groups) || groups.length === 0) return [];

  const priority: number[] = [];
  const pushUnique = (index: number) => {
    if (index >= 0 && index < groups.length && !priority.includes(index)) {
      priority.push(index);
    }
  };

  pushUnique(0);
  pushUnique(groups.length % 2 === 0 ? groups.length / 2 : Math.floor(groups.length / 2));

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    pushUnique(index);
  }

  return priority;
}

export function getMetricBeatStrengths(beatsPerBar: number): MetricBeatStrength[] {
  return createMetricGroups(beatsPerBar).flatMap((group) => {
    if (group.size === 3) return ['strong', 'weak', 'strong'] as MetricBeatStrength[];
    if (group.size === 2) return ['strong', 'weak'] as MetricBeatStrength[];
    return Array.from({ length: group.size }, (_, index) => (index === 0 ? 'strong' : 'weak'));
  });
}

function distributeLinearByEnd<T>(items: T[], beatCount: number): T[] {
  const normalizedItems = (items || []).filter((item) => item !== null && item !== undefined);
  if (normalizedItems.length === 0) return [];
  if (normalizedItems.length > beatCount) {
    return normalizedItems.slice(0, beatCount).map(cloneValue);
  }

  const result: T[] = [];
  const firstDuration = Math.max(1, beatCount - normalizedItems.length + 1);
  normalizedItems.forEach((item, index) => {
    const duration = index === 0 ? firstDuration : 1;
    for (let beat = 0; beat < duration; beat += 1) {
      result.push(cloneValue(item));
    }
  });
  return result.slice(0, beatCount);
}

export function distributeMeterItemsToBeatSlots<T>(
  items: T[][] = [],
  timeSignature: unknown = '4/4'
): DistributedMeterResult<T> {
  const meter = parseQuarterTimeSignature(timeSignature);
  const groups = createMetricGroups(meter.numerator);
  const groupPriority = getMetricGroupPriority(groups);
  const errors: string[] = [];
  const normalizedItems = (items || [])
    .map((item) => (Array.isArray(item) ? item.filter(Boolean) : []))
    .filter((item) => item.length > 0);

  if (normalizedItems.length === 0) {
    return { beatSlots: [], groups, groupPriority, errors };
  }
  if (
    normalizedItems.length === meter.numerator
    && normalizedItems.every((item) => item.length === 1)
  ) {
    return {
      beatSlots: normalizedItems.map((item) => cloneValue(item[0])),
      groups,
      groupPriority,
      errors
    };
  }

  const assignedItems = groups.map(() => [] as T[]);
  normalizedItems.forEach((item, itemIndex) => {
    const priorityGroupIndex = groupPriority[itemIndex] ?? null;
    const groupIndex = priorityGroupIndex === null
      ? groups.length - 1 - ((itemIndex - groupPriority.length) % groups.length)
      : priorityGroupIndex;
    assignedItems[groupIndex].push(...item);
  });

  const beatSlots: T[] = [];
  let activeItem: T | null = null;

  groups.forEach((group) => {
    const groupItems = assignedItems[group.index];
    if (groupItems.length === 0) {
      if (activeItem !== null) {
        beatSlots.push(...Array.from({ length: group.size }, () => cloneValue(activeItem as T)));
      }
      return;
    }

    if (groupItems.length > group.size) {
      errors.push(`Group ${group.index + 1} has ${groupItems.length} items for ${group.size} beats.`);
    }

    const groupSlots = distributeLinearByEnd(groupItems, group.size);
    if (groupSlots.length > 0) {
      activeItem = groupSlots[groupSlots.length - 1];
    }
    beatSlots.push(...groupSlots);
  });

  return {
    beatSlots: beatSlots.slice(0, meter.numerator),
    groups,
    groupPriority,
    errors
  };
}

export function distributeChordsToMeterBeatSlots<T>(
  chords: T[] = [],
  timeSignature: unknown = '4/4'
): DistributedMeterResult<T> {
  return distributeMeterItemsToBeatSlots(
    (chords || []).map((chord) => [chord]),
    timeSignature
  );
}
