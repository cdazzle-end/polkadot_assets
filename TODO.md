# Parachains

    - [ ] Create script to collect Kusama assets
    - [ ] Create allAssetsKusamaCollected.json

## LP Registry to add

    - [ ] Composable
    - [ ] Centrifuge
    - [ ] Interlay
    - [ ] Kinstugi
    - [ ] Manta
    - [ ] Pendulum
    - [ ] Polkadex
    - [ ] Amplitude
    - [ ] Zeitgeist
    - [ ] Picasso
    - [ ] Astar
    - [ ] Shiden

## Asset Registry to add

    - [ ] Composable
    - [ ] Centrifuge
    - [ ] Clover
    - [ ] Crust
    - [ ] Darwinia
    - [ ] Interlay -- {Token: INTR/IBTC/DOT}
    - [ ] Phala
    - [ ] Khala
    - [ ] Manta
    - [ ] NeuroWeb
    - [ ] Pendulum
    - [ ] Polkadex
    - [ ] Unique
    - [ ] Quartz
    - [ ] Amplitude
    - [ ] Crust Shadow
    - [ ] Zeitgeist
    - [ ] Picasso
    - [ ] Astar
    - [ ] Shiden

## Interlay 

XTokens input params
assetRegistry.metadata provides id a number. Native tokens not in assetRegistry
Need to format XToken params as {ForeignAsset: <id>}

consts.currency for native asset id's INT/IBTC/DOT
Native, Relay, and Wrapped currency id's => {Token: <id>}

INTR dexGeneral.swap params are formatted the same.

=> So when adding asset registry, create asset id's with either Token or ForeignAsset keys

## Origin Trail

Polkadot parachain => NeuroWeb

## Manta

Evm dexes - Zenlink, Manta

## Pendulum

Zenlink dex

## Polkadex

Assets located in xcmHelper.parachainAssets

## Unique/Quartz

Need to figure out how asset system works. UNQ currencyID === 0