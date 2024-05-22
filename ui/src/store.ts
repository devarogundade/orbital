import type { InjectionKey } from 'vue';
// @ts-ignore
import { createStore, Store } from 'vuex';

// define your typings for the store state
export interface State {
    ethAddress: string;
    suiAddress: string;
}

// define injection key
export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
    state: {
        ethAddress: null,
        suiAddress: null,
    },
    mutations: {
        setEthAddress(state: State, newAddress: string) {
            state.ethAddress = newAddress;
        },
        setSuiAddress(state: State, newAddress: string) {
            state.suiAddress = newAddress;
        },
    }
});