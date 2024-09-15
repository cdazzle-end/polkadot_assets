import { ethers } from 'ethers'
import * as fs from 'fs';  
import readline from 'readline';
import path from 'path';
import bn from 'bignumber.js'
import { parse } from 'path'
import { ApiPromise, WsProvider } from '@polkadot/api';
import { GlobalState, MyLp, Slot0 } from '../types.ts';
import { altDexContractAbi, dexAbiMap, dexAbis, wsProvider, xcTokenAbi } from './glmrConsts.ts';
import { TickMath } from '@uniswap/v3-sdk';
import { ContractTickQuery, ContractTickQueryResult, getAlgebraTickData, getSolarData, getUni3TickData, queryAllContractsTickData, rewriteAbi, saveAllInitializedTicks, saveAllInitializedTicksMultiCall } from './moonbeamUtils.ts'

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const rpc1 = 'wss://moonbeam.public.blastapi.io';
const __dirname = path.dirname(__filename);
const rpc2 = 'wss://moonbeam-rpc.dwellir.com';
// const rpc3 = 'wss://moonriver.api.onfinality.io/public-ws';
const rpc4 = 'wss://moonbeam.unitedbloc.com'
const testZenContract = "0x94F9EB420174B8d7396A87c27073f74137B40Fe2"

// FraxSwap if Price0 or Price1 is 0, then it is not a valid LP
const unTradeable = [
    "0x905240818bc230a532f6a84e1c3ae1916e70fdd3",
    "0xd4f1931f818e60b084fe13a40c31a05a44ed70cf",
    "0xd068746785b27c16748732ef7bcc3725c589f41e",
]

interface LpData {
    address: string,
    lp: boolean,
    abi?: string,
    name?: string,
    symbol?: string

}

interface LpResult {
    success: boolean,
    abi: string
    name?: string,
    symbol?: string
}

interface Lp {
    chainId: number,
    contractAddress: string,
    poolAssets: string[],
    liquidityStats: string[]
}


// export async function updateLps(chopsticks: boolean) {
    
//     const lps = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/lps_base.json'), 'utf8'))
//     const asseRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/glmr_assets.json'), 'utf8'))
//     lps.map((lp: any) => {
//         const token0 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[0].toLowerCase() )
//         const token1 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[1].toLowerCase() )
//         lp.poolAssets = [token0? token0.tokenData.localId : lp.poolAssets[0], token1? token1.tokenData.localId : lp.poolAssets[1]]
//     })

//     const updatedLps = (await Promise.all(lps.map(async (lp: any) => {
        
//         const pool = await new ethers.Contract(lp.contractAddress, altDexContractAbi, provider);
//         let reserves = await pool.getReserves();
//         // let reserve_0 = removeLastChar(reserves[0].toString());
//         // let reserve_1 = removeLastChar(reserves[1].toString());
//         let reserve_0 = reserves[0].toString();
//         let reserve_1 = reserves[1].toString();
//         if (reserve_0 !== "" && reserve_1 !== "") {
//             const newPool: MyLp = {
//                 chainId: 2004,
//                 contractAddress: lp.contractAddress,
//                 poolAssets: lp.poolAssets,
//                 liquidityStats: [reserve_0, reserve_1]
//             };
//             return newPool;
//         }
//     }))).filter(pool => pool != null); // Filter out null entries
//     fs.writeFileSync(path.join(__dirname, './lp_registry/glmr_lps.json'), JSON.stringify(updatedLps, null, 2))
//     provider.destroy()
// }

// export async function saveLpsOld() {
//     const lpContractAddresses = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/lp_data_results.json'), 'utf8'))
//     const lpsPromise = lpContractAddresses.map(async (lpContract: any) => {
//         let newLp: MyLp;
//         if(lpContract.abi == 'algebra'){
//             newLp = await getAlgebraData(lpContract.address)
//         } else if (lpContract.abi == 'uni3'){
//             newLp = await getUni3Data(lpContract.address)
//         } else {
//             newLp = await getSolarData(lpContract.address)
//         }
//         return newLp;
//     })
//     let lps = await Promise.all(lpsPromise)
//     const asseRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/glmr_assets.json'), 'utf8'))
//     lps.map((lp: any) => {
//         const token0 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[0].toLowerCase() )
//         const token1 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[1].toLowerCase() )
//         lp.poolAssets = [token0? token0.tokenData.localId : lp.poolAssets[0], token1? token1.tokenData.localId : lp.poolAssets[1]]
//     })
//     // console.log(lps)
//     fs.writeFileSync(path.join(__dirname, './lp_registry/glmr_lps.json'), JSON.stringify(lps, null, 2))
// }

