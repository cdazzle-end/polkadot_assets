import * as fs from 'fs';
import * as path from 'path';
import { TokenData, IMyAsset, MyLp, OmniPool, StableSwapPool } from '../types.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
import { getApiForNode } from '../utils.ts';
import bn from 'bignumber.js';

import { fileURLToPath } from 'url';
import { hdxAssetRegistry as hdxAssetRegistry, hdxLpRegistry, hdxOmniPool, hdxStableLpRegistry } from '../consts.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localRpc = "ws://172.26.130.75:8010"
const liveRpc = 'wss://basilisk-rpc.dwellir.com'
// const hdxOmniPoolAccount = "7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1"

const hdxOmniPoolAccount = "7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1"
const hdx4Pool = "7JP6TvcH5x31TsbC6qVJHEhsW7UNmpREMZuLBpK2bG1goJRS"
const hdxIntrIbtcStable = "7MaKPwwnqN4cqg35PbxsGXUo1dfvjXQ3XfBjWF9UVvKMjJj8"
const hdxUsdtUsdcStable = "7LVGEVLFXpsCCtnsvhzkSMQARU7gRVCtwMckG7u7d3V6FVvG"

type StableAccountKey = '100' | '101' | '102';
const MAX_D_ITERATIONS = 64
const MAX_Y_ITERATIONS = 128
const TARGET_PRECISION = new bn(18)
const FEE_PRECISION = 10000000000

const stableAccountMap: Record<StableAccountKey, string> = {
    '100': hdx4Pool,
    '101': hdxIntrIbtcStable,
    '102': hdxUsdtUsdcStable,
};
export async function updateLps(chopsticks: boolean) {
    let api = await getApiForNode("HydraDX", chopsticks);
    await api.isReady;

    let parachainId = await (await api.query.parachainInfo.parachainId()).toHuman() as any;
    parachainId = parachainId.replace(/,/g, "");
    let poolAssets = await api.query.xyk.poolAssets.entries();
    let lps = await Promise.all(poolAssets.map(async ([assetPoolAccount, assets]: any) => {
        let assetIds = assets.toJSON() as any;
        let accountFormatted = (assetPoolAccount.toHuman() as any)[0]
        let tokenLiqs = await Promise.all(assetIds.map(async (id: any) => {

            if (id == 0) {
                let accountData = await api.query.system.account(accountFormatted);
                let bsxLiq = (accountData.toHuman() as any).data.free.replace(/,/g, "")
                return bsxLiq
            } else {
                let accountData = await api.query.tokens.accounts(accountFormatted, id);
                let tokenLiq = (accountData.toHuman() as any).free.replace(/,/g, "")
                return tokenLiq
            }
        }))

        let assetIdsString = assetIds.map((id: any) => id.toString())

        let newLp: MyLp = {
            chainId: parseInt(parachainId),
            dexType: "V2",
            poolAssets: assetIdsString,
            liquidityStats: tokenLiqs
        }
        return newLp
    }))

    let [omniPools, omniPoolsAsLps] = await getOmnipoolData(api)
    let stablePools = await getStablePoolData(api)
    lps = lps.concat(omniPoolsAsLps)
    fs.writeFileSync(path.join(hdxOmniPool), JSON.stringify(omniPools, null, 2))
    fs.writeFileSync(path.join(hdxLpRegistry), JSON.stringify(lps, null, 2), "utf8");
    fs.writeFileSync(path.join(hdxStableLpRegistry), JSON.stringify(stablePools, null, 2), "utf8");
    // await api.disconnect()
}

