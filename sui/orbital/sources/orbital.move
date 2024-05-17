module orbital::orbital {
    /// @dev sui deps
    use sui::event;
    use sui::sui::{SUI};
    use sui::transfer::{Self};
    use sui::coin::{Self, Coin};
    use sui::object::{Self, UID};
    use sui::clock::{Self, Clock};
    use sui::vec_set::{Self, VecSet};
    use sui::tx_context::{TxContext};
    use sui::vec_map::{Self, VecMap};
    use sui::balance::{Self, Supply, Balance};

    /// @dev price feeds deps
    use supra::SupraSValueFeed::{OracleHolder};
    use price_feeds::main::{get_price, estimate_from_to, State as SupraState};

    /// @dev wormhole deps
    use wormhole::bytes::{Self};
    use wormhole::emitter::{Self, EmitterCap};
    use wormhole::state::{State as WormholeState, message_fee};
    use wormhole::publish_message::{prepare_message, publish_message};

    use orbital::coin_utils::{take_balance};

    // error codes.
    const ELoanNotActive: u64 = 100;
    const EUnAuthLoan: u64 = 101;
    const EZeroAmount: u64 = 102;

    // cross chain method identifier.
    const ON_BORROW_METHOD: vector<u8> =
        vector[79, 78, 95, 66, 79, 82, 82, 79, 87, 95, 77, 69, 84, 72, 79, 68];
    const ON_REPAY_METHOD: vector<u8> =
        vector[79, 78, 95, 82, 69, 80, 65, 89, 95, 77, 69, 84, 72, 79, 68];
    const ON_DEFAULT_METHOD: vector<u8> =
        vector[79, 78, 95, 68, 69, 70, 65, 85, 76, 84, 95, 77, 69, 84, 72, 79, 68];

    // Loan to value ratio.
    const LTV: u8 = 80; // 80 percent

    // Coin Types
    const CoinTypeTOKEN: u8 = 0;
    const CoinTypeNFT: u8 = 1;

    // Loan States
    const LoanStateNONE: u8 = 0;
    const LoanStateACTIVE: u8 = 1;
    const LoanStateSETTLED: u8 = 2;
    const LoanStateDEFAULTED: u8 = 3;

    ////////////////////////////////
    ////        STRUCTS         ////
    ////////////////////////////////

    public struct Loan<phantom X> has key, store {
        id: UID,
        token_type: u8,
        coin_in: Balance<X>,
        state: u8,
        start_secs: u64,
    }

    public struct ForeignLoan<phantom Y> has key, store {
        id: UID,
        token_type: u8,
        coin_out: Balance<Y>,
        state: u8,
        start_secs: u64,
        interest_rate: u64,
    }

    public struct OwnerCap has key {
       id: UID,
       admin: address
    }

    public struct State has key, store {
        id: UID,
        wormhole_nonce: u32,
        executeds: VecMap<u32, bool>,
        orbitals: VecMap<u16, address>,
        interest_rates: VecMap<address, u64>,
        supported_tokens: VecSet<address>,
        supported_nfts: VecSet<address>,
        vault: address,
        emitter_cap: EmitterCap,
        price_feeds_oracle_holder: OracleHolder,
        price_feeds_state: SupraState
    }

    ////////////////////////////////
    ////      CONSTRUCTOR       ////
    ////////////////////////////////
    
    fun init(ctx: &mut TxContext) {
        let owner_cap: OwnerCap = OwnerCap {
            id: object::new(ctx),
            admin: tx_context::sender(ctx)
        };

        transfer::share_object(owner_cap)
    }
    
    public entry fun init_with_params(
        owner_cap: &mut OwnerCap,
        wormhole_state: &WormholeState, 
        price_feeds_oracle_holder: OracleHolder,
        price_feeds_state: SupraState,
        ctx: &mut TxContext
    ) {
        assert!(owner_cap.admin == tx_context::sender(ctx), 0);

        let state: State = State {
            id: object::new(ctx),
            wormhole_nonce: 1,
            executeds: vec_map::empty(),
            orbitals: vec_map::empty(),
            interest_rates: vec_map::empty(),
            supported_tokens: vec_set::empty(),
            supported_nfts: vec_set::empty(),
            vault: ctx.sender(),
            emitter_cap: emitter::new(wormhole_state, ctx),
            price_feeds_oracle_holder: price_feeds_oracle_holder,
            price_feeds_state: price_feeds_state
        };

        transfer::share_object(state)
    }

    ////////////////////////////////
    ////         ENTRIES        ////
    ////////////////////////////////

    /// @notice
    public entry fun borrow<X, Y>(
        state: &mut State,
        wormhole_state: &mut WormholeState,
        the_clock: &Clock,
        to_chain_id: u16,
        coin_gas: Coin<SUI>,
        coin_in: Coin<X>,
        token_type: u8,
        receiver: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        // Take loan with tokens.
        if (token_type == CoinTypeTOKEN) {
            borrow_with_coins<X, Y>(
                state,
                wormhole_state,
                the_clock,
                sender, 
                to_chain_id,
                coin_gas,
                coin_in,
                token_type,
                receiver,
                ctx
            );
        };
        
        // if (token_type == CoinTypeTOKEN) {
        //     borrow_with_non_coins<X, Y>(
        //         state,
        //         wormhole_state,
        //         the_clock,
        //         sender, 
        //         to_chain_id,
        //         coin_gas,
        //         coin_in,
        //         token_type,
        //         receiver,
        //         ctx
        //     );
        // };

        abort 0
    }

    

    // /// @dev Private functions for borrow.

    // ////////////////////////////////
    // ////         BORROW         ////
    // ////////////////////////////////
    
    /// @notice
    fun borrow_with_coins<X, Y>(
        state: &mut State,
        wormhole_state: &mut WormholeState,
        the_clock: &Clock,
        sender: address,
        to_chain_id: u16,
        coin_gas: Coin<SUI>, // Message fee.
        coin_in: Coin<X>, // Extract coins from sender.
        token_type: u8,
        receiver: address,
        ctx: &mut TxContext
    ) : bool {
        // Check if the token is supported.
        assert!(
            is_token_supported(
                state.supported_tokens, 
                sender
            ), 
            EUnAuthLoan
        );

        // Get the input coin value.
        let coin_in_value: u64 = coin::value(&coin_in);

        // Get the input coin balance.
        let coin_in_balance = coin::into_balance<X>(coin_in);

        // Transfer coin in to vault.
        transfer::public_transfer<Coin<X>>(coin_in, state.vault);

        // Get input amount equivalent of output amount.
        let amount_out: u64 = estimate_from_to(
            &state.price_feeds_oracle_holder,
            &mut state.price_feeds_state,
            sender, // coin in address
            receiver, // coin out address
            coin_in_value
        );

        // Calculate amount out with LTV, i.e 80% of the actual value.
        let (loan, _) = split_amount(amount_out, LTV);

        // Convert this orbital address to type bytes32.
        // let from_contract_id: address = 0xe51ff5cd221a81c3d6e22b9e670ddf99004d71de4f769b0312b68c7c4872e2f1;

        // Get the destination orbital address in bytes32.
        let to_contract_id: address = *vec_map::get(&state.orbitals, &to_chain_id);

        // Construct a unique loan identifier.
        let mut loan_id: vector<u8> = vector::empty<u8>();
        vector::push_back(&mut loan_id, 0);

        // Build an inter-chain message.
        let mut payload = vector::empty<u8>();
        vector::append(&mut payload, ON_BORROW_METHOD);

        // Get wormhole messgase fee.
        let wormhole_fee_value: u64 = message_fee(wormhole_state);

        let coin_gas_value = coin::value(&coin_gas);

        // Check the input coin value is enough for message fee.
        assert!(coin_gas_value >= wormhole_fee_value, EZeroAmount);

        // Publish message on wormhole guardian.
        publish_message(
            wormhole_state,
            coin_gas, // Pay wormhole message fee.
            prepare_message(
                &mut state.emitter_cap, 
                state.wormhole_nonce, 
                payload
            ),
            the_clock
        );

        // Truncate to seconds.
        let timestamp = clock::timestamp_ms(the_clock) / 1000;

        // Save loan object to sender.
        transfer::public_transfer(
            Loan<X> {
                id: object::new(ctx),
                token_type: token_type,
                coin_in: coin_in_balance,
                state: LoanStateACTIVE,
                start_secs: timestamp,
            }, 
            sender
        );

        // Update nonce tracker.
        state.wormhole_nonce = state.wormhole_nonce + 1;

        true
    }

    /// @notice
    // fun borrow_with_non_coins<X, Y>(
    //     state: &mut State,
    //     wormhole_state: &mut WormholeState,
    //     the_clock: &Clock,
    //     sender: address,
    //     to_chain_id: u16,
    //     coin_gas: Coin<SUI>,
    //     coin_in: Coin<X>,
    //     token_type: u8,
    //     receiver: address,
    //     ctx: &mut TxContext
    // ): bool { 
    //     true
    // }

    /// @dev helper functions

    fun is_token_supported(supported_tokens: VecSet<address>, coin_id: address): bool {
        vec_set::contains(&supported_tokens, &coin_id)
    }

    fun split_amount(value: u64, percentage: u8) : (u64, u64) {
        assert!(percentage <= 100, 0);

        let portion: u64 = (value * (percentage as u64)) / 100;
        let remainder: u64 = value - portion;

        (portion, remainder)
    }
}
