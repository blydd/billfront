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
          <view class="picker-content" @click="showTagSelector = true">
            <text :class="['placeholder', selectedTags.length > 0 ? 'selected' : '']">
              {{selectedTags.length > 0 ? (selectedTags.length > 1 ? `已选${selectedTags.length}个` : selectedTags[0].name) : '标签'}}
            </text>
            <uni-icons type="bottom" size="14" color="#fff"></uni-icons>
          </view>
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
                  <iconfont :name="getIconName(item.tags[0]?.name)" size="24" color="#fff"></iconfont>
                </view>
                <view class="info">
                  <text class="time">{{item.time}}</text>
                  <view class="tags-desc">
                    <view class="tags">
                      <text v-for="(tag, tagIndex) in item.tags" 
                            :key="tagIndex" 
                            class="tag"
                            :style="{ backgroundColor: getTagColor(tagIndex) }">
                        {{tag.name}}
                      </text>
                    </view>
                    <text v-if="item.desc" class="desc">{{item.desc}}</text>
                  </view>
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

    <!-- 标签选择弹窗 -->
    <view class="tag-selector-mask" v-if="showTagSelector" @click="closeTagSelector">
      <view class="tag-selector" @click.stop>
        <view class="selector-header">
          <text class="title">选择标签</text>
          <text class="confirm" @click="confirmTagSelection">确定</text>
        </view>
        <view class="tag-list">
          <view 
            class="tag-item" 
            v-for="(tag, index) in tagList" 
            :key="tag.id"
            @click="toggleTagSelection(tag)"
            :class="{ 'selected': isTagSelected(tag) }"
          >
            <text class="tag-name">{{tag.name}}</text>
            <uni-icons v-if="isTagSelected(tag)" type="checkmarkempty" size="18" color="#4CAF50"></uni-icons>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import iconfont from '@/components/iconfont/iconfont.vue'

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

// 支付方式选项改为标签选项
const tagList = ref([])
const selectedTags = ref([])

// 获取标签列表
const fetchTags = async () => {
  // 如果标签列表已经加载，则直接返回
  if (tagList.value.length > 0) {
    return Promise.resolve()
  }
  
  try {
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

    if (response.statusCode === 200 && response.data.code === 200) {
      // 添加"全部"选项
      tagList.value = [{ id: -1, name: '全部' }, ...response.data.data]
      return Promise.resolve()
    } else {
      uni.showToast({
        title: response.data?.message || '获取标签失败',
        icon: 'none'
      })
      return Promise.reject(new Error(response.data?.message || '获取标签失败'))
    }
  } catch (error) {
    console.error('获取标签失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
    return Promise.reject(error)
  }
}

// 标签选择相关
const showTagSelector = ref(false)
const tempSelectedTags = ref([])

// 关闭标签选择器
const closeTagSelector = () => {
  showTagSelector.value = false
}

// 切换标签选择
const toggleTagSelection = (tag) => {
  // 如果选择的是"全部"
  if (tag.id === -1) {
    // 如果已经选择了"全部"，则取消选择
    if (isAllSelected()) {
      tempSelectedTags.value = []
    } else {
      // 否则只选择"全部"，取消其他所有标签的选择
      tempSelectedTags.value = [tag]
    }
    return
  }
  
  // 如果选择的是其他标签，则先取消"全部"的选择
  tempSelectedTags.value = tempSelectedTags.value.filter(t => t.id !== -1)
  
  // 检查是否已经选择了该标签
  const index = tempSelectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    // 已选择，则取消选择
    tempSelectedTags.value.splice(index, 1)
  } else {
    // 未选择，则添加到选择列表
    tempSelectedTags.value.push(tag)
  }
}

// 确认标签选择
const confirmTagSelection = () => {
  selectedTags.value = [...tempSelectedTags.value]
  showTagSelector.value = false
  queryBills() // 选择标签后重新查询
}

// 检查标签是否被选中
const isTagSelected = (tag) => {
  return tempSelectedTags.value.some(t => t.id === tag.id)
}

