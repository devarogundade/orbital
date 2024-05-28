#[allow(unused_let_mut,duplicate_alias,unused_use)]
module faucet::usdt {
    use std::option;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// The type identifier of coin. The coin will have a type
    /// tag of kind: `Coin<package_object::mycoin::MYCOIN>`
    /// Make sure that the name of the type matches the module's name.
    public struct USDT has drop {}

    /// Module initializer is called once on module publish. A treasury
    /// cap is sent to the publisher, who then controls minting and burning
    fun init(witness: USDT, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(witness, 9, b"USDT", b"Tether USD", b"", option::none(), ctx);

        transfer::public_freeze_object(metadata);

        transfer::public_transfer(treasury, tx_context::sender(ctx))
    }

    // Testing
    public entry fun init_supply(
        treasury_cap: &mut TreasuryCap<USDT>, 
        ctx: &mut TxContext,
    ) {
        let coin = coin::mint(treasury_cap, 1_000_000_000_000_000_000, ctx);
        transfer::public_transfer(coin, tx_context::sender(ctx))
    }
}
