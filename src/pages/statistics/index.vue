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
      <view class="bottom-section">
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
        <view class="total-amount">
          <text class="label">共{{activeTab === 'expense' ? '支出' : '入账'}}</text>
          <text class="amount">¥ {{activeTab === 'expense' ? totalExpense : totalIncome}}</text>
        </view>
      </view>
    </view>

    <!-- 支出构成饼图 -->
    <view class="chart-section">
      <text class="section-title">{{activeTab === 'expense' ? '支出' : '收入'}}构成</text>
      <view class="chart-container">
        <qiun-data-charts 
          type="ring"
          :chartData="pieChartData"
          :opts="pieChartOpts"
          :ontouch="true"
          :canvas2d="true"
          canvasId="pieChart"
        />
      </view>
    </view>

    <!-- 柱状图 -->
    <view class="chart-section">
      <text class="section-title">{{activeTab === 'expense' ? '支出' : '收入'}}趋势</text>
      <view class="chart-container">
        <qiun-data-charts 
          type="column"
          :chartData="barChartData"
          :opts="barChartOpts"
          :ontouch="true"
          :canvas2d="true"
          canvasId="barChart"
        />
      </view>
    </view>

    <!-- 分类列表 -->
    <view class="category-list">
      <view class="category-item" v-for="(item, index) in categories" :key="index">
        <view class="category-info">
          <view class="icon-wrapper" :style="{ backgroundColor: item.color }">
            <iconfont :name="item.icon" size="24" color="#fff"></iconfont>
          </view>
          <view class="category-detail">
            <text class="name">{{item.name}}</text>
            <text class="percent">{{item.percent}}%</text>
          </view>
        </view>
        <text class="amount">¥{{item.amount}}</text>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <view class="tab-bar">
      <view class="tab-item" @click="navigateTo('/pages/index/index')">
        <uni-icons type="list" size="24" color="#666"></uni-icons>
        <text>明细</text>
      </view>
      <view class="tab-item active">
        <uni-icons type="chart" size="24" color="#4CAF50"></uni-icons>
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
import iconfont from '@/components/iconfont/iconfont.vue'
import { onLoad } from '@dcloudio/uni-app'
import uCharts from 'ucharts'

// 当前选择的日期
const currentDate = ref(formatDefaultDate())

// 当前选中的标签（支出/入账）
const activeTab = ref('expense')

// 总支出和总入账金额
const totalExpense = ref('0.00')
const totalIncome = ref('0.00')

// 账单类型选项
const billTypes = ['全部', '支出', '收入', '不计入收支']
const selectedBillType = ref('')

// 支付方式选项
const paymentMethods = ['全部', '支付宝', '微信', '现金', '银行卡']
const selectedPaymentMethod = ref('')

// 账户类型选项
const accountTypes = ['全部', '信用账户', '储蓄账户']
const selectedAccountType = ref('')

// 账单数据
const billList = ref([])

// 图表配置
const pieChartOpts = ref({
  padding: [15, 15, 15, 15],
  legend: {
    show: true,
    position: 'right',
    lineHeight: 25,
    fontSize: 12,
    formatter: (name, value, percent) => {
      return `${name} ${percent}%`
    }
  },
  series: {
    radius: ['40%', '70%'],
    avoidLabelOverlap: true,
    label: {
      show: true,
      position: 'center',
      formatter: '{b}\n{d}%\n{format}'
    }
  }
})

const barChartOpts = ref({
  padding: [15, 15, 15, 15],
  legend: {
    show: false
  },
  xAxis: {
    axisLabel: {
      interval: 0,
      rotate: 45
    }
  },
  yAxis: {
    data: [{
      title: '金额',
      min: 0
    }]
  }
})

// 图表数据
const pieChartData = ref({
  series: [{
    data: []
  }]
})

const barChartData = ref({
  categories: [],
  series: [{
    name: '金额',
    data: []
  }]
})

// 初始化图表
onLoad(() => {
  // 初始化饼图
  pieChart = new uCharts.init(document.getElementById('pieChart'))
  // 初始化柱状图
  barChart = new uCharts.init(document.getElementById('barChart'))
})

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
      calculateTotals()
      updateChartData()
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
    if (bill.type === '1') { // 支出
      expense += parseFloat(bill.amount)
    } else if (bill.type === '2') { // 收入
      income += parseFloat(bill.amount)
    }
  })

  totalExpense.value = expense.toFixed(2)
  totalIncome.value = income.toFixed(2)
}

