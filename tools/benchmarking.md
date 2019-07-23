# tm-bench

Tendermint 区块链基准测试工具：

- [https://github.com/tendermint/tendermint/tree/master/tools/tm-bench](https://github.com/tendermint/tendermint/tree/master/tools/tm-bench)

例如，如下所示：

```
tm-bench -T 10 -r 1000 localhost:26657
```

将输出：

```
Stats          Avg       StdDev     Max      Total
Txs/sec        818       532        1549     9000
Blocks/sec     0.818     0.386      1        9
```

## 快速启动

[安装 Tendermint](../introduction/install.md)
这是目前的设置工作在 tendermint 的开发部门。请确保你正在做这件事。(如果没有，在 gopkg 中更新 `tendermint` 和 `tmlibs`。使用主分支。)

然后运行：

```
tendermint init
tendermint node --proxy_app=kvstore
```

```
tm-bench localhost:26657
```

最后一个命令位于单独的窗口中。

## 用法

```
tm-bench [-c 1] [-T 10] [-r 1000] [-s 250] [endpoints]

Examples:
        tm-bench localhost:26657
Flags:
  -T int
        Exit after the specified amount of time in seconds (default 10)
  -c int
        Connections to keep open per endpoint (default 1)
  -r int
        Txs per second to send in a connection (default 1000)
  -s int
        Size per tx in bytes
  -v    Verbose output
```

## 如何收集统计数据

这些统计数据是通过让每个连接在指定的时间内以指定的速率(或尽可能接近的速度)发送事务来获得的。在指定的时间之后，它遍历在该时间内创建的所有块。每秒的平均和 stddev 是在此基础上计算的，方法是按秒分组数据。

为了在每个连接中以指定的速率发送事务，我们循环处理事务的数量。如果速度太慢，循环会在一秒钟内停止。
如果太快了，我们就等到一秒钟结束。每秒事务数统计是根据块中的最终事务数计算的。

每个连接都通过两个独立的 go 协程处理。

## 开发

```
make get_vendor_deps
make test
```
