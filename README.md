# Tendermint 


欢迎阅读 Tendermint Core文档!

Tendermint Core 是一个区块链应用平台; 相当于提供了区块链应用程序的 Web 服务器、数据库以及用来开发区块链应用的所需的库。

就像为 Web 服务器 服务  Web 应用程序一样, Tendermint 服务于区块链应用。

Tendermint Core 使用拜占庭容错(BFT)共识算法及基于确定性有限状态机的状态机复制 (SMR)。

有关更多背景,可以阅读 [什么是Tendermint](introduction/what-is-tendermint.md)


要快速使用一个例子应用入门，可以阅读 [快速入门指南](introduction/quick-start.md)。

要了解 Tendermint 上开发应用程序，请可以阅读 [应用程序区块链接口](spec/abci/)。



有关使用 Tendermint 的更多详细信息,请参阅相关文档：[Tendermint Core](tendermint-core/), [benchmarking and monitoring](tools/), and [network deployments](networks/) 。


## 贡献

我们热情邀请热爱区块链技术的小伙伴一起参与贡献，让这份文档更完善。要全面了解一个技术最好的方式是把其文档编译一遍，一起来吧。

这份文档托管在 https://github.com/lbc-team/tendermint-docs ， 有兴趣参与的联系Tiny 熊（微信：xlbxiong），我邀请你加入到GitHub 群组。



### 本地编译

 文档使用Markdown 编写，使用[vuepress](https://vuepress.vuejs.org/zh/) 构建，先安装vuepress：

```
# from this directory
> npm install -g vuepress
```



下载文档，进行编译：

```
> git clone git@github.com:lbc-team/tendermint-docs.git
> cd tendermint-docs
打开 .vuepress/config.js 修改 base 值为： "/"
> vuepress build .
> cd dist/docs
> python -m SimpleHTTPServer 8080
```

在浏览器中 localhost:8080  查看文档。

## 

## 版本

中文版本基于 0.3.2 版本翻译
