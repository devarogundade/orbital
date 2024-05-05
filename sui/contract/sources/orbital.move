/// Module: orbital
module contract::orbital {
    use sui::clock::{Clock};
    use sui::coin::{Self};
    use sui::object::{Self, UID};
    use sui::transfer::{Self};
    use sui::tx_context::{TxContext};
    use wormhole::emitter::{Self, EmitterCap};
    use wormhole::state::{State as WormholeState};

    struct State has key, store {
        id: UID,
        emitter_cap: EmitterCap,
    }

    public fun borrow(
        to_chain_id: u64,
        coin_in: address,
        coin_out: address,
        token_type: TokenType,
        value: u64,
        receiver: address,
        ctx: &mut TxContext
    ): address {
        let sender = ctx.sender();

        if (token_type == TokenType.TOKEN) {
            return borrow_with_tokens(
                sender, 
                to_chain_id,
                coin_in,
                coin_out,
                token_type,
                value,
                receiver
            );
        }

    }

    /// @dev Private functions for borrow.

    ////////////////////////////////
    ////         BORROW         ////
    ////////////////////////////////
    
    /// @notice
    fun borrow_with_tokens(
        sender: address,
        to_chain_id: u64,
        coin_in: address,
        coin_out: address,
        token_type: TokenType,
        amouny_in: u64,
        receiver: address
    ): address {
        /// @notice Check if the token is supported.
        
        /// @notice Extract tokens from sender.

        /// @notice Get input amount equivalent of output amount.
        let amount_out = pricefeeds::estimate_from_to(
            coin_in,
            coin_out,
            amouny_in
        );

        /// @notice Calculate amount out with LTV, i.e 80% of the actual value.
        let loan = split_amount(amount_out, LTV);

        /// @notice Get wormhole messgase fee.
        let wormhole_fee = wormhole::wormhole_fee();

        /// @notice Convert this orbital address to type bytes32.
        let from_contract_id = address::this();

        /// @notice Get the destination orbital address in bytes32.
        let to_contract_id = _orbitals[to_chain_id];

        /// @notice Construct a unique loan identifier.
        let loan_id = keccak256(
            abi.encode(sender, receiver, _wormholeNonce, block.timestamp)
        );

        /// @notice Build an inter-chain message.
        let payload = abi.encode(
            loan_id,
            sender.addressToBytes32(),
            receiver,
            toChainId,
            fromContractId,
            toContractId,
            tokenOut,
            loan
        );

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
        transfer::transfer(
            Loan {

            }, 
            sender
        );

        /// @notice Update nonce tracker.
        wormhole_nonce = wormhole_nonce + 1;

        // @notice Return the laon identifier for external systems.
        return loan_id;
    }
}

