import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ============ 加载配置 ============
const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const content = readFileSync(join(__dirname, '..', '.env'), 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const E = loadEnv();
const CAST = `${process.env.HOME || process.env.USERPROFILE}/.foundry/bin/cast`;
const RPC = E.TEMPO_RPC;
const PK = E.CAST_PRIVATE_KEY;
const SELF = E.CAST_ADDRESS;
const W2 = E.W2_ADDRESS;
const W2_PK = E.W2_PRIVATE_KEY;

const PATHUSD  = E.PATHUSD;
const ALPHAUSD = E.ALPHAUSD;
const BETAUSD  = E.BETAUSD;
const THETAUSD = E.THETAUSD;
const DEX      = E.DEX;
const FACTORY  = E.TIP20_FACTORY;

const AMT_100  = '100000000';   // 100 tokens (6 decimals)
const AMT_10   = '10000000';    // 10 tokens
const AMT_1000 = '1000000000';  // 1000 tokens

// ============ 工具函数 ============
function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cast(args, { noRpc = false, timeout = 60000 } = {}) {
  const rpcPart = noRpc ? '' : ` --rpc-url ${RPC}`;
  const cmd = `"${CAST}" ${args}${rpcPart}`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', timeout }).trim();
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stderr || e.message).trim() };
  }
}

function sendTx(to, sig, args, extra = '') {
  const argsStr = args ? ` ${args}` : '';
  return cast(`send ${to} "${sig}"${argsStr} --private-key ${PK} ${extra}`);
}

function sendTxW2(to, sig, args, extra = '') {
  const argsStr = args ? ` ${args}` : '';
  return cast(`send ${to} "${sig}"${argsStr} --private-key ${W2_PK} ${extra}`);
}

function callView(to, sig, args) {
  const argsStr = args ? ` ${args}` : '';
  return cast(`call ${to} "${sig}"${argsStr}`);
}

function runTask(name, fn) {
  log(`  ${name}...`);
  const r = fn();
  if (r.ok) {
    log(`    ✅ 成功: ${r.out.slice(0, 66)}`);
  } else {
    log(`    ❌ 失败: ${r.out.slice(0, 120)}`);
  }
  return r;
}

// ============ Phase 1: TIP-20 基础交互 ============
async function phase1_transfers() {
  log('========== Phase 1: TIP-20 基础交互 ==========');
  let ok = 0, fail = 0;
  const track = (name, fn) => { runTask(name, fn).ok ? ok++ : fail++; };

  // 1. pathUSD 转账到 W2
  track('Transfer 100 pathUSD → W2', () =>
    sendTx(PATHUSD, 'transfer(address,uint256)', `${W2} ${AMT_100}`));
  await sleep(2000);

  // 2. AlphaUSD 转账到 W2
  track('Transfer 100 AlphaUSD → W2', () =>
    sendTx(ALPHAUSD, 'transfer(address,uint256)', `${W2} ${AMT_100}`));
  await sleep(2000);

  // 3. pathUSD 带 Memo 转账（发票号）
  track('Transfer 10 pathUSD → W2 (memo: INV-001)', () =>
    sendTx(PATHUSD, 'transferWithMemo(address,uint256,bytes32)',
      `${W2} ${AMT_10} 0x494e562d30303100000000000000000000000000000000000000000000000000`));
  await sleep(2000);

  // 4. AlphaUSD 带 Memo 转账（订单号）
  track('Transfer 10 AlphaUSD → W2 (memo: ORD-002)', () =>
    sendTx(ALPHAUSD, 'transferWithMemo(address,uint256,bytes32)',
      `${W2} ${AMT_10} 0x4f52442d30303200000000000000000000000000000000000000000000000000`));
  await sleep(2000);

  // 5. Approve W2 花费 pathUSD
  track('Approve W2 spend 1000 pathUSD', () =>
    sendTx(PATHUSD, 'approve(address,uint256)', `${W2} ${AMT_1000}`));
  await sleep(2000);

  // 6. 用 BetaUSD 付 Gas 转 pathUSD（fee token 选择）
  track('Transfer 10 pathUSD → W2 (fee: BetaUSD)', () =>
    sendTx(PATHUSD, 'transfer(address,uint256)', `${W2} ${AMT_10}`,
      `--tempo.fee-token ${BETAUSD}`));
  await sleep(2000);

  // 7. W2 转回 pathUSD 给 Cast
  track('W2 Transfer 50 pathUSD → Cast', () =>
    sendTxW2(PATHUSD, 'transfer(address,uint256)', `${SELF} 50000000`));
  await sleep(2000);

  // 8. W2 转回 AlphaUSD 给 Cast
  track('W2 Transfer 50 AlphaUSD → Cast', () =>
    sendTxW2(ALPHAUSD, 'transfer(address,uint256)', `${SELF} 50000000`));
  await sleep(2000);

  log(`  Phase 1 完成: ✅${ok} ❌${fail}`);
  return { ok, fail };
}

