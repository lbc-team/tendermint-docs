# 使用 ABCI-CLI

为了方便 ABCI 服务器和简单应用程序的测试和调试，我们构建了一个 CLI，即 `abci-cli`，用于从命令行发送 ABCI 消息。

## 安装

确保你[已安装 Go](https://golang.org/doc/install).

接下来，安装 `abci-cli` 工具和示例应用程序：

```
mkdir -p $GOPATH/src/github.com/tendermint
cd $GOPATH/src/github.com/tendermint
git clone https://github.com/tendermint/tendermint.git
cd tendermint
make get_tools
make get_vendor_deps
make install_abci
```

现在运行 `abci-cli` 查看命令列表：

```
Usage:
  abci-cli [command]

Available Commands:
  batch       Run a batch of abci commands against an application
  check_tx    Validate a tx
  commit      Commit the application state and return the Merkle root hash
  console     Start an interactive abci console for multiple commands
  counter     ABCI demo example
  deliver_tx  Deliver a new tx to the application
  kvstore     ABCI demo example
  echo        Have the application echo a message
  help        Help about any command
  info        Get some info about the application
  query       Query the application state
  set_option  Set an options on the application

Flags:
      --abci string      socket or grpc (default "socket")
      --address string   address of application socket (default "tcp://127.0.0.1:26658")
  -h, --help             help for abci-cli
  -v, --verbose          print the command and results as if it were a console session

Use "abci-cli [command] --help" for more information about a command.
```

## KVStore - 第一个例子

`abci-cli` 工具允许我们向应用程序发送 ABCI 消息，以帮助构建和调试它们。

最重要的消息是 `deliver_tx`、`check_tx` 和 `commit`，但出于方便、配置和信息目的，还有其他消息。

我们将启动一个 kvstore 应用程序，它与上面的 `abci-cli` 同时安装。kvstore 只是在默克尔树中存储交易。

它的代码可以在[这里](https://github.com/tendermint/tendermint/blob/develop/abci/cmd/abci-cli/abci-cli.go)找到，看起来像:

```
func cmdKVStore(cmd *cobra.Command, args []string) error {
    logger := log.NewTMLogger(log.NewSyncWriter(os.Stdout))

    // Create the application - in memory or persisted to disk
    var app types.Application
    if flagPersist == "" {
        app = kvstore.NewKVStoreApplication()
    } else {
        app = kvstore.NewPersistentKVStoreApplication(flagPersist)
        app.(*kvstore.PersistentKVStoreApplication).SetLogger(logger.With("module", "kvstore"))
    }

    // Start the listener
    srv, err := server.NewServer(flagAddrD, flagAbci, app)
    if err != nil {
        return err
    }
    srv.SetLogger(logger.With("module", "abci-server"))
    if err := srv.Start(); err != nil {
        return err
    }

    // Stop upon receiving SIGTERM or CTRL-C.
    cmn.TrapSignal(logger, func() {
        // Cleanup
        srv.Stop()
    })

    // Run forever.
    select {}
}
```

开始运行：

```
abci-cli kvstore
```

在另一个终端，运行

```
abci-cli echo hello
abci-cli info
```

你会看到：

```
-> data: hello
-> data.hex: 68656C6C6F
```

和：

```
-> data: {"size":0}
-> data.hex: 7B2273697A65223A307D
```

ABCI 应用程序必须提供以下两点：

- 一个套接字服务器
- ABCI 消息的处理程序

当我们运行 `abci-cli` 工具时，我们打开到应用程序套接字服务器的新连接，发送给定的 ABCI 消息，并等待响应。

服务器可能是特定语言的通用服务器，我们提供了一个 [Go 语言中的参考实现](https://github.com/tendermint/tendermint/tree/develop/abci/server)。查看其他语言服务器的[其他 ABCI 实现列表](./ecosystem.md)。

处理程序是特定于应用程序的，并且可以是任意的，只要它是确定的并且符合 ABCI 接口规范。

因此，当我们运行 `abci-cli info` 时，我们打开到 ABCI 服务器的新连接，它调用应用程序上的 `Info()` 方法，该方法告诉我们默克尔树中的交易数。

现在，由于每个命令都打开一个新的连接，我们提供了 `abci-cli console` 和 `abci-cli batch` 命令，以允许通过一个连接发送多个 ABCI 消息。

运行 `abci-cli console` 应该会将您置于一个交互式控制台中，用于向您的应用程序发出 ABCI 消息。

尝试运行以下命令：

```
> echo hello
-> code: OK
-> data: hello
-> data.hex: 0x68656C6C6F

> info
-> code: OK
-> data: {"size":0}
-> data.hex: 0x7B2273697A65223A307D

> commit
-> code: OK
-> data.hex: 0x0000000000000000

> deliver_tx "abc"
-> code: OK

> info
-> code: OK
-> data: {"size":1}
-> data.hex: 0x7B2273697A65223A317D

> commit
-> code: OK
-> data.hex: 0x0200000000000000

> query "abc"
-> code: OK
-> log: exists
-> height: 0
-> value: abc
-> value.hex: 616263

> deliver_tx "def=xyz"
-> code: OK

> commit
-> code: OK
-> data.hex: 0x0400000000000000

> query "def"
-> code: OK
-> log: exists
-> height: 0
-> value: xyz
-> value.hex: 78797A
```

注意，如果我们执行 `deliver_tx "abc"` 操作，它将存储 `(abc, abc)`，但是如果执行 `deliver_tx "abc=efg"` 操作，它将存储`(abc, efg)`。

类似地，您可以将命令放入文件中并运行 `abci-cli --verbose batch < myfile`。

## Counter - 另一个例子

现在我们已经掌握了窍门，让我们尝试另一个应用程序，"counter" 应用程序。

和 kvstore 应用程序一样，它的代码可以在[这里](https://github.com/tendermint/tendermint/blob/master/abci/cmd/abci-cli/abci-cli.go)找到，如下所示:

```
func cmdCounter(cmd *cobra.Command, args []string) error {

    app := counter.NewCounterApplication(flagSerial)

    logger := log.NewTMLogger(log.NewSyncWriter(os.Stdout))

    // Start the listener
    srv, err := server.NewServer(flagAddrC, flagAbci, app)
    if err != nil {
        return err
    }
    srv.SetLogger(logger.With("module", "abci-server"))
    if err := srv.Start(); err != nil {
        return err
    }

    // Stop upon receiving SIGTERM or CTRL-C.
    cmn.TrapSignal(logger, func() {
        // Cleanup
        srv.Stop()
    })

    // Run forever.
    select {}
}
```

计数器应用程序不使用默克尔树，它只计算我们发送交易、请求哈希或提交状态的次数。`commit` 的结果就是发送的交易数。

这个应用程序有两种模式：`serial=off` 和 `serial=on`。

当 `serial=on` 时，交易必须是一个以大端编码的递增整数，从 0 开始。

如果 `serial=off`，则对交易没有限制。

我们可以使用 `set_option` ABCI 消息切换 `serial` 的值。

当 `serial=on` 时，一些交易是无效的。在活动的区块链中，交易在提交到块之前收集到内存中。为了避免在无效的交易上浪费资源，ABCI 提供了 `check_tx` 消息，应用程序开发人员可以使用该消息来接受或拒绝交易，然后再将交易存储在内存中或传递给其他节点。

在计数器应用程序的这个实例中，`check_tx` 只允许整数大于最后提交的整数的交易。

让我们关闭控制台和 kvstore 应用程序，启动 counter 应用程序：

```
abci-cli counter
```

在另一个窗口，启动 `abci-cli console`：

```
> set_option serial on
-> code: OK
-> log: OK (SetOption doesn't return anything.)

> check_tx 0x00
-> code: OK

> check_tx 0xff
-> code: OK

> deliver_tx 0x00
-> code: OK

> check_tx 0x00
-> code: BadNonce
-> log: Invalid nonce. Expected >= 1, got 0

> deliver_tx 0x01
-> code: OK

> deliver_tx 0x04
-> code: BadNonce
-> log: Invalid nonce. Expected 2, got 4

> info
-> code: OK
-> data: {"hashes":0,"txs":2}
-> data.hex: 0x7B22686173686573223A302C22747873223A327D
```

这是一个非常简单的应用程序，但是在 `counter` 和 `kvstore` 之间，很容易看到如何在 ABCI 之上构建任意的应用程序状态。[Hyperledger's Burrow](https://github.com/hyperledger/burrow) 也运行在 ABCI 之上，带来了类似以太的账户、以太虚拟机、Monax 的许可方案和本地契约扩展。

但是，最终的灵活性来自能够用任何语言轻松编写应用程序。

我们已经用多种语言实现了计数器[参见示例目录](https://github.com/tendermint/tendermint/tree/develop/abci/example)。

要运行 Node JS 版本，`cd` 到 `example/js` 并运行

```
node app.js
```

(您必须终止另一个计数器应用程序)。在另一个窗口中，运行控制台和前面的 ABCI 命令。您应该得到与 Go 版本相同的结果。

## 赏金

想用你最喜欢的语言编写计数器应用程序？！我们很乐意将您加入我们的[生态系统](https://tendermint.com/ecosystem)！我们还为新语言的实现提供[奖励](https://hackerone.com/tendermint/)！

`abci-cli` 严格设计用于测试和调试。在实际部署中，发送消息的角色由 Tendermint 承担，它使用三个独立的连接连接到应用程序，每个连接都有自己的消息模式。

有关更多信息，请参见[应用程序开发人员指南](./app-development.md)。要运行带有 Tendermint 的 ABCI 应用程序，请参阅[入门指南](./getting-started.md)。
接下来是 ABCI 规范。
