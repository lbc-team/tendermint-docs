# 安装Tendermint

## 使用二进制安装

要下载预编译二进制文件，请参见[发布页](https://github.com/tendermint/tendermint/releases)。

## 从源码安装

您需要安装`go`并配置相关环境变量。以下指令可以完成配置：

```bash
echo export GOPATH=\"\$HOME/go\" >> ~/.bash_profile
echo export PATH=\"\$PATH:\$GOPATH/bin\" >> ~/.bash_profile
echo export GO111MODULE=on >> ~/.bash_profile
```

### 获取源码

```
mkdir -p $GOPATH/src/github.com/tendermint
cd $GOPATH/src/github.com/tendermint
git clone https://github.com/tendermint/tendermint.git
cd tendermint
```

### 安装工具及依赖

```
make tools
```

### 编译

执行

```
make install
```

将二进制文件生成并安装到`$GOPATH/bin`，或执行

```
make build
```

将二进制文件生成并存入`./build`。

_声明_ 以上Tendermint的二进制文件是在没有DWARF符号表的情况下生成/安装的。如果要使用DWARF符号和调试信息生成/安装tendermint，请打开makefile文件，删除`build_FLAGS`中的`-s -w`。

现在安装了最新的Tendermint，您可以通过运行以下命令进行验证：

```
tendermint version
```

## 运行

要使用进程内应用程序启动单节点区块链，请执行以下操作：

```
tendermint init
tendermint node --proxy_app=kvstore
```

## 重新安装

如果您已经安装了Tendermint，并且进行了更新，只需执行

```
cd $GOPATH/src/github.com/tendermint/tendermint
make install
```

若要升级程序，只需执行

```
cd $GOPATH/src/github.com/tendermint/tendermint
git pull origin master
make install
```

## 编译CLevelDB支持

首先安装[LevelDB](https://github.com/google/leveldb) (最低支持版本为1.7)。

也可以选择快速安装LevelDB(可选方式). 以下为Ubuntu指令:

```
sudo apt-get update
sudo apt install build-essential

sudo apt-get install libsnappy-dev

wget https://github.com/google/leveldb/archive/v1.20.tar.gz && \
  tar -zxvf v1.20.tar.gz && \
  cd leveldb-1.20/ && \
  make && \
  sudo cp -r out-static/lib* out-shared/lib* /usr/local/lib/ && \
  cd include/ && \
  sudo cp -r leveldb /usr/local/include/ && \
  sudo ldconfig && \
  rm -f v1.20.tar.gz
```

然后，修改配置文件中数据库后端为`cleveldb`:

```
# config/config.toml
db_backend = "cleveldb"
```

执行

```
CGO_LDFLAGS="-lsnappy" make install_c
```

可安装Tendermint，

执行

```
CGO_LDFLAGS="-lsnappy" make build_c
```

可生成文件到`./build`
