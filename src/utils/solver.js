// 求解算法：使用BFS搜索最优解

const DEFAULT_CAPACITY = 4

function detectCapacity(...bottles) {
  for (const bottle of bottles) {
    if (Array.isArray(bottle) && bottle.length > 0) {
      return bottle.length
    }
  }
  return DEFAULT_CAPACITY
}

function createEmptyBottle(capacity) {
  return Array.from({ length: capacity }, () => null)
}

/**
 * 检查是否获胜
 * @param {Array} bottles - 瓶子数组
 * @returns {boolean}
 */
export function isWin(bottles) {
  return bottles.every(bottle => {
    const capacity = Array.isArray(bottle) ? bottle.length : DEFAULT_CAPACITY
    const normalized = normalizeBottle(bottle, capacity)
    const filledLayers = normalized.filter(layer => layer !== null)
    if (filledLayers.length === 0) return true // 空瓶
    if (filledLayers.length !== capacity) return false // 未满
    return filledLayers.every(color => color === filledLayers[0]) // 全部相同颜色
  })
}

function normalizeBottle(bottle, capacity) {
  const normalized = createEmptyBottle(capacity)
  let writeIndex = 0

  if (!Array.isArray(bottle)) {
    return normalized
  }

  for (let i = 0; i < bottle.length && writeIndex < capacity; i++) {
    const layer = bottle[i]
    if (layer !== null) {
      normalized[writeIndex++] = layer
    }
  }

  return normalized
}

function normalizeBottles(bottles, capacity) {
  const effectiveCapacity = capacity ?? detectCapacity(...bottles)
  return bottles.map(bottle => normalizeBottle(bottle, effectiveCapacity))
}

/**
 * 获取瓶子顶部连续相同颜色的层数
 * @param {Array} bottle - 瓶子
 * @returns {Object} {color: 颜色, count: 层数}
 */
function getTopLayers(bottle) {
  if (!Array.isArray(bottle) || bottle.length === 0) {
    return { color: null, count: 0, startIndex: -1, topIndex: -1 }
  }

  let topIndex = -1
  for (let i = bottle.length - 1; i >= 0; i--) {
    if (bottle[i] !== null) {
      topIndex = i
      break
    }
  }

  if (topIndex === -1) {
    return { color: null, count: 0, startIndex: -1, topIndex: -1 }
  }

  const topColor = bottle[topIndex]
  let count = 1
  let startIndex = topIndex

  for (let i = topIndex - 1; i >= 0; i--) {
    if (bottle[i] === topColor) {
      count++
      startIndex = i
    } else {
      break
    }
  }

  return { color: topColor, count, startIndex, topIndex }
}

/**
 * 获取瓶子顶部颜色
 * @param {Array} bottle - 瓶子
 * @returns {string|null}
 */
function getTopColor(bottle) {
  const top = getTopLayers(bottle)
  return top.color
}

/**
 * 获取瓶子空余空间
 * @param {Array} bottle - 瓶子
 * @returns {number}
 */
function getEmptySpace(bottle) {
  return bottle.reduce((count, layer) => (layer === null ? count + 1 : count), 0)
}

/**
 * 检查是否可以倒水
 * @param {Array} fromBottle - 源瓶子
 * @param {Array} toBottle - 目标瓶子
 * @returns {Object|null} {fromIndex: 从第几层开始, count: 倒几层}
 */
export function canPour(fromBottle, toBottle) {
  const fromTop = getTopLayers(fromBottle)
  const toTopColor = getTopColor(toBottle)
  const toEmptySpace = getEmptySpace(toBottle)
  
  // 源瓶子为空
  if (fromTop.count === 0) {
    return null
  }
  
  // 目标瓶子为空，可以倒入任意层数的同一种颜色
  if (toTopColor === null) {
    const pourCount = Math.min(fromTop.count, toEmptySpace)
    if (pourCount === 0) {
      return null
    }

    const startIndex = fromTop.topIndex - pourCount + 1
    return {
      fromIndex: startIndex,
      count: pourCount
    }
  }
  
  // 目标瓶子不为空，需要颜色相同
  if (fromTop.color !== toTopColor) {
    return null
  }
  
  // 颜色相同，检查空间
  const canPourCount = Math.min(fromTop.count, toEmptySpace)
  if (canPourCount === 0) {
    return null
  }
  
  return {
    fromIndex: fromTop.topIndex - canPourCount + 1,
    count: canPourCount
  }
}

