---
name: tempo-setup
description: Tempo Testnet 环境搭建（Foundry + 钱包 + Faucet）
disable-model-invocation: true
---

# Tempo Testnet 环境搭建

## 1. 安装 Tempo 版 Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup -n tempo
forge -V  # 应看到 -tempo 后缀
```

每次新终端需要：`export PATH="$HOME/.foundry/bin:$PATH"`

## 2. 钱包配置

在 `.env` 中配置两个钱包：

| 钱包 | 环境变量 | 用途 |
|------|----------|------|
| Cast (主) | `CAST_PRIVATE_KEY` / `CAST_ADDRESS` | 主交互钱包 |
| W2 (副) | `W2_PRIVATE_KEY` / `W2_ADDRESS` | 转账/代付测试 |

## 3. Faucet 领水

每次领 4 种代币各 1M（6 位小数）：

```bash
export PATH="$HOME/.foundry/bin:$PATH"
cast rpc tempo_fundAddress <ADDRESS> --rpc-url https://rpc.moderato.tempo.xyz
```

或 cURL：
```bash
curl -X POST https://docs.tempo.xyz/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "<ADDRESS>"}'
```

## 4. 验证连接

```bash
cast block-number --rpc-url https://rpc.moderato.tempo.xyz
cast call 0x20c0000000000000000000000000000000000000 "balanceOf(address)(uint256)" <ADDRESS> --rpc-url https://rpc.moderato.tempo.xyz
```

## 网络信息

- Chain ID: 42431
- RPC: `https://rpc.moderato.tempo.xyz`
- WebSocket: `wss://rpc.moderato.tempo.xyz`
- 区块浏览器: `https://explore.tempo.xyz`
