<template>
  <view 
    class="icon" 
    :style="{
      width: size + 'rpx',
      height: size + 'rpx',
      backgroundColor: background,
      borderRadius: '50%'
    }"
  >
    <text v-if="!iconExists" class="fallback-icon" :style="{ color: color }">{{getFallbackText}}</text>
    <image 
      v-else
      :src="iconSrc" 
      :style="{
        width: size * 0.6 + 'rpx',
        height: size * 0.6 + 'rpx',
        filter: getIconFilter
      }"
      mode="aspectFit"
      @error="handleImageError"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 32
  },
  color: {
    type: String,
    default: '#333333'
  },
  background: {
    type: String,
    default: 'transparent'
  }
})

// 图标是否存在
const iconExists = ref(true)

// 处理图片加载错误
const handleImageError = () => {
  iconExists.value = false
}

// 获取图标路径
const iconSrc = computed(() => {
  const iconName = props.type.replace('icon-', '')
  return `/static/icons/${iconName}.svg`
})

// 获取图标过滤器
const getIconFilter = computed(() => {
  if (props.color === '#ffffff' || props.color === '#fff') {
    return 'brightness(0) invert(1)'
  }
  return `brightness(0) saturate(100%) ${getColorFilter(props.color)}`
})

// 获取备用文本
const getFallbackText = computed(() => {
  const iconName = props.type.replace('icon-', '')
  const iconMap = {
    'canyin': '餐',
    'jiaotong': '车',
    'zhufang': '住',
    'fushi': '衣',
    'jiaoyu': '教',
    'yiliao': '医',
    'gouwu': '购',
    'renqing': '情',
    'baoxian': '保',
    'qita': '他',
    'qianbao': '钱',
    'xinyongka': '卡',
    'zhifubao': '支',
    'weixin': '微',
    'gongzi': '薪',
    'jiangjin': '奖',
    'touzi': '投',
    'zhuanzhang': '转',
    'tianjia': '＋',
    'guanbi': '×'
  }
  return iconMap[iconName] || '?'
})

// 将颜色转换为 filter
const getColorFilter = (color) => {
  // 移除 # 号
  const hex = color.replace('#', '')
  // 将颜色转换为 RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `invert(${r/255*100}%) sepia(${g/255*100}%) saturate(${b/255*100}%)`
}
</script>

<style lang="scss">
.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  
  image {
    display: block;
  }

  .fallback-icon {
    font-size: 24rpx;
    font-weight: bold;
  }
}
</style> 