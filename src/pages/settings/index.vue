<template>
  <view class="container">
    <!-- 设置列表 -->
    <view class="settings-list">
      <view class="settings-item" @click="toggleDrawer">
        <view class="item-left">
          <text class="icon">🏷️</text>
          <text class="title">分类管理</text>
        </view>
        <text class="arrow" :class="{ 'arrow-down': isDrawerOpen }">></text>
      </view>

      <!-- 抽屉内容 -->
      <view class="drawer-content" :class="{ 'drawer-open': isDrawerOpen }">
        <view class="drawer-inner">
          <view class="drawer-header">
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
          <scroll-view scroll-y class="drawer-scroll">
            <view class="category-section" v-for="(group, groupIndex) in groupedCategories" :key="groupIndex">
              <view class="group-header">
                <text class="group-title">{{getTagTypeLabel(group.tagType)}}</text>
              </view>
              <view class="category-grid">
                <view class="category-item" 
                      v-for="item in group.items" 
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
              </view>
            </view>

            <!-- 添加按钮 -->
            <view class="add-button-section">
              <view class="category-item add-item" @click="addTag">
                <view class="add-button-wrapper">
                  <view class="icon add-icon">
                    <text class="icon-text">+</text>
                  </view>
                  <text class="name">添加</text>
                </view>
              </view>
            </view>
          </scroll-view>
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
            <text class="close-icon">×</text>
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
          
          <view class="form-item" v-if="tagForm.inoutType !== 3">
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
          
          <view class="form-item" v-if="tagForm.tagType === 1 && tagForm.inoutType !== 3">
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

          <!-- 信用账户特有字段 -->
          <view class="form-item" v-if="tagForm.tagType === 1 && tagForm.accountType === 2">
            <text class="label">信用额度</text>
            <input type="number" v-model="tagForm.creditLimit" placeholder="请输入信用额度" />
          </view>

          <view class="form-item" v-if="tagForm.tagType === 1 && tagForm.accountType === 2">
            <text class="label">账单日</text>
            <picker mode="selector" :range="Array.from({length: 31}, (_, i) => i + 1)" @change="(e) => tagForm.creditBillDay = e.detail.value + 1">
              <view class="picker-value">{{tagForm.creditBillDay || '请选择账单日'}}</view>
            </picker>
          </view>

          <view class="form-item" v-if="tagForm.tagType === 1 && tagForm.accountType === 2">
            <text class="label">还款日</text>
            <picker mode="selector" :range="Array.from({length: 31}, (_, i) => i + 1)" @change="(e) => tagForm.creditPayDay = e.detail.value + 1">
              <view class="picker-value">{{tagForm.creditPayDay || '请选择还款日'}}</view>
            </picker>
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
import { API } from '@/config'

// 抽屉状态
const isDrawerOpen = ref(false)

// 切换抽屉状态
const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value
  if (isDrawerOpen.value) {
    fetchTags() // 打开抽屉时获取数据
  }
}

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
  creditLimit: null, // 信用账户额度
  creditBillDay: null, // 账单日
  creditPayDay: null, // 还款日
})

