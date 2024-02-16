# Centos7系统---内核升级

### 前言

对于有些场景，软件部署时，需要用到更高版本的内核功能，提高安全性，功能性。

在Centos7系统中，默认内核版本是`3.10.0-957.el7.x86_64`， 而目前的内核版本是已经来到了`5`打头，故升级内核也是顺势而为。

### 升级

1. 查看当前内核版本

```shell
# uname -r
3.10.0-957.el7.x86_64
```

2. 下载EPEL源

```shell
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org

rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm

yum --disablerepo="*" --enablerepo="elrepo-kernel" list available  # 查看可用的内核安装包
```

3. 安装内核

```shell
yum -y install kernel-lt --enablerepo=elrepo-kernel

# 若是离线环境，则需要在有网环境提前下载好rpm包进行安装。
```

![](https://cdn.jsdelivr.net/gh/week2311/Images@main/kernel.png)

4. 修改默认启动项

```shell
 vim /etc/default/grub
 # 修改 GRUB_DEFAULT=save 为 GRUB_DEFAULT=0
 # 保存退出即可
```

5. 重新生成grub文件

```shell
 grub2-mkconfig -o /boot/grub2/grub.cfg
```

6. 重启查看

```shell
reboot

uname -r
```

### 内核升级完成