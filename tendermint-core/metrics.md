# 指标

Tendermint 可以报告和提供普罗米修斯指标，而普罗米修斯指标反过来也可以被普罗米修斯收集器消耗。

默认情况下禁用此功能。

要启用普罗米修斯指标，请设置你的配置文件 `instrumentation.prometheus=true` 。默认情况下，指标将在 26660 端口的 `/metrics` 下提供。
监听地址可以在配置文件中更改（参见 `instrumentation.prometheus\_listen\_addr`）。

## 可用指标列表

以下指标是可用的：

| **名称**                                | **类型**  | **来自** | **标签** | **描述**                                                 |
|-----------------------------------------|-----------|-----------|----------|-----------------------------------------------------------------|
| consensus\_height                       | Gauge     | 0.21.0    |          | 链高                                             |
| consensus\_validators                   | Gauge     | 0.21.0    |          | 验证人数量                                            |
| consensus\_validators\_power            | Gauge     | 0.21.0    |          | 所有验证人总投票权                            |
| consensus\_missing\_validators          | Gauge     | 0.21.0    |          | 没有签名验证人数量                           |
| consensus\_missing\_validators\_power   | Gauge     | 0.21.0    |          | 丢失验证人总投票权                    |
| consensus\_byzantine\_validators        | Gauge     | 0.21.0    |          | 尝试双重签名的验证人数量                   |
| consensus\_byzantine\_validators\_power | Gauge     | 0.21.0    |          | 拜占庭验证人总投票权                  |
| consensus\_block\_interval\_seconds     | Histogram | 0.21.0    |          | 从这个块到最后一个块（Block.Header.Time）之间的时间(以秒为单位) |
| consensus\_rounds                       | Gauge     | 0.21.0    |          | 回合数                                                |
| consensus\_num\_txs                     | Gauge     | 0.21.0    |          | 交易数                                          |
| consensus\_block\_parts                 | counter   | on dev    | peer\_id | 节点块部件传输数量                        |
| consensus\_latest\_block\_height        | gauge     | on dev    |          | /status sync\_info 数量                                      |
| consensus\_fast\_syncing                | gauge     | on dev    |          | 0(不快速同步)或1(同步)                     |
| consensus\_total\_txs                   | Gauge     | 0.21.0    |          | 提交的交易总数                          |
| consensus\_block\_size\_bytes           | Gauge     | 0.21.0    |          | 以字节为单位的块大小                                             |
| p2p\_peers                              | Gauge     | 0.21.0    |          | 连接到的节点数量                             |
| p2p\_peer\_receive\_bytes\_total        | counter   | on dev    | peer\_id | 从给定节点接收的字节数                      |
| p2p\_peer\_send\_bytes\_total           | counter   | on dev    | peer\_id | 发送给给定节点的字节数                            |
| p2p\_peer\_pending\_send\_bytes         | gauge     | on dev    | peer\_id | 要发送给给定节点未决字节数              |
| p2p\_num\_txs                           | gauge     | on dev    | peer\_id | 每个 peer\_id 提交的交易数              |
| p2p\_pending\_send\_bytes               | gauge     | on dev    | peer\_id | 等待发送给节点的数据量                       |
| mempool\_size                           | Gauge     | 0.21.0    |          | 未提交交易数量                              |
| mempool\_tx\_size\_bytes                | histogram | on dev    |          | 交易大小(以字节为单位)                                      |
| mempool\_failed\_txs                    | counter   | on dev    |          | 失败的交易数量                                   |
| mempool\_recheck\_times                 | counter   | on dev    |          | 在内存池中重新检查的交易数                 |
| state\_block\_processing\_time          | histogram | on dev    |          | 以毫秒为单位的开始块和结束块之间的时间                      |

## 有用的查询

丢失 + 拜占庭验证人的百分比：

```
((consensus\_byzantine\_validators\_power + consensus\_missing\_validators\_power) / consensus\_validators\_power) * 100
```
