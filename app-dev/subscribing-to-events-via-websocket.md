# 通过 Websocket 订阅事件

Tendermint 会发出不同的事件，您可以通过[Websocket](https://en.wikipedia.org/wiki/WebSocket)订阅这些事件。这对于第三方应用程序(如 analysys)或检查状态非常有用。

[事件列表](https://godoc.org/github.com/tendermint/tendermint/types#pkg-constants)

您可以通过 Websocket 调用 `subscribe` RPC 方法订阅上面的任何事件。

```
{
    "jsonrpc": "2.0",
    "method": "subscribe",
    "id": "0",
    "params": {
        "query": "tm.event='NewBlock'"
    }
}
```

查看[API 文档](https://tendermint.com/rpc/)，了解更多关于查询语法和其他选项的信息。

您还可以使用标记(假定您已经将它们包含到 DeliverTx 响应中)来查询交易结果。有关详细信息，请参见[索引交易](./indexing-transactions.md)。

### ValidatorSetUpdates

当验证者集更改时，将发布 ValidatorSetUpdates 事件。该事件携带一个公钥/投票权利对列表。此列表与从 ABCI 应用程序中收到的相同(参见 ABCI 规范中的[EndBlock 部分](../spec/abci/abci.md#endblock))。

响应：

```
{
    "jsonrpc": "2.0",
    "id": "0#event",
    "result": {
        "query": "tm.event='ValidatorSetUpdates'",
        "data": {
            "type": "tendermint/event/ValidatorSetUpdates",
            "value": {
              "validator_updates": [
                {
                  "address": "09EAD022FD25DE3A02E64B0FE9610B1417183EE4",
                  "pub_key": {
                    "type": "tendermint/PubKeyEd25519",
                    "value": "ww0z4WaZ0Xg+YI10w43wTWbBmM3dpVza4mmSQYsd0ck="
                  },
                  "voting_power": "10",
                  "proposer_priority": "0"
                }
              ]
            }
        }
    }
}
```
