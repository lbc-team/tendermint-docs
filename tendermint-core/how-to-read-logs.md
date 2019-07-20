# 如何读取日志

## 徒步旅行例子

我们首先创建到应用程序的三个连接（内存池、共识和查询）（在本例中本地运行 `kvstore`）。

```
I[10-04|13:54:27.364] Starting multiAppConn                        module=proxy impl=multiAppConn
I[10-04|13:54:27.366] Starting localClient                         module=abci-client connection=query impl=localClient
I[10-04|13:54:27.366] Starting localClient                         module=abci-client connection=mempool impl=localClient
I[10-04|13:54:27.367] Starting localClient                         module=abci-client connection=consensus impl=localClient
```

然后，Tendermint Core 和应用程序执行握手。

```
I[10-04|13:54:27.367] ABCI Handshake                               module=consensus appHeight=90 appHash=E0FBAFBF6FCED8B9786DDFEB1A0D4FA2501BADAD
I[10-04|13:54:27.368] ABCI Replay Blocks                           module=consensus appHeight=90 storeHeight=90 stateHeight=90
I[10-04|13:54:27.368] Completed ABCI Handshake - Tendermint and App are synced module=consensus appHeight=90 appHash=E0FBAFBF6FCED8B9786DDFEB1A0D4FA2501BADAD
```

在此之后，我们启动更多的事情，比如事件开关、反应器，并执行 UPNP 发现来检测 IP 地址。

```
I[10-04|13:54:27.374] Starting EventSwitch                         module=types impl=EventSwitch
I[10-04|13:54:27.375] This node is a validator                     module=consensus
I[10-04|13:54:27.379] Starting Node                                module=main impl=Node
I[10-04|13:54:27.381] Local listener                               module=p2p ip=:: port=26656
I[10-04|13:54:27.382] Getting UPNP external address                module=p2p
I[10-04|13:54:30.386] Could not perform UPNP discover              module=p2p err="write udp4 0.0.0.0:38238->239.255.255.250:1900: i/o timeout"
I[10-04|13:54:30.386] Starting DefaultListener                     module=p2p impl=Listener(@10.0.2.15:26656)
I[10-04|13:54:30.387] Starting P2P Switch                          module=p2p impl="P2P Switch"
I[10-04|13:54:30.387] Starting MempoolReactor                      module=mempool impl=MempoolReactor
I[10-04|13:54:30.387] Starting BlockchainReactor                   module=blockchain impl=BlockchainReactor
I[10-04|13:54:30.387] Starting ConsensusReactor                    module=consensus impl=ConsensusReactor
I[10-04|13:54:30.387] ConsensusReactor                             module=consensus fastSync=false
I[10-04|13:54:30.387] Starting ConsensusState                      module=consensus impl=ConsensusState
I[10-04|13:54:30.387] Starting WAL                                 module=consensus wal=/home/vagrant/.tendermint/data/cs.wal/wal impl=WAL
I[10-04|13:54:30.388] Starting TimeoutTicker                       module=consensus impl=TimeoutTicker
```

注意第二行，Tendermint Core 报告“这个节点是一个验证者”。它也可以只是一个观察者(普通节点)。

接下来，我们将重播来自 WAL 的所有消息。

```
I[10-04|13:54:30.390] Catchup by replaying consensus messages      module=consensus height=91
I[10-04|13:54:30.390] Replay: New Step                             module=consensus height=91 round=0 step=RoundStepNewHeight
I[10-04|13:54:30.390] Replay: Done                                 module=consensus
```

“已启动节点”消息表示一切准备就绪。

```
I[10-04|13:54:30.391] Starting RPC HTTP server on tcp socket 0.0.0.0:26657 module=rpc-server
I[10-04|13:54:30.392] Started node                                 module=main nodeInfo="NodeInfo{id: DF22D7C92C91082324A1312F092AA1DA197FA598DBBFB6526E, moniker: anonymous, network: test-chain-3MNw2N [remote , listen 10.0.2.15:26656], version: 0.11.0-10f361fc ([wire_version=0.6.2 p2p_version=0.5.0 consensus_version=v1/0.2.2 rpc_version=0.7.0/3 tx_index=on rpc_addr=tcp://0.0.0.0:26657])}"
```

