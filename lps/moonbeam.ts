import { ethers } from 'ethers'
import * as fs from 'fs';  
import readline from 'readline';
import path from 'path';
// import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation } from '../asset_types';
import { parse } from 'path'
// import { formatUnits } from 'ethers/lib/utils';
// import {hexToDec2, decToHex2} from '../../parachains/hex'
import { ApiPromise, WsProvider } from '@polkadot/api';
// import { } from '@moonbeam-network/api-augment/moonriver/interfaces';
// const apiHelper = require('../parachains/api_utils')
// import apiHelper from '../parachains/api_utils'
// import Keyring from '@polkadot/keyring';
// import { u8aToHex, stringToHex, numberToHex } from '@polkadot/util';
// import { mnemonicToLegacySeed, hdEthereum } from '@polkadot/util-crypto';
import { MyLp } from '../types';
const rpc1 = 'wss://moonbeam.public.blastapi.io';
const rpc2 = 'wss://moonbeam-rpc.dwellir.com';
// const rpc3 = 'wss://moonriver.api.onfinality.io/public-ws';
const rpc4 = 'wss://moonbeam.unitedbloc.com'

// const providerRPC = {
//     moonriver: {
//         name: 'moonriver',
//         rpc: rpc2, // Insert your RPC URL here
//         chainId: 1285, // 0x505 in hex,
//     },
// };
// const provider = new ethers.JsonRpcProvider(
//     providerRPC.moonriver.rpc,
//     {
//         chainId: providerRPC.moonriver.chainId,
//         name: providerRPC.moonriver.name,
//     }
// );
const provider = new ethers.WebSocketProvider(rpc2);
const dexContractAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function getReserves() view returns (uint, uint, uint)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
]

//getReserves returns 2 uint instead of 3
const altDexContractAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function getReserves() view returns (uint, uint)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
]

const tokenContractAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "event Transfer(address indexed src, address indexed dst, uint val)"
]




export async function updateLps() {
    
    const lps = JSON.parse(fs.readFileSync('./glmr_holders/lps_base.json', 'utf8'))
    const asseRegistry = JSON.parse(fs.readFileSync('../assets/asset_registry/glmr_assets.json', 'utf8'))
    lps.map((lp: any) => {
        const token0 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[0].toLowerCase() )
        const token1 = asseRegistry.find((asset: any) => asset.tokenData.contractAddress.toLowerCase() == lp.poolAssets[1].toLowerCase() )
        // if(token0){
        //     console.log(`Token0: ${token0.tokenData.localId}`)
        // } 
        // if(token1) {
        //     console.log(`Token1: ${token1.tokenData.localId}`)
        // }
        lp.poolAssets = [token0? token0.tokenData.localId : lp.poolAssets[0], token1? token1.tokenData.localId : lp.poolAssets[1]]
    })

    const updatedLps = (await Promise.all(lps.map(async (lp: any) => {
        
        const pool = await new ethers.Contract(lp.contractAddress, altDexContractAbi, provider);
        let reserves = await pool.getReserves();
        // let reserve_0 = removeLastChar(reserves[0].toString());
        // let reserve_1 = removeLastChar(reserves[1].toString());
        let reserve_0 = reserves[0].toString();
        let reserve_1 = reserves[1].toString();
        if (reserve_0 !== "" && reserve_1 !== "") {
            const newPool: MyLp = {
                chainId: 2004,
                contractAddress: lp.contractAddress,
                poolAssets: lp.poolAssets,
                liquidityStats: [reserve_0, reserve_1]
            };
            return newPool;
        }
    }))).filter(pool => pool != null); // Filter out null entries
    fs.writeFileSync(path.join(__dirname, './lp_registry/glmr_lps.json'), JSON.stringify(updatedLps, null, 2))
    provider.destroy()

}

async function saveLps() {
    const lpContractAddresses = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/confirmed_lps.json'), 'utf8'))
    const lps = await Promise.all(lpContractAddresses.map(async (lpContract: any) => {
        // console.log(lpContract)
        const pool = await new ethers.Contract(lpContract, altDexContractAbi, provider);
        let reserves = await pool.getReserves();
        const token0 = await pool.token0();
        const token1 = await pool.token1();
        console.log(reserves)
        // let reserve_0 = await hexToDec(reserves[0]["_hex"]);
        // let reserve_1 = await hexToDec(reserves[1]["_hex"]);
        let reserve_0 = reserves[0].toString();
        let reserve_1 = reserves[1].toString();
        let newliquidityStats = [reserve_0, reserve_1];
        const newPool: MyLp = {
            chainId: 2004,
            contractAddress: lpContract,
            poolAssets: [token0, token1],
            liquidityStats: newliquidityStats
        }
        return newPool;
    }))
    console.log(lps)
    fs.writeFileSync(path.join(__dirname, './glmr_holders/lps_base.json'), JSON.stringify(lps, null, 2))
}



