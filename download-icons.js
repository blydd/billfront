const https = require('https');
const fs = require('fs');
const path = require('path');

const icons = [
  {
    name: 'canyin',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/coffee.svg'
  },
  {
    name: 'jiaotong',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/car.svg'
  },
  {
    name: 'zhufang',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/home.svg'
  },
  {
    name: 'fushi',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/skin.svg'
  },
  {
    name: 'jiaoyu',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/read.svg'
  },
  {
    name: 'yiliao',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/medicine-box.svg'
  },
  {
    name: 'gouwu',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/shopping.svg'
  },
  {
    name: 'renqing',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/heart.svg'
  },
  {
    name: 'baoxian',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/safety-certificate.svg'
  },
  {
    name: 'qita',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/appstore.svg'
  },
  {
    name: 'qianbao',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/wallet.svg'
  },
  {
    name: 'xinyongka',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/credit-card.svg'
  },
  {
    name: 'zhifubao',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/alipay-circle.svg'
  },
  {
    name: 'weixin',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/wechat.svg'
  },
  {
    name: 'gongzi',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/red-envelope.svg'
  },
  {
    name: 'jiangjin',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/trophy.svg'
  },
  {
    name: 'touzi',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/fund.svg'
  },
  {
    name: 'zhuanzhang',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/transaction.svg'
  },
  {
    name: 'tianjia',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/plus-circle.svg'
  },
  {
    name: 'guanbi',
    url: 'https://cdn.jsdelivr.net/npm/@ant-design/icons-svg@4.3.1/inline-svg/filled/close-circle.svg'
  }
];

const downloadIcon = (icon) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'src/static/icons', `${icon.name}.svg`);
    const file = fs.createWriteStream(filePath);

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    https.get(icon.url, options, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${icon.name}`);
          resolve();
        });
      } else {
        fs.unlink(filePath, () => {});
        reject(new Error(`Failed to download ${icon.name}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
};

const downloadAll = async () => {
  try {
    for (const icon of icons) {
      try {
        await downloadIcon(icon);
      } catch (error) {
        console.error(`Error downloading ${icon.name}:`, error.message);
      }
    }
    console.log('All icons downloaded successfully!');
  } catch (error) {
    console.error('Error downloading icons:', error);
  }
};

downloadAll(); 