async function saveLps() {
    // const provider = new WsProvider('wss://basilisk-rpc.dwellir.com');
    // const api = await ApiPromise.create({ provider: provider });
    let api = await getApiForNode("HydraDX", false);
    await api.isReady;

    let parachainId = await (await api.query.parachainInfo.parachainId()).toHuman() as any;
    parachainId = parachainId.replace(/,/g, "");
    let poolAssets = await api.query.xyk.poolAssets.entries();
    let poolLiquidity = await api.query.xyk.totalLiquidity.entries();
    let lps = await Promise.all(poolAssets.map(async ([assetPoolAccount, assets]: any) => {
        let liquidity = poolLiquidity.find(([poolAccount, liquidity]) => {
            let pool1 = assetPoolAccount.toHuman();
            let pool2 = poolAccount.toHuman() as any;
            return pool1[0] === pool2[0]
        })
        let liqTotal = liquidity![1]


        let assetIds = assets.toJSON() as any;
        // console.log(assetIds)
        let accountFormatted = (assetPoolAccount.toHuman() as any)[0]
        let tokenLiqs = await Promise.all(assetIds.map(async (id: any) => {
            
            if (id == 0) {
                let accountData = await api.query.system.account(accountFormatted);
                let bsxLiq = (accountData.toHuman() as any).data.free.replace(/,/g, "")
                return bsxLiq
            } else {
                let accountData = await api.query.tokens.accounts(accountFormatted, id);
                let tokenLiq = (accountData.toHuman() as any).free.replace(/,/g, "")
                return tokenLiq
            }
        }))
        // console.log("Account: " + accountFormatted)
        let totalCalculate = tokenLiqs.reduce((a: any, b: any) => {
            // console.log(a)
            // console.log(b)
            return parseInt(a) * parseInt(b)
        })
        // console.log("Total liquidity: " + totalCalculate)

        // console.log(assetPoolAccount.toHuman())
        // console.log("Pool liq " + liqTotal.toHuman())

        let assetIdsString = assetIds.map((id: any) => id.toString())

        let newLp: MyLp = {
            chainId: parseInt(parachainId),
            dexType: "V2",
            poolAssets: assetIdsString,
            liquidityStats: tokenLiqs
        }

        return newLp
    }))
    // console.log(lps)
    fs.writeFileSync(path.join(hdxLpRegistry), JSON.stringify(lps, null, 2), "utf8");
    // api.disconnect()
}

