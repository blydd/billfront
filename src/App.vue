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
        invoke(args) {
          console.log('请求参数:', args)
          // 添加token到请求头
          const token = uni.getStorageSync('token')
          args.header = {
            ...args.header,
            'content-type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
          return args
        },
        success(args) {
          console.log('请求成功:', args)
          // 如果是登录接口，不处理401
          if (args.config && args.config.url.includes('/api/user/login')) {
            return args
          }
          // 处理401未授权的情况
          if (args.statusCode === 401) {
            uni.exitMiniProgram()
          }
          return args
        },
        fail(err) {
          console.error('请求失败:', err)
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
        } else {
          throw new Error(response.data?.message || '登录失败')
        }
      } catch (error) {
        console.error('登录失败:', error)
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
