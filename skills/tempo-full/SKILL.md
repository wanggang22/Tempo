---
name: tempo-full
description: Tempo Testnet 全流程自动交互（7 Phase，~26 笔 tx）
disable-model-invocation: true
---

# Tempo Testnet 全流程自动交互

一键运行脚本，执行 7 个 Phase，约 26 笔链上交易。

## 运行

```bash
cd tempo-auto
export PATH="$HOME/.foundry/bin:$PATH"
node tempo-auto.mjs
```

## 7 Phase 说明

| Phase | 内容 | 交易数 |
|-------|------|--------|
| 1. TIP-20 基础交互 | 转账、Memo 转账、Approve、Fee Token 选择、W2 回转 | 8 |
| 2. DEX 稳定币兑换 | 4 对循环 Swap（pathUSD→Alpha→Beta→Theta→pathUSD） | 8 |
| 3. 创建 TIP-20 代币 | 通过 Factory 创建自定义代币 | 1 |
| 4. 批量交易 | batch-send 多 call 原子执行 | 3 |
| 5. Gas 代付 | W2 交易 + Cast 代付 Gas | 1 |
| 6. 2D Nonce 并行 | 不同 nonce key 并发提交 | 3 |
| 7. 定时/限时交易 | Expiring nonce + 时间窗口 | 2 |
| **总计** | | **26** |

## 前置条件

1. Tempo Foundry 已安装：`foundryup -n tempo`
2. `.env` 配置在项目根目录
3. 两个钱包已有代币余额（通过 Faucet 领取）

## 钱包信息

在 `.env` 中配置 `CAST_PRIVATE_KEY`/`CAST_ADDRESS` 和 `W2_PRIVATE_KEY`/`W2_ADDRESS`。

## 脚本位置

`tempo-auto/tempo-auto.mjs`

## 涵盖的 Tempo 独有特性

- TIP-20 transferWithMemo（支付备注）
- Fee Token 选择（用任意 USD 代币付 Gas）
- 协议级 DEX 兑换
- TIP-20 Factory 发币
- Batch Transaction（type 0x77 批量调用）
- Gas Sponsorship（第三方代付）
- 2D Nonce（并行交易）
- Expiring Nonce（限时交易）
- Scheduled Transaction（定时交易）
