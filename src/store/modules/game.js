const DEFAULT_CAPACITY = 4

function createEmptyBottle(capacity) {
  return Array.from({ length: capacity }, () => null)
}

function normalizeBottleToCapacity(bottle, capacity) {
  const normalized = createEmptyBottle(capacity)
  if (!Array.isArray(bottle)) {
    return normalized
  }

  const limit = Math.min(capacity, bottle.length)
  for (let i = 0; i < limit; i++) {
    normalized[i] = bottle[i]
  }

  return normalized
}

// 游戏状态管理
const state = {
  bottleCapacity: DEFAULT_CAPACITY,
  bottles: [], // 瓶子数组，每个瓶子包含容量指定层数的颜色
  solutionSteps: [], // 求解步骤
  currentStep: -1, // 当前步骤索引
  isSolving: false // 是否正在求解
}

const mutations = {
  SET_BOTTLES(state, bottles) {
    state.bottles = bottles.map(bottle => normalizeBottleToCapacity(bottle, state.bottleCapacity))
  },
  ADD_BOTTLE(state) {
    state.bottles.push(createEmptyBottle(state.bottleCapacity))
  },
  REMOVE_BOTTLE(state, index) {
    state.bottles.splice(index, 1)
  },
  SET_BOTTLE_LAYER(state, { bottleIndex, layerIndex, color }) {
    const bottle = state.bottles[bottleIndex]
    if (bottle && layerIndex >= 0 && layerIndex < state.bottleCapacity) {
      const nextBottle = normalizeBottleToCapacity([...bottle], state.bottleCapacity)
      nextBottle[layerIndex] = color
      state.bottles.splice(bottleIndex, 1, nextBottle)
    }
  },
  SET_SOLUTION_STEPS(state, steps) {
    state.solutionSteps = steps
    state.currentStep = -1
  },
  SET_CURRENT_STEP(state, step) {
    state.currentStep = step
  },
  SET_IS_SOLVING(state, isSolving) {
    state.isSolving = isSolving
  },
  REORDER_BOTTLES(state, newOrder) {
    state.bottles = newOrder.map(index => normalizeBottleToCapacity(state.bottles[index], state.bottleCapacity))
  },
  SET_BOTTLE_CAPACITY(state, capacity) {
    const numeric = Number(capacity)
    const sanitized = Number.isFinite(numeric)
      ? Math.max(1, Math.min(12, Math.floor(numeric)))
      : DEFAULT_CAPACITY
    state.bottleCapacity = sanitized
    state.bottles = state.bottles.map(bottle => normalizeBottleToCapacity(bottle, sanitized))
    state.solutionSteps = []
    state.currentStep = -1
  }
}

const actions = {
  addBottle({ commit }) {
    commit('ADD_BOTTLE')
  },
  removeBottle({ commit }, index) {
    commit('REMOVE_BOTTLE', index)
  },
  setBottleLayer({ commit }, { bottleIndex, layerIndex, color }) {
    commit('SET_BOTTLE_LAYER', { bottleIndex, layerIndex, color })
  },
  reorderBottles({ commit }, newOrder) {
    commit('REORDER_BOTTLES', newOrder)
  },
  setBottleCapacity({ commit }, capacity) {
    commit('SET_BOTTLE_CAPACITY', capacity)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

