# 生产运行

## 数据库

默认情况下，Tendermint使用 `syndtr/goleveldb` 包作为其进程内键值数据库。不幸的是，LevelDB 的这个实现似乎在重载下受到了影响(参见[#226](https://github.com/syndtr/goleveldb/issues/226))。最好安装 LevelDB 的真正 c 实现，并使用 `make build_c` 编译 Tendermint。有关详细信息，请参阅[安装说明](../introduction/install.md)。

Tendermint 在 `$TMROOT/data` 中保存多个不同级别的 db 数据库:

- `blockstore.db`: 保存整个区块链 - 存储块、块提交和块元数据，每个块按高度索引。用来同步新的节点。
- `evidence.db`: 储存所有已证实的不当行为的证据。
- `state.db`: 存储当前区块链状态(即高度、验证者、共识参数)。只有在共识参数或验证者发生更改时才会增长。也用于在块处理期间临时存储中间结果。
- `tx_index.db`: 通过 tx 散列和 DeliverTx 结果标记索引交易(及其结果)。

默认情况下，Tendermint 只根据哈希索引交易，而不是 DeliverTx 结果标签。有关详细信息，请参见[索引交易](../app-dev/indexing-transactions.md)。

目前还没有修剪数据库的策略。考虑通过[控制空块](../tendermint-core/using-tendermint.md#no-empty-blocks)或增加 `consensus.timeout_commit` 来减少块产量。注意，这两种设置都是本地设置，并不由协商一致强制执行。

我们正在研究[状态同步](https://github.com/tendermint/tendermint/issues/828)，它将允许丢弃历史记录，并直接同步最近的应用程序状态。我们需要为允许查询历史交易和状态的存档节点开发解决方案。
Cosmos 项目已经取得了很大的成功，仅仅是将最新的区块链状态转储到磁盘上，并从该状态开始一条新的链。

## 日志记录

默认日志级别 (`main:info,state:info,*:`) 应该足以满足正常操作模式。有关如何配置 `log_level` 配置变量的详细信息，请阅读[本文](https://blog.cosmos.network/one-of-the-exciting-new-features-in-0-10-0-release-is-smart-log-level-flag-e2506b4ab756)。一些模块可以在[这里](./how-to-read-logs.md#list-of-modules)找到。如果您试图调试 Tendermint 或被要求提供具有调试日志级别的日志，您可以使用 `--log_level="*:debug"` 运行 Tendermint。

## 预写日志 (WAL)

Tendermint 使用预写日志来达成共识 (`cs.wal`) 和内存池 (`mempool.wal`)。两个 WALs 的最大大小都为 1GB，并且可以自动旋转。

### 共识 WAL

`consensus.wal` 是用于确保我们可以从共识状态机中的任何崩溃中恢复。
它将所有共识消息(超时、建议、块部分或投票)写到一个文件中，在处理来自它自己的验证者的消息之前刷新到磁盘。由于 Tendermint 验证者预计永远不会签署冲突的投票，所以 WAL 确保我们总是可以确定性地恢复到共识的最新状态，而无需使用网络或重新签署任何共识消息。

如果你的 `consensus.wal` 被破坏了，[见下文](#wal-corruption)。

### 内存池 WAL

`mempool.wal` 在运行 CheckTx 之前记录所有传入的交易，但是不以任何编程方式使用。它只是一种手动安全装置。注意内存池不提供持久性保证 - 如果发送给一个或多个节点的交易在能够提交之前崩溃，那么它可能永远不会进入区块链。客户端必须通过 websockets 订阅、轮询或使用 `/broadcast_tx_commit` 来监视他们的交易。在最坏的情况下，可以手动从内存池 WAL 重新发送交易。

由于上述原因，`mempool.wal` 默认情况下是禁用的。若要启用，请设置 `mempool.wal_dir` 指向您希望 WAL 位于的位置(例如 `data/mempool.wal`)。

## DOS暴露和缓解

验证者应该设置[哨兵节点体系结构](https://blog.cosmos.network/tendermint-explained-bringing-bft-based-pos-to-the-public-blockchain-domain-f22e274a0fdb)来防止拒绝服务攻击。你可以在[这里](../interviews/tendermint-bft.md)读到更多。

### P2P

Tendermint 点对点系统的核心是 `MConnection`。每个连接都有 `MaxPacketMsgPayloadSize`，这是最大的数据包大小和有界的发送和接收队列。可以对每个连接的发送和接收速率施加限制(`SendRate`，`RecvRate`)。

### RPC

缺省情况下，返回多个条目的端点被限制为返回 30 个元素(最多100个)。有关更多信息，请参阅[RPC文档](https://tendermint.com/rpc/)。

限制速率和身份验证是帮助防止 DOS 攻击的另一个关键方面。虽然将来我们可能会实现这些特性，但是现在，验证者应该使用 [NGINX](https://www.nginx.com/blog/rate-limiting-nginx/) 或 [traefik](https://docs.traefik.io/configuration/commons/#rate-limiting) 等外部工具来实现相同的功能。

## 调试 Tendermint

如果您曾经调试过 Tendermint，您可能要做的第一件事就是检查日志。参见[如何读取日志](./how-to-read-logs.md)，其中我们解释了某些日志语句的含义。

如果在浏览日志之后仍然不清楚，那么接下来要做的就是查询 /status RPC 端点。它提供了必要的信息：无论节点是否同步，它处于什么高度，等等。

```
curl http(s)://{ip}:{rpcPort}/status
```

`dump_consensus_state` 将详细概述共识状态(提议者、最新验证者、节点状态)。从它，您应该能够找出原因，例如，为什么网络已经停止。

```
curl http(s)://{ip}:{rpcPort}/dump_consensus_state
```

还有一个简化版本的端点 - `consensus_state`，它只返回当前高度看到的选票。

- [Github Issues](https://github.com/tendermint/tendermint/issues)
- [StackOverflow
  questions](https://stackoverflow.com/questions/tagged/tendermint)

## 监控 Tendermint

每个 Tendermint 实例都有一个标准的 `/health` RPC 端点，如果一切正常，它的响应是 200 (OK)，如果出了问题，它的响应是 500 (或者没有响应)。

其他有用的端点包括前面提到的 `/status`、`/net_info`和`/validators`。

我们有一个小工具，称为 `tm-monitor`，它输出来自上述端点的信息和一些统计数据。这个工具可以在[这里](https://github.com/tendermint/tendermint/tree/master/tools/tm-monitor)找到。

Tendermint 还可以报告和服务普罗米修斯指标。见[指标](./metrics.md)。

## 当我的应用程序死掉时会发生什么?

您应该在[流程主管](https://en.wikipedia.org/wiki/Process_supervision) (如 systemd 或 runit) 的指导下运行 Tendermint。它将确保 Tendermint 始终运行(尽管可能出现错误)。

回到最初的问题，如果您的应用程序死掉，Tendermint 将恐慌。在流程主管重新启动您的应用程序后，Tendermint 应该能够重新成功连接。重启的顺序并不重要。

## 信号处理

我们捕捉 SIGINT 和 SIGTERM，并试图很好地清理。对于其他信号，我们使用 Go中的默认行为：[Go 程序中信号的默认行为](https://golang.org/pkg/os/signal/#hdr-Default_behavior_of_signals_in_Go_programs)。

## 破坏

**注意：**请确保您有一个备份的 Tendermint 数据目录。

### 可能的原因

请记住，大多数损坏是由硬件问题引起的：

- RAID 控制器有故障/电池耗尽备份，并意外断电
- 启用回写缓存的硬盘驱动器，并出现意外的电源损耗
- 便宜的 SSD 没有足够的电力损失保护，和一个意想不到的电力损失
- 有缺陷的内存
- CPU有缺陷或过热

其他原因可能是：

- 配置了 fsync=off 的数据库系统 和 OS 崩溃或断电
- 配置为使用写屏障和忽略写屏障的存储层的文件系统。LVM 是一个特别的罪魁祸首。
- Tendermint 漏洞
- 操作系统漏洞
- 管理错误(如直接修改 Tendermint 数据目录内容)

(源链接：https://wiki.postgresql.org/wiki/Corruption)

### WAL 破坏

如果共识 WAL 在最后的高度被破坏，而你正试图开始 Tendermint，重播将失败与恐慌。

从数据损坏中恢复可能是困难和耗时的。你可以采取以下两种方法：

1. 删除 WAL 文件并重新启动 Tendermint。它将尝试与其他节点同步。
2. 尝试手动修复 WAL 文件：

1) 创建损坏的 WAL 文件的备份：

```
cp "$TMHOME/data/cs.wal/wal" > /tmp/corrupted_wal_backup
```

2. 使用 `./scripts/wal2json` 创建一个易读的版本

```
./scripts/wal2json/wal2json "$TMHOME/data/cs.wal/wal" > /tmp/corrupted_wal
```

3. 搜索 "CORRUPTED MESSAGE" 行。
4. 通过查看前面的消息和损坏后的消息并查看日志，尝试重新构建消息。如果随后的消息也被标记为已损坏(如果长度头损坏或某些写入没有到达 WAL ~ 截断，可能会发生这种情况)，那么删除从损坏的行开始的所有行，并重新启动 Tendermint。

```
$EDITOR /tmp/corrupted_wal
```

5. 编辑完成后，运行以下命令将该文件转换为二进制文件：

```
./scripts/json2wal/json2wal /tmp/corrupted_wal  $TMHOME/data/cs.wal/wal
```

## 硬件

### 处理器和内存

虽然实际的规格会根据负载和验证者的数量而有所不同，但最低要求是：

- 1GB RAM
- 25GB of disk space
- 1.4 GHz CPU

SSD 磁盘更适合具有高交易吞吐量的应用程序。

推荐：

- 2GB RAM
- 100GB SSD
- x64 2.0 GHz 2v CPU

虽然目前，Tendermint 存储所有的历史记录，并且随着时间的推移，它可能需要大量的磁盘空间，但是我们计划实现状态同步(参见[这个 issues](https://github.com/tendermint/tendermint/issues/828))。因此，没有必要存储所有过去的块。

### 操作系统

Tendermint 可以为多种操作系统编译，这要感谢 Go 语言(\$OS/\$ARCH 对的列表可以在这里找到[此处](https://golang.org/doc/install/source#environment))。

虽然我们不支持任何操作系统，但是更安全、更稳定的 Linux 服务器发行版(比如 Centos)应该优于桌面操作系统(比如 Mac OS)。

### 杂项

注意：如果您打算在公共领域使用 Tendermint，请确保阅读 Cosmos 网络中验证者的[硬件建议](https://cosmos.network/validators)。

## 配置参数

- `p2p.flush_throttle_timeout`
- `p2p.max_packet_msg_payload_size`
- `p2p.send_rate`
- `p2p.recv_rate`

如果您打算在私有域中使用 Tendermint，并且您在您的节点中有一个私有高速网络，那么降低刷新控制超时并增加其他参数是有意义的。

```
[p2p]

send_rate=20000000 # 2MB/s
recv_rate=20000000 # 2MB/s
flush_throttle_timeout=10
max_packet_msg_payload_size=10240 # 10KB
```

- `mempool.recheck`

在每个块之后，Tendermint 会重新检查内存池中剩下的每个交易，看看在那个块中提交的交易是否会影响应用程序状态，所以剩下的一些交易可能会失效。
如果这不适用于您的应用程序，您可以通过设置 `mempool.recheck=false` 禁用它。

- `mempool.broadcast`

将其设置为 false 将阻止内存池将交易转发给其他节点，直到它们包含在一个块中。这意味着只有发送交易到节点才能看到它，直到它包含在一个块中。

- `consensus.skip_timeout_commit`

我们希望 `skip_timeout_commit=false`，因为提议者应该等待更多的投票。但如果你不在乎这些，想要最快达成共识，你可以跳过它。缺省情况下，对于公共部署(例如 [Cosmos Hub](https://cosmos.network/intro/hub))它将保持为 false，而对于企业应用程序，将它设置为 true 不是问题。

- `consensus.peer_gossip_sleep_duration`

在检查是否有东西要发送给节点之前，可以尝试减少节点休眠的时间。

- `consensus.timeout_commit`

你也可以试着减少 `timeout_commit` (我们在提议下一个块之前睡眠的时间)。

- `p2p.addr_book_strict`

默认情况下，Tendermint 在将节点的地址保存到地址簿之前，会检查该地址是否可路由。如果IP是[有效且在允许范围内](https://github.com/tendermint/tendermint/blob/27bd1deabe4ba6a2d9b463b8f3e3f1e31b993e61/p2p/netaddress.go#L209)，则该地址被认为是可路由的。

对于私有网络或本地网络，情况可能并非如此，因为您的 IP 范围通常是严格限制的和私有的。如果是这种情况，需要将 `addr_book_strict` 设置为 `false` (关闭它)。

- `rpc.max_open_connections`

默认情况下，同时连接的数量是有限的，因为大多数 OS 提供的文件描述符数量有限。

如果您想接受更多的连接，就需要增加这些限制。

[sysctl 对系统进行调优，以便能够打开更多的连接](https://github.com/satori-com/tcpkali/blob/master/doc/tcpkali.man.md#sysctls-to-tune-the-system-to-be-able-to-open-more-connections)

… N个连接，如50k：

```
kern.maxfiles=10000+2*N         # BSD
kern.maxfilesperproc=100+2*N    # BSD
kern.ipc.maxsockets=10000+2*N   # BSD
fs.file-max=10000+2*N           # Linux
net.ipv4.tcp_max_orphans=N      # Linux

# For load-generating clients.
net.ipv4.ip_local_port_range="10000  65535"  # Linux.
net.inet.ip.portrange.first=10000  # BSD/Mac.
net.inet.ip.portrange.last=65535   # (Enough for N < 55535)
net.ipv4.tcp_tw_reuse=1         # Linux
net.inet.tcp.maxtcptw=2*N       # BSD

# If using netfilter on Linux:
net.netfilter.nf_conntrack_max=N
echo $((N/8)) > /sys/module/nf_conntrack/parameters/hashsize
```

类似的选项用于限制 gRPC 连接的数量 - `rpc.grpc_max_open_connections`。
