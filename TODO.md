# Parachains

## LP Registry to add

    - [ ] Composable
    - [ ] Centrifuge
    - [ ] Interlay

## Asset Registry to add

    - [ ] Composable
    - [ ] Centrifuge
    - [ ] Clover
    - [ ] Crust
    - [ ] Darwinia
    - [ ] Interlay -- {Token: INTR/IBTC/DOT}

## Interlay 

XTokens input params
assetRegistry.metadata provides id a number. Native tokens not in assetRegistry
Need to format XToken params as {ForeignAsset: <id>}

consts.currency for native asset id's INT/IBTC/DOT
Native, Relay, and Wrapped currency id's => {Token: <id>}

INTR dexGeneral.swap params are formatted the same.

=> So when adding asset registry, create asset id's with either Token or ForeignAsset keys