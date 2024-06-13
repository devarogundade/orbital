export enum LoanState {
    NONE,
    ACTIVE,
    SETTLED,
    DEFAULTED
}

export type Loan = {
    loanId: string | null;
    amountIn: number | null;
    amountOut: number | null;
    tokenType: number;
    fromChainId: number;
    toChainId: number;
    collateral: string;
    principal: string;
    interchange: boolean;
    interestRate: number | null;
    startSecs: number | null;
    sender: string | null;
    fromHash: string | null;
    state: LoanState;
};

export interface Message {
    title: string;
    description: string;
    category: string;
    linkTitle?: string;
    linkUrl?: string;
}

export type BorrowMode = 'simple' | 'advanced';
