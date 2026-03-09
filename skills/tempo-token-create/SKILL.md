---
name: tempo-token-create
description: Tempo TIP-20 Factory 创建自定义代币（~1 笔）
disable-model-invocation: true
---

# 创建 TIP-20 代币（~1 笔）

通过 TIP-20 Factory 创建自定义稳定币。

Factory 地址：`0x20fc000000000000000000000000000000000000`

## 函数签名

```solidity
function createToken(
    string name,       // 代币名称
    string symbol,     // 代币符号
    string currency,   // ISO 4217 货币代码，创建后不可更改。"USD" 才能用于付 Gas
    address quoteToken, // 报价代币（用于 DEX 定价），推荐 pathUSD
    address admin,     // 管理员地址（获得 DEFAULT_ADMIN_ROLE）
    bytes32 salt       // 唯一盐值（用于确定性地址推导）
) external returns (address token);
```

## 执行命令

```bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://rpc.moderato.tempo.xyz"
PK="$CAST_PRIVATE_KEY"
SELF="$CAST_ADDRESS"
FACTORY="0x20fc000000000000000000000000000000000000"
PATHUSD="0x20c0000000000000000000000000000000000000"

# 生成随机 salt（用时间戳）
SALT="0x$(printf '%064x' $(date +%s%N))"

cast send $FACTORY "createToken(string,string,string,address,address,bytes32)" \
  "TestUSD" "TUSD" "USD" $PATHUSD $SELF $SALT \
  --rpc-url $RPC --private-key $PK
```

## 创建后

- 代币默认：`transferPolicyId = 1`（允许所有）、`supplyCap = uint128 max`、`paused = false`
- 管理员获得 `DEFAULT_ADMIN_ROLE`，可分配 `ISSUER_ROLE`（铸造/销毁）等
- 只有 currency="USD" 的代币能用于付 Gas
- 地址确定性推导：`TIP20_PREFIX || keccak256(sender, salt)` 的高 64 位
