# Demo

## 说明

这个 demo 是在 [Rego 不好用？用 Pipy 实现 OPA](https://mp.weixin.qq.com/s/uZ_Q5Fn3XpfUEHBOFxWdvg) 的 helm chart 版本。使用 Pipy 来实现可信镜像仓库检查。

> 从互联网（或可信镜像仓库库以外的任何地方）拉取未知镜像会带来风险——例如恶意软件。但是还有其他很好的理由来维护单一的可信来源，例如在企业中实现可支持性。通过确保镜像仅来自受信任的镜像仓库，可以密切控制镜像库存，降低软件熵和蔓延的风险，并提高集群的整体安全性。除此以外，有时还会需要检查镜像的 tag，比如禁止使用 latest 镜像。

## 运行 

### 1. 准备工作
这里使用 pipy 模拟策略服务器，本仓库中提供了 arm64 平台的版本，其他平台前往 [Pipy Releasees](https://github.com/flomesh-io/pipy/releases) 下载。

截止目前当前最新版本是 `0.8.0-31`。

```shell
# 模拟策略服务器
$ pipy scripts/rule-server.js
```

### 2. 更新配置

1. 更新 `policy-as-code/values.yaml` 中的策略服务器 ip 地址
2. 更新镜像 tag，如果是在 arm64 平台上部署，请修改为对应的 arm64 版本。比如 `0.8.0-31-arm64`


### 3. 安装

执行 helm 命令，安装 webhook。

```shell
$ helm install policy-as-code ./policy-as-code -n default
$ kubectl get pod -n pipy
```

### 4. 测试

```shell
$ kubectl apply -f test/bad.yaml
Error from server (hello-world:linux repo not start with any repo [docker.io, k8s.gcr.io]): error when creating "test/bad.yaml": admission webhook "validating-webhook.pipy.flomesh-io.cn" denied the request: hello-world:linux repo not start with any repo [docker.io, k8s.gcr.io]
$ kubectl apply -f test/bad2.yaml
Error from server (docker.io/library/hello-world:latest tag end with :latest): error when creating "test/bad2.yaml": admission webhook "validating-webhook.pipy.flomesh-io.cn" denied the request: docker.io/library/hello-world:latest tag end with :latest

$ kubectl apply -f test/ok.yaml
pod/hello-world-success created
$ kubectl logs -n default hello-world-success
```

修改 `scripts/image.js` 的策略规则，可以实时（每 5s 检查一次更新）查看策略的效果。