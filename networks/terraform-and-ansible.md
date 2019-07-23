# Terraform & Ansible

自动化部署使用 [Terraform](https://www.terraform.io/) 在 Digital Ocean 上创建服务器，然后 [Ansible](http://www.ansible.com/) 在这些服务器上创建和管理测试网络。

## 安装

注意：请参阅[集成 bash 脚本](https://github.com/tendermint/tendermint/blob/develop/networks/remote/integration.sh)，它可以在一个新的 DO 液滴上运行，并将自动启动一个 4 节点的测试网络。脚本或多或少完成了下面描述的所有工作。

- 在 Linux 机器上安装 [Terraform](https://www.terraform.io/downloads.html) 和 [Ansible](http://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)。
- 创建一个带读写能力的 [DigitalOcean API token](https://cloud.digitalocean.com/settings/api/tokens)。
- 安装 python dopy 包 (`pip install dopy`)
- 创建 SSH 密钥 (`ssh-keygen`)
- 设置环境变量：

```
export DO_API_TOKEN="abcdef01234567890abcdef01234567890"
export SSH_KEY_FILE="$HOME/.ssh/id_rsa.pub"
```

这些将被用于 `terraform` 和 `ansible`。

## Terraform

这一步将创建四个 Digital Ocean droplets。首先，转到正确的目录：

```
cd $GOPATH/src/github.com/tendermint/tendermint/networks/remote/terraform
```

然后：

```
terraform init
terraform apply -var DO_API_TOKEN="$DO_API_TOKEN" -var SSH_KEY_FILE="$SSH_KEY_FILE"
```

你会得到一个属于你 droplets 的 IP 地址列表。

创建并运行 droplets 之后，让我们设置 Ansible。

## Ansible

[ansible 目录](https://github.com/tendermint/tendermint/tree/master/networks/remote/ansible)中的剧本运行 ansible 角色来配置哨兵节点体系结构。要运行 ansible，必须切换到这个目录(`cd $GOPATH/src/github.com/tendermint/tendermint/networks/remote/ansible`)。

有几个角色不言自明：

首先，我们通过指定 tendermint(`BINARY`) 和节点文件(`CONFIGDIR`)的路径来配置 droplets。后者期望任意数量的目录名为 `node0, node1, ...` 以此类推(等于产生的 droplets 数量)。对于这个示例，我们使用[这个目录](https://github.com/tendermint/tendermint/tree/master/docs/examples)中预先创建的文件。要创建自己的文件，可以使用 `tendermint testnet` 命令或查看[手动部署](./deploy-testnets.md)。

下面是运行的命令：

```
ansible-playbook -i inventory/digital_ocean.py -l sentrynet config.yml -e BINARY=$GOPATH/src/github.com/tendermint/tendermint/build/tendermint -e CONFIGDIR=$GOPATH/src/github.com/tendermint/tendermint/docs/examples
```

瞧！您的所有 droplets 现在都具有 `tendermint` 二进制文件，并且运行测试网络需要配置文件。 

接下来，我们运行安装角色：

```
ansible-playbook -i inventory/digital_ocean.py -l sentrynet install.yml
```

如下所示，在所有 droplets 上执行 `tendermint node --proxy_app=kvstore`。虽然我们很快将修改这个角色并再次运行它，但是第一次执行允许我们获得每个 `node_info.id` 对应于每个 `node_info.listen_addr`。(这部分将在未来实现自动化)。在您的浏览器中(或者使用 curl)，对于每一个 droplets，转到 IP:26657/status 并注意刚才提到的两个字段 `node_info`。注意，没有创建块(`latest_block_height` 应该为零，并且没有增加)。

接下来,打开 `roles/install/templates/systemd.service.j2`，然后查找 `ExecStart`  行，它应该类似于:

```
ExecStart=/usr/bin/tendermint node --proxy_app=kvstore
```

然后添加 `--p2p.persistent_peers` 的标志，其中包含每个节点的相关信息。结果文件应该类似于:

```
[Unit]
Description={{service}}
Requires=network-online.target
After=network-online.target

[Service]
Restart=on-failure
User={{service}}
Group={{service}}
PermissionsStartOnly=true
ExecStart=/usr/bin/tendermint node --proxy_app=kvstore --p2p.persistent_peers=167b80242c300bf0ccfb3ced3dec60dc2a81776e@165.227.41.206:26656,3c7a5920811550c04bf7a0b2f1e02ab52317b5e6@165.227.43.146:26656,303a1a4312c30525c99ba66522dd81cca56a361a@159.89.115.32:26656,b686c2a7f4b1b46dca96af3a0f31a6a7beae0be4@159.89.119.125:26656
ExecReload=/bin/kill -HUP $MAINPID
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
```

然后，停止节点：

```
ansible-playbook -i inventory/digital_ocean.py -l sentrynet stop.yml
```

最后，我们再次运行安装角色：

```
ansible-playbook -i inventory/digital_ocean.py -l sentrynet install.yml
```

在所有 droplets 上带新标志重新运行 `tendermint node`。`latest_block_hash` 现在应该在更改，`latest_block_height` 应该在增加。您的测试网络现在已经启动并运行了 :)

查看带有状态角色的日志：

```
ansible-playbook -i inventory/digital_ocean.py -l sentrynet status.yml
```

## 日志

最简单的方法是上面描述的状态角色。您还可以将日志发送到 Logz.io，一个弹性堆栈(弹性搜索、Logstash 和 Kibana)服务提供商。您可以将节点设置为自动登录。创建一个帐户并从[此页](https://app.logz.io/#/dashboard/data-sources/Filebeat)上的注释获取 API 密钥，然后：

```
yum install systemd-devel || echo "This will only work on RHEL-based systems."
apt-get install libsystemd-dev || echo "This will only work on Debian-based systems."

go get github.com/mheese/journalbeat
ansible-playbook -i inventory/digital_ocean.py -l sentrynet logzio.yml -e LOGZIO_TOKEN=ABCDEFGHIJKLMNOPQRSTUVWXYZ012345
```

## 清理

要清除 droplets，请运行：

```
terraform destroy -var DO_API_TOKEN="$DO_API_TOKEN" -var SSH_KEY_FILE="$SSH_KEY_FILE"
```
