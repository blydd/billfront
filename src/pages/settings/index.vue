<template>
  <view class="container">
    <view class="section">
      <view class="section-header">
        <text class="title">分类管理</text>
        <text class="subtitle">点按以编辑或删除标签</text>
      </view>
      
      <!-- 分类类型切换 -->
      <view class="type-tabs">
        <view 
          v-for="type in ['支出', '收入', '不计入收支']" 
          :key="type"
          :class="['tab-item', activeType === getTypeValue(type) ? 'active' : '']"
          @click="activeType = getTypeValue(type)"
        >
          <text>{{type}}</text>
        </view>
      </view>

      <!-- 分类列表 -->
      <view class="category-grid">
        <view class="category-item" 
              v-for="item in filteredCategories" 
              :key="item.id"
              @tap="editTag(item)"
              @touchstart="touchStart(item)"
              @touchend="touchEnd(item)"
              @touchmove="touchMove">
          <view class="icon" :class="[`tag-type-${item.inoutType}`, `tag-style-${item.tagType}`]">
            <text class="icon-text">{{item.name.substring(0, 1)}}</text>
          </view>
          <text class="name">{{item.name}}</text>
        </view>
        
        <!-- 添加按钮 -->
        <view class="category-item add-item" @click="addTag">
          <view class="icon add-icon">
            <text class="icon-text">+</text>
          </view>
          <text class="name">添加</text>
        </view>
      </view>
    </view>

    <!-- 标签编辑弹窗 -->
    <view v-if="showPopup" class="modal-wrapper">
      <view class="modal-mask" @click="closeModal"></view>
      <view class="tag-modal">
        <view class="modal-header">
          <text class="title">{{currentTag ? '编辑标签' : '新增标签'}}</text>
          <view class="close-btn" @click="closeModal">
            <icon type="icon-guanbi" size="32" color="#999"></icon>
          </view>
        </view>
        
        <view class="modal-content">
          <view class="form-item">
            <text class="label">标签名称</text>
            <input type="text" v-model="tagForm.name" placeholder="请输入标签名称" />
          </view>
          
          <view class="form-item">
            <text class="label">收支类型</text>
            <view class="type-display">
              {{tagForm.inoutType === 1 ? '支出' : tagForm.inoutType === 2 ? '收入' : '不计入收支'}}
            </view>
          </view>
          
          <view class="form-item">
            <text class="label">标签类型</text>
            <view class="button-group">
              <view 
                v-for="option in tagTypeOptions" 
                :key="option.value"
                :class="['button-option', tagForm.tagType === option.value ? 'active' : '']"
                @click="tagForm.tagType = option.value"
              >
                {{option.label}}
              </view>
            </view>
          </view>
          
          <view class="form-item" v-if="tagForm.tagType === 1">
            <text class="label">账户类型</text>
            <view class="button-group">
              <view 
                v-for="(option, index) in accountTypeOptions" 
                :key="index"
                :class="['button-option', tagForm.accountType === index + 1 ? 'active' : '']"
                @click="tagForm.accountType = index + 1"
              >
                {{option}}
              </view>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <view class="footer-left" v-if="currentTag">
            <button class="delete-btn" @click="showDeleteConfirm(currentTag)">删除</button>
          </view>
          <view class="footer-right">
            <button class="cancel-btn" @click="closeModal">取消</button>
            <button class="confirm-btn" @click="saveTag">保存</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import Icon from '@/components/icon/icon.vue'

// 当前选择的分类类型
const activeType = ref('expense')

// 弹窗显示状态
const showPopup = ref(false)

// 当前编辑的标签
const currentTag = ref(null)

// 标签表单数据
const tagForm = ref({
  name: '',
  inoutType: 1, // 1: 支出, 2: 收入, 3: 不计入收支
  tagType: 2, // 1: 账户类型, 2: 账单类型
  accountType: null,
})

// 标签类型选项
const tagTypeOptions = [
  { value: 1, label: '支付方式' },
  { value: 2, label: '账单类型' }
]

