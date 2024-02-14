
## Docusaurus-Theme-Zen [<img src="static/assets/images/avatar300.png" width="90" height="90" align="right">](https://wrm244.github.io/docusaurus-theme-zen/)

<p align="center">
<img src="https://img.shields.io/github/last-commit/wrm244/docusaurus-theme-zen?label=update&logo=github" alt="last-commit" />
<img src="https://github.com/wrm244/docusaurus-theme-zen/actions/workflows/ci.yml/badge.svg" alt="Github Action" />
<img src="https://img.shields.io/badge/readme%20style-standard-brightgreen.svg" alt="standard-readme compliant" />
<img src="https://img.shields.io/node/v/create-docusaurus" alt="node-current" />
<img src="https://img.shields.io/github/languages/code-size/wrm244/docusaurus-theme-zen" alt="GitHub code size in bytes" />
<img src="https://img.shields.io/github/release-date/wrm244/docusaurus-theme-zen" alt="GitHub Release Date" />
</p>

<p align="center">
<a href="https://wrm244.github.io/docusaurus-theme-zen/">Online Preview</a> | <a href="./READMEN.md">English</a>
</p>

<p align="center">
<a href="https://stackblitz.com/github/wrm244/docusaurus-theme-zen" rel="nofollow"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg"></a> <a href="https://vercel.com/new/clone?repository-url=https://github.com/wrm244/docusaurus-theme-zen/tree/main&project-name=blog&repo-name=blog" rel="nofollow"><img src="https://vercel.com/button"></a>
<a href="https://app.netlify.com/start/deploy?repository=https://github.com/wrm244/docusaurus-theme-zen" rel="nofollow"><img src="https://www.netlify.com/img/deploy/button.svg"></a>
<br/>
</p>

<p align=center>
<a href="https://docusaurus.io/zh-CN/" target="_blank"><img alt="Built with Docusaurus" width="141" height="50" src="https://wrm244.github.io/assets/images/buildwith.png" /></a> <a href="https://www.netlify.com/" target="_blank"><img alt="Built with Netlify" height:"50px" src="https://wrm244.github.io/assets/images/netlify-color-accent.svg" /></a>     
</p>

## 介绍

![网站首页](./static/assets/images/docus.png)

![网站首页](./static/assets/images/docus_bark.png)

这是使用docusaurus搭建的主题，结合了docusaurus简单易用与其他开源页面设计方案、支持MDX和React、可扩展和定制等优点，以及加上多设计美观、博客与文档一体的主题，为你提供了一个优秀的个人页面解决方案。该主题使用🦖 <a href="https://docusaurus.io/">Docusaurus</a>搭建，参考[kuizuo](https://kuizuo.cn/)进行二次修改，遵循[MIT](./LICENSE)协议。
> This is a theme built with docusaurus, which combines the simplicity and ease of use of docusaurus with other open source page design solutions, supports MDX and React, is extensible and customizable, and also has a beautiful design, a blog and documentation integrated theme, providing you with an excellent personal page solution.

## 特性
- [x] 主页+博客+文档三合一
- [x] 利用Typescript自定义页面
- [X] 生成全静态网页文件 
- [x] 优化页面符合现代美观(毛玻璃虚化样式，pwa优化...)
- [X] 支持国际化 
- [x] 代码项目展示
- [x] 代码块显示行号
- [x] 结合obsidian进行写作 
- [x] tex数学公式渲染
- [ ] 直接转为幻灯片格式，可在线浏览放映
- [ ] 个人简历页面
- [ ] 分享功能

> 前几点是docusaurus自带特性，参考[kuizuo](https://kuizuo.cn/)进行二次修改

## 目录结构

```bash
├── blog                           # 博客
│   ├── first-blog.md
│   └── authors.yml                # 作者信息(可以多个作者)
├── docs                           # 文档/笔记
│   └── stack
│         └──introduction.md       # 笔记介绍
├── data                           # 项目/导航/友链数据
│   ├── friend.ts                  # 友链
│   ├── project.ts                 # 项目
│   └── resource.ts                # 资源导航
├── i18n                           # 国际化
├── src
│   ├── components                 # 组件
│   ├── css                        # 自定义CSS
│   ├── pages                      # 自定义页面
│   ├── plugin                     # 自定义插件
│   └── theme                      # 自定义主题组件
├── static                         # 静态资源文件
│   └── assets                     # 静态文件
├── docusaurus.config.js           # 站点的配置信息
├── sidebars.js                    # 文档的侧边栏
├── package.json
└── yarn.lock                      # 建议使用yarn保留
```

## 安装

克隆仓库并安装依赖
```bash
git clone https://github.com/wrm244/docusaurus-theme-zen.git ./blog
cd blog
yarn
yarn start
```

国内仓库备份
```bash
git clone https://gitee.com/wrm244/docusaurus-theme-zen.git ./blog
cd blog
yarn
```

生成静态网页代码(./build)

```bash
yarn run build
```

启动服务
```bash
yarn run serve
```

## Github Action CI
该流程配置会同步部署到云服务器与GitHub Pages上面：
修改```/.github/workflows/ci.yml```路径下的配置文件
```yml
name: ci

on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Use Node.js v18.5
        uses: actions/setup-node@v3
        with:
          node-version: '18.5.0'

      #使用缓存
      - name: Cache node modules
        uses: actions/cache@v1
        id: cache
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - name: Install Dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: yarn install
      
      - name: Build Project
        run: |
          yarn run build

      #使用SSH同步到云服务器
      # - name: SSH Deploy
      #   uses: easingthemes/ssh-deploy@v2.2.11
      #   env:
      #     SSH_PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
      #     ARGS: '-avzr --delete'
      #     SOURCE: './build'
      #     REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
      #     REMOTE_USER: 'root'
      #     TARGET: '/www/wwwroot/wrm244'

      - name: Github page Deploy
        uses: wrm244/docusaurus-deploy-action@master # 
        env:
          PERSONAL_TOKEN: ${{ secrets.PERSION_TOKEN }} # 你的Github个人账号密钥
          PUBLISH_REPOSITORY: wrm244/docusaurus-theme-zen # 公共仓库，格式：GitHub 用户名/仓库名
          BRANCH: gh-pages # 部署分支
          PUBLISH_DIR: ./build # 部署 ./build 目录下的文件

```


## License

[MIT](./LICENSE) © 河山 100%