// ============ Phase 2: DEX 稳定币兑换 ============
async function phase2_dex() {
  log('========== Phase 2: DEX 稳定币兑换 ==========');
  let ok = 0, fail = 0;
  const track = (name, fn) => { runTask(name, fn).ok ? ok++ : fail++; };

  const swapPairs = [
    [PATHUSD,  ALPHAUSD, 'pathUSD',  'AlphaUSD'],
    [ALPHAUSD, BETAUSD,  'AlphaUSD', 'BetaUSD'],
    [BETAUSD,  THETAUSD, 'BetaUSD',  'ThetaUSD'],
    [THETAUSD, PATHUSD,  'ThetaUSD', 'pathUSD'],
  ];

  for (const [tokenIn, tokenOut, nameIn, nameOut] of swapPairs) {
    // 获取报价
    log(`  Quote: ${nameIn} → ${nameOut}...`);
    const quote = callView(DEX,
      'quoteSwapExactAmountIn(address,address,uint128)(uint128)',
      `${tokenIn} ${tokenOut} ${AMT_100}`);
    if (quote.ok) log(`    报价: ${quote.out}`);

    // Approve
    track(`Approve DEX spend 100 ${nameIn}`, () =>
      sendTx(tokenIn, 'approve(address,uint256)', `${DEX} ${AMT_100}`));
    await sleep(2000);

    // Swap
    track(`Swap 100 ${nameIn} → ${nameOut}`, () =>
      sendTx(DEX, 'swapExactAmountIn(address,address,uint128,uint128)',
        `${tokenIn} ${tokenOut} ${AMT_100} 0`));
    await sleep(3000);
  }

  log(`  Phase 2 完成: ✅${ok} ❌${fail}`);
  return { ok, fail };
}

// ============ Phase 3: 创建自定义 TIP-20 代币 ============
async function phase3_createToken() {
  log('========== Phase 3: 创建 TIP-20 代币 ==========');
  let ok = 0, fail = 0;
  const track = (name, fn) => { runTask(name, fn).ok ? ok++ : fail++; };

  // createToken(name, symbol, currency, quoteToken, admin, salt)
  const salt = '0x' + Date.now().toString(16).padStart(64, '0');
  track('Create TIP-20: TestUSD (TUSD)', () =>
    sendTx(FACTORY,
      'createToken(string,string,string,address,address,bytes32)',
      `"TestUSD" "TUSD" "USD" ${PATHUSD} ${SELF} ${salt}`));

  log(`  Phase 3 完成: ✅${ok} ❌${fail}`);
  return { ok, fail };
}