async function getStablePoolData(api: ApiPromise): Promise<StableSwapPool[]>{
    // const wsProvider = new WsProvider(liveRpc);
    // const api = await ApiPromise.create({ provider: wsProvider });
    const fees = await api.query.dynamicFees.assetFee.entries()

    let stablePools = await api.query.stableswap.pools.entries();

    
    let stableSwapPools = stablePools.map(async (pool) => {
        // console.log(pool[0].toHuman(), pool[1].toHuman())
        let poolId = pool[0].toHuman() as any
        // poolId = poolId[0]
        let poolData = pool[1].toHuman() as any
        let assets = poolData.assets
        let initialAmplification = poolData.initialAmplification.replace(/,/g, '')
        let finalAmplification = poolData.finalAmplification.replace(/,/g, '')
        let swapFee = new bn(poolData.fee.replace(/%/g, '')).div(new bn(10).pow(2)).toFixed()
        let initialBlock = new bn(poolData.initialBlock.replace(/,/g, '')).toFixed()
        let finalBlock = new bn(poolData.finalBlock.replace(/,/g, '')).toFixed()

        let poolIdString: StableAccountKey = poolId[0].toString() as StableAccountKey; // Cast to the type explicitly if you're sure about the conversion
        // console.log("Pool ID: ", poolIdString);
        let stablePoolAccount = stableAccountMap[poolIdString];
        // console.log("Stable account: ", stablePoolAccount);
        // let liquidityStats = await api.query.tokens.accounts.entries(stablePoolAccount);

        let assetStats = assets.map(async (assetId: any) => {
            // console.log(assetId)
            // console.log(assetId.toHuman())
            let assetLiquidity = await api.query.tokens.accounts(stablePoolAccount, assetId)
            let assetLiquidityString = assetLiquidity.toHuman() as any
            // console.log(assetLiquidityString.free)
            return [assetId, assetLiquidityString.free]
        })

        let stats = await Promise.all(assetStats)
        // console.log(JSON.stringify(stats, null, 2))

        let poolAssetIds: string[]= []
        let poolLiquidityStats: string[] = []
        let tokenPrecisions: string[] = []
        stats.forEach(([assetId, stat]) => {
            poolAssetIds.push(assetId)
            poolLiquidityStats.push(stat)

            let asset = getAssetById(assetId.toString())
            let tokenData = asset.tokenData as TokenData
            let assetDecimals = tokenData.decimals
            let precision = TARGET_PRECISION.minus(assetDecimals)
            let tokenPrecision = new bn(10).pow(precision.toNumber())
            
            tokenPrecisions.push(tokenPrecision.toFixed())
        })
        // console.log(poolAssetIds)
        // console.log(poolLiquidityStats)

        // console.log(`Final A: ${finalAmplification}`)

        let reserves = poolLiquidityStats.map((stat) => new bn(stat.replace(/,/g, '')))
        let totalSupply = calculateD(reserves, new bn(finalAmplification))
        let reserveString = reserves.map((reserve) => reserve.toFixed())
        // console.log(`Total Supply: ${totalSupply.toFixed()}`)
        let shareIssuance = await api.query.tokens.totalIssuance(poolIdString)
        let shareIssuanceFixed = new bn(shareIssuance.toString()).toFixed()

        // let feePrecision = 10000000000
        swapFee = new bn(swapFee).times(FEE_PRECISION).toFixed()

        let stableSwapPool: StableSwapPool = {
            chainId: 2034,
            dexType: "stable",
            poolId: poolIdString,
            shareIssuance: shareIssuanceFixed,
            poolAssets: assets,
            liquidityStats: reserveString,
            tokenPrecisions: tokenPrecisions,
            swapFee: swapFee,
            feePrecision: FEE_PRECISION.toString(),
            a: initialAmplification,
            aPrecision: 1,
            aBlock: initialBlock,
            futureA: finalAmplification,
            futureABlock: finalBlock,
            totalSupply: totalSupply.toFixed(),
            poolPrecision: "1"
        }
        return stableSwapPool
    })

    let s = await Promise.all(stableSwapPools)

    return s
}
async function getOmnipoolData(api: ApiPromise): Promise<[OmniPool[], MyLp[]]>{
    const fees = await api.query.dynamicFees.assetFee.entries()
    let omnipool = await api.query.omnipool.assets.entries();
    let hdxAssets: IMyAsset[] = JSON.parse(fs.readFileSync(hdxAssetRegistry, 'utf8'));
    let omnipoolHdxBalance = await api.query.system.account(hdxOmniPoolAccount)
    let omnipoolTokenBalances = await api.query.tokens.accounts.entries(hdxOmniPoolAccount)

    let omnipoolBalances: any = {}
    // console.log(omnipoolHdxBalance.toHuman())
    omnipoolTokenBalances.forEach((balance) => {
        let assetIdAccount = balance[0].toHuman() as any
        let assetId: number = Number.parseInt(assetIdAccount[1])
        let accountBalance = balance[1].toHuman() as any
        let balanceFree = accountBalance.free.toString()
        balanceFree = balanceFree.replace(/,/g, '')
        omnipoolBalances[assetId] = balanceFree
    })

    let hdxBalanceData = omnipoolHdxBalance.toHuman() as any
    let balance = hdxBalanceData.data.free.toString().replace(/,/g, '')
    // console.log(balance)

    omnipoolBalances[0] = balance

    let allOmnipools:OmniPool[] = []
    let omniPoolsAsLps: MyLp[] = []
    omnipool.forEach((pool) => {
        let poolAsset = pool[0].toHuman() as any
        let asset = hdxAssets.find((asset) => {
            let tokenData = asset.tokenData as TokenData
            return tokenData.localId == poolAsset[0]
        })
        // console.log(asset)
        if(!asset){
            throw new Error("Asset not found")
        }
        let lrnaAsset = hdxAssets.find((asset) => {
            let tokenData = asset.tokenData as TokenData
            return tokenData.localId == 1
        })

        let tokenReserve = omnipoolBalances[poolAsset[0]]

        // console.log("Get asset fee for ", poolAsset[0])

        let fee = fees.find((fee) => {
            let feeAsset = fee[0].toHuman() as any
            return feeAsset == poolAsset[0]
        })
        let assetFee, protocolFee, assetFeeNumber, protocolFeeNumber
        if(!fee){
            // Default amounts if omnipool asset is not registered in dynamic fees registry
            assetFeeNumber = 250
            protocolFeeNumber = 50
        } else {
            let feeStats = fee?.[1].toHuman() as any
            assetFee = feeStats.assetFee as string
            protocolFee = feeStats.protocolFee as string
            assetFee = assetFee.slice(0, assetFee.length - 1)
            protocolFee = protocolFee.slice(0, protocolFee.length - 1)
            assetFeeNumber = parseFloat(assetFee)
            protocolFeeNumber = parseFloat(protocolFee)
            assetFeeNumber = assetFeeNumber * 1000
            protocolFeeNumber = protocolFeeNumber * 1000
        }
        // console.log(`Asset fee number: ${assetFeeNumber} | Protocol Fee number: ${protocolFeeNumber}`)



        let poolStats = pool[1].toHuman() as any
        let hubReserve = poolStats.hubReserve as string
        let assetAmount = poolStats.shares as string
        let protocolAmount = poolStats.protocolShares as string
        let capAmount = poolStats.cap as string
        hubReserve = hubReserve.replace(/,/g, '')
        assetAmount = assetAmount.replace(/,/g, '')
        protocolAmount = protocolAmount.replace(/,/g, '')
        capAmount = capAmount.replace(/,/g, '')

        // console.log(`Hub Reserve: ${hubReserve} | Asset Amount: ${assetAmount} | Protocol Reserve: ${protocolAmount} | Cap: ${capAmount} | Asset Fee: ${assetFeeNumber} | Protocol Fee: ${protocolFeeNumber}`)

        let tokenData = asset.tokenData as TokenData
        let omniPoolEntry: OmniPool = {
            assetId: tokenData.localId,
            tokenAmount: tokenReserve,
            hubAmount: hubReserve,
            assetAmount: assetAmount,
            protocolAmount: protocolAmount,
            assetFee: assetFeeNumber.toString(),
            protocolFee: protocolFeeNumber.toString(),
            cap: capAmount
        }
        allOmnipools.push(omniPoolEntry)
        let lrnaAssetData = lrnaAsset?.tokenData as TokenData
        let omniPoolAsLpEntry: MyLp = {
            chainId: 2034,
            dexType: "omnipool",
            poolAssets: [tokenData.localId, lrnaAssetData.localId],
            liquidityStats: [tokenReserve, hubReserve],
            feeRate: assetFeeNumber.toString()
        }
        omniPoolsAsLps.push(omniPoolAsLpEntry)
    })
    
    return [allOmnipools, omniPoolsAsLps]
}
// D or TotalSupply, calculated from reserves
function calculateD(reserves: bn[], a: bn){
    let one = new bn(1)
    let n_coins = new bn(reserves.length)
    let ann = new bn(a)
    let sum = new bn(0)
    reserves.forEach((reserve) => {
        sum = sum.plus(reserve)
        ann = ann.times(n_coins)
    })

    let d = new bn(sum)

    for(let i = 0; i < MAX_D_ITERATIONS; i++){
        let p_d = new bn(d)
        reserves.forEach((reserve) => {
            let div_op = reserve.times(n_coins)
            p_d = p_d.times(d).div(div_op)   
        })

        let prev_d = new bn(d)
        
        let t_1 = ann.times(sum).plus(p_d.times(n_coins))
        let t_2 = ann.minus(one).times(d)
        let t_3 = n_coins.plus(one).times(p_d)
        let t_4 = t_2.plus(t_3)

        d = t_1.times(d).div(t_4).integerValue()

        if(hasConverged(prev_d, d)){
            return d.integerValue()
        }
    }
    return d.integerValue()
}

function hasConverged(v0: bn, v1: bn){
    let diff = v0.minus(v1)

    return (v1 <= v0 && diff < new bn(1)) || (v1 > v0 && diff <= new bn(1))
}


function getAssetById(assetId: String): IMyAsset{
    let assets: IMyAsset[] = JSON.parse(fs.readFileSync(hdxAssetRegistry, 'utf8'));
    let asset = assets.find((asset) => {
        let tokenData = asset.tokenData as TokenData
        return tokenData.chain == 2034 && tokenData.localId == assetId
    })
    if(!asset){
        throw new Error(`No pool found for asset ${assetId}`)
    }
    return asset
}


async function main() {
    // await saveLps()
    // await updateLps(false)
    // let api = await getApiForNode("HydraDX", true)
    // await getOmnipoolData(api)
    // await calculateSwap()
}

// main().then(() => console.log("complete"))