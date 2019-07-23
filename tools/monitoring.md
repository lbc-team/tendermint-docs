# tm-monitor

Tendermint 区块链监控工具；监视一个或多个节点，收集并向用户提供各种统计数据：

- [https://github.com/tendermint/tendermint/tree/master/tools/tm-monitor](https://github.com/tendermint/tendermint/tree/master/tools/tm-monitor)

## 快速启动

### Docker

假设您的应用程序运行在另一个名为 `app` 的容器中:

```
docker run -it --rm -v "/tmp:/tendermint" tendermint/tendermint init
docker run -it --rm -v "/tmp:/tendermint" -p "26657:26657" --name=tm --link=app tendermint/tendermint node --proxy_app=tcp://app:26658

docker run -it --rm -p "26670:26670" --link=tm tendermint/monitor tm:26657
```

如果您还没有应用程序，但仍然想尝试监控输出，请使用 `kvstore`：

```
docker run -it --rm -v "/tmp:/tendermint" tendermint/tendermint init
docker run -it --rm -v "/tmp:/tendermint" -p "26657:26657" --name=tm tendermint/tendermint node --proxy_app=kvstore
```

```
docker run -it --rm -p "26670:26670" --link=tm tendermint/monitor tm:26657
```

### 使用二进制文件

[安装 Tendermint](../introduction/install.md).

启动 Tendermint 节点：

```
tendermint init
tendermint node --proxy_app=kvstore
```

在另一个窗口中，运行监视器：

```
tm-monitor localhost:26657
```

## 用法

```
tm-monitor [-v] [-no-ton] [-listen-addr="tcp://0.0.0.0:26670"] [endpoints]

Examples:
        # monitor single instance
        tm-monitor localhost:26657

        # monitor a few instances by providing comma-separated list of RPC endpoints
        tm-monitor host1:26657,host2:26657
Flags:
  -listen-addr string
        HTTP and Websocket server listen address (default "tcp://0.0.0.0:26670")
  -no-ton
        Do not show ton (table of nodes)
  -v    verbose logging
```

### RPC UI

运行 `tm-monitor` 并访问 http://localhost:26670，您应该会看到可用 RPC 端点的列表:

```
http://localhost:26670/status
http://localhost:26670/status/network
http://localhost:26670/monitor?endpoint=_
http://localhost:26670/status/node?name=_
http://localhost:26670/unmonitor?endpoint=_
```

该 API 可用作带有 URI 编码参数的 GET 请求，也可用作 JSONRPC POST 请求。JSONRPC 方法也通过 websocket 公开。

## 开发

```
make get_tools
make get_vendor_deps
make test
```
