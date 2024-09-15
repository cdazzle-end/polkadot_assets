import { updateLpsWithMap } from './dist/index.mjs'

async function main(){
    await updateLpsWithMap(true, "polkadot")
}

main()