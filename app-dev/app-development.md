# 应用程序开发指南

## XXX

这个页面正在被弃用。所有内容都被转移到新的 [ABCI 规范的主页](../spec/abci/README.md)。

## ABCI 设计

ABCI 的目的是在一台计算机上的状态转换机器和它们在多台计算机上的复制机制之间提供一个干净的接口。前者称为“应用逻辑”，后者称为“共识引擎”。应用程序逻辑验证交易，并根据某些持久状态选择性地执行交易。共识引擎确保在每台机器上以相同的顺序复制所有交易。我们将共识引擎中的每台机器称为“验证者”，并且每个验证者通过相同的应用程序逻辑运行相同的交易。特别是，我们对块链样式的一致性引擎感兴趣，在这种引擎中，交易以哈希链接的块提交。

ABCI 设计有几个不同的组件：

- 消息协议
  - 请求和响应消息对
  - 共识提出请求，应用程序作出响应
  - 使用 protobuf 定义
- 服务器/客户端
  - 共识引擎运行客户端
  - 应用程序运行服务器
  - 两种实现：
    - 异步原始字节
    - grpc
- 区块链协议
  - abci 是面向连接的
  - Tendermint Core 保持三个连接：
    - [内存池连接](#mempool-connection): 检查交易在提交前是否应转接；只使用 `CheckTx`
    - [共识连接](#consensus-connection): 用于执行已提交的交易。对于每个块的消息序列 - `BeginBlock, [DeliverTx, ...], EndBlock, Commit`
    - [查询连接](#query-connection): 查询应用程式状态；只使用 `Query` 和 `Info`

内存池和共识逻辑充当客户端，每个都维护一个与应用程序的开放 ABCI 连接，应用程序托管一个 ABCI 服务器。
显示的是在每个连接上发送的请求和响应类型。

下面的大多数示例来自 [kvstore 应用程序](https://github.com/tendermint/tendermint/blob/develop/abci/example/kvstore/kvstore.go)，它是 abci 库的一部分。[persistent_kvstore 应用程序](https://github.com/tendermint/tendermint/blob/develop/abci/example/kvstore/persistent_kvstore.go)用于显示 `BeginBlock`、`EndBlock` 和 `InitChain` 示例实现。

## 区块链协议

在 ABCI 中，交易只是一个任意长度的字节数组。应用程序有责任按照自己的意愿定义交易编解码器，并将其用于 CheckTx 和 DeliverTx。

请注意，运行交易有两种不同的方法，它们对应于网络中交易的“感知”阶段。第一个阶段是验证者将交易从客户端接收到所谓的内存池或交易池 - 这是我们使用 CheckTx 的地方。第二个是当交易在超过 2/3 的验证者上成功提交时 - 我们使用 DeliverTx。在前一种情况下，可能没有必要运行与交易关联的所有状态转换，因为交易可能直到很久以后才最终提交，那时它的执行结果将有所不同。例如，Ethereum ABCI 应用程序将检查 CheckTx 中的签名和金额，但在 DeliverTx 之前不会实际执行任何合约代码，以避免执行尚未完成的状态转换。

为了进一步形式化区分，我们在 Tendermint Core 和应用程序之间建立了两个显式的 ABCI 连接：内存池连接和共识连接。我们还建立了第三个连接，即查询连接，来查询应用程序的本地状态。

### 内存池连接

内存池连接仅用于 CheckTx 请求。使用 CheckTx 运行交易的顺序与验证者接收交易的顺序相同。如果 CheckTx 返回 `OK`，交易将保存在内存中，并按照接收到交易的相同顺序转发给其他节点。
否则，它将被丢弃。

CheckTx 请求与块处理并行运行；因此，它们应该针对主应用程序状态的副本运行，该副本在每个块之后重置。在将 CheckTx 请求序列包含在一个块中之前，跟踪它们所做的转换需要这个副本。提交块时，应用程序必须确保将内存池状态重置为最新提交的状态。然后，Tendermint Core 将过滤内存池中的所有交易，删除块中包含的所有交易，然后使用 CheckTx 针对提交后的内存池状态重新运行其余的交易(这种行为可以用 `[mempool] recheck = false` 关闭)。

在 go 中：

```
func (app *KVStoreApplication) CheckTx(tx []byte) types.Result {
  return types.OK
}
```

在 Java 中：

```
ResponseCheckTx requestCheckTx(RequestCheckTx req) {
    byte[] transaction = req.getTx().toByteArray();

    // validate transaction

    if (notValid) {
        return ResponseCheckTx.newBuilder().setCode(CodeType.BadNonce).setLog("invalid tx").build();
    } else {
        return ResponseCheckTx.newBuilder().setCode(CodeType.OK).build();
    }
}
```

### 重放保护

为了防止旧交易被重放，CheckTx 必须实现重放保护。

Tendermint 提供了第一个防御层，它在内存中保留了一个轻量级缓存，大小为100k (`[mempool] cache_size`)，这是内存池中的最后所有交易。如果 Tendermint 刚刚启动或客户发送的交易超过 10 万笔，则可以将旧交易发送到应用程序中。因此，CheckTx 实现一些逻辑来处理它们是很重要的。

在某些情况下，交易将(或可能)在未来的某个状态下变得有效，在这种情况下，您可能希望禁用 Tendermint 的缓存。您可以通过在配置中设置 `[mempool] cache_size = 0` 来实现这一点。

### 共识连接

只有在提交了一个新块时才使用共识连接，并通过一系列请求来传递来自该块的所有信息：`BeginBlock, [DeliverTx, ...], EndBlock, Commit`。也就是说，当在共识中提交一个块时，我们发送一个 DeliverTx 请求列表(每个交易一个)，它被 BeginBlock 和 EndBlock 请求夹在中间，然后提交。

### DeliverTx

DeliverTx 是区块链的主力。Tendermint 异步但有序地发送 DeliverTx 请求，并依赖于底层套接字协议(即 TCP)确保应用程序按顺序接收它们。他们已经在 Tendermint 协议的全球共识中排序。

DeliverTx 返回一个 abci.Result，其中包括代码、数据和日志。代码可能是非零的(non-OK)，这意味着相应的交易应该被内存池拒绝，但是可能被拜占庭提议者包含在一个块中。

块头将被更新(TODO)，以包含对 DeliverTx 结果的一些承诺，可以是一个由 non-OK 交易组成的位数组，也可以是 DeliverTx 请求返回的数据的默克尔根，或者两者兼有。

在 go 中：

```
// tx is either "key=value" or just arbitrary bytes
func (app *KVStoreApplication) DeliverTx(tx []byte) types.Result {
  parts := strings.Split(string(tx), "=")
  if len(parts) == 2 {
    app.state.Set([]byte(parts[0]), []byte(parts[1]))
  } else {
    app.state.Set(tx, tx)
  }
  return types.OK
}
```

在 Java 中：

```
/**
 * Using Protobuf types from the protoc compiler, we always start with a byte[]
 */
ResponseDeliverTx deliverTx(RequestDeliverTx request) {
    byte[] transaction  = request.getTx().toByteArray();

    // validate your transaction

    if (notValid) {
        return ResponseDeliverTx.newBuilder().setCode(CodeType.BadNonce).setLog("transaction was invalid").build();
    } else {
        ResponseDeliverTx.newBuilder().setCode(CodeType.OK).build();
    }

}
```

### Commit

一旦块的所有处理完成，Tendermint 发送提交请求和等待响应的块。虽然内存池可以与块处理(BeginBlock、DeliverTxs 和 EndBlock)并发运行，但它会为提交请求锁定，以便在提交期间安全地重置其状态。这意味着应用程序 _因该不_ 做任何阻塞通信与内存池(即 broadcast_tx)在提交期间，否则将会出现死锁。还要注意，在提交之后，内存池中的所有剩余交易都将在内存池连接(CheckTx)上重播。

应用程序应该用字节数组响应提交请求，字节数组是应用程序的确定状态根。它包含在下一个块的头中。它可以用来提供应用程序状态的容易验证的默克尔证明。

预计应用程序将在提交时将状态持久化到磁盘。让所有交易从以前的某个块重播的选项是[Handshake](#handshake)的工作。

在 go 中：

```
func (app *KVStoreApplication) Commit() types.Result {
  hash := app.state.Hash()
  return types.NewResultOK(hash, "")
}
```

在 Java 中：

```
ResponseCommit requestCommit(RequestCommit requestCommit) {

    // update the internal app-state
    byte[] newAppState = calculateAppState();

    // and return it to the node
    return ResponseCommit.newBuilder().setCode(CodeType.OK).setData(ByteString.copyFrom(newAppState)).build();
}
```

### BeginBlock

BeginBlock 请求可用于在每个块的开头运行一些代码。它还允许 Tendermint 在发送任何交易之前向应用程序发送当前块哈希和头。

应用程序应该记住最新的高度和标题(即它从其中成功地执行了一次提交)。这样，它就可以告诉 Tendermint 在重启时从哪里开始。参见下面关于握手的信息。

在 go 中：

```
// Track the block hash and header information
func (app *PersistentKVStoreApplication) BeginBlock(params types.RequestBeginBlock) {
  // update latest block info
  app.blockHeader = params.Header

  // reset valset changes
  app.changes = make([]*types.Validator, 0)
}
```

在 Java 中：

```
/*
 * all types come from protobuf definition
 */
ResponseBeginBlock requestBeginBlock(RequestBeginBlock req) {

    Header header = req.getHeader();
    byte[] prevAppHash = header.getAppHash().toByteArray();
    long prevHeight = header.getHeight();
    long numTxs = header.getNumTxs();

    // run your pre-block logic. Maybe prepare a state snapshot, message components, etc

    return ResponseBeginBlock.newBuilder().build();
}
```

### EndBlock

EndBlock 请求可用于在每个块的末尾运行一些代码。
此外，响应可能包含一个验证者列表，可用来更新验证者集。要添加新的验证者或更新现有的验证者，只需将它们包含在 EndBlock 响应中返回的列表中。若要删除其中一个，请将其以 `power` 等于 `0` 的形式包含在列表中。验证者的 `address` 字段可以留空。Tendermint core 将负责更新验证者集。请注意，如果您希望轻客户端能够从外部证明转换，那么每个区块的投票权变化必须严格小于 1/3。有关它如何跟踪验证者的详细信息，请参阅[轻客户端文档](https://godoc.org/github.com/tendermint/tendermint/lite#hdr-How_We_Track_Validators)。

在 go 中：

```
// Update the validator set
func (app *PersistentKVStoreApplication) EndBlock(req types.RequestEndBlock) types.ResponseEndBlock {
  return types.ResponseEndBlock{ValidatorUpdates: app.ValUpdates}
}
```

在 Java 中：

```
/*
 * Assume that one validator changes. The new validator has a power of 10
 */
ResponseEndBlock requestEndBlock(RequestEndBlock req) {
    final long currentHeight = req.getHeight();
    final byte[] validatorPubKey = getValPubKey();

    ResponseEndBlock.Builder builder = ResponseEndBlock.newBuilder();
    builder.addDiffs(1, Types.Validator.newBuilder().setPower(10L).setPubKey(ByteString.copyFrom(validatorPubKey)).build());

    return builder.build();
}
```

### 查询连接

此连接用于查询应用程序，而不涉及共识。它是通过 tendermint core rpc 公开的，因此客户端可以在不公开应用程序本身上的服务器的情况下查询应用程序，但是他们必须将每个查询序列化为单个字节数组。此外，某些“标准化”查询可能用于通知本地决策，例如要连接到哪个节点。

Tendermint Core 目前使用查询连接根据 IP 地址或节点 ID 对连接后的节点进行过滤。例如，如果对以下任意一个查询返回 non-OK ABCI 响应，都会导致 Tendermint 无法连接到对应的节点：

- `p2p/filter/addr/<ip addr>`, 其中 `<ip addr>` 是一个 IP 地址。
- `p2p/filter/id/<id>`， 其中 `<is>` 是十六进制编码的节点 ID(节点的 p2p 公钥的哈希)。

注意：这些查询格式可能会更改！

在 go 中：

```
    func (app *KVStoreApplication) Query(reqQuery types.RequestQuery) (resQuery types.ResponseQuery) {
      if reqQuery.Prove {
        value, proof, exists := app.state.GetWithProof(reqQuery.Data)
        resQuery.Index = -1 // TODO make Proof return index
        resQuery.Key = reqQuery.Data
        resQuery.Value = value
        resQuery.Proof = proof
        if exists {
          resQuery.Log = "exists"
        } else {
          resQuery.Log = "does not exist"
        }
        return
      } else {
        index, value, exists := app.state.Get(reqQuery.Data)
        resQuery.Index = int64(index)
        resQuery.Value = value
        if exists {
          resQuery.Log = "exists"
        } else {
          resQuery.Log = "does not exist"
        }
        return
      }
    }
    return
  } else {
    index, value, exists := app.state.Get(reqQuery.Data)
    resQuery.Index = int64(index)
    resQuery.Value = value
    if exists {
      resQuery.Log = "exists"
    } else {
      resQuery.Log = "does not exist"
    }
    return
  }
}
```

在 Java 中：

```
    ResponseQuery requestQuery(RequestQuery req) {
        final boolean isProveQuery = req.getProve();
        final ResponseQuery.Builder responseBuilder = ResponseQuery.newBuilder();
		byte[] queryData = req.getData().toByteArray();

        if (isProveQuery) {
            com.app.example.QueryResultWithProof result = generateQueryResultWithProof(queryData);
            responseBuilder.setIndex(result.getLeftIndex());
            responseBuilder.setKey(req.getData());
            responseBuilder.setValue(result.getValueOrNull(0));
            responseBuilder.setHeight(result.getHeight());
            responseBuilder.setProof(result.getProof());
            responseBuilder.setLog(result.getLogValue());
        } else {
            com.app.example.QueryResult result = generateQueryResult(queryData);
            responseBuilder.setIndex(result.getIndex());
            responseBuilder.setValue(result.getValue());
            responseBuilder.setLog(result.getLogValue());
        }

        responseBuilder.setIndex(result.getIndex());
        responseBuilder.setValue(ByteString.copyFrom(result.getValue()));
        responseBuilder.setLog(result.getLogValue());
    }

    return responseBuilder.build();
}
```

### Handshake

当应用程序或 tendermint 重新启动时，它们需要同步到一个共同的高度。当 ABCI 连接首次建立时，Tendermint 将在查询连接上调用 `Info`。响应应该包含LastBlockHeight 和 LastBlockAppHash - 前者是应用程序成功运行提交的最后一个块，后者是该提交的响应。

使用这些信息，Tendermint 将确定需要对应用程序重放什么内容(如果有的话)，以确保 Tendermint 和应用程序都同步到最新的块高度。

如果应用程序返回 LastBlockHeight 为 0，Tendermint 将重新播放所有块。

在 go 中：

```
func (app *KVStoreApplication) Info(req types.RequestInfo) (resInfo types.ResponseInfo) {
  return types.ResponseInfo{Data: fmt.Sprintf("{\"size\":%v}", app.state.Size())}
}
```

在 Java 中：

```
ResponseInfo requestInfo(RequestInfo req) {
    final byte[] lastAppHash = getLastAppHash();
    final long lastHeight = getLastHeight();
    return ResponseInfo.newBuilder().setLastBlockAppHash(ByteString.copyFrom(lastAppHash)).setLastBlockHeight(lastHeight).build();
}
```

### Genesis

`InitChain` 将在创世中被调用一次。`params` 包括初始验证者集。稍后，它可能会扩展为包含部分共识参数。

在 go 中：

```
// Save the validators in the merkle tree
func (app *PersistentKVStoreApplication) InitChain(params types.RequestInitChain) {
  for _, v := range params.Validators {
    r := app.updateValidator(v)
    if r.IsErr() {
      app.logger.Error("Error updating validators", "r", r)
    }
  }
}
```

在 Java 中：

```
/*
 * all types come from protobuf definition
 */
ResponseInitChain requestInitChain(RequestInitChain req) {
    final int validatorsCount = req.getValidatorsCount();
    final List<Types.Validator> validatorsList = req.getValidatorsList();

    validatorsList.forEach((validator) -> {
        long power = validator.getPower();
        byte[] validatorPubKey = validator.getPubKey().toByteArray();

        // do somehing for validator setup in app
    });

    return ResponseInitChain.newBuilder().build();
}
```
