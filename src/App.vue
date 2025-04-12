<template>
  <view>
  </view>
</template>

<script>
import { BASE_URL } from '@/config'

export default {
  globalData: {
    isFirstLaunch: true
  },
  onLaunch() {
    console.log('App Launch')
    this.initRequestInterceptor()
  },
  
  onReady() {
    console.log('App Ready')
    // 创建全局登录弹窗事件监听
    this.createLoginModal()
  },
  
  onShow: async function() {
    console.log('App Show')
  },
  
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 创建全局登录事件监听
    createLoginModal() {
      // 监听显示登录页面事件
      uni.$on('showLoginModal', () => {
        uni.navigateTo({
          url: '/pages/login/index'
        })
      })
    },
    
    initRequestInterceptor() {
      const requestTasks = new Set()
      let isRedirecting = false
      
      uni.addInterceptor('request', {
        invoke(args) {
          // 不需要token的接口列表
          const whiteList = ['/api/user/login']
          const needToken = !whiteList.some(path => args.url.includes(path))
          
          if (needToken) {
            const token = uni.getStorageSync('token')
            if (!token) {
              // 清除用户信息，触发首页的授权状态更新
              uni.clearStorageSync()
              uni.$emit('updateAuthStatus', false)
              return false
            }
            args.header = {
              ...args.header,
              'Authorization': `Bearer ${token}`
            }
          }
          requestTasks.add(args)
        },
        success(args) {
          requestTasks.delete(args)
          // 处理401未授权的情况
          if (args.statusCode === 401) {
            // 清除用户信息，触发首页的授权状态更新
            uni.clearStorageSync()
            uni.$emit('updateAuthStatus', false)
          }
          
          // 处理状态码100的情况（需要登录）
          if (args.statusCode === 200 && args.data && args.data.code === 100) {
            console.log('接口返回状态码100，需要登录')
            // 先显示提示信息
            uni.showToast({
              title: '请先登录',
              icon: 'none',
              duration: 1000,
              mask: true
            })
            // 延迟跳转，确保toast显示完整
            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/index'
              })
            }, 1000)
          }
        },
        fail(err) {
          console.error('请求失败:', err)
          requestTasks.delete(err)
        },
        complete(res) {
          requestTasks.delete(res)
        }
      })
    }
  }
}
</script>

<style>
/*每个页面公共css */
page {
  background-color: #f5f5f5;
}
</style>