async function lpList() {
    const lps = JSON.parse(fs.readFileSync('./liq_pool_registry', 'utf8')).map((lp: any) => {
        return lp.contractAddress
    })
    fs.writeFileSync('./lp_contracts', JSON.stringify(lps, null, 2))
}

async function getLpContracts() {

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
//From list of top wsdn holders, get list of dexs
async function getGlmrLiqPools() {

    let glmrAddresses = JSON.parse(fs.readFileSync('./token_holders_parsed/glmr_token_holders.json', 'utf8'))
    console.log(glmrAddresses)

    let reservesAll = []
    await queryAndCollectAddressesInBatches(glmrAddresses, 100)
}
async function getOtherLiqPools() {
    let directoryPath = path.join(__dirname, './token_holders_parsed');
    let fileNames = fs.readdirSync(directoryPath)
    let allAddresses = []
    for (let file of fileNames) {
        let filePath = path.join(directoryPath, file);
        let addresses = JSON.parse(fs.readFileSync(filePath, 'utf8')).slice(1)
        addresses.forEach((address: any) => {
            allAddresses.push(address)
        })
    }

    await queryAndCollectOtherAddressesInBatches(allAddresses, 100)
}
function readGlmrLps(){
    let lps = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/glmr_lps.json'), 'utf8'))
    return lps
}
function readOtherLps(){
    let lps = JSON.parse(fs.readFileSync(path.join(__dirname, './glmr_holders/other_lps.json'), 'utf8'))
    return lps
}

function addAddressesToGlmrLp(lpResults: any[]){
    let lps = readGlmrLps()
    lpResults.forEach(([lpAddress, result]) => {
        if(!lps[lpAddress] || lps[lpAddress] == false){
            lps[lpAddress] = result
        }
    })
    fs.writeFileSync(path.join(__dirname, './glmr_holders/glmr_lps.json'), JSON.stringify(lps, null, 2))
}
function addAddressesToOtherLp(lpResults: any[]){
    let lps = readOtherLps()
    lpResults.forEach(([lpAddress, result]) => {
        if(!lps[lpAddress] || lps[lpAddress] == false){
            lps[lpAddress] = result
        }
    })
    fs.writeFileSync(path.join(__dirname, './glmr_holders/other_lps.json'), JSON.stringify(lps, null, 2))
}

async function queryAndCollectAddressesInBatches(addresses, batchSize) {
    const lpAddresses = [];
    let addressesToCheck = []
    let glmrLps = readGlmrLps()
    addresses.forEach((address: any) => {
        if(!glmrLps[address] || glmrLps[address] == false){
            addressesToCheck.push(address)
        }
    })
    for (let i = 0; i < addressesToCheck.length; i += batchSize) {
        const batch = addressesToCheck.slice(i, i + batchSize);
        console.log(`Processing batch from ${i} to ${i + batchSize}`);
        
        // Map each address in the batch to a promise that resolves to the address or null
        const results = await Promise.all(batch.map(async (currentAddress) => {
            try {
                let contract = new ethers.Contract(currentAddress.toLowerCase(), altDexContractAbi, provider);
                await contract.getReserves(); // Attempt to fetch reserves
                return [currentAddress.toLowerCase(),true]; // Return address on success
            } catch (e) {
                console.log(`${currentAddress} is not an LP address or failed to fetch reserves: ${e.message}`);
                return [currentAddress.toLowerCase(),false]; // Return null on failure
            }
        }));
        console.log(results)
        addAddressesToGlmrLp(results)
        // Filter out nulls and add successful addresses to lpAddresses
        lpAddresses.push(...results.filter(address => address !== null));
    }

    console.log("LP Addresses:", lpAddresses);
    return lpAddresses;
}

async function queryAndCollectOtherAddressesInBatches(addresses, batchSize) {
    const lpAddresses = [];
    let addressesToCheck = []
    let otherLps = readOtherLps()
    addresses.forEach((address: any) => {
        if(!otherLps[address] || otherLps[address] == false){
            addressesToCheck.push(address)
        }
    })
    for (let i = 0; i < addressesToCheck.length; i += batchSize) {
        const batch = addressesToCheck.slice(i, i + batchSize);
        console.log(`Processing batch from ${i} to ${i + batchSize}`);
        
        // Map each address in the batch to a promise that resolves to the address or null
        const results = await Promise.all(batch.map(async (currentAddress) => {
            try {
                let contract = new ethers.Contract(currentAddress.toLowerCase(), altDexContractAbi, provider);
                await contract.getReserves(); // Attempt to fetch reserves
                console.log("contract true with normal abi")
                return [currentAddress.toLowerCase(),true]; // Return address on success

            } catch (e) {
                try{
                    let contract = new ethers.Contract(currentAddress.toLowerCase(), dexContractAbi, provider);
                    await contract.getReserves(); // Attempt to fetch reserves
                    console.log("CONTRACT TRUE WITH ALT ABI")
                    return [currentAddress.toLowerCase(),true]; // Return address on success
                } catch (e) {
                    // console.log(`${currentAddress} is not an LP address or failed to fetch reserves: ${e.message}`);
                    return [currentAddress.toLowerCase(),false]; // Return null on failure
                }
                
            }
        }));
        // console.log(results)
        addAddressesToOtherLp(results)
        // Filter out nulls and add successful addresses to lpAddresses
        lpAddresses.push(...results.filter(address => address !== null));
    }

    console.log("LP Addresses:", lpAddresses);
    return lpAddresses;
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

    let contract = new ethers.Contract(dexAddress, altDexContractAbi, provider);

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

async function main() {
    // await updateLps()
    // await parseCSVFilesInDirectory()
    // await getGlmrLiqPools()
    // await getOtherLiqPools()
    // await writeConfirmedLpAddresses()
    // await saveLps()
    await updateLps()
    // await getPool()
    process.exit(0)
}

main()

// Adds two arrays for the given base (10 or 16), returning the result.
// This turns out to be the only "primitive" operation we need.
function add(x: any, y: any, base: any) {
    var z: any = [];
    var n = Math.max(x.length, y.length);
    var carry = 0;
    var i = 0;
    while (i < n || carry) {
        var xi = i < x.length ? x[i] : 0;
        var yi = i < y.length ? y[i] : 0;
        var zi = carry + xi + yi;
        z.push(zi % base);
        carry = Math.floor(zi / base);
        i++;
    }
    return z;
}

// Returns a*x, where x is an array of decimal digits and a is an ordinary
// JavaScript number. base is the number base of the array x.
function multiplyByNumber(num: any, x: any, base: any) {
    if (num < 0) return null;
    if (num == 0) return [];

    var result = [];
    var power = x;
    while (true) {
        if (num & 1) {
            result = add(result, power, base);
        }
        num = num >> 1;
        if (num === 0) break;
        power = add(power, power, base);
    }

    return result;
}

function parseToDigitsArray(str: any, base: any) {
    var digits = str.split('');
    var ary: any = [];
    for (var i = digits.length - 1; i >= 0; i--) {
        var n = parseInt(digits[i], base);
        if (isNaN(n)) return null;
        ary.push(n);
    }
    return ary;
}

function convertBase(str: any, fromBase: any, toBase: any) {
    var digits = parseToDigitsArray(str, fromBase);
    if (digits === null) return null;

    var outArray: any = [];
    var power: any = [1];
    for (var i = 0; i < digits.length; i++) {
        // invariant: at this point, fromBase^i = power
        if (digits[i]) {
            outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase);
        }
        power = multiplyByNumber(fromBase, power, toBase);
    }

    var out: any = '';
    for (var i = outArray.length - 1; i >= 0; i--) {
        out += outArray[i].toString(toBase);
    }
    return out;
}

async function decToHex(decStr: any) {
    var hex = convertBase(decStr, 10, 16);
    return hex ? '0x' + hex : null;
}

async function hexToDec(hexStr: any) {
    console.log(hexStr)
    if (hexStr.substring(0, 2) === '0x') hexStr = hexStr.substring(2);
    hexStr = hexStr.toLowerCase();
    return convertBase(hexStr, 16, 10);
}

function removeLastChar(str: string) {
    return str.slice(0, -1);
}