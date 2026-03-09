# Tempo Testnet 速查手册

> 完整文档源码：`tempo-docs-repo/src/pages/`
> 官方文档：https://docs.tempo.xyz/
> GitHub: https://github.com/tempoxyz

---

## 1. 网络连接

| 属性 | 值 |
|------|-----|
| 网络名称 | Tempo Testnet (Moderato) |
| Chain ID | `42431` |
| 货币 | `USD` |
| HTTP RPC | `https://rpc.moderato.tempo.xyz` |
| WebSocket | `wss://rpc.moderato.tempo.xyz` |
| 区块浏览器 | https://explore.tempo.xyz |
| 合约验证 | `https://contracts.tempo.xyz` |
| Fee Sponsor 服务 | `https://sponsor.moderato.tempo.xyz` |
| Token List API | `https://tokenlist.tempo.xyz/list/42431` |

**快速检测连接：**
```bash
cast block-number --rpc-url https://rpc.moderato.tempo.xyz
```

---

## 2. 预部署合约地址

### 系统合约

| 合约 | 地址 | 用途 |
|------|------|------|
| TIP-20 Factory | `0x20fc000000000000000000000000000000000000` | 创建 TIP-20 代币 |
| Fee Manager | `0xfeec000000000000000000000000000000000000` | 费用支付和转换 |
| Stablecoin DEX | `0xdec0000000000000000000000000000000000000` | 稳定币兑换 |
| TIP-403 Registry | `0x403c000000000000000000000000000000000000` | 转账策略注册 |
| Account Keychain | `0xAAAAAAAA00000000000000000000000000000000` | Access Key 管理 |

### 测试网代币

| 代币 | 地址 | Faucet 数量 |
|------|------|-------------|
| pathUSD | `0x20c0000000000000000000000000000000000000` | 1M |
| AlphaUSD | `0x20c0000000000000000000000000000000000001` | 1M |
| BetaUSD | `0x20c0000000000000000000000000000000000002` | 1M |
| ThetaUSD | `0x20c0000000000000000000000000000000000003` | 1M |

### 标准工具合约

| 合约 | 地址 |
|------|------|
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| CreateX | `0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed` |
| Permit2 | `0x000000000022d473030f116ddee9f6b43ac78ba3` |
| Create2 Factory | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |

---

## 3. Faucet（领测试币）

**方式一：cURL**
```bash
curl -X POST https://docs.tempo.xyz/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "<YOUR_ADDRESS>"}'
```

**方式二：Cast RPC**
```bash
cast rpc tempo_fundAddress <YOUR_ADDRESS> \
  --rpc-url https://rpc.moderato.tempo.xyz
```

每次领取 4 种代币各 1M。

---

## 4. EVM 差异（关键）

### 无原生 Gas 代币
- Tempo 没有 ETH 等原生代币，Gas 用 USD 稳定币支付
- `eth_getBalance` 返回一个极大的占位值
- `BALANCE` / `SELFBALANCE` 操作码始终返回 0
- `CALLVALUE` 始终返回 0
- 代币余额用 TIP-20 的 `balanceOf` 查询

### Gas 费用选择逻辑
1. Tempo Transaction 可通过 `fee_token` 字段指定任意 TIP-20 代币
2. 调用 TIP-20 合约方法时，默认用该代币本身付 Gas
3. 调用非 TIP-20 合约时，默认用 pathUSD 付 Gas
4. 可设置账户级别的默认 fee token

### 状态创建成本（比以太坊高很多）

| 操作 | Tempo | Ethereum |
|------|-------|----------|
| 新存储槽 (SSTORE 0→非0) | 250,000 gas | 20,000 gas |
| 账户创建 | 250,000 gas | 0 gas |
| 合约创建每字节 | 1,000 gas | 200 gas |
| 交易 Gas 上限 | 30M | 30M |

转账到新地址约需 ~300k gas，合约部署成本比以太坊高 5-10 倍。

### 共识
- Simplex BFT 共识，确定性终局
- 出块时间 ~0.5 秒
- EVM 目标硬分叉：Osaka

---

## 5. Tempo Transaction 类型（强烈推荐）

Tempo Transaction 是专有的 EIP-2718 交易类型（type `0x77`），**强烈建议使用，替代普通 EVM 交易**。

### RLP 结构
```
rlp([
  chain_id, max_priority_fee_per_gas, max_fee_per_gas, gas,
  calls,                  // Vec<Call> - 支持批量调用
  access_list,
  nonce_key,              // 2D nonce key（并行交易）
  nonce,
  valid_before,           // 交易过期时间戳
  valid_after,            // 交易生效时间戳
  fee_token,              // 任意 TIP-20 代币付 Gas
  fee_payer_signature,    // 代付签名
  authorization_list,     // EIP-7702 授权
  key_authorization,      // Access Key 授权
  signature,
])
```

