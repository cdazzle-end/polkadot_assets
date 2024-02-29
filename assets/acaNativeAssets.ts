export async function getNativeAsset(asset: string): Promise<any> {
    if (asset == "AUSD") {
        const assetLocation = {
            // parents: "1",
            interior: {
                X2: [{
                    Parachain: "2000",
                }, {
                    GeneralKey: "0x0001"
                }]
            }
        }
        return assetLocation;
    }
    if (asset == "ACA") {
        const assetLocation = {
            // parents: "1",
            interior: {
                X2: [{
                    Parachain: "2000",
                }, {
                    GeneralKey: "0x0000"
                }]
            }
        }
        return assetLocation;
    }
    if (asset == "TAP") {
        const assetLocation = {
            // parents: "1",
            interior: {
                X2: [{
                    Parachain: "2000",
                },{
                    GeneralKey: "0x000000"
                }]
            }
        }
        return assetLocation;
    }
    //MIGHT BE WRONG INDEX
    if (asset == "LDOT") {
        const assetLocation = {
            // parents: "1",
            interior: {
                X2: [{
                    Parachain: "2000",
                },{
                    GeneralKey: "0x0003"
                }]
            }
        }
        return assetLocation;
    }
    if (asset == "DOT") {
        const assetLocation = "here";
        return assetLocation;
        
    }
    if (asset == "13") {
        const assetLocation = {
            // parents: "1",
            interior: {
                X2: [{
                    Parachain: "5",
                },{
                    GeneralKey: "0x040d000000000000000000000000000000000000000000000000000000000000"
                }]
            }
        }
        return assetLocation;
    }
    // if (asset == "VSKSM") {
    //     const assetLocation = {
    //         // parents: "1",
    //         interior: {
    //             X2: [{
    //                 Parachain: "2001",
    //             },{
    //                 GeneralKey: "0x0404"
    //             }]
    //         }
    //     }
    //     return assetLocation;
    // }
    // if (asset == "PHA") {
    //     const assetLocation = {
    //         // parents: "1",
    //         interior: {
    //             X1: {
    //                 Parachain: "2004"
    //             }
    //         }
    //     }
    //     return assetLocation;
    // }
    // if (asset == "KINT") {
    //     const assetLocation = {
    //         // parents: "1",
    //         interior: {
    //             X2: [{
    //                 Parachain: "2092",
    //             },{
    //                 GeneralKey: "0x000c"
    //             }]
    //         }
    //     }

    //     return assetLocation;
    // }
    // if (asset == "KBTC") {
    //     const assetLocation = {
    //         // parents: "1",
    //         interior: {
    //             X2: [{
    //                 Parachain: "2092",
    //             },{
    //                 GeneralKey: "0x000b"
    //             }]
    //         }
    //     }

    //     return assetLocation;
    // }
}

//TAIGA DOT AND 3USD
export async function getStableAsset(asset: string): Promise<any> {
    //MIGHT BE WRONG INDEX
    if (asset == "0") {
        const assetLocation = {
            // parents: "1",
            interior: {
                X2: [{
                    Parachain: "2000",
                },{
                    GeneralKey: "0x0085"
                }]
            }
        }
        return assetLocation;
    }
    if (asset == "1") {
        const assetLocation = {
            // parents: "1",
            interior: {
                X2: [{
                    Parachain: "2000",
                },{
                    GeneralKey: "0x0086"
                }]
            }
        }
        return assetLocation;
    }
}