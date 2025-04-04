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
      <button class="auth-button" @tap="handleAuth">
        <text class="button-text">微信授权登录</text>
      </button>
      
      <text class="privacy-text">登录即表示您同意我们的<text class="link" @tap="showPrivacy">隐私政策</text></text>
    </view>
  </view>
</template>

<script>
export default {
  onLoad() {
    // 检查是否已经有token，如果有则直接跳转
    const token = uni.getStorageSync('token')
    if (token) {
      this.redirectToHome()
      return
    }
  },
  
  methods: {
    // 处理授权登录
    async handleAuth() {
      try {
        // 获取用户信息
        const [profileError, profileRes] = await uni.getUserProfile({
          desc: '用于完善会员资料',
          lang: 'zh_CN'
        }).catch(err => [err, null])
        
        if (profileError || !profileRes) {
          throw new Error('获取用户信息失败')
        }
        
        const userInfo = profileRes.userInfo
        console.log('获取用户信息成功:', userInfo)
        
        // 显示加载提示
        uni.showLoading({
          title: '登录中...',
          mask: true
        })
        
        // 获取登录凭证
        const [loginError, loginRes] = await uni.login({
          provider: 'weixin'
        }).catch(err => [err, null])
        
        if (loginError || !loginRes || !loginRes.code) {
          throw new Error('获取登录凭证失败')
        }
        
        console.log('获取登录凭证成功:', loginRes)
        
        // 调用登录接口
        const [requestError, response] = await uni.request({
          url: 'http://localhost:8080/api/user/login',
          method: 'POST',
          data: {
            code: loginRes.code,
            userInfo: userInfo
          },
          header: {
            'content-type': 'application/json'
          }
        }).catch(err => [err, null])
        
        uni.hideLoading()
        
        if (requestError) {
          throw new Error('网络请求失败')
        }
        
        if (response.statusCode !== 200 || response.data.code !== 200) {
          throw new Error(response.data?.message || '登录失败')
        }
        
        // 保存用户信息和token
        const userData = response.data.data
        uni.setStorageSync('userInfo', userInfo)
        uni.setStorageSync('userId', userData.userId)
        uni.setStorageSync('token', userData.token)
        
        // 显示成功提示
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })
        
        // 延迟跳转
        setTimeout(() => {
          this.redirectToHome()
        }, 1500)
        
      } catch (error) {
        console.error('授权登录失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    },
    
    // 跳转到首页
    redirectToHome() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }
    },
    
    // 显示隐私政策
    showPrivacy() {
      uni.showModal({
        title: '隐私政策',
        content: '我们会依法保护您的个人信息安全...',
        showCancel: false
      })
    }
  }
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
    border: none;
    
    &::after {
      border: none;
    }
    
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