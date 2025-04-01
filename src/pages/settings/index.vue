<template>
  <view class="container">
    <view class="header">
      <text class="title">分类管理</text>
      <text class="subtitle">长按拖动分类可排序，轻触你添加的分类可编辑。</text>
    </view>

    <!-- 分类类型切换 -->
    <view class="type-switch">
      <text :class="['switch-item', activeType === 'expense' ? 'active' : '']" @click="switchType('expense')">支出</text>
      <text :class="['switch-item', activeType === 'income' ? 'active' : '']" @click="switchType('income')">入账</text>
      <text :class="['switch-item', activeType === 'exclude' ? 'active' : '']" @click="switchType('exclude')">不计入收支</text>
    </view>

    <!-- 分类列表 -->
    <view class="category-grid">
      <view class="category-item" v-for="(item, index) in categories" :key="index">
        <view class="icon-wrapper">
          <uni-icons :type="item.icon" size="24" color="#fff"></uni-icons>
        </view>
        <text class="name">{{item.name}}</text>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <view class="tab-bar">
      <view class="tab-item" @click="navigateTo('/pages/index/index')">
        <uni-icons type="list" size="24" color="#666"></uni-icons>
        <text>明细</text>
      </view>
      <view class="tab-item" @click="navigateTo('/pages/statistics/index')">
        <uni-icons type="chart" size="24" color="#666"></uni-icons>
        <text>统计</text>
      </view>
      <view class="tab-item active">
        <uni-icons type="gear" size="24" color="#4CAF50"></uni-icons>
        <text>设置</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 当前选择的分类类型
const activeType = ref('expense')

// 分类数据
const categories = ref([
  {
    name: '衣',
    icon: 'shirt',
  },
  {
    name: '食',
    icon: 'food',
  },
  {
    name: '住',
    icon: 'home',
  },
  {
    name: '行',
    icon: 'car',
  },
  {
    name: '摩托车',
    icon: 'car',
  },
  {
    name: '生活缴费',
    icon: 'home',
  },
  {
    name: '医疗',
    icon: 'plus',
  },
  {
    name: '教育',
    icon: 'book',
  },
  {
    name: '购物',
    icon: 'shop',
  },
  {
    name: '其他',
    icon: 'more',
  },
  {
    name: '保险',
    icon: 'safety',
  },
  {
    name: '其他人情',
    icon: 'gift',
  },
  {
    name: '交通',
    icon: 'car',
  },
  {
    name: '餐饮',
    icon: 'food',
  },
  {
    name: '服饰',
    icon: 'shirt',
  },
  {
    name: '发红包',
    icon: 'gift',
  }
])

// 切换分类类型
const switchType = (type) => {
  activeType.value = type
}

// 页面跳转
const navigateTo = (url) => {
  uni.navigateTo({
    url
  })
}
</script>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 100rpx;
}

.header {
  padding: 40rpx 30rpx;
  background-color: #fff;

  .title {
    font-size: 36rpx;
    color: #333;
    font-weight: bold;
    margin-bottom: 20rpx;
  }

  .subtitle {
    font-size: 24rpx;
    color: #999;
  }
}

.type-switch {
  display: flex;
  padding: 20rpx;
  background-color: #fff;
  margin-top: 20rpx;

  .switch-item {
    padding: 10rpx 30rpx;
    font-size: 28rpx;
    color: #666;
    background-color: #f5f5f5;
    border-radius: 30rpx;
    margin-right: 20rpx;

    &.active {
      color: #fff;
      background-color: #4CAF50;
    }
  }
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  background-color: #fff;
  margin-top: 20rpx;

  .category-item {
    width: 25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx 0;

    .icon-wrapper {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background-color: #4CAF50;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10rpx;
    }

    .name {
      font-size: 24rpx;
      color: #333;
    }
  }
}

.tab-bar {
  height: 100rpx;
  display: flex;
  background-color: #fff;
  border-top: 1px solid #eee;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    color: #666;
    
    &.active {
      color: #4CAF50;
    }
  }
}
</style> 