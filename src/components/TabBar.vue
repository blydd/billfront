<template>
  <view class="tab-bar">
    <view 
      class="tab-item" 
      :class="{ active: currentPage === 'index' }"
      @click="navigateTo('/pages/index/index')"
    >
      <view class="tab-icon">
        <text>明</text>
      </view>
      <text class="tab-text">明细</text>
    </view>
    <view 
      class="tab-item" 
      :class="{ active: currentPage === 'statistics' }"
      @click="navigateTo('/pages/statistics/index')"
    >
      <view class="tab-icon">
        <text>统</text>
      </view>
      <text class="tab-text">统计</text>
    </view>
    <view 
      class="tab-item" 
      :class="{ active: currentPage === 'settings' }"
      @click="navigateTo('/pages/settings/index')"
    >
      <view class="tab-icon">
        <text>设</text>
      </view>
      <text class="tab-text">设置</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  currentPage: {
    type: String,
    required: true
  }
});

const navigateTo = (url) => {
  uni.switchTab({
    url
  });
};
</script>

<style lang="scss">
.tab-bar {
  height: 120rpx;
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
    color: #666;
    
    &.active {
      color: #4CAF50;
      
      .tab-icon {
        background-color: #4CAF50;
      }
    }
    
    .tab-icon {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      background-color: #999;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8rpx;
      
      text {
        color: #fff;
        font-size: 24rpx;
        font-weight: bold;
      }
    }
    
    .tab-text {
      font-size: 24rpx;
    }
  }
}
</style> 