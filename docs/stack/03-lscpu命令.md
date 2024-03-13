---
id: lscpu
slug: /lscpu
title: lscpu命令
last_update:
  date: 2024/03/13
---

## 简介
lscpu 命令是 Linux 系统中的一个实用工具，用于显示有关 CPU 架构的信息。通过运行 lscpu 命令，您可以获取有关系统中处理器的详细信息，包括架构、核心数、线程数以及 CPU 支持的功能。

输出信息如下：

```shell
[root@localhost ~]# lscpu
Architecture:          x86_64				# CPU架构: x86_64
CPU op-mode(s):        32-bit, 64-bit
Byte Order:            Little Endian
CPU(s):                1					# 逻辑CPU个数: 计算公式: 物理CPU个数 × 单个CPU核数 × 超线程数
On-line CPU(s) list:   0
Thread(s) per core:    1					# 单个CPU上, 每个核心的线程数, 当前CPU支持超线程
Core(s) per socket:    1					# 每个卡槽对应物理CPU共有多少个核心数
Socket(s)：                 1			   # CPU卡槽个数, 即物理CPU的个数
NUMA node(s)：         1
Vendor ID：           GenuineIntel		   # CPU厂商ID
CPU family：          6					   # CPU型号, 下列为型号名
Model：              142
Model name：        Intel(R) Core(TM) i5-10210U CPU @ 1.60GHz
Stepping：              12
CPU MHz：             2112.002
BogoMIPS：            4224.00
Hypervisor vendor：  VMware
Virtualization type：    full			  
L1d cache：          32K
L1i cache：          32K
L2 cache：           256K
L3 cache：           6144K
NUMA node0 CPU(s)：    0
Flags:                 fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss syscall nx pdpe1gb rdtscp lm constant_tsc arch_perfmon nopl xtopology tsc_reliable nonstop_tsc eagerfpu pni pclmulqdq ssse3 fma cx16 pcid sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand hypervisor lahf_lm abm 3dnowprefetch ssbd ibrs ibpb stibp ibrs_enhanced fsgsbase tsc_adjust bmi1 avx2 smep bmi2 invpcid rdseed adx smap clflushopt xsaveopt xsavec xgetbv1 arat spec_ctrl intel_stibp flush_l1d arch_capabilities

```

也可以直接通过查看/proc/cpuinfo文件的方式, 去查询CPU相关信息。

```shell
# 查看物理CPU个数
cat /proc/cpuinfo | grep “physical id” | sort | uniq | wc -l
# 查看每个物理CPU核数
cat /proc/cpuinfo | grep "core id" | sort | uniq | wc -l   //
cat /proc/cpuinfo| grep "cpu cores"| uniq
# 查看逻辑CPU个数
cat /proc/cpuinfo | grep "processor"| sort|uniq| wc -l
```

## VCPU
vCPU：即virtualCPU（虚拟CPU），通过虚拟化技术计算出来，在创建虚机的时候指定，是虚拟机的部件。那么： 

> 1颗32核的CPU，和32颗1核的CPU，哪个方案更优？
>
> 答：前者更优。 原因： 成本问题：显然后者成本更高，不单单是CPU个数，每个CPU又都需要线路电路支持，所以 主板也需要更大，更好。 传输速率：当执行多线程时，后者由于每个线程都在不同的CPU上处理，线程之间通信，协 同合作效率会很低，各个线程又会各开一个Cache，如若有冗余数据，又会大大占用内存， 造成资源的浪费，且依赖总线的传输，速度较慢。单前者就很好的规避了这样的问题，可以 很好解决多线程协作工作的问题，且多线程程序在多核CPU中运行是共用一块内存区的，数 据的传输速度比总线来的要快同时不会有冗余数据的产生，减少内存的开销。 但单个多核也有不足：当多个较大程序运行时，内存就会匮乏，不光是Cache占用的的问题，同时 还有程序的指令以及数据的替换问题。所以一般多颗多核。


## CPU架构
CPU架构：是一种规范，用来区分不同的CPU产品，本质是充当操作系用，应用程序/用户指令传达给计算 机硬件的语言指令集，翻译的身份。 

目前市面上架构主要有：

* **X86_64**：由美国Intel公司开发，主要应用于：个人pc，服务器等，PC端的windows系统。制作 x86_64架构的厂商有AMD，Intel。 主要CPU品牌有：Intel系列；AMD系列；国产兆芯系列等。 
* **ARM**：也称为进阶精简指令集机器，是一个32位精简指令集处理器架构，非常节能，低耗。例如 apple的MacBook就是使用ARM架构研发的M1。 

制作ARM的厂商有： 

* **国外生产厂商**：TI （德州仪器）、Samsung（三星）、Freescale（飞思卡尔）、Marvell（马维 尔）、Nvidia（英伟达）、  Qualcomm(高通）、STMicroelectronics(意法半导体）。 
* **国内生产厂商：**华为（海思芯片）、飞腾（FT-1500、FT2000-4等CPU芯片）、兆易创新（GD32系列 MCU，参考STM32系列）、瑞芯微（RK系列芯片）、联发科（台湾，天玑系列）。

另外还有其他CPU架构：MIPS架构；PowerPC架构；SPARC架构；Alpha架构等等。

## 结语
lscpu 命令是 Linux 系统中一个强大而实用的工具，能够提供关于 CPU 架构的详细信息。通过查看 CPU 的型号、核心数、线程数等参数，用户可以更好地了解系统的硬件配置，从而进行性能优化、调试和系统管理。在日常工作中，lscpu 是一个必备的命令，它可以帮助用户更有效地管理和维护 Linux 系统。