/**
 * 执行倒水操作
 * @param {Array} bottles - 瓶子数组
 * @param {number} fromIndex - 源瓶子索引
 * @param {number} toIndex - 目标瓶子索引
 * @returns {Array|null} 新的瓶子数组，如果无法倒水则返回null
 */
export function pourWater(bottles, fromIndex, toIndex, capacity) {
  return pourWaterWithCapacity(bottles, fromIndex, toIndex, capacity)
}

function pourWaterWithCapacity(bottles, fromIndex, toIndex, explicitCapacity) {
  if (fromIndex === toIndex) return null

  const capacity = explicitCapacity ?? detectCapacity(bottles[fromIndex], bottles[toIndex], bottles[0])
  if (capacity <= 0) return null

  const fromBottle = normalizeBottle(bottles[fromIndex], capacity)
  const toBottle = normalizeBottle(bottles[toIndex], capacity)
  
  const pourInfo = canPour(fromBottle, toBottle)
  if (!pourInfo) return null
  
  const { fromIndex: layerStart, count } = pourInfo
  const color = fromBottle[layerStart + count - 1]
  
  // 从源瓶子移除水
  for (let i = layerStart; i < layerStart + count; i++) {
    fromBottle[i] = null
  }
  
  // 向目标瓶子添加水
  let addedCount = 0
  
  // 如果目标瓶子顶部有相同颜色的水，从顶部往下填充（融合）
  // 否则从底部开始填充
  const topColor = getTopColor(toBottle)
  if (topColor === color && topColor !== null) {
    // 从顶部往下找空位填充（与顶部相同颜色的水融合）
    for (let i = capacity - 1; i >= 0 && addedCount < count; i--) {
      if (toBottle[i] === null) {
        toBottle[i] = color
        addedCount++
      }
    }
  } else {
    // 从底部开始填充
    for (let i = 0; i < capacity && addedCount < count; i++) {
      if (toBottle[i] === null) {
        toBottle[i] = color
        addedCount++
      }
    }
  }
  
  const updatedFrom = normalizeBottle(fromBottle, capacity)
  const updatedTo = normalizeBottle(toBottle, capacity)

  // 创建新的瓶子数组
  const newBottles = bottles.map((bottle, index) => {
    if (index === fromIndex) return updatedFrom
    if (index === toIndex) return updatedTo
    return normalizeBottle(bottle, capacity)
  })
  
  return newBottles
}

/**
 * 将瓶子状态转换为字符串（用于去重）
 * @param {Array} bottles - 瓶子数组
 * @returns {string}
 */
function bottlesToKey(bottles) {
  // 对每个瓶子进行标准化（移除null，只保留颜色）
  // 注意：瓶子的顺序是重要的，不能排序！
  // 因为倒水操作是基于索引的，不同顺序的瓶子状态是不同的
  const normalized = bottles.map(bottle => {
    const filled = bottle.filter(layer => layer !== null)
    return filled.join(',')
  }).join('|')
  return normalized
}

/**
 * BFS求解
 * @param {Array} initialBottles - 初始瓶子状态
 * @returns {Array|null} 求解步骤，如果无解返回null
 */
export function solve(initialBottles) {
  const capacity = detectCapacity(...initialBottles)
  if (capacity <= 0) {
    return null
  }

  const initialState = normalizeBottles(initialBottles, capacity)

  const queue = [{
    bottles: initialState,
    steps: [],
    depth: 0
  }]
  
  const visited = new Set()
  visited.add(bottlesToKey(initialState))
  
  const maxDepth = 50 // 限制最大深度，避免无限搜索
  
  while (queue.length > 0) {
    const current = queue.shift()
    
    if (current.depth > maxDepth) {
      continue
    }
    
    // 检查是否获胜
    if (isWin(current.bottles)) {
      return current.steps
    }
    
    // 尝试所有可能的倒水操作
    for (let fromIndex = 0; fromIndex < current.bottles.length; fromIndex++) {
      for (let toIndex = 0; toIndex < current.bottles.length; toIndex++) {
        if (fromIndex === toIndex) continue
        
        const newBottles = pourWaterWithCapacity(current.bottles, fromIndex, toIndex, capacity)
        if (!newBottles) continue
        
        const key = bottlesToKey(newBottles)
        if (visited.has(key)) continue
        
        visited.add(key)
        
        const newSteps = [...current.steps, {
          from: fromIndex,
          to: toIndex,
          bottles: newBottles.map(b => [...b])
        }]
        
        queue.push({
          bottles: newBottles,
          steps: newSteps,
          depth: current.depth + 1
        })
      }
    }
  }
  
  return null // 无解
}

