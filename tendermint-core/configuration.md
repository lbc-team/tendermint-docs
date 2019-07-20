# 配置

Tendermint Core 可以通过 `$TMHOME/config/config.toml` TOML 文件进行配置。其中一些参数可以由命令行标志覆盖。对于大多数用户来说，对于大多数用户来说，`##### main base configuration options #####` 中的选项将被修改，而下面的配置选项将用于高级用户。

## 选项

由 `tendermint init` 创建的默认配置文件使用默认值设置了所有参数。不过，它看起来就像下面的文件一样，通过您已安装的 `tendermint` 版本创建的 `config.toml` 进行双重检查：

```
# This is a TOML config file.
# For more information, see https://github.com/toml-lang/toml

##### main base config options #####

# TCP or UNIX socket address of the ABCI application,
# or the name of an ABCI application compiled in with the Tendermint binary
proxy_app = "tcp://127.0.0.1:26658"

# A custom human readable name for this node
moniker = "anonymous"

# If this node is many blocks behind the tip of the chain, FastSync
# allows them to catchup quickly by downloading blocks in parallel
# and verifying their commits
fast_sync = true

# Database backend: leveldb | memdb | cleveldb
db_backend = "leveldb"

# Database directory
db_dir = "data"

# Output level for logging, including package level options
log_level = "main:info,state:info,*:error"

# Output format: 'plain' (colored text) or 'json'
log_format = "plain"

##### additional base config options #####

# Path to the JSON file containing the initial validator set and other meta data
genesis_file = "config/genesis.json"

# Path to the JSON file containing the private key to use as a validator in the consensus protocol
priv_validator_file = "config/priv_validator.json"

# TCP or UNIX socket address for Tendermint to listen on for
# connections from an external PrivValidator process
priv_validator_laddr = ""

# Path to the JSON file containing the private key to use for node authentication in the p2p protocol
node_key_file = "config/node_key.json"

# Mechanism to connect to the ABCI application: socket | grpc
abci = "socket"

# TCP or UNIX socket address for the profiling server to listen on
prof_laddr = ""

# If true, query the ABCI app on connecting to a new peer
# so the app can decide if we should keep the connection or not
filter_peers = false

##### advanced configuration options #####

##### rpc server configuration options #####
[rpc]

# TCP or UNIX socket address for the RPC server to listen on
laddr = "tcp://0.0.0.0:26657"

# A list of origins a cross-domain request can be executed from
# Default value '[]' disables cors support
# Use '["*"]' to allow any origin
cors_allowed_origins = []

# A list of methods the client is allowed to use with cross-domain requests
cors_allowed_methods = ["HEAD", "GET", "POST"]

# A list of non simple headers the client is allowed to use with cross-domain requests
cors_allowed_headers = ["Origin", "Accept", "Content-Type", "X-Requested-With", "X-Server-Time"]

# TCP or UNIX socket address for the gRPC server to listen on
# NOTE: This server only supports /broadcast_tx_commit
grpc_laddr = ""

# Maximum number of simultaneous connections.
# Does not include RPC (HTTP&WebSocket) connections. See max_open_connections
# If you want to accept a larger number than the default, make sure
# you increase your OS limits.
# 0 - unlimited.
# Should be < {ulimit -Sn} - {MaxNumInboundPeers} - {MaxNumOutboundPeers} - {N of wal, db and other open files}
# 1024 - 40 - 10 - 50 = 924 = ~900
grpc_max_open_connections = 900

# Activate unsafe RPC commands like /dial_seeds and /unsafe_flush_mempool
unsafe = false

# Maximum number of simultaneous connections (including WebSocket).
# Does not include gRPC connections. See grpc_max_open_connections
# If you want to accept a larger number than the default, make sure
# you increase your OS limits.
# 0 - unlimited.
# Should be < {ulimit -Sn} - {MaxNumInboundPeers} - {MaxNumOutboundPeers} - {N of wal, db and other open files}
# 1024 - 40 - 10 - 50 = 924 = ~900
max_open_connections = 900

# Maximum number of unique clientIDs that can /subscribe
# If you're using /broadcast_tx_commit, set to the estimated maximum number
# of broadcast_tx_commit calls per block.
max_subscription_clients = 100

# Maximum number of unique queries a given client can /subscribe to
# If you're using GRPC (or Local RPC client) and /broadcast_tx_commit, set to
# the estimated # maximum number of broadcast_tx_commit calls per block.
max_subscriptions_per_client = 5

# How long to wait for a tx to be committed during /broadcast_tx_commit.
# WARNING: Using a value larger than 10s will result in increasing the
# global HTTP write timeout, which applies to all connections and endpoints.
# See https://github.com/tendermint/tendermint/issues/3435
timeout_broadcast_tx_commit = "10s"

# The name of a file containing certificate that is used to create the HTTPS server.
# If the certificate is signed by a certificate authority,
# the certFile should be the concatenation of the server's certificate, any intermediates,
# and the CA's certificate.
# NOTE: both tls_cert_file and tls_key_file must be present for Tendermint to create HTTPS server. Otherwise, HTTP server is run.
tls_cert_file = ""

# The name of a file containing matching private key that is used to create the HTTPS server.
# NOTE: both tls_cert_file and tls_key_file must be present for Tendermint to create HTTPS server. Otherwise, HTTP server is run.
tls_key_file = ""

##### peer to peer configuration options #####
[p2p]

# Address to listen for incoming connections
laddr = "tcp://0.0.0.0:26656"

# Address to advertise to peers for them to dial
# If empty, will use the same port as the laddr,
# and will introspect on the listener or use UPnP
# to figure out the address.
external_address = ""

# Comma separated list of seed nodes to connect to
seeds = ""

# Comma separated list of nodes to keep persistent connections to
persistent_peers = ""

# UPNP port forwarding
upnp = false

# Path to address book
addr_book_file = "config/addrbook.json"

# Set true for strict address routability rules
# Set false for private or local networks
addr_book_strict = true

# Maximum number of inbound peers
max_num_inbound_peers = 40

# Maximum number of outbound peers to connect to, excluding persistent peers
max_num_outbound_peers = 10

# Time to wait before flushing messages out on the connection
flush_throttle_timeout = "100ms"

# Maximum size of a message packet payload, in bytes
max_packet_msg_payload_size = 1024

# Rate at which packets can be sent, in bytes/second
send_rate = 5120000

# Rate at which packets can be received, in bytes/second
recv_rate = 5120000

# Set true to enable the peer-exchange reactor
pex = true

# Seed mode, in which node constantly crawls the network and looks for
# peers. If another node asks it for addresses, it responds and disconnects.
#
# Does not work if the peer-exchange reactor is disabled.
seed_mode = false

# Comma separated list of peer IDs to keep private (will not be gossiped to other peers)
private_peer_ids = ""

# Toggle to disable guard against peers connecting from the same ip.
allow_duplicate_ip = false

# Peer connection configuration.
handshake_timeout = "20s"
dial_timeout = "3s"

##### mempool configuration options #####
[mempool]

recheck = true
broadcast = true
wal_dir = ""

# Maximum number of transactions in the mempool
size = 5000

# Limit the total size of all txs in the mempool.
# This only accounts for raw transactions (e.g. given 1MB transactions and
# max_txs_bytes=5MB, mempool will only accept 5 transactions).
max_txs_bytes = 1073741824

# Size of the cache (used to filter transactions we saw earlier) in transactions
cache_size = 10000

##### consensus configuration options #####
[consensus]

wal_file = "data/cs.wal/wal"

timeout_propose = "3s"
timeout_propose_delta = "500ms"
timeout_prevote = "1s"
timeout_prevote_delta = "500ms"
timeout_precommit = "1s"
timeout_precommit_delta = "500ms"
timeout_commit = "1s"

# Make progress as soon as we have all the precommits (as if TimeoutCommit = 0)
skip_timeout_commit = false

# EmptyBlocks mode and possible interval between empty blocks
create_empty_blocks = true
create_empty_blocks_interval = "0s"

# Reactor sleep duration parameters
peer_gossip_sleep_duration = "100ms"
peer_query_maj23_sleep_duration = "2s"

# Block time parameters. Corresponds to the minimum time increment between consecutive blocks.
blocktime_iota = "1s"

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

##### instrumentation configuration options #####
[instrumentation]

# When true, Prometheus metrics are served under /metrics on
# PrometheusListenAddr.
# Check out the documentation for the list of available metrics.
prometheus = false

# Address to listen for Prometheus collector(s) connections
prometheus_listen_addr = ":26660"

# Maximum number of simultaneous connections.
# If you want to accept a larger number than the default, make sure
# you increase your OS limits.
# 0 - unlimited.
max_open_connections = 3

# Instrumentation namespace
namespace = "tendermint"
```

