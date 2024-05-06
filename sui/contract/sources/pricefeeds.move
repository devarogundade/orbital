/// Module: pricefeeds
module contract::pricefeeds { 
    use SupraOracle::SupraSValueFeed::{get_price, get_prices, extract_price, OracleHolder, Price};
    use sui::vec_map::{Self, VecMap};

    const BTC_INDEX: u32 = 0;
    const ETH_INDEX: u32 = 1;
    const XRP_INDEX: u32 = 14;
    const ADA_INDEX: u32 = 16;
    const MATIC_INDEX: u32 = 20;
    
    /// Error code for when the user has no access.
    const ENoAccess: u64 = 0;

    struct State has key, store {
        id: UID;
        owner: address;
        price_ids = VecMap<address, address>;
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
        price_id: address, 
        ctx: &mut TxContext
    ) {
        assert(ctx.sender() == state.owner, ENoAccess);
        
        state.price_ids.insert(coin_id, price_id);
    }

    /// @notice
    public fun get_price(state: State, coin_id: address): u64 {
        let price = pyth::get_price(state.price_ids.get(&coin_id));
        return price.price;
    }

    /// @notice
    public fun estimate_from_to(
        state: State,
        coin_in: address,
        coin_out: address,
        amount_in: u64
    ): u64 {
        let priceIn = pyth::get_price(state.price_ids.get(&coin_in));
        let priceOut = pyth::get_price(state.price_ids.get(&coin_out));

        return ((priceIn.price * amountIn) / priceOut.price);
    }
}

