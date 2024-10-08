import { ethers } from 'ethers'
import * as fs from 'fs';  
import readline from 'readline';
import path from 'path';
import bn from 'bignumber.js'
import { parse } from 'path'
import { ApiPromise, WsProvider } from '@polkadot/api';
import { GlobalState, MyLp, Slot0, TickData } from '../types.ts';
import { altDexContractAbi, dexAbiMap, dexAbis, glmrLpsTest1, selectedHttpEndpoint, selectedWsEndpoint, wsProvider, xcTokenAbi } from './glmrConsts.ts';
import { TickMath } from '@uniswap/v3-sdk';
import {
    Multicall,
    ContractCallResults,
    ContractCallContext,
  } from 'ethereum-multicall';

  import { fileURLToPath } from 'url';
import { lpRegistryFolder } from '../consts.ts';

const minWord = tickToWord(-887272, 60)
const maxWord = tickToWord(887272,60 )

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);



export async function getV2DexData(contractAddress){
    const pool = await new ethers.Contract(contractAddress, altDexContractAbi, wsProvider);
    let reserves = await pool.getReserves();
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const name = await pool.name();
    let abi = name.includes('Zenlink') ? 'zenlink' : 'solar'
    let dexType = 'V2'
    let reserve_0 = reserves[0].toString();
    let reserve_1 = reserves[1].toString();
    let newliquidityStats = [reserve_0, reserve_1];
    const newPool: MyLp = {
        chainId: 2004,
        dexType: dexType,
        abi: abi,
        contractAddress: contractAddress,
        poolAssets: [token0, token1],
        liquidityStats: newliquidityStats
    }
    return newPool;
}
export interface ContractTickQuery{
    address: string,
    ticks: number[],
    abi: string
}
export interface TickDataQuery{
    tick: number,
    liquidityTotal: string,
    liquidityDelta: string,
    initialized: boolean
}
export interface ContractTickQueryResult{
    contractAddress: string,
    abi: string,
    tickDatas: TickDataQuery[]
}
export async function queryAllContractsTickData(contracts: ContractTickQuery[]): Promise<ContractTickQueryResult[]>{
    // console.log(`Selected HTTP Endpoint: ${selectedHttpEndpoint}`)
    const multicall = new Multicall({ nodeUrl: selectedHttpEndpoint!, tryAggregate: true });
    // console.log(`Set multicall`)
    let contractCallContext: ContractCallContext[] = [];

    contracts.forEach(({ address, ticks, abi }) => {
        let calls = ticks.map(tick => ({
            reference: `tickData-${address}-${tick}`,
            methodName: `ticks`,
            methodParameters: [tick],
        }));

        contractCallContext.push({
            reference: address,
            contractAddress: address,
            abi: dexAbiMap[abi],
            calls,
        });
    });

    try {
        // console.log(`Calling multicall`)
        const results: ContractCallResults = await multicall.call(contractCallContext);

        // console.log(`Multicall results: ${JSON.stringify(results, null, 2)}`)

        // Process the results for each contract
        return contracts.map(({ address, ticks, abi }) => {
            let tickDatas: TickDataQuery[] = results.results[address].callsReturnContext.map((callReturnContext, i) => {
                let returnValues = callReturnContext.returnValues;
                let liquidityGross = new bn(returnValues[0].hex.toString());
                let liquidityNet = new bn(returnValues[1].hex.toString());

                return {
                    tick: ticks[i],
                    liquidityTotal: liquidityGross.toFixed(),
                    liquidityDelta: liquidityNet.toFixed(),
                    initialized: returnValues[7].hex !== "0x00",
                };
            });
            
            if (!tickDatas) throw new Error(`Failed to query tick data for ${address}`);
            let result: ContractTickQueryResult = { 
                contractAddress: address, 
                abi: abi,
                tickDatas 
            };
            return result
        });
    } catch (e) {
        console.error("Multicall failed", e);
        throw e;
    }
}

export async function queryTickData(contractAddress: string, ticks: number[], abi: string){
    const pool = await new ethers.Contract(contractAddress, dexAbiMap[abi], wsProvider);
    let calls = ticks.map(tick => {
        return {reference: `tickData`, methodName: `ticks`, methodParameters: [tick]}
    })

    const multicall = new Multicall({ nodeUrl: selectedHttpEndpoint!, tryAggregate: true });
    const contractCallContext: ContractCallContext[] = [
        {
            reference: 'allTicks',
            contractAddress: contractAddress,
            abi: dexAbiMap[abi],
            calls: calls
        }
    ];

    try{
        const results: ContractCallResults = await multicall.call(contractCallContext);
        let tickDatas = results.results.allTicks.callsReturnContext.map((callReturnContext, i) => {
            let returnValues = callReturnContext.returnValues
            let liquidityGross = new bn(returnValues[0].hex.toString())
            let liquidityNet = new bn(returnValues[1].hex.toString())
            
            // console.log(`Tick: ${ticks[i]} | Gross: ${liquidityGross} | Net: ${liquidityNet}`)
            return {
                tick: ticks[i],
                liquidityTotal: liquidityGross.toFixed(),
                liquidityDelta: liquidityNet.toFixed(),
                intialized: returnValues[7].hex !== "0x00"
            }
        })
        if(tickDatas === undefined) throw new Error(`Failed to query tick data for ${contractAddress}`)
        return tickDatas
    } catch(e){
        console.log(`FAILED: ${contractAddress}`)
        console.log(e)
    }
}

