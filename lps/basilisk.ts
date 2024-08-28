import * as fs from 'fs';
import { MyLp } from '../types.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);;
const localRpc = "ws://172.26.130.75:8010"
const liveRpc = 'wss://basilisk-rpc.dwellir.com'
export async function updateLps(chopsticks: boolean) {
    let rpc = chopsticks ? localRpc : liveRpc
    const provider = new WsProvider(rpc);
    const api = await ApiPromise.create({ provider: provider });
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
    fs.writeFileSync(path.join(__dirname, "./lp_registry/bsx_lps.json"), JSON.stringify(lps, null, 2), "utf8");
    api.disconnect()
}

async function saveLps() {
    const provider = new WsProvider('wss://basilisk-rpc.dwellir.com');
    const api = await ApiPromise.create({ provider: provider });
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

        // let liq0 = liquidity![0]
        let liqTotal = liquidity![1]
        // let testQ = await api.query.system.account("bXnMD3c7JFY4VhT8km2rcWv1Gs1DZFf6Fdm737HsLPsm4pQQ6");
        // console.log(testQ.toHuman())

        let assetIds = assets.toJSON() as any;
        console.log(assetIds)
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
        // console.log("Token liquidity: ")
        // console.log(tokenLiqs)
        console.log("Account: " + accountFormatted)
        let totalCalculate = tokenLiqs.reduce((a: any, b: any) => {
            console.log(a)
            console.log(b)
            return parseInt(a) * parseInt(b)
        })
        console.log("Total liquidity: " + totalCalculate)

        // console.log("LP: ")
        console.log(assetPoolAccount.toHuman())
        console.log("Pool liq " + liqTotal.toHuman())

        let assetIdsString = assetIds.map((id: any) => id.toString())

        let newLp: MyLp = {
            chainId: parseInt(parachainId),
            dexType: "solar",
            poolAssets: assetIdsString,
            liquidityStats: tokenLiqs
        }

        // console.log(newLp)
        return newLp
    }))
    console.log(lps)
    fs.writeFileSync("./lps.json", JSON.stringify(lps, null, 2), "utf8");
    api.disconnect()
}

async function main() {
    await saveLps()
    // await calculateSwap()
}

// main().then(() => console.log("complete"))