// ============ Phase 4: 批量交易 ============
async function phase4_batch() {
  log('========== Phase 4: 批量交易 (Batch) ==========');
  let ok = 0, fail = 0;
  const track = (name, fn) => { runTask(name, fn).ok ? ok++ : fail++; };

  // 批量转账：一笔 tx 同时转 3 种代币给 W2
  track('Batch: 转 pathUSD + AlphaUSD + BetaUSD → W2', () =>
    cast(`batch-send ` +
      `--call "${PATHUSD}::transfer(address,uint256):${W2},${AMT_10}" ` +
      `--call "${ALPHAUSD}::transfer(address,uint256):${W2},${AMT_10}" ` +
      `--call "${BETAUSD}::transfer(address,uint256):${W2},${AMT_10}" ` +
      `--private-key ${PK}`));
  await sleep(3000);

  // 批量 approve + swap（一笔 tx 完成授权和兑换）
  track('Batch: approve + swap pathUSD → AlphaUSD', () =>
    cast(`batch-send ` +
      `--call "${PATHUSD}::approve(address,uint256):${DEX},${AMT_100}" ` +
      `--call "${DEX}::swapExactAmountIn(address,address,uint128,uint128):${PATHUSD},${ALPHAUSD},${AMT_100},0" ` +
      `--private-key ${PK}`));
  await sleep(3000);

  // 批量带 memo 转账
  track('Batch: 2x memo transfer', () =>
    cast(`batch-send ` +
      `--call "${PATHUSD}::transferWithMemo(address,uint256,bytes32):${W2},${AMT_10},0x5041592d30303100000000000000000000000000000000000000000000000000" ` +
      `--call "${ALPHAUSD}::transferWithMemo(address,uint256,bytes32):${W2},${AMT_10},0x5041592d30303200000000000000000000000000000000000000000000000000" ` +
      `--private-key ${PK}`));
  await sleep(3000);

  log(`  Phase 4 完成: ✅${ok} ❌${fail}`);
  return { ok, fail };
}

// ============ Phase 5: Gas 代付 ============
async function phase5_sponsor() {
  log('========== Phase 5: Gas 代付 (Sponsor) ==========');
  let ok = 0, fail = 0;
  const track = (name, fn) => { runTask(name, fn).ok ? ok++ : fail++; };

  // W2 发起转账，Cast 代付 Gas
  // Step 1: 获取 sponsor hash
  log('  Step 1: 获取 sponsor hash...');
  const hashResult = cast(
    `mktx ${ALPHAUSD} "transfer(address,uint256)" ${SELF} ${AMT_10} ` +
    `--private-key ${W2_PK} --tempo.print-sponsor-hash`);

  if (!hashResult.ok) {
    log(`    ❌ 获取 sponsor hash 失败: ${hashResult.out.slice(0, 120)}`);
    fail++;
  } else {
    const feeHash = hashResult.out.trim();
    log(`    hash: ${feeHash}`);

    // Step 2: Cast 签名
    log('  Step 2: Cast 签名 sponsor hash...');
    const sigResult = cast(
      `wallet sign --private-key ${PK} "${feeHash}" --no-hash`, { noRpc: true });

    if (!sigResult.ok) {
      log(`    ❌ 签名失败: ${sigResult.out.slice(0, 120)}`);
      fail++;
    } else {
      const sponsorSig = sigResult.out.trim();
      log(`    sig: ${sponsorSig.slice(0, 20)}...`);

      // Step 3: W2 发送 sponsored 交易
      track('Sponsored: W2 transfer AlphaUSD → Cast (Cast pays gas)', () =>
        cast(`send ${ALPHAUSD} "transfer(address,uint256)" ${SELF} ${AMT_10} ` +
          `--private-key ${W2_PK} --tempo.sponsor-signature "${sponsorSig}"`));
    }
  }
  await sleep(3000);

  log(`  Phase 5 完成: ✅${ok} ❌${fail}`);
  return { ok, fail };
}

