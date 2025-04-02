<template>
  <view class="container">
    <view class="section">
      <view class="section-header">
        <text class="title">分类管理</text>
        <text class="subtitle">长按拖动分类可排序，轻触编辑，长按删除</text>
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
              v-for="(item, index) in filteredCategories" 
              :key="item.id"
              @click="editTag(item)"
              @longpress="deleteTag(item)">
          <view class="icon-wrapper">
            <icon :type="item.icon" size="48" color="#ffffff" background="#4CAF50"></icon>
          </view>
          <text class="name">{{item.name}}</text>
        </view>
        
        <!-- 添加按钮 -->
        <view class="category-item add-item" @click="addTag">
          <view class="icon-wrapper">
            <icon type="icon-tianjia" size="48" color="#ffffff" background="#4CAF50"></icon>
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
            <picker :value="tagForm.inoutType - 1" :range="['支出', '收入', '不计入收支']" @change="(e) => tagForm.inoutType = parseInt(e.detail.value) + 1">
              <view class="picker-value">
                {{tagForm.inoutType === 1 ? '支出' : tagForm.inoutType === 2 ? '收入' : '不计入收支'}}
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="label">标签类别</text>
            <picker :value="tagForm.tagType - 1" :range="tagTypeOptions" range-key="label" @change="handleTagTypeChange">
              <view class="picker-value">
                {{tagTypeOptions.find(item => item.value === tagForm.tagType)?.label}}
              </view>
            </picker>
          </view>
          
          <view class="form-item" v-if="tagForm.tagType === 1">
            <text class="label">账户类型</text>
            <picker :value="tagForm.accountType ? tagForm.accountType - 1 : -1" :range="accountTypeOptions" range-key="label" @change="(e) => tagForm.accountType = e.detail.value === -1 ? null : accountTypeOptions[e.detail.value].value">
              <view class="picker-value">
                {{tagForm.accountType ? accountTypeOptions.find(item => item.value === tagForm.accountType)?.label : '请选择'}}
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="label">图标</text>
            <view class="icon-selector">
              <view class="icon-grid">
                <view v-for="(icon, index) in iconOptions" 
                      :key="index"
                      :class="['icon-item', tagForm.icon === icon.value ? 'active' : '']"
                      @click="selectIcon(icon.value)">
                  <view class="icon-wrapper">
                    <icon :type="icon.value" size="48" :color="tagForm.icon === icon.value ? '#4CAF50' : '#666666'" :background="tagForm.icon === icon.value ? '#e8f5e9' : '#f5f5f5'"></icon>
                  </view>
                  <text class="icon-label">{{icon.label}}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="saveTag">确定</button>
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
  inoutType: 1,
  tagType: 2,
  accountType: null,
  icon: 'icon-qita'
})

// 标签类型选项
const tagTypeOptions = [
  { value: 1, label: '支付方式' },
  { value: 2, label: '消费类型' },
  { value: 3, label: '收入类型' }
]

// 账户类型选项
const accountTypeOptions = [
  { value: 1, label: '储蓄卡' },
  { value: 2, label: '信用卡' },
  { value: 3, label: '现金' },
  { value: 4, label: '支付宝' },
  { value: 5, label: '微信' }
]

// 图标选项
const iconOptions = [
  { value: 'icon-canyin', label: '餐饮' },
  { value: 'icon-jiaotong', label: '交通' },
  { value: 'icon-zhufang', label: '住房' },
  { value: 'icon-fushi', label: '服饰' },
  { value: 'icon-jiaoyu', label: '教育' },
  { value: 'icon-yiliao', label: '医疗' },
  { value: 'icon-gouwu', label: '购物' },
  { value: 'icon-renqing', label: '人情' },
  { value: 'icon-baoxian', label: '保险' },
  { value: 'icon-qita', label: '其他' },
  { value: 'icon-qianbao', label: '钱包' },
  { value: 'icon-xinyongka', label: '信用卡' },
  { value: 'icon-zhifubao', label: '支付宝' },
  { value: 'icon-weixin', label: '微信' },
  { value: 'icon-gongzi', label: '工资' },
  { value: 'icon-jiangjin', label: '奖金' },
  { value: 'icon-touzi', label: '投资' },
  { value: 'icon-zhuanzhang', label: '转账' }
]

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

// 删除标签
const deleteTag = async (tag) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该标签吗？',
    success: async (res) => {
      if (res.confirm) {
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
            fetchTags() // 重新获取标签列表
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
    }
  })
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

// 保存标签
const saveTag = async () => {
  if (!tagForm.value.name) {
    uni.showToast({
      title: '请输入标签名称',
      icon: 'none'
    })
    return
  }

  try {
    uni.showLoading({
      title: '保存中...'
    })

    const url = currentTag.value ? `/api/tags/${currentTag.value.id}` : '/api/tags'
    const method = currentTag.value ? 'PUT' : 'POST'

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url,
        method,
        data: tagForm.value,
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
        title: currentTag.value ? '修改成功' : '添加成功',
        icon: 'success'
      })
      closeModal()
      fetchTags() // 重新获取标签列表
    } else {
      uni.showToast({
        title: response.data?.message || (currentTag.value ? '修改失败' : '添加失败'),
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('保存标签失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
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
    icon: 'icon-qita'
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
      margin-top: 8rpx;
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30rpx;
  
  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .icon-wrapper {
      width: 96rpx;
      height: 96rpx;
      margin-bottom: 12rpx;
    }
    
    .name {
      font-size: 24rpx;
      color: #333;
    }
    
    &.add-item {
      .name {
        color: #4CAF50;
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
    justify-content: flex-end;
    border-top: 1px solid #eee;
    
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
</style> 