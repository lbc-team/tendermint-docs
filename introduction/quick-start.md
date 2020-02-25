# Tendermint 快速入门

## 概述

本文是快速入门指南。如果您对Tendermint了解尚不清晰，但想立即运行起来，请继续阅读。

## 安装

### 快速安装

在全新的Ubuntu 16.04电脑上安装Tendermint，请使用[脚本](https://git.io/fFfOR)。

警告：不要在本地电脑运行此脚本。

```
curl -L https://git.io/fFfOR | bash
source ~/.profile
```

本脚本同样有助于下文的集群部署。

### 手动安装

手动安装方式，请参阅[安装Tendermint](install.md)。

## 初始化

运行

```
tendermint init
```

将为单个本地节点创建所需要的文件。

这些文件可以在`$HOME/.tendermint`中找到：

```
$ ls $HOME/.tendermint

config  data

$ ls $HOME/.tendermint/config/

config.toml  genesis.json  node_key.json  priv_validator.json
```

对于单个本地节点，配置已完成。
对于如何配置集群，后文会进一步介绍。


## 本地节点

使用一个进程内应用程序并启动Tendermint：
```
tendermint node --proxy_app=kvstore
```

然后区块数据开始滚动显示：

```
I[01-06|01:45:15.592] Executed block                               module=state height=1 validTxs=0 invalidTxs=0
I[01-06|01:45:15.624] Committed state                              module=state height=1 txs=0 appHash=
```

用以下命令查看运行状态：

```
curl -s localhost:26657/status
```

### 发送交易

运行kvstore应用后，我们可以发送交易

```
curl -s 'localhost:26657/broadcast_tx_commit?tx="abcd"'
```

并发现交易已通过

```
curl -s 'localhost:26657/abci_query?data="abcd"'
```

我们也可以发送由k-v组成的交易：

```
curl -s 'localhost:26657/broadcast_tx_commit?tx="name=satoshi"'
```

然后查询键

```
curl -s 'localhost:26657/abci_query?data="name"'
```

获得以十六进制编码的值。

## 节点集群

首先创建四个Ubuntu云主机。本测试在Digital Ocean Ubuntu 16.04 x64 (3GB/1CPU, 20GB SSD)上完成。下文中分别将地址记为IP1, IP2, IP3, IP4。

然后，使用`ssh`进入每台主机并执行[脚本](https://git.io/fFfOR)：

```
curl -L https://git.io/fFfOR | bash
source ~/.profile
```

本脚本将首先安装`go`和其他依赖文件，然后获取Tendermint源码，最终编译“Tendermint”二进制文件。

接下来，使用`tendermint testnet`命令创建四个配置文件目录（位于`/mytestnet`），并将每个文件夹复制到对应的主机上，以便每台计算机都有`$HOME/mytestnet/node[0-3]`文件夹。

在启动网络之前，还需要获取节点标识符（仅IP地址不够，且IP会发生变动）。我们称之为ID1，ID2，ID3，ID4。

```
tendermint show_node_id --home ./mytestnet/node0
tendermint show_node_id --home ./mytestnet/node1
tendermint show_node_id --home ./mytestnet/node2
tendermint show_node_id --home ./mytestnet/node3
```

最后，在每一个节点上运行：

```
tendermint node --home ./mytestnet/node0 --proxy_app=kvstore --p2p.persistent_peers="ID1@IP1:26656,ID2@IP2:26656,ID3@IP3:26656,ID4@IP4:26656"
tendermint node --home ./mytestnet/node1 --proxy_app=kvstore --p2p.persistent_peers="ID1@IP1:26656,ID2@IP2:26656,ID3@IP3:26656,ID4@IP4:26656"
tendermint node --home ./mytestnet/node2 --proxy_app=kvstore --p2p.persistent_peers="ID1@IP1:26656,ID2@IP2:26656,ID3@IP3:26656,ID4@IP4:26656"
tendermint node --home ./mytestnet/node3 --proxy_app=kvstore --p2p.persistent_peers="ID1@IP1:26656,ID2@IP2:26656,ID3@IP3:26656,ID4@IP4:26656"
```

注意，在第三个节点启动后，由于超过2/3验证节点(在`genesis.json`中定义)已运行，区块信息开始滚动刷新。
持久化节点可以在`config.toml`中指定，有关配置选项的详细信息，请参见[此处](../tendermint-core/configuration.md)。

相关交易操作可参见前文本地节点示例所述。
