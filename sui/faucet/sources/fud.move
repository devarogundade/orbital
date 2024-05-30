// SPDX-License-Identifier: UNLICENSED
#[allow(unused_use,unused_const,unused_variable,duplicate_alias,unused_type_parameter,unused_function)]
module faucet::fud {
    use std::option;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};

    /// The type identifier of coin. The coin will have a type
    /// tag of kind: `Coin<package_object::mycoin::MYCOIN>`
    /// Make sure that the name of the type matches the module's name.
    public struct FUD has drop {}

    public struct Faucet<phantom FUD> has key {
        id: UID,
        balance: Balance<FUD>
    }

    /// Module initializer is called once on module publish. A treasury
    /// cap is sent to the publisher, who then controls minting and burning
    fun init(witness: FUD, ctx: &mut TxContext) {
        let faucet = Faucet {
            id: object::new(ctx),
            balance: balance::zero<FUD>()
        };

        transfer::share_object(faucet);

        let (treasury, metadata) = coin::create_currency(witness, 9, b"FUD", b"Fud the Pug", b"", option::none(), ctx);

        transfer::public_freeze_object(metadata);

        transfer::public_transfer(treasury, tx_context::sender(ctx))
    }

    // Testing
    public entry fun init_supply<FUD>(
        treasury_cap: &mut TreasuryCap<FUD>,
        faucet: &mut Faucet<FUD>, 
        ctx: &mut TxContext,
    ) {
        let mut coin = coin::mint(treasury_cap, 10_000_000_000_000_000_000, ctx);
        let faucet_coin = coin.split(5_000_000_000_000_000_000, ctx);

        let faucet_balance = faucet_coin.into_balance<FUD>();
        balance::join<FUD>(&mut faucet.balance, faucet_balance);

        transfer::public_transfer(coin, tx_context::sender(ctx))
    }

    // Testing
    public entry fun mint<FUD>(
        faucet: &mut Faucet<FUD>,
        receiver: address,
        ctx: &mut TxContext,
    ) {
        let coin = coin::take<FUD>(&mut faucet.balance, 50_000_000_000_000_000, ctx);
        transfer::public_transfer(coin, receiver)
    }
}
