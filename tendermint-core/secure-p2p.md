# 安全 P2P

Tendermint p2p协议使用基于 [Station-to-Station protocol](https://en.wikipedia.org/wiki/Station-to-Station_protocol) 的经过身份验证的加密方案。

每个节点生成一个 ED25519 密钥对作为持久（长期） id 使用。

当两个节点建立 TCP 连接时，它们首先各自生成用于此会话一个临时的 X25519 密钥对，并相互发送各自的临时公钥。这是显而易见的。

然后他们各自计算共享密钥， 就像[迪菲·赫尔曼钥匙交换](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange)。
这个共享密钥用作加密算法的对称密钥。

然后，我们运行 [hkdf-sha256](https://en.wikipedia.org/wiki/HKDF) 去扩展共享密钥以生成发送数据的对称密钥，接受数据的的对称密钥，认证另一方的挑战。
一个节点将使用他们发送密钥发送数据，另外一个节点将使用他们自己的接受密钥解码数据。
我们必须确保双方不要试图使用相同的密钥作为发送密钥，也不要使用相同的密钥作为接收密钥，因为在这种情况下什么都不能解码。
为了确保这一点，具有标准较小的临时公钥的节点使用第一个密钥作为接收密钥，第二个密钥作为发送密钥。
如果节点具有标准较大的临时公钥，则执行相反的操作。

每个节点还保留一个接收的消息计数器和一个发送的消息计数器，两者都初始化为零。
所有将来的通信都使用 chacha20poly1305 加密。
chacha20poly1305 的 nonce 是相关的消息计数器。
每次发送消息和每次接收正确解码的消息时，都要增加消息计数器，这一点非常重要。

现在，每个节点都使用它们的持久私钥签名挑战，并向另一个节点发送一个 AuthSigMsg，其中包含它们的持久公钥和签名。当接收到 AuthSigMsg 时，节点验证签名。

这两个节点是现在已经过身份验证的。

通信保持完美的正向保密，因为持久密钥对不是用来生成秘密的，而是用于身份验证。

## 警告

如果不预先知道远程节点的持久公钥，则该系统仍然容易受到中间人攻击。缓解这种情况的唯一方法是使用公钥身份验证系统，例如可信 Web 或证书颁发机构。在本例中，我们可以使用区块链本身作为证书颁发机构，以确保至少连接到一个验证者。

## 配置

默认情况下启用经过身份验证的加密。

## 规格

完整的p2p规范可以在[这里](https://github.com/tendermint/tendermint/tree/master/docs/spec/p2p)找到。

## 补充阅读

- [实现](https://github.com/tendermint/tendermint/blob/64bae01d007b5bee0d0827ab53259ffd5910b4e6/p2p/conn/secret_connection.go#L47)
- [Original STS paper by Whitfield Diffie, Paul C. van Oorschot and
  Michael J.
  Wiener](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.216.6107&rep=rep1&type=pdf)
- [进一步研究秘密握手](https://dominictarr.github.io/secret-handshake-paper/shs.pdf)
