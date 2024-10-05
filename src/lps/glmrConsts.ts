import { ethers } from 'ethers'
import path from 'path';
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// import { MyLp } from '../../types.ts';
export const rpc1 = 'wss://moonbeam.public.blastapi.io';
export const rpc2 = 'wss://moonbeam-rpc.dwellir.com'; // Usual main
// const rpc3 = 'wss://moonriver.api.onfinality.io/public-ws';
export const rpc4 = 'wss://moonbeam.unitedbloc.com'
export const testZenContract = "0x94F9EB420174B8d7396A87c27073f74137B40Fe2"
export const united_block_http="https://moonbeam.unitedbloc.com"
export const united_block_ws="wss://moonbeam.unitedbloc.com"

export const RPC_1_HTTP = process.env.RPC_1_HTTPS
export const ON_FINALITY_HTTPS = process.env.ON_FINALITY_HTTPS
export const BLAST_HTTP= process.env.BLAST_HTTP
export const POKT_HTTP= process.env.POKT_HTTP

export const RPC_1_WS = process.env.RPC_1_WS
export const ON_FINALITY_WS = process.env.ON_FINALITY_WS
export const BLAST_WS = process.env.BLAST_WS

export const selectedWsEndpoint = rpc4
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

export const uniFactoryAddress = '0x28f1158795A3585CaAA3cD6469CD65382b89BB70'
export const beamFactoryAddress = '0xD118fa707147c54387B738F54838Ea5dD4196E71'

import solarDexAbi from './glmr_abis/solarDexAbi.json' assert { type: 'json' };
import uniswapDexV3 from './glmr_abis/uniswapDexV3.json' assert { type: 'json' };
import algebraDex from './glmr_abis/algebraDex.json' assert { type: 'json' };
import beamDex from './glmr_abis/beamDex.json' assert { type: 'json' };
import beamV3Dex from './glmr_abis/beamV3Dex.json' assert { type: 'json' };
import stellaDexAbi from './glmr_abis/stellaDexAbi.json' assert { type: 'json' };
import zenlinkDexAbi from './glmr_abis/zenlinkDexAbi.json' assert { type: 'json' };
import zenlinkDex2Abi from './glmr_abis/zenlinkDex2Abi.json' assert { type: 'json' };


export const dexAbis = [
    
    solarDexAbi,
    uniswapDexV3,
    algebraDex,
    beamDex,
    beamV3Dex,
    stellaDexAbi,
    zenlinkDexAbi,
    zenlinkDex2Abi

]

export let dexAbiMap = {
    "solar": solarDexAbi,
    "uni3": uniswapDexV3,
    "algebra": algebraDex,
    "beam": beamDex,
    "beamswap": beamV3Dex,
    "stella": stellaDexAbi,
    "zenlink": zenlinkDexAbi,
    "zenlink2": zenlinkDex2Abi,
}
import xcTokenAbi from './glmr_abis/xcTokenAbi.json' assert { type: 'json' };
export { xcTokenAbi }

import glmrLpsTest1 from './lp_registry/glmr_lps_test_1.json' assert { type: 'json' };
export { glmrLpsTest1 }
// export let xcTokenAbi = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_abis/xcTokenAbi.json'), 'utf8'))
