<template>
  <view class="container">
    <!-- 顶部统计 -->
    <view class="header">
      <view class="month-picker">
        <view class="month-switcher">
          <view class="arrow" @click="switchMonth(-1)">
            <uni-icons type="left" size="18" color="#fff"></uni-icons>
          </view>
          <picker mode="date" fields="month" :value="currentDate" @change="handleDateChange">
            <view class="picker-text">{{formatDate(currentDate)}} ></view>
          </picker>
          <view class="arrow" @click="switchMonth(1)">
            <uni-icons type="right" size="18" color="#fff"></uni-icons>
          </view>
        </view>
      </view>
      <view class="filter-section">
        <view class="filter-item">
          <picker :range="billTypes" @change="handleBillTypeChange">
            <view class="picker-content">
              <text :class="['placeholder', selectedBillType ? 'selected' : '']">{{selectedBillType || '账单类型'}}</text>
              <uni-icons type="bottom" size="14" color="#fff"></uni-icons>
            </view>
          </picker>
        </view>
        <view class="filter-item">
          <picker :range="paymentMethods" @change="handlePaymentMethodChange">
            <view class="picker-content">
              <text :class="['placeholder', selectedPaymentMethod ? 'selected' : '']">{{selectedPaymentMethod || '支付方式'}}</text>
              <uni-icons type="bottom" size="14" color="#fff"></uni-icons>
            </view>
          </picker>
        </view>
        <view class="filter-item">
          <picker :range="accountTypes" @change="handleAccountTypeChange">
            <view class="picker-content">
              <text :class="['placeholder', selectedAccountType ? 'selected' : '']">{{selectedAccountType || '账户类型'}}</text>
              <uni-icons type="bottom" size="14" color="#fff"></uni-icons>
            </view>
          </picker>
        </view>
      </view>
      <view class="total-amount">
        <view class="amount-item">
          <text class="label">总支出¥</text>
          <text class="value">{{totalExpense}}</text>
        </view>
        <view class="amount-item">
          <text class="label">总入账¥</text>
          <text class="value">{{totalIncome}}</text>
        </view>
      </view>
    </view>

    <!-- 账单列表 -->
    <scroll-view scroll-y class="bill-list">
      <block v-for="(group, date) in billGroups" :key="date">
        <view class="date-group">
          <view class="date-header">
            <text class="date">{{group.date}}</text>
            <view class="daily-total">
              <text class="expense">支出 {{group.expense}}</text>
              <text class="income">收入 {{group.income}}</text>
            </view>
          </view>
          
          <view class="bill-items">
            <view class="bill-item" v-for="(item, index) in group.items" :key="index">
              <view class="left">
                <view class="icon" :class="item.type">
                  <uni-icons :type="item.icon" size="24" color="#fff"></uni-icons>
                </view>
                <view class="info">
                  <text class="title">{{item.title}}</text>
                  <text class="time">{{item.time}}</text>
                </view>
              </view>
              <text class="amount" :class="{'income': item.amount > 0}">{{item.amount > 0 ? '+' : ''}}{{item.amount}}</text>
            </view>
          </view>
        </view>
      </block>
    </scroll-view>

    <!-- 底部导航栏 -->
    <view class="tab-bar">
      <view class="tab-item active">
        <uni-icons type="list" size="24" color="#4CAF50"></uni-icons>
        <text>明细</text>
      </view>
      <view class="tab-item" @click="navigateTo('/pages/statistics/index')">
        <uni-icons type="chart" size="24" color="#666"></uni-icons>
        <text>统计</text>
      </view>
      <view class="tab-item" @click="navigateTo('/pages/settings/index')">
        <uni-icons type="gear" size="24" color="#666"></uni-icons>
        <text>设置</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 当前选择的日期
const currentDate = ref(formatDefaultDate())

// 总收支数据
const totalExpense = ref('0.00')
const totalIncome = ref('0.00')

// 账单数据
const billList = ref([])

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
      type: selectedBillType.value === '支出' ? '1' : 
            selectedBillType.value === '收入' ? '2' : 
            selectedBillType.value === '不计入收支' ? '3' : undefined
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
      processBillData()
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

