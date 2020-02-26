module.exports = {
  title: "Tendermint 中文文档",
  description: " Tendermint Core 开发手册",
  ga: "",
  dest: "./dist/docs",
  base: "/docs/tendermint/",
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    repo: "lbc-team/tendermint-docs",
    editLinks: true,
    docsDir: "docs",
    docsBranch: "lbc",
    editLinkText: '帮助完善文档',
    lastUpdated: true,
    algolia: {
      apiKey: '59f0e2deb984aa9cdf2b3a5fd24ac501',
      indexName: 'tendermint',
      debug: false
    },
    nav: [
      { text: "首页", link: "https://learnblockchain.cn" },
      { text: "区块链文档中心", link: "https://learnblockchain.cn/site/docs/" },
      { text: "En", link: "https://tendermint.com/docs/" },
      { text: "RPC", link: "https://tendermint.com/rpc/" }
    ],
    sidebar: [
      {
        title: "Tendermint 概述",
        collapsable: false,
        children: [
          "/introduction/quick-start",
          "/introduction/install",
          "/introduction/what-is-tendermint",
          "/introduction/architecture"
        ]
      },
      {
        title: "应用开发",
        collapsable: false,
        children: [
          "/app-dev/getting-started",
          "/app-dev/abci-cli",
          "/app-dev/app-architecture",
          "/app-dev/app-development",
          "/app-dev/subscribing-to-events-via-websocket",
          "/app-dev/indexing-transactions",
          "/app-dev/abci-spec",
          "/app-dev/ecosystem"
        ]
      },
      {
        title: "Tendermint Core",
        collapsable: false,
        children: [
          "/tendermint-core/",
          "/tendermint-core/using-tendermint",
          "/tendermint-core/configuration",
          "/tendermint-core/rpc",
          "/tendermint-core/running-in-production",
          "/tendermint-core/fast-sync",
          "/tendermint-core/how-to-read-logs",
          "/tendermint-core/block-structure",
          "/tendermint-core/light-client-protocol",
          "/tendermint-core/metrics",
          "/tendermint-core/secure-p2p",
          "/tendermint-core/validators",
          "/tendermint-core/mempool"
        ]
      },
      {
        title: "网络",
        collapsable: false,
        children: [
          "/networks/",
          "/networks/docker-compose",
          "/networks/terraform-and-ansible",
        ]
      },
      {
        title: "工具",
        collapsable: false,
        children:  [
          "/tools/",
          "/tools/benchmarking",
          "/tools/monitoring",
          "/tools/remote-signer-validation"
        ]
      },
      {
        title: "Tendermint 规范",
        collapsable: true,
        children: [
          "/spec/",
          "/spec/blockchain/blockchain",
          "/spec/blockchain/encoding",
          "/spec/blockchain/state",
          "/spec/software/abci",
          "/spec/consensus/bft-time",
          "/spec/consensus/consensus",
          "/spec/consensus/light-client",
          "/spec/software/wal",
          "/spec/p2p/config",
          "/spec/p2p/connection",
          "/spec/p2p/node",
          "/spec/p2p/peer",
          "/spec/reactors/block_sync/reactor",
          "/spec/reactors/block_sync/impl",
          "/spec/reactors/consensus/consensus",
          "/spec/reactors/consensus/consensus-reactor",
          "/spec/reactors/consensus/proposer-selection",
          "/spec/reactors/evidence/reactor",
          "/spec/reactors/mempool/concurrency",
          "/spec/reactors/mempool/config",
          "/spec/reactors/mempool/functionality",
          "/spec/reactors/mempool/messages",
          "/spec/reactors/mempool/reactor",
          "/spec/reactors/pex/pex",
          "/spec/reactors/pex/reactor",
	]
      },
      {
        title: "ABCI 规范",
        collapsable: false,
        children: [
          "/spec/abci/",
          "/spec/abci/abci",
          "/spec/abci/apps",
          "/spec/abci/client-server"
        ]
      }
    ]
  }
};
