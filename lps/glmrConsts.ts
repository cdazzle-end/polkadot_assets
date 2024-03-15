import { ethers } from 'ethers'
import * as fs from 'fs';  
import readline from 'readline';
import path from 'path';
// import { BigNumber } from 'ethers'; // ← used to convert bn object to Ethers BigNumber standard 
// import bn from 'bignumber.js'  
// import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation } from '../asset_types';
import { parse } from 'path'
// import { formatUnits } from 'ethers/lib/utils';
// import {hexToDec2, decToHex2} from '../../parachains/hex'
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url';
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { MyLp } from '../types';
export const rpc1 = 'wss://moonbeam.public.blastapi.io';
export const rpc2 = 'wss://moonbeam-rpc.dwellir.com';
// const rpc3 = 'wss://moonriver.api.onfinality.io/public-ws';
export const rpc4 = 'wss://moonbeam.unitedbloc.com'
export const testZenContract = "0x94F9EB420174B8d7396A87c27073f74137B40Fe2"
export const united_block_http="https://moonbeam.unitedbloc.com"
export const united_block_ws="wss://moonbeam.unitedbloc.com"


export const RPC_1_HTTP = process.env.RPC_1_HTTP
export const ON_FINALITY_HTTP = process.env.ON_FINALITY_HTTP
export const BLAST_HTTP= process.env.BLAST_HTTP
export const POKT_HTTP= process.env.POKT_HTTP

export const RPC_1_WS = process.env.RPC_1_WS
export const ON_FINALITY_WS = process.env.ON_FINALITY_WS
export const BLAST_WS = process.env.BLAST_WS

export const selectedWsEndpoint = rpc2
export const selectedHttpEndpoint = united_block_http
export const wsProvider = new ethers.WebSocketProvider(selectedWsEndpoint);

export const dexContractAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function getReserves() view returns (uint, uint, uint)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
]

//getReserves returns 2 uint instead of 3
export const altDexContractAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function getReserves() view returns (uint, uint)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
]

export const tokenContractAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "event Transfer(address indexed src, address indexed dst, uint val)"
]

export const dexAbis = [
    
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/solarDexAbi.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/uniswapDexV3.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/algebraDex.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/beamDex.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/beamV3Dex.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/stellaDexAbi.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/zenlinkDexAbi.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/zenlinkDex2Abi.json'), 'utf8')),
]

export let dexAbiMap = {
    "solar": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/solarDexAbi.json'), 'utf8')),
    "uni3": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/uniswapDexV3.json'), 'utf8')),
    "algebra": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/algebraDex.json'), 'utf8')),
    "beam": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/beamDex.json'), 'utf8')),
    "beam3": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/beamV3Dex.json'), 'utf8')),
    "stella": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/stellaDexAbi.json'), 'utf8')),
    "zenlink": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/zenlinkDexAbi.json'), 'utf8')),
    "zenlink2": JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/zenlinkDex2Abi.json'), 'utf8')),
}

export let xcTokenAbi = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/xcTokenAbi.json'), 'utf8'))
