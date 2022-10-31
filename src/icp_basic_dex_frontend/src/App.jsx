import React, { useEffect, useState } from 'react';
import './App.css';

import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { canisterId as DEXCanisterId } from "../../declarations/icp_basic_dex_backend";
import { idlFactory } from "../../declarations/icp_basic_dex_backend/icp_basic_dex_backend.did.js";
import { canisterId as IICanisterID } from "../../declarations/internet_identity";

const App = () => {

  const [currentPrincipalId, setCurrentPrincipalId] = useState("");
  // TODO: Delete if not used
  const [currentAccountId, setCurrentAccountId] = useState("");

  const [userTokens, setUserTokens] = useState([
    // TODO: Delete
    {
      name: 'HOGE',
      balance: 100,
      fee: 5,
    },
    {
      name: 'POYO',
      balance: 300,
      fee: 10,
    },
  ])

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
    // Using the identity obtained from the auth client, we can create an agent to interact with the IC.
    const agent = new HttpAgent({ identity });
    // Using the interface description of our webapp, we create an Actor that we use to call the service methods.
    const icp_basic_dex = Actor.createActor(idlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });
    // Call whoami which returns the principal (user id) of the current user.
    const principal = await icp_basic_dex.whoami();

    console.log(`identity: ${typeof identity}: ${identity}`);
    console.log(`principal: ${typeof principal}: ${principal}`);
    console.log(`principal.toText: ${typeof principal.toText()}: ${principal.toText()}`);

    console.log(`JSON.stringify(identity): ${JSON.stringify(identity)}`);
    console.log(`JSON.stringify(principal): ${JSON.stringify(principal)}`);
    console.log(`Call whoami: ${authClient.getIdentity().getPrincipal().toText()}`);

    setCurrentPrincipalId(principal.toText());
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
                  <th>Fee</th>
                  <th>Action</th>
                </tr>
                {userTokens.map((token) => {
                  return (
                    <tr key={token.name}>
                      <td data-th="Token">{token.name}</td>
                      <td data-th="Balance">{token.balance}</td>
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
                  <tr key={`${order.token} ${index}`} >
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