<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { chain, token } from '@/scripts/chains';
import { addressToBytes32, defaultInterestRate, ethBorrow, ethRepay, getAmountOut, ORBITAL_AVAX, suiBorrow, suiRepay } from '@/scripts/loan';
import Converter from '@/scripts/converter';
// @ts-ignore
import { useStore } from 'vuex';
import { key } from '../store';
import { LoanState, type Loan } from '@/types';
import { getAllLoans, saveNewLoan, setLoanAsSettled, removeLoan, listen, incrementPoints } from '@/scripts/storage';
import { approve, getAllowance, getTokenBalance } from '@/scripts/erc20';
import { notify } from '@/reactives/notify';
import { getCoinBalances } from "@/scripts/blockeden";
import ArrowDownIcon from "@/components/icons/ArrowDownIcon.vue";
import InterChangeIcon from "@/components/icons/InterChangeIcon.vue";
import SettingsIcon from "@/components/icons/SettingsIcon.vue";

const emit = defineEmits(['close']);

const store = useStore(key);

const allowance = ref<String>('0');
const approving = ref<boolean>(false);
const borrowing = ref<boolean>(false);
const repaying = ref<string | null>(null);
const ethBalances = ref({ usdt: BigInt(0), fud: BigInt(0) });
const suiBalances = ref({ usdt: '0', fud: '0' });

const fromChaining = ref(false);
const fromTokening = ref(false);
const toChaining = ref(false);
const toTokening = ref(false);

const LTV = 80;

const loan = ref<Loan>({
  loanId: null,
  amountIn: null,
  amountOut: null,
  tokenType: 0,
  fromChainId: 6,
  toChainId: 21,
  collateral: 'USDT',
  principal: 'FUD',
  interchange: false,
  interestRate: null, // will be injected later
  startSecs: null, // will be injected later
  fromHash: null, // will be injected later
  sender: null, // will be injected later
  state: LoanState.NONE
});

const myLoans = ref<Loan[]>([]);

watch(
  loan,
  () => {
    updateAllowance();
    updateAmountOut();
  },
  { deep: true, }
);

const updateLoans = async () => {
  // update all loans.
  if (store.state.suiAddress && store.state.ethAddress) {
    myLoans.value = await getAllLoans(store.state.suiAddress, store.state.ethAddress);
  }
};

const updateBalances = async () => {
  if (store.state.suiAddress) {
    const balances = await getCoinBalances(store.state.suiAddress);

    if (!balances) return;

    const usdtBalance = balances.find((b: any) => b.coinType == token(loan.value.collateral)!.addresses[21]);
    const fudBalance = balances.find((b: any) => b.coinType == token(loan.value.principal)!.addresses[21]);

    if (usdtBalance) {
      suiBalances.value.usdt = usdtBalance.totalBalance;
    }

    if (fudBalance) {
      suiBalances.value.fud = fudBalance.totalBalance;
    }
  }

  if (store.state.ethAddress) {
    ethBalances.value.usdt = await getTokenBalance(
      token(loan.value.collateral)!.addresses[6] as `0x${string}`,
      store.state.ethAddress
    );

    ethBalances.value.fud = await getTokenBalance(
      token(loan.value.principal)!.addresses[6] as `0x${string}`,
      store.state.ethAddress
    );
  }
};

const updateAllowance = async () => {
  if (loan.value.fromChainId == 21) {
    allowance.value = "1000000000000000000000000000";
    return;
  }

  if (store.state.ethAddress) {
    try {
      allowance.value = Converter.fromWei(
        await getAllowance(
          token(loan.value.collateral)!.addresses[6] as `0x${string}`,
          store.state.ethAddress,
          ORBITAL_AVAX
        )
      );
    } catch (error) {
      console.log(error);
    }
  }
};