// 处理账单分类统计
const calculateCategoryStats = () => {
  const categoryMap = new Map()
  const total = activeTab.value === 'expense' ? 
    parseFloat(totalExpense.value) : 
    parseFloat(totalIncome.value)

  // 按标签统计金额
  billList.value
    .filter(bill => 
      (activeTab.value === 'expense' && bill.type === '1') || 
      (activeTab.value === 'income' && bill.type === '2')
    )
    .forEach(bill => {
      // 每个账单可能有多个标签，金额平均分配给每个标签
      const amountPerTag = parseFloat(bill.amount) / bill.tags.length
      bill.tags.forEach(tag => {
        const existing = categoryMap.get(tag.name) || { 
          amount: 0, 
          name: tag.name,
          icon: getIconName(tag.name),
          color: getTagColor(categoryMap.size)
        }
        existing.amount += amountPerTag
        categoryMap.set(tag.name, existing)
      })
    })

  const categories = Array.from(categoryMap.values())
  categories.forEach(category => {
    category.amount = category.amount.toFixed(2)
    category.percent = ((category.amount / total) * 100).toFixed(2)
  })

  return categories
}

// 获取标签颜色
const getTagColor = (index) => {
  const colors = [
    '#4CAF50', // 绿色
    '#2196F3', // 蓝色
    '#FFC107', // 黄色
    '#9C27B0', // 紫色
    '#FF5722', // 橙色
    '#00BCD4', // 青色
    '#795548', // 棕色
    '#607D8B'  // 灰色
  ]
  return colors[index % colors.length]
}

// 获取图标名称
const getIconName = (tagName) => {
  const iconMap = {
    '餐饮': 'food',
    '购物': 'shopping',
    '交通': 'transport',
    '娱乐': 'entertainment',
    '医疗': 'medical',
    '教育': 'education',
    '住房': 'housing',
    '其他': 'other',
    '工资': 'salary',
    '奖金': 'bonus',
    '投资': 'investment',
    '礼物': 'gift'
  }
  return iconMap[tagName] || 'other'
}

// 切换支出/入账标签
const switchTab = (tab) => {
  activeTab.value = tab
  updateChartData()
}

// 更新图表数据
const updateChartData = () => {
  const categoryStats = calculateCategoryStats()
  if (activeTab.value === 'expense') {
    expenseCategories.value = categoryStats
  } else {
    incomeCategories.value = categoryStats
  }

  // 更新饼图数据
  pieChartData.value.series[0].data = categoryStats.map(item => ({
    name: item.name,
    value: parseFloat(item.amount),
    color: item.color,
    format: '¥{value}'
  }))

  // 更新柱状图数据
  barChartData.value.categories = categoryStats.map(item => item.name)
  barChartData.value.series[0].data = categoryStats.map(item => ({
    value: parseFloat(item.amount),
    color: item.color
  }))
}

// 支出分类数据
const expenseCategories = ref([])

// 入账分类数据
const incomeCategories = ref([])

// 分类数据（根据当前标签显示）
const categories = computed(() => 
  activeTab.value === 'expense' ? expenseCategories.value : incomeCategories.value
)

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
  
  .bottom-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .tab-switch {
      display: flex;
      
      .tab-item {
        padding: 10rpx 30rpx;
        font-size: 28rpx;
        border-radius: 30rpx;
        margin-right: 20rpx;
        background-color: rgba(255, 255, 255, 0.1);
        
        &.active {
          background-color: #fff;
          color: #4CAF50;
        }
        
        &:last-child {
          margin-right: 0;
        }
      }
    }
    
    .total-amount {
      display: flex;
      align-items: baseline;
      
      .label {
        font-size: 28rpx;
        margin-right: 10rpx;
      }
      
      .amount {
        font-size: 48rpx;
        font-weight: bold;
      }
    }
  }
}

.chart-section {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 12rpx;

  .section-title {
    font-size: 32rpx;
    color: #333;
    margin-bottom: 20rpx;
  }

  .chart-container {
    height: 600rpx;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.category-list {
  background-color: #fff;
  margin: 0 20rpx 120rpx;
  padding: 20rpx;
  border-radius: 12rpx;

  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .category-info {
      display: flex;
      align-items: center;

      .icon-wrapper {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
      }

      .category-detail {
        .name {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 6rpx;
        }

        .percent {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    .amount {
      font-size: 32rpx;
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