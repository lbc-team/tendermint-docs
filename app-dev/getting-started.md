# 入门指南

## 第一个 Tendermint 应用

作为一个通用的区块链引擎，Tendermint 与您想要运行的应用程序无关。因此，要运行一个完整的区块链来做一些有用的事情，您必须启动两个程序：一个是 Tenderint Core，另一个是您的应用程序，它可以用任何编程语言编写。回想一下[介绍 ABCI](../introduction/what-is-tendermint.md#abci-overview)， Tendermint Core 处理所有的 p2p 和协商一致的东西，当它们需要验证时，或者当它们准备提交到一个块时，就会将交易转发给应用程序。

在本指南中，我们将向您展示一些如何使用 Tendermint 运行应用程序的示例。

### 安装

我们将使用的第一个应用程序是用 Go 编写的。要安装它们，您需要[安装 Go](https://golang.org/doc/install) 并将 `$GOPATH/bin` 放在 `$PATH` 中；更多信息请参见[此处](https://github.com/tendermint/tendermint/wiki/Setting-GOPATH)。

然后运行

```
go get github.com/tendermint/tendermint
cd $GOPATH/src/github.com/tendermint/tendermint
make get_tools
make get_vendor_deps
make install_abci
```

现在应该安装了 `abci-cli`；您将看到两个命令(`counter` 和 `kvstore`)，它们是用 Go 编写的示例应用程序。下面是用 JavaScript 编写的应用程序。

现在，让我们运行一些应用程序！

## KVStore - 第一个例子

kvstore 应用程序是一个 [默克尔树](https://en.wikipedia.org/wiki/Merkle_tree)，它只存储所有交易。如果交易包含 `=`，例如：`key=value`，然后 `value` 存储在默克尔树的 `key` 下。否则，完整的交易字节存储为键和值。

让我们启动一个 kvstore 应用程序。

```
abci-cli kvstore
```

在另一个终端，我们可以开始 Tendermint。如果你从未使用过 Tendermint，请使用：

```
tendermint init
tendermint node
```

如果您使用过 Tendermint，您可能希望通过运行 `tendermint unsafe_reset_all` 来重置新区块链的数据。然后你可以运行 `tendermint node` 来启动tendermint，并连接到应用程序。详情请参阅 [Tendermint 使用指南](../tendermint-core/using-tendermint.md)。

你应该看看 Tendermint！我们可以得到我们的 Tendermint 节点的状态如下：

```
curl -s localhost:26657/status
```

`-s` 只是沉默 `curl`。为了得到更好的输出，可以将结果导入到 [jq](https://stedolan.github.io/jq/) 或 `json_pp` 之类的工具中。

现在让我们将一些交易发送到 kvstore。

```
curl -s 'localhost:26657/broadcast_tx_commit?tx="abcd"'
```

注意 url 周围的单引号(`'`)，这确保 bash 不会转义双引号(`"`)。这个命令发送了一个带有字节 `abcd` 的交易，因此 `abcd` 将作为键和值存储在默克尔树中。响应应该是这样的：

```
{
  "jsonrpc": "2.0",
  "id": "",
  "result": {
    "check_tx": {},
    "deliver_tx": {
      "tags": [
        {
          "key": "YXBwLmNyZWF0b3I=",
          "value": "amFl"
        },
        {
          "key": "YXBwLmtleQ==",
          "value": "YWJjZA=="
        }
      ]
    },
    "hash": "9DF66553F98DE3C26E3C3317A3E4CED54F714E39",
    "height": 14
  }
}
```

我们可以通过查询应用程序来确认我们的交易是否正常工作，以及是否存储了值:

```
curl -s 'localhost:26657/abci_query?data="abcd"'
```

结果应该如下：

```
{
  "jsonrpc": "2.0",
  "id": "",
  "result": {
    "response": {
      "log": "exists",
      "index": "-1",
      "key": "YWJjZA==",
      "value": "YWJjZA=="
    }
  }
}
```

注意结果中的 `value` (`YWJjZA==`)；这是 `abcd` ASCII 的 base64 编码。您可以在 python2 shell 中运行 `"YWJjZA==".decode('base64')` 来验证这一点，或者在 python3 shell 中运行 `import codecs; codecs.decode("YWJjZA==", 'base64').decode('ascii')`。
请继续关注将来的版本，该版本[使输出更具可读性](https://github.com/tendermint/tendermint/issues/1794)。

现在让我们尝试设置一个不同的键和值：

```
curl -s 'localhost:26657/broadcast_tx_commit?tx="name=satoshi"'
```

现在，如果我们查询 `name`，应该会得到 `satoshi` 或 base64 的 `c2F0b3NoaQ==`：

```
curl -s 'localhost:26657/abci_query?data="name"'
```

尝试一些其他交易和查询，以确保一切正常工作！

## Counter - 另一个例子

现在我们已经掌握了窍门，让我们尝试另一个应用程序，`counter` 应用程序。

计数器应用程序不使用默克尔树，它只计算我们发送交易或提交状态的次数。

这个应用程序有两种模式：`serial=off` 和 `serial=on`。

当 `serial=on` 时，交易必须是一个以大端编码的递增整数，从 0 开始。

如果 `serial=off`，则对交易没有限制。

在活动的区块链中，交易在提交到块之前收集到内存中。为了避免在无效的交易上浪费资源，ABCI 提供了 `CheckTx` 消息，应用程序开发人员可以使用它来接受或拒绝交易，然后再将交易存储在内存中或传递给其他节点。

在这个计数器应用程序的实例中，使用 `serial=on`，`CheckTx` 只允许整数大于最后提交的整数的交易。

让我们终止之前的 `tendermint` 实例和 `kvstore` 应用程序，并启动计数器应用程序。我们可以使用一个标记启用 `serial=on`：

```
abci-cli counter --serial
```

在另一个窗口，重置，然后开始 Tendermint：

```
tendermint unsafe_reset_all
tendermint node
```

同样，您可以看到块流过去。让我们发送一些交易。由于我们设置了 `serial=on`，第一个交易必须是数字 `0`：

```
curl localhost:26657/broadcast_tx_commit?tx=0x00
```

注意空响应(因此成功)。下一个交易必须是数字 `1`。如果相反，我们试图发送一个 `5`，我们得到一个错误：

```
> curl localhost:26657/broadcast_tx_commit?tx=0x05
{
  "jsonrpc": "2.0",
  "id": "",
  "result": {
    "check_tx": {},
    "deliver_tx": {
      "code": 2,
      "log": "Invalid nonce. Expected 1, got 5"
    },
    "hash": "33B93DFF98749B0D6996A70F64071347060DC19C",
    "height": 34
  }
}
```

但如果我们发送一个 `1`，它又会工作:

```
> curl localhost:26657/broadcast_tx_commit?tx=0x01
{
  "jsonrpc": "2.0",
  "id": "",
  "result": {
    "check_tx": {},
    "deliver_tx": {},
    "hash": "F17854A977F6FA7EEA1BD758E296710B86F72F3D",
    "height": 60
  }
}
```

有关 `broadcast_tx` API 的详细信息，请参阅 [Tendermint 使用指南](../tendermint-core/using-tendermint.md)。

## CounterJS - 另一种语言的例子

我们还想用另一种语言运行应用程序 - 在本例中，我们将运行 `counter` 的 Javascript 版本。要运行它，您需要 [安装] node](https://nodejs.org/en/download/)。

您还需要从[此处](https://github.com/tendermint/js-abci)获取相关的存储库，然后安装它:

```
git clone https://github.com/tendermint/js-abci.git
cd js-abci
npm install abci
```

终止之前的 `counter` 和 `tendermint` 过程。现在运行应用程序：

```
node example/counter.js
```

在另一个窗口，重置并启动 `tendermint`：

```
tendermint unsafe_reset_all
tendermint node
```

再一次，您应该看到块流出 - 但现在，我们的应用程序是用 Javascript 编写的!尝试发送一些交易，像以前一样 - 结果应该是相同的：

```
# ok
curl localhost:26657/broadcast_tx_commit?tx=0x00
# invalid nonce
curl localhost:26657/broadcast_tx_commit?tx=0x05
# ok
curl localhost:26657/broadcast_tx_commit?tx=0x01
```

平滑的，是吗？
