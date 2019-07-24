# 索引交易

Tendermint允许您索引交易，然后查询或订阅它们的结果。

让我们来看看 `[tx_index]` 配置部分：
Let's take a look at the `[tx_index]` config section:

```
##### transactions indexer configuration options #####
[tx_index]

# What indexer to use for transactions
#
# Options:
#   1) "null"
#   2) "kv" (default) - the simplest possible indexer, backed by key-value storage (defaults to levelDB; see DBBackend).
indexer = "kv"

# Comma-separated list of tags to index (by default the only tag is "tx.hash")
#
# You can also index transactions by height by adding "tx.height" tag here.
#
# It's recommended to index only a subset of tags due to possible memory
# bloat. This is, of course, depends on the indexer's DB and the volume of
# transactions.
index_tags = ""

# When set to true, tells indexer to index all tags (predefined tags:
# "tx.hash", "tx.height" and all tags from DeliverTx responses).
#
# Note this may be not desirable (see the comment above). IndexTags has a
# precedence over IndexAllTags (i.e. when given both, IndexTags will be
# indexed).
index_all_tags = false
```

默认情况下，Tendermint 将使用嵌入的简单索引器按各自的哈希索引所有交易。注意，我们计划在将来添加更多的选项(例如：Postgresql 索引器)。

## 添加标记

在应用程序的 `DeliverTx` 方法中，使用 UTF-8 编码的字符串对添加 `Tags` 字段(例如："account.owner": "Bob", "balance":
"100.0", "date": "2018-01-02")。

例子：

```
func (app *KVStoreApplication) DeliverTx(tx []byte) types.Result {
    ...
    tags := []cmn.KVPair{
      {[]byte("account.name"), []byte("igor")},
      {[]byte("account.address"), []byte("0xdeadbeef")},
      {[]byte("tx.amount"), []byte("7")},
    }
    return types.ResponseDeliverTx{Code: code.CodeTypeOK, Tags: tags}
}
```

如果您想让 Tendermint 只通过 “account.name” 标记索引交易，请在配置集中设置 `tx_index.index_tags="account.name"`。如果要索引所有标签，请设置 `index_all_tags=true`

注意，这里有一些预定义的标签：

- `tx.hash` (交易哈希)
- `tx.height` (交易提交的块高度)

如果您尝试使用以上任何一个键，Tendermint 都会发出警告。

## 查询交易

您可以通过调用 `/tx_search` RPC 端点查询交易结果：

```
curl "localhost:26657/tx_search?query=\"account.name='igor'\"&prove=true"
```

查看[API 文档](https://tendermint.com/rpc/#txsearch)，了解更多关于查询语法和其他选项的信息。

## 订阅交易

通过向 `/subscribe` RPC 端点提供查询，客户端可以通过 Websocket 订阅具有给定标记的交易。

```
{
    "jsonrpc": "2.0",
    "method": "subscribe",
    "id": "0",
    "params": {
        "query": "account.name='igor'"
    }
}
```

请查看[API 文档](https://tendermint.com/rpc/#subscribe)，以获得关于查询语法和其他选项的更多信息。