// export async function testUni3Data() {
//     const lpContractAddresses = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/lp_data_results.json'), 'utf8'))
//     let lpPromises = []
//     const lpsPromise = lpContractAddresses.forEach(async (lpContract: any) => {
//         let newLp: MyLp;
//         if(lpContract.abi == 'algebra'){
//             await getAlgebraTickData(lpContract.address)
//         } else if (lpContract.abi == 'uni3'){
//             // newLp = await getUni3Data(lpContract.address)
//         } else {
//             // newLp = await getSolarData(lpContract.address)
//         }
//         lpPromises.push(newLp)
//     })
//     let lps = await Promise.all(lpPromises)
//     const asseRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/glmr_assets.json'), 'utf8'))
//     lps.map((lp: any) => {
//         const token0 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[0].toLowerCase() )
//         const token1 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[1].toLowerCase() )
//         lp.poolAssets = [token0? token0.tokenData.localId : lp.poolAssets[0], token1? token1.tokenData.localId : lp.poolAssets[1]]
//     })
//     // console.log(lps)
//     // fs.writeFileSync(path.join(__dirname, './lp_registry/glmr_lps.json'), JSON.stringify(lps, null, 2))
// }

/**
 * Can rewrite this when rested
 * 
 * Combines all contract tick queries into one multicall
 * 
 * Saves all lps as MyLp[]
 * 
 * REVIEW INITIALIZED TICK DATA, because were just pulling them from already existing data and not querying them
 */
export async function combinedQuery(): Promise<MyLp[]>{
    console.log('starting')
    const lpContractAddresses = JSON.parse(fs.readFileSync(path.join(__dirname, './lp_registry/glmr_lps.json'), 'utf8'))
    const glmrLps: MyLp[] = JSON.parse(fs.readFileSync(path.join(__dirname, './lp_registry/glmr_lps_test_1.json'), 'utf8'))
    const lpMap: Map<string, MyLp> = new Map(glmrLps.map(lp => [lp.contractAddress, lp]));
    
    // let lpPromises = []
    let lps: MyLp[] = []
    let contractQueries: ContractTickQuery[] = []

    let lpsPromise = await lpContractAddresses.map(async (lpContract: any) => {
        let newLp: MyLp;

        if(lpContract.abi == 'algebra' || lpContract.abi == 'uni3'){
            // console.log(`Algebra or uni ${lpContract.contractAddress}`)
            let context: Context = await getContext(lpContract.contractAddress, lpContract.abi, lpMap)
            if(context.contractTickQuery != null){
                contractQueries.push(context.contractTickQuery)
                lps.push(context.myLp)
            } else {
                lps.push(context.myLp)
            }
        } else {
            newLp = await getSolarData(lpContract.contractAddress)
            lps.push(newLp)
        }
    })

    await Promise.all(lpsPromise)
    await Promise.all(contractQueries)
    // console.log(`Contract queries: ${JSON.stringify(contractQueries, null, 2)}`)
    let queryResults: ContractTickQueryResult[] = await queryAllContractsTickData(contractQueries)
    let tickLps = queryResults.map((result) => {
        if(result.abi == 'uni3'){
            let upperTickDatas = []
            let lowerTickDatas = []
            let lp = lps.find((lp) => lp.contractAddress == result.contractAddress)
            let currentTick = new bn(lp.currentTick)
            try {
                result.tickDatas.forEach(tickData => {
                    if(tickData.tick < currentTick.toNumber()){
                        lowerTickDatas.unshift(tickData)
                    } else {
                        upperTickDatas.push(tickData)
                    }   
                })
            } catch (e) {
                throw new Error(`Error querying tick data for ${result.contractAddress} | Tick datas: ${JSON.stringify(result.tickDatas, null, 2)}`)
            }
            lp.upperTicks = upperTickDatas
            lp.lowerTicks = lowerTickDatas

        } else if(result.abi == 'algebra'){
            let upperTickDatas = []
            let lowerTickDatas = []
            let lp = lps.find((lp) => lp.contractAddress == result.contractAddress)
            let currentTick = new bn(lp.currentTick)
            try {
                result.tickDatas.forEach(tickData => {
                    if(tickData.tick < currentTick.toNumber()){
                        lowerTickDatas.unshift(tickData)
                    } else {
                        upperTickDatas.push(tickData)
                    }   
                })
            } catch (e) {
                throw new Error(`Error querying tick data for ${result.contractAddress} | Tick datas: ${JSON.stringify(result.tickDatas, null, 2)}`)
            }
            lp.upperTicks = upperTickDatas
            lp.lowerTicks = lowerTickDatas

        } else {
            throw new Error(`Incorrect abi ${result.abi}`)
        }
    })
    return lps
}