const updateAmountOut = async () => {
  if (!loan.value.amountIn) {
    loan.value.amountOut = null;
    return;
  }

  const amountOut = await getAmountOut(
    addressToBytes32(token(loan.value.collateral)!.addresses[6]),
    addressToBytes32(token(loan.value.principal)!.addresses[6]),
    Converter.toWei(loan.value.amountIn!.toString()),
    LTV
  );

  loan.value.amountOut = Number(Number(Converter.fromWei(amountOut)).toFixed(2));
};

const approveOrbital = async (borrowAfter: boolean = false) => {
  if (approving.value || !loan.value.amountIn) return;
  approving.value = true;

  const hash = await approve(
    token(loan.value.collateral)!.addresses[6] as `0x${string}`,
    ORBITAL_AVAX,
    Converter.toWei(loan.value.amountIn!.toString())
  );

  if (hash) {
    notify.push({
      title: 'Approval successful.',
      description: 'Transaction was sent.',
      category: 'success',
      linkTitle: 'View Trx',
      linkUrl: `https://testnet.snowtrace.io/tx/${hash}`
    });

    emit('close');
  } else {
    notify.push({
      title: 'Failed to send transaction.',
      description: 'Try again.',
      category: 'error'
    });
  }

  approving.value = false;

  updateAllowance();

  if (borrowAfter) {
    borrow();
  }
};

const estimateInterest = (
  loan: Loan, withDelayEffect: boolean
): number => {
  let delaySecs = 0;

  if (withDelayEffect) {
    delaySecs += 10 * 60 * 60 * 1000; // extra seconds
  }

  const timestamp = Date.now() / 1000;
  const duration = (timestamp + delaySecs) - loan.startSecs!;

  const ONE_YEAR = 31_536_000;

  let value = loan.fromChainId == 21 ?
    Converter.toWei(loan.amountOut!) :
    Converter.toGwei(loan.amountOut!);

  let interest: number = (value * loan.interestRate! * duration)
    / (100 * ONE_YEAR * 24 * 60 * 60);

  return interest;
};

const interchange = () => {
  let toTemp: number | null = loan.value.toChainId;

  loan.value.toChainId = loan.value.fromChainId;
  loan.value.fromChainId = toTemp;
  loan.value.interchange = !loan.value.interchange;

  toTemp = null;

  // Refresh balances
  updateBalances();
};

