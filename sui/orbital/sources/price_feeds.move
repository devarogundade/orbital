module orbital::price_feeds {
    use sui::object::UID;
    use sui::vec_map::{Self, VecMap};
    use supra::SupraSValueFeed::{get_price as get_oracle_price, OracleHolder};

    /// Error code for when the user has no access.
    const ENoAccess: u64 = 0;

    public struct State has key, store {
        id: UID,
        owner: address,
        price_ids: VecMap<address, u32>,
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
    public entry fun update_feed_id(
        state: &mut State,
        coin_id: address, 
        price_id: u32,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == state.owner, ENoAccess);
        
        state.price_ids.insert(coin_id, price_id);
    }

    /// @notice
    public fun get_price(
        oracle_holder: &OracleHolder,
        state: &mut State,
        coin_id: address
    ) : u64 {
        let (price, _, _, _) = get_oracle_price(
            oracle_holder, 
            *vec_map::get(&state.price_ids, &coin_id)
        );

        (price as u64)
    }

    /// @notice
    public fun estimate_from_to(
        oracle_holder: &OracleHolder,
        state: &mut State,
        coin_in: address,
        coin_out: address,
        amount_in: u64
    ) : u64 {
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