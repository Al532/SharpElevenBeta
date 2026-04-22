// @ts-check

/**
 * @param {object} [options]
 * @param {() => boolean[]} [options.getEnabledKeys]
 * @param {() => number[]} [options.getKeyPool]
 * @param {(value: number[]) => void} [options.setKeyPool]
 */
export function createDrillKeyPoolRuntime({
  getEnabledKeys = () => [],
  getKeyPool = () => [],
  setKeyPool = () => {}
} = {}) {
  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let index = copy.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function getEffectiveKeyPool() {
    const enabledKeys = getEnabledKeys();
    let pool = [];
    for (let index = 0; index < 12; index++) {
      if (enabledKeys[index]) pool.push(index);
    }
    if (pool.length === 0) {
      pool = Array.from({ length: 12 }, (_, index) => index);
    }
    return pool;
  }

  function nextKey(excludedKey = null) {
    const effectivePool = getEffectiveKeyPool();
    let keyPool = getKeyPool();
    if (effectivePool.length <= 1 || excludedKey === null) {
      if (keyPool.length === 0) {
        keyPool = shuffleArray(effectivePool);
        setKeyPool(keyPool);
      }
      const nextValue = keyPool.pop();
      setKeyPool(keyPool);
      return nextValue;
    }

    if (keyPool.length === 0) {
      keyPool = shuffleArray(effectivePool);
      setKeyPool(keyPool);
    }

    let candidateIndex = keyPool.findIndex((key) => key !== excludedKey);
    if (candidateIndex === -1) {
      keyPool = shuffleArray(effectivePool);
      setKeyPool(keyPool);
      candidateIndex = keyPool.findIndex((key) => key !== excludedKey);
    }

    if (candidateIndex === -1) {
      const fallbackValue = keyPool.pop();
      setKeyPool(keyPool);
      return fallbackValue;
    }

    const [candidate] = keyPool.splice(candidateIndex, 1);
    setKeyPool(keyPool);
    return candidate;
  }

  return {
    shuffleArray,
    getEffectiveKeyPool,
    nextKey
  };
}
