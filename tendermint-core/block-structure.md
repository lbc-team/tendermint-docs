# 区块结构

tendermint共识引擎将绝大多数节点的所有协议记录到一个区块链中，并在所有节点之间复制。这个区块链可以通过各种rpc端点访问，主要是 `/block?height=` 获取整个区块，以及 `/blockchain?minHeight=_&maxHeight=_` 获取头部列表。但是这些块中究竟存储了什么呢?

[规范](../spec/blockchain/blockchain.md)包含了每个组件的详细描述——这是最好的起点。

要深入了解，请查看 [types 包文档](https://godoc.org/github.com/tendermint/tendermint/types)。
