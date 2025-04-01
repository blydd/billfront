<template>
  <view class="iconfont" :class="[`icon-${name}`, className]" :style="{ color, fontSize: size + 'px' }"></view>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#333'
  },
  size: {
    type: [Number, String],
    default: 24
  },
  className: {
    type: String,
    default: ''
  }
})
</script>

<style>
@font-face {
  font-family: "iconfont";
  src: url('//at.alicdn.com/t/c/font_4456201_0q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q.woff2?t=1709712345678') format('woff2');
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 24px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 这里需要替换成你在iconfont上选择的图标对应的class名 */
.icon-food:before {
  content: "\e6b9";
}

.icon-shopping:before {
  content: "\e6ba";
}

.icon-transport:before {
  content: "\e6bb";
}

.icon-entertainment:before {
  content: "\e6bc";
}

.icon-medical:before {
  content: "\e6bd";
}

.icon-education:before {
  content: "\e6be";
}

.icon-housing:before {
  content: "\e6bf";
}

.icon-other:before {
  content: "\e6c0";
}

.icon-salary:before {
  content: "\e6c1";
}

.icon-bonus:before {
  content: "\e6c2";
}

.icon-investment:before {
  content: "\e6c3";
}

.icon-gift:before {
  content: "\e6c4";
}
</style> 