export interface Context {
    contractTickQuery: ContractTickQuery | null,
    myLp: MyLp
}

async function getContext(address: string, abi: 'algebra' | 'uni3', lpMap: Map<string, MyLp>): Promise<Context> {
    // let glmrLps: MyLp[] = JSON.parse(fs.readFileSync(path.join(__dirname, './lp_registry/glmr_lps_test_1.json'), 'utf8'))
    // let thisGlmrLp = glmrLps.find((lp) => {
    //     return lp.contractAddress == address
    // })
    let thisGlmrLp = lpMap.get(address)
    if(!thisGlmrLp){
        throw new Error("Cant find GLMR lp")
    }
    let initializedTicks = thisGlmrLp.initializedTicks

    let pool
    let token0
    let token1 
    let activeLiquidity
    let feeRate
    let currentTick

    if(abi == 'algebra'){
        pool = await new ethers.Contract(address, dexAbiMap[abi], wsProvider);
        token0 = await pool.token0();
        token1 = await pool.token1();
        activeLiquidity = new bn(await pool.liquidity());
    
        let poolInfo: GlobalState = await pool.globalState();
        feeRate = new bn(poolInfo.fee)
        currentTick = new bn(poolInfo.tick)
    } else {
        pool = await new ethers.Contract(address, dexAbiMap[abi], wsProvider);
        token0 = await pool.token0();
        token1 = await pool.token1();
        activeLiquidity = new bn(await pool.liquidity());
        feeRate = new bn(await pool.fee())
    
        let poolInfo: Slot0 = await pool.slot0();
        currentTick =new bn(poolInfo.tick)
    }
    let newLpData: MyLp = {
        chainId: 2004,
        dexType: abi,
        contractAddress: address,
        abi: abi,
        poolAssets: [token0, token1],
        liquidityStats: ["0"],
        currentTick: currentTick.toString(),
        activeLiquidity: activeLiquidity.toFixed(),
        feeRate: feeRate.toString(),
        initializedTicks: initializedTicks,
        lowerTicks: [],
        upperTicks: [],

    }
    if(initializedTicks.length == 0){
        let returnContext: Context = {
            contractTickQuery: null,
            myLp: newLpData
        }
        return returnContext
    } else {
        let query: ContractTickQuery = {
            address: address,
            ticks: initializedTicks,
            abi: abi
        }
        let returnContext: Context = {
            contractTickQuery: query,
            myLp: newLpData
        }
        return returnContext
    }

}
async function getAlgebraContext(address: string):Promise<Context>{
        // console.log(`Algebra: ${contractAddress}`)
        let glmrLps: MyLp[] = JSON.parse(fs.readFileSync(path.join(__dirname, './lp_registry/glmr_lps_test_1.json'), 'utf8'))
        let thisGlmrLp = glmrLps.find((lp) => {
            return lp.contractAddress == address
        })
        if(!thisGlmrLp){
            throw new Error("Cant find GLMR lp")
        }
        let initializedTicks = thisGlmrLp.initializedTicks
    
        const pool = await new ethers.Contract(address, dexAbiMap['algebra'], wsProvider);
        let token0 = await pool.token0();
        let token1 = await pool.token1();
        let activeLiquidity = new bn(await pool.liquidity());
    
        let poolInfo: GlobalState = await pool.globalState();
        let feeRate = new bn(poolInfo.fee)
        let currentTick = new bn(poolInfo.tick)
    
        if(initializedTicks.length == 0){
            let newLpData: MyLp = {
                chainId: 2004,
                dexType: "algebra",
                contractAddress: address,
                abi: 'algebra',
                poolAssets: [token0, token1],
                liquidityStats: ["0"],
                currentTick: currentTick.toString(),
                activeLiquidity: activeLiquidity.toFixed(),
                feeRate: feeRate.toString(),
                initializedTicks: initializedTicks,
                lowerTicks: [],
                upperTicks: []
            }
            let returnContext: Context = {
                contractTickQuery: null,
                myLp: newLpData
            }
            return returnContext
        }
        let newLpData: MyLp = {
            chainId: 2004,
            dexType: "algebra",
            contractAddress: address,
            abi: 'algebra',
            poolAssets: [token0, token1],
            liquidityStats: ["0"],
            currentTick: currentTick.toString(),
            activeLiquidity: activeLiquidity.toFixed(),
            feeRate: feeRate.toString(),
            initializedTicks: initializedTicks,
            lowerTicks: [],
            upperTicks: []
        }
        let query: ContractTickQuery = {
            address: address,
            ticks: initializedTicks,
            abi: 'algebra'
        }
        let returnContext: Context = {
            contractTickQuery: query,
            myLp: newLpData
        }
        return returnContext
}

