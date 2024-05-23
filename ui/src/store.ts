import type { InjectionKey } from 'vue';
// @ts-ignore
import { createStore, Store } from 'vuex';

// define your typings for the store state
export interface State {
    ethAddress: string;
    suiAddress: string;
    suiAdapter: any;
}

// define injection key
export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
    state: {
        ethAddress: null,
        suiAddress: null,
        suiAdapter: null
    },
    mutations: {
        setEthAddress(state: State, newAddress: string) {
            state.ethAddress = newAddress;
        },
        setSuiAddress(state: State, newAddress: string) {
            state.suiAddress = newAddress;
        },
        setSuiAdapter(state: State, newAdapter: string) {
            state.suiAdapter = newAdapter;
        },
    }
});