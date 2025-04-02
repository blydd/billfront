
<script setup>
// App 全局生命周期
const onLaunch = () => {
  console.log('App Launch')
}

const onShow = () => {
  console.log('App Show')
}

const onHide = () => {
  console.log('App Hide')
}

// 导出生命周期函数
defineExpose({
  onLaunch,
  onShow,
  onHide
})
</script>

<style>
/*每个页面公共css */
</style>
