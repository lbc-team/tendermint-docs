# 部署一个测试网络

弃用文档！

见[网络](../networks)。

## 手动部署

手动设置 Tendermint 集群相对容易。对于一个特定的 Tendermint 节点，惟一的要求是验证者的私钥，存储为 `priv_validator.json`。一个节点密钥，存储为 `node_key.json`。以及所有验证者的公钥列表，存储为 `genesis.json`。这些文件应该存储在 `~/.tendermint/config`，或任何可能设置 `$TMHOME` 变量的地方。

以下是手动设置测试网络的步骤：

1.  在您选择的云提供商上提供节点
2.  在所有节点上安装 Tendermint 和感兴趣的应用程序
3.  使用 `tendermint init` 为每个验证者生成私钥和节点密钥
4.  将每个验证者的公钥列表编译为一个新的 `genesis.json` 文件替换现有文件。
5.  通过在相关机器上运行 `tendermint show_node_id`，获取您希望其他节点连接到的任何节点的节点 ID
6.  将所有节点的配置中的 `p2p.persistent_peers` 设置为所有节点的 `ID@IP:PORT` 的逗号分隔列表。默认端口是 26656。

然后启动节点

```
tendermint node --proxy_app=kvstore
```

几秒钟后，所有的节点应该互相连接并开始创建块！有关更多信息，请参阅[Tendermint 使用指南](../tendermint-core/using-tendermint.md)的 Tendermint 网络部分。

但是等等！步骤3、4和5非常手动。相反，使用 `tendermint testnet` 命令。默认情况下，运行 `tendermint testnet` 将创建所有需要的文件，但它不会填充持久节点列表。但是，如果您提供了 `--populate-persistent-peers` 标志和可选的 `--starting-ip-address` 标志，它就会这样做。运行 `tendermint testnet --help` 以获得更多关于可用标志的详细信息。

```
tendermint testnet --populate-persistent-peers --starting-ip-address 192.168.0.1
```

此命令将生成四个文件夹，并以“node”为前缀，将它们放入 "./mytestnet" 目录作为默认目录。

可以想象，这个命令对于手动或自动部署非常有用。

## 自动部署

最简单和最快的方法，获得一个测试网络不到5分钟。

### 本地

安装 `docker` 和 `docker-compose` 后，运行以下命令：

```
make localnet-start
```

来自 tendermint 存储库的根目录。这将启动一个 4 节点的本地测试网络。注意，该命令期望 build 目录中有一个 linux 二进制文件。
如果您使用非 linux 操作系统构建二进制文件，您可能会看到错误 `Binary needs to be OS linux, ARCH amd64`，在这种情况下，您可以运行:

```
make build-linux
make localnet-start
```

检查 Makefile 中的目标以调试任何问题。

### 云端

有关详细信息，请参见[下一节](./terraform-and-ansible.md)。
