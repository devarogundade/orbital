import type { Loan } from "@/types";

const STORAGE_KEY: string = "orbital_loans";

export const getAllLoans = (): Loan[] => {
    try {
        let storageContents = localStorage.getItem(STORAGE_KEY);

        // If contents is null
        if (!storageContents) {
            return [];
        }

        const loans = JSON.parse(storageContents!) as Loan[];

        return loans;
    } catch (error) {
        console.log(error);

        return [];
    }
};

export const saveNewLoan = (loan: Loan) => {
    try {
        let storageContents = localStorage.getItem(STORAGE_KEY);

        // If contents is null
        if (!storageContents) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            storageContents = localStorage.getItem(STORAGE_KEY);
        }

        const loans = JSON.parse(storageContents!) as Loan[];

        // Push new loan to the list
        const newLoans = [loan].concat(loans);

        // Save the new list
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoans));
    } catch (error) {
        console.log(error);
    }
};