// SPDX-License-Identifier: UNLICENSED
#[allow(unused_use,unused_const,unused_variable,duplicate_alias,unused_type_parameter,unused_function)]
module orbital::orbital {
    /// @dev sui deps
    use sui::event;
    use sui::sui::{SUI};
    use sui::transfer::{Self};
    use sui::bag::{Self, Bag};
    use sui::coin::{Self, Coin};
    use sui::bcs::to_bytes;
    use sui::object::{Self, UID};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use sui::vec_set::{Self, VecSet};
    use sui::tx_context::{TxContext};
    use sui::vec_map::{Self, VecMap};
    use sui::balance::{Self, Supply, Balance};

    /// @dev price feeds deps
    use supra::SupraSValueFeed::{OracleHolder};

    /// @dev wormhole deps
    use wormhole::bytes::{Self};
    use wormhole::emitter::{Self, EmitterCap};
    use wormhole::state::{State as WormholeState, message_fee};
    use wormhole::publish_message::{prepare_message, publish_message};

    use orbital::coin_utils::{get_coin_id};
    use orbital::price_feeds::{get_price, estimate_from_to, State as PriceFeedState};

    // error codes.
    const ELoanNotActive: u64 = 100;
    const EUnAuthLoan: u64 = 101;
    const EZeroAmount: u64 = 102;
    const EInsufficientAmount: u64 = 103;
    const EAlreadyExecuted: u64 = 104;
    const EPoolAlreadyRegistered: u64 = 105;
    const EMethod: u64 = 106;

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

    const ONE_YEAR: u64 = 10000;

    ////////////////////////////////
    ////        STRUCTS         ////
    ////////////////////////////////
    
    /// The pool with exchange.
    public struct Pool<phantom T> has store {
        state: ID,
        balance: Balance<T>,
        interest_rate: u64
    }

    public struct Loan<phantom X> has key, store {
        id: UID,
        coin_type: u8,
        coin_in_value: u64,
        state: u8,
        start_secs: u64,
    }

    public struct ForeignLoan<phantom Y> has key, store {
        id: UID,
        coin_type: u8,
        coin_out_value: u64,
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
        supported_tokens: VecSet<address>,
        supported_nfts: VecSet<address>,
        emitter_cap: EmitterCap,
        pools: Bag,
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

    ////////////////////////////////
    ////          INITS         ////
    ////////////////////////////////

    public entry fun create_pool<T>(
        owner_cap: &OwnerCap,
        state: &mut State,
        interest_rate: u64,
        ctx: &mut TxContext
    ) {
        assert!(owner_cap.admin == tx_context::sender(ctx), 0);

        let coin_id = get_coin_id<T>();

        let has_registered = bag::contains_with_type<String, Pool<T>>(&state.pools, coin_id);
        assert!(!has_registered, EPoolAlreadyRegistered);

        let new_pool = Pool {
            state: object::uid_to_inner(&state.id),
            balance: balance::zero<T>(),
            interest_rate: interest_rate
        };

        bag::add(&mut state.pools, coin_id, new_pool)
    }

    public entry fun fund_pool<T>(
        owner_cap: &OwnerCap,
        state: &mut State,
        coin: Coin<T>,
        ctx: &mut TxContext
    ) {
        assert!(owner_cap.admin == tx_context::sender(ctx), 0);

        // Get coin pool
        let coin_id = get_coin_id<T>();
        let pool = bag::borrow_mut<String, Pool<T>>(&mut state.pools, coin_id);

        // Get the input coin value.
        let coin_balance: Balance<T> = coin.into_balance();

        balance::join<T>(&mut pool.balance, coin_balance);
    }
    
