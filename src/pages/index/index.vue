<template>
  <view class="container">
    <!-- 授权按钮 -->
    <view v-if="!isAuthorized" class="auth-container">
      <view class="auth-content">
        <text class="auth-title">欢迎使用标签记账</text>
        <text class="auth-desc">需要获取您的用户信息</text>
        <button class="auth-button" @click="handleAuth">点击授权登录</button>
      </view>
    </view>
    
    <!-- 主页内容，只在已授权时显示 -->
    <template v-else>
      <!-- 自定义导航栏 -->
      <view class="custom-nav">
        <text class="nav-title">账单明细</text>
      </view>
      
      <!-- 顶部统计 -->
      <view class="header">
        <view class="month-picker">
          <view class="month-switcher">
            <view class="arrow left-arrow" @click="switchMonth(-1)">
              <text class="icon-text">←</text>
            </view>
            <picker mode="date" fields="month" :value="currentDate" @change="handleDateChange">
              <view class="picker-text">{{formatDate(currentDate)}}</view>
            </picker>
            <view class="arrow right-arrow" @click="switchMonth(1)">
              <text class="icon-text">→</text>
            </view>
          </view>
        </view>
        
        <!-- 标签筛选 -->
        <view class="tag-filter">
          <!-- 收支类型切换 -->
          <view class="type-tabs">
            <view 
              v-for="type in ['支出', '收入', '不计入收支']" 
              :key="type"
              :class="['tab-item', tagFilterType === getTypeValue(type) ? 'active' : '']"
              @click="tagFilterType = getTypeValue(type)"
            >
              <text>{{type}}</text>
            </view>
          </view>
          
          <!-- 标签类型选择 -->
          <view class="tag-type-list">
            <view 
              v-for="(group, index) in filteredGroupedTags" 
              :key="index"
              :class="['tag-type-item', selectedTagType === group.tagType ? 'active' : '']"
              @click="toggleTagType(group.tagType)"
            >
              <text class="tag-type-name">{{getTagTypeLabel(group.tagType)}}</text>
            </view>
          </view>
          
          <!-- 具体标签列表，只在选中标签类型时显示 -->
          <scroll-view v-if="selectedTagType" scroll-y class="tag-scroll">
            <view class="tag-list">
              <view 
                v-for="(tag, tagIndex) in getCurrentTagList" 
                :key="tagIndex" 
                :class="['tag-item', selectedTags.includes(tag.id) ? 'active' : '']"
                @click="selectTag(tag.id)"
              >
                <!-- 标签图标 -->
                <view class="tag-icon" :class="[`tag-type-${tag.inoutType}`, `tag-style-${tag.tagType}`]">
                  <text class="icon-text">{{tag.name.substring(0, 2)}}</text>
                </view>
                <!-- <text class="tag-name">{{tag.name}}</text> -->
              </view>
            </view>
          </scroll-view>
        </view>
        
        <!-- 账户类型筛选和记账按钮 -->
        <view class="filter-row">
          <view class="account-type-filter">
            <view 
              class="account-type-btn" 
              :class="{ active: selectedAccountType === '' }"
              @click="handleAccountTypeSelect('')"
            >
              全部
            </view>
            <view 
              class="account-type-btn" 
              :class="{ active: selectedAccountType === '储蓄账户' }"
              @click="handleAccountTypeSelect('储蓄账户')"
            >
              储蓄账户
            </view>
            <view 
              class="account-type-btn" 
              :class="{ active: selectedAccountType === '信用账户' }"
              @click="handleAccountTypeSelect('信用账户')"
            >
              信用账户
            </view>
          </view>
          
          <view class="add-bill-btn" @click="showAddBillModal">
            <text class="btn-icon">+</text>
            <text class="btn-text">记账</text>
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
        <!-- 调试信息 -->
        <view class="debug-info" v-if="billList.length > 0 && Object.keys(billGroups).length === 0">
          <text>接口返回了{{billList.length}}条数据，但未能正确分组</text>
        </view>
        
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
              <view class="bill-item" 
                    v-for="(item, index) in group.items" 
                    :key="index"
                    @click="showBillDetail(item)">
                <view class="left">
                  <view class="icon" :class="item.type">
                    <text class="icon-text">{{getFirstChar(item)}}</text>
                  </view>
                  <view class="info">
                    <view class="title-row">
                      <text class="time">{{formatTime(item.billDate)}}</text>
              
                      <text class="title">{{'   '}}</text>
       
                      
                      <text class="title">{{item.remark || ''}}</text>
                    </view>
                    <view class="tags">
                      <text class="tag" v-for="(tag, tagIndex) in item.tags" :key="tagIndex">{{tag.name}}</text>
                    </view>
                  </view>
                </view>
                <view class="right">
                  <text class="amount" :class="item.inoutType === 1 ? 'expense' : 'income'">
                    {{item.inoutType === 1 ? '-' : '+'}}{{item.amount}}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </block>
        
        <view class="empty-state" v-if="billList.length === 0">
          <text class="empty-text">暂无账单数据</text>
        </view>
      </scroll-view>

      <!-- 记账 添加账单弹框 -->
      <view v-if="showModal" class="modal-wrapper">
        <view class="modal-mask" @click="closeModal"></view>
        <view class="bill-modal" @click.stop>
          <!-- <view class="modal-header">
            <text class="title">新增账单</text> 
            <view class="close-btn" @click="closeModal">
              <text class="close-icon">×</text>
            </view>
          </view> -->
          
          <view class="modal-content">
            <view class="form-item">
              <text class="label">金额</text>
              <input type="digit" ref="billAmountRef" v-model="billForm.amount" placeholder="请输入金额" />
            </view>
            
            <view class="form-item">
              <text class="label">描述</text>
              <input type="text" v-model="billForm.remark" placeholder="请输入账单描述" />
            </view>
            
            <view class="form-item">
              <text class="label">收支类型</text>
              <view class="type-selector">
                <view 
                  class="type-item" 
                  :class="{ active: billForm.inoutType === 1 }"
                  @click="billForm.inoutType = 1"
                >
                  支出
                </view>
                <view 
                  class="type-item" 
                  :class="{ active: billForm.inoutType === 2 }"
                  @click="billForm.inoutType = 2"
                >
                  收入
                </view>
                <view 
                  class="type-item" 
                  :class="{ active: billForm.inoutType === 3 }"
                  @click="billForm.inoutType = 3"
                >
                  不计入收支
                </view>
              </view>
            </view>
            
            <view class="form-item tag-form-item">
              <text class="label">标签</text>
              <view class="tag-selector">
                <view class="tag-group" v-for="(group, index) in groupedTagsForForm" :key="index">
                  <view class="group-title">{{getTagTypeLabel(group.tagType)}}</view>
                  <view class="tag-grid">
                    <view 
                      v-for="(tag, tagIndex) in group.items" 
                      :key="tagIndex"
                      :class="['tag-select-item', billForm.tags.includes(tag.id) ? 'active' : '']"
                      @click="toggleTag(tag.id)"
                    >
                      <view class="tag-icon" :class="[`tag-type-${tag.inoutType}`, `tag-style-${tag.tagType}`]">
                        <text class="icon-text">{{tag.name.substring(0, 2)}}</text>
                      </view>
                      <text class="tag-name">{{tag.name}}</text>
                    </view>
                  </view>
                </view>
                
                <view v-if="filteredTags.length === 0" class="empty-tags">
                  暂无匹配的标签，请先在设置中添加标签
                </view>
              </view>
            </view>
            
            <view class="form-item">
              <text class="label">日期</text>
              <view class="date-picker" @click="showDatePicker">
                {{billForm.billDate}}
              </view>
            </view>
          </view>
          
          <view class="modal-footer">
            <button class="cancel-btn" @click="closeModal">取消</button>
            <button class="confirm-btn" @click="saveBill">保存</button>
          </view>
        </view>
      </view>

      <!-- 日期选择器弹框 -->
      <view v-if="showDatePickerModal" class="date-picker-modal">
        <view class="date-picker-mask" @click="closeDatePicker"></view>
        <view class="date-picker-content">
          <view class="date-picker-header">
            <text>选择日期和时间</text>
          </view>
          <view class="date-picker-body">
            <picker-view 
              :value="datePickerValue" 
              @change="onDatePickerChange"
              class="picker-view"
              indicator-style="height: 80rpx;"
              :mask-style="maskStyle"
            >
              <picker-view-column>
                <view class="picker-item" v-for="(year, index) in years" :key="index">{{year}}年</view>
              </picker-view-column>
              <picker-view-column>
                <view class="picker-item" v-for="(month, index) in months" :key="index">{{month}}月</view>
              </picker-view-column>
              <picker-view-column>
                <view class="picker-item" v-for="(day, index) in days" :key="index">{{day}}日</view>
              </picker-view-column>
              <picker-view-column>
                <view class="picker-item" v-for="(hour, index) in hours" :key="index">{{hour}}时</view>
              </picker-view-column>
              <picker-view-column>
                <view class="picker-item" v-for="(minute, index) in minutes" :key="index">{{minute}}分</view>
              </picker-view-column>
              <picker-view-column>
                <view class="picker-item" v-for="(second, index) in seconds" :key="index">{{second}}秒</view>
              </picker-view-column>
            </picker-view>
          </view>
          <view class="date-picker-footer">
            <button class="cancel-btn" @click="closeDatePicker">取消</button>
            <button class="confirm-btn" @click="confirmDatePicker">确定</button>
          </view>
        </view>
      </view>

      <!-- 账单详情弹框 -->
      <view v-if="showDetailModal" class="modal-wrapper">
        <view class="modal-mask" @click="closeDetailModal"></view>
        <view class="bill-modal" @click.stop>
          <view class="modal-header">
            <text class="title">账单详情</text>
            <view class="close-btn" @click="closeDetailModal">
              <text class="close-icon">×</text>
            </view>
          </view>
          
          <view class="modal-content">
            <view class="form-item">
              <text class="label">金额</text>
              <input type="digit" v-model="billDetail.amount" placeholder="请输入金额" />
            </view>
            
            <view class="form-item">
              <text class="label">描述</text>
              <input type="text" v-model="billDetail.remark" placeholder="请输入账单描述" />
            </view>
            
            <view class="form-item">
              <text class="label">收支类型</text>
              <view class="type-selector">
                <view 
                  class="type-item" 
                  :class="{ active: billDetail.inoutType === 1 }"
                  @click="billDetail.inoutType = 1"
                >
                  支出
                </view>
                <view 
                  class="type-item" 
                  :class="{ active: billDetail.inoutType === 2 }"
                  @click="billDetail.inoutType = 2"
                >
                  收入
                </view>
                <view 
                  class="type-item" 
                  :class="{ active: billDetail.inoutType === 3 }"
                  @click="billDetail.inoutType = 3"
                >
                  不计入收支
                </view>
              </view>
            </view>
            
            <view class="form-item tag-form-item">
              <text class="label">标签</text>
              <view class="tag-selector">
                <view class="tag-group" v-for="(group, index) in groupedTagsForDetail" :key="index">
                  <view class="group-title">{{getTagTypeLabel(group.tagType)}}</view>
                  <view class="tag-grid">
                    <view 
                      v-for="(tag, tagIndex) in group.items" 
                      :key="tagIndex"
                      :class="['tag-select-item', billDetail.tags.includes(tag.id) ? 'active' : '']"
                      @click="toggleDetailTag(tag.id)"
                    >
                      <view class="tag-icon" :class="[`tag-type-${tag.inoutType}`, `tag-style-${tag.tagType}`]">
                        <text class="icon-text">{{tag.name.substring(0, 1)}}</text>
                      </view>
                      <text class="tag-name">{{tag.name}}</text>
                    </view>
                  </view>
                </view>
                
                <view v-if="filteredTagsForDetail.length === 0" class="empty-tags">
                  暂无匹配的标签，请先在设置中添加标签
                </view>
              </view>
            </view>
            
            <view class="form-item">
              <text class="label">日期</text>
              <view class="date-picker" @click="showDatePickerForDetail">
                {{billDetail.billDate}}
              </view>
            </view>
          </view>
          
          <view class="modal-footer detail-footer">
            <button class="cancel-btn" @click="closeDetailModal">取消</button>
            <button class="delete-btn" @click="deleteBill">删除</button>
            <button class="confirm-btn" @click="updateBill">保存</button>
          </view>
        </view>
      </view>

      <!-- 自定义确认弹窗 -->
      <view v-if="showDeleteConfirm" class="custom-confirm-modal">
        <view class="confirm-mask" @click="closeDeleteConfirm"></view>
        <view class="confirm-content">
          <view class="confirm-title">删除账单</view>
          <view class="confirm-message">确定要删除这条账单记录吗？</view>
          <view class="confirm-buttons">
            <button class="cancel-btn" @click="closeDeleteConfirm">取消</button>
            <button class="delete-btn" @click="performDelete">删除</button>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { API } from '@/config/index.js'

