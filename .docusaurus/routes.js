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
    component: ComponentCreator('/Netstat命令运用之，深入理解网络连接', '08d'),
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
    path: '/tags/docusaurus-theme-zen',
    component: ComponentCreator('/tags/docusaurus-theme-zen', '8ec'),
    exact: true
  },
  {
    path: '/tags/lifestyle',
    component: ComponentCreator('/tags/lifestyle', 'b82'),
    exact: true
  },
  {
    path: '/tags/netstat',
    component: ComponentCreator('/tags/netstat', 'ff8'),
    exact: true
  },
  {
    path: '/tags/ssl',
    component: ComponentCreator('/tags/ssl', '004'),
    exact: true
  },
  {
    path: '/tags/tcp',
    component: ComponentCreator('/tags/tcp', '391'),
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
    component: ComponentCreator('/', 'd6f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
