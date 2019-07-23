# Docker Compose

使用 Docker Compose，您可以使用一个命令启动本地测试网络。

## 需求

1. [安装 tendermint](../introduction/install.md)
2. [安装 docker](https://docs.docker.com/engine/installation/)
3. [安装 docker-compose](https://docs.docker.com/compose/install/)

## 构建

构建 `tendermint` 二进制文件和可选 `tendermint/localnode` docker 映像。

注意，二进制文件将被挂载到容器中，因此可以在不重新构建镜像的情况下更新它。

```
cd $GOPATH/src/github.com/tendermint/tendermint

# Build the linux binary in ./build
make build-linux

# (optionally) Build tendermint/localnode image
make build-docker-localnode
```

## 运行一个测试网络

要启动 4 个节点的测试网络运行：

```
make localnet-start
```

节点将其 RPC 服务器绑定到主机上的端口 26657、26660、26662和26664。

该文件使用 localnode 镜像创建一个 4 个节点的网络。

网络节点分别向端口 26656-26657、26659-26660、26661-26662 和 26663-26664 上的主机公开它们的 P2P 和 RPC 端点。

要更新二进制文件，只需重新构建并重新启动节点:

```
make build-linux
make localnet-stop
make localnet-start
```

## 配置

`make localnet-start` 过调用 `tendermint testnet` 命令为一个 4 节点的测试网络在 `./build` 目录创建文件。

`./build` 目录被挂载到 `/tendermint` 挂载点，将二进制文件和配置文件附加到容器上。

要更改验证者/非验证者的数量，请更改 `localnet-start` Makefile 目标:

```
localnet-start: localnet-stop
	@if ! [ -f build/node0/config/genesis.json ]; then docker run --rm -v $(CURDIR)/build:/tendermint:Z tendermint/localnode testnet --v 5 --n 3 --o . --populate-persistent-peers --starting-ip-address 192.167.10.2 ; fi
	docker-compose up
```

该命令现在将为 5 个验证者和 3 个非验证者网络生成配置文件。

在运行之前，不要忘记清理旧文件：

```
cd $GOPATH/src/github.com/tendermint/tendermint

# Clear the build folder
rm -rf ./build/node*
```

## 配置 abci 容器 

要使用您自己的带有 4 个节点设置的 abci 应用程序，请编辑 [docker-compose.yaml](https://github.com/tendermint/tendermint/blob/develop/docker-compose.yml)。文件并将镜像添加到 abci 应用程序中。

```
 abci0:
    container_name: abci0
    image: "abci-image"
    build:
      context: .
      dockerfile: abci.Dockerfile
    command: <insert command to run your abci application>
    networks:
      localnet:
        ipv4_address: 192.167.10.6

  abci1:
    container_name: abci1
    image: "abci-image"
    build:
      context: .
      dockerfile: abci.Dockerfile
    command: <insert command to run your abci application>
    networks:
      localnet:
        ipv4_address: 192.167.10.7

  abci2:
    container_name: abci2
    image: "abci-image"
    build:
      context: .
      dockerfile: abci.Dockerfile
    command: <insert command to run your abci application>
    networks:
      localnet:
        ipv4_address: 192.167.10.8

  abci3:
    container_name: abci3
    image: "abci-image"
    build:
      context: .
      dockerfile: abci.Dockerfile
    command: <insert command to run your abci application>
    networks:
      localnet:
        ipv4_address: 192.167.10.9

```

覆盖每个节点中的[command](https://github.com/tendermint/tendermint/blob/master/networks/local/localnode/Dockerfile#L12)以连接到它的 abci。

```
  node0:
    container_name: node0
    image: "tendermint/localnode"
    ports:
      - "26656-26657:26656-26657"
    environment:
      - ID=0
      - LOG=$${LOG:-tendermint.log}
    volumes:
      - ./build:/tendermint:Z
    command: node --proxy_app=tcp://abci0:26658
    networks:
      localnet:
        ipv4_address: 192.167.10.2
```

对 node1、node2 和 node3 执行类似的操作，然后[运行测试网络](https://github.com/tendermint/tendermint/blob/master/docs/networks/docker-compose.md#run-a-testnet)

## 日志

日志保存在附加卷的 `tendermint.log` 文件中。如果开始时将 `LOG` 环境变量设置为 `stdout`，则不会保存日志，而是打印在屏幕上。

## 特殊的二进制文件

如果您有多个具有不同名称的二进制文件，您可以指定使用 `BINARY` 环境变量运行哪个二进制文件。二进制文件的路径相对于所附的卷。
