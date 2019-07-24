# 应用程序架构指南

这里我们提供了一个关于 Tendermint 区块链应用程序推荐架构的简要指南。

下图提供了一个极好的例子：

![](../imgs/cosmos-tendermint-stack-4k.jpg)

这里的最终用户应用程序是 Cosmos Voyager，在左下角。
Voyager 与本地轻客户端守护进程公开的 REST API 通信。轻客户端守护进程是一个特定于应用程序的程序，它与 Tendermint 节点通信，并通过 Tendermint Core RPC 验证 Tendermint 轻客户端证明。Tendermint Core 处理与一个本地 ABCI 应用程序通信，用户查询或交易实际上是在这个应用程序中处理的。

ABCI 应用程序必须是 Tendermint 共识的确定性结果 - 任何外部对应用程序状态的影响，如果没有通过 Tendermint，都可能导致共识失败。因此，除了通过 ABCI 与 Tendermint 通信外，_不_ 应该与应用程序通信。

如果应用程序是用 Go 编写的，它可以编译成 Tendermint 二进制文件。否则，它应该使用unix 套接字与 Tendermint 通信。如果需要使用 TCP，则必须格外注意加密和验证连接。

所有读取应用程序发生在 Tendermint `/abci_query` 端点。所有对应用程序的写入都通过Tendermint `/broadcast_tx_*` 端点进行。

轻客户端守护进程为轻客户端(最终用户)提供了几乎所有完整节点的安全性。它格式化和广播交易，并验证查询和交易结果的证明。注意，它不需要是一个守护进程 - 轻客户端逻辑可以与最终用户应用程序在相同的进程中实现。

注意，对于那些安全性要求较低的 ABCI 应用程序，轻客户端守护进程的功能可以转移到 ABCI 应用程序本身。也就是说，通过ABCI将应用程序暴露给 Tendermint 之外的任何东西都需要非常谨慎，因为所有交易，可能还有所有查询都应该通过 Tendermint。

有关更广泛的文档，请参阅以下内容：

- [轻客户端 REST API 的链间标准](https://github.com/cosmos/cosmos-sdk/pull/1028)
- [Tendermint RPC 文档](https://tendermint.com/rpc/)
- [Tendermint 生产运行](../tendermint-core/running-in-production.md)
- [ABCI 规格](./abci-spec.md)
