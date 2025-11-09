// 测试求解算法 - Node.js版本
// 使用CommonJS格式，因为Node.js可能不支持ES6模块

// 复制solver.js中的函数（因为Node.js环境）
const DEFAULT_CAPACITY = 4
const MAX_SEARCH_DEPTH = 200

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

// 检查是否获胜
function isWin(bottles) {
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

// 获取瓶子顶部连续相同颜色的层数
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

// 获取瓶子顶部颜色
function getTopColor(bottle) {
  const top = getTopLayers(bottle)
  return top.color
}

// 获取瓶子空余空间
function getEmptySpace(bottle) {
  return bottle.reduce((count, layer) => (layer === null ? count + 1 : count), 0)
}

// 检查是否可以倒水
function canPour(fromBottle, toBottle) {
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

// 执行倒水操作
function pourWater(bottles, fromIndex, toIndex, capacity) {
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

// 将瓶子状态转换为字符串（用于去重）
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

// BFS求解
function solve(initialBottles) {
  const capacity = detectCapacity(...initialBottles)
  if (capacity <= 0) {
    console.log('初始容量无效，无法求解')
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
  
  const maxDepth = MAX_SEARCH_DEPTH // 限制最大深度，避免无限搜索
  let maxQueueSize = 0
  let totalStates = 0
  
  while (queue.length > 0) {
    const current = queue.shift()
    
    if (current.depth > maxDepth) {
      continue
    }
    
    // 检查是否获胜
    if (isWin(current.bottles)) {
      console.log(`\n求解成功！搜索了${totalStates}个状态，最大队列长度${maxQueueSize}`)
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
        totalStates++
        
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
        
        if (queue.length > maxQueueSize) {
          maxQueueSize = queue.length
        }
      }
    }
    
    // 每1000个状态输出一次进度
    if (totalStates % 1000 === 0) {
      console.log(`已搜索${totalStates}个状态，当前深度${current.depth}，队列长度${queue.length}`)
    }
  }
  
  console.log(`\n搜索完成，共搜索${totalStates}个状态，最大队列长度${maxQueueSize}`)
  
  return null // 无解
}

// 颜色映射（根据ColorPicker中的颜色定义）
const TEST_CAPACITY = DEFAULT_CAPACITY

const COLORS = {
  橙: '#FF8844',
  粉: '#FF44CC',
  绿: '#44FF44',
  棕: '#CC8844',
  蓝: '#4444FF'
}

/**
 * 创建测试瓶子
 * @param {Array} layers - 从上到下的颜色数组，如 ['橙', '粉', '绿', '棕']
 * @returns {Array} 瓶子数组，底层到顶层 [底层, 次底层, 次顶层, 顶层]
 */
function createBottle(layers, capacity = TEST_CAPACITY) {
  // 用户输入是从上到下，需要转换为从下到上（数组索引0是底层）
  const bottle = createEmptyBottle(capacity)
  for (let i = 0; i < layers.length && i < capacity; i++) {
    const color = COLORS[layers[i]]
    if (color) {
      const targetIndex = capacity - 1 - i
      bottle[targetIndex] = color // 顶层在索引capacity-1，底层在索引0
    }
  }
  return bottle
}

/**
 * 打印瓶子状态（用于调试）
 */
function printBottles(bottles, title = '当前状态') {
  console.log(`\n=== ${title} ===`)
  const capacity = detectCapacity(...bottles)
  bottles.forEach((bottle, index) => {
    const layers = []
    for (let i = capacity - 1; i >= 0; i--) {
      const layer = bottle[i]
      if (!layer) {
        layers.push('空')
        continue
      }
      // 根据颜色值找到颜色名称
      const colorName = Object.keys(COLORS).find(key => COLORS[key] === layer) || '未知'
      layers.push(colorName)
    }
    console.log(`瓶子 ${index + 1}: [${layers.join(', ')}]（自上而下）`)
  })
}

/**
 * 测试用例1：用户提供的测试题目
 */
function testCase1() {
  console.log('\n========== 测试用例1 ==========')
  console.log('初始状态（从上到下）：')
  console.log('1号瓶：橙、粉、绿、棕')
  console.log('2号瓶：蓝、蓝、棕、棕')
  console.log('3号瓶：粉、橙、粉、棕')
  console.log('4号瓶：蓝、橙、蓝、粉')
  console.log('5号瓶：橙、绿、绿、绿')
  console.log('6号瓶：空')
  console.log('7号瓶：空')
  
  // 创建初始瓶子状态
  // 注意：数组是从下到上存储的，所以需要反转
  const bottles = [
    createBottle(['橙', '粉', '绿', '棕']),  // 1号瓶
    createBottle(['蓝', '蓝', '棕', '棕']),  // 2号瓶
    createBottle(['粉', '橙', '粉', '棕']),  // 3号瓶
    createBottle(['蓝', '橙', '蓝', '粉']),  // 4号瓶
    createBottle(['橙', '绿', '绿', '绿']),  // 5号瓶
    createEmptyBottle(TEST_CAPACITY),         // 6号瓶（空瓶）
    createEmptyBottle(TEST_CAPACITY)          // 7号瓶（空瓶）
  ]
  
  printBottles(bottles, '初始状态')
  
  // 验证初始状态是否正确
  console.log('\n验证初始状态：')
  const topIndex = TEST_CAPACITY - 1
  console.log('瓶子1顶层应该是橙:', bottles[0][topIndex] === COLORS['橙'] ? '✓' : '✗')
  console.log('瓶子2顶层应该是蓝:', bottles[1][topIndex] === COLORS['蓝'] ? '✓' : '✗')
  console.log('瓶子3顶层应该是粉:', bottles[2][topIndex] === COLORS['粉'] ? '✓' : '✗')
  console.log('瓶子4顶层应该是蓝:', bottles[3][topIndex] === COLORS['蓝'] ? '✓' : '✗')
  console.log('瓶子5顶层应该是橙:', bottles[4][topIndex] === COLORS['橙'] ? '✓' : '✗')
  
  // 测试倒水功能
  console.log('\n测试倒水功能：')
  console.log('测试：瓶子2顶层是蓝，瓶子4顶层也是蓝，应该可以倒水')
  console.log('瓶子2状态:', JSON.stringify(bottles[1]))
  console.log('瓶子4状态:', JSON.stringify(bottles[3]))
  const canPourResult = canPour(bottles[1], bottles[3])
  console.log('可以倒水:', canPourResult ? `是，倒${canPourResult.count}层` : '否')
  
  // 检查瓶子2和瓶子4的详细状态
  const bottle2Top = getTopLayers(bottles[1])
  const bottle4Top = getTopLayers(bottles[3])
  console.log('瓶子2顶部:', `颜色=${bottle2Top.color}, 层数=${bottle2Top.count}`)
  console.log('瓶子4顶部:', `颜色=${bottle4Top.color}, 层数=${bottle4Top.count}`)
  console.log('瓶子4空余空间:', getEmptySpace(bottles[3]))
  
  // 执行求解
  console.log('\n开始求解...')
  console.log('提示：瓶子4已满，无法接收水')
  console.log('提示：需要先倒出一些水才能继续')
  const startTime = Date.now()
  const steps = solve(bottles)
  const endTime = Date.now()
  
  if (steps === null) {
    console.log('❌ 求解失败：无法找到解')
    console.log('可能原因：')
    console.log(`  1. 搜索深度不够（当前最大深度：${MAX_SEARCH_DEPTH}）`)
    console.log('  2. 题目确实无解')
    console.log('  3. 算法逻辑有问题')
    return false
  }
  
  console.log(`\n✅ 求解成功！`)
  console.log(`总步数: ${steps.length}`)
  console.log(`耗时: ${endTime - startTime}ms`)
  
  // 打印每一步
  console.log('\n求解步骤：')
  let currentBottles = bottles.map(b => [...b])
  
  steps.forEach((step, index) => {
    console.log(`\n步骤 ${index + 1}: 从瓶子 ${step.from + 1} 倒入瓶子 ${step.to + 1}`)
    
    // 验证这一步是否合法
    const pourResult = pourWater(currentBottles, step.from, step.to)
    if (!pourResult) {
      console.log(`  ❌ 错误：这一步操作不合法！`)
      return false
    }
    
    // 验证结果是否匹配
    const matches = JSON.stringify(pourResult) === JSON.stringify(step.bottles)
    if (!matches) {
      console.log(`  ⚠️  警告：倒水结果与步骤中保存的状态不匹配`)
    }
    
    currentBottles = step.bottles.map(b => [...b])
    printBottles(currentBottles, `步骤 ${index + 1} 后`)
  })
  
  // 验证最终状态
  console.log('\n验证最终状态：')
  const finalBottles = steps.length > 0 ? steps[steps.length - 1].bottles : bottles
  const isWinResult = isWin(finalBottles)
  console.log('是否获胜:', isWinResult ? '✅ 是' : '❌ 否')
  
  if (!isWinResult) {
    printBottles(finalBottles, '最终状态（未获胜）')
  } else {
    printBottles(finalBottles, '最终状态（获胜）')
  }
  
  return isWinResult
}

/**
 * 测试倒水逻辑
 */
function testPourLogic() {
  console.log('\n========== 测试倒水逻辑 ==========')
  
  // 测试1：空瓶可以接收任何颜色
  console.log('\n测试1：空瓶接收水')
  const emptyBottle = createEmptyBottle(TEST_CAPACITY)
  const bottleWithBlue = createEmptyBottle(TEST_CAPACITY)
  bottleWithBlue[TEST_CAPACITY - 1] = COLORS['蓝']
  const result1 = canPour(bottleWithBlue, emptyBottle)
  console.log('空瓶可以接收蓝色:', result1 ? `✓ (倒${result1.count}层)` : '✗')
  
  // 测试2：相同颜色可以倒水
  console.log('\n测试2：相同颜色倒水')
  const bottle1 = createEmptyBottle(TEST_CAPACITY)
  const bottle2 = createEmptyBottle(TEST_CAPACITY)
  bottle1[TEST_CAPACITY - 1] = COLORS['蓝']
  bottle1[TEST_CAPACITY - 2] = COLORS['蓝']
  bottle2[TEST_CAPACITY - 1] = COLORS['蓝']
  const result2 = canPour(bottle1, bottle2)
  console.log('蓝色可以倒入蓝色:', result2 ? `✓ (倒${result2.count}层)` : '✗')
  
  // 测试3：不同颜色不能倒水
  console.log('\n测试3：不同颜色不能倒水')
  const bottle3 = createEmptyBottle(TEST_CAPACITY)
  const bottle4 = createEmptyBottle(TEST_CAPACITY)
  bottle3[TEST_CAPACITY - 1] = COLORS['蓝']
  bottle4[TEST_CAPACITY - 1] = COLORS['红']
  const result3 = canPour(bottle3, bottle4)
  console.log('蓝色不能倒入红色:', !result3 ? '✓' : '✗')
  
  // 测试4：空间不足时只能倒部分
  console.log('\n测试4：空间不足')
  const bottle5 = createEmptyBottle(TEST_CAPACITY) // 2层蓝
  bottle5[TEST_CAPACITY - 1] = COLORS['蓝']
  bottle5[TEST_CAPACITY - 2] = COLORS['蓝']
  const bottle6 = createEmptyBottle(TEST_CAPACITY) // 只剩1层空间
  bottle6[TEST_CAPACITY - 1] = COLORS['蓝']
  bottle6[TEST_CAPACITY - 2] = COLORS['蓝']
  bottle6[TEST_CAPACITY - 3] = COLORS['蓝']
  const result4 = canPour(bottle5, bottle6)
  console.log('空间不足时只能倒1层:', result4 && result4.count === 1 ? '✓' : '✗')
  
  // 测试5：执行倒水操作
  console.log('\n测试5：执行倒水操作')
  const testSourceBottle = normalizeBottle(bottle5, TEST_CAPACITY) // 源：2层蓝在顶部
  const testTargetBottle = createEmptyBottle(TEST_CAPACITY)
  testTargetBottle[TEST_CAPACITY - 1] = COLORS['蓝']
  const testBottles = [testSourceBottle, testTargetBottle]
  console.log('倒水前:')
  printBottles(testBottles, '倒水前')
  const pourResult = pourWater(testBottles, 0, 1, TEST_CAPACITY)
  if (pourResult) {
    printBottles(pourResult, '倒水后')
    // 源瓶子应该倒出全部2层蓝，变成空瓶
    // 目标瓶子应该有3层蓝（原来的1层+倒入的2层，融合在一起）
    const sourceIsEmpty = pourResult[0].every(l => l === null)
    const targetHasThreeBlue = pourResult[1].filter(l => l === COLORS['蓝']).length === 3
    console.log('源瓶子变空:', sourceIsEmpty ? '✓' : '✗')
    console.log('目标瓶子有3层蓝（融合）:', targetHasThreeBlue ? '✓' : '✗')
  } else {
    console.log('倒水失败: ✗')
  }
}

/**
 * 测试获胜判断
 */
function testWinCondition() {
  console.log('\n========== 测试获胜判断 ==========')
  
  // 测试1：空瓶算获胜
  const emptyBottle = createEmptyBottle(TEST_CAPACITY)
  console.log('空瓶算获胜:', isWin([emptyBottle]) ? '✓' : '✗')
  
  // 测试2：满瓶同色算获胜
  const fullSameColor = Array.from({ length: TEST_CAPACITY }, () => COLORS['蓝'])
  console.log('满瓶同色算获胜:', isWin([fullSameColor]) ? '✓' : '✗')
  
  // 测试3：未满瓶不算获胜
  const notFull = createEmptyBottle(TEST_CAPACITY)
  for (let i = 1; i < TEST_CAPACITY; i++) {
    notFull[i] = COLORS['蓝']
  }
  console.log('未满瓶不算获胜:', !isWin([notFull]) ? '✓' : '✗')
  
  // 测试4：满瓶不同色不算获胜
  const fullDifferentColor = Array.from({ length: TEST_CAPACITY }, (_, index) =>
    index % 2 === 0 ? COLORS['蓝'] : COLORS['红']
  )
  console.log('满瓶不同色不算获胜:', !isWin([fullDifferentColor]) ? '✓' : '✗')
  
  // 测试5：混合状态
  const mixed = [
    createEmptyBottle(TEST_CAPACITY), // 空瓶
    Array.from({ length: TEST_CAPACITY }, () => COLORS['蓝']), // 满瓶同色
    (() => {
      const bottle = createEmptyBottle(TEST_CAPACITY)
      for (let i = 1; i < TEST_CAPACITY; i++) {
        bottle[i] = COLORS['红']
      }
      return bottle
    })() // 未满
  ]
  console.log('混合状态不算获胜:', !isWin(mixed) ? '✓' : '✗')
  
  // 测试6：全部获胜
  const allWin = [
    createEmptyBottle(TEST_CAPACITY),
    Array.from({ length: TEST_CAPACITY }, () => COLORS['蓝']),
    Array.from({ length: TEST_CAPACITY }, () => COLORS['红'])
  ]
  console.log('全部获胜状态:', isWin(allWin) ? '✓' : '✗')
}

// 运行所有测试
console.log('开始运行测试...\n')

testPourLogic()
testWinCondition()
const test1Result = testCase1()

console.log('\n========== 测试总结 ==========')
console.log('测试用例1结果:', test1Result ? '✅ 通过' : '❌ 失败')