    public entry fun init_with_params(
        owner_cap: &OwnerCap,
        wormhole_state: &WormholeState, 
        ctx: &mut TxContext
    ) {
        assert!(owner_cap.admin == tx_context::sender(ctx), 0);

        let state: State = State {
            id: object::new(ctx),
            wormhole_nonce: 1,
            executeds: vec_map::empty(),
            orbitals: vec_map::empty(),
            supported_tokens: vec_set::empty(),
            supported_nfts: vec_set::empty(),
            emitter_cap: emitter::new(wormhole_state, ctx),
            pools: bag::new(ctx)
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
        oracle_holder: &OracleHolder,
        supra_state: &mut PriceFeedState,
        the_clock: &Clock,
        to_chain_id: u16,
        coin_gas: Coin<SUI>,
        coin_in: Coin<X>,
        coin_type: u8,
        receiver: address,
        ctx: &mut TxContext
    ) : bool {        
        // Get coin pool
        let coin_id = get_coin_id<Y>();
        let pool = bag::borrow_mut<String, Pool<X>>(&mut state.pools, coin_id);

        // Get the input coin balance.
        let coin_in_balance = coin::into_balance<X>(coin_in);

        // Get the input coin value.
        let coin_in_value: u64 = coin_in_balance.value();

        let sender = tx_context::sender(ctx);

        // Check if the token is supported.
        assert!(
            is_token_supported(
                state.supported_tokens, 
                sender
            ), 
            EUnAuthLoan
        );

        // Increment pool balance.
        balance::join<X>(&mut pool.balance, coin_in_balance);

        // Get input amount equivalent of output amount.
        let amount_out: u64 = estimate_from_to<X,Y>(
            oracle_holder,
            supra_state,
            coin_in_value
        );

        // Calculate amount out with LTV, i.e 80% of the actual value.
        let (loan, _) = split_amount(amount_out, LTV);

        // Convert this orbital address to type bytes32.
        let from_contract_id: address = @orbital;

        // Get the destination orbital address in bytes32.
        let to_contract_id: address = *vec_map::get(&state.orbitals, &to_chain_id);

        // Truncate to seconds.
        let timestamp = clock::timestamp_ms(the_clock) / 1000;

        // Construct a unique loan identifier.
        let mut loan_id: vector<u8> = vector::empty<u8>();
        vector::append(&mut loan_id, to_bytes<address>(&sender));
        vector::append(&mut loan_id, to_bytes<address>(&receiver));
        vector::append(&mut loan_id, to_bytes<u32>(&state.wormhole_nonce));
        vector::append(&mut loan_id, to_bytes<u64>(&timestamp));

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

        // Save loan object to sender.
        transfer::public_transfer(
            Loan<X> {
                id: object::new(ctx),
                coin_type: coin_type,
                coin_in_value: coin_in_value,
                state: LoanStateACTIVE,
                start_secs: timestamp,
            }, 
            sender
        );

        // Update nonce tracker.
        state.wormhole_nonce = state.wormhole_nonce + 1;

        true
    }

    public entry fun repay<Y>(
        state: &mut State,
        coin_gas: Coin<SUI>, // Message fee.
        wormhole_state: &mut WormholeState,
        the_clock: &Clock,
        loan: &mut ForeignLoan<Y>,
        coin_out: Coin<Y>,
        ctx: &mut TxContext
    ) : bool {
        // Get coin pool
        let coin_id = get_coin_id<Y>();
        let pool = bag::borrow_mut<String, Pool<Y>>(&mut state.pools, coin_id);

        // Get the input balance.
        let coin_out_balance = coin::into_balance(coin_out);

        // Calculate the loan interest.
        let interest: u64 = estimate_interest(
            loan.coin_out_value,
            loan.start_secs,
            loan.interest_rate,
            the_clock
        );

        // Calculate the repayment value.
        let amount_in = loan.coin_out_value + interest;

        // Get the input amount.
        let coin_out_value: u64 = coin_out_balance.value();

        // Check if input amount is enough.
        assert!(coin_out_value >= amount_in, EInsufficientAmount);

        // Increment pool balance.
        balance::join<Y>(&mut pool.balance, coin_out_balance);

        // Build an inter-chain message.
        let mut payload = vector::empty<u8>();
        vector::append(&mut payload, ON_REPAY_METHOD);

        // Get wormhole messgase fee.
        let wormhole_fee_value: u64 = message_fee(wormhole_state);
        
        // Get the input gas fee.
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

        // Update loan state.
        loan.state = LoanStateSETTLED;

        true
    }

    // This function receives borrow events from foreign orbitals.
    public entry fun receive_on_borrow<Y>(
        owner_cap: &OwnerCap,
        state: &mut State,
        nonce: u32,
        method: vector<u8>,
        receiver: address,
        coin_out_value: u64,
        coin_type: u8,
        the_clock: &Clock,        
        ctx: &mut TxContext
    ) {
        // Only admin function.
        assert!(owner_cap.admin == tx_context::sender(ctx), 0);

        // Check if message was already executed.
        assert!(
            *vec_map::get(&state.executeds, &nonce) == false,
            EAlreadyExecuted
        );

        // Check the method args is correct.
        assert!(
            method == ON_BORROW_METHOD,
            EMethod
        );

        // Get the execution result.
        let result: bool = on_borrow<Y>(
            state,
            the_clock,
            coin_type,
            coin_out_value,
            receiver,
            ctx
        );

        // Update the execution state.
        state.executeds.insert(nonce, result)
    }

    // This function receives repay events from foreign orbitals.
    public entry fun receive_on_repay<X>(
        owner_cap: &OwnerCap,
        state: &mut State,
        nonce: u32,
        method: vector<u8>,
        receiver: address,
        loan: &mut Loan<X>,
        coin_type: u8,      
        ctx: &mut TxContext
    ) {
        // Only admin function.
        assert!(owner_cap.admin == tx_context::sender(ctx), 0);

        // Check if message was already executed.
        assert!(
            *vec_map::get(&state.executeds, &nonce) == false,
            EAlreadyExecuted
        );

        // Check the method args is correct.
        assert!(
            method == ON_REPAY_METHOD,
            EMethod
        );

        // Get the execution result.
        let result: bool = on_repay<X>(
            state,
            loan,
            coin_type,
            receiver,
            ctx
        );

        // Update the execution state.
        state.executeds.insert(nonce, result)
    }

    ////////////////////////////////
    ////         PRIVATE        ////
    ////////////////////////////////

    fun on_borrow<Y>(
        state: &mut State,
        the_clock: &Clock,
        coin_type: u8,
        coin_out_value: u64,
        receiver: address,
        ctx: &mut TxContext
    ) : bool {
        // Get pool
        let coin_id = get_coin_id<Y>();
        let pool = bag::borrow_mut<String, Pool<Y>>(&mut state.pools, coin_id);

        let coin_out = coin::take<Y>(&mut pool.balance, coin_out_value, ctx);

        // Transfer coins to receiver.
        transfer::public_transfer(coin_out, receiver);
        
        let timestamp = clock::timestamp_ms(the_clock) / 1000;

        // Save loan object to sender.
        transfer::public_transfer(
            ForeignLoan<Y> {
                id: object::new(ctx),
                coin_type: coin_type,
                coin_out_value: coin_out_value,
                state: LoanStateACTIVE,
                start_secs: timestamp,
                interest_rate: pool.interest_rate
            }, 
            receiver
        );

        true
    }

    fun on_repay<X>(
        state: &mut State,
        loan: &mut Loan<X>,
        coin_type: u8,
        receiver: address,
        ctx: &mut TxContext
    ) : bool {
        // Check if loan is still active.
        assert!(
            loan.state == LoanStateACTIVE,
            ELoanNotActive
        );

        // Get pool
        let coin_id = get_coin_id<X>();
        let pool = bag::borrow_mut<String, Pool<X>>(&mut state.pools, coin_id);

        let coin_in = coin::take<X>(&mut pool.balance, loan.coin_in_value, ctx);

        // Transfer coins to receiver.
        transfer::public_transfer(coin_in, receiver);

        loan.state = LoanStateSETTLED;

        true
    }

    /// @dev helper functions

    fun is_token_supported(supported_tokens: VecSet<address>, coin_id: address): bool {
        vec_set::contains(&supported_tokens, &coin_id)
    }

    fun estimate_interest(
        value: u64,
        start_secs: u64,
        interest_rate: u64,
        the_clock: &Clock,
    ) : u64 {
        let timestamp = clock::timestamp_ms(the_clock) / 1000;

        let duration: u64 = timestamp - start_secs;

        let interest: u64 = (value * interest_rate * duration) /
            (100 * ONE_YEAR * 24 * 60 * 60);
        
        interest
    }

    fun split_amount(value: u64, percentage: u8) : (u64, u64) {
        assert!(percentage <= 100, 0);

        let portion: u64 = (value * (percentage as u64)) / 100;
        let remainder: u64 = value - portion;

        (portion, remainder)
    }
}
