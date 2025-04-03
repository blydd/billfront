<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查是否已授权
    this.checkAuth()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 检查授权状态
    checkAuth() {
      const userId = uni.getStorageSync('userId')
      const token = uni.getStorageSync('token')
      
      // 如果没有用户ID或token，跳转到授权页面
      if (!userId || !token) {
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        
        // 如果当前不在授权页面，则跳转到授权页面
        if (currentPage && currentPage.route !== 'pages/auth/index') {
          uni.reLaunch({
            url: '/pages/auth/index'
          })
        }
      }
    }
  }
}
</script>

<style>
/*每个页面公共css */
</style>
