import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', 'e57'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '43d'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', '848'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', '1cc'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '49b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '598'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', 'a46'),
    exact: true
  },
  {
    path: '/一键搞定！Kubernetes1.29.6高可用部署指南，老少皆宜',
    component: ComponentCreator('/一键搞定！Kubernetes1.29.6高可用部署指南，老少皆宜', 'f73'),
    exact: true
  },
  {
    path: '/about',
    component: ComponentCreator('/about', 'a5c'),
    exact: true
  },
  {
    path: '/archive',
    component: ComponentCreator('/archive', 'b1a'),
    exact: true
  },
  {
    path: '/blog/first-blog',
    component: ComponentCreator('/blog/first-blog', '24c'),
    exact: true
  },
  {
    path: '/CentOS7失宠，谁又会成为下一个甄嬛!',
    component: ComponentCreator('/CentOS7失宠，谁又会成为下一个甄嬛!', 'a8a'),
    exact: true
  },
  {
    path: '/first-blog',
    component: ComponentCreator('/first-blog', '31d'),
    exact: true
  },
  {
    path: '/friends/',
    component: ComponentCreator('/friends/', 'b23'),
    exact: true
  },
  {
    path: '/Netstat命令运用之，深入理解网络连接',
    component: ComponentCreator('/Netstat命令运用之，深入理解网络连接', '699'),
    exact: true
  },
  {
    path: '/project/',
    component: ComponentCreator('/project/', '21d'),
    exact: true
  },
  {
    path: '/resource/',
    component: ComponentCreator('/resource/', 'f18'),
    exact: true
  },
  {
    path: '/Rocky Linux 9.3 系统安装',
    component: ComponentCreator('/Rocky Linux 9.3 系统安装', '41e'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', 'd36'),
    exact: true
  },
  {
    path: '/ssl证书详解',
    component: ComponentCreator('/ssl证书详解', 'd0d'),
    exact: true
  },
  {
    path: '/tags',
    component: ComponentCreator('/tags', '2d9'),
    exact: true
  },
  {
    path: '/tags/ca',
    component: ComponentCreator('/tags/ca', 'd6e'),
    exact: true
  },
  {
    path: '/tags/centos',
    component: ComponentCreator('/tags/centos', 'ece'),
    exact: true
  },
  {
    path: '/tags/docusaurus-theme-zen',
    component: ComponentCreator('/tags/docusaurus-theme-zen', '8ec'),
    exact: true
  },
  {
    path: '/tags/kubernetes',
    component: ComponentCreator('/tags/kubernetes', '94f'),
    exact: true
  },
  {
    path: '/tags/lifestyle',
    component: ComponentCreator('/tags/lifestyle', 'b82'),
    exact: true
  },
  {
    path: '/tags/linux',
    component: ComponentCreator('/tags/linux', 'f63'),
    exact: true
  },
  {
    path: '/tags/netstat',
    component: ComponentCreator('/tags/netstat', '49c'),
    exact: true
  },
  {
    path: '/tags/rocky',
    component: ComponentCreator('/tags/rocky', 'bf0'),
    exact: true
  },
  {
    path: '/tags/ssl',
    component: ComponentCreator('/tags/ssl', '004'),
    exact: true
  },
  {
    path: '/tags/tcp',
    component: ComponentCreator('/tags/tcp', '1a9'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'afe'),
    routes: [
      {
        path: '/docs/时间同步服务',
        component: ComponentCreator('/docs/时间同步服务', 'd46'),
        exact: true,
        sidebar: "stack"
      },
      {
        path: '/docs/Centos7系统---内核升级',
        component: ComponentCreator('/docs/Centos7系统---内核升级', '3a6'),
        exact: true,
        sidebar: "stack"
      },
      {
        path: '/docs/free',
        component: ComponentCreator('/docs/free', '2c4'),
        exact: true,
        sidebar: "stack"
      },
      {
        path: '/docs/lscpu',
        component: ComponentCreator('/docs/lscpu', '4e7'),
        exact: true,
        sidebar: "stack"
      },
      {
        path: '/docs/Stack',
        component: ComponentCreator('/docs/Stack', '041'),
        exact: true,
        sidebar: "stack"
      },
      {
        path: '/docs/top',
        component: ComponentCreator('/docs/top', '6c6'),
        exact: true,
        sidebar: "stack"
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '95a'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