### 核心能力一览

| 能力 | 说明 | SDK 参数 |
|------|------|----------|
| 可选 Fee Token | 用任意 USD 稳定币付 Gas | `feeToken: '0x...'` |
| Gas 代付 | 第三方代付 Gas 费 | `feePayer: account` 或 `feePayer: true` |
| 批量调用 | 多个 call 原子执行 | `calls: [{to, data}, ...]` |
| 2D Nonce | 不同 nonce key 并行提交 | `nonceKey: 1n` |
| Expiring Nonce | 自动过期，无需跟踪 nonce | `nonceKey: maxUint256, validBefore: ts` |
| 定时交易 | 设置生效/过期时间窗口 | `validAfter: ts, validBefore: ts` |
| Access Key | 委托签名给子密钥 | `keyAuthorization: ...` |
| Passkey 签名 | WebAuthn/P256 签名 | `webAuthn()` connector |

### 多语言 SDK 支持

| 语言 | 包 | 集成时间 |
|------|-----|---------|
| TypeScript | `viem/tempo` + `wagmi/tempo` | < 1 小时 |
| Rust | `tempo-alloy` (Alloy crate) | < 1 小时 |
| Go | `github.com/tempoxyz/tempo-go` | < 1 小时 |
| Python | `pytempo` | < 1 小时 |
| Solidity | Foundry (`foundryup -n tempo`) | < 1 小时 |

---

## 6. TIP-20 代币标准

TIP-20 是 Tempo 原生代币标准，所有稳定币都用它。比 ERC-20 多了：

### 支付特性
- **Gas 支付**：只有 TIP-20 代币能付 Gas（必须是 USD 计价）
- **支付通道**：TIP-20 转账有专用区块空间，不与其他交易竞争
- **Transfer Memo**：转账可附 32 字节 memo（发票号、订单号等）
- **奖励分配**：内置 reward distribution 系统

### 合规特性
- **RBAC 角色**：
  - `ISSUER_ROLE` - 铸造/销毁权限
  - `PAUSE_ROLE` / `UNPAUSE_ROLE` - 暂停/恢复转账
  - `BURN_BLOCKED_ROLE` - 销毁被封锁地址的代币
- **TIP-403 策略**：白名单/黑名单控制谁能转账
- **Supply Cap**：可设最大供应量
- **Currency 声明**：ISO 4217 货币代码（如 "USD"），**创建后不可更改**

### 创建代币
通过 TIP-20 Factory (`0x20fc...`) 的 `createToken(name, symbol, currency)` 函数创建。

```ts
// TypeScript
const result = await client.token.createSync({
  name: 'myUSD',
  symbol: 'MUSD',
  currency: 'USD',  // 必须是 "USD" 才能用于付 Gas
})
```

---

## 7. Foundry 工具链（cast/forge）

### 安装 Tempo 分叉版 Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup -n tempo
forge -V  # 应看到 -tempo 后缀
```

### 创建项目
```bash
forge init -n tempo my-project && cd my-project
```

### 常用 cast 命令
```bash
export TEMPO_RPC_URL=https://rpc.moderato.tempo.xyz

# 创建钱包 & 领水
cast wallet new
cast rpc tempo_fundAddress <ADDR> --rpc-url $TEMPO_RPC_URL

# 查余额
cast erc20 balance <TOKEN_ADDR> <WALLET_ADDR> --rpc-url $TEMPO_RPC_URL

# 转账
cast erc20 transfer <TOKEN_ADDR> <TO_ADDR> <AMOUNT> \
  --rpc-url $TEMPO_RPC_URL --interactive

# 指定 fee token 转账
cast erc20 transfer <TOKEN_ADDR> <TO_ADDR> <AMOUNT> \
  --tempo.fee-token <FEE_TOKEN_ADDR> \
  --rpc-url $TEMPO_RPC_URL --interactive

# 调用合约
cast call <CONTRACT> "functionName()" --rpc-url $TEMPO_RPC_URL
cast send <CONTRACT> "functionName()" --rpc-url $TEMPO_RPC_URL --interactive

# 批量交易
cast batch-send \
  --call "<CONTRACT>::increment()" \
  --call "<CONTRACT>::setNumber(uint256):500" \
  --rpc-url $TEMPO_RPC_URL --private-key $PK

# 并行交易（2D nonce）
cast send <CONTRACT> 'increment()' \
  --rpc-url $TEMPO_RPC_URL --private-key $PK \
  --nonce 0 --tempo.nonce-key 1

