import { LoanState, type Loan } from "@/types";
import { initializeApp } from "firebase/app";
import { doc, getFirestore, collection, query, where, getDocs, setDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";

const LOAN_COLLECTION: string = "loans";
const USERS_COLLECTION: string = "users";

const PI: number = 3.141592654;

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FS_API_KEY,
    authDomain: import.meta.env.VITE_FS_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FS_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FS_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FS_MSG_SENDER_ID,
    appId: import.meta.env.VITE_FS_APP_ID,
    measurementId: import.meta.env.VITE_FS_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export const listen = async (cb: () => void) => {
    const loansRef = collection(db, LOAN_COLLECTION);

    // Create a query against the collection.
    const q = query(loansRef);

    onSnapshot(q, () => { cb(); });
};

export const getAllLoans = async (suiAddress: string, ethAddress: string): Promise<Loan[]> => {
    try {
        const loansRef = collection(db, LOAN_COLLECTION);

        // Create a query against the collection.
        const q = query(loansRef, where("sender", 'in', [suiAddress, ethAddress]));

        const querySnapshot = await getDocs(q);

        const loans: Loan[] = [];

        querySnapshot.forEach((doc) => {
            loans.push(doc.data() as Loan);
        });

        return loans;
    } catch (error) {
        console.log(error);

        return [];
    }
};

export const saveNewLoan = async (loan: Loan) => {
    try {
        // Add a new document in collection "loans"
        await setDoc(doc(db, LOAN_COLLECTION, loan.fromHash!), loan,
            { merge: true }
        );
    } catch (error) {
        console.log(error);
    }
};

export const removeLoan = async (fromHash: string) => {
    try {
        // Add a new document in collection "loans"
        await deleteDoc(doc(db, LOAN_COLLECTION, fromHash));
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

export const setLoanAsSettled = async (fromHash: string) => {
    try {
        // Add a new document in collection "loans"
        await setDoc(doc(db, LOAN_COLLECTION, fromHash!), { state: LoanState.SETTLED },
            { merge: true }
        );
    } catch (error) {
        console.log(error);
    }
};

export const getUserPoints = async (suiAddress: string) => {
    try {
        const result = await getDoc(doc(db, USERS_COLLECTION, suiAddress));
        if (result.exists().valueOf()) {
            const user = result.data();
            return (user?.points || 0);
        }
    } catch (error) {
        console.log(error);
        return 0;
    }
};

export const incrementPoints = async (suiAddress: string, worthUsd: number) => {
    try {
        const result = await getDoc(doc(db, USERS_COLLECTION, suiAddress));

        const newPoints = (worthUsd * PI);
        if (result.exists().valueOf()) {
            const user = result.data();

            // Add a new document in collection "loans"
            await setDoc(doc(db, USERS_COLLECTION, suiAddress), { points: ((user?.points || 0) + newPoints) },
                { merge: true }
            );
            return;
        }

        // Add a new document in collection "loans"
        await setDoc(doc(db, USERS_COLLECTION, suiAddress), { points: newPoints },
            { merge: true }
        );
    } catch (error) {
        console.log(error);
    }
};