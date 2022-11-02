import React, { useEffect, useState } from 'react';
import './App.css';

import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from '@dfinity/principal';

import { canisterId as IICanisterID }
  from "../../declarations/internet_identity";
import { canisterId as DEXCanisterId, icp_basic_dex_backend }
  from "../../declarations/icp_basic_dex_backend";
import { idlFactory as DEXidlFactory }
  from "../../declarations/icp_basic_dex_backend/icp_basic_dex_backend.did.js";
import { canisterId as HogeDIP20canisterId }
  from '../../declarations/HogeDIP20';
import { idlFactory as HogeidlFactory }
  from '../../declarations/HogeDIP20/HogeDIP20.did.js';
import { canisterId as PiyoDIP20canisterId }
  from '../../declarations/PiyoDIP20';
import { idlFactory as PiyoidlFactory }
  from '../../declarations/PiyoDIP20/PiyoDIP20.did.js';

const App = () => {

  const tokenCanisters = [
    {
      canisterName: 'HogeDIP20',
      factory: HogeidlFactory,
      canisterId: HogeDIP20canisterId,
    },
    {
      canisterName: 'PiyoDIP20',
      factory: PiyoidlFactory,
      canisterId: PiyoDIP20canisterId,
    },
  ];

  const [identity, setIdentity] = useState();
  const [authClient, setAuthClient] = useState();
  const [agent, setAgent] = useState();

  const [currentPrincipalId, setCurrentPrincipalId] = useState("");
  // TODO: Delete if not used
  const [currentAccountId, setCurrentAccountId] = useState("");

  const [userTokens, setUserTokens] = useState([])

  const [orders, setOrders] = useState([
    // TODO: Delete
    {
      from: 'HOGE',
      fromAmount: 200,
      to: 'PIYO',
      toAmount: 300,
    },
    {
      from: 'PIYO',
      fromAmount: 400,
      to: 'HOGE',
      toAmount: 300,
    },]);

  const [order, setOrder] = useState({
    from: '',
    fromAmount: 0,
    to: '',
    toAmount: 0,
  })

  const handleChangeOrder = (event) => {
    setOrder((prevState) => {
      return {
        ...prevState,
        [event.target.name]: event.target.value,
      };
    });
  };

  const handleSubmitOrder = (event) => {
    event.preventDefault();
    console.log(order);

    const newOrders = [...orders, order];
    setOrders(newOrders);
  }

  // Connect Wallet handler
  const handleConnectWallet = async () => {
    if (currentPrincipalId) {
      console.log("Connected!");
      return;
    }
    try {
      // Request a new connection to the Plug user.
      // if declined, the method will throw an error.
      const isConnected = await window.ic.plug.requestConnect();
      console.log(`isConnected: ${isConnected}`);

      // Set user info.
      setCurrentPrincipalId(window.ic.plug.principalId);
      setCurrentAccountId(window.ic.plug.accountId);
    } catch (error) {
      alert("Plug wallet connection was refused");
      console.log(error);
    }
  };

  // Login Internet Identity handler
  const handleLogin = async () => {
    // Autofills the <input> for the II Url to point to the correct canister.
    let iiUrl;

    // TODO: Delete
    // console.log(`NETWORK: ${process.env.DFX_NETWORK}`);
    // console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

    if (process.env.DFX_NETWORK === "local") {
      iiUrl = `http://localhost:8080/?canisterId=${IICanisterID}`;
    } else if (process.env.DFX_NETWORK === "ic") {
      iiUrl = `https://${IICanisterID}.ic0.app`;
    } else {
      iiUrl = `https://${IICanisterID}.dfinity.network`;
    }

    // TODO: Delete
    iiUrl = `http://localhost:8080/?canisterId=${IICanisterID}`;

    console.log(`iiUrl: ${iiUrl}`);

    // Start Login process.
    // First we have to create and AuthClient.
    const authClient = await AuthClient.create();

    setAuthClient(authClient);

    // Login with Internet Identity.
    await new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: iiUrl,
        onSuccess: resolve,
        onError: reject,
      });
    });

    // Get the identity from the auth client:
    const identity = authClient.getIdentity();
    setIdentity(identity);
    // Using the identity obtained from the auth client,
    // we can create an agent to interact with the IC.
    const agent = new HttpAgent({ identity });
    setAgent(agent);
    // Using the interface description of our webapp,
    // we create an Actor that we use to call the service methods.
    const icp_basic_dex = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });
    // Call whoami which returns the principal (user id) of the current user.
    const principal = await icp_basic_dex.whoami();

    setCurrentPrincipalId(principal.toText());

    // Get information about the tokens held by the Logged-in user.
    for (let i = 0; i < tokenCanisters.length; ++i) {
      const tokenActor = Actor.createActor(tokenCanisters[i].factory, {
        agent,
        canisterId: tokenCanisters[i].canisterId,
      });

      // Get metadata of token.
      const metadata = await tokenActor.getMetadata();
      // Get token held by user.
      const balance = await tokenActor.balanceOf(principal);

      // Get token balances deposited by the user in the DEX.
      /** 
       * dexBalances = {
       *  owner: Principal,
       *  token: Principal,
       *  amount : token Balance
      */
      const dexBalances = await icp_basic_dex_backend.getBalances();
      let balanceAmount = 0;
      for (let i = 0; i < dexBalances.length; ++i) {
        if (dexBalances[i].token === canisterId) {
          console.log("Found DEX balance!!!"); // TODO: Delete
          balanceAmount = dexBalances[i].amount;
          break;
        }
      };

      console.log(
        `symbol: ${metadata.symbol},
         balance: ${balance},
         dexBalance: ${balanceAmount},
         fee: ${metadata.fee}`
      ); // TODO: Delete

      // Set information of user.
      const userToken = {
        symbol: metadata.symbol.toString(),
        balance: balance.toString(),
        dexBalance: balanceAmount,
        fee: metadata.fee.toString(),
      }
      setUserTokens((userTokens) => [...userTokens, userToken]);
    }
  };

  return (
    <>
      {/* HEADER */}
      <ul>
        <li>SIMPLE DEX</li>
        <li style={{ float: 'right' }}>
          <button
            onClick={handleLogin}>
            Login Internet Identity
          </button>
        </li>
        <li style={{ float: 'right' }}>
          {!currentPrincipalId && (
            <button
              id="button-connect"
              className="button-rainbow"
              onClick={handleConnectWallet}>
              <div className="button-container">
                {/* <img src="plug-light.svg" alt="Plug logo" class="plug-icon"> */}
                <span id="btn-title">Connect with Plug</span>
              </div>
            </button>
          )}
          {currentPrincipalId && (
            <button
              id="button-connect"
              className="button-rainbow"
              onClick={handleConnectWallet}>
              <div className="button-container">
                {/* <img src="plug-light.svg" alt="Plug logo" class="plug-icon"> */}
                <span id="btn-title">Plug Connected</span>
              </div>
            </button>
          )}
        </li>
      </ul>

      <main className="app">
        {/* LIST USER TOKEN */}
        {currentPrincipalId &&
          <div className="token-list">
            {/* {window.ic.plug.isConnected() && */}
            <h2>User</h2>
            <li>principal ID: {currentPrincipalId}</li>
            <li>account ID: {currentAccountId}</li>
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
                    <tr key={`${index} : ${token.symbol}`}>
                      <td data-th="Token">{token.symbol}</td>
                      <td data-th="Balance">{token.balance}</td>
                      <td data-th="DEX Balance">{token.dexBalance}</td>
                      <td data-th="Fee">{token.fee}</td>
                      <td data-th="Action">
                        <div className="btn-token">
                          <button className='btn-deposit'>Deposit</button>
                          <button className='btn-withdraw'>Withdraw</button>
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

        {/* CREATE ORDER */}
        {currentPrincipalId &&
          <div className="create-order-area">
            <div className="title">
              <p>CREATE ORDER</p>
              <button>+</button>
            </div>
            <form className="form" onSubmit={handleSubmitOrder} >
              <div>
                <div>
                  <label>From</label>
                  <select
                    name="from"
                    type="from"
                    onChange={handleChangeOrder}
                    required>
                    <option value="">Select token</option>
                    <option value="HOGEDIP20">HOGEDIP20</option>
                    <option value="PIYODIP20">PIYODIP20</option>
                  </select>
                </div>
                <div>
                  <label>Amount</label>
                  <input
                    name="fromAmount"
                    type="fromAmount"
                    onChange={handleChangeOrder}
                    required
                  />
                </div>
                <div>
                  <span>→</span>
                </div>
                <div>
                  <label>To</label>
                  <select
                    name="to"
                    type="to"
                    onChange={handleChangeOrder}
                    required>
                    <option value="">Select token</option>
                    <option value="HOGEDIP20">HOGEDIP20</option>
                    <option value="PIYODIP20">PIYODIP20</option>
                  </select>
                </div>
                <div>
                  <label>Amount</label>
                  <input
                    name="toAmount"
                    type="toAmount"
                    onChange={handleChangeOrder}
                    required
                  />
                </div>
              </div>
              <button type="submit">Submit Order</button>
            </form>
          </div>
        }

        {/* LIST ORDER */}
        <div className="order-list" style={{ backgroundColor: "rgb(8, 2, 38)" }}>
          <p>Order</p>
          <table>
            <tbody>
              <tr>
                <th>From</th>
                <th>Amount</th>
                <th></th>
                <th>To</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
              {orders.map((order, index) => {
                return (
                  <tr key={`${index}: ${order.token}`} >
                    <td data-th="From">{order.from}</td>
                    <td data-th="Amount">{order.fromAmount}</td>
                    <td>→</td>
                    <td data-th="To">{order.to}</td>
                    <td data-th="Amount">{order.toAmount}</td>
                    <td data-th="Action">
                      <div>
                        <button className="btn-buy">Buy</button>
                        <button className="btn-cancel">Cancel</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}

export default App;