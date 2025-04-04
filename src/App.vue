<script>
export default {
  globalData: {
    isFirstLaunch: true
  },
  onLaunch: function() {
    console.log('App Launch')
    // 初始化请求拦截器
    this.initRequestInterceptor()
    // 直接检查授权状态
    const token = uni.getStorageSync('token')
    if (!token) {
      console.log('未找到token，需要授权登录')
      // 延迟一下再调用授权，确保页面已经准备好
      setTimeout(() => {
        this.getUserInfo().then(userInfo => {
          if (userInfo) {
            this.login(userInfo)
          }
        }).catch(error => {
          console.error('授权失败:', error)
          uni.exitMiniProgram()
        })
      }, 500)
    }
  },
  onShow: async function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 初始化请求拦截器
    initRequestInterceptor() {
      console.log('初始化请求拦截器')
      uni.addInterceptor('request', {
        invoke(options) {
          // 获取token
          const token = uni.getStorageSync('token')
          
          // 如果没有token，直接跳转到授权
          if (!token) {
            // 清除可能存在的过期数据
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.removeStorageSync('userId')
            
            // 获取当前页面路径
            const pages = getCurrentPages()
            const currentPage = pages[pages.length - 1]
            const currentPath = currentPage ? currentPage.route : ''
            
            // 如果不是在授权页面，则跳转到授权
            if (currentPath !== 'pages/auth/index') {
              uni.redirectTo({
                url: '/pages/auth/index'
              })
            }
            return false // 阻止请求继续执行
          }

          // 添加token到请求头
          options.header = {
            ...options.header,
            'Authorization': token
          }
          return options
        },
        success(response) {
          // 处理401错误或其他失败情况
          if (response.statusCode === 401 || response.data?.code === 401) {
            // 清除token等数据
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.removeStorageSync('userId')
            
            // 显示提示
            uni.showModal({
              title: '提示',
              content: '登录已过期，请重新授权',
              showCancel: false,
              success: () => {
                // 获取当前页面路径
                const pages = getCurrentPages()
                const currentPage = pages[pages.length - 1]
                const currentPath = currentPage ? currentPage.route : ''
                
                // 如果不是在授权页面，则跳转到授权
                if (currentPath !== 'pages/auth/index') {
                  uni.redirectTo({
                    url: '/pages/auth/index'
                  })
                }
              }
            })
            return false
          }
          
          // 处理其他业务失败情况
          if (response.data?.code !== 200) {
            uni.showToast({
              title: response.data?.message || '请求失败',
              icon: 'none'
            })
          }
          return response
        },
        fail(err) {
          console.error('请求失败:', err)
          // 显示错误提示
          uni.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
          return err
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
        // 如果用户拒绝授权，跳转到授权页面
        uni.redirectTo({
          url: '/pages/auth/index'
        })
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
            url: 'http://localhost:8080/api/user/login',
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
          
          // 登录成功后返回之前的页面
          const pages = getCurrentPages()
          if (pages.length > 1) {
            uni.navigateBack()
          } else {
            uni.redirectTo({
              url: '/pages/index/index'
            })
          }
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
