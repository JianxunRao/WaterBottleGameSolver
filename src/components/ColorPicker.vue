<template>
  <el-dialog
    title="选择颜色"
    :visible.sync="visible"
    width="90%"
    :close-on-click-modal="false"
    custom-class="color-picker-dialog"
  >
    <div class="color-picker">
      <div class="color-grid">
        <div
          v-for="color in displayedColors"
          :key="color.key"
          class="color-item"
          :class="{
            selected: selectedColor === color.value,
            'custom-color': color.isCustom
          }"
          @click="selectColor(color.value)"
        >
          <span class="color-swatch" :style="{ backgroundColor: color.value }"></span>
          <span class="color-name">{{ color.name }}</span>
        </div>
        <div
          class="color-item color-item-empty"
          :class="{ selected: selectedColor === null }"
          @click="selectColor(null)"
        >
          <span class="color-swatch color-swatch-empty"></span>
          <span class="color-name">清空</span>
        </div>
      </div>

      <div class="custom-color-section">
        <h3>自定义颜色</h3>
        <div class="custom-color-form">
          <el-input
            v-model="newColorName"
            size="small"
            placeholder="颜色名称"
            clearable
            class="custom-input"
          />
          <el-color-picker
            v-model="newColorValue"
            :predefine="predefineColors"
            show-alpha
            class="custom-picker"
          />
          <el-button
            type="primary"
            size="small"
            class="custom-add"
            @click="addCustomColor"
          >
            添加
          </el-button>
        </div>
        <p class="custom-hint">
          自定义颜色会保存在浏览器中，刷新页面后仍可使用。
        </p>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ColorPicker',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: this.value,
      selectedColor: null,
      defaultColors: [
        { name: '红', value: '#FF4444' },
        { name: '橙', value: '#DF8643' },
        { name: '黄', value: '#FFCC44' },
        { name: '绿', value: '#61CE7B' },
        { name: '深绿色', value: '#008000' },
        { name: '青色', value: '#00FFFF' },
        { name: '天蓝色', value: '#87CEEB' },
        { name: '蓝', value: '#3A2EBC' },
        { name: '紫', value: '#CC44FF' },
        { name: '粉', value: '#E05C75' },
        { name: '棕', value: '#7B4618' },
        { name: '灰', value: '#888888' },
        { name: '黑', value: '#333333' },
        { name: '白', value: '#FFFFFF' }
      ],
      customColors: [],
      newColorName: '',
      newColorValue: '#409EFF',
      predefineColors: [
        '#FF0000',
        '#FF7F00',
        '#FFFF00',
        '#00FF00',
        '#00FFFF',
        '#0000FF',
        '#8B00FF',
        '#000000',
        '#FFFFFF'
      ],
      storageKey: 'water-bottle-custom-colors'
    }
  },
  computed: {
    displayedColors() {
      const customs = this.customColors.map((color, index) => ({
        ...color,
        key: `custom-${index}-${color.name}-${color.value}`,
        isCustom: true
      }))
      const defaults = this.defaultColors.map(color => ({
        ...color,
        key: `default-${color.name}-${color.value}`,
        isCustom: false
      }))
      return [...customs, ...defaults]
    }
  },
  watch: {
    value(newVal) {
      this.visible = newVal
    },
    visible(newVal) {
      this.$emit('input', newVal)
      if (!newVal) {
        this.selectedColor = null
      }
    }
  },
  created() {
    this.loadCustomColors()
  },
  methods: {
    selectColor(color) {
      this.selectedColor = color
      this.$emit('color-selected', color)
      this.visible = false
    },
    addCustomColor() {
      const name = this.newColorName.trim()
      const value = this.newColorValue

      if (!name) {
        this.$message.warning('请输入颜色名称')
        return
      }
      if (!value) {
        this.$message.warning('请选择颜色')
        return
      }

      const duplicate = [...this.defaultColors, ...this.customColors].some(
        color => color.name === name || color.value.toLowerCase() === value.toLowerCase()
      )
      if (duplicate) {
        this.$message.warning('颜色名称或取值已存在')
        return
      }

      const newColor = { name, value }
      this.customColors.unshift(newColor)
      this.saveCustomColors()
      this.newColorName = ''
      this.$message.success('已添加自定义颜色')
    },
    loadCustomColors() {
      if (typeof window === 'undefined') return
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            this.customColors = parsed.filter(color => color.name && color.value)
          }
        }
      } catch (error) {
        console.warn('加载自定义颜色失败:', error)
      }
    },
    saveCustomColors() {
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.customColors))
      } catch (error) {
        console.warn('保存自定义颜色失败:', error)
      }
    },
    open(initialColor = null) {
      this.selectedColor = initialColor
      this.visible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.color-picker {
  padding: 20px 0;
  
  .custom-color-section {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    
    h3 {
      font-size: 16px;
      margin-bottom: 12px;
      font-weight: 600;
      color: #141414;
    }
    
    .custom-color-form {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: nowrap;
      
      .custom-input {
        flex: 0 1 130px;
      }
      
      .custom-picker {
        flex: 0 0 auto;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .custom-add {
        flex: 0 0 auto;
      }
    }
    
    .custom-hint {
      margin-top: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 12px;
    
    .color-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 10px 6px;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 10px rgba(0, 0, 0, 0.18);
      }
      
      &.selected {
        border-color: rgba(64, 158, 255, 0.9);
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.25);
      }
      
      .color-swatch {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.22);
        margin-bottom: 8px;
      }

      .color-swatch-empty {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: none;
        background: transparent;
        
        &::after {
          content: '';
          width: 60%;
          height: 2px;
          background: rgba(153, 153, 153, 0.6);
          transform: rotate(-45deg);
          border-radius: 999px;
        }
      }
      
      .color-name {
        color: #111;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.6px;
        text-align: center;
        text-shadow: none;
      }
      
      &.color-item-empty {
        background: linear-gradient(135deg, rgba(245, 247, 250, 0.85) 0%, rgba(195, 207, 226, 0.75) 100%);
        border: 2px dashed rgba(160, 170, 190, 0.8);
        
        .color-swatch {
          border-radius: 50%;
          border: 2px dashed rgba(153, 153, 153, 0.8);
          background: transparent;
        }
        
        .color-name {
          color: #555;
          text-shadow: none;
        }
      }
    }
  }
}

::v-deep .color-picker-dialog {
  .el-dialog__body {
    padding: 16px 20px 12px;
  }
  
  .el-dialog__footer {
    padding: 8px 20px 16px;
    margin-top: 4px;
  }
}

@media (max-width: 768px) {
  .color-picker {
    .custom-color-section {
      .custom-color-form {
        flex-wrap: wrap;
        gap: 6px;
        
        .custom-input {
          flex: 1 1 30%;
        }
        
        .custom-picker,
        .custom-add {
          flex: 0 0 auto;
        }
      }
    }
    
    .color-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      
      .color-item {
        padding: 8px 4px;
        
        .color-swatch {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          margin-bottom: 6px;
        }
        
        .color-name {
          font-size: 13px;
          letter-spacing: 0.4px;
        }
      }
    }
  }
}
</style>

