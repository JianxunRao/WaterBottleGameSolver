const DEFAULT_COLORS = [
  { name: '红', value: '#FF4444' },
  { name: '橙', value: '#DF8643' },
  { name: '黄', value: '#FFCC44' },
  { name: '绿', value: '#74921C' },
  { name: '深绿色', value: '#1F6230' },
  { name: '青色', value: '#5FCF78' },
  { name: '天蓝色', value: '#87CEEB' },
  { name: '蓝', value: '#3A2EBC' },
  { name: '紫', value: '#CC44FF' },
  { name: '粉', value: '#E05C75' },
  { name: '棕', value: '#7B4618' },
  { name: '灰', value: '#888888' },
  { name: '黑', value: '#333333' },
  { name: '白', value: '#FFFFFF' }
]

const CUSTOM_COLOR_STORAGE_KEY = 'water-bottle-custom-colors'

function loadCustomColors() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && item.name && item.value)
  } catch (err) {
    console.warn('加载自定义颜色失败:', err)
    return []
  }
}

export function getColorName(colorValue) {
  if (!colorValue) return '空'
  const normalized = String(colorValue).toLowerCase()
  const customColors = loadCustomColors()
  const allColors = [...customColors, ...DEFAULT_COLORS]
  const match = allColors.find(color => String(color.value).toLowerCase() === normalized)
  return match ? match.name : colorValue
}

export function getDefaultColors() {
  return DEFAULT_COLORS.map(color => ({ ...color }))
}

export function getCustomColorStorageKey() {
  return CUSTOM_COLOR_STORAGE_KEY
}

export default {
  getColorName,
  getDefaultColors,
  getCustomColorStorageKey
}

