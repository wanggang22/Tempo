---
name: tempo-parallel
description: Tempo 2D Nonce 并行交易（不同 nonce key 并发提交，~3 笔）
disable-model-invocation: true
---

# Tempo 2D Nonce 并行交易（~3 笔）

Tempo 独有的 2D Nonce：每个 nonce key 有独立的 nonce 计数器，不同 key 之间互不阻塞。

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.moderato.tempo.xyz"
PK="$CAST_PRIVATE_KEY"
W2="$W2_ADDRESS"
```

## 并行交易（3 笔，不同 nonce key）

```bash
# nonce key 1, nonce 0
cast send 0x20c0000000000000000000000000000000000000 "transfer(address,uint256)" $W2 10000000 \
  --rpc-url $RPC --private-key $PK --nonce 0 --tempo.nonce-key 1

# nonce key 2, nonce 0
cast send 0x20c0000000000000000000000000000000000001 "transfer(address,uint256)" $W2 10000000 \
  --rpc-url $RPC --private-key $PK --nonce 0 --tempo.nonce-key 2

# nonce key 3, nonce 0
cast send 0x20c0000000000000000000000000000000000002 "transfer(address,uint256)" $W2 10000000 \
  --rpc-url $RPC --private-key $PK --nonce 0 --tempo.nonce-key 3
```

## 说明
- `--tempo.nonce-key <N>`: 指定 nonce 空间
- `--nonce 0`: 该 nonce 空间的序号（新空间从 0 开始）
- 不同 nonce key 的交易可并行提交，无需等前一笔确认
- 默认 nonce key = 0（即普通交易使用的 nonce 空间）