接下来是一个标准块创建周期，我们进入一个新轮，提出一个块，获得超过 2/3 的预投票，然后预提交，最后有机会提交一个块。详情请参阅[共识概览](../introduction/introduction.md#consensus-overview)或[拜占庭共识算法](../spec/consensus/consensus.md)。

```
I[10-04|13:54:30.393] enterNewRound(91/0). Current: 91/0/RoundStepNewHeight module=consensus
I[10-04|13:54:30.393] enterPropose(91/0). Current: 91/0/RoundStepNewRound module=consensus
I[10-04|13:54:30.393] enterPropose: Our turn to propose            module=consensus proposer=125B0E3C5512F5C2B0E1109E31885C4511570C42 privValidator="PrivValidator{125B0E3C5512F5C2B0E1109E31885C4511570C42 LH:90, LR:0, LS:3}"
I[10-04|13:54:30.394] Signed proposal                              module=consensus height=91 round=0 proposal="Proposal{91/0 1:21B79872514F (-1,:0:000000000000) {/10EDEDD7C84E.../}}"
I[10-04|13:54:30.397] Received complete proposal block             module=consensus height=91 hash=F671D562C7B9242900A286E1882EE64E5556FE9E
I[10-04|13:54:30.397] enterPrevote(91/0). Current: 91/0/RoundStepPropose module=consensus
I[10-04|13:54:30.397] enterPrevote: ProposalBlock is valid         module=consensus height=91 round=0
I[10-04|13:54:30.398] Signed and pushed vote                       module=consensus height=91 round=0 vote="Vote{0:125B0E3C5512 91/00/1(Prevote) F671D562C7B9 {/89047FFC21D8.../}}" err=null
I[10-04|13:54:30.401] Added to prevote                             module=consensus vote="Vote{0:125B0E3C5512 91/00/1(Prevote) F671D562C7B9 {/89047FFC21D8.../}}" prevotes="VoteSet{H:91 R:0 T:1 +2/3:F671D562C7B9242900A286E1882EE64E5556FE9E:1:21B79872514F BA{1:X} map[]}"
I[10-04|13:54:30.401] enterPrecommit(91/0). Current: 91/0/RoundStepPrevote module=consensus
I[10-04|13:54:30.401] enterPrecommit: +2/3 prevoted proposal block. Locking module=consensus hash=F671D562C7B9242900A286E1882EE64E5556FE9E
I[10-04|13:54:30.402] Signed and pushed vote                       module=consensus height=91 round=0 vote="Vote{0:125B0E3C5512 91/00/2(Precommit) F671D562C7B9 {/80533478E41A.../}}" err=null
I[10-04|13:54:30.404] Added to precommit                           module=consensus vote="Vote{0:125B0E3C5512 91/00/2(Precommit) F671D562C7B9 {/80533478E41A.../}}" precommits="VoteSet{H:91 R:0 T:2 +2/3:F671D562C7B9242900A286E1882EE64E5556FE9E:1:21B79872514F BA{1:X} map[]}"
I[10-04|13:54:30.404] enterCommit(91/0). Current: 91/0/RoundStepPrecommit module=consensus
I[10-04|13:54:30.405] Finalizing commit of block with 0 txs        module=consensus height=91 hash=F671D562C7B9242900A286E1882EE64E5556FE9E root=E0FBAFBF6FCED8B9786DDFEB1A0D4FA2501BADAD
I[10-04|13:54:30.405] Block{
  Header{
    ChainID:        test-chain-3MNw2N
    Height:         91
    Time:           2017-10-04 13:54:30.393 +0000 UTC
    NumTxs:         0
    LastBlockID:    F15AB8BEF9A6AAB07E457A6E16BC410546AA4DC6:1:D505DA273544
    LastCommit:     56FEF2EFDB8B37E9C6E6D635749DF3169D5F005D
    Data:
    Validators:     CE25FBFF2E10C0D51AA1A07C064A96931BC8B297
    App:            E0FBAFBF6FCED8B9786DDFEB1A0D4FA2501BADAD
  }#F671D562C7B9242900A286E1882EE64E5556FE9E
  Data{

  }#
  Commit{
    BlockID:    F15AB8BEF9A6AAB07E457A6E16BC410546AA4DC6:1:D505DA273544
    Precommits: Vote{0:125B0E3C5512 90/00/2(Precommit) F15AB8BEF9A6 {/FE98E2B956F0.../}}
  }#56FEF2EFDB8B37E9C6E6D635749DF3169D5F005D
}#F671D562C7B9242900A286E1882EE64E5556FE9E module=consensus
I[10-04|13:54:30.408] Executed block                               module=state height=91 validTxs=0 invalidTxs=0
I[10-04|13:54:30.410] Committed state                              module=state height=91 txs=0 hash=E0FBAFBF6FCED8B9786DDFEB1A0D4FA2501BADAD
I[10-04|13:54:30.410] Recheck txs                                  module=mempool numtxs=0 height=91
```

## 模块列表

以下是您可能在 Tendermint 的日志中遇到的模块列表，并简要介绍了它们的功能。

- `abci-client` 如[应用程序开发指南](../app-dev/app-development.md)所述，Tendermint 是 ABCI 的客户端，负责维护3个连接：内存池，共识和查询。Tendermint Core使用的代码可以在[这里](https://github.com/tendermint/tendermint/tree/develop/abci/client)找到。
- `blockchain` 提供用于在节点之间存储和交换块的存储、池(一组节点)和反应器。
- `consensus` Tendermint Core 的核心，即实现了共识算法。包括两个“子模块”：`wal` (write-ahead logging) 以确保数据完整性和 `replay` 重播从崩溃中恢复的块和消息。
- `events` 简单的事件通知系统。事件列表可以在[这里](https://github.com/tendermint/tendermint/blob/master/types/events.go)找到。您可以通过调用 `subscribe` RPC方法订阅它们。更多信息请参考[RPC文档](./rpc.md)。
- `mempool` 内存池模块处理来自节点或应用程序的所有传入交易。
- `p2p` 提供围绕点对点通信的抽象。有关详细信息，请查看 [README](https://github.com/tendermint/tendermint/blob/master/p2p/README.md)。
- `rpc` [Tendermint's RPC](./rpc.md)。
- `rpc-server` RPC 服务器。有关实现详情，请参阅 [doc.go](https://github.com/tendermint/tendermint/blob/master/rpc/lib/doc.go)。
- `state` 表示最新的状态和执行子模块，它针对应用程序执行块。
- `types` 用于处理它们的公开的类型和方法的集合。