const borrow = async () => {
  if (!store.state.ethAddress || !store.state.suiAddress) {
    notify.push({
      title: 'Connect your wallets first!',
      description: 'Then try again.',
      category: 'error'
    });
    return;
  }

  if (borrowing.value) {
    return;
  }

  if (!loan.value.amountIn || loan.value.amountIn == 0) {
    notify.push({
      title: 'Enter a valid amount!',
      description: 'Then try again.',
      category: 'error'
    });
    return;
  }

  // Check for Avalanche
  if (loan.value.fromChainId == 6) {
    borrowing.value = true;

    const hash = await ethBorrow(
      loan.value.toChainId,
      addressToBytes32(token(loan.value.collateral)!.addresses[6]),
      addressToBytes32(token(loan.value.principal)!.addresses[6]),
      Converter.toWei(loan.value.amountIn.toString()),
      addressToBytes32(store.state.suiAddress)
    );

    if (hash) {
      notify.push({
        title: 'Transaction successful.',
        description: 'Transaction was sent.',
        category: 'success',
        linkTitle: 'View Trx',
        linkUrl: `https://testnet.snowtrace.io/tx/${hash}`
      });

      loan.value.fromHash = hash;
      loan.value.sender = store.state.ethAddress;
      loan.value.interestRate = defaultInterestRate;
      loan.value.startSecs = Number(Number(Date.now() / 1000).toFixed(0));
      loan.value.state = LoanState.ACTIVE;

      // save a new loan.
      await saveNewLoan(loan.value);
      await incrementPoints(store.state.suiAddress, loan.value.amountIn || 0);

      setTimeout(() => {
        // Refresh balances with bridging delay
        updateBalances();
      }, 10_000);

      loan.value.amountIn = null;
    } else {
      notify.push({
        title: 'Failed to send transaction.',
        description: 'Try again.',
        category: 'error'
      });
    }

    borrowing.value = false;

    return;
  }

  // Check for SUI
  if (loan.value.fromChainId == 21) {
    if (loan.value.amountIn > Number(Converter.fromGwei(suiBalances.value.usdt))) {
      notify.push({
        title: 'Insufficient amount.',
        description: 'Your balance is ' + Converter.toMoney(Converter.fromGwei(suiBalances.value.usdt)) + ' USDT',
        category: 'error'
      });
      return;
    }

    borrowing.value = true;

    const hash = await suiBorrow(
      loan.value.toChainId,
      Converter.toGwei(loan.value.amountIn!.toString()),
      token(loan.value.collateral)!.addresses[21],
      token(loan.value.principal)!.addresses[21],
      store.state.suiAddress,
      addressToBytes32(store.state.ethAddress),
      store.state.suiAdapter
    );

    if (hash) {
      notify.push({
        title: 'Transaction successful.',
        description: 'Transaction was sent.',
        category: 'success',
        linkTitle: 'View Trx',
        linkUrl: `https://suiscan.xyz/testnet/tx/${hash}`
      });

      loan.value.fromHash = hash;
      loan.value.sender = store.state.suiAddress;
      loan.value.interestRate = defaultInterestRate;
      loan.value.startSecs = Number(Number(Date.now() / 1000).toFixed(0));
      loan.value.state = LoanState.ACTIVE;

      // save a new loan.
      await saveNewLoan(loan.value);
      await incrementPoints(store.state.suiAddress, loan.value.amountIn || 0);

      setTimeout(() => {
        // Refresh balances with bridging delay
        updateBalances();
      }, 10_000);

      loan.value.amountIn = null;
    } else {
      notify.push({
        title: 'Failed to send transaction.',
        description: 'Try again.',
        category: 'error'
      });
    }

    borrowing.value = false;

    return;
  }
};

const repay = async (loan: Loan) => {
  if (!store.state.ethAddress || !store.state.suiAddress) {
    notify.push({
      title: 'Connect your wallets first!',
      description: 'Then try again.',
      category: 'error'
    });
    return;
  }

  if (!loan.loanId) {
    notify.push({
      title: 'Loading your loans!',
      description: 'Please wait and try again.',
      category: 'error'
    });

    return;
  }

  if (repaying.value) {
    return;
  }

  // Check for Avalanche.
  if (loan.fromChainId! == 21) {
    repaying.value = loan.loanId;

    const interest = estimateInterest(loan, true);
    const coinOutValue = Number(
      Number(Converter.toWei(loan.amountOut!)) + Number(interest)
    );

    const allowance = Converter.fromWei(
      await getAllowance(
        token(loan.principal)!.addresses[6] as `0x${string}`,
        store.state.ethAddress,
        ORBITAL_AVAX
      )
    );

    if (Number(allowance) < Number(Converter.fromWei(coinOutValue))) {
      await approve(
        token(loan.principal)!.addresses[6] as `0x${string}`,
        ORBITAL_AVAX,
        coinOutValue.toFixed(0)
      );
    }

    const hash = await ethRepay(loan.loanId);

    if (hash) {
      notify.push({
        title: 'Transaction successful.',
        description: 'Transaction was sent.',
        category: 'success',
        linkTitle: 'View Trx',
        linkUrl: `https://testnet.snowtrace.io/tx/${hash}`
      });

      await setLoanAsSettled(loan.fromHash!);
      await incrementPoints(store.state.suiAddress, loan.amountIn || 0);

      setTimeout(() => {
        // Refresh balances with bridging delay
        updateBalances();
      }, 10_000);
    } else {
      notify.push({
        title: 'Failed to send transaction.',
        description: 'Try again.',
        category: 'error'
      });
    }

    repaying.value = null;
  }

  // Check for SUI. @reversed
  if (loan.fromChainId == 6) {
    repaying.value = loan.loanId;

    const interest = estimateInterest(loan, true);

    const coinOutValue = Number(
      Number(Converter.toGwei(loan.amountOut!)) + Number(interest)
    );

    const hash = await suiRepay(
      loan.loanId,
      store.state.suiAddress,
      coinOutValue.toFixed(0),
      token(loan.principal)!.addresses[21],
      store.state.suiAdapter
    );

    if (hash) {
      notify.push({
        title: 'Transaction successful.',
        description: 'Transaction was sent.',
        category: 'success',
        linkTitle: 'View Trx',
        linkUrl: `https://testnet.snowtrace.io/tx/${hash}`
      });

      await setLoanAsSettled(loan.fromHash!);
      await incrementPoints(store.state.suiAddress, loan.amountIn || 0);

      setTimeout(() => {
        // Refresh balances with bridging delay
        updateBalances();
      }, 10_000);
    } else {
      notify.push({
        title: 'Failed to send transaction.',
        description: 'Try again.',
        category: 'error'
      });
    }

    repaying.value = null;
  }
};

