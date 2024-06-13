// SPDX-License-Identifier: UNLICENSED
#[allow(unused_use,unused_const,unused_variable,duplicate_alias,unused_type_parameter,unused_function)]
module orbital::price_feeds {
    use sui::object::UID;
    use sui::vec_map::{Self, VecMap};
    use SupraOracle::SupraSValueFeed::{get_price as get_oracle_price, OracleHolder};
    use std::string::{Self, String};

    use orbital::coin_utils::{get_coin_id};

    /// Error code for when the user has no access.
    const ENoAccess: u64 = 0;

    public struct State has key, store {
        id: UID,
        owner: address,
        price_ids: VecMap<String, u32>,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(
            State {
                id: object::new(ctx),
                owner: ctx.sender(),
                price_ids: vec_map::empty()
            }
        );
    }
    
    /// @dev Only owner can call this function.
    /// @notice
    public entry fun update_feed_id<T>(
        state: &mut State,
        price_id: u32,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == state.owner, ENoAccess);

        let coin_id = get_coin_id<T>();
        
        state.price_ids.insert(coin_id, price_id);
    }

    /// @notice Get coin price.
    public entry fun get_price<T>(
        oracle_holder: &OracleHolder,
        state: &mut State
    ) : u64 {
        let coin_id = get_coin_id<T>();

        let (price, _, _, _) = get_oracle_price(
            oracle_holder, 
            *vec_map::get(&state.price_ids, &coin_id)
        );

        (price as u64)
    }

    /// @notice Get coin amount relative to another coin amount.
    public fun estimate_from_to<X, Y>(
        oracle_holder: &OracleHolder,
        state: &mut State,
        amount_in: u64
    ) : u64 {
        let coin_in = get_coin_id<X>();
        let coin_out = get_coin_id<Y>();

        let (price_in, _, _, _) = get_oracle_price(
            oracle_holder, 
            *vec_map::get(&state.price_ids, &coin_in)
        );

        let (price_out, _, _, _) = get_oracle_price(
            oracle_holder, 
            *vec_map::get(&state.price_ids, &coin_out)
        );

        let amount_out = ((price_in as u64) * amount_in) / (price_out as u64);

        amount_out
    }
}