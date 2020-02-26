# Tendermint架构概述
_November 2019_

在接下来的几周里，@brapse，@marbar3778和我（@tessr）将举行一系列会议，讨论Tendermint和新架构。这些是我（@tessr）在这些会议上的笔记，这些笔记们要么将作为将来工程师入职时的工具，要么将为此类架构文档提供相关参考。

## 通信

Tendermint Core中可以发生三种通信（如请求、响应、连接）形式：*节点间通信*、*节点内通信*和*客户端通信*。
- 节点间通信：发生在节点和其他对等节点之间。这种通信基于TCP或HTTP进行。详细解释见下文。
- 节点内通信：发生在节点自身内部（也就是在节点内的reactor和其他组件之间）。通常都使用函数或方法调用，偶尔也依靠事件总线通信。
- 客户端通信：发生在客户端（如钱包或浏览器）和区块链网络节点之间。

### 节点间通信

节点间通信有两种方式：
1. 基于P2P报文的TCP连接
	- 节点间通信最常见的形式
	- 基于switch，节点间的连接被持久化并在reactor之间共享
2. 基于HTTP的RPC
	- 针对短期一次性请求
	- 如：reactor特定状态，像高度信息
	- 同样存在：为了获取通知信息，连接到通道的websocket（类似新交易请求）

### P2P事务 （Switch， PEX及地址簿）

在开发P2P服务时，有两个主要任务：
1. 路由：谁获取哪些消息？
2. 对等节点管理：可以连接到谁？其状态如何?怎么发现对等节点？

第一个问题可以通过Switch解决
- 负责对等节点之间的路由连接
- 需要特别指出，_仅处理TCP连接_；RPC/HTTP是独立的
- 是每一个reactor的依赖；所有的reactor都暴露一个函数`setSwitch`
- 保存通道（TCP连接的通道，不是Go的通道）并使用他们进行路由
- 是一个全局对象，消息具有全局命名空间
- 和libp2p功能相似

TODO:（可能）更多Switch的实现信息

第二个问题由PEX和地址簿组合来解决。
	TODO: PEX和地址簿是什么？
	
#### TCP特性及`mconnection`介绍
以下是TCP的一些特征：
1. 所有TCP连接都有一个“帧窗口大小”，它表示当前可传输的数据包大小，
即，如果要创建一个新的连接发送数据包，则必须从小数据包开始。
成功接收数据包后，才逐渐增大发送数据包的大小。（曲线如下图所示）
这意味着TCP连接的初始启动速度很慢。
2. syn/ack过程还意味着小且频繁的消息有很高的开销
3. Socket使用文件标识符表示。

![tcp-window](./tcp-window.png)

为了在Tendermint环境中有较好的TCP连接效果，
我们基于TCP协议，创建了`mconnection`或叫做多路复用连接。
它允许我们重用TCP连接以最小化开销，并在必要时通过发送辅助消息来保持高通信窗口。

`mconnection`是一个结构体，包含消息集合、读写缓冲区和通道id到reactor的映射。
它通过向文件标识符写入数据，完成与TCP的通信。与每个对等节点的连接都有一个`mconnection`。

`mconnection`有两个方法：`send`接受socket的原始句柄并将数据写入到socket中；
`trySend`写入到不同的缓冲区中。（TODO：写入到哪个缓冲区？）

`mconnection`由对等节点拥有，对等节点的连接（与许多其他对等节点的连接一起）由（全局）`transport`拥有，该`transport`由（全局）`Switch`拥有：

```
switch
	transport
		peer
			mconnection
		peer
			mconnection
		peer
			mconnection	
```

## node.go 

node.go是启动节点的入口。它配置reactor和switch，并注册节点的所有RPC服务。

## 节点类型
1. 验证节点: 
2. 全节点:
3. 种子节点:

TODO: 完善节点类型及配置方式的区别。

## Reactors 

以下是Reactor的一些特征: 
- 每个reactor都持有全局Switch的指针（通过`SetSwitch()`配置）
- Switch持有每个reactor的指针（通过`addReactor()`添加）
- 每个reactor都在node.go中配置（如果使用自定义reactor，也需要在node.go中指定）
- Switch调用`addReactor`方法；`addReactor`方法中为传递的reactor变量调用`setSwitch`方法
- 假定在启动前所有的reacot都已被添加
- 由于Switch持有每个reactor的指针，因此，reactor通过Switch获取彼此的引用来相互通信。**问题：可以通过其他方式实现reactor之间的通信吗？**

此外，所有的reactor都暴露：
1. TCP通道
2. `receive`方法
3. `addReactor`调用

`mconnection`可以多次调用`receive`方法。所有的reactor具有相同的方法。

`addReactor`会遍历reactor上的所有连接通道，并创建通道Id->reactor的映射。Switch会持有映射，并把该映射传递给`transport`，其中`transport`是TCP连接的一个简单封装。

以下是详尽（？）的reactor列表：
- Blockchain Reactor
- Consensus Reactor 
- Evidence Reactor 
- Mempool Reactor
- PEX Reactor

以后会详细阐述每一个reactor。

### Blockchain Reactor 
blockchain reactor有两个主要功能: 
1. 根据对等节点的请求处理区块
2. TODO: 了解blockchain reactor的第二个职责