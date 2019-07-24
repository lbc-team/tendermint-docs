# ABCI 规范

### XXX

已弃用: 移动到[这里](../spec/abci/abci.md)

## 消息类型

ABCI 请求/响应在[这个模式文件](https://github.com/tendermint/tendermint/blob/master/abci/types/types.proto)中定义为简单的 Protobuf 消息。
TendermintCore 发送请求，ABCI 应用程序发送响应。在这里，我们提供了一个概述的消息类型和他们是如何使用的 Tendermint。然后我们将每个请求-响应对描述为一个带有参数和返回值的函数，并添加一些用法说明。

有些消息(`Echo, Info, InitChain, BeginBlock, EndBlock, Commit`)不返回错误，因为一个错误将表明应用程序出现了严重故障，Tendermint 无能为力。应该解决这个问题，重新启动 Tendermint 和应用程序。
所有其他消息(`SetOption, Query, CheckTx, DeliverTx`)返回一个特定于应用程序的响应 `Code uint32`，其中只有 `0` 保留给 `OK`。

有些消息(`SetOption, Query, CheckTx, DeliverTx`)以 `Info` 和 `Log` 的形式返回非确定性数据。 `Log` 用于应用程序日志程序的文字输出，而 `Info` 是应该返回的任何附加信息。

第一次启动一个新的区块链，Tendermint 称之为 `InitChain`。从那时起，导致提交状态更新的块执行序列如下:

`BeginBlock, [DeliverTx], EndBlock, Commit`

块中的每个交易调用一个 `DeliverTx`。
对 DeliverTx、EndBlock 和Commit 结果的加密承诺包含在下一个块的头中。

Tendermint 打开到应用程序的三个连接来处理不同的消息类型：

- `Consensus Connection - InitChain, BeginBlock, DeliverTx, EndBlock, Commit`
- `Mempool Connection - CheckTx`
- `Info Connection - Info, SetOption, Query`

`Flush` 消息用于每个连接，而 `Echo` 消息仅用于调试。

注意，消息可以跨所有连接并发发送 - 因此，典型的应用程序将为每个连接维护不同的状态。它们可以分别称为 `DeliverTx state`、`CheckTx state` 和 `Commit state`。

有关消息类型及其使用方式的详细信息，请参阅下面。

## 请求/响应消息

### Echo

- **请求**：
  - `Message (string)`: 回显一个字符串
- **响应**：
  - `Message (string)`: 输入字符串
- **用法**：
  - 回显一个字符串来测试cabci 客户机/服务器实现

### Flush

- **用法**：
  - 将客户端上排队的消息刷新到服务器的信号。客户端实现定期调用它，以确保实际发送异步请求，并立即调用它来发出同步请求，当刷新响应返回时，同步请求将返回。

### Info

- **请求**：
  - `Version (string)`: Tendermint 版本
- **Response**：
  - `Data (string)`: 任意信息
  - `Version (Version)`: 版本信息
  - `LastBlockHeight (int64)`: 应用程序调用提交的最新块
  - `LastBlockAppHash ([]byte)`: 提交的最新结果
- **用法**：
  - 返回关于应用程序状态的信息。
  - 用于在启动时握手时将 Tendermint 与应用程序同步。
  - Tendermint希望在 `Commit` 期间更新 `LastBlockAppHash` 和`LastBlockHeight`，确保 `Commit` 不会因为相同的块高度被调用两次。

### SetOption

- **请求**：
  - `Key (string)`: 设置键
  - `Value (string)`: 设置键的值
- **响应**：
  - `Code (uint32)`: 响应码
  - `Log (string)`: 应用程序日志程序的输出。可能是不确定的。
  - `Info (string)`: 附加信息。可能是不确定的。
- **用法**：
  - 设置非一致的关键应用程序特定选项。
  - 例如 Key="min-fee"， Value="100fermion" 可以设置 CheckTx 所需的最低费用(但不包括 DeliverTx - 这是至关重要的共识)。

### InitChain

- **请求**：
  - `Time (google.protobuf.Timestamp)`: 创世时间。
  - `ChainID (string)`: 区块链 ID。
  - `ConsensusParams (ConsensusParams)`: 初始至关重要的共识参数。
  - `Validators ([]ValidatorUpdate)`: 初始创世的验证者。
  - `AppStateBytes ([]byte)`: 序列化的初始应用程序状态。Amino 编码 JSON 字节。
- **响应**：
  - `ConsensusParams (ConsensusParams)`: 初始至关重要的共识参数。
  - `Validators ([]ValidatorUpdate)`: 初始的验证者集(如果不为空)。
- **用法**：
  - 创世时调用一次。
  - 如果 ResponseInitChain.Validators 为空，初始验证者集将是 RequestInitChain.Validators
  - 如果 ResponseInitChain.Validators 不是空的，初始验证者集将是 ResponseInitChain.Validators(不管 ResponseInitChain.Validators 中有什么)。
  - 这允许应用程序决定是否接受 tendermint (即在创世文件中），或者，如果它想使用另一种方法(可能基于创世文件中的某些应用程序特定信息计算)。

### Query

- **请求**：
  - `Data ([]byte)`: 原始查询字节。可与 Path 一起使用。
  - `Path (string)`: 请求路径，如 HTTP GET 路径。可以与数据一起使用。
  - 应用程序必须将 '/store' 解释为基础商店上的按键查询。密钥应该在 Data 字段中指定。
  - 应用程序应该允许对特定类型的查询，如 '/accounts/...' 或者 '/votes/...'
  - `Height (int64)`: 您希望查询的块高度(缺省值为 0，返回最新提交块的数据)。注意，这是包含应用程序的默克尔根哈希的块的高度，它表示在以 height-1 提交块后的状态
  - `Prove (bool)`: 如果可能，返回默克尔证明与回应
- **响应**：
  - `Code (uint32)`: 响应码。
  - `Log (string)`: 应用程序日志程序的输出。可能是不确定的。
  - `Info (string)`: 附加信息。可能是不确定的。
  - `Index (int64)`: 键在树中的索引。
  - `Key ([]byte)`: 匹配数据的键。
  - `Value ([]byte)`: 匹配数据的值。
  - `Proof ([]byte)`: 如有需要，提供有关数据的证明。
  - `Height (int64)`: 派生数据的块的高度。注意，这是包含应用程序的默克尔根哈希的块的高度，它表示在以 height-1 提交块后的状态
- **用法**：
  - 查询应用程序当前或过去高度的数据。
  - 可选地返回默克尔证明。

### BeginBlock

- **请求**：
  - `Hash ([]byte)`: 块的哈希。这可以从块头派生。
  - `Header (struct{})`: 块头。
  - `LastCommitInfo (LastCommitInfo)`: 关于最后一次提交的信息，包括轮、验证者列表以及哪些验证者签署了最后一个块。
  - `ByzantineValidators ([]Evidence)`: 验证者恶意行为的证据列表。
- **响应**：
  - `Tags ([]cmn.KVPair)`: 用于过滤和索引的键值标记
- **用法**：
  - 表示一个新块的开始。在任何 DeliverTxs 之前调用。
  - 标头包含高度、时间戳等—它与 Tendermint 块标头完全匹配。我们可能在将来寻求推广这一点。
  - `LastCommitInfo` 和 `ByzantineValidators` 可用于确定验证者的奖惩。注意，这里的验证者不包括公钥。

### CheckTx

- **请求**：
  - `Tx ([]byte)`: 请求交易字节
- **响应**：
  - `Code (uint32)`: 响应码
  - `Data ([]byte)`: 结果字节，如果有的话。
  - `Log (string)`: 应用程序日志程序的输出。可能是不确定的。
  - `Info (string)`: 附加信息。可能是不确定的。
  - `GasWanted (int64)`: 请求交易的气体量。
  - `GasUsed (int64)`: 交易消耗的气体量。
  - `Tags ([]cmn.KVPair)`: 用于过滤和索引交易的键值标记(例如。通过账户)。
- **用法**： 在广播或提议之前验证内存池交易。CheckTx 应该执行有状态但轻量级的交易有效性检查(如检查签名和帐户余额)，但不需要完全执行(如运行智能合约)。

  Tendermint 彼此同时运行 CheckTx 和 DeliverTx，但使用的是不同的 ABCI 连接 - 内存池连接和共识连接。

  应用程序应该维护一个单独的状态来支持 CheckTx。
  此状态可以在 `Commit` 期间重置为最新提交状态。在调用提交之前，Tendermint 将锁定并刷新内存池，确保所有现有的 CheckTx 都得到响应，并且不能开始新的CheckTx。在 `Commit` 之后，内存池将为所有剩余的交易重新运行 CheckTx，抛出任何不再有效的交易。
  然后内存池将解锁并再次开始发送 CheckTx。

  标签中的键和值必须是 UTF-8 编码的字符串(例如："account.owner": "Bob", "balance": "100.0", "date": "2018-01-02")

### DeliverTx

- **请求**：
  - `Tx ([]byte)`: 请求交易字节。
- **响应**：
  - `Code (uint32)`: 响应码。
  - `Data ([]byte)`: 结果字节，如果有的话。
  - `Log (string)`: 应用程序日志程序的输出。可能是不确定的。
  - `Info (string)`: 附加信息。可能是不确定的。
  - `GasWanted (int64)`: 交易所需的气体量。
  - `GasUsed (int64)`: 交易消耗的气体量。
  - `Tags ([]cmn.KVPair)`: 用于过滤和索引交易的键值标记(例如。通过账户)。
- **用法**：
  - 交付应用程序要完全执行的交易。如果交易有效，则返回 CodeType.OK。
  - 标签中的键和值必须是 UTF-8 编码的字符串(例如："account.owner": "Bob", "balance": "100.0",
    "time": "2018-01-02T12:30:00Z")

### EndBlock

- **请求**：
  - `Height (int64)`: 刚刚执行的块的高度。
- **响应**：
  - `ValidatorUpdates ([]ValidatorUpdate)`: 验证者集的更改(将投票权设置为 0 以删除)。
  - `ConsensusParamUpdates (ConsensusParams)`: 用于将 filterinChanges 更改为共识的关键时间、大小和其他参数的键值标记。g 和索引
  - `Tags ([]cmn.KVPair)`: 用于过滤和索引的键值标记
- **用法**：
  - 表示一个块的结束。
  - 在每次提交之前，在所有交易之后调用。
  - 验证者更新为 H 块返回：
    - 应用于 H+1 块的 NextValidatorsHash
    - 应用于 H+2 块的ValidatorsHash(以及验证者集)
    - 应用到块 H+3 的 RequestBeginBlock.LastCommitInfo(即最后验证者集)
  -为 H 块返回的共识参数应用于 H+1 块

### Commit

- **响应**：
  - `Data ([]byte)`: 默克尔根哈希
- **用法**：
  - 保存应用程序状态。
  - 返回应用程序状态的默克尔根哈希。
  - 关键是所有应用程序实例返回相同的哈希。如果没有，他们将无法就下一个块达成一致，因为哈希包含在下一个块中!

## 数据消息

### Header

- **字段**：
  - `ChainID (string)`: 区块链 ID
  - `Height (int64)`: 链中块的高度
  - `Time (google.protobuf.Timestamp)`: 块时间。创建块时，它是提议者的本地时间。
  - `NumTxs (int32)`: 块中的交易数
  - `TotalTxs (int64)`: 到目前为止，区块链中的交易总数
  - `LastBlockID (BlockID)`: 前一个(父)块的哈希
  - `LastCommitHash ([]byte)`: 前一个块提交的哈希值
  - `ValidatorsHash ([]byte)`: 此块的验证者集的哈希值
  - `NextValidatorsHash ([]byte)`: 下一个块的验证者集的哈希值
  - `ConsensusHash ([]byte)`: 此块的共识参数的哈希
  - `AppHash ([]byte)`: 最后一次调用 `Commit` 返回的数据 - 通常是执行前一个块的交易后应用程序状态的默克尔根
  - `LastResultsHash ([]byte)`: 最后一个块返回的 ABCI 结果的哈希
  - `EvidenceHash ([]byte)`: 块中包含的证据的哈希
  - `ProposerAddress ([]byte)`: 原区块提案人
- **用法**：
  - 在 RequestBeginBlock 中提供
  - 提供有关区块链当前状态的重要上下文 - 特别是高度和时间。
  - 提供当前块的提案人，用于基于提案人的奖励机制。

### Validator

- **字段**：
  - `Address ([]byte)`: 验证者的地址(公钥的哈希)
  - `Power (int64)`: 验证者的投票权
- **用法**：
  - 验证者地址标识
  - 在 RequestBeginBlock 中作为 VoteInfo 的一部分使用
  - 不包括公共密钥，以避免发送潜在的大量子公共密钥通过 ABCI

### ValidatorUpdate

- **字段**：
  - `PubKey (PubKey)`: 验证者的公钥
  - `Power (int64)`: 验证者的投票权
- **用法**：
  - 验证者由公钥标识
  - 用于通知 Tendermint 更新验证者集

### VoteInfo

- **字段**：
  - `Validator (Validator)`: 验证者
  - `SignedLastBlock (bool)`: 指示验证者是否对最后一个块签名
- **用法**：
  - 指示验证者是否在最后一个块上签名，允许基于验证者可用性进行奖励

### PubKey

- **字段**：
  - `Type (string)`: 公钥的类型。一个简单的字符串，如 `"ed25519"`。将来，可能会指定一个序列化算法来解析 `Data`，例如 `"amino"`。
  - `Data ([]byte)`: 公共密钥数据。对于一个简单的公钥，它只是原始字节。如果 `Type` 表示编码算法，则这是编码的公钥。
- **用法**：
  - 一个通用的、可扩展的类型化公钥

### Evidence

- **字段**：
  - `Type (string)`: 证据的类型。类似于“重复/投票”的分层路径。
  - `Validator (Validator)`: 验证者
  - `Height (int64)`: 提交的高度
  - `Time (google.protobuf.Timestamp)`: 在高度 `Height`的块时间。创建块时，它是提议者的本地时间。
  - `TotalVotingPower (int64)`: 在高度 `Height` 的验证者集的总投票权

### LastCommitInfo

- **字段**：
  - `Round (int32)`: 提交轮。
  - `Votes ([]VoteInfo)`: 验证者地址列表，包括最后一个验证者集中的地址及其投票权，以及它们是否签署了投票。