// 当前选择的日期
const currentDate = ref(formatDefaultDate())

const billAmountRef = ref(null);
onMounted(() => {
  if (billAmountRef.value) {
    billAmountRef.value.focus();
  }
});
// 账单数据
const billList = ref([])

// 标签列表
const tagList = ref([])
const selectedTags = ref([])

// 账户类型选项
const accountTypes = ref(['全部', '储蓄账户', '信用账户'])
const selectedAccountType = ref('')

// 总支出和总入账金额
const totalExpense = ref('0.00')
const totalIncome = ref('0.00')

// 弹框显示状态
const showModal = ref(false)
const showDatePickerModal = ref(false)
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)

// 账单表单数据
const billForm = ref({
  amount: '',
  remark: '',
  inoutType: 1, // 1: 支出, 2: 收入, 3: 不计入收支
  tags: [],
  billDate: formatCurrentDate()
})

// 账单详情数据
const billDetail = ref({
  id: null,
  amount: '',
  remark: '',
  inoutType: 1,
  tags: [],
  billDate: ''
})

// 标签筛选类型
const tagFilterType = ref('expense')

// 授权状态
const isAuthorized = ref(false)

// 根据类型值获取类型名称
const getTypeValue = (typeName) => {
  const typeMap = {
    '支出': 'expense',
    '收入': 'income',
    '不计入收支': 'other'
  }
  return typeMap[typeName]
}

