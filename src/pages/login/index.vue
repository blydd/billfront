<template>
  <view class="login-page-wrapper">
    <view class="login-page">
      <view class="login-page-content">
        <view class="login-page-title">请登录使用完整功能</view>
        <view class="login-page-desc">登录后可使用完整的记账和统计功能</view>
        <button class="login-page-button" @click="handleLogin">授权微信登录</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { BASE_URL } from '@/config'

// 处理登录按钮点击
const handleLogin = async () => {
  try {
    // 获取用户信息
    const userInfo = await getUserInfo()
    // 执行登录
    await login(userInfo)
    // 登录成功后跳转到明细页首页
    uni.reLaunch({
      url: '/pages/index/index'
    })
  } catch (error) {
    console.error('登录失败:', error)
  }
}

// 获取用户信息
const getUserInfo = () => {
  return new Promise((resolve, reject) => {
    uni.getUserProfile({
      desc: '用于完善用户资料',
      lang: 'zh_CN',
      success: (res) => {
        console.log('获取用户信息成功:', res)
        resolve(res.userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        reject(err)
      }
    })
  })
}

// 登录
const login = async (userInfo) => {
  try {
    // 获取微信登录凭证
    const loginRes = await uni.login()
    console.log('微信登录凭证:', loginRes)

    if (!loginRes.code) {
      throw new Error('获取登录凭证失败')
    }

    // 调用后端登录接口
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}/api/user/login`,
        method: 'POST',
        data: {
          code: loginRes.code,
          userInfo: userInfo
        },
        success: (res) => {
          console.log('登录接口响应:', res)
          resolve(res)
        },
        fail: (err) => {
          console.error('登录请求失败:', err)
          reject(err)
        }
      })
    })

    if (response.statusCode === 200 && response.data.code === 200) {
      // 保存用户信息和token
      uni.setStorageSync('token', response.data.data.token)
      uni.setStorageSync('userInfo', userInfo)
      
      // 触发登录成功事件，刷新页面数据
      uni.$emit('loginSuccess')
      uni.$emit('updateAuthStatus', true)

      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } else {
      throw new Error(response.data?.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    })
    throw error
  }
}
</script>

<style>
.login-page-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.login-page {
  width: 90%;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-page-content {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.login-page-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
}

.login-page-button {
  width: 80%;
  height: 44px;
  line-height: 44px;
  background-color: #07c160;
  color: #fff;
  border-radius: 4px;
  font-size: 16px;
  text-align: center;
}
</style>