---
name: tempo-interactions
description: Tempo TIP-20 基础交互（转账、Memo、Approve、Fee Token）
disable-model-invocation: true
---

# Tempo TIP-20 基础交互（~8 笔）

从 `D:/wwwwwwwwwwwww/Tempo/.env` 读取配置。

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.moderato.tempo.xyz"
PK="$CAST_PRIVATE_KEY"
SELF="$CAST_ADDRESS"
W2="$W2_ADDRESS"
W2_PK="$W2_PRIVATE_KEY"
```

## 代币地址

| 代币 | 地址 |
|------|------|
| pathUSD | `0x20c0000000000000000000000000000000000000` |
| AlphaUSD | `0x20c0000000000000000000000000000000000001` |
| BetaUSD | `0x20c0000000000000000000000000000000000002` |
| ThetaUSD | `0x20c0000000000000000000000000000000000003` |

## 交互命令（8 笔）

### 普通转账（2 笔）
```bash
cast send 0x20c0000000000000000000000000000000000000 "transfer(address,uint256)" $W2 100000000 --rpc-url $RPC --private-key $PK
cast send 0x20c0000000000000000000000000000000000001 "transfer(address,uint256)" $W2 100000000 --rpc-url $RPC --private-key $PK
```

### 带 Memo 转账（2 笔）
```bash
# Memo: INV-001 (hex padded to 32 bytes)
cast send 0x20c0000000000000000000000000000000000000 "transferWithMemo(address,uint256,bytes32)" $W2 10000000 0x494e562d30303100000000000000000000000000000000000000000000000000 --rpc-url $RPC --private-key $PK

# Memo: ORD-002
cast send 0x20c0000000000000000000000000000000000001 "transferWithMemo(address,uint256,bytes32)" $W2 10000000 0x4f52442d30303200000000000000000000000000000000000000000000000000 --rpc-url $RPC --private-key $PK
```

### Approve（1 笔）
```bash
cast send 0x20c0000000000000000000000000000000000000 "approve(address,uint256)" $W2 1000000000 --rpc-url $RPC --private-key $PK
```

### 指定 Fee Token 转账（1 笔）
```bash
# 用 BetaUSD 付 Gas 转 pathUSD
cast send 0x20c0000000000000000000000000000000000000 "transfer(address,uint256)" $W2 10000000 --rpc-url $RPC --private-key $PK --tempo.fee-token 0x20c0000000000000000000000000000000000002
```

### W2 回转（2 笔）
```bash
cast send 0x20c0000000000000000000000000000000000000 "transfer(address,uint256)" $SELF 50000000 --rpc-url $RPC --private-key $W2_PK
cast send 0x20c0000000000000000000000000000000000001 "transfer(address,uint256)" $SELF 50000000 --rpc-url $RPC --private-key $W2_PK
```