// 根据筛选类型过滤的标签分组
const filteredGroupedTags = computed(() => {
  const typeMap = {
    'expense': 1,
    'income': 2,
    'other': 3
  }
  const currentType = typeMap[tagFilterType.value]
  
  // 按tagType分组
  const groups = {}
  tagList.value.filter(tag => tag.inoutType === currentType).forEach(tag => {
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

// 标签类型选项
const tagTypeOptions = [
  { value: 1, label: '支付方式' },
  { value: 2, label: '账单类型' },
  { value: 3, label: '归属人' }
]

// 根据标签类型分组的标签列表
const groupedTags = computed(() => {
  // 按tagType分组
  const groups = {}
  tagList.value.forEach(tag => {
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

// 格式化当前日期为 YYYY-MM-DD
function formatCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  const second = now.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

// 查询标签列表
const queryTags = async () => {
  try {
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.TAGS.LIST,
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
      console.log('获取到标签列表:', response.data.data)
      tagList.value = response.data.data || []
    } else {
      console.error('查询标签失败:', response.data?.message)
    }
  } catch (error) {
    console.error('查询标签失败:', error)
  }
}

// 选择标签
const selectTag = (tagId) => {
  // 如果已经选中了这个标签，则取消选中
  if (selectedTags.value.includes(tagId)) {
    selectedTags.value = selectedTags.value.filter(id => id !== tagId)
  } else {
    // 否则添加到已选标签中
    selectedTags.value.push(tagId)
  }
  
  queryBills() // 选择标签后重新查询
}

// 处理账户类型选择
const handleAccountTypeSelect = (type) => {
  selectedAccountType.value = type;
  queryBills();
}

// 获取默认日期（当前月份）
function formatDefaultDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

// 格式化日期显示
const formatDate = (dateStr) => {
  const [year, month] = dateStr.split('-')
  return `${year}年${month}月`
}

// 格式化时间显示
const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const parts = dateTimeStr.split(' ')
  if (parts.length < 2) return ''
  const time = parts[1]
  if (!time) return ''
  return time.substring(0, 5) // 只显示小时和分钟
}

// 获取账单的第一个字符作为图标
const getFirstChar = (item) => {
  if (item.tags && item.tags.length > 0 && item.tags[0].name) {
    return item.tags[0].name.substring(0, 1)
  }
  return item.inoutType === 1 ? '支' : '入'
}

// 查询账单数据
const queryBills = async () => {
  try {
    const params = {
      userId: 1,
      month: currentDate.value,
      accountType: selectedAccountType.value === '储蓄账户' ? 1 :
                  selectedAccountType.value === '信用账户' ? 2 : undefined,
      tagIds: selectedTags.value.length > 0 ? selectedTags.value : undefined
    }

    console.log('查询账单参数:', params)

    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.BILLS.QUERY,
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
      console.log('接口返回数据:', response.data.data)
      billList.value = response.data.data || []
      calculateTotals()
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
      expense += parseFloat(bill.amount)
    } else if (bill.inoutType === 2) { // 收入
      income += parseFloat(bill.amount)
    }
  })
  
  totalExpense.value = expense.toFixed(2)
  totalIncome.value = income.toFixed(2)
}

// 按日期分组的账单数据
const billGroups = computed(() => {
  const groups = {}
  
  console.log('开始处理账单数据进行分组，数据条数:', billList.value.length)
  
  billList.value.forEach((bill, index) => {
    console.log(`处理第${index+1}条账单:`, bill)
    
    // 使用 billDate 字段而不是 date 字段
    const billDate = bill.billDate
    
    // 确保 billDate 存在且是字符串
    if (!billDate || typeof billDate !== 'string') {
      console.error('账单日期格式错误:', bill)
      return
    }
    
    // 提取日期部分，尝试多种可能的格式
    let date = ''
    
    // 尝试方式1: 2023-05-01 12:00:00 格式
    if (billDate.includes(' ')) {
      date = billDate.split(' ')[0]
    } 
    // 尝试方式2: 2023-05-01 格式
    else if (billDate.includes('-')) {
      date = billDate
    } 
    // 尝试方式3: 时间戳格式
    else if (!isNaN(Number(billDate))) {
      const dateObj = new Date(Number(billDate))
      date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
    }
    // 其他情况
    else {
      console.error('无法解析的日期格式:', billDate)
      date = '未知日期'
    }
    
    console.log(`账单日期解析结果: ${billDate} -> ${date}`)
    
    if (!groups[date]) {
      groups[date] = {
        date: formatGroupDate(date),
        expense: 0,
        income: 0,
        items: []
      }
    }
    
    // 确保金额是数字
    const amount = typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount || 0)
    
    if (bill.inoutType === 1) { // 支出
      groups[date].expense += amount
    } else if (bill.inoutType === 2) { // 收入
      groups[date].income += amount
    }
    
    // 确保 tags 是数组
    if (!Array.isArray(bill.tags)) {
      bill.tags = []
    }
    
    groups[date].items.push({
      ...bill,
      type: bill.inoutType === 1 ? 'expense' : 'income'
    })
  })
  
  // 格式化金额
  Object.values(groups).forEach(group => {
    group.expense = group.expense.toFixed(2)
    group.income = group.income.toFixed(2)
  })
  
  console.log('分组结果:', groups)
  
  // 将groups对象转换为数组并按日期降序排序
  const sortedGroups = Object.entries(groups)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .reduce((acc, [date, group]) => {
      acc[date] = group
      return acc
    }, {})
  
  return sortedGroups
})

// 格式化分组日期显示
const formatGroupDate = (dateStr) => {
  if (!dateStr || dateStr === '未知日期') return '未知日期'
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      console.error('无效的日期字符串:', dateStr)
      return dateStr
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const billDate = new Date(date)
    billDate.setHours(0, 0, 0, 0)
    
    // 获取月日格式
    const month = date.getMonth() + 1
    const day = date.getDate()
    const monthDayStr = `${month}月${day}日`
    
    // 获取星期几
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    
    // 判断是否是今天
    if (billDate.getTime() === today.getTime()) {
      return `${monthDayStr} 今天`
    }
    
    // 判断是否是昨天
    if (billDate.getTime() === yesterday.getTime()) {
      return `${monthDayStr} 昨天`
    }
    
    // 其他日期显示月日周几
    return `${monthDayStr} ${weekday}`
  } catch (error) {
    console.error('格式化日期出错:', error)
    return dateStr
  }
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
  billForm.value.billDate = e.detail.value
}

// 初始化函数
const init = async () => {
  // 检查是否已授权
  const token = uni.getStorageSync('token')
  isAuthorized.value = !!token
  
  if (isAuthorized.value) {
    // 先查询标签列表
    await queryTags()
    // 再查询账单数据
    await queryBills()
  }
}

// 页面加载时初始化
onLoad(() => {
  init()
})

// 页面跳转
const navigateTo = (url) => {
  uni.navigateTo({
    url
  })
}

// 显示添加账单的弹框
const showAddBillModal = () => {
  // 重置表单
  billForm.value = {
    amount: '',
    remark: '',
    inoutType: 1,
    tags: [],
    billDate: formatCurrentDate()
  }
  showModal.value = true
}

// 关闭弹框
const closeModal = () => {
  showModal.value = false
}

// 切换标签选择
const toggleTag = (tagId) => {
  if (billForm.value.tags.includes(tagId)) {
    billForm.value.tags = billForm.value.tags.filter(id => id !== tagId)
  } else {
    billForm.value.tags.push(tagId)
  }
}

// 保存账单
const saveBill = async () => {
  // 表单验证
  if (!billForm.value.amount) {
    uni.showToast({
      title: '请输入金额',
      icon: 'none'
    })
    return
  }
  
  // if (!billForm.value.remark) {
  //   uni.showToast({
  //     title: '请输入描述',
  //     icon: 'none'
  //   })
  //   return
  // }
  
  if (billForm.value.tags.length === 0) {
    uni.showToast({
      title: '请选择至少一个标签',
      icon: 'none'
    })
    return
  }
  
  try {
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.BILLS.CREATE,
        method: 'POST',
        data: {
          amount: parseFloat(billForm.value.amount),
          remark: billForm.value.remark,
          inoutType: billForm.value.inoutType,
          tagIds: billForm.value.tags,
          billDate: billForm.value.billDate
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
        title: '添加成功',
        icon: 'success'
      })
      closeModal()
      queryBills() // 重新查询账单列表
    } else {
      uni.showToast({
        title: response.data?.message || '添加失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('添加账单失败:', error)
    uni.showToast({
      title: '添加失败，请稍后重试',
      icon: 'none'
    })
  }
}

// 日期选择器数据
const years = ref([])
const months = ref([])
const days = ref([])
const hours = ref([])
const minutes = ref([])
const seconds = ref([])
const datePickerValue = ref([0, 0, 0, 0, 0, 0])
const tempDate = ref('')
const maskStyle = 'background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.6)), linear-gradient(0deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.6));'

// 初始化日期选择器数据
const initDatePicker = (date) => {
  const currentYear = date.getFullYear()
  const currentMonth = date.getMonth() + 1
  const currentDay = date.getDate()
  const currentHour = date.getHours()
  const currentMinute = date.getMinutes()
  const currentSecond = date.getSeconds()
  
  // 生成年份数据，从当前年份往前10年，往后10年
  years.value = Array.from({length: 21}, (_, i) => currentYear - 10 + i)
  // 生成月份数据
  months.value = Array.from({length: 12}, (_, i) => i + 1)
  // 生成天数数据，默认31天
  updateDays(currentYear, currentMonth)
  // 生成小时数据
  hours.value = Array.from({length: 24}, (_, i) => i)
  // 生成分钟数据
  minutes.value = Array.from({length: 60}, (_, i) => i)
  // 生成秒数据
  seconds.value = Array.from({length: 60}, (_, i) => i)
  
  // 设置当前日期和时间
  if (billForm.value.billDate) {
    // 如果表单中已有日期，则使用表单中的日期
    let dateTime = billForm.value.billDate
    // 如果日期字符串中没有时间部分，添加当前系统时间
    if (dateTime.length <= 10) {
      dateTime = `${dateTime} ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:${currentSecond.toString().padStart(2, '0')}`
    }
    
    const date = new Date(dateTime.replace(/-/g, '/'))
    
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    
    const yearIndex = years.value.findIndex(y => y === year)
    const monthIndex = months.value.findIndex(m => m === month)
    const dayIndex = days.value.findIndex(d => d === day)
    const hourIndex = hours.value.findIndex(h => h === hour)
    const minuteIndex = minutes.value.findIndex(m => m === minute)
    const secondIndex = seconds.value.findIndex(s => s === second)
    
    datePickerValue.value = [
      yearIndex !== -1 ? yearIndex : 0,
      monthIndex !== -1 ? monthIndex : 0,
      dayIndex !== -1 ? dayIndex : 0,
      hourIndex !== -1 ? hourIndex : 0,
      minuteIndex !== -1 ? minuteIndex : 0,
      secondIndex !== -1 ? secondIndex : 0
    ]
    
    tempDate.value = formatDateTime(year, month, day, hour, minute, second)
  } else {
    // 如果表单中没有日期，则使用当前系统时间
    const yearIndex = years.value.findIndex(y => y === currentYear)
    const monthIndex = months.value.findIndex(m => m === currentMonth)
    const dayIndex = days.value.findIndex(d => d === currentDay)
    const hourIndex = hours.value.findIndex(h => h === currentHour)
    const minuteIndex = minutes.value.findIndex(m => m === currentMinute)
    const secondIndex = seconds.value.findIndex(s => s === currentSecond)
    
    datePickerValue.value = [
      yearIndex !== -1 ? yearIndex : 0,
      monthIndex !== -1 ? monthIndex : 0,
      dayIndex !== -1 ? dayIndex : 0,
      hourIndex !== -1 ? hourIndex : 0,
      minuteIndex !== -1 ? minuteIndex : 0,
      secondIndex !== -1 ? secondIndex : 0
    ]
    
    tempDate.value = formatDateTime(currentYear, currentMonth, currentDay, currentHour, currentMinute, currentSecond)
    billForm.value.billDate = tempDate.value
  }
}

// 格式化日期时间
const formatDateTime = (year, month, day, hour, minute, second) => {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
}

// 更新天数
const updateDays = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate()
  days.value = Array.from({length: daysInMonth}, (_, i) => i + 1)
}

// 日期选择器变更事件
const onDatePickerChange = (e) => {
  const values = e.detail.value
  const year = years.value[values[0]]
  const month = months.value[values[1]]
  
  // 更新天数
  updateDays(year, month)
  
  // 如果选择的天数超出了当月的最大天数，则调整为当月的最后一天
  if (values[2] >= days.value.length) {
    values[2] = days.value.length - 1
  }
  
  datePickerValue.value = values
  
  // 更新临时日期
  const day = days.value[values[2]]
  const hour = hours.value[values[3]]
  const minute = minutes.value[values[4]]
  const second = seconds.value[values[5]]
  
  tempDate.value = formatDateTime(year, month, day, hour, minute, second)
}

// 显示日期选择器
const showDatePicker = () => {
  initDatePicker(new Date())
  showDatePickerModal.value = true
}

// 关闭日期选择器
const closeDatePicker = () => {
  showDatePickerModal.value = false
}

// 确认日期选择
const confirmDatePicker = () => {
  billForm.value.billDate = tempDate.value
  closeDatePicker()
}

// 显示账单详情弹框
const showBillDetail = async (bill) => {
  try {
    uni.showLoading({
      title: '加载中...'
    })
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.BILLS.DETAIL(bill.id),
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
      const billData = response.data.data
      
      // 转换标签数据
      const tagIds = billData.tags ? billData.tags.map(tag => tag.id) : []
      
      billDetail.value = {
        id: billData.id,
        amount: billData.amount.toString(),
        remark: billData.remark || '',
        inoutType: billData.inoutType,
        tags: tagIds,
        billDate: billData.billDate
      }
      
      showDetailModal.value = true
    } else {
      uni.showToast({
        title: response.data?.message || '获取账单详情失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取账单详情失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 关闭账单详情弹框
const closeDetailModal = () => {
  showDetailModal.value = false
  billDetail.value = {
    id: null,
    amount: '',
    remark: '',
    inoutType: 1,
    tags: [],
    billDate: ''
  }
}

// 切换标签选择（用于详情页）
const toggleDetailTag = (tagId) => {
  const index = billDetail.value.tags.indexOf(tagId)
  if (index === -1) {
    billDetail.value.tags.push(tagId)
  } else {
    billDetail.value.tags.splice(index, 1)
  }
}

// 显示日期选择器（用于详情页）
const showDatePickerForDetail = () => {
  // 设置当前选择的日期为账单日期
  const billDate = new Date(billDetail.value.billDate)
  
  // 初始化日期选择器
  initDatePicker(billDate)
  
  // 标记当前是为详情页选择日期
  isDetailDatePicker.value = true
  
  showDatePickerModal.value = true
}

// 更新账单
const updateBill = async () => {
  // 表单验证
  if (!billDetail.value.amount) {
    uni.showToast({
      title: '请输入金额',
      icon: 'none'
    })
    return
  }
  
  if (!billDetail.value.remark) {
    uni.showToast({
      title: '请输入描述',
      icon: 'none'
    })
    return
  }
  
  try {
    uni.showLoading({
      title: '保存中...'
    })
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.BILLS.UPDATE(billDetail.value.id),
        method: 'PUT',
        data: {
          amount: parseFloat(billDetail.value.amount),
          remark: billDetail.value.remark,
          inoutType: billDetail.value.inoutType,
          tagIds: billDetail.value.tags,
          billDate: billDetail.value.billDate
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
        title: '更新成功',
        icon: 'success'
      })
      closeDetailModal()
      queryBills() // 重新查询账单列表
    } else {
      uni.showToast({
        title: response.data?.message || '更新失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('更新账单失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 删除账单
const deleteBill = () => {
  showDeleteConfirm.value = true
}

// 关闭删除确认弹框
const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false
}

// 执行删除操作
const performDelete = async () => {
  try {
    closeDeleteConfirm() // 先关闭确认弹框
    
    uni.showLoading({
      title: '删除中...'
    })
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: API.BILLS.DELETE(billDetail.value.id),
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
      closeDetailModal()
      queryBills() // 重新查询账单列表
    } else {
      uni.showToast({
        title: response.data?.message || '删除失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('删除账单失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 根据收支类型过滤标签
const filteredTags = computed(() => {
  return tagList.value.filter(tag => tag.inoutType === billForm.value.inoutType)
})

// 根据收支类型过滤标签（详情页）
const filteredTagsForDetail = computed(() => {
  return tagList.value.filter(tag => tag.inoutType === billDetail.value.inoutType)
})

// 根据标签类型分组的标签列表（用于表单）
const groupedTagsForForm = computed(() => {
  // 按tagType分组
  const groups = {}
  filteredTags.value.forEach(tag => {
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

// 根据标签类型分组的标签列表（用于详情）
const groupedTagsForDetail = computed(() => {
  // 按tagType分组
  const groups = {}
  filteredTagsForDetail.value.forEach(tag => {
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

// 处理授权按钮点击
const handleAuth = async () => {
  try {
    // 获取用户信息
    const userInfo = await getApp().getUserInfo()
    if (userInfo) {
      // 登录
      await getApp().login(userInfo)
      // 更新授权状态
      isAuthorized.value = true
      // 加载数据
      await init()
    }
  } catch (error) {
    console.error('授权失败:', error)
    uni.showToast({
      title: '授权失败',
      icon: 'none'
    })
  }
}

// 监听授权状态变化，控制tabBar显示
watch(isAuthorized, (newVal) => {
  if (!newVal) {
    // 未授权时隐藏tabBar
    uni.hideTabBar()
  } else {
    // 已授权时显示tabBar
    uni.showTabBar()
  }
}, { immediate: true })

// 新增：当前选中的标签类型
const selectedTagType = ref(null)

// 新增：切换标签类型
const toggleTagType = (tagType) => {
  selectedTagType.value = selectedTagType.value === tagType ? null : tagType
}

// 新增：获取当前标签类型下的标签列表
const getCurrentTagList = computed(() => {
  if (!selectedTagType.value) return []
  const group = filteredGroupedTags.value.find(g => g.tagType === selectedTagType.value)
  return group ? group.items : []
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  background-color: rgb(189, 219, 189);
  
  .content-wrapper {
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    
    .header {
      width: 100%;
      box-sizing: border-box;
      padding: 0 30rpx;
      
      .month-picker {
        width: 100%;
        box-sizing: border-box;
        
        .month-switcher {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          
          .picker-text {
            flex: 0 1 auto;
            min-width: 0;
            text-align: center;
          }
        }
      }
      
      .tag-filter {
        padding: 16rpx;
        background-color: #fff;
        border-radius: 16rpx;
        margin: 16rpx;
        position: relative;
        width: auto;
        box-sizing: border-box;
        
        .type-tabs {
          display: flex;
          margin-bottom: 16rpx;
          background-color: #f5f5f5;
          border-radius: 12rpx;
          padding: 4rpx;
          
          .tab-item {
            flex: 1;
            height: 60rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26rpx;
            color: #666;
            border-radius: 8rpx;
            transition: all 0.3s ease;
            
            &.active {
              background-color: rgb(152, 226, 147);
              color: #4CAF50;
              box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
            }
          }
        }
        
        .tag-type-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12rpx;
          padding: 12rpx 0;
          
          .tag-type-item {
            padding: 8rpx 20rpx;
            background-color: #f5f5f5;
            border-radius: 24rpx;
            font-size: 14rpx;
            color: #666;
            transition: all 0.3s ease;
            
            &.active {
              background-color: rgb(152, 226, 147);
              color: #fff;
            }
          }
        }
        
        .tag-scroll {
          max-height: 140rpx;
          overflow-y: auto;
          
          &::-webkit-scrollbar {
            width: 4rpx;
          }
          
          &::-webkit-scrollbar-thumb {
            background-color: #ddd;
            border-radius: 2rpx;
          }
          
          .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 12rpx;
            padding: 12rpx 0;
            width: 100%;
            box-sizing: border-box;
            
            .tag-item {
              width: 15%;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 5rpx 0;
              border-radius: 8rpx;
              transition: all 0.3s ease;
              box-sizing: border-box;
              
              &.active {
                background-color: rgb(152, 226, 147);
              }
              
              .tag-icon {
                width: 40;
                height: 40;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 3rpx;
                
                &.tag-type-1 {
                  background-color: #EE6666; // 支出
                  
                  &.tag-style-1 {
                    background: linear-gradient(135deg, #FF9800, #EE6666); // 支付方式
                  }
                  
                  &.tag-style-2 {
                    background: linear-gradient(135deg, #EE6666, #9C27B0); // 账单类型
                  }
                  
                  &.tag-style-3 {
                    background: linear-gradient(135deg, #EE6666, #3F51B5); // 归属人
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
                  
                  &.tag-style-3 {
                    background: linear-gradient(135deg, #91CC75, #00BCD4); // 归属人
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
                
                .icon-text {
                  color: #fff;
                  font-size: 10;
                  font-weight: bold;
                }
              }
              
              .tag-name {
                font-size: 22rpx;
                color: #333;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: center;
              }
            }
          }
        }
      }
      
      .filter-row {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        
        .account-type-filter {
          flex: 1;
          min-width: 0;
          display: flex;
          gap: 12rpx;
          
          .account-type-btn {
            flex: 0 1 auto;
            min-width: 0;
          }
        }
      }
      
      .total-amount {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        
        .amount-item {
          flex: 1;
          min-width: 0;
          text-align: center;
        }
      }
    }
    
    .bill-list {
      width: 100%;
      box-sizing: border-box;
      
      .date-group {
        width: 100%;
        box-sizing: border-box;
        
        .date-header {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          justify-content: space-between;
          
          .daily-total {
            flex: 0 1 auto;
            min-width: 0;
          }
        }
        
        .bill-items {
          width: 100%;
          box-sizing: border-box;
          
          .bill-item {
            width: 100%;
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            
            .left {
              flex: 1;
              min-width: 0;
              display: flex;
              align-items: center;
              
              .info {
                flex: 1;
                min-width: 0;
                
                .title-row {
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
                  
                  .title {
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                  
                  .time {
                    flex: 0 0 auto;
                  }
                }
                
                .tags {
                  width: 100%;
                  display: flex;
                  flex-wrap: wrap;
                  gap: 6rpx;
                  
                  .tag {
                    flex: 0 1 auto;
                    min-width: 0;

                  }
                }
              }
            }
            
            .right {
              flex: 0 0 auto;
            }
          }
        }
      }
    }
  }
}

// 弹窗样式
.modal-wrapper {

  width: 100%;
  box-sizing: border-box;
  
  .bill-modal {
    width: 90%;
    max-width: 600rpx;
    box-sizing: border-box;
    
    .modal-content {
      width: 100%;
      box-sizing: border-box;
      
      .form-item {
        width: 100%;
        box-sizing: border-box;
        
        input {
          width: 100%;
          box-sizing: border-box;
        }
      }
    }
  }
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background-color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding-top: var(--status-bar-height);
  
  .nav-title {
    font-size: 32rpx;
    font-weight: 500;
    color: #fff;
  }
}

.header {
  background-color: #4CAF50;
  padding: 20rpx 30rpx 30rpx;
  color: #fff;
  position: fixed;
  top: calc(88rpx + var(--status-bar-height));
  left: 0;
  right: 0;
  z-index: 998;
  
  .month-picker {
    text-align: center;
    padding: 10rpx 0;
    margin-bottom: 10rpx;
    
    .month-switcher {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 16rpx;
      padding: 10rpx;
      margin: 0 auto;
      width: fit-content;
      
      .arrow {
        width: 80rpx;
        height: 50rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        margin: 0 20rpx;
        
        .icon-text {
          color: #fff;
          font-size: 28rpx;
        }
        
        &:active {
          background-color: rgb(152, 226, 147);
        }
      }
      
      .picker-text {
  font-size: 36rpx;
        color: #fff;
        font-weight: bold;
      }
    }
  }
  
  .tag-filter {
    padding: 20rpx;
    background-color: #fff;
    border-radius: 16rpx;
    margin: 20rpx;
    position: relative;
    
    .type-tabs {
  display: flex;
      margin-bottom: 20rpx;
      background-color: #f5f5f5;
      border-radius: 12rpx;
      padding: 4rpx;
      
      .tab-item {
        flex: 1;
        height: 40rpx;
        display: flex;
        align-items: center;
  justify-content: center;
        font-size: 28rpx;
        color: #666;
        border-radius: 8rpx;
        transition: all 0.3s ease;
        
        &.active {
          background-color: #fff;
          color: #4CAF50;
          box-shadow: 0 2rpx 8rpx rgb(152, 226, 147);
        }
      }
    }
    
    .tag-type-list {
      display: flex;
      flex-wrap: wrap;
      gap: 56rpx;
      padding: 0 0 0 0;
      
      .tag-type-item {
        padding: 5rpx 40rpx 10rpx 40rpx;
        background-color: #f5f5f5;
        border-radius: 30rpx;;
        background-color: #f5f5f5;
        border-radius: 30rpx;
        font-size: 24rpx;
        color: #666;
        transition: all 0.3s ease;
        
        &.active {
          background-color: rgb(152, 226, 147);
          color: #fff;
        }
      }
    }
    
    .tag-scroll {
      max-height: 250rpx; /* 增加高度，能展示完整2行的标签 */
      overflow-y: auto;
      
      &::-webkit-scrollbar {
        width: 4rpx;
      }
      
      &::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 2rpx;
      }
    }
    
    .tag-group {
      margin-bottom: 20rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .group-title {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 10rpx;
        padding-left: 10rpx;
      }
    }
    
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
    }
    // 顶部标签区域标签样式
    .tag-item {
      width: 10%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6rpx 0;
      border-radius: 8rpx;
      transition: all 0.3s ease;
      
      &.active {
        background-color: rgb(152, 226, 147);
      }
      
      .tag-icon {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8rpx;
        
        &.tag-type-1 {
          background-color: #EE6666; // 支出
          
          &.tag-style-1 {
            background: linear-gradient(135deg, #FF9800, #EE6666); // 支付方式
          }
          
          &.tag-style-2 {
            background: linear-gradient(135deg, #EE6666, #9C27B0); // 账单类型
          }
          
          &.tag-style-3 {
            background: linear-gradient(135deg, #EE6666, #3F51B5); // 归属人
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
          
          &.tag-style-3 {
            background: linear-gradient(135deg, #91CC75, #00BCD4); // 归属人
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
        
        &.all-icon {
          background-color: #4CAF50;
          
          &.active {
            background: linear-gradient(135deg, #4CAF50, #8BC34A);
          }
        }
        
        .icon-text {
          color: #fff;
          font-size: 24rpx;
          font-weight: bold;
        }
      }
      
      .tag-name {
        font-size: 22rpx;
        color: #333;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
      }
    }
    
    .all-tags-btn {
      position: sticky;
      top: 0;
      background-color: #fff;
      padding-top: 10rpx;
      z-index: 1;
      display: flex;
      justify-content: center;
    }
  }
  
  .filter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20rpx;
    margin-bottom: 20rpx;
    
    .account-type-filter {
      display: flex;
      
      .account-type-btn {
        padding: 12rpx 24rpx;
        margin-right: 16rpx;
        background-color: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border-radius: 30rpx;
        font-size: 24rpx;
        
        &.active {
          background-color: rgb(152, 226, 147);
          color: #4CAF50;
        }
      }
    }
    
    .add-bill-btn {
      display: flex;
      align-items: center;
      padding: 12rpx 24rpx;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: #fff;
      border-radius: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
      
      .btn-icon {
        font-size: 28rpx;
        font-weight: bold;
        margin-right: 8rpx;
      }
      
      .btn-text {
        font-size: 24rpx;
      }
      
      &:active {
        transform: scale(0.98);
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
  margin-top: calc(88rpx + var(--status-bar-height) + 460rpx);
  height: calc(100vh - 88rpx - var(--status-bar-height) - 440rpx);
  padding: 20rpx;
  background-color: #f5f5f5;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  .date-group {
    margin-bottom: 20rpx;
    
    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10rpx;
      
      .date {
        font-size: 28rpx;
        color: #666;
      }
      
      .daily-total {
        font-size: 24rpx;
        
        .expense {
          color: #f56c6c;
          margin-right: 10rpx;
        }
        
        .income {
          color: #67c23a;
        }
      }
    }
    
    .bill-items {
      background-color: #fff;
      border-radius: 12rpx;
      overflow: hidden;
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
    
    .empty-text {
      font-size: 28rpx;
      color: #999;
      margin-top: 20rpx;
    }
  }
}

.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .modal-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .bill-modal {
    position: relative;
    width: 650rpx;
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
      
      .close-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .close-icon {
          font-size: 40rpx;
          color: #999;
        }
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
        
        .type-selector {
          display: flex;
          
          .type-item {
            flex: 1;
            height: 80rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            margin-right: 20rpx;
            border-radius: 12rpx;
            font-size: 28rpx;
            color: #666;
            
            &:last-child {
              margin-right: 0;
            }
            
            &.active {
              background-color: rgb(152, 226, 147);
              color: #fff;
            }
          }
        }
        
        .tag-selector {
          max-height: 400rpx;
          overflow-y: auto;
          
          &::-webkit-scrollbar {
            width: 4rpx;
          }
          
          &::-webkit-scrollbar-thumb {
            background-color: #ddd;
            border-radius: 2rpx;
          }
          
          .tag-group {
            margin-bottom: 20rpx;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            .group-title {
              font-size: 24rpx;
              color: #666;
              margin-bottom: 10rpx;
              padding-left: 10rpx;
            }
          }
          
          .tag-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 16rpx;
          }
          
          .tag-select-item {
            width: 22%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10rpx 0;
            border-radius: 8rpx;
            transition: all 0.3s ease;
            
            &.active {
              background-color: rgb(152, 226, 147);
            }
            
            .tag-icon {
              width: 60rpx;
              height: 60rpx;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8rpx;
              
              &.tag-type-1 {
                background-color: #EE6666; // 支出
                
                &.tag-style-1 {
                  background: linear-gradient(135deg, #FF9800, #EE6666); // 支付方式
                }
                
                &.tag-style-2 {
                  background: linear-gradient(135deg, #EE6666, #9C27B0); // 账单类型
                }
                
                &.tag-style-3 {
                  background: linear-gradient(135deg, #EE6666, #3F51B5); // 归属人
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
                
                &.tag-style-3 {
                  background: linear-gradient(135deg, #91CC75, #00BCD4); // 归属人
                }
              }
              
              .icon-text {
                color: #fff;
                font-size: 24rpx;
                font-weight: bold;
              }
            }
            
            .tag-name {
              font-size: 22rpx;
              color: #333;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              text-align: center;
            }
          }
          
          .empty-tags {
            padding: 30rpx 0;
            text-align: center;
            color: #999;
            font-size: 26rpx;
          }
        }
        
        .date-picker {
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

.date-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .date-picker-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .date-picker-content {
    position: relative;
    width: 700rpx;
    background-color: #fff;
    border-radius: 20rpx;
    overflow: hidden;
    
    .date-picker-header {
      padding: 30rpx;
      text-align: center;
      font-size: 32rpx;
      border-bottom: 1px solid #eee;
    }
    
    .date-picker-body {
      height: 480rpx;
      
      .picker-view {
        width: 100%;
        height: 100%;
      }
      
      .picker-item {
        line-height: 80rpx;
        text-align: center;
        font-size: 28rpx;
      }
    }
    
    .date-picker-footer {
      padding: 20rpx 30rpx;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #eee;
      
      button {
        width: 200rpx;
        height: 80rpx;
        border-radius: 40rpx;
        font-size: 28rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
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

.detail-footer {
  display: flex;
  justify-content: space-between;
  
  button {
    flex: 1;
    margin: 0 10rpx;
    
    &.delete-btn {
      background-color: #f5f5f5;
      color: #EE6666;
    }
  }
}

.bill-item {
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background-color: rgb(152, 226, 147);
  }
  
  .left {
    display: flex;
    align-items: center;
    
    .icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      &.expense {
        background-color: #EE6666;
      }
      
      &.income {
        background-color: #91CC75;
      }
      
      .icon-text {
        color: #fff;
        font-size: 28rpx;
        font-weight: bold;
      }
    }
    
    .info {
      .title-row {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
        
        .title {
          font-size: 28rpx;
          color: #333;
          margin-right: 16rpx;
        }
        
        .time {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .tags {
        display: flex;
        flex-wrap: wrap;
        
        .tag {
          font-size: 22rpx;
          color: #ffffff;
          //背景色改为渐变色
          background: rgb(222, 110, 106);
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          margin-right: 10rpx;
          margin-bottom: 8rpx;
        }
      }
    }
  }
  
  .right {
    .amount {
      font-size: 32rpx;
      font-weight: 500;
      
      &.expense {
        color: #EE6666;
      }
      
      &.income {
        color: #91CC75;
      }
    }
  }
}

.custom-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000; /* 确保比其他弹窗层级高 */
  display: flex;
  align-items: center;
  justify-content: center;
  
  .confirm-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .confirm-content {
    position: relative;
    width: 600rpx;
    background-color: #fff;
    border-radius: 20rpx;
    overflow: hidden;
    z-index: 2001;
    animation: modalFadeIn 0.3s ease;
    
    .confirm-title {
      padding: 30rpx;
      text-align: center;
      font-size: 32rpx;
      font-weight: 500;
      border-bottom: 1px solid #eee;
    }
    
    .confirm-message {
      padding: 40rpx 30rpx;
      text-align: center;
      font-size: 28rpx;
      color: #666;
    }
    
    .confirm-buttons {
      display: flex;
      border-top: 1px solid #eee;
      
      button {
        flex: 1;
        height: 100rpx;
        font-size: 32rpx;
        background: none;
        border: none;
        
        &.cancel-btn {
          color: #666;
          border-right: 1px solid #eee;
        }
        
        &.delete-btn {
          color: #EE6666;
        }
        
        &:active {
          background-color: rgb(152, 226, 147);
        }
      }
    }
  }
}

.auth-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.auth-content {
  text-align: center;
  padding: 30px;
}

.auth-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  display: block;
}

.auth-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  display: block;
}

.auth-button {
  background-color: #07c160;
  color: #fff;
  padding: 12px 24px;
  border-radius: 4px;
  border: none;
}
</style>
