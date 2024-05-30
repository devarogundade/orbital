// SPDX-License-Identifier: UNLICENSED
#[allow(unused_use,unused_const,unused_variable,duplicate_alias,unused_type_parameter,unused_function)]
module faucet::usdt {
    use std::option;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};

    /// The type identifier of coin. The coin will have a type
    /// tag of kind: `Coin<package_object::mycoin::MYCOIN>`
    /// Make sure that the name of the type matches the module's name.
    public struct USDT has drop {}

    public struct Faucet<phantom USDT> has key {
        id: UID,
        balance: Balance<USDT>
    }

    /// Module initializer is called once on module publish. A treasury
    /// cap is sent to the publisher, who then controls minting and burning
    fun init(witness: USDT, ctx: &mut TxContext) {
        let faucet = Faucet {
              id: object::new(ctx),
              balance: balance::zero<USDT>()
        };

        transfer::share_object(faucet);

        let (treasury, metadata) = coin::create_currency(witness, 9, b"USDT", b"Tether USD", b"", option::none(), ctx);

        transfer::public_freeze_object(metadata);

        transfer::public_transfer(treasury, tx_context::sender(ctx))
    }

    // Testing
    public entry fun init_supply<USDT>(
        treasury_cap: &mut TreasuryCap<USDT>, 
        faucet: &mut Faucet<USDT>,
        ctx: &mut TxContext,
    ) {
        let mut coin = coin::mint(treasury_cap, 100_000_000_000_000_000, ctx);
        let faucet_coin = coin.split(50_000_000_000_000_000, ctx);

        let faucet_balance = faucet_coin.into_balance<USDT>();
        balance::join<USDT>(&mut faucet.balance, faucet_balance);

        transfer::public_transfer(coin, tx_context::sender(ctx))
    }

    // Testing
    public entry fun mint<USDT>(
        faucet: &mut Faucet<USDT>,
        receiver: address,
        ctx: &mut TxContext,
    ) {
        let coin = coin::take<USDT>(&mut faucet.balance, 100_000_000_000, ctx);
        transfer::public_transfer(coin, receiver)
    }
}
