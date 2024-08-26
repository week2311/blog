---
slug: kwok
title: K8S集群构建而中道崩殂，这TM！还怎么运维
date: 2024-08-26 10:45
tags: [kubernetes,kwok]
authors: Week
---

在之前的KubeCon上，了解到Kwok技术，印象比较深刻，是因为它能够秒级去创建出上千个Node，Pod，当然这些是假的。

但是它对于学习Kubernetes的人，资源不充足，或者模拟测试的场景，都非常友好。我就有一个体会，比如：我想对调度策略中的亲和性，进行一个实践操作，验证效果，但是前提是我得有一个Kubernetes集群。如果我有环境，那还好；如果没有，那浪费在搭建上的时间会很多。

如果使用Kwok，我可以几秒钟完成搭建功能，并专注于实践，甚至我不需要虚拟机，直接安装在Windows/Mac中。

<!-- truncate -->

## 先看效果：

我使用一台Rocky9.3的虚拟机，模拟20台虚机，和一套Pig的服务。

![image-20240821164906397](https://bexp.135editor.com/files/users/1331/13319639/202408/9PRffXnS_IGSL.png?auth_key=1725206399-0-0-1306b2a73e91544dea7317eb8824a376)

在这里，我可以自己通过yaml文件去创建资源，给节点打标签，污点等，去控制pod的一些行为等等，几乎与真实的k8s集群一样。Kwok模拟的是Apiserver的行为。



## 安装,配置

Linux上的安装方式：

1. 容器运行时安装，见文章[1]

   注意：安装版本要求：containerd >= 1.7；

   ​	  需要安装cni插件。

2. 二进制安装kwok，见官网[2] 的`Binary Releases`安装步骤。

3. 创建集群：

   ```shell
   kwokctl create cluster --kube-apiserver-image=registry.aliyuncs.com/google_containers/kube-apiserver:v1.29.6 --kube-controller-manager-image=registry.aliyuncs.com/google_containers/kube-controller-manager:v1.29.6 --kube-scheduler-image=registry.aliyuncs.com/google_containers/kube-scheduler:v1.29.6 --etcd-image=registry.aliyuncs.com/google_containers/etcd:3.5.11-0
   ```

   需要使用到控制面组件的镜像，用于模拟。指定镜像下载地址，默认是国外镜像仓库地址。

   注：如果控制面的组件，都是用二进制安装的，则不需要指定镜像地址，默认优先使用二进制的。

4. 创建node：

   ```shell
   kwokctl scale node --replicas 20 --config ~/.kwok/clusters/pig/kwok.yaml --name pig
   ```

   -c：指定配置文件位置。

   --name：指定集群名称

5. 创建Pod：

   可以通过命令创建：

   ```shell
   kubectl create deployment pod --image=pod --replicas=5
   ```

   也可以通过编写好的yaml文件创建：

   ```shell
   kubectl apply -f pig-all.yaml
   ```

6. 结果：

   ```shell
   [root@localhost ~]# kubectl get no
   NAME          STATUS   ROLES    AGE    VERSION
   node-000000   Ready    master   92m    kwok-v0.6.0
   node-000001   Ready    master   100m   kwok-v0.6.0
   node-000002   Ready    master   98m    kwok-v0.6.0
   node-000003   Ready    agent    98m    kwok-v0.6.0
   node-000004   Ready    agent    98m    kwok-v0.6.0
   node-000005   Ready    agent    98m    kwok-v0.6.0
   node-000006   Ready    agent    98m    kwok-v0.6.0
   node-000007   Ready    agent    98m    kwok-v0.6.0
   node-000008   Ready    agent    98m    kwok-v0.6.0
   node-000009   Ready    agent    98m    kwok-v0.6.0
   node-000010   Ready    agent    98m    kwok-v0.6.0
   node-000011   Ready    agent    98m    kwok-v0.6.0
   node-000012   Ready    agent    98m    kwok-v0.6.0
   node-000013   Ready    agent    98m    kwok-v0.6.0
   node-000014   Ready    agent    98m    kwok-v0.6.0
   node-000015   Ready    agent    98m    kwok-v0.6.0
   node-000016   Ready    agent    98m    kwok-v0.6.0
   node-000017   Ready    agent    98m    kwok-v0.6.0
   node-000018   Ready    agent    98m    kwok-v0.6.0
   node-000019   Ready    agent    98m    kwok-v0.6.0
   
   [root@localhost ~]# kubectl get pod -o wide -n pig 
   NAME                                      READY   STATUS    RESTARTS   AGE   IP          NODE          NOMINATED NODE   READINESS GATES
   minio-854ddc8b4-7k4cq                     1/1     Running   0          71m   10.0.5.1    node-000005   <none>           <none>
   pig-auth-7985cddf5-8t4x4                  1/1     Running   0          76m   10.0.13.1   node-000013   <none>           <none>
   pig-codegen-6759fd865b-gx9pd              1/1     Running   0          72m   10.0.8.1    node-000008   <none>           <none>
   pig-gateway-66b687d645-k4h6h              1/1     Running   0          77m   10.0.3.2    node-000003   <none>           <none>
   pig-monitor-5777b76db9-2hfw8              1/1     Running   0          74m   10.0.11.2   node-000011   <none>           <none>
   pig-mysql-df66c67f-wq8kp                  1/1     Running   0          84m   10.0.11.1   node-000011   <none>           <none>
   pig-redis-6f58b56fd-gl5hw                 1/1     Running   0          84m   10.0.4.1    node-000004   <none>           <none>
   pig-register-555859b5fb-2vk5r             1/1     Running   0          79m   10.0.3.1    node-000003   <none>           <none>
   pig-sentinel-dashboard-678d6c454d-6qjfc   1/1     Running   0          73m   10.0.14.2   node-000014   <none>           <none>
   pig-upms-biz-6f96fc46d-p2gm2              1/1     Running   0          75m   10.0.14.1   node-000014   <none>           <none>
   pig-xxl-job-admin-69fc56b8cf-ltcxp        1/1     Running   0          71m   10.0.2.1    node-000002   <none>           <none>
   ```
   
   

## 脚本安装

**安装过程太麻烦不想做？没关系，尝鲜的脚本已经编写好了。**

**Kwok_Shell链接: https://pan.baidu.com/s/1N3XTNn52v3fm4tmCdjD5fw?pwd=LK79 
提取码: LK79**

![image-20240823165739143](https://bexp.135editor.com/files/users/1331/13319639/202408/pKejQuBN_AeeL.png?auth_key=1725206399-0-0-4d2dc97bf4e4abff2c52f15e67cee928)

注意：当执行 "kwokctl create" 那个命令时，报错：

```shell
ERROR Failed to setup config err="cmd wait: nerdctl create --name=kwok-kwok-etcd --pull=never --entrypoint=etcd --network=kwok-kwok --restart=unless-stopped --label=com.docker.compose.project=kwok-kwok --publish=32765:2379/tcp registry.aliyuncs.com/google_containers/etcd:3.5.11-0 --name=node0 --auto-compaction-retention=1 --quota-backend-bytes=8589934592 --data-dir=/etcd-data --initial-advertise-peer-urls=http://0.0.0.0:2380 --listen-peer-urls=http://0.0.0.0:2380 --advertise-client-urls=http://0.0.0.0:2379 --listen-client-urls=http://0.0.0.0:2379 --initial-cluster=node0=http://0.0.0.0:2380: exit status 1\ntime=\"2024-08-23T16:53:23+08:00\" level=fatal msg=\"failed to verify networking settings: failed to create default network: subnet 10.4.0.0/24 overlaps with other one on this address space\"\n" cluster=kwok
```

此时手动执行一下报错信息中的nerdctl命令即可。这大概率是nerdctl命令本身的Bug，有时间可以提个issue。



## 结语

通过这个工具，我们能够以最小的资源模拟最大的效果，不管是k8s的初学者，模拟架构的资源使用，压测等场景都是一个方便的工具。



---

参考链接

[1].https://mp.weixin.qq.com/s/ehKm7rvvxWCGgUm1etePOA

[2].https://kwok.sigs.k8s.io/docs/user/installation/

