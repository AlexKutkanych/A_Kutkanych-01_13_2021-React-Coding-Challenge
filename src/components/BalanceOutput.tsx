import React, {FC} from 'react';
import {connect} from 'react-redux';

import {AccountType, JournalType, RootState, UserInputType} from 'types';
import {dateToString, toCSV} from 'utils';
import {
  getStartPeriod,
  getEndPeriod,
  getJournal,
  getAccounts,
  getStartAccount,
  getEndAccount,
  getInputFormat
} from 'selectors';

interface Balance {
  ACCOUNT: string;
  DESCRIPTION: string;
  DEBIT: number;
  CREDIT: number;
  BALANCE: number;
}

interface ConnectProps {
  balance: Balance[];
  totalCredit: number;
  totalDebit: number;
  userInput: UserInputType;
}

const BalanceOutput: FC<ConnectProps> = ({balance, totalCredit, totalDebit, userInput}) => {
  if (!userInput.format || !userInput.startPeriod || !userInput.endPeriod) return null;

  return (
    <div className="output">
      <p>
        Total Debit: {totalDebit} Total Credit: {totalCredit}
        <br />
        Balance from account {userInput.startAccount || '*'} to {userInput.endAccount || '*'} from period{' '}
        {dateToString(userInput.startPeriod)} to {dateToString(userInput.endPeriod)}
      </p>
      {userInput.format === 'CSV' ? <pre>{toCSV(balance)}</pre> : null}
      {userInput.format === 'HTML' ? (
        <table className="table">
          <thead>
            <tr>
              <th>ACCOUNT</th>
              <th>DESCRIPTION</th>
              <th>DEBIT</th>
              <th>CREDIT</th>
              <th>BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {balance.map((entry, i) => (
              <tr key={i}>
                <th scope="row">{entry.ACCOUNT}</th>
                <td>{entry.DESCRIPTION}</td>
                <td>{entry.DEBIT}</td>
                <td>{entry.CREDIT}</td>
                <td>{entry.BALANCE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
};

export default connect(
  (state: RootState): ConnectProps => {
    let balance: Balance[] = [];

    /* YOUR CODE GOES HERE */

    let [startPeriod, endPeriod, startAccount, endAccount, journal, accounts, inputFormat] = [
      getStartPeriod(state),
      getEndPeriod(state),
      getStartAccount(state),
      getEndAccount(state) || NaN,
      getJournal(state),
      getAccounts(state),
      getInputFormat(state),
    ];

    if (inputFormat === 'CSV') {
      if (Number.isNaN(endAccount)) {
        endAccount = journal.map(({ ACCOUNT }) => ACCOUNT).sort((a, b) => b - a)[0];
      }
  
      if (!!startPeriod) {
        startPeriod = journal.map(({ PERIOD }) => PERIOD).sort((a, b) => a.getTime() - b.getTime())[0];
      }
    }

    const filterOptions = {startPeriod, endPeriod, startAccount, endAccount};

    balance = getBalanceData(journal, accounts, filterOptions)

    const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
    const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

    return {
      balance,
      totalCredit,
      totalDebit,
      userInput: state.userInput,
    };
  },
)(BalanceOutput);

const getBalanceData = (journal: JournalType[], accounts: AccountType[], filterOptions: any) => {
  const { startPeriod, endPeriod, startAccount, endAccount } = filterOptions;
  const startDate = new Date(startPeriod);
  const endDate = new Date(endPeriod);
  const accountsIds = accounts.map(({ ACCOUNT }) => ACCOUNT);

  const filteredByIdAndPeriod = journal.filter(({ ACCOUNT, PERIOD }) => (ACCOUNT >= startAccount && ACCOUNT <= endAccount) && (PERIOD >= startDate && PERIOD <= endDate));
  return mergeObj(filteredByIdAndPeriod, accountsIds)
    .sort((a, b) => a.ACCOUNT - b.ACCOUNT)
    .map(({ ACCOUNT, DEBIT, CREDIT }) => ({
      ACCOUNT,
      DESCRIPTION: mapDescription(ACCOUNT, accounts) || '',
      DEBIT,
      CREDIT,
      BALANCE: DEBIT - CREDIT
    }))
  }

const mergeObj = (filteredJournal: JournalType[], accountsIds: number[]) => {
  const journalIdArr = filteredJournal.map(({ ACCOUNT }) => ACCOUNT).filter((x, i, a) => a.indexOf(x) === i);
  const journalIdsInAccount = journalIdArr.filter(id => accountsIds.includes(id));
  
  return journalIdsInAccount.map((id) => {
  	const currentJournalItems = filteredJournal.filter(({ ACCOUNT }) => id === ACCOUNT);
    if (currentJournalItems.length > 1) {
    	return mergeDuplicatedItems(currentJournalItems);
    }
    
    return currentJournalItems[0];  
  });
}

const mergeDuplicatedItems = (journalItems: JournalType[]) => {
  const result: any = {};

  journalItems.forEach(journalItem => {
    for (let [key, value] of Object.entries(journalItem)) {
      if (result[key] && key !== 'ACCOUNT') {
        result[key] += value;
      } else {
        result[key] = value;
      }
    }
  });
  return result;
};

const mapDescription = (currentAccount: number, accounts: AccountType[]) => accounts.find(({ ACCOUNT }) => ACCOUNT === currentAccount)?.LABEL;  
