<template>
  <div class="game-solver" ref="gameSolverRoot">
    <div class="header">
      <h1>水瓶倒水解谜求解工具</h1>
    </div>
    
    <div class="main-content">
      <!-- 左侧：瓶子设置区域 -->
      <div class="bottles-section">
        <div class="section-header">
          <h2>关卡设置</h2>
          <div class="actions">
            <el-button type="primary" size="small" icon="el-icon-plus" @click="addBottle">添加瓶子</el-button>
            <el-button type="danger" size="small" icon="el-icon-delete" @click="clearAll">清空所有</el-button>
            <el-button type="info" size="small" @click="openCapacityDialog">
              设置层数({{ capacity }})
            </el-button>
          </div>
        </div>
        
        <div class="bottles-container">
          <draggable
            v-model="bottles"
            :options="dragOptions"
            class="bottles-list"
            @end="onDragEnd"
          >
            <div
              v-for="(bottle, index) in bottles"
              :key="index"
              class="bottle-wrapper"
            >
              <WaterBottle
                :bottle="bottle"
                :bottle-index="index"
                :is-selected="selectedBottleIndex === index"
                :hidden-layers="hiddenLayersMap[index] || []"
                @layer-click="handleLayerClick"
                @bottle-click="handleBottleClick"
              />
              <el-button
                type="danger"
                size="mini"
                icon="el-icon-delete"
                circle
                class="delete-btn"
                @click="removeBottle(index)"
              ></el-button>
            </div>
          </draggable>
        </div>
      </div>
      
      <!-- 右侧：求解和步骤区域 -->
      <div class="solution-section">
        <div class="section-header">
          <h2>求解步骤</h2>
          <el-button
            type="success"
            :loading="isSolving"
            @click="solvePuzzle"
          >
            {{ isSolving ? '求解中...' : '开始求解' }}
          </el-button>
        </div>
        
        <div v-if="solutionSteps.length > 0" class="steps-container">
          <div class="step-info">
            <p>总步数: {{ solutionSteps.length }}</p>
            <p>当前步骤: {{ currentStep + 1 }} / {{ solutionSteps.length }}</p>
          </div>
          
          <div class="step-navigation">
            <el-button
              :disabled="currentStep < 0 || isAnimating"
              @click="prevStep"
            >
              上一步
            </el-button>
            <el-button
              type="primary"
              :disabled="currentStep >= solutionSteps.length - 1 || isAnimating"
              @click="nextStep"
            >
              下一步
            </el-button>
            <el-button
              @click="resetToInitial"
            >
              重置
            </el-button>
          </div>
          
          <div class="current-step-info">
            <div v-if="currentStep >= 0 && currentStep < solutionSteps.length" class="step-detail">
              <p class="step-text">
                步骤 {{ currentStep + 1 }}: 
                从 <strong>瓶子 {{ solutionSteps[currentStep].from + 1 }}</strong> 
                倒入 <strong>瓶子 {{ solutionSteps[currentStep].to + 1 }}</strong>
              </p>
            </div>
          </div>
          
          <div class="steps-list">
            <div
              v-for="(step, index) in solutionSteps"
              :key="index"
              class="step-item"
              :class="{ 'active': index === currentStep, 'completed': index < currentStep }"
              @click="jumpToStep(index)"
            >
              <span class="step-number">{{ index + 1 }}</span>
              <span class="step-action">
                瓶子 {{ step.from + 1 }} → 瓶子 {{ step.to + 1 }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-else-if="!isSolving" class="empty-state">
          <p>请先设置关卡，然后点击"开始求解"</p>
        </div>
      </div>
    </div>

    <!-- 颜色选择器 -->
    <ColorPicker
      ref="colorPicker"
      v-model="showColorPicker"
      @color-selected="handleColorSelected"
    />

    <el-dialog
      title="设置瓶子层数"
      :visible.sync="showCapacityDialog"
      width="320px"
      :close-on-click-modal="false"
    >
      <div class="capacity-dialog-content">
        <p>设置所有瓶子的最大层数（2-12）：</p>
        <el-input-number
          v-model="capacityInput"
          :min="2"
          :max="12"
          :step="1"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showCapacityDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCapacity">确定</el-button>
      </span>
    </el-dialog>

    <div class="pour-animation-layer" ref="animationLayer">
      <div
        v-for="layer in animationLayers"
        :key="layer.id"
        class="pour-layer"
        :style="getAnimationLayerStyle(layer)"
      ></div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import draggable from 'vuedraggable'
import WaterBottle from '@/components/WaterBottle.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import { solve } from '@/utils/solver'
import { getColorName } from '@/utils/colorUtils'

export default {
  name: 'GameSolver',
  components: {
    draggable,
    WaterBottle,
    ColorPicker
  },
  data() {
    return {
      showColorPicker: false,
      pendingLayerClick: null,
      selectedBottleIndex: -1,
      initialBottles: [],
      showCapacityDialog: false,
      capacityInput: 4,
      isAnimating: false,
      animationLayers: [],
      hiddenLayersMap: {},
      animationDuration: 500,
      animationIdCounter: 0,
      dragOptions: {
        animation: 200,
        ghostClass: 'ghost',
        handle: '.bottle-wrapper'
      }
    }
  },
  computed: {
    bottles: {
      get() {
        return this.$store.state.game.bottles
      },
      set(value) {
        this.SET_BOTTLES(value)
      }
    },
    capacity: {
      get() {
        return this.$store.state.game.bottleCapacity
      },
      set(value) {
        const numeric = Number(value)
        const sanitized = Number.isFinite(numeric) ? Math.max(2, Math.min(12, Math.floor(numeric))) : 4
        this.setBottleCapacity(sanitized)
        this.initialBottles = this.$store.state.game.bottles.map(b => [...b])
      }
    },
    ...mapState('game', ['solutionSteps', 'currentStep', 'isSolving', 'bottleCapacity'])
  },
  created() {
    // 初始化：添加2个空瓶子
    if (this.bottles.length === 0) {
      this.addBottle()
      this.addBottle()
    }
    this.capacityInput = this.capacity
  },
  watch: {
    bottleCapacity(newVal) {
      this.capacityInput = newVal
      this.initialBottles = this.bottles.map(b => [...b])
    }
  },
  methods: {
    ...mapMutations('game', [
      'SET_BOTTLES',
      'SET_SOLUTION_STEPS',
      'SET_CURRENT_STEP',
      'SET_IS_SOLVING'
    ]),
    ...mapActions('game', ['addBottle', 'removeBottle', 'setBottleLayer', 'setBottleCapacity']),
    
    handleLayerClick({ bottleIndex, layerIndex }) {
      this.pendingLayerClick = { bottleIndex, layerIndex }
      const currentColor = this.bottles[bottleIndex][layerIndex]
      this.showColorPicker = true
      this.$nextTick(() => {
        if (this.$refs.colorPicker) {
          this.$refs.colorPicker.open(currentColor)
        }
      })
    },
    
    handleBottleClick(bottleIndex) {
      this.selectedBottleIndex = this.selectedBottleIndex === bottleIndex ? -1 : bottleIndex
    },
    
    handleColorSelected(color) {
      if (this.pendingLayerClick) {
        const { bottleIndex, layerIndex } = this.pendingLayerClick
        this.setBottleLayer({ bottleIndex, layerIndex, color })
        this.pendingLayerClick = null
      }
    },
    
    addBottle() {
      this.$store.dispatch('game/addBottle')
    },
    
    removeBottle(index) {
      this.$store.dispatch('game/removeBottle', index)
      if (this.selectedBottleIndex === index) {
        this.selectedBottleIndex = -1
      }
    },
    
    clearAll() {
      this.$confirm('确定要清空所有瓶子吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.clearAnimationState()
        this.SET_BOTTLES([])
        this.SET_SOLUTION_STEPS([])
        this.SET_CURRENT_STEP(-1)
        this.selectedBottleIndex = -1
      }).catch(() => {})
    },

    openCapacityDialog() {
      this.capacityInput = this.capacity
      this.showCapacityDialog = true
    },

    confirmCapacity() {
      if (this.isAnimating) {
        this.$message.warning('请等待当前动画结束后再设置层数')
        return
      }
      const numeric = Number(this.capacityInput)
      if (!Number.isFinite(numeric)) {
        this.$message.warning('请输入有效的数字')
        return
      }
      const sanitized = Math.max(2, Math.min(12, Math.floor(numeric)))
      this.capacity = sanitized
      this.showCapacityDialog = false
      this.$message.success(`已设置瓶子层数为 ${sanitized}`)
    },
    
    onDragEnd() {
      // 拖拽结束后更新顺序
      // 由于v-model已经更新了bottles，这里不需要额外操作
    },
    
    async solvePuzzle() {
      if (this.isAnimating) {
        this.$message.warning('请等待当前动画结束后再求解')
        return
      }
      if (this.bottles.length === 0) {
        this.$message.warning('请至少添加一个瓶子')
        return
      }
      
      // 保存初始状态
      this.initialBottles = this.bottles.map(b => [...b])
      this.logCurrentPuzzle(this.initialBottles, this.capacity)
      
      this.SET_IS_SOLVING(true)
      
      // 使用setTimeout让UI更新
      await this.$nextTick()
      
      try {
        const steps = solve(this.bottles)
        
        if (steps === null) {
          this.$message.error('无法求解，可能无解或需要更多步骤')
          this.SET_SOLUTION_STEPS([])
        } else {
          this.SET_SOLUTION_STEPS(steps)
          this.SET_CURRENT_STEP(-1)
          this.$message.success(`求解成功！共 ${steps.length} 步`)
        }
      } catch (error) {
        console.error('求解错误:', error)
        this.$message.error('求解过程中出现错误')
      } finally {
        this.SET_IS_SOLVING(false)
      }
    },
    
    nextStep() {
      if (this.isAnimating) return
      if (this.currentStep >= this.solutionSteps.length - 1) return

      const nextStepIndex = this.currentStep + 1
      const step = this.solutionSteps[nextStepIndex]

      const beforeStateSource = this.currentStep >= 0
        ? this.solutionSteps[this.currentStep].bottles
        : this.initialBottles
      const beforeState = beforeStateSource.map(bottle => [...bottle])
      const afterState = step.bottles.map(bottle => [...bottle])

      const animated = this.startStepAnimation(step, beforeState, afterState, () => {
        this.SET_BOTTLES(afterState.map(bottle => [...bottle]))
        this.SET_CURRENT_STEP(nextStepIndex)
      })

      if (!animated) {
        this.SET_BOTTLES(afterState.map(bottle => [...bottle]))
        this.SET_CURRENT_STEP(nextStepIndex)
      }
    },
    
    prevStep() {
      if (this.isAnimating) return
      if (this.currentStep > 0) {
        const prevStepIndex = this.currentStep - 1
        const step = this.solutionSteps[prevStepIndex]
        this.SET_BOTTLES([...step.bottles])
        this.SET_CURRENT_STEP(prevStepIndex)
      } else if (this.currentStep === 0) {
        // 回到初始状态
        this.resetToInitial()
      }
    },
    
    jumpToStep(stepIndex) {
      if (this.isAnimating) return
      if (stepIndex < 0) {
        this.resetToInitial()
        return
      }
      
      const step = this.solutionSteps[stepIndex]
      this.SET_BOTTLES([...step.bottles])
      this.SET_CURRENT_STEP(stepIndex)
    },
    
    resetToInitial() {
      if (this.isAnimating) return
      this.SET_BOTTLES(this.initialBottles.map(b => [...b]))
      this.SET_CURRENT_STEP(-1)
    },

    startStepAnimation(step, beforeState, afterState, onComplete) {
      const capacity = this.capacity
      const fromBefore = beforeState[step.from] || []
      const fromAfter = afterState[step.from] || []
      const toBefore = beforeState[step.to] || []
      const toAfter = afterState[step.to] || []

      const movedFrom = []
      for (let i = 0; i < capacity; i++) {
        if (fromBefore[i] !== fromAfter[i] && fromAfter[i] === null && fromBefore[i] !== null) {
          movedFrom.push(i)
        }
      }

      const movedTo = []
      for (let i = 0; i < capacity; i++) {
        if (toBefore[i] !== toAfter[i] && toAfter[i] !== null) {
          movedTo.push(i)
        }
      }

      if (!movedFrom.length || movedFrom.length !== movedTo.length) {
        return false
      }

      const sourceRect = this.getBottleInnerRect(step.from)
      const targetRect = this.getBottleInnerRect(step.to)

      if (!sourceRect || !targetRect) {
        return false
      }

      const sortedFrom = [...movedFrom].sort((a, b) => b - a)
      const sortedTo = [...movedTo].sort((a, b) => b - a)

      const animations = []

      sortedFrom.forEach((layerIndex, idx) => {
        const destIndex = sortedTo[idx]
        const color = fromBefore[layerIndex]
        const startPos = this.computeLayerPosition(sourceRect, layerIndex)
        const endPos = this.computeLayerPosition(targetRect, destIndex)

        if (!color || !startPos || !endPos) {
          return
        }

        animations.push({
          id: `pour-${this.animationIdCounter++}`,
          color,
          startLeft: startPos.left,
          startTop: startPos.top,
          startWidth: startPos.width,
          startHeight: startPos.height,
          endWidth: endPos.width,
          endHeight: endPos.height,
          deltaX: endPos.left - startPos.left,
          deltaY: endPos.top - startPos.top,
          active: false,
          duration: this.animationDuration
        })
      })

      if (!animations.length) {
        return false
      }

      this.isAnimating = true
      this.animationLayers = animations
      this.$set(this.hiddenLayersMap, step.from, sortedFrom)

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.animationLayers.forEach(layer => {
            layer.active = true
          })
        })
      })

      setTimeout(() => {
        onComplete()
        this.clearAnimationState()
      }, this.animationDuration + 80)

      return true
    },

    getBottleInnerRect(index) {
      const el = document.querySelector(`[data-bottle-inner="${index}"]`)
      return el ? el.getBoundingClientRect() : null
    },

    computeLayerPosition(innerRect, layerIndex) {
      if (!innerRect) return null
      const capacity = this.capacity
      if (capacity <= 0) return null
      const layerHeight = innerRect.height / capacity
      return {
        left: innerRect.left,
        top: innerRect.bottom - layerHeight * (layerIndex + 1),
        width: innerRect.width,
        height: layerHeight
      }
    },

    getAnimationLayerStyle(layer) {
      const width = layer.active ? layer.endWidth : layer.startWidth
      const height = layer.active ? layer.endHeight : layer.startHeight
      const translateX = layer.active ? layer.deltaX : 0
      const translateY = layer.active ? layer.deltaY : 0

      return {
        left: `${layer.startLeft}px`,
        top: `${layer.startTop}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: layer.color,
        transform: `translate(${translateX}px, ${translateY}px)`,
        borderRadius: '10px',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
        transition: `transform ${layer.duration}ms cubic-bezier(0.4, 0, 0.2, 1), width ${layer.duration}ms ease, height ${layer.duration}ms ease`
      }
    },

    clearAnimationState() {
      this.animationLayers = []
      this.hiddenLayersMap = {}
      this.isAnimating = false
    },

    logCurrentPuzzle(bottles, capacity) {
      console.log('当前关卡瓶子状态（从瓶口到瓶底）：')
      bottles.forEach((bottle, index) => {
        const layers = []
        for (let i = capacity - 1; i >= 0; i--) {
          const color = bottle[i]
          layers.push(getColorName(color))
        }
        console.log(`瓶子 ${index + 1}: [${layers.join(', ')}]`)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.game-solver {
  min-height: 100vh;
  padding: 20px;
  color: white;
  
  .header {
    text-align: center;
    margin-bottom: 30px;
    
    h1 {
      font-size: 24px;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }
  
  .main-content {
    display: flex;
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;
    
    .bottles-section,
    .solution-section {
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      font-size: 18px;
      margin: 0;
    }
    
    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
  }
  
  .bottles-container {
    min-height: 300px;
    
    .bottles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: flex-start;
      
      .bottle-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .delete-btn {
          margin-top: 10px;
        }
      }
    }
  }
  
  .steps-container {
    .step-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      
      p {
        margin: 0;
        font-size: 14px;
      }
    }
    
    .step-navigation {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .current-step-info {
      margin-bottom: 20px;
      padding: 15px;
      background: rgba(64, 158, 255, 0.2);
      border-radius: 8px;
      border: 2px solid rgba(64, 158, 255, 0.5);
      
      .step-text {
        margin: 0;
        font-size: 16px;
        
        strong {
          color: #FFD700;
        }
      }
    }
    
    .steps-list {
      max-height: 400px;
      overflow-y: auto;
      
      .step-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        &.active {
          background: rgba(64, 158, 255, 0.3);
          border-color: #409EFF;
        }
        
        &.completed {
          opacity: 0.6;
        }
        
        .step-number {
          display: inline-block;
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          margin-right: 12px;
          font-weight: bold;
        }
        
        .step-action {
          flex: 1;
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: rgba(255, 255, 255, 0.7);
  }

  .capacity-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 14px;
    color: #2c3e50;

    p {
      margin: 0;
    }
  }
}

.ghost {
  opacity: 0.5;
}

.pour-animation-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
}

.pour-layer {
  position: absolute;
  will-change: transform, width, height;
}

@media (max-width: 768px) {
  .game-solver {
    padding: 10px;
    
    .header h1 {
      font-size: 20px;
    }
    
    .main-content {
      flex-direction: column;
      
      .bottles-section,
      .solution-section {
        padding: 15px;
      }
    }
    
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .actions {
        width: 100%;
        gap: 8px;
      }
    }
    
    .bottles-container {
      .bottles-list {
        justify-content: center;
        gap: 15px;
      }
    }
    
    .steps-container {
      .steps-list {
        max-height: 300px;
      }
    }
  }
}
</style>

