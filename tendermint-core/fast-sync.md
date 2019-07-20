# 快速同步

在工作区块链的证明中，与链同步的过程与共识保持最新是相同的:下载块，并寻找工作总量最多的块。在权益证明中，共识过程更为复杂，因为它涉及到节点之间的轮询通信，以确定下一步应该提交哪个块。从头开始使用这个过程来同步区块链可能需要很长时间。只下载块并检查验证者的默克尔树要比运行实时共识 gossip 协议快得多。

## 使用快速同步

为了支持更快的同步，tendermint 提供了一种 `fast-sync` 模式，默认情况下是启用的，可以在 `config.toml` 中或者通过 `--fast_sync=false` 切换。

在这种模式下，tendermint 守护进程的同步速度将比使用实时共识进程快数百倍。一旦被捕获，守护进程将从快速同步切换到正常的共识模式。
运行一段时间后，如果至少有一个节点，并且节点的高度至少与所报告的最大节点高度相同，则节点将被视为 `caught up`。参见[IsCaughtUp 方法](https://github.com/tendermint/tendermint/blob/b467515719e686e4678e6da4e102f32a491b85a0/blockchain/pool.go#L128)。

如果我们很落后，我们应该回到快速同步，但这是一个[打开的问题](https://github.com/tendermint/tendermint/issues/129)。