const deleteLoan = async (loan: Loan) => {
  const deleted = await removeLoan(loan.fromHash!);

  if (deleted) {
    notify.push({
      title: 'Loan has been deleted.',
      description: 'Deleted loans cannot be recorved!.',
      category: 'success'
    });
  } else {
    notify.push({
      title: 'Failed to delete loan.',
      description: 'Try again.',
      category: 'error'
    });
  }
};

const switchMode = () => {
  if (store.state.borrowMode == 'advanced') {
    store.commit('setBorrowMode', 'simple');
    return;
  }
  store.commit('setBorrowMode', 'advanced');
};

const comingSoon = () => {
  notify.push({
    title: 'Advanced mode coming soon.',
    description: 'Switch to simple mode.',
    category: 'error'
  });
};

const suiAddressState = computed(() => store.state.suiAddress);
const ethAddressState = computed(() => store.state.ethAddress);

watch(suiAddressState, () => {
  updateLoans();

  // Refresh balances
  updateBalances();
});


watch(ethAddressState, () => {
  updateLoans();

  // Refresh balances
  updateBalances();
});


onMounted(() => {
  updateLoans();

  listen(() => {
    updateLoans();
  });

  // Refresh balances
  updateBalances();
});
</script>

<template>
  <section>
    <div class="app_width">
      <div class="base_container">
        <div class="borrow_container" v-if="store.state.borrowMode == 'simple'">
          <div class="borrow">
            <div class="collateral">
              <div class="token_type">
                <p>Asset Type:</p>
                <div class="tabs_wrapper">
                  <div class="tabs">
                    <button :class="loan.tokenType == 0 ? 'tab active' : 'tab'"
                      @click="loan.tokenType = 0">Token</button>
                    <button :class="'tab'" style="cursor: not-allowed;">NFT</button>
                  </div>
                  <SettingsIcon @click="switchMode" />
                </div>
              </div>

              <div class="from_chain">
                <p>From:</p>
                <div class="chain" @click="fromChaining = !fromChaining">
                  <img :src="chain(loan.fromChainId)!.image" alt="">
                  <p>{{ chain(loan.fromChainId)!.name }}</p>
                  <ArrowDownIcon />

                  <div class="dropdown" v-if="fromChaining">
                    <div class="chain">
                      <img :src="chain(loan.fromChainId)!.image" alt="">
                      <p>{{ chain(loan.fromChainId)!.name }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="input_token">
                <div class="labels">
                  <p>Enter amount:</p>
                  <p v-if="loan.fromChainId == 6">
                    Bal: {{ Converter.toMoney(Converter.fromWei(ethBalances.usdt)) }}
                  </p>
                  <p v-else>
                    Bal: {{ Converter.toMoney(Converter.fromGwei(suiBalances.usdt)) }}
                  </p>
                </div>
                <div class="input">
                  <input min="0" v-model="loan.amountIn" type="number" placeholder="0.00" />
                  <div class="token" @click="fromTokening = !fromTokening">
                    <img :src="token(loan.collateral)!.image" alt="">
                    <p>{{ token(loan.collateral)!.symbol }}</p>
                    <ArrowDownIcon />

                    <div class="dropdown" v-if="fromTokening">
                      <div class="token">
                        <img :src="token(loan.collateral)!.image" alt="">
                        <p>{{ token(loan.collateral)!.symbol }}</p>
                      </div>
                      <div class="token" style="opacity: 0.5; cursor: not-allowed">
                        <img src="/images/btc.png" alt="">
                        <p>Bitcoin</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="interchange">
            <button @click="interchange" :style="loan.interchange ? 'rotate: 180deg;' : ''">
              <InterChangeIcon />
            </button>
          </div>

          <div class="borrow">
            <div class="principal">
              <div class="from_chain">
                <p>Loan-To-Value:</p>
                <div class="chain">
                  <!-- <img src="/images/sui.png" alt=""> -->
                  <p>{{ LTV }}%</p>
                </div>
              </div>

              <div class="from_chain">
                <p>Interest:</p>
                <div class="chain">
                  <!-- <img src="/images/sui.png" alt=""> -->
                  <p>4.5%</p>
                </div>
              </div>

              <div class="from_chain">
                <p>Destination:</p>
                <div class="chain" @click="toChaining = !toChaining">
                  <img :src="chain(loan.toChainId)!.image" alt="">
                  <p>{{ chain(loan.toChainId)!.name }}</p>
                  <ArrowDownIcon />

                  <div class="dropdown" v-if="toChaining">
                    <div class="chain">
                      <img :src="chain(loan.toChainId)!.image" alt="">
                      <p>{{ chain(loan.toChainId)!.name }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="input_token">
                <div class="labels">
                  <p>Est. Principal:</p>
                  <p v-if="loan.fromChainId == 21">
                    Bal: {{ Converter.toMoney(Converter.fromWei(ethBalances.fud)) }}
                  </p>
                  <p v-else>
                    Bal: {{ Converter.toMoney(Converter.fromGwei(suiBalances.fud)) }}
                  </p>
                </div>
                <div class="input">
                  <input type="number" :value="loan.amountOut" disabled placeholder="0.00" />
                  <div class="token" @click="toTokening = !toTokening">
                    <img :src="token(loan.principal)!.image" alt="">
                    <p>{{ token(loan.principal)!.symbol }}</p>
                    <ArrowDownIcon />

                    <div class="dropdown" v-if="toTokening">
                      <div class="token">
                        <img :src="token(loan.principal)!.image" alt="">
                        <p>{{ token(loan.principal)!.symbol }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="details">
            <div class="fee">
              <p>Cross-chain fee.</p>
              <p>Estimated at <span>0 {{ chain(loan.fromChainId)!.native }}</span> on {{
                chain(loan.fromChainId)!.name }}.</p>
            </div>

            <div class="action">
              <button v-if="Number(allowance) < (loan.amountIn || 0)" @click="approveOrbital(true)">
                {{ approving.valueOf() ? 'Approving..' : 'Approve' }}
              </button>
              <button @click="Number(allowance) >= (loan.amountIn || 0) ? borrow() : null" :style="{
                opacity: `${Number(allowance) >= (loan.amountIn || 0) ? '1' : '0.5'}`,
                cursor: `${Number(allowance) >= (loan.amountIn || 0) ? 'pointer' : 'not-allowed'}`
              }">
                {{ borrowing.valueOf() ? 'Borrowing..' : 'Borrow' }}
              </button>
            </div>
          </div>
        </div>

        <div class="advanced_container" v-if="store.state.borrowMode == 'advanced'">
          <div class="supply">
            <h3 class="title">Supply
              <SettingsIcon @click="switchMode" />
            </h3>
            <table>
              <thead>
                <tr>
                  <td>
                    <div class="image">#</div>
                  </td>
                  <td>Asset</td>
                  <td>Supplied</td>
                  <td>Interest</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="image">
                      <img src="/images/usdt.png" alt="">
                    </div>
                  </td>
                  <td>Tether USD</td>
                  <td>0.00 USDT</td>
                  <td>2.5%</td>
                  <td>
                    <button @click="comingSoon">Supply</button>
                  </td>
                </tr>
              </tbody>
              <tbody style="opacity: 0.5; cursor: not-allowed">
                <tr>
                  <td>
                    <div class="image">
                      <img src="/images/btc.png" alt="">
                    </div>
                  </td>
                  <td>Bitcoin</td>
                  <td>0.00 BTC</td>
                  <td>6.2%</td>
                  <td>
                    <button>Supply</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <br> <br>

          <div class="supply">
            <h3 class="title">Borrow
              <SettingsIcon @click="switchMode" />
            </h3>
            <table>
              <thead>
                <tr>
                  <td>
                    <div class="image">#</div>
                  </td>
                  <td>Asset</td>
                  <td>Borrowed</td>
                  <td>Interest</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="image">
                      <img src="/images/fud.png" alt="">
                    </div>
                  </td>
                  <td>Fud the Pug</td>
                  <td>0.00 FUD</td>
                  <td>4.5%</td>
                  <td>
                    <button @click="comingSoon">Borrow</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 40px;">
          <div class="table_container">
            <h3>Open Loans ({{ myLoans.filter(ml => ml.state != LoanState.SETTLED).length }})</h3>
            <div class="open_loans">
              <table>
                <thead>
                  <tr>
                    <td>#</td>
                    <td>Collateral</td>
                    <td>Principal</td>
                    <td>Interest</td>
                    <td></td>
                    <td></td>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loan, index in myLoans.filter(ml => ml.state != LoanState.SETTLED)" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>
                      <div class="table_collateral">
                        <div class="token">
                          <img :src="token(loan.collateral)!.image" alt="">
                          <p>
                            {{ Converter.toMoney(loan.amountIn!, false, 10) }}
                            {{ token(loan.collateral)!.symbol }}
                          </p>
                        </div>
                        <div class="chain">
                          <img :src="chain(loan.fromChainId)!.image" alt="">
                          <p>{{ chain(loan.fromChainId)!.name }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="table_principal">
                        <div class="token">
                          <img :src="token(loan.principal)!.image" alt="">
                          <p>
                            {{ Converter.toMoney(loan.amountOut!, false, 10) }}
                            {{ token(loan.principal)!.symbol }}
                          </p>
                        </div>
                        <div class="chain">
                          <img :src="chain(loan.toChainId)!.image" alt="">
                          <p>{{ chain(loan.toChainId)!.name }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="token">
                        <img :src="token(loan.principal)!.image" alt="">
                        <p v-if="loan.fromChainId == 21">
                          {{ Converter.toMoney(Converter.fromWei(estimateInterest(loan, false)), false, 10) }}
                          {{ token(loan.principal)!.symbol }}
                        </p>
                        <p v-else>
                          {{ Converter.toMoney(Converter.fromGwei(estimateInterest(loan, false)), false, 10) }}
                          {{ token(loan.principal)!.symbol }}
                        </p>
                      </div>
                    </td>
                    <td v-if="loan.loanId && loan.state == LoanState.ACTIVE">
                      <button @click="repay(loan)">
                        {{ repaying?.valueOf() == loan.loanId ? "..." : "Repay" }}
                      </button>
                    </td>
                    <td v-else>
                      <button>...</button>
                    </td>
                    <td>
                      <a :href="`https://wormholescan.io/#/tx/${loan.fromHash}?network=TESTNET`" target="_blank">
                        <img width="20px" src="/images/w.webp" alt="">
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="empty" v-if="myLoans.filter(ml => ml.state != LoanState.SETTLED).length == 0">
                <img src="/images/empty.png" alt="">
                <p>No open loans.</p>
              </div>
            </div>
          </div>

          <div class="table_container">
            <h3>Closed Loans ({{ myLoans.filter(ml => ml.state == LoanState.SETTLED).length }})</h3>
            <div class="open_loans">
              <table>
                <thead>
                  <tr>
                    <td>#</td>
                    <td>Collateral</td>
                    <td>Principal</td>
                    <td>Interest</td>
                    <td></td>
                    <td></td>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loan, index in myLoans.filter(ml => ml.state == LoanState.SETTLED)" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>
                      <div class="table_collateral">
                        <div class="token">
                          <img :src="token(loan.collateral)!.image" alt="">
                          <p>
                            {{ Converter.toMoney(loan.amountIn!.toString()) }}
                            {{ token(loan.collateral)!.symbol }}
                          </p>
                        </div>
                        <div class="chain">
                          <img :src="chain(loan.fromChainId)!.image" alt="">
                          <p>{{ chain(loan.fromChainId)!.name }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="table_principal">
                        <div class="token">
                          <img :src="token(loan.principal)!.image" alt="">
                          <p>
                            {{ Converter.toMoney(loan.amountOut!.toString()) }}
                            {{ token(loan.principal)!.symbol }}
                          </p>
                        </div>
                        <div class="chain">
                          <img :src="chain(loan.toChainId)!.image" alt="">
                          <p>{{ chain(loan.toChainId)!.name }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="token">
                        <img :src="token(loan.principal)!.image" alt="">
                        <p>Interest paid</p>
                      </div>
                    </td>
                    <td>
                      <button style="background: #d20808;" @click="deleteLoan(loan)">Delete</button>
                    </td>
                    <td>
                      <a :href="`https://wormholescan.io/#/tx/${loan.fromHash}?network=TESTNET`" target="_blank">
                        <img width="20px" src="/images/w.webp" alt="">
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="empty" v-if="myLoans.filter(ml => ml.state == LoanState.SETTLED).length == 0">
                <img src="/images/empty.png" alt="">
                <p>No closed loans.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
section {
  padding: 40px 0;
}

.base_container {
  display: flex;
  gap: 50px;
  justify-content: center;
  flex-wrap: wrap;
}

.borrow_container {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 5px;
}

.advanced_container {
  width: 750px;
}

.advanced_container .title {
  color: var(--tx-normal);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.advanced_container .title svg {
  cursor: pointer;
}

.borrow {
  width: 400px;
  border-radius: 16px;
  background: var(--background-lighter);
  display: flex;
  align-items: center;
  flex-direction: column;
}

.collateral {
  width: 100%;
}

.principal {
  padding-top: 14px;
  width: 100%;
}

.token_type {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 10px 24px;
  border-radius: 16px 16px 0 0;
  background: var(--background);
  border: 2px solid var(--background-lighter);
}

.token_type>p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-dimmed);
}

.tabs_wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: var(--background-light);
  border-radius: 8px;
}

.tab {
  padding: 0 16px;
  height: 30px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  color: var(--tx-dimmed);
}

.tab.active {
  color: var(--tx-normal);
  background: var(--background-lighter);
}

.from_chain {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
}

.from_chain>p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-dimmed);
}

.borrow_container .chain {
  padding: 0 10px;
  background: var(--background-light);
  border-radius: 24px;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
}

.dropdown {
  position: absolute;
  top: 35px;
  left: 0;
}

.dropdown>div {
  background: var(--background-light) !important;
  border: 1px solid var(--background);
}

.token .dropdown {
  top: 45px;
}

.dropdown .token {
  height: 35px !important;
  border-radius: 6px;
}

.borrow_container .chain p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-normal);
}