# 限时交易（expiring nonce, max 30s）
cast send <CONTRACT> 'increment()' \
  --rpc-url $TEMPO_RPC_URL --private-key $PK \
  --tempo.expiring-nonce --tempo.valid-before $(($(date +%s) + 25))

# Gas 代付（sponsored）
FEE_HASH=$(cast mktx <CONTRACT> 'increment()' --rpc-url $TEMPO_RPC_URL --private-key $SENDER_KEY --tempo.print-sponsor-hash)
SPONSOR_SIG=$(cast wallet sign --private-key $SPONSOR_KEY "$FEE_HASH" --no-hash)
cast send <CONTRACT> 'increment()' --rpc-url $TEMPO_RPC_URL --private-key $SENDER_KEY --tempo.sponsor-signature "$SPONSOR_SIG"
```

### 部署合约
```bash
forge create src/MyContract.sol:MyContract \
  --rpc-url $TEMPO_RPC_URL \
  --interactive --broadcast --verify \
  --constructor-args 0x20c0000000000000000000000000000000000001
```

### 本地 Anvil 测试
```bash
anvil --tempo --hardfork t1
anvil --tempo --fork-url $TEMPO_RPC_URL
```

### Tempo 专用 CLI 标志

| 标志 | 说明 |
|------|------|
| `--tempo.fee-token <ADDR>` | 指定 Gas 支付代币 |
| `--tempo.nonce-key <KEY>` | 2D nonce key（并行交易） |
| `--tempo.expiring-nonce` | 启用限时 nonce |
| `--tempo.valid-before <TS>` | 交易必须在此时间戳前执行 |
| `--tempo.valid-after <TS>` | 交易只能在此时间戳后执行 |
| `--tempo.sponsor-signature <SIG>` | 代付签名 |
| `--tempo.print-sponsor-hash` | 打印代付哈希 |

---

## 8. TypeScript SDK（Viem + Wagmi）

SDK 已上游化到 Viem 和 Wagmi：
- `viem@2.43.0+` → `import { ... } from 'viem/tempo'`
- `wagmi@3.2.0+` → `import { Hooks } from 'wagmi/tempo'`

### Viem 客户端设置
```ts
import { createClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { tempoModerato } from 'viem/chains'

const client = createClient({
  chain: tempoModerato,
  transport: http(),
  account: privateKeyToAccount('0x...'),
})
```

### 合约 ABI
```ts
import { Abis } from 'viem/tempo'
// Abis.tip20, Abis.tip20Factory, Abis.stablecoinDex, Abis.feeManager, Abis.feeAmm
```

### 转账
```ts
import { parseUnits } from 'viem'

const { receipt } = await client.token.transferSync({
  amount: parseUnits('100', 6),
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbb',
  token: '0x20c0000000000000000000000000000000000001', // AlphaUSD
})
```

### 带 Memo 转账
```ts
import { parseUnits, stringToHex, pad } from 'viem'

const { receipt } = await client.token.transferSync({
  amount: parseUnits('100', 6),
  to: '0x742d35Cc...',
  token: '0x20c0000000000000000000000000000000000001',
  memo: pad(stringToHex('INV-12345'), { size: 32 }),
})
```

### 指定 Fee Token
```ts
const { receipt } = await client.token.transferSync({
  amount: parseUnits('100', 6),
  to: '0x...',
  token: '0x20c0000000000000000000000000000000000001', // AlphaUSD
  feeToken: '0x20c0000000000000000000000000000000000002', // BetaUSD 付 Gas
})
```

### 代付 Gas（本地账户模式）
```ts
import { privateKeyToAccount } from 'viem/accounts'

const { receipt } = await client.token.transferSync({
  amount: parseUnits('10.5', 6),
  to: '0x...',
  token: '0x20c0000000000000000000000000000000000000',
  feePayer: privateKeyToAccount('0x...sponsor_key...'),
})
```

### 批量交易
```ts
import { encodeFunctionData, parseUnits } from 'viem'
import { Abis } from 'viem/tempo'

const calls = [
  {
    to: '0x20c0000000000000000000000000000000000001',
    data: encodeFunctionData({
      abi: Abis.tip20,
      functionName: 'transfer',
      args: [recipient1, parseUnits('100', 6)],
    }),
  },
  {
    to: '0x20c0000000000000000000000000000000000001',
    data: encodeFunctionData({
      abi: Abis.tip20,
      functionName: 'transfer',
      args: [recipient2, parseUnits('50', 6)],
    }),
  },
]
const hash = await client.sendTransaction({ calls })
```

---

## 9. Rust SDK（Alloy）

```rust
use alloy::{primitives::{address, U256}, providers::ProviderBuilder};
use tempo_alloy::{TempoNetwork, contracts::precompiles::ITIP20};

let provider = ProviderBuilder::new_with_network::<TempoNetwork>()
    .connect("https://rpc.moderato.tempo.xyz").await?;

let token = ITIP20::new(
    address!("0x20c0000000000000000000000000000000000001"),
    &provider,
);

// 转账
let receipt = token
    .transfer(address!("0x742d35Cc..."), U256::from(100_000_000))
    .send().await?
    .get_receipt().await?;

// 带 Memo 转账
let receipt = token
    .transferWithMemo(
        address!("0x742d35Cc..."),
        U256::from(100_000_000),
        B256::left_padding_from("INV-12345".as_bytes()),
    )
    .send().await?
    .get_receipt().await?;
```

---

## 10. Go SDK

```bash
go get github.com/tempoxyz/tempo-go@v0.1.0  # 需要 Go 1.21+
```

```go
import (
    "github.com/tempoxyz/tempo-go/pkg/client"
    "github.com/tempoxyz/tempo-go/pkg/signer"
    "github.com/tempoxyz/tempo-go/pkg/transaction"
)

// 连接
c := client.New("https://rpc.moderato.tempo.xyz")

// 创建签名者
s, _ := signer.NewSigner("0xPRIVATE_KEY")

// 构建交易
tx := transaction.NewBuilder(big.NewInt(42431)).
    SetNonce(nonce).
    SetGas(100000).
    SetMaxFeePerGas(big.NewInt(20000000000)).
    SetMaxPriorityFeePerGas(big.NewInt(1000000000)).
    AddCall(recipient, big.NewInt(0), transferData).  // 支持多个 AddCall（批量）
    Build()

transaction.SignTransaction(tx, s)
serialized, _ := transaction.Serialize(tx, nil)
hash, _ := c.SendRawTransaction(ctx, serialized)

// 并行交易
tx1 := transaction.NewBuilder(...).SetNonceKey(big.NewInt(1)).Build()
tx2 := transaction.NewBuilder(...).SetNonceKey(big.NewInt(2)).Build()

// 代付
tx := transaction.NewBuilder(...).SetSponsored(true).Build()
transaction.SignTransaction(tx, userSigner)
transaction.AddFeePayerSignature(tx, feePayerSigner)

// 定时交易
tx := transaction.NewBuilder(...).
    SetValidAfter(uint64(now.Unix())).
    SetValidBefore(uint64(now.Add(1*time.Hour).Unix())).Build()
```

### Python SDK
```bash
pip install pytempo  # github.com/tempoxyz/pytempo
```

---

## 11. Solidity 接口

### TIP-20 代币接口
```solidity
interface ITIP20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferWithMemo(address to, uint256 amount, bytes32 memo) external;
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}
```

### 创建代币（通过 Factory）
通过 TIP-20 Factory (`0x20fc...`) 创建，需指定 name、symbol、currency（推荐 "USD"）。

---

## 12. DEX 兑换

DEX 地址：`0xdec0000000000000000000000000000000000000`

**流程：** 获取报价 → 计算滑点 → 授权 DEX 花费 → 执行 swap

Wagmi Hooks:
- `Hooks.dex.useBuyQuote({ tokenIn, tokenOut, amountOut })` - 买入报价
- `Hooks.dex.useSellQuote({ tokenIn, tokenOut, amountIn })` - 卖出报价
- `Actions.dex.buy.call({ amountOut, maxAmountIn, tokenIn, tokenOut })` - 买入
- `Actions.dex.sell.call({ amountIn, minAmountOut, tokenIn, tokenOut })` - 卖出

授权 + 兑换可用批量交易一次完成。

---

## 13. 关键特性速览

| 特性 | 说明 |
|------|------|
| 专用支付通道 | 支付有独立区块空间，不与其他交易竞争 |
| 稳定币原生 Gas | 直接用 USD 稳定币付 Gas，无波动性代币 |
| 内置 DEX | 协议级稳定币兑换 |
| 支付 Memo | 转账可附带 32 字节 memo（发票号等） |
| 批量交易 | 多个调用打包成一笔交易，原子执行 |
| Gas 代付 | 应用可为用户代付 Gas，实现无感交易 |
| 2D Nonce | 支持并行交易提交 |
| 限时交易 | 可设置交易过期时间（max 30s） |
| Access Keys | 授权子密钥，支持消费限额和过期 |
| Passkey 认证 | WebAuthn/P256 签名，无助记词 |
| 定时交易 | 预签名交易定时执行 |

---

## 14. Developer Tools 生态

### 数据 & 分析
| 工具 | 说明 | 链接 |
|------|------|------|
| Allium | 企业级链上数据平台，有 Tempo SQL 查询模板 | [docs](https://docs.allium.so/) / [recipe](https://github.com/Allium-Science/allium-recipes/tree/main/tempo) |
| Artemis | 稳定币 & 链上活动分析终端 | [Tempo 页面](https://app.artemisanalytics.com/asset/tempo_moderato) |
| Chainlink | 预言机 + CCIP 跨链 + Data Streams | [docs](https://docs.chain.link/) / [Tempo 合约](https://explore.tempo.xyz/address/0x72790f9eB82db492a7DDb6d2af22A270Dcc3Db64?tab=contract) |
| Goldsky | Subgraph 索引 + Mirror 数据管道 | [Tempo 页面](https://goldsky.com/chains/tempo) |
| Range | 跨链稳定币浏览器 | [Tempo 浏览器](https://explorer.money/transactions?dn=tempo-testnet) |

### 区块浏览器
| 工具 | 链接 |
|------|------|
| Tempo Explorer（官方） | https://explore.tempo.xyz |
| Tenderly（调试/模拟） | https://dashboard.tenderly.co |

### 嵌入式钱包
| 工具 | 特点 |
|------|------|
| Blockradar | 非托管钱包 + 支付基础设施，面向金融科技 |
| Crossmint | 全栈平台：钱包/稳定币编排/checkout/代币化 |
| Dynamic | 认证 + 智能钱包 + 密钥管理 SDK |
| Para | MPC 钱包 + 认证套件 |
| Privy | 嵌入式钱包，支持 Gas 代付/Passkey。[Tempo 示例](https://github.com/privy-io/examples/tree/main/examples/privy-next-tempo) |
| thirdweb | 全栈开发平台。[Tempo 页面](https://thirdweb.com/tempo-testnet) |
| Turnkey | 可编程密钥管理。[Tempo 示例](https://github.com/tkhq/sdk/tree/main/examples/with-tempo) |
| Utila | MPC 钱包 + 多链资产管理 |

### 智能合约库
| 工具 | 说明 |
|------|------|
| Safe | 模块化智能账户框架（即将支持） |
| ZeroDev | 智能账户平台，支持 ERC-4337 和 EIP-7702 |

### 节点 RPC 服务商
| 服务商 | 入口 |
|--------|------|
| Alchemy | [dashboard](https://dashboard.alchemy.com) |
| Blockdaemon | [dashboard](https://app.blockdaemon.com/) |
| Chainstack | [console](https://console.chainstack.com) |
| Conduit | [Tempo RPC](https://hub.conduit.xyz/tempo-testnet) |
| dRPC | [Tempo 页面](https://drpc.org/chainlist/tempo-testnet-rpc) |
| Quicknode | [Tempo 页面](https://www.quicknode.com/chains/tempo) |

### 安全 & 合规
| 工具 | 说明 |
|------|------|
| Blockaid | 实时交易扫描和威胁检测 |
| Chainalysis (Hexagate) | 链上监控、异常检测、合规 |

### 稳定币发行
| 工具 | 说明 |
|------|------|
| Brale | 稳定币发行/转移/管理基础设施，API 支持铸造、赎回、跨链 |

---

## 15. 文档目录索引

完整文档在 `tempo-docs-repo/src/pages/` 下，主要目录：

| 路径 | 内容 |
|------|------|
| `learn/` | Tempo 概览、稳定币基础、用例（跨境支付、薪资等） |
| `quickstart/` | 连接、Faucet、EVM 兼容性、开发工具 |
| `protocol/blockspace/` | 共识、区块结构、支付通道 |
| `protocol/exchange/` | DEX 规范（订单簿、兑换、流动性） |
| `protocol/fees/` | 费用系统、Fee AMM |
| `protocol/tip20/` | TIP-20 代币标准 |
| `protocol/tip403/` | 转账策略注册 |
| `protocol/transactions/` | 交易格式、Access Keys、EIP-4337/7702 |
| `protocol/tips/` | 改进提案 TIP-1000~1017 |
| `sdk/` | TypeScript、Rust、Go、Foundry SDK |
| `guide/issuance/` | 创建/管理/铸造稳定币 |
| `guide/payments/` | 支付、代付、Memo、并行交易 |
| `guide/stablecoin-dex/` | DEX 兑换、流动性、订单簿 |
| `guide/use-accounts/` | 账户管理、钱包连接、Passkey、批量交易 |
| `guide/node/` | 节点安装、验证者运营、系统要求 |
