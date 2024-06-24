---
slug: 一键搞定！Kubernetes1.29.6高可用部署指南，老少皆宜
title: 一键搞定！Kubernetes1.29.6高可用部署指南，老少皆宜
date: 2024-06-24 19:40
tags: [kubernetes,centos,rocky]
authors: Week
---
<!-- ![logo](/assets/images/docker.png) -->
![rocky](/assets/images/docker.png)

### 写在前面

​	一直想沉淀一篇Kubernetes高可用安装的文章，之前都是参考网上的博客，虽然安装的大致逻辑是有，可具体的细节没有梳理，还是模糊。

​	正好前段时间 Kubernetes 10周年际，借此时间，钻研一番。

​	本文使用的安装方式是: Kubeadm

<!-- truncate -->

## 预备知识

​	Kubernetes是容器编排工具，即统一管理，控制，调度容器。

​	Kubernetes整体，由控制面（Control Plan）和数据面（Data Plan）组成。

​	Kubernetes控制面，是整个集群的核心，大脑，控制面出现问题，瘫痪，Kubernetes会无法正常使用。

​	Kubernetes控制面，是由多个组件共同协作，完成相对应的工作。组件包括：

  * Kube-Apiserver: 整个集群的通信入口, 大脑。

  * Kube-Scheduler：将资源调度分配到数据面。
  * Kube-Controller-Manager：集群资源的控制器。
  * Etcd：整个集群的数据库。

Kubernetes数据面，即每一个node, 是工作节点。每个工作节点上需要部署多个组件, 完成与控制面通信等工作。组件包括：

  * Kubelet: 用于与控制面通信, 可以理解为是agent代理程序。 
  * Kubelet-Proxy: 用于代理和负载均衡每一个节点上的Pod（应用程序）。
  * Container_Runtime: 容器运行时, 即能够提供Container（容器）运行环境的程序, 或者服务，称之为Container_Runtime, 例如Docker, Containerd。

Cgroup Driver: Ggroup 驱动：Linux内核提供的一种功能，用于限制，控制，隔离进程的资源（内存，cpu等）使用。容器领域的概念中, 需要对每一个容器进行资源的限制, 就需要借助这个驱动实现。而在Kubernetes集群中由Kubelet进行调用Container_Runtime, 再由Container_Runtime去创建容器, 因此：

  ​	需要在创建容器运行时服务时, 指定使用的Cgroup Driver类型。（需要和kubelet一致）

  ​	需要在创建Kubelet的时候, 指定使用的Cgroup Driver类型。（需要和容器运行时一致）

  ​	默认Cgroup Driver的类型有: cgroupfs , systemd。

！注意：如果Linux系统的init进程是systemd, 那么不推荐使用cgroupfs作为kubelet或者容器运行时的Cgroup Driver, 原因是systemd进程会创建一个cgroupfs drivers, 即systemd, 如果使用cgroupfs, 则系统当中会存在两个cgroup driver, 进而导致systemd cgroup driver的不稳定。

  ​		在Kubernetes1.22版本, 使用kubeadm安装方式, kubelet 默认使用 systemd 。

  ​		在Kubernetes1.28版本, kubelet会自动检测匹配容器运行时的cgroup驱动程序。



​那么, 实现Kubernetes的高可用, 本质上是控制面组件的高可用。



## Kubernetes高可用

​	高可用, 其实就是当控制面故障时, 整个集群依然能够正常使用的效果。

​	因此, 可以对控制面进行多副本创建, 之后再结合VIP, 反向代理, 负载均衡服务, 提供统一的访问入口, 将请求代理到后端的每一个控制面上。实现高可用。

​	在这其中, 有一个特殊的组件: Etcd。

​	Etcd作为整个Kubernetes集群的数据库, 它的重要性是更不可说的, 但其本身并不是Kubernetes的原生组件, 而是一个单独的开源项目。既然是独立的, 那么就可以进行分布式。

