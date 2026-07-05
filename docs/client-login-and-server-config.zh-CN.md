# 客户端登录、MUST_LOGIN 与服务器配置排障指南

本文面向 RustDesk full-s6 / Web Admin 部署的管理员，用于配置客户端登录、启用 `MUST_LOGIN` 前检查，以及排查 API Server、ID Server、Relay Server、Key 配置错误。

> 示例中的域名和地址请替换为你的实际部署值。不要把私钥、JWT Key、管理员密码或未打码截图提交到公开仓库。

## 1. 关键概念

### API Server

客户端账号登录、WebAuth 浏览器授权、设备上报和审计日志上报依赖 API Server。API Server 配错时，客户端可能看不到 `webauth` 登录入口，或者登录时报 DNS、连接、解析响应失败。

### ID Server

ID Server 是 RustDesk rendezvous / hbbs 地址。账号登录可以成功并不代表 ID Server 正确；ID Server 配错时，设备可能显示离线，连接阶段会失败。

### Relay Server

Relay Server 是 hbbr 地址。注意：只把客户端本地 Relay Server 字段填错，不一定能制造 relay 失败。hbbs 在协商过程中可以返回服务端配置的 relay 地址，因此客户端仍可能走正确 hbbr 并连接成功。

### Key

Key 必须与服务端公钥匹配。Key 错误通常表现为 public key / rendezvous key 握手失败。

### MUST_LOGIN

`MUST_LOGIN` 要求客户端连接时携带有效登录 token。当前 Web Admin 的“要求客户端登录”通过 hbbs 运行时命令 `must-login` / `ml` 生效：

- 查询：`ml`
- 开启：`ml Y`
- 关闭：`ml N`

这是运行时状态。容器或 hbbs 重启后，会回到环境变量 `MUST_LOGIN` 的默认值。不要把它误解为数据库持久设置。

## 2. 启用 MUST_LOGIN 前检查清单

启用前建议按顺序完成：

1. 在 Web Admin 的“个人信息 / 服务器连接凭据”复制客户端导入配置。
2. 确认客户端中的 API Server、ID Server、Relay Server、Key 与当前部署一致。
3. 在 RustDesk 客户端账号页确认能看到 `webauth` 登录入口。
4. 点击 `webauth`，在浏览器中完成 Web Admin 登录和授权确认。
5. 确认客户端获得登录态。
6. 先用已登录客户端验证连接成功。
7. 再用未登录客户端验证连接会被拒绝。
8. 最后再在生产环境开启 `MUST_LOGIN`。

## 3. 已验证行为

当前实测链路的结论：

| 场景 | 客户端表现 | 说明 |
| --- | --- | --- |
| `MUST_LOGIN=Y` + 未登录客户端 | `LOGIN_REQUIRED` | hbbs 拒绝缺少有效登录 token 的连接。 |
| `MUST_LOGIN=Y` + 已登录客户端 | 连接成功 | WebAuth / 浏览器授权拿到的 token 可被 hbbs 接受。 |
| Key 错误 | invalid public key / public key 握手失败 | 服务端公钥不匹配。 |
| API Server 错误 | `webauth` 不出现，或登录 DNS/连接/解析响应失败 | 客户端登录和 API 发现阶段失败。 |
| ID Server 错误 | 账号登录可成功，但设备离线或连接到 ID Server 失败 | API 登录与 hbbs 发现/连接是两条链路。 |
| 只填错客户端 Relay Server | 可能仍然连接成功 | hbbs 可能在协商中返回服务端配置的正确 relay。 |

不同 RustDesk 客户端版本和路径可能显示为普通连接失败、`Broken pipe`、`Key mismatch` 或其他泛化错误。请结合 Web Admin、服务端日志和当前客户端版本判断。

## 4. 常见排障流程

### 客户端看不到 webauth 登录入口

优先检查：

1. API Server 地址是否正确；
2. API Server 是否能被客户端所在网络访问；
3. API 服务是否健康；
4. WebAuth / OIDC 入口是否在 `/api/login-options` 中返回。

### 客户端能登录，但设备离线或连接失败

优先检查：

1. ID Server 是否正确；
2. Key 是否正确；
3. hbbs 端口是否可达；
4. 客户端设备是否完成上报；
5. Web Admin 设备列表和连接日志是否有记录。

### 开启 MUST_LOGIN 后未登录客户端还能连接

优先确认：

1. Web Admin 中 `ml` 查询结果是否为 `MUST_LOGIN: true`；
2. 连接客户端是否已经通过账号登录；
3. hbbs 是否与 API 使用相同的 `RUSTDESK_API_JWT_KEY`；
4. 是否连接到了旧服务、旧容器或其他 hbbs 实例。

### 客户端 Relay Server 填错但仍能连接

这不一定是 bug。hbbs 可以在 `FetchLocalAddr`、`PunchHole`、`RelayResponse` 等协商消息里返回服务端配置的 relay。如果要验证真实 relay 失败，不要只改客户端字段，应使用隔离环境：

1. 在隔离 full-s6 栈中把 hbbs 的 relay 配置指向错误 hbbr；或
2. 阻断客户端到真实 hbbr 的连接；或
3. 强制 relay 后停止/阻断隔离环境中的 hbbr；并
4. 同时检查 hbbr 日志是否出现 `New relay request`、`got paired`、`Relay of ... closed`。

不要在共享测试机或生产机上随意修改服务端 relay 配置，除非已有备份和回滚窗口。

## 5. 管理建议

- Web Admin 面板只保留当前状态、关键风险提示和文档入口；完整操作说明以本文档为准。
- 不要因为单次测试成功就把默认值改为 `MUST_LOGIN=Y`。默认值和持久化策略应单独设计。
- 调整 `MUST_LOGIN` 后，记录当前运行时状态，并在共享测试环境中按约定恢复。
- 对外截图和文档应打码域名、IP、Key、token、密码和个人账号信息。
