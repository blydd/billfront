module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        'Android >= 4',
        'iOS >= 8'
      ],
      remove: false
    })
  ]
} 