// export async function queryUpperLowerTicksUni3(tick: bn, tickSpacing: bn, pool: ethers.Contract): Promise<[TickData[], TickData[]]>{
//     let [lower, upper] = await getUpperLowerTicks(tick, tickSpacing)
//     let lowerTicks = [lower]
//     let current = new bn(lower)
//     for(let i = 0; i < 100; i++){
//         let nextTick =  new bn(current.minus(tickSpacing))
//         lowerTicks.push(nextTick)
//         current = new bn(nextTick)
//     }
//     let upperTicks = [upper]
//     current = new bn(upper)
//     for(let i = 0; i < 100; i++){
//         let nextTick = new bn(current.plus(tickSpacing))
//         upperTicks.push(nextTick)
//         current = new bn(nextTick)
//     }

//     let lowerTickDatasPromise = lowerTicks.map(async tick => {
//         let tickData = await pool.ticks(tick.toNumber())
//         let tickDataObject: TickData = {
//             tick: tick.toString(),
//             liquidityTotal: tickData.liquidityGross.toString(),
//             liquidityDelta: tickData.liquidityNet.toString(),
//             initialized: tickData.initialized
//         }
//         return tickDataObject  
//     })

//     let upperTickDatasPromise = upperTicks.map(async tick => {
//         let tickData = await pool.ticks(tick.toNumber())
//         let tickDataObject: TickData = {
//             tick: tick.toString(),
//             liquidityTotal: tickData.liquidityGross.toString(),
//             liquidityDelta: tickData.liquidityNet.toString(),
//             initialized: tickData.initialized
//         }
//         return tickDataObject 
//     })

//     let lowerTickDatas = await Promise.all(lowerTickDatasPromise)
//     let upperTickDatas = await Promise.all(upperTickDatasPromise)

//     lowerTickDatas = lowerTickDatas.filter(tick => tick.initialized)
//     upperTickDatas = upperTickDatas.filter(tick => tick.initialized)
//     return [lowerTickDatas, upperTickDatas]
// }

// export async function queryUpperLowerTicksAlgebra(tick: bn, tickSpacing: bn, pool: ethers.Contract) : Promise<[TickData[], TickData[]]>{
//     let [lower, upper] = await getUpperLowerTicks(tick, tickSpacing)
//     let lowerTicks = [lower]
//     let current = new bn(lower)
//     for(let i = 0; i < 100; i++){
//         let nextTick =  new bn(current.minus(tickSpacing))
//         lowerTicks.push(nextTick)
//         current = new bn(nextTick)
//     }
//     let upperTicks = [upper]
//     current = new bn(upper)
//     for(let i = 0; i < 100; i++){
//         let nextTick = new bn(current.plus(tickSpacing))
//         upperTicks.push(nextTick)
//         current = new bn(nextTick)
//     }

//     let lowerTickDatasPromise = lowerTicks.map(async tick => {
//         let tickData = await pool.ticks(tick.toNumber())
//         let tickDataObject: TickData = {
//             tick: tick.toString(),
//             liquidityTotal: tickData.liquidityTotal.toString(),
//             liquidityDelta: tickData.liquidityDelta.toString(),
//             initialized: tickData.initialized
//         }
//         return tickDataObject 
//     })

//     let upperTickDatasPromise = upperTicks.map(async tick => {
//         let tickData = await pool.ticks(tick.toNumber())
//         let tickDataObject: TickData = {
//             tick: tick.toString(),
//             liquidityTotal: tickData.liquidityTotal.toString(),
//             liquidityDelta: tickData.liquidityDelta.toString(),
//             initialized: tickData.initialized
//         }
//         return tickDataObject 
//     })

//     let lowerTickDatas = await Promise.all(lowerTickDatasPromise)
//     let upperTickDatas = await Promise.all(upperTickDatasPromise)

//     lowerTickDatas = lowerTickDatas.filter(tick => tick.initialized)
//     upperTickDatas = upperTickDatas.filter(tick => tick.initialized)
//     return [lowerTickDatas, upperTickDatas]
// }

// export function getUpperLowerTicks(currentTick: bn, tickSpacing: bn): [bn, bn]{
//     let currentTickAbs = currentTick.abs()
//     let mod = currentTickAbs.mod(tickSpacing)
//     let lowerTick = currentTickAbs.minus(mod)
//     let upperTick = lowerTick.plus(tickSpacing)

//     if(currentTick.lt(0)){
//         return [upperTick.negated(), lowerTick.negated()]
//     }
//     return [lowerTick, upperTick]
// }
// async function getNextLowerTick()
function tickToWord(tick: number, tickSpacing: number): number {
    let compressed = Math.floor(tick / tickSpacing)
    if (tick < 0 && tick % tickSpacing !== 0) {
      compressed -= 1
    }
    return tick >> 8
  }
  

// interface TempTickData {
//     contractAddress: string,
//     ticks: number[]
// }
// export async function writeTempFile(contractAddress: string, ticks){
//     let filename = contractAddress + ".json"
//     let tickData: TempTickData = {
//         contractAddress: contractAddress,
//         ticks: ticks
//     }
//     fs.writeFileSync(path.join(__dirname, './temp', filename), JSON.stringify(tickData, null, 2))
// }

// async function getTempFile(contractAddress: string){
//     let ticks: TempTickData[] = JSON.parse(fs.readFileSync(path.join(__dirname, './temp', contractAddress + ".json"), 'utf8'))
// }

// async function saveTempData(){

// }
