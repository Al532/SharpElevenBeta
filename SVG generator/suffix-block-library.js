import {
  layoutSvgChordSuffix,
  renderSvgChordSuffix
} from './svg-chord-layout.js';

export const FROZEN_SUFFIX_BLOCK_IDS = Object.freeze([
  'dominant-7',
  'minor',
  'minor-7',
  'major-7',
  'dominant-7-flat-9',
  'dominant-11',
  'dominant-13',
  'minor-7-flat-5',
  'sus',
  'dominant-7-sus',
  'dim',
  'dim-7',
  'minor-6',
  'minor-9',
  'dominant-7-alt',
  'dominant-7-flat-9-flat-13-stack'
]);

export const PRIORITY_SUFFIX_BLOCKS = Object.freeze([
  {
    id: 'dominant-7',
    label: '7',
    suffix: '7',
    irealQuality: '7',
    irealCount: 23453,
    group: 'dominant-family',
    inheritance: { role: 'base' }
  },
  {
    id: 'minor',
    label: 'm',
    suffix: 'm',
    irealQuality: '-',
    irealCount: 4828,
    group: 'minor-family',
    inheritance: { role: 'base' }
  },
  {
    id: 'minor-7',
    label: 'm7',
    suffix: 'm7',
    irealQuality: '-7',
    irealCount: 20319,
    group: 'minor-family',
    inheritance: { from: 'minor', adds: ['7'] }
  },
  {
    id: 'major-7',
    label: 'maj7',
    suffix: 'maj7',
    irealQuality: '^7',
    irealCount: 10111,
    group: 'major-family',
    inheritance: { role: 'base' }
  },
  {
    id: 'dominant-7-flat-9',
    label: '7(b9)',
    suffix: '7(b9)',
    irealQuality: '7b9',
    irealCount: 2919,
    group: 'dominant-family',
    inheritance: { from: 'dominant-7', adds: ['b9'] }
  },
  {
    id: 'dominant-11',
    label: '11',
    suffix: '11',
    irealQuality: '11',
    irealCount: 55,
    group: 'dominant-family',
    inheritance: { from: 'dominant-7', adds: ['11'] }
  },
  {
    id: 'dominant-13',
    label: '13',
    suffix: '13',
    irealQuality: '13',
    irealCount: 915,
    group: 'dominant-family',
    inheritance: { from: 'dominant-7', adds: ['13'] }
  },
  {
    id: 'minor-7-flat-5',
    label: 'm7(b5)',
    suffix: 'm7(b5)',
    irealQuality: 'h7',
    irealCount: 2680,
    group: 'minor-family',
    inheritance: { from: 'minor-7', adds: ['b5'] }
  },
  {
    id: 'sus',
    label: 'sus',
    suffix: 'sus',
    irealQuality: 'sus',
    irealCount: 656,
    group: 'sus-family',
    inheritance: { role: 'base' }
  },
  {
    id: 'sus-4',
    label: 'sus4',
    suffix: 'sus4',
    irealQuality: 'sus4',
    irealCount: 0,
    group: 'sus-family',
    inheritance: { from: 'sus', adds: ['4'] }
  },
  {
    id: 'dominant-7-sus',
    label: '7sus',
    suffix: '7sus',
    irealQuality: '7sus',
    irealCount: 1433,
    group: 'sus-family',
    inheritance: { from: 'sus', prefix: '7' }
  },
  {
    id: 'dim',
    label: 'dim',
    suffix: 'dim',
    irealQuality: 'o',
    irealCount: 106,
    group: 'dim-family',
    inheritance: { role: 'base' }
  },
  {
    id: 'dim-7',
    label: 'dim7',
    suffix: 'dim7',
    irealQuality: 'o7',
    irealCount: 1385,
    group: 'dim-family',
    inheritance: { from: 'dim', adds: ['7'] }
  },
  {
    id: 'minor-6',
    label: 'm6',
    suffix: 'm6',
    irealQuality: '-6',
    irealCount: 1272,
    group: 'minor-family',
    inheritance: { from: 'minor', adds: ['6'] }
  },
  {
    id: 'minor-9',
    label: 'm9',
    suffix: 'm9',
    irealQuality: '-9',
    irealCount: 1156,
    group: 'minor-family',
    inheritance: { from: 'minor', adds: ['9'] }
  },
  {
    id: 'dominant-7-alt',
    label: '7alt',
    suffix: '7alt',
    irealQuality: '7alt',
    irealCount: 0,
    group: 'dominant-family',
    inheritance: { from: 'dominant-7', adds: ['alt'] }
  },
  {
    id: 'dominant-7-flat-9-flat-13-stack',
    label: '7(b9 b13)',
    suffix: '7(b9b13)',
    irealQuality: '7b9b13',
    irealCount: 64,
    group: 'stack',
    inheritance: { from: 'dominant-7-flat-9', adds: ['b13'] }
  },
  {
    id: 'dominant-7-flat-9-sharp-11-stack',
    label: '7(b9 #11)',
    suffix: '7(b9#11)',
    irealQuality: '7b9#11',
    irealCount: 28,
    group: 'stack',
    inheritance: { from: 'dominant-7-flat-9', adds: ['#11'] }
  },
  {
    id: 'dominant-7-sharp-9-sharp-11-stack',
    label: '7(#9 #11)',
    suffix: '7(#9#11)',
    irealQuality: '7#9#11',
    irealCount: 13,
    group: 'stack',
    inheritance: { from: 'dominant-7', adds: ['#9', '#11'] }
  }
]);

