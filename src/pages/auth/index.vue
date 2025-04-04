<template>
  <view class="auth-container">
    <view class="logo-section">
      <image class="logo" src="/static/images/logo.png" mode="aspectFit"></image>
      <text class="app-name">账单管理系统</text>
      <text class="app-desc">您的个人财务助手</text>
    </view>
    
    <view class="auth-section">
      <text class="auth-title">授权登录</text>
      <text class="auth-desc">请授权获取您的微信头像和昵称，以便为您提供个性化服务</text>
      
      <!-- 微信小程序登录按钮 -->
      <button class="auth-button" open-type="getUserInfo" @getuserinfo="handleUserInfo">
        <text class="button-text">微信授权登录</text>
      </button>
      
      <text class="privacy-text">登录即表示您同意我们的<text class="link" @click="showPrivacy">隐私政策</text></text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 检查是否已授权
onMounted(() => {
  checkAuth()
})

// 检查授权状态
const checkAuth = () => {
  uni.getSetting({
    success: (res) => {
      if (res.authSetting['scope.userInfo']) {
        // 已经授权，可以直接获取用户信息
        getUserInfo()
      }
    }
  })
}

// 获取用户信息
const getUserInfo = () => {
  uni.getUserInfo({
    success: (res) => {
      // 保存用户信息
      saveUserInfo(res.userInfo)
    }
  })
}

// 处理用户授权
const handleUserInfo = (e) => {
  if (e.detail.userInfo) {
    // 用户同意授权
    saveUserInfo(e.detail.userInfo)
  } else {
    // 用户拒绝授权
    uni.showToast({
      title: '您拒绝了授权，部分功能将无法使用',
      icon: 'none',
      duration: 2000
    })
  }
}

// 保存用户信息
const saveUserInfo = async (userInfo) => {
  try {
    uni.showLoading({
      title: '登录中...'
    })
    
    // 获取微信登录凭证
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
    
    if (loginRes.code) {
      // 发送登录请求到后端
      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: '/api/user/login',
          method: 'POST',
          data: {
            code: loginRes.code,
            userInfo: userInfo
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
        // 保存用户信息和token
        const userData = response.data.data
        uni.setStorageSync('userInfo', userInfo)
        uni.setStorageSync('userId', userData.userId)
        uni.setStorageSync('token', userData.token)
        
        // 跳转到首页
        uni.reLaunch({
          url: '/pages/index/index'
        })
      } else {
        uni.showToast({
          title: response.data?.message || '登录失败',
          icon: 'none'
        })
      }
    }
  } catch (error) {
    uni.hideLoading()
    console.error('登录失败:', error)
    uni.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    })
  }
}

// 显示隐私政策
const showPrivacy = () => {
  uni.navigateTo({
    url: '/pages/privacy/index'
  })
}
</script>

<style lang="scss" scoped>
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  min-height: 100vh;
  background-color: #fff;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
  margin-top: 60rpx;
  
  .logo {
    width: 180rpx;
    height: 180rpx;
    margin-bottom: 30rpx;
  }
  
  .app-name {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }
  
  .app-desc {
    font-size: 28rpx;
    color: #666;
  }
}

.auth-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .auth-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .auth-desc {
    font-size: 28rpx;
    color: #666;
    text-align: center;
    margin-bottom: 60rpx;
    padding: 0 40rpx;
  }
  
  .auth-button {
    width: 80%;
    height: 90rpx;
    background: linear-gradient(135deg, #4CAF50, #8BC34A);
    border-radius: 45rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
    box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.3);
    
    .button-text {
      color: #fff;
      font-size: 32rpx;
      font-weight: 500;
    }
  }
  
  .privacy-text {
    font-size: 24rpx;
    color: #999;
    
    .link {
      color: #4CAF50;
    }
  }
}
</style> 