async function getUniContext(contractAddress: string): Promise<Context>{
    let glmrLps: MyLp[] = JSON.parse(fs.readFileSync(path.join(__dirname, './lp_registry/glmr_lps_test_1.json'), 'utf8'))
    let thisGlmrLp = glmrLps.find((lp) => {
        return lp.contractAddress == contractAddress
    })
    if(!thisGlmrLp){
        throw new Error("Cant find GLMR lp")
    }

    
    let initializedTicks = thisGlmrLp.initializedTicks
    const pool = await new ethers.Contract(contractAddress, dexAbiMap['uni3'], wsProvider);
    let token0 = await pool.token0();
    let token1 = await pool.token1();
    let activeLiquidity = new bn(await pool.liquidity());
    // let tickSpacing = new bn(await pool.tickSpacing());
    let feeRate = new bn(await pool.fee())

    let poolInfo: Slot0 = await pool.slot0();
    let currentTick =new bn(poolInfo.tick)
    // console.log(`Current tick: ${currentTick}`)
    // let [lowerTickDatas, upperTickDatas] = await queryUpperLowerTicksUni3(currentTick, tickSpacing, pool)
    // let intializedTicks = await getTicksUni(contractAddress)
    // let tickDatas = await queryTickData(contractAddress, intializedTicks)
    if(initializedTicks.length == 0){
        let newLpData: MyLp = {
            chainId: 2004,
            dexType: 'uni3',
            contractAddress: contractAddress,
            abi: 'uni3',
            poolAssets: [token0, token1],
            liquidityStats: ["0"],
            currentTick: currentTick.toString(),
            activeLiquidity: activeLiquidity.toFixed(),
            feeRate: feeRate.toString(),
            initializedTicks: initializedTicks,
            lowerTicks: [],
            upperTicks: [],

        }
        let returnContext: Context = {
            contractTickQuery: null,
            myLp: newLpData
        }
        return returnContext
    }
    let newLpData: MyLp = {
        chainId: 2004,
        dexType: 'uni3',
        contractAddress: contractAddress,
        abi: 'uni3',
        poolAssets: [token0, token1],
        liquidityStats: ["0"],
        currentTick: currentTick.toString(),
        activeLiquidity: activeLiquidity.toFixed(),
        feeRate: feeRate.toString(),
        initializedTicks: initializedTicks,
        lowerTicks: [],
        upperTicks: [],

    }
    let query: ContractTickQuery = {
        address: contractAddress,
        ticks: initializedTicks,
        abi: 'uni3'
    }
    let returnContext: Context = {
        contractTickQuery: query,
        myLp: newLpData
    }
    return returnContext
}

