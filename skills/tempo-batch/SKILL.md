---
name: tempo-batch
description: Tempo 批量交易（多个 call 一笔 tx 原子执行，~3 笔）
disable-model-invocation: true
---

# Tempo 批量交易（~3 笔）

使用 `cast batch-send` 将多个合约调用打包成一笔 Tempo Transaction（type 0x77）原子执行。

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.moderato.tempo.xyz"
PK="$CAST_PRIVATE_KEY"
W2="$W2_ADDRESS"
DEX="0xdec0000000000000000000000000000000000000"
```

## 语法

```bash
cast batch-send \
  --call "<合约>::<函数签名>:<参数1>,<参数2>" \
  --call "<合约>::<函数签名>:<参数1>,<参数2>" \
  --rpc-url $RPC --private-key $PK
```

## 批量交易命令（3 笔 tx，内含 7 个 call）

### 1. 批量转 3 种代币（1 笔 tx = 3 个 transfer）
```bash
cast batch-send \
  --call "0x20c0000000000000000000000000000000000000::transfer(address,uint256):$W2,10000000" \
  --call "0x20c0000000000000000000000000000000000001::transfer(address,uint256):$W2,10000000" \
  --call "0x20c0000000000000000000000000000000000002::transfer(address,uint256):$W2,10000000" \
  --rpc-url $RPC --private-key $PK
```

### 2. 批量 approve + swap（1 笔 tx = 授权 + 兑换）
```bash
cast batch-send \
  --call "0x20c0000000000000000000000000000000000000::approve(address,uint256):$DEX,100000000" \
  --call "$DEX::swapExactAmountIn(address,address,uint128,uint128):0x20c0000000000000000000000000000000000000,0x20c0000000000000000000000000000000000001,100000000,0" \
  --rpc-url $RPC --private-key $PK
```

### 3. 批量带 Memo 转账（1 笔 tx = 2 个 memo transfer）
```bash
cast batch-send \
  --call "0x20c0000000000000000000000000000000000000::transferWithMemo(address,uint256,bytes32):$W2,10000000,0x5041592d30303100000000000000000000000000000000000000000000000000" \
  --call "0x20c0000000000000000000000000000000000001::transferWithMemo(address,uint256,bytes32):$W2,10000000,0x5041592d30303200000000000000000000000000000000000000000000000000" \
  --rpc-url $RPC --private-key $PK
```