.borrow_container .chain img {
  width: 20px;
  height: 20px;
  border-radius: 10px;
}

.input_token {
  padding: 10px 24px 30px 24px;
}

.input_token .labels p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-dimmed);
}

.labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  background: var(--background-light);
  border-radius: 8px;
}

input {
  color: var(--tx-normal);
  font-size: 16px;
  font-weight: 500;
  border: none;
  outline: none;
  background: none;
  padding: 0 16px;
  height: 100%;
  width: 100%;
}

.borrow_container .token {
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
}

.borrow_container .token p {
  font-size: 14px;
  font-weight: 500;
  color: var(--tx-normal);
}

.borrow_container .token img {
  width: 20px;
  height: 20px;
  border-radius: 10px;
}

.interchange {
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.interchange>button {
  position: absolute;
  width: 45px;
  height: 45px;
  border-radius: 16px;
  background: var(--background-light);
  border: 3px solid var(--background);
  color: var(--tx-normal);
}

.details {
  margin-top: 20px;
  width: 400px;
  border-radius: 16px;
  background: var(--background-lighter);
  display: flex;
  align-items: center;
  flex-direction: column;
  overflow: hidden;
}

.fee {
  width: 100%;
  text-align: center;
  padding: 24px 24px 10px 24px;
}

.fee>p:first-child {
  font-size: 12px;
  font-weight: 500;
  color: var(--tx-dimmed);
}

.fee>p:last-child {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 300;
  color: var(--tx-normal);
}

.fee>p:last-child span {
  font-weight: 500;
  color: var(--primary);
}

.action {
  width: 100%;
  padding: 10px 24px 24px 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.action button {
  height: 45px;
  width: 100%;
  border-radius: 16px;
  background: var(--primary);
  font-size: 18px;
  font-weight: 500;
  color: var(--tx-normal);
}

.table_container {
  max-width: 100%;
}

.table_container>h3 {
  color: var(--tx-normal);
  font-size: 18px;
}

.open_loans {
  border-radius: 16px;
  background: var(--background-lighter);
  margin-top: 16px;
}

table {
  width: 100%;
}

table td:first-child {
  width: 40px;
}

table .image {
  display: flex;
  align-items: center;
  justify-content: center;
}

table img {
  width: 20px;
  height: 20px;
  border-radius: 10px;
}

table td:nth-child(2) {
  width: 180px;
}

table td:nth-child(3) {
  width: 180px;
}

table td:nth-child(4) {
  width: 160px;
}

table td:nth-child(5) {
  width: 120px;
}

table td:nth-child(6) {
  width: 20px;
}

thead {
  height: 60px;
}

thead td,
tbody td {
  color: var(--tx-normal);
  font-size: 16px;
  font-weight: 600;
}

td {
  padding: 0 16px;
}

.table_collateral {
  display: flex;
  flex-direction: column;
}

td button {
  height: 35px;
  padding: 0 20px;
  border-radius: 10px;
  background: var(--primary);
  font-size: 16px;
  font-weight: 500;
  border: none;
  color: var(--tx-normal);
}

.table_container .token {
  padding: 0 6px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
}

.table_container .token p {
  font-size: 12px;
  font-weight: 500;
  color: var(--tx-normal);
}

.table_container .token img {
  width: 16px;
  height: 16px;
  border-radius: 10px;
}

.table_container .chain {
  padding: 0 6px;
  background: var(--background-light);
  border-radius: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  margin-top: 4px
}

.table_container .chain p {
  font-size: 12px;
  font-weight: 500;
  color: var(--tx-normal);
}

.table_container .chain img {
  width: 16px;
  height: 16px;
  border-radius: 10px;
}

tbody tr {
  height: 70px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  flex-direction: column;
  color: var(--tx-dimmed);
  gap: 10px;
  text-align: center;
  padding: 40px;
  background: var(--background-light);
  border-radius: 0 0 16px 16px;
}

.empty img {
  height: 60px;
  filter: brightness(50%);
}
</style>