// 标签类型选项
const tagTypeOptions = [
  { value: 1, label: '支付方式' },
  { value: 2, label: '账单类型' },
  { value: 3, label: '归属人' }
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
    // 检查token和userId
    const token = uni.getStorageSync('token')
    const userId = uni.getStorageSync('userId')
    if (!token || !userId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    uni.showLoading({
      title: '加载中...'
    })
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.TAGS.LIST,
        method: 'GET',
        data: {
          userId: userId
        },
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
      categories.value = response.data.data || []
    } else if (response.statusCode === 401) {
      // 401错误会被请求拦截器处理，这里不需要额外处理
      return
    } else {
      throw new Error(response.data?.message || '获取标签失败')
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取标签失败:', error)
    uni.showToast({
      title: error.message || '网络错误，请检查网络连接',
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
  
  // 如果是"不计入收支"类型，默认设置为账单类型
  if (tagForm.value.inoutType === 3) {
    tagForm.value.tagType = 2 // 账单类型
    tagForm.value.accountType = null
  }
  
  showPopup.value = true
}

// 编辑标签
const editTag = async (tag) => {
  try {
    // 检查token和userId
    const token = uni.getStorageSync('token')
    const userId = uni.getStorageSync('userId')
    if (!token || !userId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    uni.showLoading({
      title: '加载中...'
    })
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.TAGS.UPDATE(tag.id),
        method: 'GET',
        data: {
          userId: userId
        },
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
      showPopup.value = true
    } else if (response.statusCode === 401) {
      // 401错误会被请求拦截器处理，这里不需要额外处理
      return
    } else {
      throw new Error(response.data?.message || '获取标签详情失败')
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取标签详情失败:', error)
    uni.showToast({
      title: error.message || '网络错误，请检查网络连接',
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
    // 检查token和userId
    const token = uni.getStorageSync('token')
    const userId = uni.getStorageSync('userId')
    if (!token || !userId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    uni.showLoading({
      title: '删除中...'
    })

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.TAGS.DELETE(tag.id),
        method: 'DELETE',
        data: {
          userId: userId
        },
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
      closeModal()
      fetchTags()
    } else if (response.statusCode === 401) {
      // 401错误会被请求拦截器处理，这里不需要额外处理
      return
    } else {
      throw new Error(response.data?.message || '删除失败')
    }
  } catch (error) {
    uni.hideLoading()
    console.error('删除标签失败:', error)
    uni.showToast({
      title: error.message || '网络错误，请检查网络连接',
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

  // 信用账户特有字段验证
  if (tagForm.value.tagType === 1 && tagForm.value.accountType === 2) {
    if (!tagForm.value.creditLimit) {
      uni.showToast({
        title: '请输入信用额度',
        icon: 'none'
      })
      return
    }
    if (!tagForm.value.creditBillDay) {
      uni.showToast({
        title: '请选择账单日',
        icon: 'none'
      })
      return
    }
    if (!tagForm.value.creditPayDay) {
      uni.showToast({
        title: '请选择还款日',
        icon: 'none'
      })
      return
    }
  }
  
  try {
    // 检查token和userId
    const token = uni.getStorageSync('token')
    const userId = uni.getStorageSync('userId')
    if (!token || !userId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    const url = currentTag.value ? 
      API.TAGS.UPDATE(currentTag.value.id) : 
      API.TAGS.CREATE
    const method = currentTag.value ? 'PUT' : 'POST'
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url,
        method,
        data: {
          userId: userId,
          name: tagForm.value.name,
          inoutType: tagForm.value.inoutType,
          tagType: tagForm.value.tagType,
          accountType: tagForm.value.accountType,
          creditLimit: tagForm.value.creditLimit,
          creditBillDay: tagForm.value.creditBillDay,
          creditPayDay: tagForm.value.creditPayDay,
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
      fetchTags()
    } else if (response.statusCode === 401) {
      // 401错误会被请求拦截器处理，这里不需要额外处理
      return
    } else {
      throw new Error(response.data?.message || '操作失败')
    }
  } catch (error) {
    console.error('保存标签失败:', error)
    uni.showToast({
      title: error.message || '操作失败，请稍后重试',
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
    creditLimit: null,
    creditBillDay: null,
    creditPayDay: null,
  }
}

// 页面加载时获取标签列表
onMounted(() => {
  fetchTags()
  // 确保抽屉默认是关闭状态
  isDrawerOpen.value = false
})

// 根据标签类型分组的分类列表
const groupedCategories = computed(() => {
  const typeMap = {
    'expense': 1,
    'income': 2,
    'other': 3
  }
  const currentType = typeMap[activeType.value]
  
  // 筛选当前类型的标签
  const filteredTags = categories.value.filter(item => item.inoutType === currentType)
  
  // 按tagType分组
  const groups = {}
  filteredTags.forEach(tag => {
    if (!groups[tag.tagType]) {
      groups[tag.tagType] = {
        tagType: tag.tagType,
        items: []
      }
    }
    groups[tag.tagType].items.push(tag)
  })
  
  // 转换为数组并排序
  return Object.values(groups).sort((a, b) => a.tagType - b.tagType)
})

// 获取标签类型的显示名称
const getTagTypeLabel = (tagType) => {
  const option = tagTypeOptions.find(opt => opt.value === tagType)
  return option ? option.label : '未知类型'
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.settings-list {
  margin-top: 20rpx;
  background-color: #fff;
  
  .settings-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #eee;
    
    .item-left {
      display: flex;
      align-items: center;
      
      .icon {
        margin-right: 20rpx;
        font-size: 36rpx;
      }
      
      .title {
        font-size: 28rpx;
        color: #333;
      }
    }
    
    .arrow {
      color: #999;
      font-size: 24rpx;
      transition: transform 0.3s ease;
      
      &.arrow-down {
        transform: rotate(90deg);
      }
    }
  }
}

.drawer-content {
  height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #fff;
  
  &.drawer-open {
    height: auto;
    padding: 20rpx 0;
  }
  
  .drawer-inner {
    padding: 20rpx 30rpx;
  }
  
  .drawer-header {
    margin-bottom: 20rpx;
    
    .subtitle {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .drawer-scroll {
    max-height: calc(100vh - 400rpx);
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

.category-section {
  margin-bottom: 30rpx;
  
  .group-header {
    padding: 10rpx 20rpx;
    margin-bottom: 10rpx;
    
    .group-title {
      font-size: 28rpx;
      color: #666;
      font-weight: 500;
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

.add-button-section {
  display: flex;
  justify-content: center;
  padding: 20rpx;
  margin-top: 20rpx;
  
  .category-item {
    width: auto;
    
    .add-button-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20rpx 40rpx;
      border-radius: 16rpx;
      background-color: #f9f9f9;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      
      &:active {
        transform: scale(0.98);
        background-color: #f5f5f5;
      }
      
      .add-icon {
        width: 80rpx;
        height: 80rpx;
        background: linear-gradient(135deg, #4CAF50, #8BC34A);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16rpx;
        box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.3);
        
        .icon-text {
          color: #fff;
          font-size: 40rpx;
          font-weight: bold;
          line-height: 1;
        }
      }
      
      .name {
        font-size: 28rpx;
        color: #4CAF50;
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
  max-height: 80vh;
  margin: 40rpx 0;
  background-color: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: modalFadeIn 0.3s ease;
  display: flex;
  flex-direction: column;
  
  .modal-header {
    padding: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
    
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
      
      .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 12rpx;
      }
      
      input {
        width: 100%;
        height: 80rpx;
        font-size: 28rpx;
        border: 2rpx solid #ddd;
        border-radius: 8rpx;
        padding: 0 20rpx;
        box-sizing: border-box;
        background-color: #fff;
        transition: all 0.3s ease;
        
        &:focus {
          border-color: #4CAF50;
          outline: none;
        }
      }
      
      .type-display {
        font-size: 28rpx;
        color: #666;
        height: 80rpx;
        line-height: 80rpx;
        padding: 0 20rpx;
        border: 2rpx solid #ddd;
        border-radius: 8rpx;
        background-color: #f8f8f8;
      }
      
      .picker-value {
        font-size: 28rpx;
        color: #666;
        height: 80rpx;
        line-height: 80rpx;
        padding: 0 20rpx;
        border: 2rpx solid #ddd;
        border-radius: 8rpx;
        background-color: #fff;
        
        &:active {
          background-color: #f8f8f8;
        }
      }
    }
    flex: 1;
    overflow-y: auto;
    
    .form-item {
      margin-bottom: 30rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .modal-footer {
    padding: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #eee;
    flex-shrink: 0;
    
    .footer-left, .footer-right {
      display: flex;
      gap: 20rpx;
      flex: 1;
    }
    
    .footer-right {
      justify-content: flex-end;
      
      button {
        flex: 1;
        max-width: 180rpx;
      }
    }
    
    button {
      font-size: 28rpx;
      padding: 12rpx 30rpx;
      border-radius: 8rpx;
      flex: 1;
      max-width: 180rpx;
    }
    
    .delete-btn {
      background-color: #fff;
      color: #EE6666;
      border: 1px solid #EE6666;
    }
    
    .cancel-btn {
      background-color: #f5f5f5;
      color: #666;
    }
    
    .confirm-btn {
      background-color: #4CAF50;
      color: #fff;
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

.input-field {
  width: 100%;
  height: 64rpx;
  padding: 0 20rpx;
  border: 1px solid #eee;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.picker-view {
  width: 100%;
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 20rpx;
  border: 1px solid #eee;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #fff;
}

.picker-view:active {
  background-color: #f5f5f5;
}
</style>