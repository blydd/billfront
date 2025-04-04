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
  onShow: async function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
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
        },
        fail(err) {
          console.error('请求失败:', err)
          requestTasks.delete(err)
        },
        complete(res) {
          requestTasks.delete(res)
        }
      })
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        console.log('开始获取用户信息')
        const res = await new Promise((resolve, reject) => {
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
        return res
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 触发首页的授权状态更新
        uni.$emit('updateAuthStatus', false)
        throw error
      }
    },

    // 登录
    async login(userInfo) {
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
          uni.setStorageSync('userId', response.data.data.userId)
          uni.setStorageSync('token', response.data.data.token)
          uni.setStorageSync('userInfo', userInfo)
          
          // 触发登录成功事件，刷新页面数据
          uni.$emit('loginSuccess')
          uni.$emit('updateAuthStatus', true)
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
  }
}
</script>

<style>
/*每个页面公共css */
page {
  background-color: #f5f5f5;
}
</style>
