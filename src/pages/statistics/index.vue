<template>
  <view class="container">
    <!-- 顶部统计 -->
    <view class="header">
      <view class="month-picker">
        <view class="month-switcher">
          <view class="arrow left-arrow" @click="switchMonth(-1)">
            <text class="icon-text">&lt;</text>
          </view>
          <picker mode="date" fields="month" :value="currentDate" @change="handleDateChange">
            <view class="picker-text">{{formatDate(currentDate)}}</view>
          </picker>
          <view class="arrow right-arrow" @click="switchMonth(1)">
            <text class="icon-text">&gt;</text>
          </view>
        </view>
      </view>
      
      <view class="header-controls">
        <view class="tab-switch">
          <text 
            :class="['tab-item', activeTab === 'expense' ? 'active' : '']" 
            @click="switchTab('expense')"
          >支出</text>
          <text 
            :class="['tab-item', activeTab === 'income' ? 'active' : '']" 
            @click="switchTab('income')"
          >入账</text>
        </view>
        
        <view class="filters">
          <!-- 新增标签类别筛选 -->
          <view class="filter-item">
            <picker :range="tagTypes" @change="handleTagTypeChange">
              <view class="picker-content">
                <text :class="['placeholder', selectedTagType ? 'selected' : '']">{{selectedTagType || '标签类别'}}</text>
                <text class="icon-text">▼</text>
              </view>
            </picker>
          </view>
          
          <!-- 账户类型筛选 -->
          <view class="filter-item">
            <picker :range="accountTypes" @change="handleAccountTypeChange">
              <view class="picker-content">
                <text :class="['placeholder', selectedAccountType ? 'selected' : '']">{{selectedAccountType || '账户类型'}}</text>
                <text class="icon-text">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
      
      <view class="total-amount">
        <text class="label">共{{activeTab === 'expense' ? '支出' : '入账'}}</text>
        <text class="amount">¥ {{activeTab === 'expense' ? totalExpense : totalIncome}}</text>
      </view>
    </view>

    <!-- 支出/收入构成 -->
    <view class="chart-section">
      <text class="section-title">{{activeTab === 'expense' ? '支出' : '收入'}}构成</text>
      <view class="chart-container">
        <!-- 使用列表和进度条代替饼图 -->
        <view class="category-list-chart">
          <view class="no-data" v-if="categories.length === 0">
            <text>暂无数据</text>
          </view>
          <view class="category-item-chart" v-for="(item, index) in categories" :key="index">
            <view class="category-info">
              <view class="icon-wrapper" :style="{ backgroundColor: item.color }">
                <text class="icon-text">{{item.name.substring(0, 1)}}</text>
              </view>
              <view class="category-detail">
                <text class="name">{{item.name}}</text>
                <text class="percent">{{item.percent}}%</text>
              </view>
            </view>
            <view class="progress-bar">
              <view class="progress" :style="{ width: item.percent + '%', backgroundColor: item.color }"></view>
            </view>
            <text class="amount">¥{{item.amount}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <view class="tab-bar">
      <view class="tab-item" @click="navigateTo('/pages/index/index')">
        <text class="tab-icon">📋</text>
        <text>明细</text>
      </view>
      <view class="tab-item active">
        <text class="tab-icon">📊</text>
        <text>统计</text>
      </view>
      <view class="tab-item" @click="navigateTo('/pages/settings/index')">
        <text class="tab-icon">⚙️</text>
        <text>设置</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 当前选择的日期
const currentDate = ref(formatDefaultDate())

// 当前选中的标签（支出/入账）
const activeTab = ref('expense')

// 总支出和总入账金额
const totalExpense = ref('0.00')
const totalIncome = ref('0.00')

// 账单数据
const billList = ref([])

// 标签类别选项
const tagTypes = ref(['账单类型', '支付方式'])
const selectedTagType = ref('账单类型')

// 账户类型选项
const accountTypes = ref(['全部', '储蓄账户', '信用账户'])
const selectedAccountType = ref('')

// 分类数据
const expenseCategories = ref([])
const incomeCategories = ref([])

// 处理标签类别选择
const handleTagTypeChange = (e) => {
  selectedTagType.value = tagTypes.value[e.detail.value]
  queryBills() // 选择标签类别后重新查询
}

// 处理账户类型选择
const handleAccountTypeChange = (e) => {
  selectedAccountType.value = accountTypes.value[e.detail.value]
  queryBills() // 选择账户类型后重新查询
}

// 获取默认日期（当前月份）
function formatDefaultDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

// 查询账单数据
const queryBills = async () => {
  try {
    const params = {
      userId: 1, // 这里暂时写死，实际应该从用户登录信息中获取
      month: currentDate.value,
      accountType: selectedAccountType.value === '储蓄账户' ? 1 :
                  selectedAccountType.value === '信用账户' ? 2 : undefined,
      tagType: selectedTagType.value === '账单类型' ? 2 : 1 // 根据选择传递对应的值
    }

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: '/api/bills/query',
        method: 'POST',
        data: params,
        header: {
          'content-type': 'application/json'
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
      billList.value = response.data.data
      calculateTotals()
      updateCategoryData()
    } else {
      uni.showToast({
        title: response.data?.message || '查询失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('查询账单失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 计算总收支
const calculateTotals = () => {
  let expense = 0
  let income = 0
  
  billList.value.forEach(bill => {
    if (bill.inoutType === 1) { // 支出
      expense += bill.amount
    } else if (bill.inoutType === 2) { // 收入
      income += bill.amount
    }
  })
  
  totalExpense.value = expense.toFixed(2)
  totalIncome.value = income.toFixed(2)
}

// 切换标签（支出/入账）
const switchTab = (tab) => {
  activeTab.value = tab
  updateCategoryData() // 更新分类数据
}

// 更新分类数据
const updateCategoryData = () => {
  const categoryStats = calculateCategoryStats()
  if (activeTab.value === 'expense') {
    expenseCategories.value = categoryStats
  } else {
    incomeCategories.value = categoryStats
  }
}

// 计算分类统计数据
const calculateCategoryStats = () => {
  const categoryMap = new Map()
  let total = 0
  
  // 根据当前标签筛选账单
  const filteredBills = billList.value.filter(bill => 
    (activeTab.value === 'expense' && bill.inoutType === 1) || 
    (activeTab.value === 'income' && bill.inoutType === 2)
  )
  
  // 计算总金额
  filteredBills.forEach(bill => {
    total += Math.abs(bill.amount)
  })
  
  // 按标签分组统计
  filteredBills.forEach(bill => {
    for (const tag of bill.tags) {
      if (!categoryMap.has(tag.name)) {
        categoryMap.set(tag.name, {
          name: tag.name,
          amount: 0,
          color: getTagColor(categoryMap.size) // 使用索引生成不同的颜色
        })
      }
      
      const category = categoryMap.get(tag.name)
      category.amount += Math.abs(bill.amount)
    }
  })
  
  // 转换为数组并计算百分比
  const result = Array.from(categoryMap.values()).map(category => {
    const amount = category.amount.toFixed(2)
    const percent = total > 0 ? Math.round((category.amount / total) * 100) : 0
    return {
      ...category,
      amount,
      percent
    }
  })
  
  // 按金额降序排序
  return result.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
}

// 获取标签颜色
const getTagColor = (index) => {
  const colors = ['#91CC75', '#FAC858', '#EE6666', '#73C0DE', '#3CA272', '#FC8452', '#9A60B4', '#ea7ccc']
  return colors[index % colors.length]
}

// 分类数据（根据当前标签显示）
const categories = computed(() => 
  activeTab.value === 'expense' ? expenseCategories.value : incomeCategories.value
)

// 格式化日期显示
const formatDate = (dateStr) => {
  const [year, month] = dateStr.split('-')
  return `${year}年${month}月`
}

// 切换月份
const switchMonth = (offset) => {
  const date = new Date(currentDate.value)
  date.setMonth(date.getMonth() + offset)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  currentDate.value = `${year}-${month}`
  
  // 月份切换后重新查询账单
  queryBills()
}

// 处理日期选择
const handleDateChange = (e) => {
  currentDate.value = e.detail.value
  
  // 日期变更后重新查询账单
  queryBills()
}

// 页面加载时查询数据
onMounted(() => {
  queryBills()
})

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
  background-color: #4CAF50;
  padding: 20rpx 30rpx 30rpx;
  color: #fff;
  
  .month-picker {
    padding: 30rpx 0;
    
    .month-switcher {
      display: flex;
      align-items: center;
      justify-content: center;
      
      .arrow {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        
        .icon-text {
          color: #fff;
          font-size: 24rpx;
        }
      }
      
      .picker-text {
        padding: 0 30rpx;
        font-size: 32rpx;
        color: #fff;
        font-weight: 500;
        &::after {
          content: none;
        }
      }
    }
  }
  
  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .tab-switch {
      display: flex;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8rpx;
      overflow: hidden;
      
      .tab-item {
        padding: 12rpx 24rpx;
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
        
        &.active {
          background-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
      }
    }
    
    .filters {
      display: flex;
      
      .filter-item {
        margin-left: 15rpx;
        
        .picker-content {
          display: flex;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 8rpx 16rpx;
          border-radius: 8rpx;
          
          .placeholder {
            font-size: 24rpx;
            color: rgba(255, 255, 255, 0.8);
            margin-right: 8rpx;
            
            &.selected {
              color: #fff;
            }
          }

          .icon-text {
            font-size: 16rpx;
            margin-left: 8rpx;
          }
        }
      }
    }
  }
  
  .total-amount {
    text-align: center;
    
    .label {
      font-size: 24rpx;
      margin-right: 10rpx;
    }
    
    .amount {
      font-size: 40rpx;
      font-weight: bold;
    }
  }
}

.chart-section {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  
  .section-title {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .chart-container {
    min-height: 300rpx;
    
    .no-data {
      height: 300rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 28rpx;
    }
    
    .category-list-chart {
      .category-item-chart {
        display: flex;
        flex-direction: column;
        margin-bottom: 30rpx;
        
        .category-info {
          display: flex;
          align-items: center;
          margin-bottom: 10rpx;
          
          .icon-wrapper {
            width: 60rpx;
            height: 60rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20rpx;
            
            .icon-text {
              color: #fff;
              font-size: 24rpx;
              font-weight: bold;
            }
          }
          
          .category-detail {
            flex: 1;
            
            .name {
              font-size: 28rpx;
              color: #333;
              margin-right: 10rpx;
            }
            
            .percent {
              font-size: 24rpx;
              color: #999;
            }
          }
        }
        
        .progress-bar {
          height: 20rpx;
          background-color: #f5f5f5;
          border-radius: 10rpx;
          overflow: hidden;
          margin: 10rpx 0;
          
          .progress {
            height: 100%;
            border-radius: 10rpx;
          }
        }
        
        .amount {
          align-self: flex-end;
          font-size: 28rpx;
          color: #333;
        }
      }
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
    
    .tab-icon {
      font-size: 32rpx;
      margin-bottom: 4rpx;
    }
  }
}
</style> 