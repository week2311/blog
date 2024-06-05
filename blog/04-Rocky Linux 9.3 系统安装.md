---
slug: Rocky Linux 9.3 系统安装
title: Rocky Linux 9.3 系统安装
date: 2024-06-05 21:35
tags: [rocky,linux]
authors: Week
---
<!-- ![logo](/assets/images/rockylinux.jpg) -->
![rocky](/assets/images/rockylinux.jpg)
### 写在前面

​		Centos最为Linux开源发行版中最受人欢迎的系列，即将迎来它的黄昏。其所带来的价值是无限的，地位是不可替代的。我也是其中受益的一份子。

​		正因如此，需要找到能够平替的新系统：差异化小，稳定健壮，提供长支持能力。

​		Ubuntu，Fedora，SUSE，RedHat，Rocky......都是能够考虑的。

​		今天推荐的是Rocky Linux，与Centos几乎无异，命令通用，安装简单，开源，对标RH而进行的代码重构，且作者是前Centos项目的创始人，提供长期支持，提供Centos迁移方案等，是我认为该系统是下一个Centos。


<!-- truncate -->


### 安装步骤：

1. 官网下载Rocky Linux 9.3镜像

   注意：在本文编写时间，Rocky最新版本9.4发布，官网的下载页面默认均为9.4，下载地址为：

   ```shell
   https://download.rockylinux.org/pub/rocky/9/isos/x86_64/Rocky-9.4-x86_64-minimal.iso
   ```

   ​			如果想要下载历史版本的镜像，地址与上面并不相同。目前Rocky 9.3下载地址为：

   ```shell
   https://dl.rockylinux.org/vault/rocky/9.3/isos/x86_64/Rocky-9.3-x86_64-minimal.iso
   ```

   

2. Rocky Linux 9.3 系统安装

   * Vmware 17版本演示.

   * 新建虚拟机步骤不再赘述. 

     * 磁盘容量：50G

     * 内存：1G；CPU：1核

     * 选用 步骤1 中现在的镜像.

     * 需要注意的是，在`新建虚拟机的导向过程`中，客户机操作系统的选择，版本这里选用的是：其它 Linux 5.x 内核 64 位. 

     * 启动虚拟机，出现如下界面. （ 了解Centos7系统的，相信并不陌生. ）默认第一步即可. 

       ![image-20240604143043854](/images/04-rocky_linux/image-20240604143043854.png)

     * 进入安装界面，语言选择 中文简体 ；继续，进入该界面: 

       ​	![image-20240604143507063](/images/04-rocky_linux/image-20240604143507063.png)

       * 进入：软件选择，勾选标准安装. （ 附带上系统环境软件 ）.
       * 进入：安装目的地，自定义划分磁盘：/boot分区：512M-1024M；swap分区：内存的2倍（若真实服务器内存>16GB，则swap分区大小为内存的1倍）；/分区：剩余全部 .

       ![image-20240604144215882](/images/04-rocky_linux/image-20240604144215882.png)

       * 进入：Root密码，配置root密码，并勾选下方的`允许使用root用户进行ssh远程登录.` .

       * 开始安装 . 

       * 安装结束，进入登录界面. 

         * 提示信息：activate the web console with:  systemctl enable --now cockpit.socket

           该含义是：使用命令："systemctl enable --now cockpit.socket" 激活web管理界面。即该系统安装了cockpit, 激活cockpit, 能够实现图形化界面管理Rocky Linux系统。

     3. IP地址配置，SSH远程连接

        不同于Centos7，Rocky Linux 9.3中配置IP地址的方式，有较大的差别。配置方式有三种：

        1. nmtui：通过图形化界面配置网络
        2. nmcli：通过命令/交互方式配置网络（官方推荐）
        3. 网卡配置文件方式配置网络（官方不推荐）

        但由于本人是Centos7系统的重度感染者，依旧习惯于编辑网卡配置文件的方式。

        ```shell
        # 编辑网络配置文件
        vi /etc/NetworkManager/system-connections/ens33.nmconnection
        
        [connection]
        id=ens33
        uuid=a5d63f95-a602-3897-943a-f48238886e99
        type=ethernet
        autoconnect-priority=-999
        interface-name=ens33
        
        [ethernet]
        
        [ipv4]
        method=manual
        address=192.168.10.166/24
        gateway=192.168.10.2
        dns=114.114.114.114;8.8.8.8
        
        [ipv6]
        addr-gen-mode=eui64
        method=auto
        
        [proxy]
        
        # 重启生效
        nmcli connection  load /etc/NetworkManager/system-connections/ens33.nmconnection
        nmcli connection  up /etc/NetworkManager/system-connections/ens33.nmconnection 
        
        # 查看生效
        ifconfig ens33 或者 ip addr
        ```

        上述网卡文件内容解释 ( 内容来自官网：[RL9 - network manager - Documentation (rockylinux.org)](https://docs.rockylinux.org/zh/gemstones/network/RL9_network_manager/?h=networkmanager) )：

        | connection     |                                                              |
        | -------------- | ------------------------------------------------------------ |
        | 键名称         | 描述                                                         |
        | id             | con-name 的别名，其值为字符串。                              |
        | uuid           | 设备唯一表示。                                               |
        | type           | 连接的类型，其值可以是 ethernet、bluetooth、vpn、vlan 等等。 您可以使用 `man nmcli` 查看所有支持的类型。 |
        | interface-name | 此连接绑定到的网络接口的名称，其值为字符串。                 |
        | timestamp      | Unix 时间戳，以秒为单位。 此处的值是自1970年1月1日以来的秒数。 |
        | autoconnect    | 是否随系统开机自启动。 值为布尔型。                          |
        |                |                                                              |
        | **ethernet**   |                                                              |
        | 键名称         | 描述                                                         |
        | mac-address    | MAC 物理地址。                                               |
        | mtu            | 最大传输单位。                                               |
        | auto-negotiate | 是否自动协商。 值为布尔型。                                  |
        | duplex         | 值可以是 half （半双工）、full（全双工）                     |
        | speed          | 指定网卡的传输速率。 100 即 100Mbit/s。 如果**auto-negotiate=false**，则必须设置 **speed** 键和 **duplex** 键；如果 **auto-negotiate=true**，则使用的速率为协商速率，此处的写入不生效（仅适用于BASE-T 802.3规范）；当非零时，**duplex** 键必须有值。 |
        |                |                                                              |
        | **ipv4**       |                                                              |
        | 键名称         | 描述                                                         |
        | address        | 分配的IP地址。                                               |
        | gateway        | 分配的网关地址。                                             |
        | dns            | 分配的dns地址，多个dns地址之间使用；分隔。                   |
        | method         | IP获取的方法。 值是字符串类型。 值可以是：auto、disabled、link-local、manual、shared【auto：自动获取；manual：静态获取】 |

     

     **至此，可以通过远程连接工具，连接使用。**
### 写在最后

​			对于大多数企业来讲，更换一个操作系统，风险，精力是巨大的，可能更多的是选择后来者的业务部署在新的系统，逐渐的转变。

​			Rocky Linux希望能够成为各位的选择.......

​	

