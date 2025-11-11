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
 * 将瓶子状态转换为紧凑字符串（用于去重）
 * @param {Array} bottles - 瓶子数组
 * @returns {string}
 */
const KEY_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'

function encodeIndex(index) {
  if (index === 0) return KEY_ALPHABET[0]
  const base = KEY_ALPHABET.length
  let result = ''
  let value = index
  while (value > 0) {
    result = KEY_ALPHABET[value % base] + result
    value = Math.floor(value / base)
  }
  return result
}

function createColorEncoder(bottles, capacity) {
  const colorToToken = new Map()
  let nextIndex = 0

  function registerColor(color) {
    if (colorToToken.has(color)) {
      return colorToToken.get(color)
    }
    const token = encodeIndex(nextIndex++)
    colorToToken.set(color, token)
    return token
  }

  bottles.forEach(bottle => {
    const normalized = normalizeBottle(bottle, capacity)
    normalized.forEach(layer => {
      if (layer !== null) {
        registerColor(layer)
      }
    })
  })

  function bottleToKey(bottle) {
    const normalized = normalizeBottle(bottle, capacity)
    return normalized
      .filter(layer => layer !== null)
      .map(layer => registerColor(layer))
      .join('')
  }

  function stateToKey(state) {
    return state.map(bottle => bottleToKey(bottle)).join('|')
  }

  return {
    bottleToKey,
    stateToKey,
    registerColor
  }
}

/**
 * 检查倒水操作是否有意义（剪枝优化）
 * @param {number} fromIndex - 源瓶子索引
 * @param {number} toIndex - 目标瓶子索引
 * @param {number} lastFrom - 上一步的源瓶子索引
 * @param {number} lastTo - 上一步的目标瓶子索引
 * @param {Array} bottles - 当前瓶子状态
 * @param {number} capacity - 瓶子容量
 * @returns {boolean}
 */
function isMeaningfulMove(fromIndex, toIndex, lastFrom, lastTo, bottles, capacity) {
  // 避免立即倒回：如果上一步是A->B，这一步是B->A，则无意义
  if (lastFrom !== undefined && lastTo !== undefined) {
    if (fromIndex === lastTo && toIndex === lastFrom) {
      return false
    }
  }

  const fromBottle = bottles[fromIndex]
  const toBottle = bottles[toIndex]

  // 剪枝1: 源瓶为空
  const fromTop = getTopLayers(fromBottle)
  if (fromTop.count === 0) return false

  // 剪枝2: 目标瓶已满
  const toEmptySpace = getEmptySpace(toBottle)
  if (toEmptySpace === 0) return false

  // 剪枝3: 相同颜色但无法填满目标瓶
  const toTop = getTopLayers(toBottle)
  if (fromTop.color === toTop.color) {
    const spaceNeeded = capacity - toTop.count
    if (fromTop.count > spaceNeeded) return false
  }

  return true
}

/**
 * 计算操作的优先级（启发式函数，用于优化搜索顺序）
 * @param {Array} fromBottle - 源瓶子
 * @param {Array} toBottle - 目标瓶子
 * @param {number} capacity - 瓶子容量
 * @returns {number} 优先级分数，越高越优先
 */
function getMovePriority(fromBottle, toBottle, capacity) {
  const fromTop = getTopLayers(fromBottle)
  const toTop = getTopLayers(toBottle)
  const toEmptySpace = getEmptySpace(toBottle)

  // 最高优先级：能填满目标瓶子的操作（完成一个瓶子）
  if (fromTop.color === toTop.color && fromTop.count + toTop.count >= capacity) {
    return 100
  }

  // 高优先级：相同颜色但不能填满
  if (fromTop.color === toTop.color) {
    return 50
  }

  // 中等优先级：倒入空瓶
  if (toTop.color === null) {
    return 25
  }

  // 低优先级：不同颜色操作
  return 0
}

/**
 * 使用A*搜索求解
 * @param {Array} initialBottles - 初始瓶子状态
 * @returns {Array|null} 求解步骤，如果无解返回null
 */