export function renderSuffixBlock(block, options = {}) {
  return renderSvgChordSuffix(block.suffix, options);
}

export function isFrozenSuffixBlock(blockOrId) {
  const id = typeof blockOrId === 'string' ? blockOrId : blockOrId?.id;
  return FROZEN_SUFFIX_BLOCK_IDS.includes(id);
}

export function createSuffixBlockLibrary(options = {}) {
  return PRIORITY_SUFFIX_BLOCKS.map((block) => {
    const layout = layoutSvgChordSuffix(block.suffix, options);
    return {
      id: block.id,
      label: block.label,
      suffix: block.suffix,
      status: isFrozenSuffixBlock(block) ? 'frozen' : 'candidate',
      group: block.group,
      irealQuality: block.irealQuality,
      irealCount: block.irealCount,
      inheritance: block.inheritance || null,
      metrics: {
        originX: layout.originX,
        advance: layout.advance,
        width: layout.width,
        height: layout.height,
        viewBox: layout.viewBox,
        visualBox: roundBox(layout.visualBox)
      },
      collisionBoxes: layout.blocks
        .filter((part) => part.collisionBox)
        .map((part) => ({
          id: part.id,
          type: part.type,
          box: roundBox(part.collisionBox)
        })),
      svgFragment: layout.elements.join('')
    };
  });
}

export function createFlattenedFrozenSuffixLibrary(options = {}) {
  return createSuffixBlockLibrary(options)
    .filter((block) => block.status === 'frozen')
    .map((block) => ({
      id: block.id,
      label: block.label,
      suffix: block.suffix,
      group: block.group,
      irealQuality: block.irealQuality,
      irealCount: block.irealCount,
      inheritance: block.inheritance,
      metrics: block.metrics,
      collisionBox: block.metrics.visualBox,
      collisionBoxes: createSemanticCollisionBoxes(block),
      svgFragment: block.svgFragment
    }));
}

function createSemanticCollisionBoxes(block) {
  const boxes = block.collisionBoxes || [];
  return {
    full: block.metrics.visualBox,
    body: unionCollisionBoxes(boxes.filter(isBodyCollisionBox)),
    upper: unionCollisionBoxes(boxes.filter(isUpperCollisionBox)),
    lower: unionCollisionBoxes(boxes.filter(isLowerCollisionBox))
  };
}

function isBodyCollisionBox(part) {
  return ['quality', 'symbol'].includes(part.type);
}

function isUpperCollisionBox(part) {
  return [
    'superscript',
    'superscript-text',
    'stack-prefix',
    'stack-paren',
    'stack-row',
    'alt-after-sup',
    'figure69',
    'figure69-slash',
    'm-maj-paren'
  ].includes(part.type);
}

function isLowerCollisionBox(part) {
  return [
    'sus-under'
  ].includes(part.type);
}

function unionCollisionBoxes(parts) {
  return roundBox(parts.reduce((box, part) => unionBoxes(box, part.box), null));
}

function unionBoxes(a, b) {
  if (!a) return b ? { ...b } : null;
  if (!b) return { ...a };
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function roundBox(box) {
  if (!box) return null;
  return {
    x: round(box.x),
    y: round(box.y),
    width: round(box.width),
    height: round(box.height)
  };
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}
