---
name: tempo-dex
description: Tempo DEX 稳定币兑换（4 种代币循环 Swap，~8 笔）
disable-model-invocation: true
---

# Tempo DEX 稳定币兑换（~8 笔）

DEX 地址：`0xdec0000000000000000000000000000000000000`

流程：获取报价 → Approve → Swap，4 种稳定币循环兑换。

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.moderato.tempo.xyz"
PK="$CAST_PRIVATE_KEY"
DEX="0xdec0000000000000000000000000000000000000"
```

## 报价查询（只读）

```bash
cast call $DEX "quoteSwapExactAmountIn(address,address,uint128)(uint128)" <tokenIn> <tokenOut> <amount> --rpc-url $RPC
```

## 兑换命令（8 笔：4 approve + 4 swap）

### pathUSD → AlphaUSD
```bash
cast send 0x20c0000000000000000000000000000000000000 "approve(address,uint256)" $DEX 100000000 --rpc-url $RPC --private-key $PK
cast send $DEX "swapExactAmountIn(address,address,uint128,uint128)" 0x20c0000000000000000000000000000000000000 0x20c0000000000000000000000000000000000001 100000000 0 --rpc-url $RPC --private-key $PK
```

### AlphaUSD → BetaUSD
```bash
cast send 0x20c0000000000000000000000000000000000001 "approve(address,uint256)" $DEX 100000000 --rpc-url $RPC --private-key $PK
cast send $DEX "swapExactAmountIn(address,address,uint128,uint128)" 0x20c0000000000000000000000000000000000001 0x20c0000000000000000000000000000000000002 100000000 0 --rpc-url $RPC --private-key $PK
```

### BetaUSD → ThetaUSD
```bash
cast send 0x20c0000000000000000000000000000000000002 "approve(address,uint256)" $DEX 100000000 --rpc-url $RPC --private-key $PK
cast send $DEX "swapExactAmountIn(address,address,uint128,uint128)" 0x20c0000000000000000000000000000000000002 0x20c0000000000000000000000000000000000003 100000000 0 --rpc-url $RPC --private-key $PK
```

### ThetaUSD → pathUSD（回到起点）
```bash
cast send 0x20c0000000000000000000000000000000000003 "approve(address,uint256)" $DEX 100000000 --rpc-url $RPC --private-key $PK
cast send $DEX "swapExactAmountIn(address,address,uint128,uint128)" 0x20c0000000000000000000000000000000000003 0x20c0000000000000000000000000000000000000 100000000 0 --rpc-url $RPC --private-key $PK
```

## DEX 接口参考

| 函数 | 说明 |
|------|------|
| `swapExactAmountIn(tokenIn, tokenOut, amountIn, minAmountOut)` | 卖出固定数量 |
| `swapExactAmountOut(tokenIn, tokenOut, amountOut, maxAmountIn)` | 买入固定数量 |
| `quoteSwapExactAmountIn(tokenIn, tokenOut, amountIn)` | 卖出报价（只读） |
| `quoteSwapExactAmountOut(tokenIn, tokenOut, amountOut)` | 买入报价（只读） |
| `balanceOf(user, token)` | DEX 内部余额 |