// 账户类型选项
const accountTypeOptions = ['储蓄账户', '信用账户']

// 计算当前选中的账户类型索引
const accountTypeIndex = computed(() => {
  if (!tagForm.value.accountType) return 0
  return tagForm.value.accountType - 1
})

// 标签列表数据
const categories = ref([])

// 根据当前选择的类型过滤分类列表
const filteredCategories = computed(() => {
  const typeMap = {
    'expense': 1,
    'income': 2,
    'other': 3
  }
  return categories.value.filter(item => item.inoutType === typeMap[activeType.value])
})

// 获取类型值
const getTypeValue = (type) => {
  const typeMap = {
    '支出': 'expense',
    '收入': 'income',
    '不计入收支': 'other'
  }
  return typeMap[type]
}

// 获取标签列表
const fetchTags = async () => {
  try {
    uni.showLoading({
      title: '加载中...'
    })
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: '/api/tags',
        method: 'GET',
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })

    uni.hideLoading()

    if (response.statusCode === 200 && response.data.code === 200) {
      categories.value = response.data.data
    } else {
      uni.showToast({
        title: response.data?.message || '获取标签失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取标签失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 添加标签
const addTag = async () => {
  currentTag.value = null
  resetForm()
  // 设置收支类型为当前选中的类型
  const typeMap = {
    'expense': 1,
    'income': 2,
    'other': 3
  }
  tagForm.value.inoutType = typeMap[activeType.value]
  showPopup.value = true
}

// 编辑标签
const editTag = async (tag) => {
  try {
    uni.showLoading({
      title: '加载中...'
    })
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: `/api/tags/${tag.id}`,
        method: 'GET',
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })

    uni.hideLoading()

    if (response.statusCode === 200 && response.data.code === 200) {
      currentTag.value = tag
      tagForm.value = { ...response.data.data }
      // 编辑时不允许修改收支类型
      showPopup.value = true
    } else {
      uni.showToast({
        title: response.data?.message || '获取标签详情失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取标签详情失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 触摸相关变量
const touchTimer = ref(null)
const touchStartTime = ref(0)
const touchItem = ref(null)
const isTouchMoved = ref(false)

// 触摸开始
const touchStart = (item) => {
  console.log('触摸开始:', item.name)
  touchItem.value = item
  isTouchMoved.value = false
  touchStartTime.value = Date.now()
  
  // 设置长按定时器
  touchTimer.value = setTimeout(() => {
    if (!isTouchMoved.value) {
      console.log('长按触发:', item.name)
      uni.vibrateShort() // 添加短震动反馈
      showDeleteConfirm(item)
    }
  }, 800) // 800毫秒长按阈值
}

// 触摸结束
const touchEnd = (item) => {
  console.log('触摸结束:', item.name)
  // 清除长按定时器
  if (touchTimer.value) {
    clearTimeout(touchTimer.value)
    touchTimer.value = null
  }
  
  // 如果不是长按且没有移动，则视为点击
  const touchDuration = Date.now() - touchStartTime.value
  if (touchDuration < 800 && !isTouchMoved.value) {
    console.log('点击触发:', item.name)
    editTag(item)
  }
}

// 触摸移动
const touchMove = () => {
  // 标记为已移动，取消长按
  isTouchMoved.value = true
  if (touchTimer.value) {
    clearTimeout(touchTimer.value)
    touchTimer.value = null
  }
}

// 显示删除确认弹窗
const showDeleteConfirm = (tag) => {
  console.log('显示删除确认弹窗:', tag.name) // 添加日志以便调试
  uni.showModal({
    title: '删除标签',
    content: `确定要删除"${tag.name}"标签吗？`,
    confirmText: '删除',
    confirmColor: '#EE6666',
    success: (res) => {
      if (res.confirm) {
        console.log('用户确认删除') // 添加日志以便调试
        deleteTag(tag)
      } else {
        console.log('用户取消删除') // 添加日志以便调试
      }
    }
  })
}

// 删除标签
const deleteTag = async (tag) => {
  try {
    uni.showLoading({
      title: '删除中...'
    })

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: `/api/tags/${tag.id}`,
        method: 'DELETE',
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })

    uni.hideLoading()

    if (response.statusCode === 200 && response.data.code === 200) {
      uni.showToast({
        title: '删除成功',
        icon: 'success'
      })
      // 关闭编辑弹框
      closeModal()
      // 重新获取标签列表
      fetchTags()
    } else {
      uni.showToast({
        title: response.data?.message || '删除失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('删除标签失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 选择图标
const selectIcon = (iconValue) => {
  tagForm.value.icon = iconValue
}

// 处理标签类型变化
const handleTagTypeChange = (e) => {
  const newTagType = tagTypeOptions[e.detail.value].value
  tagForm.value.tagType = newTagType
  // 如果切换到非支付方式，清空账户类型
  if (newTagType !== 1) {
    tagForm.value.accountType = null
  }
}

// 处理账户类型变化
const handleAccountTypeChange = (e) => {
  tagForm.value.accountType = e.detail.value + 1
}

// 获取账户类型名称
const getAccountTypeName = (type) => {
  if (!type) return ''
  return accountTypeOptions[type - 1]
}

// 保存标签
const saveTag = async () => {
  // 表单验证
  if (!tagForm.value.name) {
    uni.showToast({
      title: '请输入标签名称',
      icon: 'none'
    })
    return
  }
  
  // 如果是账户类型标签，需要选择账户类型
  if (tagForm.value.tagType === 1 && !tagForm.value.accountType) {
    uni.showToast({
      title: '请选择账户类型',
      icon: 'none'
    })
    return
  }
  
  try {
    const url = currentTag.value ? `/api/tags/${currentTag.value.id}` : '/api/tags'
    const method = currentTag.value ? 'PUT' : 'POST'
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url,
        method,
        data: {
          name: tagForm.value.name,
          inoutType: tagForm.value.inoutType,
          tagType: tagForm.value.tagType,
          accountType: tagForm.value.accountType,
        },
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
    
    if (response.statusCode === 200 && response.data.code === 200) {
      uni.showToast({
        title: currentTag.value ? '更新成功' : '添加成功',
        icon: 'success'
      })
      closeModal()
      fetchTags() // 重新获取标签列表
    } else {
      uni.showToast({
        title: response.data?.message || '操作失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('保存标签失败:', error)
    uni.showToast({
      title: '操作失败，请稍后重试',
      icon: 'none'
    })
  }
}

// 关闭弹窗
const closeModal = () => {
  showPopup.value = false
  setTimeout(() => {
    resetForm()
  }, 200)
}

// 重置表单
const resetForm = () => {
  tagForm.value = {
    name: '',
    inoutType: activeType.value === 'expense' ? 1 : 
              activeType.value === 'income' ? 2 : 3,
    tagType: 2,
    accountType: null,
  }
}

// 页面加载时获取标签列表
onMounted(() => {
  fetchTags()
})
</script>

<style lang="scss">
.container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.section {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .section-header {
    margin-bottom: 30rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }
    
    .subtitle {
      font-size: 24rpx;
      color: #999;
      margin-left: 16rpx;
    }
  }
}

.type-tabs {
  display: flex;
  margin-bottom: 30rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 4rpx;
  
  .tab-item {
    flex: 1;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: #666;
    border-radius: 8rpx;
    transition: all 0.3s ease;
    
    &.active {
      background-color: #4CAF50;
      color: #fff;
    }
  }
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  
  .category-item {
    width: 25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx 0;
    
    .icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10rpx;
      
      &.tag-type-1 {
        background-color: #EE6666; // 支出
        
        &.tag-style-1 {
          background: linear-gradient(135deg, #FF9800, #EE6666); // 支付方式
        }
        
        &.tag-style-2 {
          background: linear-gradient(135deg, #EE6666, #9C27B0); // 账单类型
        }
      }
      
      &.tag-type-2 {
        background-color: #91CC75; // 收入
        
        &.tag-style-1 {
          background: linear-gradient(135deg, #4CAF50, #91CC75); // 支付方式
        }
        
        &.tag-style-2 {
          background: linear-gradient(135deg, #91CC75, #2196F3); // 账单类型
        }
      }
      
      &.tag-type-3 {
        background-color: #73C0DE; // 不计入收支
        
        &.tag-style-1 {
          background: linear-gradient(135deg, #00BCD4, #73C0DE); // 支付方式
        }
        
        &.tag-style-2 {
          background: linear-gradient(135deg, #73C0DE, #3F51B5); // 账单类型
        }
      }
      
      &.add-icon {
        background-color: #4CAF50; // 添加按钮使用绿色
        box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
        transition: all 0.3s ease;
        
        .icon-text {
          font-size: 40rpx; // 加号图标更大
          font-weight: normal;
        }
      }
      
      .icon-text {
        color: #fff;
        font-size: 28rpx;
        font-weight: bold;
      }
    }
    
    .name {
      font-size: 24rpx;
      color: #333;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    &.add-item {
      .name {
        color: #4CAF50; // 添加按钮的文字使用绿色
        font-weight: 500;
      }
    }
  }
}

.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.tag-modal {
  position: relative;
  z-index: 1000;
  width: 600rpx;
  background-color: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: modalFadeIn 0.3s ease;
  
  .modal-header {
    padding: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    
    .title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }
  }
  
  .modal-content {
    padding: 30rpx;
    
    .form-item {
      margin-bottom: 30rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
        display: block;
      }
      
      input {
        width: 100%;
        height: 80rpx;
        background-color: #f5f5f5;
        border-radius: 12rpx;
        padding: 0 24rpx;
        font-size: 28rpx;
        color: #333;
      }
      
      .picker-value {
        width: 100%;
        height: 80rpx;
        background-color: #f5f5f5;
        border-radius: 12rpx;
        padding: 0 24rpx;
        font-size: 28rpx;
        color: #333;
        display: flex;
        align-items: center;
      }
    }
  }
  
  .modal-footer {
    padding: 20rpx 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #eee;
    
    .footer-left {
      .delete-btn {
        width: 160rpx;
        height: 72rpx;
        border-radius: 36rpx;
        font-size: 28rpx;
        background-color: #f5f5f5;
        color: #EE6666;
      }
    }
    
    .footer-right {
      display: flex;
      
      button {
        width: 160rpx;
        height: 72rpx;
        border-radius: 36rpx;
        font-size: 28rpx;
        margin-left: 20rpx;
        
        &.cancel-btn {
          background-color: #f5f5f5;
          color: #666;
        }
        
        &.confirm-btn {
          background-color: #4CAF50;
          color: #fff;
        }
      }
    }
  }
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.icon-selector {
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    max-height: 600rpx;
    overflow-y: auto;
    padding: 10rpx;
    
    &::-webkit-scrollbar {
      width: 4rpx;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: #ddd;
      border-radius: 2rpx;
    }
    
    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20rpx;
      border-radius: 16rpx;
      transition: all 0.3s ease;
      cursor: pointer;
      
      &:active {
        transform: scale(0.95);
      }
      
      &.active {
        .icon-wrapper {
          background-color: #e8f5e9;
          border: 2rpx solid #4CAF50;
          box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.2);
        }
        
        .icon-label {
          color: #4CAF50;
        }
      }
      
      .icon-wrapper {
        width: 96rpx;
        height: 96rpx;
        background-color: #f5f5f5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12rpx;
        transition: all 0.3s ease;
      }
      
      .icon-label {
        font-size: 24rpx;
        color: #666;
        text-align: center;
      }
    }
  }
}

.type-display {
  width: 100%;
  height: 80rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #666;
  display: flex;
  align-items: center;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  
  .button-option {
    flex: 1;
    min-width: 160rpx;
    height: 80rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: #666;
    transition: all 0.3s ease;
    
    &.active {
      background-color: #4CAF50;
      color: #fff;
      box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.3);
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}
</style> 