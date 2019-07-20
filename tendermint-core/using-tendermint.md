# 使用 Tendermint

这是使用命令行中的 `tendermint` 程序的指南。
它只假设您已经安装了 `tendermint` 二进制文件，并且对 Tendermint 和 ABCI 有一些基本的概念。

您可以看到帮助菜单上的 `tendermint --help`，以及版本号上的 `tendermint version`。

## 根目录

区块链数据的默认目录是 `~/.tendermint`。通过设置 `TMHOME` 环境变量来覆盖它。

## 初始化

运行以下命令初始化根目录:

```
tendermint init
```

这将在 `$TMHOME/config` 中创建一个新的私钥 (`priv_validator.json`)和一个包含关联公钥的创世文件(`genesis.json`)。这就是运行带有一个验证者的本地测试网络所需要的全部内容。

有关更详细的初始化，请参见 tesnet 命令:

```
tendermint testnet --help
```

### 创世

`$TMHOME/config/` 中的 `genesis.json` 文件定义了区块链生成时的初始 TendermintCore 状态([参见定义](https://github.com/tendermint/tendermint/blob/master/types/genesis.go))。

#### 字段

- `genesis_time`: 区块链正式开始时间。
- `chain_id`: 区块链的 ID。对于每个区块链，这必须是惟一的。如果您的测试网络区块链没有惟一的链 ID，那么您的日子就不好过了。链 ID 必须小于50个符号。
- `validators`: 初始验证者列表。注意，这可能被应用程序完全覆盖，并且可能被保留为空，以明确应用程序将使用 ResponseInitChain 初始化验证者集。
  - `pub_key`: 第一个元素指定 `pub_key` 类型。1 == Ed25519。第二个元素是公钥字节。
  - `power`: 验证者的投票权。
  - `name`: 验证者的名称(可选)。
- `app_hash`: 在创世中期望的应用程序哈希(由 `ResponseInfo` ABCI消息返回)。如果应用程序的哈希不匹配，Tendermint 会感到恐慌。
- `app_state`: 应用程序状态(例如 tokens 的初始分发)。

#### 示例 genesis.json

```
{
  "genesis_time": "2018-11-13T18:11:50.277637Z",
  "chain_id": "test-chain-s4ui7D",
  "consensus_params": {
    "block_size": {
      "max_bytes": "22020096",
      "max_gas": "-1"
    },
    "evidence": {
      "max_age": "100000"
    },
    "validator": {
      "pub_key_types": [
        "ed25519"
      ]
    }
  },
  "validators": [
    {
      "address": "39C04A480B54AB258A45355A5E48ADDED9956C65",
      "pub_key": {
        "type": "tendermint/PubKeyEd25519",
        "value": "DMEMMj1+thrkUCGocbvvKzXeaAtRslvX9MWtB+smuIA="
      },
      "power": "10",
      "name": ""
    }
  ],
  "app_hash": ""
}
```

## 运行

要运行 Tendermint 节点，请使用

```
tendermint node
```

默认情况下，Tendermint 将尝试连接到 [127.0.0.1:26658](127.0.0.1:26658) 上的 ABCI 应用程序。如果安装了 `kvstore` ABCI 应用程序，请在另一个窗口中运行它。如果你不这样做，杀死 Tendermint，运行一个进程中版本的 `kvstore` 应用程序:

```
tendermint node --proxy_app=kvstore
```

几秒钟后，您应该会看到块开始流入。注意，即使没有交易，也会定期生成块。要修改此设置，请参见下面的 _没有空块_。

Tendermint支持进程中版本的 `counter`、`kvstore`和 `noop` 应用程序，这些应用程序附带 `abci-cli` 作为示例。如果是用 Go 编写的，你可以很容易地用 Tendermint 编译自己的应用程序。如果您的应用程序不是用 Go 编写的，那么只需在另一个进程中运行它，并使用 `--proxy_app` 标志指定它正在监听的套接字的地址，例如:

```
tendermint node --proxy_app=/var/run/abci.sock
```

## 交易

要发送交易，使用 `curl` 向 Tendermint RPC 服务器发出请求，例如：

```
curl http://localhost:26657/broadcast_tx_commit?tx=\"abcd\"
```

我们可以看到链在 `/status` 端点处的状态：

```
curl http://localhost:26657/status | json_pp
```

特别是 `latest_app_hash`：

```
curl http://localhost:26657/status | json_pp | grep latest_app_hash
```

在浏览器中访问 http://localhost:26657，查看其他端点的列表。有些不接受参数(如 `/status`)，而另一些指定参数名并使用 `_` 作为占位符。

::: 提示
找到 RPC 文档[这里](https://tendermint.com/rpc/)
:::

### 格式化

发送/格式化交易时应考虑以下细微差别：

对于 `GET`：

要发送 UTF8 字符串字节数组，请引用 tx 参数的值:

```
curl 'http://localhost:26657/broadcast_tx_commit?tx="hello"'
```

发送一个 5 字节的交易： "h e l l o" \[68 65 6c 6c 6f\].

注意 URL 必须用单引号括起来，否则 bash 将忽略双引号。要避免单引号，请转义双引号：

```
curl http://localhost:26657/broadcast_tx_commit?tx=\"hello\"
```

使用特殊字符：

```
curl 'http://localhost:26657/broadcast_tx_commit?tx="€5"'
```

发送一个 4 字节的交易： "€5" (UTF8) \[e2 82 ac 35\].

要发送原始十六进制，省略引号，并在十六进制字符串前面加上 `0x`：

```
curl http://localhost:26657/broadcast_tx_commit?tx=0x01020304
```

发送一个 4 字节的交易： \[01 02 03 04\].

With `POST` (using `json`), the raw hex must be `base64` encoded:

```
curl --data-binary '{"jsonrpc":"2.0","id":"anything","method":"broadcast_tx_commit","params": {"tx": "AQIDBA=="}}' -H 'content-type:text/plain;' http://localhost:26657
```

发送相同的 4 字节交易：\[01 02 03 04\].

注意，原始十六进制不能在 `POST` 交易中使用。

## 复位

**警告：不安全**只有在开发中这样做，并且只有在您能够承受丢失所有区块链数据的代价时才这样做!

要重置区块链，请停止节点并运行：

```
tendermint unsafe_reset_all
```

该命令将删除数据目录并重置私有验证者和地址簿文件。

## 配置

Tendermint使用了 `config.toml` 配置。有关详细信息，请参见[配置规范](./configuration.md)。

值得注意的选项包括应用程序的套接字地址(`proxy_app`)、Tendermint对等点的监听地址(`p2p.laddr`)和RPC服务器的监听地址(`rpc.laddr`)。

配置文件中的一些字段可以用标记覆盖。

## 没有空块

虽然 `tendermint` 的默认行为仍然是大约每秒创建一次块，但是可以禁用空块或设置块创建间隔。在前一种情况下，当有新的交易或应用哈希更改时，将创建块。

要将 Tendermint 配置为不产生空块，除非有交易或应用程序哈希更改，运行 Tendermint 时附加这个标志:

```
tendermint node --consensus.create_empty_blocks=false
```

或者通过设置配置 `config.toml` 文件：

```
[consensus]
create_empty_blocks = false
```

记住：因为默认值是 _创建空块_，所以避免空块需要将配置选项设置为 `false`。

块间隔设置允许在创建每个新的空块之间有一个延迟(以秒为单位)。它是通过 `config.toml` 设置的:

```
[consensus]
create_empty_blocks_interval = 5
```

使用此设置，如果没有生成其他块，则每 5 秒生成一个空块，而不考虑 `create_empty_blocks` 的值。

## 广播 API

前面，我们使用 `broadcast_tx_commit` 端点发送交易。当交易被发送到 Tendermint 节点时，它将通过应用程序的 `CheckTx` 运行。如果它通过 `CheckTx`，它将被包括在内存池中，广播给其他节点，并最终包含在一个块中。

由于处理交易有多个阶段，我们提供多个端点来广播交易：

```
/broadcast_tx_async
/broadcast_tx_sync
/broadcast_tx_commit
```

它们分别对应于不处理、通过内存池的处理和通过块的处理。也就是说，`broadcast_tx_async` 将立即返回，而无需等待是否该交易有效，而 `broadcast_tx_sync` 将返回通过 `CheckTx` 运行该交易的结果。使用 `broadcast_tx_commit` 将等待交易在一个块中提交或达到某个超时，但如果交易没有通过 `CheckTx`，则会立即返回。`broadcast_tx_commit` 的返回值包括两个字段 `check_tx` 和 `deliver_tx`，用于修饰通过这些 ABCI 消息运行交易的结果。

使用 `broadcast_tx_commit` 的好处是，请求在交易提交后返回(即包含在一个块中)，但这可能需要一秒钟的时间。要得到一个快速的结果，可以使用`broadcast_tx_sync`，但是交易要到稍后才会提交，到那时它对状态的影响可能会发生变化。

注意内存池不提供强保证 - 仅仅因为交易通过了 CheckTx (即。，是否被接受进入内存池) 并不意味着它将被提交，因为在它们的内存池中包含交易的节点可能在它们提交之前崩溃。
有关更多信息，请参见[内存池预写日志](../tendermint-core/running-in-production.md#mempool-wal)

## Tendermint 网络

运行 `tendermint init` 时，在 `~/.tendermint/config` 中创建两个文件 `genesis.json` 和
`priv_validator.json`。这个 `genesis.json` 可能看起来像：

```
{
  "validators" : [
    {
      "pub_key" : {
        "value" : "h3hk+QE8c6QLTySp8TcfzclJw/BG79ziGB/pIA+DfPE=",
        "type" : "tendermint/PubKeyEd25519"
      },
      "power" : 10,
      "name" : ""
    }
  ],
  "app_hash" : "",
  "chain_id" : "test-chain-rDlYSN",
  "genesis_time" : "0001-01-01T00:00:00Z"
}
```

和这个 `priv_validator.json`：

```
{
  "last_step" : 0,
  "last_round" : "0",
  "address" : "B788DEDE4F50AD8BC9462DE76741CCAFF87D51E2",
  "pub_key" : {
    "value" : "h3hk+QE8c6QLTySp8TcfzclJw/BG79ziGB/pIA+DfPE=",
    "type" : "tendermint/PubKeyEd25519"
  },
  "last_height" : "0",
  "priv_key" : {
    "value" : "JPivl82x+LfVkp8i3ztoTjY6c6GJ4pBxQexErOCyhwqHeGT5ATxzpAtPJKnxNx/NyUnD8Ebv3OIYH+kgD4N88Q==",
    "type" : "tendermint/PrivKeyEd25519"
  }
}
```

`priv_validator.json` 实际上包含一个私钥，因此应该绝对保密；现在我们使用纯文本。
注意 `last_` 字段，它用于防止我们签署冲突的消息。

还要注意 `priv_validator.json` 中的 `pub_key` (公钥) 也出现在 `genesis.json` 中。

创世文件包含可能参与共识的公钥列表及其相应的投票权。超过 2/3 的投票权必须是活跃的(即相应的私钥必须产生签名)，共识才能取得进展。在我们的例子中，创世文件包含了 `priv_validator.json` 的公钥。因此，一个使用默认根目录启动的 Tendermint 节点将能够取得进展。投票权使用 int64，但必须是正数，因此范围是：0 到9223372036854775807。
由于目前提议人选择演算法的工作原理，我们不建议投票权大于 10\^12 (即。1万亿)。

如果我们想要添加更多的节点网络，我们有两个选择：我们可以添加一个新的验证者节点，将参与共识，提出区块并对其进行表决，或者我们可以添加一个新的非验证者节点，没有直接参与，但将验证和跟上共识协议。

### 节点

#### 种子

种子节点是一个节点，它传递它们知道的其他节点的地址。这些节点不断地在网络中爬行，试图获得更多的节点。种子节点中继到本地地址簿中的地址。一旦这些在地址簿中，您将直接连接到这些地址。
基本上种子节点的工作就是转发每个人的地址。一旦收到足够的地址，就不会连接到种子节点，因此通常只在第一次启动时需要它们。种子节点将在发送给您一些地址后立即断开与您的连接。

#### 持续节点

持续节点是你想要经常联系的人。如果断开连接，您将尝试直接连接回它们，而不是使用地址簿中的另一个地址。在重新启动时，无论地址簿的大小，您总是试图连接到这些节点。

默认情况下，所有节点都中继它们知道的节点。这称为对等交换协议(PeX)。使用 PeX，节点将广播已知的节点并形成一个网络，将节点地址存储在地址簿中。因此，如果您有一个活动的持久节点，则不必使用种子节点。

#### 连接到节点

要在启动时连接到节点，请在 `$TMHOME/config/config.toml` 中指定它们。或者在命令行上。使用 `seeds` 指定种子节点，使用 `persistent_peers` 指定你的节点将与之保持持久连接的节点。

例如，

```
tendermint node --p2p.seeds "f9baeaa15fedf5e1ef7448dd60f46c01f1a9e9c4@1.2.3.4:26656,0491d373a8e0fcf1023aaf18c51d6a1d0d4f31bd@5.6.7.8:26656"
```

或者，您可以使用 RPC 的 `/dial_seeds` 端点为要连接到的正在运行的节点指定种子：

```
curl 'localhost:26657/dial_seeds?seeds=\["f9baeaa15fedf5e1ef7448dd60f46c01f1a9e9c4@1.2.3.4:26656","0491d373a8e0fcf1023aaf18c51d6a1d0d4f31bd@5.6.7.8:26656"\]'
```

注意，启用 PeX 后，在第一次启动之后不需要种子。

如果您希望 Tendermint 连接到特定的地址集，并与每个地址保持持久连接，可以使用`--p2p.persistent_peers` 标志或者相应设置 `config.toml` 或者 `/dial_peers` RPC 端点在不停止 Tendermint 核心实例的情况下执行此操作。

```
tendermint node --p2p.persistent_peers "429fcf25974313b95673f58d77eacdd434402665@10.11.12.13:26656,96663a3dd0d7b9d17d4c8211b191af259621c693@10.11.12.14:26656"

curl 'localhost:26657/dial_peers?persistent=true&peers=\["429fcf25974313b95673f58d77eacdd434402665@10.11.12.13:26656","96663a3dd0d7b9d17d4c8211b191af259621c693@10.11.12.14:26656"\]'
```

### 添加一个非验证者

添加非验证者很简单。复制原始的 `genesis.json` 到 `~/.tendermint/config`。启动节点，根据需要指定种子节点或持久节点。如果没有指定种子节点或持久对等节点，则节点不会生成任何块，因为它不是验证者，也不会听到任何块的消息，因为它没有连接到其他节点。

### 添加一个验证者

添加新验证者的最简单方法是在启动网络之前在 `genesis.json` 中进行。例如，我们可以创建一个新的 `priv_validator.json`。，然后将它的 `pub_key` 复制到上面的创世文件中。

通过这个命令我们可以生成一个新的 `priv_validator.json`：

```
tendermint gen_validator
```

现在我们可以更新创世文件了。例如，如果新的`priv_validator.json` 的如下:

```
{
  "address" : "5AF49D2A2D4F5AD4C7C8C4CC2FB020131E9C4902",
  "pub_key" : {
    "value" : "l9X9+fjkeBzDfPGbUM7AMIRE6uJN78zN5+lk5OYotek=",
    "type" : "tendermint/PubKeyEd25519"
  },
  "priv_key" : {
    "value" : "EDJY9W6zlAw+su6ITgTKg2nTZcHAH1NMTW5iwlgmNDuX1f35+OR4HMN88ZtQzsAwhETq4k3vzM3n6WTk5ii16Q==",
    "type" : "tendermint/PrivKeyEd25519"
  },
  "last_step" : 0,
  "last_round" : "0",
  "last_height" : "0"
}
```

然后新的 `genesis.json` 将是:

```
{
  "validators" : [
    {
      "pub_key" : {
        "value" : "h3hk+QE8c6QLTySp8TcfzclJw/BG79ziGB/pIA+DfPE=",
        "type" : "tendermint/PubKeyEd25519"
      },
      "power" : 10,
      "name" : ""
    },
    {
      "pub_key" : {
        "value" : "l9X9+fjkeBzDfPGbUM7AMIRE6uJN78zN5+lk5OYotek=",
        "type" : "tendermint/PubKeyEd25519"
      },
      "power" : 10,
      "name" : ""
    }
  ],
  "app_hash" : "",
  "chain_id" : "test-chain-rDlYSN",
  "genesis_time" : "0001-01-01T00:00:00Z"
}
```

更新`~/.tendermint/config` 中的 `genesis.json`。复制创世文件和新的 `priv_validator.json`到新机器上 `~/.tendermint/config`。

现在在两台机器上运行 `tendermint node`，并使用其中任何一台 `--p2p.persistent_peers` 或 `/dial_peers` 让他们连接该节点。
他们应该开始制作区块，并且只会在他们都在线的情况下继续这样做。

要使 Tendermint 网络能够容忍一个验证者失败，至少需要四个验证者节点(例如，2/3)。

支持在活动网络中更新验证者，但必须由应用程序开发人员显式编程。有关详细信息，请参阅[应用程序开发人员指南](../app-dev/app-development.md)。

### 本地网络

要在本地运行网络，比如在一台机器上，您必须更改 `config.toml` (或使用标志)中的 `_laddr` 字段，以便不同套接字的侦听地址不会冲突。此外，必须在 `config.toml` 中设置 `addr_book_strict=false`。否则，Tendermint 的 p2p 库将拒绝连接到具有相同 IP 地址的节点。

### 升级

看到 [UPGRADING.md](https://github.com/tendermint/tendermint/blob/master/UPGRADING.md) 指南。您可能需要在主要中断版本之间重置链。
尽管如此，我们预计 Tendermint 在未来会有更少的中断版本(尤其是 1.0 版本之后)。