export async function saveLps() {

    let lps = await combinedQuery()
    lps = lps.filter((lp) => lp != undefined)
    
    const asseRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/glmr_assets.json'), 'utf8'))
    lps.map((lp: any) => {
        const token0 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[0].toLowerCase() )
        const token1 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[1].toLowerCase() )
        lp.poolAssets = [token0? token0.tokenData.localId : lp.poolAssets[0], token1? token1.tokenData.localId : lp.poolAssets[1]]
    })
    lps.forEach((lp, index) => {
        if(unTradeable.includes(lp.contractAddress)){
            console.log(`Removing untradeable LP: ${lp.contractAddress}`)
            let updatedLp = lp
            updatedLp.liquidityStats = ["0", "0"]
            lps[index] = updatedLp
        }
    })
    fs.writeFileSync(path.join(__dirname, './lp_registry/glmr_lps.json'), JSON.stringify(lps, null, 2))
}


async function saveLpsAdvanced(){
    let lpDataSets: LpData[] = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/lp_data_results.json'), 'utf8'))
    lpDataSets.forEach(async (lpData: LpData) => {
        if(lpData.abi == 'algebra'){
            console.log(`Contract: ${lpData.address}`)
            const pool = await new ethers.Contract(lpData.address, dexAbiMap['algebra'], wsProvider);
            console.log("Algebra")
            let token0 = await pool.token0();
            let token1 = await pool.token1();
            console.log(`Token0: ${token0} - Token1: ${token1}`)
        } 
    })

    // for(let lp of lpDataSets){
    //     if(lp.abi == 'algebra'){
    //         console.log(`Contract: ${lp.address}`)
    //         const pool = await new ethers.Contract(lp.address, dexAbiMap['algebra'], provider);
    //         console.log("Algebra")
    //         let token0 = await pool.token0();
    //         let token1 = await pool.token1();
    //         console.log(`Token0: ${token0} - Token1: ${token1}`)
    //     }
    // }

    let testContract = "0xb13b281503f6ec8a837ae1a21e86a9cae368fcc5"
    const pool = await new ethers.Contract(testContract, dexAbiMap['algebra'], wsProvider);
    let token0 = await pool.token0();
    let token1 = await pool.token1();
    let token0Contract = await new ethers.Contract(token0, xcTokenAbi, wsProvider);
    let token1Contract = await new ethers.Contract(token1, xcTokenAbi, wsProvider);
    let token0Symbol = await token0Contract.symbol();
    let token1Symbol = await token1Contract.symbol();
    let token0Decimals = await token0Contract.decimals();
    let token1Decimals = await token1Contract.decimals();
    let liquidity = await pool.liquidity();
    let tickSpacing = await pool.tickSpacing();
    
    let liqBn = new bn(liquidity)
    let tickSpacingBn = new bn(tickSpacing)
 


    let poolInfo: GlobalState = await pool.globalState()
    console.log(`Token0: ${token0} - Token1: ${token1}`)
    console.log(poolInfo)
    let poolFee = new bn(poolInfo.fee)
    let poolFeeRate = poolFee.div(new bn(1).times(new bn(10).pow(6)))
    let currentTick =new bn(poolInfo.tick)
    bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 }) // Set to max precision
    let sqrtPriceX96 = new bn(poolInfo.price)
    
    let q96 = new bn(2).pow(96)
    let sqrtPrice = sqrtPriceX96.div(q96)
    let price = sqrtPrice.pow(2)
    console.log(`Sqrt96 Price: ${sqrtPriceX96}`)
    console.log(`Sqrt Price: ${sqrtPrice}`)
    console.log(`Price: ${price}`)
    
    let glmrDotPrice = (sqrtPriceX96.div(q96)).pow(2)
    let inputGlmr = new bn(1).times(new bn(10).pow(token0Decimals))
    let poneDot = new bn(0.1).times(new bn(10).pow(token1Decimals))
    let oneDot = new bn(1).times(new bn(10).pow(token1Decimals))
    let tenDot = new bn(10).times(new bn(10).pow(token1Decimals))
    let oneHDot = new bn(100).times(new bn(10).pow(token1Decimals))
    let dotIn = oneHDot
    let glmrIn = new bn(100).times(new bn(10).pow(token0Decimals))
    let feesInDot = dotIn.times(poolFeeRate)
    let feesInGlmr = glmrIn.times(poolFeeRate)
    console.log(`GLMR/DOT Price: ${glmrDotPrice}`)
    // console.log(`Input GLMR: ${inputGlmr}`)
    // L = dY / d sqrt(P)

    // d sqrt(P) = dY / L --- Calculate P
    // d (1/sqrt(P)) = dX / L --- Calculate P
    // dX = d (1/sqrt(P)) * L --- Calculate amount out
    // dY = d sqrt(P) * L --- Calculate amount out

    // Swap 10 DOT for GLMR
    // 1) Calculate change in sqrt P
    let amountDotInMinusFee = dotIn.minus(feesInDot)
    let changeInSqrtP = amountDotInMinusFee.div(liqBn)
    console.log(`Change in sqrt P: ${changeInSqrtP}`)
    // 2) Add change in P to current P
    let targetSqrtP = sqrtPrice.plus(changeInSqrtP)
    console.log(`Target Sqrt P: ${targetSqrtP}`)

    // 3) After calculating target P, calculate amount out
    let amountDotIn = calculateAmount1(liqBn, targetSqrtP, sqrtPrice)
    let amountGlmrOut = calculateAmount0(liqBn, targetSqrtP, sqrtPrice)
    
    console.log(`Amount DOT in: ${amountDotIn}`)
    console.log(`Amount GLMR out: ${amountGlmrOut}`)

    // 4) Verify amount out
    let changeInPriceInGlmr = new bn(1).div(targetSqrtP).minus(new bn(1).div(sqrtPrice))
    let outputGlmr = changeInPriceInGlmr.times(liqBn)
    console.log(`Output GLMR: ${outputGlmr}`)

    // Swap 100 GLMR for DOT
    // 1) Calculate change in sqrt P
    let glmrInMinusFee = glmrIn.minus(feesInGlmr)
    let changeInPRecipricol = glmrInMinusFee.div(liqBn)

    // 2) Add change in P to current P
    let inverseTargetSqrtP = new bn(1).div(sqrtPrice).plus(changeInPRecipricol)
    let targetSqrtP2 = new bn(1).div(inverseTargetSqrtP)

    // 3) After calculating target P, calculate amount out
    let amountGlmrIn = calculateAmount0(liqBn, targetSqrtP2, sqrtPrice)
    let amountDotOut = calculateAmount1(liqBn, targetSqrtP2, sqrtPrice)
    console.log(`Amount GLMR in: ${amountGlmrIn}`)
    console.log(`Amount DOT out: ${amountDotOut}`)

    //4) Verify amount out
    let changeInPriceInDot = targetSqrtP2.minus(sqrtPrice)
    let outputDot = changeInPriceInDot.times(liqBn)
    console.log(`Output DOT: ${outputDot}`)


    console.log(`Current tick: ${currentTick}`)
    let tickLower = currentTick.minus(currentTick.mod(new bn(tickSpacing)))
    let tickUpper = tickLower.plus(tickSpacing)
    console.log(`Lower tick: ${tickLower} - Upper tick: ${tickUpper}`)
    
    let sqrtLower = TickMath.getSqrtRatioAtTick(tickLower.toNumber())
    let sqrtUpper = TickMath.getSqrtRatioAtTick(tickUpper.toNumber())
    console.log(`Lower sqrt: ${sqrtLower} - Upper sqrt: ${sqrtUpper}`)
}
function calculateAmount0(liq: bn, pa: bn, pb: bn){
    if(pa > pb){
        [pa, pb] = [pb, pa]
    }
    let amount = liq.times(pb.minus(pa).div(pb).div(pa))
    return amount
}

