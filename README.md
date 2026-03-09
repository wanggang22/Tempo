# Tempo 项目

## 工作流程
1. **拉取技术文档** ✅ - 获取 Tempo 官方技术文档
2. **保存为 MD** ✅ - 整理保存为 Markdown 文档
3. **开发链上交互 Skills** ✅ - 基于技术文档开发自动化脚本（26 笔 tx，全部通过）

## 项目结构
- `tempo-cheatsheet.md` - 速查手册（网络配置、合约地址、SDK 用法、CLI 命令）
- `tempo-docs-repo/` - 完整文档源码（克隆自 github.com/tempoxyz/docs）
- `tempo-auto/tempo-auto.mjs` - 全流程自动交互脚本（7 Phase，26 笔 tx）
- `.env` - 钱包配置（私钥、RPC、代币地址）

## Skills（9 个）
| Skill | 说明 | 交易数 |
|-------|------|--------|
| tempo-setup | 环境搭建（Foundry + 钱包 + Faucet） | 0 |
| tempo-interactions | TIP-20 转账、Memo、Approve、Fee Token | ~8 |
| tempo-dex | DEX 4 种稳定币循环 Swap | ~8 |
| tempo-token-create | TIP-20 Factory 创建代币 | ~1 |
| tempo-batch | 批量交易（多 call 原子执行） | ~3 |
| tempo-sponsor | Gas 代付（第三方代付） | ~1 |
| tempo-parallel | 2D Nonce 并行交易 | ~3 |
| tempo-scheduled | 定时/限时交易 | ~2 |
| tempo-full | 全流程编排 | ~26 |

## 注意事项
- Foundry 已切换为 Tempo 版（`foundryup -n tempo`，v1.6.0-nightly-tempo）
- 每次新终端：`export PATH="$HOME/.foundry/bin:$PATH"`
- 工作目录：项目根目录
