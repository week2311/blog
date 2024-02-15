---
slug: first-blog
title: Docusaurus博客搭建
date: 2024-02-15 19:20
tags: [docusaurus-theme-zen,lifestyle]
authors: Week
---
<!-- ![logo](/assets/images/avatar300.png) -->
## 网站由来
对于碎片化的信息，知识，一直都没有很好的整理。有做过文档笔记，但是查找起来很麻烦，有的时候还不如直接百度来的快，因此也出现了重复性的搜索，于是为了方便自己，提高效率，萌生了搭建博客的想法。
docusaurus博客框架符合我的美感，之前也看过其他的博客框架，例如Hero，Wiki，Wordpress，Hexo等，但都不太喜欢。
于是开始了解docusaurus，但自身并不懂前端语言，于是就在看到了河山的博客，感觉很不错，接下来的工作就是进行二开了，经过了三，四天的修改，便有了今天的样貌。

## 项目目录

基于docusaurus搭建的主题，结合了简单易用与其他开源页面设计方案、支持MDX和React、可扩展和定制等优点，以及加上多设计美观、博客与文档一体的主题，为你提供了一个优秀的个人页面解决方案。该主题使用🦖 <a href="https://docusaurus.io/">Docusaurus</a>搭建，遵循[MIT](./LICENSE)协议。

<!-- truncate -->

> This is a theme built with docusaurus, which combines the simplicity and ease of use of docusaurus with other open source page design solutions, supports MDX and React, is extensible and customizable, and also has a beautiful design, a blog and documentation integrated theme, providing you with an excellent personal page solution.


## 项目目录

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
git clone https://github.com/week2311/blog.git ./blog
cd blog
yarn
yarn start
```

国内仓库备份
```bash
git clone https://github.com/week2311/blog.git ./blog
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

## Netlify托管
对于个人而言，购买一台服务器来运行项目无疑是一项不菲的支出，虽然有云服务器。
Netlify很好的解决了这个问题，每个月有 免费的 100G 流量、300分钟的构建，还有全球的CDN节点，对于我来说已经很够用了。
在Netlify官网，点击 Deploy to Netlify，根据官方步骤走了就行了，很方便快捷，但前提是你需要将项目放到github仓库，
且需要有一个域名。

## 域名访问
虽然有白嫖的域名，但建议去买一个属于自己的域名，一是国内访问快速，稳定，二是不需要很多繁琐的申请，快速。
而且一年也就一杯咖啡的钱，有的新用户也就1块钱，像我这个就是阿里云上购买申请的，还是很不错的。
SSL证书的话，可以通过腾讯云上去申请免费1年的，获取证书文件，然后将文件内容替换netlify上的，即可实现https访问。

## 📝License

[MIT](./LICENSE) © Week 100%

