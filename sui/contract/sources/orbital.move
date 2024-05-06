/// Module: orbital
module contract::orbital {
    use sui::clock::{Clock};
    use sui::coin::{Self};
    use sui::object::{Self, UID};
    use sui::transfer::{Self};
    use sui::tx_context::{TxContext};
    use sui::vec_map::{Self, VecMap};
    use sui::vec_set::{Self, VecSet};
    use wormhole::emitter::{Self, EmitterCap};
    use wormhole::state::{State as WormholeState};

    friend contract::pricefeeds;

    /// @notice cross chain method identifier.
    const ON_BORROW_METHOD: vector<u8> =
        0x4f4e5f424f52524f575f4d4554484f4400000000000000000000000000000000;
    const ON_REPAY_METHOD: vector<u8> =
        0x4f4e5f52455041595f4d4554484f440000000000000000000000000000000000;
    const ON_DEFAULT_METHOD: vector<u8> =
        0x4f4e5f44454641554c545f4d4554484f44000000000000000000000000000000;

    /// @notice Loan to value ratio.
    const LTV: u8 = 80; // 80 percent

    /// @notice
    const TokenTypeTOKEN: u8 = 0;

    /// @notice
    const TokenTypeNFT: u8 = 1;

    ////////////////////////////////
    ////        STRUCTS         ////
    ////////////////////////////////

    struct Loan {
        sender: address;
        token_type: u8;
        coin_in: address;
        value: u64;
        state: u8;
        start_secs: u64;
    }

    struct ForeignLoan {
        sender: receiver;
        token_type: u8;
        coin_out: address;
        value: u64;
        state: u8;
        start_secs: u64;
        interest_rate: u64;
    }

    struct State has key, store {
        id: UID;
        wormhole_nonce: u32;
        executeds: VecMap<u32, bool>;
        orbitals: VecMap<u16, address>;
        loans: VecMap<vector<u8>, Loan>;
        foreign_loans: VecMap<vector<u8>, ForeignLoan>;
        interest_rates: VecMap<address, u64>;
        supported_tokens: VecSet<address>;
        supported_nfts: VecSet<address>;
        owner: address;
        emitter_cap: EmitterCap;
    }

    ////////////////////////////////
    ////      CONSTRUCTOR       ////
    ////////////////////////////////

    fun init(ctx: &mut TxContext) {
        transfer::share_object(
            State {
                id: object::new(ctx),
                wormhole_nonce: 1,
                executeds: vec_map::empty(),
                orbitals: vec_map::empty(),
                loans: vec_map::empty(),
                foreign_loans: vec_map::empty(),
                interest_rates: vec_map::empty(),
                supported_tokens: ec_set::empty<u8>(),
                supported_nfts: ec_set::empty<u8>(),
                owner: ctx.sender(),
                emitter_cap: emitter::new(wormhole_state, ctx)
            }
        );
    }

    ////////////////////////////////
    ////        ENTRIES         ////
    ////////////////////////////////

    /// @notice
    public entry fun borrow(
        state: &mut State,
        to_chain_id: u64,
        coin_in: address,
        coin_out: address,
        token_type: u8,
        value: u64,
        receiver: address,
        ctx: &mut TxContext
    ): address {
        let sender = ctx.sender();

        /// @notice Take loan with tokens.
        if (token_type == TokenTypeTOKEN) {
            return borrow_with_tokens(
                state,
                sender, 
                to_chain_id,
                coin_in,
                coin_out,
                token_type,
                value,
                receiver
            );
        }
        /// @notice Take loan with nft.
        else if (token_type == TokenTypeNFT) {
            return borrow_with_nft(
                state,
                sender, 
                to_chain_id,
                coin_in,
                coin_out,
                token_type,
                value,
                receiver
            );
        }
        /// @notice Otherwise throw errors.
        else {
            abort 0;
        }
    }

    /// @dev Private functions for borrow.

    ////////////////////////////////
    ////         BORROW         ////
    ////////////////////////////////
    
    /// @notice
    fun borrow_with_tokens(
        state: &mut State,
        sender: address,
        to_chain_id: u64,
        coin_in: address,
        coin_out: address,
        token_type: u8,
        amouny_in: u64,
        receiver: address
    ): address {
        /// @notice Check if the token is supported.
        assert!(is_token_supported(state.supported_tokens, coin_in), 0);

        /// @notice Extract tokens from sender.
        transfer::public_transfer(coin_in_contract, sender);

        /// @notice Get input amount equivalent of output amount.
        let amount_out = pricefeeds::estimate_from_to(
            coin_in,
            coin_out,
            amouny_in
        );

        /// @notice Calculate amount out with LTV, i.e 80% of the actual value.
        let (loan, _) = split_amount(amount_out, LTV);

        /// @notice Get wormhole messgase fee.
        let wormhole_fee = wormhole::wormhole_fee();

        /// @notice Convert this orbital address to type bytes32.
        let from_contract_id = address::this();

        /// @notice Get the destination orbital address in bytes32.
        let to_contract_id = state.orbitals.get(to_chain_id);

        /// @notice Construct a unique loan identifier.
        let loan_id: vector<u8> = 0x01;

        /// @notice Build an inter-chain message.
        let payload = vector[
            loan_id,
            sender,
            receiver,
            to_chain_id,
            from_contract_id,
            to_contract_id,
            coin_out,
            loan
        ];

        use wormhole::publish_message::{prepare_message, publish_message};

        /// @notice Publish message on wormhole guardian.
        publish_message(
            wormhole_state,
            coin::zero(ctx),
            prepare_message(
                &mut state.emitter_cap,
                wormhole_nonce, 
                payload
            ),
            the_clock
        )

        /// @notice Save loan object.
        state.loans.insert(loan_id, Loan {

        });

        /// @notice Update nonce tracker.
        state.wormhole_nonce = state.wormhole_nonce + 1;

        // @notice Return the laon identifier for external systems.
        return loan_id;
    }


    fun is_token_supported(supported_tokens: vector<address>, coin_id: address): bool {
        let mut index = 0;

        while (index < supported_tokens.lenght()) {
            if (supported_tokens[index] == coin_id) {
                return true;
            }
            index = index + 1;
        }
        
        false
    }
}