export function solve(initialBottles) {
  const capacity = detectCapacity(...initialBottles)
  if (capacity <= 0) {
    return null
  }

  const colorEncoder = createColorEncoder(initialBottles, capacity)
  const { state: initialState, sortedToOriginal: initialMapping } = normalizeAndSortBottles(initialBottles, capacity, null, colorEncoder)
  const initialKey = colorEncoder.stateToKey(initialState)

  const openSet = [{
    state: initialState,
    key: initialKey,
    g: 0,
    h: heuristic(initialState, capacity),
    move: null, // 用于剪枝的排序后索引
    displayMove: null, // 原始索引用于展示
    parentKey: null,
    sortedToOriginal: initialMapping,
    priority: 0
  }]

  const gScore = new Map([[initialKey, 0]])
  const nodeMap = new Map([[initialKey, openSet[0]]])
  const closedSet = new Set()

  const maxStates = 200000

  while (openSet.length > 0) {
    openSet.sort((a, b) => {
      const fa = a.g + a.h
      const fb = b.g + b.h
      if (fa === fb) {
        return (b.priority ?? 0) - (a.priority ?? 0)
      }
      return fa - fb
    })

    const current = openSet.shift()
    closedSet.add(current.key)

    if (closedSet.size > maxStates) {
      console.warn(`超过最大状态数限制 (${maxStates})，终止搜索`)
      return null
    }

    if (isWin(current.state)) {
      return reconstructPath(nodeMap, current.key, capacity)
    }

    for (let fromIndex = 0; fromIndex < current.state.length; fromIndex++) {
      for (let toIndex = 0; toIndex < current.state.length; toIndex++) {
        if (fromIndex === toIndex) continue

        if (current.move && !isMeaningfulMove(fromIndex, toIndex, current.move.from, current.move.to, current.state, capacity)) {
          continue
        }

        const pouredState = pourWaterWithCapacity(current.state, fromIndex, toIndex, capacity)
        if (!pouredState) continue

        const { state: newState, sortedToOriginal: newMapping } = normalizeAndSortBottles(pouredState, capacity, current.sortedToOriginal, colorEncoder)
        const newKey = colorEncoder.stateToKey(newState)

        const tentativeG = current.g + 1
        if (closedSet.has(newKey) && tentativeG >= (gScore.get(newKey) ?? Number.POSITIVE_INFINITY)) {
          continue
        }

        if (tentativeG >= (gScore.get(newKey) ?? Number.POSITIVE_INFINITY)) {
          continue
        }

        const priority = getMovePriority(current.state[fromIndex], current.state[toIndex], capacity)
        const displayMove = {
          from: current.sortedToOriginal[fromIndex],
          to: current.sortedToOriginal[toIndex]
        }
        gScore.set(newKey, tentativeG)

        const existing = openSet.find(node => node.key === newKey)
        if (existing) {
          existing.g = tentativeG
          existing.h = heuristic(newState, capacity)
          existing.move = { from: fromIndex, to: toIndex }
          existing.displayMove = displayMove
          existing.priority = priority
          existing.state = newState
          existing.parentKey = current.key
          existing.sortedToOriginal = newMapping
          nodeMap.set(newKey, existing)
        } else {
          const newNode = {
            state: newState,
            key: newKey,
            g: tentativeG,
            h: heuristic(newState, capacity),
            move: { from: fromIndex, to: toIndex },
            displayMove,
            priority,
            parentKey: current.key,
            sortedToOriginal: newMapping
          }
          openSet.push(newNode)
          nodeMap.set(newKey, newNode)
        }
      }
    }
  }

  return null
}

function reconstructPath(nodeMap, currentKey, capacity) {
  const steps = []
  let node = nodeMap.get(currentKey)

  while (node && node.displayMove) {
    const restored = restoreOriginalOrder(node.state, node.sortedToOriginal, capacity)
    steps.unshift({
      from: node.displayMove.from,
      to: node.displayMove.to,
      bottles: restored.map(b => [...b])
    })
    node = nodeMap.get(node.parentKey)
  }

  return steps
}

function heuristic(state, capacity) {
  let unmatchedLayers = 0

  state.forEach(bottle => {
    const normalized = normalizeBottle(bottle, capacity)
    const filled = normalized.filter(layer => layer !== null)
    if (filled.length === 0) return

    const topColor = filled[filled.length - 1]
    filled.forEach(layer => {
      if (layer !== topColor) {
        unmatchedLayers += 1
      }
    })
  })

  return Math.ceil(unmatchedLayers / Math.max(1, capacity))
}

function normalizeAndSortBottles(bottles, capacity, indexMap, colorEncoder) {
  const items = bottles.map((bottle, idx) => {
    const normalized = normalizeBottle(bottle, capacity)
    const filled = normalized.filter(layer => layer !== null)

    let category = 0 // 未完成
    if (filled.length === 0) {
      category = 2 // 空瓶
    } else if (filled.length === capacity && filled.every(layer => layer === filled[0])) {
      category = 1 // 已完成
    }

    return {
      normalized,
      category,
      key: colorEncoder.bottleToKey(normalized),
      originalIndex: indexMap ? indexMap[idx] : idx
    }
  })

  items.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category - b.category
    }
    return a.key.localeCompare(b.key)
  })

  return {
    state: items.map(item => item.normalized),
    sortedToOriginal: items.map(item => item.originalIndex)
  }
}

function restoreOriginalOrder(state, sortedToOriginal, capacity) {
  const restored = Array(state.length)
  state.forEach((bottle, idx) => {
    const originalIndex = sortedToOriginal[idx]
    restored[originalIndex] = normalizeBottle(bottle, capacity)
  })
  return restored
}

