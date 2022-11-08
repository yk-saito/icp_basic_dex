import React from 'react';
// import { useUserTokensContext } from '../context/UserTokens';

export const UserBoard = (props) => {
  const { currentPrincipalId, userTokens, handleDeposit, handleWithdraw } = props;

  return (
    <>
      {currentPrincipalId &&
        <div className="token-list">
          <h2>User</h2>
          <li>principal ID: {currentPrincipalId}</li>
          <table>
            <tbody>
              <tr>
                <th>Token</th>
                <th>Balance</th>
                <th>DEX Balance</th>
                <th>Fee</th>
                <th>Action</th>
              </tr>
              {userTokens.map((token, index) => {
                return (
                  <tr key={`${index} : ${token.symbol} `}>
                    <td data-th="Token">{token.symbol}</td>
                    <td data-th="Balance">{token.balance}</td>
                    <td data-th="DEX Balance">{token.dexBalance}</td>
                    <td data-th="Fee">{token.fee}</td>
                    <td data-th="Action">
                      <div className="btn-token">
                        <button
                          className='btn-deposit'
                          onClick={() => handleDeposit(index)}
                        >
                          Deposit
                        </button>
                        <button
                          className='btn-withdraw'
                          onClick={() => handleWithdraw(index)}
                        >
                          Withdraw
                        </button>
                        <button className='btn-faucet'>Faucet</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </>
  )
};