## 空块 VS 没有空块

**create_empty_blocks = true**

如果在你的配置中 `create_empty_blocks` 被设置为 `true`，

If `create_empty_blocks` is set to `true` in your config, 每隔大约一秒就会创建一个块(默认的共识参数)。您可以通过更改 `timeout_commit` 来调节块之间的延迟。如 `timeout_commit = "10s"` 应该导致大约每 10 秒一个块。

**create_empty_blocks = false**

在此设置中，在接收交易时创建块。

注意，在 H 块之后，Tendermint 创建了一个我们称为 H+1 “proof block”的东西(只有当应用程序哈希发生变化时) 。这样做的原因是为了支持证明。如果在块 H 中有一个交易将状态更改为 X，则新的应用程序哈希将只包含在块 H+1 中。如果提交交易后，你想要一个轻节点证明新状态(X)，为此，需要提交新块，因为新块具有状态 X 的新应用程序哈希。这就是为什么如果应用程序块哈希变化我们出一个新块(空的)。否则，就无法证明新状态。

另外，如果您将 `create_empty_blocks_interval` 设置为默认值(`0`)以外的值，Tendermint 将创建空块，即使在每个 `create_empty_blocks_interval` 都没有交易的情况下也是如此。例如，使用 `create_empty_blocks = false` 和 `create_empty_blocks_interval = "30s"`，Tendermint 只在有交易时创建块，或者在等待 30 秒后没有收到任何交易时创建块。

