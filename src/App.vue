<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 初始化请求拦截器
    this.initRequestInterceptor()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 初始化请求拦截器
    initRequestInterceptor() {
      // 添加拦截器
      const requestTaskList = []
      
      uni.addInterceptor('request', {
        invoke(args) {
          console.log('请求参数:', args)
          // 这里可以添加你的请求拦截逻辑
          args.header = {
            ...args.header,
            'content-type': 'application/json'
          }
          
          // 创建请求任务
          let task = null
          args.complete = (res) => {
            console.log('请求完成:', res)
            // 从任务列表中移除
            const index = requestTaskList.indexOf(task)
            if (index !== -1) {
              requestTaskList.splice(index, 1)
            }
          }
          return args
        },
        success(args) {
          console.log('请求成功:', args)
          // 这里可以添加你的响应拦截逻辑
          if (args.statusCode === 401) {
            // 处理未授权的情况
            uni.showToast({
              title: '请先登录',
              icon: 'none'
            })
          }
          return args
        },
        fail(err) {
          console.error('请求失败:', err)
          uni.showToast({
            title: '网络请求失败',
            icon: 'none'
          })
          return err
        },
        complete(res) {
          console.log('请求结束:', res)
          return res
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
