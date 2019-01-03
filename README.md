# gr-core-api

[![Greenkeeper badge](https://badges.greenkeeper.io/panjizhi/gr-core-api.svg)](https://greenkeeper.io/)

GR core APIs

#### 简介
项目分为两部分，前端和服务端，前端代码在 Font 目录，其余为服务端代码

#### 编译
前端使用 React，执行 `npm run build` 编译，输出位置见 webpack.build.config.js 中设置  
将编译后的文件 js 和 css 部分放入 assets 目录，页面部分放入 views 目录

#### 部署
将编译后的前端代码文件与服务器端文件合并后上传部署位置
项目使用 pm2 运行，启动文件为 launch.json，命令为 `pm2 start launch.json`
