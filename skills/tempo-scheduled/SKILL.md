---
name: tempo-scheduled
description: Tempo 定时/限时交易（Expiring Nonce + 时间窗口，~2 笔）
disable-model-invocation: true
---

# Tempo 定时/限时交易（~2 笔）

Tempo 独有功能：交易可设置生效时间和过期时间。

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.moderato.tempo.xyz"
PK="$CAST_PRIVATE_KEY"
W2="$W2_ADDRESS"
```

## Expiring Nonce（限时交易，~1 笔）

使用 `--tempo.expiring-nonce` 让交易在超时后自动过期（最多 30 秒），无需手动跟踪 nonce。

```bash
cast send 0x20c0000000000000000000000000000000000000 "transfer(address,uint256)" $W2 10000000 \
  --rpc-url $RPC --private-key $PK \
  --tempo.expiring-nonce \
  --tempo.valid-before $(($(date +%s) + 25))
```

## 定时交易（~1 笔）

设置 `validAfter` + `validBefore` 时间窗口，交易只能在指定时间范围内执行。

```bash
NOW=$(date +%s)
cast send 0x20c0000000000000000000000000000000000001 "transfer(address,uint256)" $W2 10000000 \
  --rpc-url $RPC --private-key $PK \
  --tempo.expiring-nonce \
  --tempo.valid-after $((NOW + 2)) \
  --tempo.valid-before $((NOW + 30))
```

## CLI 标志参考

| 标志 | 说明 |
|------|------|
| `--tempo.expiring-nonce` | 启用限时 nonce（nonce key 自动设为 maxUint256） |
| `--tempo.valid-before <TS>` | 交易必须在此 Unix 时间戳前执行（最多当前时间 +30s） |
| `--tempo.valid-after <TS>` | 交易只能在此 Unix 时间戳后执行 |
