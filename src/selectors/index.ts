import {RootState} from 'types';

const getUserInput = (state: RootState) => state.userInput || {};
const getStartPeriod = (state: RootState) => getUserInput(state).startPeriod;
const getEndPeriod = (state: RootState) => getUserInput(state).endPeriod;
const getStartAccount = (state: RootState) => getUserInput(state).startAccount;
const getEndAccount = (state: RootState) => getUserInput(state).endAccount;
const getInputFormat = (state: RootState) => getUserInput(state).format;

const getJournal = (state: RootState) => state.journalEntries || [];
const getAccounts = (state: RootState) => state.accounts || [];

export {
    getStartPeriod,
    getEndPeriod,
    getJournal,
    getAccounts,
    getStartAccount,
    getEndAccount,
    getInputFormat
}