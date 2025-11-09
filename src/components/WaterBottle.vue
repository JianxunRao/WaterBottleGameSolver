<template>
  <div class="water-bottle" :class="{ 'selected': isSelected }">
    <div class="bottle-container" @click="handleBottleClick">
      <div class="bottle-rim"></div>
      <div class="bottle-glass">
        <div class="bottle-inner">
          <div
            v-for="layer in displayLayers"
            :key="layer.index"
            class="water-layer"
            :class="`layer-${layer.index}`"
            :style="getLayerStyle(layer.index)"
            @click.stop="handleLayerClick(layer.index)"
          >
            <div v-if="layer.color" class="water-content" :style="{ backgroundColor: layer.color }"></div>
            <div v-else class="water-empty"></div>
          </div>
        </div>
        <div class="glass-highlight"></div>
      </div>
    </div>
    
    <!-- 瓶子编号 -->
    <div class="bottle-index">{{ bottleIndex + 1 }}</div>
  </div>
</template>

<script>
export default {
  name: 'WaterBottle',
  props: {
    bottle: {
      type: Array,
      required: true
    },
    bottleIndex: {
      type: Number,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    layers() {
      return this.bottle
    },
    displayLayers() {
      return this.layers.map((color, index) => ({
        color,
        index
      })).reverse()
    }
  },
  methods: {
    getLayerStyle(index) {
      return {
        flex: 1
      }
    },
    handleLayerClick(layerIndex) {
      this.$emit('layer-click', {
        bottleIndex: this.bottleIndex,
        layerIndex
      })
    },
    handleBottleClick() {
      this.$emit('bottle-click', this.bottleIndex)
    }
  }
}
</script>

<style lang="scss" scoped>
.water-bottle {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  
  &.selected {
    transform: scale(1.05);
  }
  
  .bottle-container {
    position: relative;
    width: 72px;
    height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .bottle-rim {
    width: 66px;
    height: 24px;
    border: 4px solid rgba(30, 30, 30, 0.88);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.25);
    z-index: 3;
  }
  
  .bottle-glass {
    position: relative;
    width: 100%;
    flex: 1;
    margin-top: -3px;
    --bottle-shape: polygon(12% 0%, 88% 0%, 95% 12%, 95% 26%, 88% 42%, 88% 58%, 95% 74%, 95% 88%, 88% 100%, 12% 100%, 5% 88%, 5% 74%, 12% 58%, 12% 42%, 5% 26%, 5% 12%);
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      clip-path: var(--bottle-shape);
    }
    
    &::before {
      background: rgba(20, 20, 20, 0.85);
    }
    
    &::after {
      inset: 3px;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.05));
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.32));
    }
  }
  
  .bottle-inner {
    position: absolute;
    inset: 6px;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    gap: 0;
    clip-path: polygon(14% 0%, 86% 0%, 92% 12%, 92% 26%, 86% 42%, 86% 58%, 92% 74%, 92% 88%, 86% 100%, 14% 100%, 8% 88%, 8% 74%, 14% 58%, 14% 42%, 8% 26%, 8% 12%);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(1px);
    border-radius: 20px;
    overflow: hidden;
    z-index: 2;
  }
  
  .glass-highlight {
    position: absolute;
    top: 26px;
    left: 20px;
    width: 9px;
    height: 60%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0));
    border-radius: 999px;
    z-index: 4;
    pointer-events: none;
    opacity: 0.7;
  }
  
  .water-layer {
    flex: 1;
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    border-radius: 0;
    overflow: hidden;
    background: transparent;
    border: none;
    box-shadow: none;
    transition: transform 0.15s, box-shadow 0.15s;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.18);
    }
    
    .water-content {
      width: 100%;
      height: 100%;
      box-shadow: inset 0 2px 6px rgba(255, 255, 255, 0.25);
    }
    
    .water-empty {
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .water-layer + .water-layer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 18%;
    right: 18%;
    height: 1.5px;
    background: rgba(255, 255, 255, 0.55);
    opacity: 0.75;
    border-radius: 999px;
    pointer-events: none;
  }
  
  .bottle-index {
    margin-top: 8px;
    color: white;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
}

@media (max-width: 768px) {
  .water-bottle {
    .bottle-container {
      width: 58px;
      height: 180px;
    }
    
    .bottle-rim {
      width: 52px;
      height: 18px;
      border-width: 3px;
    }
    
    .bottle-glass::after {
      inset: 3px;
    }
    
    .bottle-inner {
      inset: 5px;
    }
    
    .glass-highlight {
      left: 16px;
      width: 8px;
    }
    
    .water-layer + .water-layer::before {
      left: 20%;
      right: 20%;
      height: 1px;
    }
    
    .bottle-index {
      font-size: 12px;
    }
  }
}
</style>