function calculateAmount1(liq: bn, pa: bn, pb: bn){
    if(pa > pb){
        [pa, pb] = [pb, pa]
    }
    let amount = liq.times(pb.minus(pa))
    return amount
}



async function lpList() {
    const lps = JSON.parse(fs.readFileSync('./liq_pool_registry', 'utf8')).map((lp: any) => {
        return lp.contractAddress
    })
    fs.writeFileSync('./lp_contracts', JSON.stringify(lps, null, 2))
}



async function parseCSV(directory, file){
    // let filePath = path.join(__dirname, './token_holders/glmr_token_holders.csv');

    const filePath = path.join(directory, file);
    console.log(`Parsing file: ${file}`);
    const fileStream = fs.createReadStream(filePath);
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
  
    let isFirstLine = true;
    let tokenHolders: any = []

    

    for await (const line of rl){
        console.log(`Line from file: ${line}`)

      // Assuming the CSV is well-formed and doesn't contain commas within the fields
        const [holderAddress] = line.split(',');
        if(holderAddress !== "HolderAddress"){
        // Remove quotes around the holderAddress if present
            let cleanHolderAddress = holderAddress.replace(/"/g, '');

            tokenHolders.push(cleanHolderAddress)
        }
    }
    let tokenHoldersFile = path.join(__dirname, './token_holders_parsed/', file.replace('.csv', '.json'))
    fs.writeFileSync(tokenHoldersFile, JSON.stringify(tokenHolders, null, 2))
    
}

async function parseCSVFilesInDirectory() {
    let directoryPath = path.join(__dirname, './token_holders');
    let filesParse = []
    console.log("WRui")
    // let fileNames = []
    let fileNames = fs.readdirSync(directoryPath)
    console.log(fileNames)

    for (let file of fileNames) {
        if (path.extname(file) === '.csv') {
            const filePath = path.join(directoryPath, file);
            // console.log(`Parsing file: ${file}`);
            filesParse.push(parseCSV(directoryPath, file).catch(console.error))
        }
    }
//     fs.readdirSync(directoryPath, (err, files) => {
//       if (err) {
//         console.error("Could not list the directory.", err);
//         process.exit(1);
//       }
//       fileNames = files
      
//       files.forEach(file => {
//         fileNames.push(file)
//         // Check if the file is a CSV
//         if (path.extname(file) === '.csv') {
//             const filePath = path.join(directoryPath, file);
//             console.log(`Parsing file: ${file}`);
//             parseCSV(directoryPath, file).catch(console.error);
//           }
//       });

      
//   })
//   let complete = await Promise.all(filesParse);
}


function readGlmrLps(){
    let lps = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/glmr_lps.json'), 'utf8'))
    return lps
}
function readGlmrHolders(){
    let lps = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/glmr_token_holders.json'), 'utf8'))
    return lps
}
function readOtherLps(){
    let lps = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/other_lps.json'), 'utf8'))
    return lps
}
function readLpsBase(): Lp[]{
    let lps = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/lps_base.json'), 'utf8'))
    return lps
}

function addAddressesToOtherLp(lpResults: any[], overWriteAll: boolean){
    let lps = readOtherLps()
    lpResults.forEach(([lpAddress, result]) => {
        if(overWriteAll){
            lps[lpAddress] = result
        } else {
            // Only add if not already confirmed LP
            if(!lps[lpAddress] || lps[lpAddress] == false){
                lps[lpAddress] = result
            }
        }
    })
    fs.writeFileSync(path.join(__dirname, './glmr_holders/other_lps.json'), JSON.stringify(lps, null, 2))
}


async function testContractAbi(contractAddress: string, abiIndex: any){
    let abiFound
    if(abiIndex == 0){
        // Standard  V2 pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        await contract.getReserves();
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "solar",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    } else if(abiIndex == 1){
        // Uni V3 pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        await contract.slot0();
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "uni3",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    } else if (abiIndex == 2){
        // Algebra pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        await contract.globalState(); // Attempt to fetch reserves
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "algebra",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    } else if (abiIndex == 3){
        // Algebra pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        await contract.getReserves(); // Attempt to fetch reserves
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "beam",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    } else if (abiIndex == 4){
        // Algebra pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        await contract.globalState(); // Attempt to fetch reserves
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "beam3",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    } else if (abiIndex == 5){
        // Algebra pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        await contract.globalState(); // Attempt to fetch reserves
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "stella",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    } else if (abiIndex == 6){
        // Zenlink pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        let reserves = await contract.getReserves() // Attempt to fetch reserves
        console.log(reserves)
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        console.log(`${name} -- ${symbol}`)
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "zenlink",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    } else if (abiIndex == 7){
        // Algebra pool
        let contract = new ethers.Contract(contractAddress.toLowerCase(), dexAbis[abiIndex], wsProvider);
        await contract.getReserves(); // Attempt to fetch reserves
        let name = await contract.name(); 
        let symbol = await contract.symbol(); 
        let lpData: LpData = {
            address: contractAddress.toLowerCase(),
            lp: true,
            abi: "zenlink2",
            name: name,
            symbol: symbol
        }
        abiFound = true
        return lpData
    }
}

async function saveLpDataResults(lpDataResults: LpData[]){


}



async function writeConfirmedLpAddresses(){
    let glmrLps = readGlmrLps()
    let otherLps = readOtherLps()
    let confirmedLps = []
    Object.entries(glmrLps).forEach(([address, result]) => {
        if(result == true){
            confirmedLps.push(address)
        }
    })
    Object.entries(otherLps).forEach(([address, result]) => {
        if(result == true){
            confirmedLps.push(address)
        }
    })
    fs.writeFileSync(path.join(__dirname, './glmr_holders/confirmed_lps.json'), JSON.stringify(confirmedLps, null, 2))
    console.log("Number of confirmed lps: ", confirmedLps.length)
    
}
// Example address validation
function isValidAddress(address) {
    return ethers.isAddress(address);
}
function toChecksumAddress(address) {
    return ethers.getAddress(address);
}

async function isDex(dexAddress: any) {
    // const code = await provider.getCode(dexAddress);

    let contract = new ethers.Contract(dexAddress, altDexContractAbi, wsProvider);

    let reserves = await contract.getReserves();
    console.log(reserves)
    return true

    // let code = ""
    // // console.log(code)
    // if (code == "0x") {
    //     // console.log("Not a contract")
    //     return false;
    // } else {
    //     // console.log("YES contract")
    //     try {

    //         const potentialContract = new ethers.Contract(dexAddress, altDexContractAbi, provider);
    //         const name = await potentialContract.name();
    //         const token_0 = await potentialContract.token0();
    //         const token_1 = await potentialContract.token1();
    //         console.log("True")
    //         console.log(`lp Name: ${name}`)
    //         console.log(`1: ${token_0} - 2: ${token_1}`)
    //         return true;
    //     } catch {
    //         try {
    //             const potentialContract = new ethers.Contract(dexAddress, dexContractAbi, provider);
    //             const name = await potentialContract.name();
    //             const token_0 = await potentialContract.token0();
    //             const token_1 = await potentialContract.token1();
    //             console.log("True")
    //             console.log(`lp Name: ${name}`)
    //             console.log(`1: ${token_0} - 2: ${token_1}`)
    //             return true;
    //         } catch {
    //             return false;
    //         }
    //     }
    // }
}

// async function saveLps() {
//     const lpContracts = JSON.parse(fs.readFileSync('./lp_contracts', 'utf8'))
//     const lps = await Promise.all(lpContracts.map(async (lpContract: any) => {
//         const pool = await new ethers.Contract(lpContract, altDexContractAbi, provider);
//         let reserves = await pool.getReserves();
//         const token0 = await pool.token0();
//         const token1 = await pool.token1();
//         let reserve_0 = await hexToDec(reserves[0]["_hex"]);
//         let reserve_1 = await hexToDec(reserves[1]["_hex"]);
//         let newliquidityStats = [reserve_0, reserve_1];
//         // let newPool = new LiqPool("2023", poolAddress, pool["poolAssets"], newliquidityStats);
//         const newPool: MyLp = {
//             chainId: 2023,
//             contractAddress: lpContract,
//             poolAssets: [token0, token1],
//             liquidityStats: newliquidityStats
//         }
//         return newPool;
//     }))
//     console.log(lps)
//     fs.writeFileSync('./lps_base.json', JSON.stringify(lps, null, 2))
// }

// get solar dexs and try to query with zen

async function main() {
    // await testUni3Data()
    // await testDex3Data()
    // await combinedQuery()
    await saveLps()
    // await saveLps()
    // await saveAllInitializedTicks()
    // await saveAllInitializedTicksMultiCall()
    // rewriteAbi()
    process.exit(0)
}

main()