// 处理账单数据，计算总收支和分组
const processBillData = () => {
  let expense = 0
  let income = 0
  const groups = new Map()

  billList.value.forEach(bill => {
    const date = new Date(bill.billDate)
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${getDayText(date)}`
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

    // 计算总收支
    if (bill.type === '1') { // 支出
      expense += parseFloat(bill.amount)
    } else if (bill.type === '2') { // 收入
      income += parseFloat(bill.amount)
    }

    // 分组处理
    if (!groups.has(dateStr)) {
      groups.set(dateStr, {
        date: dateStr,
        expense: '0.00',
        income: '0.00',
        items: []
      })
    }

    const group = groups.get(dateStr)
    if (bill.type === '1') {
      group.expense = (parseFloat(group.expense) + parseFloat(bill.amount)).toFixed(2)
    } else if (bill.type === '2') {
      group.income = (parseFloat(group.income) + parseFloat(bill.amount)).toFixed(2)
    }

    group.items.push({
      type: bill.type === '1' ? 'expense' : 'income',
      icon: bill.tags[0]?.icon || 'shop',
      title: bill.tags[0]?.name || '未分类',
      time: timeStr,
      amount: bill.type === '1' ? -parseFloat(bill.amount) : parseFloat(bill.amount)
    })
  })

  // 更新总收支
  totalExpense.value = expense.toFixed(2)
  totalIncome.value = income.toFixed(2)

  // 更新账单分组
  billGroups.value = Array.from(groups.values())
}

// 获取日期文本（今天/昨天/前天）
const getDayText = (date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const beforeYesterday = new Date(today)
  beforeYesterday.setDate(beforeYesterday.getDate() - 2)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else if (date.toDateString() === beforeYesterday.toDateString()) {
    return '前天'
  } else {
    return ''
  }
}

// 账单分组数据
const billGroups = ref([])

// 账单类型选项
const billTypes = ['全部', '支出', '收入', '不计入收支']
const selectedBillType = ref('')

// 支付方式选项
const paymentMethods = ['全部', '支付宝', '微信', '现金', '银行卡']
const selectedPaymentMethod = ref('')

// 账户类型选项
const accountTypes = ['全部', '信用账户', '储蓄账户']
const selectedAccountType = ref('')

// 格式化日期显示
const formatDate = (date) => {
  const [year, month] = date.split('-')
  return `${year}年${parseInt(month)}月`
}

// 切换月份
const switchMonth = (offset) => {
  const [year, month] = currentDate.value.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1 + offset)
  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
  currentDate.value = `${newYear}-${newMonth}`
  queryBills() // 切换月份后重新查询
}

// 日期选择处理
const handleDateChange = (e) => {
  currentDate.value = e.detail.value
  queryBills() // 选择日期后重新查询
}

// 处理账单类型选择
const handleBillTypeChange = (e) => {
  selectedBillType.value = billTypes[e.detail.value]
  queryBills() // 选择账单类型后重新查询
}

// 处理支付方式选择
const handlePaymentMethodChange = (e) => {
  selectedPaymentMethod.value = paymentMethods[e.detail.value]
  queryBills() // 选择支付方式后重新查询
}

// 处理账户类型选择
const handleAccountTypeChange = (e) => {
  selectedAccountType.value = accountTypes[e.detail.value]
  queryBills() // 选择账户类型后重新查询
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
  padding: 20rpx 30rpx;
  color: #fff;
  
  .month-picker {
    margin-bottom: 20rpx;
    
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
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        margin: 0 20rpx;
        
        &:active {
          background-color: rgba(255, 255, 255, 0.2);
        }
      }
      
      .picker-text {
        font-size: 32rpx;
        min-width: 180rpx;
        text-align: center;
      }
    }
  }

  .filter-section {
    display: flex;
    margin-bottom: 20rpx;
    
    .filter-item {
      flex: 1;
      margin-right: 12rpx;
      
      &:last-child {
        margin-right: 0;
      }
      
      .picker-content {
        background-color: rgba(255, 255, 255, 0.1);
        padding: 12rpx 16rpx;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .placeholder {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120rpx;
          
          &.selected {
            color: #fff;
          }
        }

        uni-icons {
          margin-left: 8rpx;
          flex-shrink: 0;
        }
      }
    }
  }
  
  .total-amount {
    display: flex;
    justify-content: space-between;
    
    .amount-item {
      .label {
        font-size: 24rpx;
        margin-right: 10rpx;
      }
      
      .value {
        font-size: 36rpx;
        font-weight: bold;
      }
    }
  }
}

.bill-list {
  flex: 1;
  padding: 20rpx;
  margin-bottom: 120rpx;
  
  .date-group {
    margin-bottom: 30rpx;
    background-color: #fff;
    border-radius: 12rpx;
    overflow: hidden;
    
    .date-header {
      padding: 20rpx;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #f5f5f5;
      
      .date {
        font-size: 28rpx;
        color: #333;
      }
      
      .daily-total {
        font-size: 24rpx;
        color: #666;
        
        .expense {
          margin-right: 20rpx;
        }
      }
    }
  }
  
  .bill-items {
    .bill-item {
      padding: 20rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f5f5f5;
      
      .left {
        display: flex;
        align-items: center;
        
        .icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          background-color: #4CAF50;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20rpx;
          
          &.income {
            background-color: #FF9800;
          }
        }
        
        .info {
          .title {
            font-size: 28rpx;
            color: #333;
            margin-bottom: 6rpx;
          }
          
          .time {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
      
      .amount {
        font-size: 32rpx;
        color: #333;
        
        &.income {
          color: #FF9800;
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
  }
}
</style>