// ============ Phase 6: 2D Nonce 并行交易 ============
async function phase6_parallel() {
  log('========== Phase 6: 2D Nonce 并行交易 ==========');
  let ok = 0, fail = 0;
  const track = (name, fn) => { runTask(name, fn).ok ? ok++ : fail++; };

  // 用不同 nonce key 同时提交多笔交易（每个 key 的 nonce 从 0 开始）
  track('Parallel [key=1]: Transfer 10 pathUSD → W2', () =>
    sendTx(PATHUSD, 'transfer(address,uint256)', `${W2} ${AMT_10}`,
      '--nonce 0 --tempo.nonce-key 1'));

  track('Parallel [key=2]: Transfer 10 AlphaUSD → W2', () =>
    sendTx(ALPHAUSD, 'transfer(address,uint256)', `${W2} ${AMT_10}`,
      '--nonce 0 --tempo.nonce-key 2'));

  track('Parallel [key=3]: Transfer 10 BetaUSD → W2', () =>
    sendTx(BETAUSD, 'transfer(address,uint256)', `${W2} ${AMT_10}`,
      '--nonce 0 --tempo.nonce-key 3'));
  await sleep(3000);

  log(`  Phase 6 完成: ✅${ok} ❌${fail}`);
  return { ok, fail };
}

// ============ Phase 7: 定时/限时交易 ============
async function phase7_scheduled() {
  log('========== Phase 7: 定时/限时交易 ==========');
  let ok = 0, fail = 0;
  const track = (name, fn) => { runTask(name, fn).ok ? ok++ : fail++; };

  const now = Math.floor(Date.now() / 1000);

  // Expiring nonce: 交易必须在 25 秒内执行
  track('Expiring nonce: Transfer 10 pathUSD → W2 (25s window)', () =>
    sendTx(PATHUSD, 'transfer(address,uint256)', `${W2} ${AMT_10}`,
      `--tempo.expiring-nonce --tempo.valid-before ${now + 25}`));
  await sleep(3000);

  // 定时交易: validAfter（交易在 2 秒后才生效）+ validBefore
  track('Scheduled: Transfer 10 AlphaUSD → W2 (2s delay, 30s window)', () =>
    sendTx(ALPHAUSD, 'transfer(address,uint256)', `${W2} ${AMT_10}`,
      `--tempo.expiring-nonce --tempo.valid-after ${now + 2} --tempo.valid-before ${now + 30}`));
  await sleep(3000);

  log(`  Phase 7 完成: ✅${ok} ❌${fail}`);
  return { ok, fail };
}

// ============ 主程序 ============
async function main() {
  log('============================================');
  log('  Tempo Testnet 全流程自动交互');
  log('============================================');
  log(`主钱包: ${SELF}`);
  log(`副钱包: ${W2}`);
  log(`RPC: ${RPC}`);
  log('');

  // 查余额
  log('--- 初始余额 ---');
  for (const [token, name] of [[PATHUSD, 'pathUSD'], [ALPHAUSD, 'AlphaUSD'], [BETAUSD, 'BetaUSD'], [THETAUSD, 'ThetaUSD']]) {
    const r = callView(token, 'balanceOf(address)(uint256)', SELF);
    if (r.ok) log(`  ${name}: ${r.out}`);
  }
  log('');

  const results = [];

  results.push(await phase1_transfers());
  results.push(await phase2_dex());
  results.push(await phase3_createToken());
  results.push(await phase4_batch());
  results.push(await phase5_sponsor());
  results.push(await phase6_parallel());
  results.push(await phase7_scheduled());

  // 汇总
  const totalOk = results.reduce((s, r) => s + r.ok, 0);
  const totalFail = results.reduce((s, r) => s + r.fail, 0);

  log('');
  log('============================================');
  log(`  全部完成: ✅${totalOk} ❌${totalFail} (共${totalOk + totalFail}笔)`);
  log('============================================');

  // 最终余额
  log('--- 最终余额 ---');
  for (const [token, name] of [[PATHUSD, 'pathUSD'], [ALPHAUSD, 'AlphaUSD'], [BETAUSD, 'BetaUSD'], [THETAUSD, 'ThetaUSD']]) {
    const r = callView(token, 'balanceOf(address)(uint256)', SELF);
    if (r.ok) log(`  ${name}: ${r.out}`);
  }
}

main().catch(err => {
  log(`致命错误: ${err.message}`);
  process.exit(1);
});
