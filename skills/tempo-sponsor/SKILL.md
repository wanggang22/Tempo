---
name: tempo-sponsor
description: Tempo Gas 代付（第三方代付 Gas 费，~1 笔）
disable-model-invocation: true
---

# Tempo Gas 代付（~1 笔）

W2 发起交易，Cast 代付 Gas 费用。3 步流程。

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.moderato.tempo.xyz"
PK="$CAST_PRIVATE_KEY"        # 代付方
W2_PK="$W2_PRIVATE_KEY"       # 发起方
SELF="$CAST_ADDRESS"
ALPHAUSD="0x20c0000000000000000000000000000000000001"
```

## 步骤

### Step 1: W2 构建交易获取 sponsor hash
```bash
FEE_HASH=$(cast mktx $ALPHAUSD "transfer(address,uint256)" $SELF 10000000 \
  --private-key $W2_PK --tempo.print-sponsor-hash --rpc-url $RPC)
echo "Sponsor hash: $FEE_HASH"
```

### Step 2: Cast 用私钥签名 hash（注意：不需要 --rpc-url）
```bash
SPONSOR_SIG=$(cast wallet sign --private-key $PK "$FEE_HASH" --no-hash)
echo "Sponsor sig: $SPONSOR_SIG"
```

### Step 3: W2 发送交易附带 sponsor 签名
```bash
cast send $ALPHAUSD "transfer(address,uint256)" $SELF 10000000 \
  --private-key $W2_PK \
  --tempo.sponsor-signature "$SPONSOR_SIG" \
  --rpc-url $RPC
```

## 注意事项
- `cast wallet sign` 不接受 `--rpc-url` 参数
- `--no-hash` 表示签名时不再 hash（sponsor hash 已经是 hash 过的）
- Gas 费从代付方（Cast）的代币余额扣除
- 可通过 Fee Sponsor 服务 `https://sponsor.moderato.tempo.xyz` 实现远程代付
