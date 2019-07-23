# tm-signer-harness

Tendermint 远程签名者测试工具促进了 Tendermint 和远程签名者之间的集成测试，比如 [KMS](https://github.com/tendermint/kms)。这种远程签名者允许使用[HSMs](https://en.wikipedia.org/wiki/Hardware_security_module) 签署重要的 Tendermint 消息，从而提供额外的安全性。

当执行时, `tm-signer-harness`：

1. 运行侦听器(TCP或Unix套接字)。
2. 等待来自远程签名者的连接。
3. 从远程签名者连接后，执行许多自动化测试以确保兼容性。
4. 验证成功后，控制流程将以 0 退出码退出。验证失败后，它将使用与错误相关的特定退出码退出。

## 先决条件

要求与构建 [Tendermint](https://github.com/tendermint/tendermint) 相同的先决条件。

## 构建

从您的 Tendermint 源代码库中 `tools/tm-signer-harness` 目录，只需运行：

```bash
make

# To have global access to this executable
make install
```

## Docker 镜像

要构建一个包含 `tm-signer-harness` 的 Docker 镜像，也可以从 Tendermint 源代码库的 `tools/tm-signer-harness` 目录中找到，只需运行：

```bash
make docker-image
```

## 针对 KMS 运行

作为如何使用 `tm-signer-harness` 的示例，下面的说明向您展示了如何针对 [KMS](https://github.com/tendermint/kms) 执行它的测试。对于本例，我们将使用**KMS中的软件签名模块**，因为硬件签名模块需要一个物理设备 [YubiHSM](https://www.yubico.com/products/yubihsm/)。

### 步骤 1: 在本地计算机上安装 KMS

有关如何在本地机器上设置 KMS 的详细信息，请参阅[KMS 库](https://github.com/tendermint/kms)。

如果您在本地机器上安装了 [Rust](https://www.rust-lang.org/)，您可以通过以下方式安装 KMS：

```bash
cargo install tmkms
```

### Step 2: 为 KMS 制作密钥

KMS 软件签名模块需要一个密钥来签署消息。在我们的示例中，我们将简单地从本地 Tendermint 实例导出一个签名密钥。

```bash
# Will generate all necessary Tendermint configuration files, including:
# - ~/.tendermint/config/priv_validator_key.json
# - ~/.tendermint/data/priv_validator_state.json
tendermint init

# Extract the signing key from our local Tendermint instance
tm-signer-harness extract_key \      # Use the "extract_key" command
    -tmhome ~/.tendermint \          # Where to find the Tendermint home directory
    -output ./signing.key            # Where to write the key
```

此外，由于我们希望 KMS 连接到 `tm-signer-harness`，我们需要从 KMS 侧提供一个秘密连接密钥：

```bash
tmkms keygen secret_connection.key
```

### Step 3: 配置并运行 KMS

KMS 需要一些配置来告诉它使用更软的签名模块和 `signing.key`。我们刚刚生成的密钥文件。将以下内容保存到一个名为 `tmkms.toml` 的文件中：

```toml
[[validator]]
addr = "tcp://127.0.0.1:61219"         # This is where we will find tm-signer-harness.
chain_id = "test-chain-0XwP5E"         # The Tendermint chain ID for which KMS will be signing (found in ~/.tendermint/config/genesis.json).
reconnect = true                       # true is the default
secret_key = "./secret_connection.key" # Where to find our secret connection key.

[[providers.softsign]]
id = "test-chain-0XwP5E"               # The Tendermint chain ID for which KMS will be signing (same as validator.chain_id above).
path = "./signing.key"                 # The signing key we extracted earlier.
```

然后运行 KMS 与此配置：

```bash
tmkms start -c tmkms.toml
```

这将启动 KMS，它将反复尝试连接到 `tcp://127.0.0.1:61219`，直到成功为止。

### Step 4: 运行 tm-signer-harness

现在我们来运行签名者测试工具：

```bash
tm-signer-harness run \             # The "run" command executes the tests
    -addr tcp://127.0.0.1:61219 \   # The address we promised KMS earlier
    -tmhome ~/.tendermint           # Where to find our Tendermint configuration/data files.
```

如果 Tendermint 和 KMS 的当前版本兼容，`tm-signer-harness` 现在应该以 0 退出码退出。如果它们不兼容，则应该使用有意义的非零退出码退出(参见下面的退出代码)。

### Step 5: 关闭 KMS

只需在 KMS 实例上按 Ctrl+Break (或在Linux中使用 `kill` 命令)优雅地终止它。

## 退出码含义

以下列表显示了 `tm-signer-harness` 中的各种退出码及其含义：

| Exit Code | Description |
| --- | --- |
| 0 | 成功! |
| 1 | 提供给 `tm-signer-harness` 的命令行参数无效 |
| 2 | 达到的最大接受重试次数(`-accept-retries` 参数) |
| 3 | 加载 `${TMHOME}/config/genesis.json` 失败 |
| 4 | 未能创建由 `-addr` 参数指定的侦听器 |
| 5 | 启动监听器失败 |
| 6 | 被 `SIGINT` 中断 (例如按 Ctrl+Break 或 Ctrl+C) |
| 7 | 其他未知的错误 |
| 8 | 测试 1 失败:公钥不匹配 |
| 9 | 测试 2 失败:提案签署失败 |
| 10 | 测试 3 失败:投票签名失败 |