​	目前对Etcd的高可用实现方案, 官方提供了两种:

 1. 叠加式(不推荐): 与Kubernetes控制面叠加部署到一起, 官方架构图如下: 

    ![Stacked etcd topology](https://kubernetes.io/images/kubeadm/kubeadm-ha-topology-stacked-etcd.svg)

    可以看到, 每一个控制面节点上都部署了一个Etcd的实例, 它们之间由共同构建成Etcd的集群。

    但是这种方式也有一个弊端, 若一个控制面挂掉之后, Etcd也随之不可用。进而提高了故障的代价。因此也是不推荐的。（适用于资源有限的情况）

 2. 外部式: 外部搭建独立的Etcd集群, Kubernetes直接远程连接使用。官方架构图如下: 

    ![External etcd topology](https://kubernetes.io/images/kubeadm/kubeadm-ha-topology-external-etcd.svg)

​	这种情况下, 若控制面挂掉, 也不会影响其访问的Etcd, 提高了容错, 降低了故障成本。维护起来也方便。



## 反向代理, 负载均衡

​	反向代理, 即将客户端发送过来的请求转发给后端的服务器, 起到保护后端服务器的目的。

​	负载均衡, 即将客户端发送过来的请求根据相应的规则, 算法, 应该怎样给到后端的服务器, 起到减轻单台服务器压力的目的。

​	目前市面上实现这两种功能的服务有很多, 比如nginx, keepalived, haproxy, lvs，load balancer等等。

​	本文使用keepalived + haproxy的方式进行实现。

​	碍于资源, 本文的架构使用叠加式的方式部署。但安装方法, 步骤都是通用的。



## 安装准备

架构设计: 

| 节点名   | IP地址         | 描述   |
| -------- | -------------- | ------ |
| k8s-mn01 | 192.168.10.11  | 控制面 |
| k8s-mn02 | 192.168.10.22  | 控制面 |
| k8s-mn03 | 192.168.10.33  | 控制面 |
| k8s-wn01 | 192.168.10.100 | 数据面 |
| k8s-wn02 | 192.168.10.200 | 数据面 |

为了方便Kubernetes集群的后续使用, 减少问题出现的频率, 需要在安装之前做准备。

需要考虑的因素 (每台节点都需要操作)：

 1. 操作系统的选用: **本文安装选用Rocky9.3**。当然也可以选择开源明星: Centos系列。

    **不管是Rocky, 还是Centos, 本文的安装方法都是通用的。**

 2. 每台机器的资源分配：内存，CPU，磁盘

    * 内存: 根据业务需求，分配每个节点的内存。64G，128G，512G等。**测试学习不低于2G**。

    * CPU：根据业务需求，分配每个节点的CPU核数。8核，16核，32核，64核，128核等。

      ​	 **测试学习不低于2核**。

    * 磁盘：根据业务需求，分配每个节点的磁盘容量。1T，2T，nT等, **测试学习不低于50G**。

      在磁盘划分时, 需要注意以下路径, 最好能给一块单独的空间, 且是LVM卷(方便扩容)。

      | 路径                               | 容量       | 描述                                                         | 备注        |
      | ---------------------------------- | ---------- | ------------------------------------------------------------ | ----------- |
      | /var/lib/docker 或 /var/lib/docker | 200G--不限 | 容器存储路径, 根据需求自定义。                               | 建议LVM卷   |
      | /var/lib/etcd                      | 50G--不限  | Etcd存储路径，根据需求自定义, 使用固态磁盘，受限于磁盘速度, 故速度越快越好。 | 必须SSD磁盘 |

​		当然, 你也完全可以给/分配足够大的磁盘空间。

2. 内核版本: 5.*, 需要将操作系统内核更新到最新的稳定版。(如果内核版本过低, 则Kubernetes需要调用, 使用内核提供的模块, 参数没有, 出现问题)

   ```shell
   # 查看内核版本
   uname -r
   5.14.0-362.8.1.el9_3.x86_64
   ```

3. 节点之间的网络是需要流畅的, 统一的。

4. 节点之间的主机名是唯一的。

   ```shell
   # 配置节点的主机名 (自定义)
   # 节点1执行: 
   hostnamectl set-hostname k8s-mn01
   # 节点2执行: 
   hostnamectl set-hostname k8s-mn02
   # 节点3执行
   hostnamectl set-hostname k8s-mn03
   # 节点4执行
   hostnamectl set-hostname k8s-wn01
   # 节点5执行
   hostnamectl set-hostname k8s-wn02
   
   # 添加解析记录, 使节点直接也可以使用主机名进行访问通信
   # 每台节点执行
   cat << EOF >> /etc/hosts
   192.168.10.11 k8s-mn01
   192.168.10.22 k8s-mn02
   192.168.10.33 k8s-mn03
   192.168.10.100 k8s-wn01
   192.168.10.200 k8s-wn02
   EOF
   ```

5. 节点之间能够互相免密登录

   ```shell
   # 每个节点执行
   # 生成密钥对文件, 传输公钥到目标节点
   ssh-keygen -t rsa -b 2048 
   一路回车
   
   ssh-copy-id root@目标节点IP
   ```

6. 节点的软件仓库源.repo, 是可用的。

   ```shell
   # 每个节点执行
   # 替换成为阿里源
   sed -e 's|^mirrorlist=|#mirrorlist=|g' \
       -e 's|^#baseurl=http://dl.rockylinux.org/$contentdir|baseurl=https://mirrors.aliyun.com/rockylinux|g' \
       -i.bak \
       /etc/yum.repos.d/[Rr]ocky*.repo
       
   # 安装所需软件包
   dnf -y install ipvsadm
   ```

7. Firewalld, Selinux等安全机制关闭

   ```shell
   # 每台节点执行
   systemctl stop firewalld
   systemctl disable firewalld
   
   setenforce 0
   sed -i "/SELINUX/ s/enforcing/disabled/g" /etc/selinux/config
   ```

8. 保证端口: 6443；2379-2380；10250；10259；10257；30000-32767  未被占用, 可被监听。

9. 禁用Swap分区

   ```shell
   # 每台节点执行
   vim /etc/fstab
   #/dev/mapper/rl-swap     none                    swap    defaults        0 0
   
   swapoff -a
   ```

10. 节点之间的时间是统一的

    ```shell
    # 批注：由于RHEL8之后，官方就弃用了ntpdate软件包命令，而是建议使用chrony服务，而Rocky对标的是RHEL9，也是同样。(Centos系列完全可以使用该配置, 以下的dnf等同于yum, 所以以下的dnf命令均可以替换为yum)
    
    # 安装，配置chrony服务
    $ dnf -y install chrony
    $ vim /etc/chrony.conf
      1 # Use public servers from the pool.ntp.org project.
      2 # Please consider joining the pool (https://www.pool.ntp.org/join.html).
      3 #pool 2.rocky.pool.ntp.org iburst
      4 pool ntp.aliyun.com iburst
    
     26 # Allow NTP client access from local network.
     27 allow 192.168.10.0/24
     
    $ systemctl start chronyd
    $ systemctl enable chronyd
    $ chronyc sources
    MS Name/IP address         Stratum Poll Reach LastRx Last sample               
    ===============================================================================
    ^? 203.107.6.88                  2   6     3     2    -65ms[  -65ms] +/-   38ms
    $ date
    Mon Jun 10 21:21:37 CST 2024
    
    # 批注：上方修改chrony.conf中两处的含义是；
    # pool ntp.aliyun.com iburst: 指定使用的上游时间服务器地址
    # allow 192.168.10.0/24: 允许192.168.10.0/24网段的所有机器连接自己来同步时间
    
    # timedatectl查看时区是否为Asia/Shanghai
    $ timedatectl
                   Local time: Mon 2024-06-10 21:35:43 CST
               Universal time: Mon 2024-06-10 13:35:43 UTC
                     RTC time: Mon 2024-06-10 13:35:43
                    Time zone: Asia/Shanghai (CST, +0800)
    System clock synchronized: yes
                  NTP service: active
              RTC in local TZ: no
    # 若时区不是Asia/Shanghai，则使用该命令修改
    $ timedatectl set-timezone Asia/Shanghai
    
    # 其它节点只需要与该时间服务器同步即可, 即修改/etc/chrony.conf文件, 指定时间服务器地址: pool 时间服务器地址 iburst
    ```

11. 内核进行优化

​	注:通过配置sysctl.conf文件，对内核优化，优化方面有：系统方面，用户方面，容器方面。

​	优化的目的：提高系统的性能，服务运行需要。若不对其进行优化，在前期运行可能没有问    				题，但在后期会因为一些内核参数的值限制，导致系统，服务的运行不稳定。

​	若不优化, 你在后面维护Kubernetes过程中, 大概率会遇到 Too many open files 等报错。

​	以下参数中: net.bridge.bridge-nf-call-iptables  = 1
​                net.bridge.bridge-nf-call-ip6tables = 1
​                net.ipv4.ip_forward                 = 1

​	是Kubernetes集群安装, 运行所需要的。

```shell
$ vi /etc/sysctl.conf 
fs.file-max = 202808
net.core.netdev_max_backlog = 262144
net.core.somaxconn = 262144
net.ipv4.tcp_max_orphans = 262144
net.ipv4.tcp_max_syn_backlog = 262144
net.ipv4.tcp_synack_retries = 1
net.ipv4.tcp_syn_retries = 1
net.ipv4.ip_local_port_range = 15000 65000
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_time = 1500
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_max_tw_buckets = 6000
net.ipv4.tcp_timestamps = 0
net.ipv4.tcp_timestamps = 0
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_timestamps = 1
net.core.rmem_default = 6291456
net.core.wmem_default = 6291456
net.core.rmem_max = 12582912
net.core.wmem_max = 12582912
net.ipv4.tcp_rmem = 10240 87380 12582912
net.ipv4.tcp_wmem = 10240 87380 12582912
net.ipv4.tcp_keepalive_time=600
net.ipv4.tcp_keepalive_intvl=30 
net.ipv4.tcp_keepalive_probes=10  
net.ipv6.conf.all.disable_ipv6=1 
net.ipv6.conf.default.disable_ipv6=1 
net.ipv6.conf.lo.disable_ipv6=1 
net.ipv4.neigh.default.gc_stale_time=120 
net.ipv4.conf.all.rp_filter=0  
net.ipv4.conf.default.rp_filter=0
net.ipv4.conf.default.arp_announce=2
net.ipv4.conf.lo.arp_announce=2
net.ipv4.conf.all.arp_announce=2
net.ipv4.ip_local_port_range= 45001 65000
net.ipv4.ip_forward=1
net.ipv4.tcp_max_tw_buckets=6000
net.ipv4.tcp_syncookies=1
net.ipv4.tcp_synack_retries=2
net.bridge.bridge-nf-call-ip6tables=1
net.bridge.bridge-nf-call-iptables=1 
net.netfilter.nf_conntrack_max=2310720 
net.ipv6.neigh.default.gc_thresh1=8192
net.ipv6.neigh.default.gc_thresh2=32768
net.ipv6.neigh.default.gc_thresh3=65536
net.core.netdev_max_backlog=16384    
net.core.rmem_max=16777216         
net.core.wmem_max=16777216         
net.ipv4.tcp_max_syn_backlog=8096  
net.core.somaxconn = 32768           
fs.inotify.max_user_instances=8192   
fs.inotify.max_user_watches=524288   。
fs.file-max=52706963                
fs.nr_open=52706963                  
kernel.pid_max=4194303             
net.bridge.bridge-nf-call-arptables=1 
vm.swappiness=0                       
vm.overcommit_memory=1                
vm.panic_on_oom=0                     
vm.max_map_count=262144

# 加载上述内核参数生效所需要的模块，并加载生效
sudo modprobe overlay
sudo modprobe br_netfilter
sysctl -p
```



内核参数说明 (以下顺序不分先后): 

| 内核参数                             | 含义                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| fs.file-max                          | 系统可以分配的最大文件句柄（或打开文件）数量。       |
| net.core.netdev_max_backlog          | 内核可以为每个网络设备内部排队的最大数据包数量。     |
| net.core.somaxconn                   | 可以在监听套接字排队中排队的最大连接数。             |
| net.ipv4.tcp_max_orphans             | 内核开始丢弃连接之前允许的最大孤立套接字数量。       |
| net.ipv4.tcp_max_syn_backlog         | 等待被接受的不完整连接的最大数量。                   |
| net.ipv4.tcp_synack_retries          | 在放弃由远程端点发起的TCP连接尝试之前的重试次数。    |
| net.ipv4.tcp_syn_retries             | 在放弃本地发起的TCP连接尝试之前的重试次数。          |
| net.ipv4.ip_local_port_range         | 可用于传出连接的本地端口范围。                       |
| net.ipv4.tcp_keepalive_intvl         | 连续TCP保活探测之间的时间间隔。                      |
| net.ipv4.tcp_keepalive_probes        | 在考虑连接已死亡之前发送的TCP保活探测数量。          |
| net.ipv4.tcp_keepalive_time          | 最后发送的数据包与第一个TCP保活探测之间的时间间隔。  |
| net.ipv4.tcp_syncookies              | 启用TCP SYN cookies以防止SYN洪水攻击。               |
| net.ipv4.tcp_fin_timeout             | 在FIN-WAIT-2状态下强制关闭TCP连接之前等待的时间。    |
| net.ipv4.tcp_max_tw_buckets          | 内核可以维护的TIME_WAIT套接字的最大数量。            |
| net.ipv4.tcp_timestamps              | 启用或禁用TCP时间戳以防止某些攻击。                  |
| net.core.rmem_default                | 所有网络连接的接收缓冲区的默认大小。                 |
| net.core.wmem_default                | 所有网络连接的发送缓冲区的默认大小。                 |
| net.core.rmem_max                    | 所有网络连接的接收缓冲区的最大大小。                 |
| net.core.wmem_max                    | 所有网络连接的发送缓冲区的最大大小。                 |
| net.ipv4.tcp_rmem                    | TCP连接的接收缓冲区的最小、默认和最大大小。          |
| net.ipv4.tcp_wmem                    | TCP连接的发送缓冲区的最小、默认和最大大小。          |
| net.ipv4.tcp_tw_reuse                | 允许对新连接重用TIME_WAIT套接字。                    |
| fs.inotify.max_user_instances        | 每个用户的最大inotify实例数。                        |
| fs.inotify.max_user_watches          | 每个用户允许的最大监视数。                           |
| fs.nr_open                           | 进程可以分配的最大文件描述符数量。                   |
| kernel.pid_max                       | 进程ID号可以设置的最大值。                           |
| net.bridge.bridge-nf-call-arptables  | 启用或禁用桥接流量的ARP表过滤。                      |
| vm.swappiness                        | 控制在运行时内存和将应用程序数据缓存到内存中的平衡。 |
| vm.overcommit_memory                 | 控制系统内存的过度承诺。                             |
| vm.panic_on_oom                      | 内核在发生内存不足错误时的行为。                     |
| vm.max_map_count                     | 进程可能具有的内存映射区域的最大数量。               |
| net.ipv6.conf.all.disable_ipv6       | 禁用IPv6协议的配置参数。                             |
| net.ipv6.conf.default.disable_ipv6   | 禁用默认的IPv6协议配置参数。                         |
| net.ipv6.conf.lo.disable_ipv6        | 禁用本地回环接口的IPv6协议配置参数。                 |
| net.ipv4.neigh.default.gc_stale_time | 邻居条目被认为过时的时间。                           |
| net.ipv4.conf.all.rp_filter          | 启用或禁用反向路径过滤。                             |
| net.ipv4.conf.default.rp_filter      | 启用或禁用默认反向路径过滤。                         |
| net.ipv4.conf.default.arp_announce   | 发送ARP请求时使用的源地址类型。                      |
| net.ipv4.conf.lo.arp_announce        | 发送ARP请求时使用的源地址类型。                      |
| net.ipv4.conf.all.arp_announce       | 发送ARP请求时使用的源地址类型。                      |
| net.ipv4.ip_forward                  | 启用或禁用IP转发。                                   |
| net.ipv4.ip_local_port_range         | 可用于传出连接的本地端口范围。                       |
| net.bridge.bridge-nf-call-iptables   | 启用或禁用桥接流量的iptables过滤。                   |
| net.netfilter.nf_conntrack_max       | 连接跟踪表的最大条目数。                             |
| net.ipv6.neigh.default.gc_thresh1    | 邻居缓存的最小条目数量。                             |
| net.ipv6.neigh.default.gc_thresh2    | 邻居缓存的良好条目数量。                             |
| net.ipv6.neigh.default.gc_thresh3    | 邻居缓存的最大条目数量。                             |
| net.core.netdev_max_backlog          | 内核可以为每个网络设备内部排队的最大数据包数量。     |
| net.core.rmem_max                    | 所有网络连接的接收缓冲区的最大大小。                 |
| net.core.wmem_max                    | 所有网络连接的发送缓冲区的最大大小。                 |
| net.ipv4.tcp_max_syn_backlog         | 等待被接受的不完整连接的最大数量。                   |
| net.core.somaxconn                   | 可以在监听套接字排队中排队的最大连接数。             |
| fs.inotify.max_user_instances        | 每个用户的最大inotify实例数。                        |
| fs.inotify.max_user_watches          | 每个用户允许的最大监视数。                           |
| fs.file-max                          | 系统可以分配的最大文件句柄（或打开文件）数量。       |
| fs.nr_open                           | 进程可以分配的最大文件描述符数量。                   |
| kernel.pid_max                       | 进程ID号可以设置的最大值。                           |
| net.bridge.bridge-nf-call-arptables  | 启用或禁用桥接流量的ARP表过滤。                      |
| vm.swappiness                        | 控制在运行时内存和将应用程序数据缓存到内存中的平衡。 |
| vm.overcommit_memory                 | 控制系统内存的过度承诺。                             |
| vm.panic_on_oom                      | 内核在发生内存不足错误时的行为。                     |
| vm.max_map_count                     | 进程可能具有的内存映射区域的最大数量。               |

​	

## 运行时安装

目前Kubernetes官方推荐使用的是Containerd, 当然Docker也可以使用, 只需要添加一个shim垫片(与Kubernetes集群连接使用)。之间的原因: 懂得都懂。

本文选择的是Containerd (每台节点都需要操作)

1. 安装指定版本的Containerd.tar.gz

   ```shell
   # 因版本过多, 得到一个稳定, 推崇的, 并不太容易。
   # 借鉴于AliYun, 因其云计算的场景, 方案也成熟。
   # 本次使用的是1.6.33
   # 下载地址: 
   https://github.com/containerd/containerd/releases/download/v1.6.33/containerd-1.6.33-linux-amd64.tar.gz
   
   # 每台节点执行
   $ tar Cxzvf /usr/local containerd-1.6.33-linux-amd64.tar.gz 
   bin/
   bin/containerd-shim
   bin/containerd-stress
   bin/ctr
   bin/containerd-shim-runc-v2
   bin/containerd-shim-runc-v1
   bin/containerd
   
   # 使用官方提供的service文件：https://raw.githubusercontent.com/containerd/containerd/main/containerd.service
   
   # 必须是/usr/local/lib/systemd/system路径, 否则会找不到
   mkdir -p /usr/local/lib/systemd/system
   vim /usr/local/lib/systemd/system/containerd.service
   # Copyright The containerd Authors.
   #
   # Licensed under the Apache License, Version 2.0 (the "License");
   # you may not use this file except in compliance with the License.
   # You may obtain a copy of the License at
   #
   #     http://www.apache.org/licenses/LICENSE-2.0
   #
   # Unless required by applicable law or agreed to in writing, software
   # distributed under the License is distributed on an "AS IS" BASIS,
   # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   # See the License for the specific language governing permissions and
   # limitations under the License.
   
   [Unit]
   Description=containerd container runtime
   Documentation=https://containerd.io
   After=network.target local-fs.target
   
   [Service]
   ExecStartPre=-/sbin/modprobe overlay
   ExecStart=/usr/local/bin/containerd
   
   Type=notify
   Delegate=yes
   KillMode=process
   Restart=always
   RestartSec=5
   
   # Having non-zero Limit*s causes performance problems due to accounting overhead
   # in the kernel. We recommend using cgroups to do container-local accounting.
   LimitNPROC=infinity
   LimitCORE=infinity
   
   # Comment TasksMax if your systemd version does not supports it.
   # Only systemd 226 and above support this version.
   TasksMax=infinity
   OOMScoreAdjust=-999
   
   [Install]
   WantedBy=multi-user.target
   
   systemctl daemon-reload 
   systemctl start containerd
   systemctl enable containerd
   ```

2. 安装指定版本的Runc

   Runc: 是真正创建, 运行容器的程序, Containerd服务去创建容器时, 本身是去调用Runc程序来进行容器的创建。

   ```shell
   # 本次下载的版本是: Runc 1.1.12
   # 下载地址
   https://github.com/opencontainers/runc/releases/download/v1.1.12/runc.amd64
   
   # 安装即可
   install -m 755 runc.amd64 /usr/local/sbin/runc
   ```

3. 安装指定版本的网络插件CNI (这一步可以不做)

   CNI: Container Network Interface: 容器网络接口, 实现容器间的访问通信的, 比如Ping。

   这一步骤可以不做，因为containerd的cni插件解决的是容器间的访问通信，但是在安装kubernetes的同时，也会安装kubernetes所需要的cni插件：flannel 或者 calico。作用都是一致。

   ```shell
   # 下载地址
   https://github.com/containernetworking/plugins/releases/download/v1.4.0/cni-plugins-linux-amd64-v1.4.0.tgz
   
   # 安装
   $ mkdir -p /opt/cni/bin
   $ tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-v1.1.1.tgz
   ```

4. Containerd配置文件的生成与修改

   默认的Containerd配置文件中定义了使用了Cgroup Driver的类型, 镜像拉取的地址等, 需要进行修改成为正确的, 适合的。

   ```shell
   # 生成Containerd配置文件
   mkdir /etc/containerd
   containerd config default > /etc/containerd/config.toml
   
   # 修改Containerd使用的cgroup为systemd cgroup driver
   $ vim /etc/containerd/config.toml
   [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
     ...
     [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
       SystemdCgroup = true
   
   # 修改Containerd使用的sandbox_image
   [root@localhost ~]# vim /etc/containerd/config.toml
   sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.9"
   
   # 配置Containerd镜像加速【默认文件定义的镜像下载地址都是国外，访问不了，需要修改成国内代理】
   # containerd官方推荐的方式如下：
   $ vim /etc/containerd/config.toml
   146     [plugins."io.containerd.grpc.v1.cri".registry]
   147       config_path = "/etc/containerd/certs.d"
   148 
   149       [plugins."io.containerd.grpc.v1.cri".registry.auths]
   150 
   151       [plugins."io.containerd.grpc.v1.cri".registry.configs]
   152 
   153       [plugins."io.containerd.grpc.v1.cri".registry.headers]
   154 
   155       [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
   
   mkdir /etc/containerd/certs.d/docker.io -p
   cat > /etc/containerd/certs.d/docker.io/hosts.toml << EOF
   server = "https://docker.io"
   [host."https://i3h3dbjr.mirror.aliyuncs.com"]
     capabilities = ["pull", "resolve"]
   EOF
   
   systemctl restart containerd
   ```

5. BuildKit安装

   若想要进行镜像构建, 则需要借助BuildKit, 否则构建会报错

   ```shell
   # 下载安装包
   wget https://github.com/moby/buildkit/releases/download/v0.11.6/buildkit-v0.11.6.linux-amd64.tar.gz
   
   # 解压
   tar -zxvf buildkit-v0.11.6.linux-amd64.tar.gz
   
   # 安装
   cp -a bin/* /usr/local/bin/
   > buildctl -version
   buildctl github.com/moby/buildkit v0.11.6 2951a28cd7085eb18979b1f710678623d94ed578
   
   # 配置systemd管理
   vi /usr/lib/systemd/system/buildkitd.service
   [Unit]
   Description=/usr/local/bin/buildkitd
   ConditionPathExists=/usr/local/bin/buildkitd
   After=containerd.service
   
   [Service]
   Type=simple
   ExecStart=/usr/local/bin/buildkitd
   User=root
   Restart=on-failure
   RestartSec=1500ms
   
   [Install]
   WantedBy=multi-user.target
   
   # 启动
   systemctl daemon-reload && systemctl start buildkitd && systemctl enable buildkitd
   ```

6. 命令行工具安装

   Containerd安装部署起来之后，可以进行pull，push镜像，start，stop容器等相关操作。

   ​	Containerd默认提供的命令行工具是ctr，但是这个命令使用起来确实不太方便，很多之前Docker的命令选项都没有。

   ​	nerdctl命令工具应运而生。是一个类似于Docker CLI的命令工具，用于管理和运行容器，它提供与Docker兼容的接口，并支持和Containerd集成。

   ​	也就是说, 之前使用Docker的操作, 例如docker run; docker build; docker load等, 只需将docker换成nerdctl即可。更多使用见: [1]

   ```shell
   # 下载安装包
   wget https://github.com/containerd/nerdctl/releases/download/v1.4.0/nerdctl-1.4.0-linux-amd64.tar.gz
   
   # 解压
   mkdir /root/nerdctl
   tar -zxvf nerdctl-1.4.0-linux-amd64.tar.gz -C /root/nerdctl
   cd /root/nerdctl && ls
   containerd-rootless-setuptool.sh containerd-rootless.sh nerdctl
   
   # 安装
   cp -a nerdctl /usr/bin/nerdctl
   > nerdctl --version
   nerdctl version 1.4.0
   
   # 创建配置文件
   mkdir -p /etc/nerdctl
   $ vi /etc/nerdctl/nerdctl.toml
   namespace = "k8s.io"
   debug = false
   debug_full = false
   insecure_registry = true
   
   # 上方配置的namespace是需要指定成为k8s.io, 默认为default
   # 该namespace的作用是一种隔离机制，用于将系统资源（如进程、文件系统、网络）对不同实体进行隔离，使它们在各自的环境中运行，互不干扰。
   # 若不指定为k8s.io, 则后续在安装kubernetes过程中, 都需要指定命名空间, 很不方便。
   ```

   

## Kubeadm,Kubectl,Kubelet安装

* kubeadm：kubernetes集群部署工具。
* kubelet：运行在集群中的每一个节点上，用于启动 pod 和 容器。
* kubectl：kubernetes命令行工具，用于与kubernetes集群进行交互，例如创建pod，查看集群状态等。

所以需要在每一个控制面上安装kubelet, kubectl, 每一个数据面上安装kubelet。

kubeadm只需要安装在一台控制面主机上即可。但是为了方便下载镜像, 本文在每个节点都安装。

版本选择：

​	kubeadm的版本是1.29，则安装的的kubernetes集群版本（或者说kubernetes核心组件）肯定是1.29 或 1.28。

​	kubelet的版本必须小于kube-apiserver的版本，一般kubelet的版本选用小于等于3个kube-apiserver版本。（例如：kube-apiserver版本本次安装的是**1.29**，那么kubelet版本支持 **1.29**, **1.28**, **1.27**, 和 **1.26**。）

​	kubectl的版本只允许在1个小版本的偏差与kube-apiserver的版本。（例如：kube-apiserver版本本次安装的是1.29，那么kubectl版本支持 **1.30**, **1.29**, 和**1.28**。）

更多的版本偏差，查阅官网：[2]

安装步骤 ( 控制面安装Kubeadm, Kubectl, Kubelet; 数据面安装Kubelet ): 

```shell
# Aliyun Kubernetes Repo源 配置. 因官网的仓库地址国内访问不到, 使用阿里云提供的仓库, 内容都是一样的. 
# 三台机器相同配置: 
cat <<EOF | tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/rpm/
enabled=1
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/rpm/repodata/repomd.xml.key
EOF

dnf makecache

# 列出kubeadm等版本信息
[root@k8s-mn01 ~]# dnf --showduplicates list kubeadm | grep x86
kubeadm.x86_64                    1.29.0-150500.1.1                   kubernetes
kubeadm.x86_64                    1.29.1-150500.1.1                   kubernetes
kubeadm.x86_64                    1.29.2-150500.1.1                   kubernetes
kubeadm.x86_64                    1.29.3-150500.1.1                   kubernetes
kubeadm.x86_64                    1.29.4-150500.2.1                   kubernetes
kubeadm.x86_64                    1.29.5-150500.1.1                   kubernetes
kubeadm.x86_64                    1.29.6-150500.1.1                   kubernetes

#安装kubeadm, kubelet, kubectl 均为1.29.6-150500.1.1版本
dnf -y install kubeadm-1.29.6 kubectl-1.29.6 kubelet-1.29.6

systemctl enable kubelet && systemctl start kubelet
```



## 高可用安装

Keepalived + Haproxy是长久以来被人熟知, 经过验证的高可用方案。

前提: 需要申请一个未被使用过的IP, 作为虚拟IP (VIP)。

只需在控制面节点上操作: 

```shell
# 每个节点安装keepalived, haproxy
dnf -y install keepalived haproxy

# 创建keepalived.conf
$ /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
}

# 指定检测脚本: 
# script: 脚本路径; interval: 脚本执行时间; weight: 权重; fall: 连续检测失败多少次之后认定节点不可用; rise: 连续检测成功多少次认为节点恢复正常。
vrrp_script check_apiserver {
  script "/etc/keepalived/check_apiserver.sh"
  interval 3
  weight -2
  fall 10
  rise 2
}

# state: 指定MASTER身份, 另外两台Keepalived设置成BACKUP
# interface: 指定网卡; 
# virtual_router_id: VRRP虚拟路由id, 同一集群的Keepalived节点要相同, 用来识别彼此
# priority: 优先级, 另外两台Keepalived分别设置成90 70
# auth_type: VRRP组节点之间认证方式为PASS铭文
# auth_pass: VRRP组节点之间用来认证通信的密码
# virtual_ipaddress: VIP
# track_script: 指定使用的检测脚本名称

vrrp_instance VI_1 {
    state MASTER
    interface ens33
    virtual_router_id 51
    priority 100
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        192.168.10.240
    }
    track_script {
        check_apiserver
    }
}

# 创建检测脚本
# 该脚本的逻辑是: 检测本地的8443端口(haproxy服务)是否正常, 若不正常, 则停止本地的Keepalived服务, VIP飘逸到其它haproxy可用的节点, 继续提供服务。
$ vi /etc/keepalived/check_apiserver.sh
#!/bin/sh

curl -sfk --max-time 2 https://localhost:8443/healthz -o /dev/null 
if [ $? -nq 0]
then
        echo "*** Error GET https://localhost:8443/healthz" 1>&2
        systemctl stop keepalived
fi
# 给脚本文件执行权限
chmod +x /etc/keepalived/check_apiserver.sh 

# 创建haproxy.cfg
$ vi /etc/haproxy/haproxy.cfg
#---------------------------------------------------------------------
# Global settings
#---------------------------------------------------------------------
global
    log stdout format raw local0
    chroot      /var/lib/haproxy
    pidfile     /var/run/haproxy.pid
    maxconn     4000
    user        haproxy
    group       haproxy
    daemon

#---------------------------------------------------------------------
# common defaults that all the 'listen' and 'backend' sections will
# use if not designated in their block
#---------------------------------------------------------------------
defaults
    log                     global
    option                  httplog
    option                  dontlognull
    option                  forwardfor    except 127.0.0.0/8
    timeout connect         5s
    timeout client          35s
    timeout server          35s

#---------------------------------------------------------------------
# apiserver frontend which proxys to the control plane nodes
#---------------------------------------------------------------------
# 主要是这里的bind: 定义haproxy的代理端口为8443。也可以是其它。
frontend apiserver
    bind *:8443
    mode tcp
    option tcplog
    default_backend apiserverbackend

#---------------------------------------------------------------------
# round robin balancing for apiserver
#---------------------------------------------------------------------
# 以下是后端相关配置, 关键参数解释如下
# mode tcp: 设置与后端服务通信的模式为TCP
# balance roundrobin: 轮询方式
# inter 10s: 检查间隔为10秒。
# downinter 5s: 当服务被标记为不可用后，每5秒检查一次是否恢复。
# rise 2: 在将服务器标记为上线之前，服务器必须连续2次成功响应检查。
# fall 2: 在将服务器标记为下线之前，服务器必须连续2次失败响应检查。
# slowstart 60s: 慢启动时间为60秒，用于控制新服务器上线后逐渐增加其权重。
# maxconn 250: 每个服务器的最大并发连接数为250。
# maxqueue 256: 后端队列的最大长度为256。
# weight 100: 服务器的默认权重为100。
# server 定义后端的服务器列表。
backend apiserverbackend
    option tcplog
    option tcp-check
    mode tcp
    balance roundrobin
    default-server inter 10s downinter 5s rise 2 fall 2 slowstart 60s maxconn 250 maxqueue 256 weight 100
    server k8s-mn01 192.168.10.11:6443 check
    server k8s-mn02 192.168.10.22:6443 check
    server k8s-mn03 192.168.10.33:6443 check

# 服务整体启动
systemctl enable --now keepalived
systemctl enable --now haproxy
```



## Etcd的高可用

这里碍于资源, 并没有采用搭建外部单独的ETCD集群方案。

当然还是很推荐使用外部的ETCD集群 (前提集群够大, 小集群使用默认提供的就好), 搭建方案目前也很成熟, 使用二进制搭建, 或者使用Docker容器的方式搭建, 再或者使用Kubernetes官方提供的方案: Kubeadm方式进行安装。也都是非常不错的选择。

这里多说一句, 如果要搭建外部式ETCD, 则请不要把它同控制面安装部署在一起。我在调研Kubeadm安装ETCD高可用集群的时候, 心想尝试一下外部方式, 但是没有多余节点, 就部署到了控制面, 虽然安装上了, 但是kubeadm初始化失败, 报错为: k8s-mn01 not found。

原因就是Kubernetes集群本身认为既然是外部的Etcd, 那么就不能与控制面安装在一起, 否则会报错。解决方法也挺奇葩, 有需要的可以参考: https://github.com/kubernetes/kubeadm/issues/1438#issuecomment-493004994



## Kubeadm安装集群

安装集群需要以下镜像: 

* kube-apiserver:v1.29.6
* kube-controller-manager:v1.29.6
* kube-scheduler:v1.29.6
* kube-proxy:v1.29.6
* etcd:3.5.12-0
* pause:3.9
* coredns:v1.11.1
* calico-cni:

以上的镜像可以自行下载, 也可以直接从Aliyun镜像仓库中下载: 

```shell
# 所需镜像
registry.aliyuncs.com/google_containers/kube-apiserver:v1.29.6
registry.aliyuncs.com/google_containers/kube-controller-manager:v1.29.6
registry.aliyuncs.com/google_containers/kube-scheduler:v1.29.6
registry.aliyuncs.com/google_containers/kube-proxy:v1.29.6
registry.aliyuncs.com/google_containers/coredns:v1.11.1
registry.aliyuncs.com/google_containers/pause:3.9
registry.aliyuncs.com/google_containers/etcd:3.5.12-0

# 或者直接一条命令, 依次全部下载
kubeadm config images pull --image-repository registry.aliyuncs.com/google_containers
```

开始安装 (在第一台控制面节点操作):

```shell
# 生成默认的初始化配置文件
kubeadm config print init-defaults >  kubeadm-config.yaml

# 修改
$ vi kubeadm-config.yaml
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.10.11
  bindPort: 6443
nodeRegistration:
  criSocket: unix:///var/run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
  name: k8s-mn01
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
controlPlaneEndpoint: "192.168.10.240:8443"
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.aliyuncs.com/google_containers
kind: ClusterConfiguration
kubernetesVersion: 1.29.6
networking:
  dnsDomain: cluster.local
  serviceSubnet: 172.16.0.0/16
  podSubnet: 10.96.0.0/8
scheduler: {}
```

若是连接不是本地的, 而是外部的, 则需要将etcd那部分的配置, 修改为:

```shell
external:
    endpoints:
      - https://192.168.10.11:2379
      - https://192.168.10.22:2379
      - https://192.168.10.33:2379
    caFile: /etc/kubernetes/pki/etcd/ca.crt
    certFile: /etc/kubernetes/pki/apiserver-etcd-client.crt
    keyFile: /etc/kubernetes/pki/apiserver-etcd-client.key
```



重要配置如下: 

| 配置项               | 描述                                                         |
| -------------------- | ------------------------------------------------------------ |
| advertiseAddress     | 指定本机地址                                                 |
| bindPort             | 本机的Kube-Apiserver端口                                     |
| criSocket            | 指定与容器运行时的通信文件                                   |
| name                 | 指定本机的主机名                                             |
| controlPlaneEndpoint | 指定控制面的通信地址, 这里写VIP地址                          |
| imageRepository      | 指定下载Kubernetes组件的镜像仓库地址, 默认访问国外的仓库, 这里需要修改为国内的镜像仓库源 |
| kubernetesVersion    | 指定安装的kubernetes版本                                     |
| serviceSubnet        | 指定Kubernetes的Service资源分配的网段, 网段不能与真实机和Pod的网段冲突。 |
| podSubnet            | 指定Kubernetes的Pod资源分配的网段, 网段不能与真实机和Service的网段冲突。 |



Kubeadm-config文件配置好之后, 执行下面的命令, 进行安装：

```shell
sudo kubeadm init --config kubeadm-config.yaml --upload-certs
```

安装结果如下:

```shell
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of the control-plane node running the following command on each as root:

  kubeadm join 192.168.10.240:8443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:ed4897f63cdf316b920d12913d0d45749788f8f85d34c3b81e9b4444dea9faab \
	--control-plane --certificate-key ae20760aff597dc87e2ae67e2ab9d588f3eb9825b70ec1474855e44b849b78d3

Please note that the certificate-key gives access to cluster sensitive data, keep it secret!
As a safeguard, uploaded-certs will be deleted in two hours; If necessary, you can use
"kubeadm init phase upload-certs --upload-certs" to reload certs afterward.

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.10.240:8443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:ed4897f63cdf316b920d12913d0d45749788f8f85d34c3b81e9b4444dea9faab 

```

根据上方提示:

 1. 在执行kubeadm节点上执行:

    ```shell
      mkdir -p $HOME/.kube
      sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
      sudo chown $(id -u):$(id -g) $HOME/.kube/config
    ```

2. 在另外两台控制面节点上执行:

   ```shell
    kubeadm join 192.168.10.240:8443 --token abcdef.0123456789abcdef \
   	--discovery-token-ca-cert-hash sha256:ed4897f63cdf316b920d12913d0d45749788f8f85d34c3b81e9b4444dea9faab \
   	--control-plane --certificate-key ae20760aff597dc87e2ae67e2ab9d588f3eb9825b70ec1474855e44b849b78d3
   ```

3. 在数据面节点上执行加入集群的命令:

   ```shell
   kubeadm join 192.168.10.240:8443 --token abcdef.0123456789abcdef \
   	--discovery-token-ca-cert-hash sha256:ed4897f63cdf316b920d12913d0d45749788f8f85d34c3b81e9b4444dea9faab 
   ```

   若加入集群的令牌失效, 可以使用如下命令在控制面上重新生成: 

   ```shell
   kubeadm token create --print-join-command
   ```

4. 检测安装是否正常: 

   ```shell
   # 控制面节点
   [root@k8s-mn01 ~]# kubectl get no
   NAME       STATUS     ROLES           AGE   VERSION
   k8s-mn01   NotReady   control-plane   24h   v1.29.6
   k8s-mn02   NotReady   control-plane   24h   v1.29.6
   k8s-mn03   NotReady   control-plane   24h   v1.29.6
   k8s-wn01   NotReady   <none>          19m   v1.29.6
   k8s-wn02   NotReady   <none>          9s    v1.29.6
   ```



安装网络插件Calico: 

​	Calico截至目前为止, 最新的版本是3.28。该版本, 官方经过了与Kubernetes的充分测试, 支持: Kubernetesv1.27-1.30。

​	Calico3.27版本支持: Kubernetesv1.27-v1.29。

​	这里我们选用Calico:3.28。

​	Calico的安装方式目前有两种:

​		* 基于Operator方式安装, 能够管理Calico集群的安装, 升级, 生命周期管理等。

​		* 基于静态资源清单安装, 方便, 简单, 但无法像Opertaor一样能够自动管理Calico的生命周期。

​		  基于静态资源清单的部署常见的也分为两种: 

​				*calico.yaml*: 当Calico使用Kubernetes API作为数据存储, 且集群节点少于50个。

​				calico-typha.yaml: 当Calico使用Kubernetes API作为数据存储, 且集群节点大于50个。

​	这里我们选用基于清单的方式, 且使用calico-typha.yaml的方式部署, 对于一般的集群来说, 足够 (第一台控制面节点上操作)。

```shell
https://github.com/projectcalico/calico/blob/master/manifests/calico-typha.yaml

# 重点配置:
replicas: 副本数 , 建议每200个节点1个副本, 生产的话建议3个副本。这里默认不变: 1个。
# 以下配置: 用于给Pod分配IP的地址池范围, 因在kubeadm-config文件中定义过了Pod的IP地址池范围, 所以这里就不需要再配置了, Calico会根据kubeadm配置的来进行IP地址划分。
- name: CALICO_IPV4POOL_CIDR  
  value: "192.168.0.0/16"
# Calico默认安装使用的IPIP模式。Always: 表示全网络覆盖; Cross-SubNet: 表示跨子网覆盖; Nerver: 表示不启用。
- name: CALICO_IPV4POOL_IPIP
value: "Always"

# 镜像默认需要这些: 
docker.io/calico/cni:master
docker.io/calico/node:master
docker.io/calico/kube-controllers:master
docker.io/calico/typha:master

# 但由于镜像仓库在国外, 拉取不到, 可以换成我已经上传好的。
sed -i "s#docker.io/calico#registry.cn-hangzhou.aliyuncs.com/week-cnative#g" calico-typha.yaml 
sed -i "/week-cnative/ s/master/v3.28.0/g" calico-typha.yaml

# 安装Calico
$ kubectl apply -f calico-typha.yaml 
```



安装结束

等待Calicao所有的Pod运行起来, 集群搭建成功。

```shell
[root@k8s-mn01 ~]# kubectl get no
NAME       STATUS   ROLES           AGE   VERSION
k8s-mn01   Ready    control-plane   25h   v1.29.6
k8s-mn02   Ready    control-plane   25h   v1.29.6
k8s-mn03   Ready    control-plane   25h   v1.29.6
k8s-wn01   Ready    <none>          62m   v1.29.6
k8s-wn02   Ready    <none>          43m   v1.29.6

[root@k8s-mn01 ~]# kubectl get pod -n kube-system
NAME                                       READY   STATUS    RESTARTS         AGE
calico-kube-controllers-67d65c9d9d-wqbv9   1/1     Running   2 (38m ago)      40m
calico-node-22r7n                          1/1     Running   7 (5m59s ago)    15m
calico-node-26kqv                          1/1     Running   7 (5m44s ago)    14m
calico-node-5w4lf                          1/1     Running   7 (5m57s ago)    14m
calico-node-nmqk9                          1/1     Running   0                26s
calico-node-qgxwr                          1/1     Running   13 (6m13s ago)   40m
calico-typha-75f8b94cd7-9ks9d              1/1     Running   0                5m17s
coredns-857d9ff4c9-t62xn                   1/1     Running   0                25h
coredns-857d9ff4c9-vxs8h                   1/1     Running   0                25h
etcd-k8s-mn01                              1/1     Running   2 (20h ago)      25h
etcd-k8s-mn02                              1/1     Running   1 (20h ago)      25h
etcd-k8s-mn03                              1/1     Running   1 (20h ago)      25h
kube-apiserver-k8s-mn01                    1/1     Running   3 (75m ago)      25h
kube-apiserver-k8s-mn02                    1/1     Running   1 (20h ago)      25h
kube-apiserver-k8s-mn03                    1/1     Running   1 (20h ago)      25h
kube-controller-manager-k8s-mn01           1/1     Running   4 (20h ago)      25h
kube-controller-manager-k8s-mn02           1/1     Running   2 (26m ago)      25h
kube-controller-manager-k8s-mn03           1/1     Running   1 (20h ago)      25h
kube-proxy-h6s74                           1/1     Running   0                42m
kube-proxy-jkphx                           1/1     Running   1 (20h ago)      25h
kube-proxy-rn48p                           1/1     Running   1 (20h ago)      25h
kube-proxy-wdj8w                           1/1     Running   0                61m
kube-proxy-wv8jh                           1/1     Running   1 (20h ago)      25h
kube-scheduler-k8s-mn01                    1/1     Running   3 (20h ago)      25h
kube-scheduler-k8s-mn02                    1/1     Running   3 (25m ago)      25h
kube-scheduler-k8s-mn03                    1/1     Running   1 (20h ago)      25h


[root@k8s-mn01 ~]# nerdctl run --rm -it --net host -v /etc/kubernetes:/etc/kubernetes registry.aliyuncs.com/google_containers/etcd:3.5.12-0 etcdctl --cert /etc/kubernetes/pki/etcd/peer.crt --key /etc/kubernetes/pki/etcd/peer.key --cacert /etc/kubernetes/pki/etcd/ca.crt --endpoints https://192.168.10.11:2379,https://192.168.10.22:2379,https://192.168.10.33:2379 endpoint health --write-out=table
+----------------------------+--------+-------------+-------+
|          ENDPOINT          | HEALTH |    TOOK     | ERROR |
+----------------------------+--------+-------------+-------+
| https://192.168.10.11:2379 |   true | 39.385214ms |       |
| https://192.168.10.22:2379 |   true | 68.702829ms |       |
| https://192.168.10.33:2379 |   true | 72.560861ms |       |
+----------------------------+--------+-------------+-------+

[root@k8s-mn01 ~]# nerdctl run --rm -it --net host -v /etc/kubernetes:/etc/kubernetes registry.aliyuncs.com/google_containers/etcd:3.5.12-0 etcdctl --cert /etc/kubernetes/pki/etcd/peer.crt --key /etc/kubernetes/pki/etcd/peer.key --cacert /etc/kubernetes/pki/etcd/ca.crt --endpoints https://192.168.10.11:2379,https://192.168.10.22:2379,https://192.168.10.33:2379 endpoint status --write-out=table
+----------------------------+------------------+---------+---------+-----------+------------+-----------+---------
|          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER | RAFT TERM | RAFT INDEX | RAFT APPLIED INDEX | ERRORS |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+--------+
| https://192.168.10.11:2379 | 6571fb7574e87dba |  3.5.12 |  5.6 MB |     false |      false |        17 |      60236 |              60236 |        |
| https://192.168.10.22:2379 | a2fae84dac15fbd1 |  3.5.12 |  5.6 MB |      true |      false |        17 |      60236 |              60236 |        |
| https://192.168.10.33:2379 | 514d51979dd338dc |  3.5.12 |  5.6 MB |     false |      false |        17 |      60236 |              60236 |        |
+----------------------------+------------------+---------+---------+-----------+------------+-----------+--------+

```

安装成功之后, Kubernetes会生成一系列的目录, 重要的目录, 解释如下: 

```shell
[root@k8s-mn01 ~]# tree /etc/kubernetes/
/etc/kubernetes/							
├── admin.conf								
├── controller-manager.conf					
├── kubelet.conf
├── manifests
│   ├── etcd.yaml
│   ├── kube-apiserver.yaml
│   ├── kube-controller-manager.yaml
│   └── kube-scheduler.yaml
├── pki
│   ├── apiserver-etcd-client.crt
│   ├── apiserver-etcd-client.key
│   ├── apiserver-kubelet-client.crt
│   ├── apiserver-kubelet-client.key
│   ├── apiserver.crt
│   ├── apiserver.key
│   ├── ca.crt
│   ├── ca.key
│   ├── etcd
│   │   ├── ca.crt
│   │   ├── ca.key
│   │   ├── healthcheck-client.crt
│   │   ├── healthcheck-client.key
│   │   ├── peer.crt
│   │   ├── peer.key
│   │   ├── server.crt
│   │   └── server.key
│   ├── front-proxy-ca.crt
│   ├── front-proxy-ca.key
│   ├── front-proxy-client.crt
│   ├── front-proxy-client.key
│   ├── sa.key
│   └── sa.pub
├── scheduler.conf
└── super-admin.conf
```

解释如下: 

1. admin.conf, controller-manager.conf, kubelet.conf, scheduler.conf, super-admin.conf：

   这些是不同角色的Kubernetes配置文件，每个文件包含了对应角色的认证信息、访问控制配置和集群连接信息。通常由kubeconfig工具生成。

2. manifests: 这个目录包含了Kubernetes集群中各个核心组件的静态配置清单（YAML文件），用于指定各个组件如何启动和配置。

3. pki: 这个目录中包含了Kubernetes集群的公钥和私钥文件，以及CA证书，用于保证集群内部通信的安全性。具体文件包括:

   **apiserver-etcd-client.crt, apiserver-etcd-client.key**: 用于API服务器与etcd客户端通信的证书。

   **apiserver-kubelet-client.crt, apiserver-kubelet-client.key**: 用于API服务器与kubelet客户端通信的证书。

   **apiserver.crt, apiserver.key**: API服务器的证书和私钥。

   **ca.crt, ca.key**: 集群的根CA证书和私钥，用于签发其他证书。

   **etcd/**: etcd存储相关的证书和私钥。

   **front-proxy-ca.crt, front-proxy-ca.key**: 用于前置代理的CA证书和私钥。

   **front-proxy-client.crt, front-proxy-client.key**: 用于前置代理客户端的证书和私钥。

   **sa.key, sa.pub**: Kubernetes中的Service Account的私钥和公钥。



## 结语

Kubernetes的安装方式有很多, kubeadm只是其中的一种, 其它比如Rancher的RKE (个人也比较喜欢), Kubesphere的KubeKey, Sealos等等, 都是安装很便捷的工具, 但各自的高可用方案, 底层的实现原理, 都如本文类似, 大差不差。以后有时间再尝试一下其它的安装方案吧, 到时候可以做个类比文章, 了解每一种方案的优缺点, 不同场景下, 选择最适用的方案。

---

[1] https://mp.weixin.qq.com/s/Hl2seS_Xn9dQsynpbS6Jiw

[2] https://v1-29.docs.kubernetes.io/releases/version-skew-policy

[3] https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/setup-ha-etcd-with-kubeadm

[4] https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability

[5] https://kubernetes.io/docs/setup/production-environment/container-runtimes

[6] https://github.com/kubernetes/kubeadm/blob/main/docs/ha-considerations.md#bootstrap-the-cluster



