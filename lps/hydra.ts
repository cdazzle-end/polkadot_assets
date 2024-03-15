import * as fs from 'fs';
import * as path from 'path';
import { MyAsset, MyAssetRegistryObject, MyLp, OmniPool } from '../types.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
import { getApiForNode } from './../utils.ts';
// import { BigNumber } from 'bignumber.js';
const localRpc = "ws://172.26.130.75:8010"
const liveRpc = 'wss://basilisk-rpc.dwellir.com'
const hdxOmniPoolAccount = "7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1"
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
            dexType: "solar",
            poolAssets: assetIdsString,
            liquidityStats: tokenLiqs
        }
        return newLp
    }))

    let [omniPools, omniPoolsAsLps] = await getOmnipoolData(api)
    lps = lps.concat(omniPoolsAsLps)
    fs.writeFileSync(path.join(__dirname, './lp_registry/hdx_omnipool.json'), JSON.stringify(omniPools, null, 2))
    fs.writeFileSync(path.join(__dirname, "./lp_registry/hdx_lps.json"), JSON.stringify(lps, null, 2), "utf8");
    await api.disconnect()
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
            dexType: "solar",
            poolAssets: assetIdsString,
            liquidityStats: tokenLiqs
        }

        return newLp
    }))
    console.log(lps)
    fs.writeFileSync(path.join(__dirname, "./lp_registry/hdx_lps.json"), JSON.stringify(lps, null, 2), "utf8");
    api.disconnect()
}

async function getOmnipoolLps(){

}

async function getOmnipoolData(api: ApiPromise): Promise<[OmniPool[], MyLp[]]>{
    const fees = await api.query.dynamicFees.assetFee.entries()
    let omnipool = await api.query.omnipool.assets.entries();
    let hdxAssets: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/hdx_assets.json'), 'utf8'));
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
            let tokenData = asset.tokenData as MyAsset
            return tokenData.localId == poolAsset[0]
        })
        // console.log(asset)
        if(!asset){
            throw new Error("Asset not found")
        }
        let lrnaAsset = hdxAssets.find((asset) => {
            let tokenData = asset.tokenData as MyAsset
            return tokenData.localId == 1
        })

        let tokenReserve = omnipoolBalances[poolAsset[0]]

        let fee = fees.find((fee) => {
            let feeAsset = fee[0].toHuman() as any
            return feeAsset == poolAsset[0]
        })
        let feeStats = fee?.[1].toHuman() as any
        let assetFee = feeStats.assetFee as string
        let protocolFee = feeStats.protocolFee as string
        assetFee = assetFee.slice(0, assetFee.length - 1)
        protocolFee = protocolFee.slice(0, protocolFee.length - 1)
        let assetFeeNumber = parseFloat(assetFee)
        let protocolFeeNumber = parseFloat(protocolFee)
        assetFeeNumber = assetFeeNumber * 1000
        protocolFeeNumber = protocolFeeNumber * 1000

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

        let tokenData = asset.tokenData as MyAsset
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
        let lrnaAssetData = lrnaAsset?.tokenData as MyAsset
        let omniPoolAsLpEntry: MyLp = {
            chainId: 2034,
            dexType: "omnipool",
            poolAssets: [tokenData.localId, lrnaAssetData.localId],
            liquidityStats: [tokenReserve, hubReserve],
            feeRate: assetFeeNumber.toString()
        }
        omniPoolsAsLps.push(omniPoolAsLpEntry)
    })
    
    // fs.writeFileSync(path.join(__dirname, './hdx_omnipool.json'), JSON.stringify(allOmnipools, null, 2))
    
    // await api.disconnect()
    return [allOmnipools, omniPoolsAsLps]
}

// async function calculateSwap() {
//     let bsx_assets = JSON.parse(fs.readFileSync("../../assets/bsx/asset_registry.json", "utf8"));
//     // let input_ksm = 1 * 10 ** 12;
//     let input_amount = BigNumber(1);

//     let pools = JSON.parse(fs.readFileSync("./lps.json", "utf8"));
//     let bsxKsmPool = pools[5];
//     console.log(bsxKsmPool)
//     let bsxLiq = BigNumber(bsxKsmPool.liquidityStats[0]).div(BigNumber(10).pow(12));
//     let ksmLiq = BigNumber(bsxKsmPool.liquidityStats[1]).div(BigNumber(10).pow(12));
//     let input_index = 1
//     let output_index = 0
//     let inputLiq = BigNumber(bsxKsmPool.liquidityStats[input_index]).div(BigNumber(10).pow(12))
//     // let inputLiq = bsxKsmPool[input_index]
//     let outputLiq = BigNumber(bsxKsmPool.liquidityStats[output_index]).div(BigNumber(10).pow(12))

//     let increments = input_amount.div(BigNumber(100));
//     let totalOut = BigNumber(0);
//     console.log("Input liq: " + inputLiq)
//     console.log("Output liq: " + outputLiq)
//     console.log("Input amount: " + input_amount)
//     for (let i = 0; i < 100; i++) {
//         let out = outputLiq.times(increments).div(inputLiq.plus(increments));
//         // console.log(out)
//         let slip = (out.div(outputLiq)).times(out);
//         totalOut = totalOut.plus(out.minus(slip));
//         outputLiq= outputLiq.minus(out.minus(slip));
//         inputLiq = inputLiq.plus(increments);
//     }
//     // totalOut = totalOut / 10 ** 12;
//     let swapFee = totalOut.times(0.003);
//     totalOut = totalOut.minus(swapFee);
//     console.log("Total out: " + totalOut);
//     // let formatted_input = 

// }

async function main() {
    await saveLps()
    // await calculateSwap()
}

// main().then(() => console.log("complete"))