## 共识超时解释

关于[生产运行中](./running-in-production.html)的超时有很多信息。

您还可以在规范中找到更详细的技术解释：[拜占庭共识最新 gossip](https://arxiv.org/abs/1807.04938)。

```
[consensus]
...

timeout_propose = "3s"
timeout_propose_delta = "500ms"
timeout_prevote = "1s"
timeout_prevote_delta = "500ms"
timeout_precommit = "1s"
timeout_precommit_delta = "500ms"
timeout_commit = "1s"
```

注意，在成功的一个轮中，我们绝对等待的惟一超时是 `timeout_commit`。

以下是超时时间的简要总结:

- `timeout_propose` = 我们要等多久才会有提案被否决
- `timeout_propose_delta` = 每轮增加的 timeout_propose
- `timeout_prevote` = 在收到 +2/3 的预选后我们要等多久 (也就是说，没有一个快或者空)
- `timeout_prevote_delta` = 每轮增加的 timeout_prevote
- `timeout_precommit` = 在收到 +2/3 的预提交后我们要等多久 (也就是说，没有一个快或者空)
- `timeout_precommit_delta` = 每轮增加的 timeout_precommit
- `timeout_commit` = 提交一个块之后，在开始新的高度之前等待的时间(这给了我们一个机会来接收更多的预提交，即使我们已经有 +2/3)
