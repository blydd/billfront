// 请求拦截器
const request = (options) => {
  // 登录相关的接口不需要添加token
  const isAuthApi = options.url.includes('/api/user/login');
  
  // 获取用户ID和token
  const userId = uni.getStorageSync('userId')
  const token = uni.getStorageSync('token')
  
  // 添加请求头
  const header = options.header || {}
  
  // 非登录接口才添加认证信息
  if (!isAuthApi) {
    if (userId) {
      header['X-User-ID'] = userId
    }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
  }
  
  // 处理请求URL
  let url = options.url;
  // 如果是相对路径，添加基础URL
  if (url.startsWith('/api')) {
    // #ifdef H5
    // H5环境使用相对路径
    // #endif
    
    // #ifdef MP-WEIXIN
    // 小程序环境使用完整URL
    url = 'https://your-api-domain.com' + url;
    // #endif
  }
  
  // 返回请求Promise
  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: options.method || 'GET',
      data: options.data,
      header: header,
      success: (res) => {
        // 检查token是否过期
        if (res.statusCode === 401 && !isAuthApi) {
          // token过期，跳转到授权页面
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          })
          
          // 清除本地存储的用户信息
          uni.removeStorageSync('userInfo')
          uni.removeStorageSync('userId')
          uni.removeStorageSync('token')
          
          // 跳转到授权页面
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/auth/index'
            })
          }, 1500)
          
          reject(res)
        } else {
          resolve(res)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export default request 