// 检查是否选择了"全部"
const isAllSelected = () => {
  return tempSelectedTags.value.some(t => t.id === -1)
}

// 查询账单数据
const queryBills = async () => {
  try {
    const params = {
      userId: 1, // 这里暂时写死，实际应该从用户登录信息中获取
      month: currentDate.value,
      inoutType: selectedBillType.value === '支出' ? 1 : 
                selectedBillType.value === '收入' ? 2 : 
                selectedBillType.value === '不计入收支' ? 3 : undefined,
      accountType: selectedAccountType.value === '储蓄账户' ? 1 :
                  selectedAccountType.value === '信用账户' ? 2 : undefined,
      tagIds: selectedTags.value.length > 0 ? selectedTags.value.map(tag => tag.id) : undefined
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
    if (bill.inoutType === 1) { // 支出
      expense += parseFloat(bill.amount)
    } else if (bill.inoutType === 2) { // 收入
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
    if (bill.inoutType === 1) {
      group.expense = (parseFloat(group.expense) + parseFloat(bill.amount)).toFixed(2)
    } else if (bill.inoutType === 2) {
      group.income = (parseFloat(group.income) + parseFloat(bill.amount)).toFixed(2)
    }

    group.items.push({
      type: bill.inoutType === 1 ? 'expense' : 'income',
      icon: bill.tags[0]?.icon || 'shop',
      time: timeStr,
      amount: bill.inoutType === 1 ? -parseFloat(bill.amount) : parseFloat(bill.amount),
      tags: bill.tags || [],
      desc: bill.desc || ''
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
  const date = new Date(currentDate.value)
  date.setMonth(date.getMonth() + offset)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  currentDate.value = `${year}-${month}`
  
  // 月份切换后重新查询账单，但不需要重新获取标签列表
  queryBills()
}

// 处理日期选择
const handleDateChange = (e) => {
  currentDate.value = e.detail.value
  
  // 日期变更后重新查询账单，但不需要重新获取标签列表
  queryBills()
}

// 处理账单类型选择
const handleBillTypeChange = (e) => {
  selectedBillType.value = billTypes[e.detail.value]
  queryBills() // 选择账单类型后重新查询
}

// 处理账户类型选择
const handleAccountTypeChange = (e) => {
  selectedAccountType.value = accountTypes[e.detail.value]
  queryBills() // 选择账户类型后重新查询
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

// 页面加载时查询数据
onMounted(() => {
  // 先获取标签列表，确保标签列表已加载
  fetchTags().then(() => {
    // 标签列表加载完成后，再查询账单数据
    queryBills()
  })
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
        flex: 1;
        
        .icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          background-color: #4CAF50;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20rpx;
          flex-shrink: 0;
          
          &.income {
            background-color: #FF9800;
          }
        }
        
        .info {
          flex: 1;
          
          .time {
            font-size: 28rpx;
            color: #333;
            margin-bottom: 8rpx;
            display: block;
          }
          
          .tags-desc {
            display: flex;
            align-items: center;
            gap: 12rpx;
            
            .tags {
              display: flex;
              flex-wrap: wrap;
              gap: 8rpx;
              
              .tag {
                font-size: 24rpx;
                color: #fff;
                padding: 4rpx 12rpx;
                border-radius: 20rpx;
                background-color: #4CAF50;
              }
            }
            
            .desc {
              font-size: 24rpx;
              color: #666;
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }
      
      .amount {
        font-size: 32rpx;
        color: #333;
        margin-left: 20rpx;
        flex-shrink: 0;
        
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

.tag-selector-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.tag-selector {
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  width: 100%;
  
  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .confirm {
      font-size: 28rpx;
      color: #4CAF50;
      padding: 10rpx 20rpx;
    }
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    
    .tag-item {
      width: 30%;
      margin: 0 1.66% 20rpx;
      height: 80rpx;
      border-radius: 8rpx;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20rpx;
      
      &.selected {
        background-color: rgba(76, 175, 80, 0.1);
        border: 1px solid #4CAF50;
      }
      
      .tag-name {
        font-size: 28rpx;
        color: #333;
      }
    }
  }
}
</style>
