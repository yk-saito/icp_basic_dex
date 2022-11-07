import React, { useEffect, useState } from 'react';
import './App.css';

import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from '@dfinity/principal';

import { canisterId as IICanisterID }
  from "../../declarations/internet_identity";
import { canisterId as DEXCanisterId }
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

  const [agent, setAgent] = useState();

  const [currentPrincipalId, setCurrentPrincipalId] = useState("");

  const [userTokens, setUserTokens] = useState([])

  const [orderList, setOrderList] = useState([]);

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

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    console.log(order);

    const DEXActor = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });

    let fromPrincipal;
    if (order.from === "THG") {
      fromPrincipal = Principal.fromText(HogeDIP20canisterId);
    } else {
      fromPrincipal = Principal.fromText(PiyoDIP20canisterId);
    }

    let toPrincipal;
    if (order.to === "THG") {
      toPrincipal = Principal.fromText(HogeDIP20canisterId);
    } else {
      toPrincipal = Principal.fromText(PiyoDIP20canisterId);
    }

    try {
      const resultPlace
        = await DEXActor.placeOrder(
          fromPrincipal,
          Number(order.fromAmount),
          toPrincipal,
          Number(order.toAmount),
        );
      // Check Error
      if (!resultPlace.Ok) {
        alert(`Error: ${Object.keys(resultPlace.Err)[0]}`);
        return;
      }

      // Update Order List
      const updateOrders = await DEXActor.getOrders();
      setOrderList(updateOrders);

      console.log(`Created order:  ${resultPlace.Ok[0].id}`);
    } catch (error) {
      console.log(`handleSubmitOrder: ${error} `);
    }
  };

  // Buy order hander
  const handleBuyOrder = async (order) => {
    // Create DEX actor
    const DEXActor = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });
    try {

      // Call placeOrder
      const resultPlace
        = await DEXActor.placeOrder(
          order.to,
          Number(order.toAmount),
          order.from,
          Number(order.fromAmount),
        );

      // Check Error
      if (!resultPlace.Ok) {
        alert(`Error: ${Object.keys(resultPlace.Err)[0]}`);
        return;
      }

      // Update order list
      const updateOrders = await DEXActor.getOrders();
      setOrderList(updateOrders);

      // Update user balances
      getUserTokens(agent, Principal.fromText(currentPrincipalId));

      console.log("Trade Successful!");
    } catch (error) {
      console.log(`handleBuyOrder: ${error} `);
    };
  };


  // Cancel order handler
  const handleCancelOrder = async (id) => {
    try {
      const DEXActor = Actor.createActor(DEXidlFactory, {
        agent,
        canisterId: DEXCanisterId,
      });

      // Call cancelOrder
      const resultCancel = await DEXActor.cancelOrder(id);

      // Check Error
      if (!resultCancel.Ok) {
        alert(`Error: ${Object.keys(resultCancel.Err)}`);
        return;
      }

      // Update orderbook
      const updateOrders = await DEXActor.getOrders();
      setOrderList(updateOrders);

      console.log(`Canceled order ID: ${resultCancel.Ok}`);
    } catch (error) {
      console.log(`handleCancelOrder: ${error}`);
    }
  }

  const getUserTokens = async (agent, principal) => {
    const DEXActor = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });

    let tokens = [];
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

      // Get token balance deposited by the user in the DEX.
      const dexBalance
        = await DEXActor.getBalance(Principal.fromText(tokenCanisters[i].canisterId));
      console.log(`dexBalance: ${dexBalance}`);

      // Set information of user.
      const userToken = {
        symbol: metadata.symbol.toString(),
        balance: balance.toString(),
        dexBalance: dexBalance.toString(),
        fee: metadata.fee.toString(),
      }
      tokens.push(userToken);
    }
    setUserTokens(tokens);
  }

  const getOrders = async (agent) => {
    const DEXActor = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });

    // Set Order list
    const orders = await DEXActor.getOrders();
    setOrderList(orders);
  }

  // Login Internet Identity handler
  const handleLogin = async () => {
    // Autofills the <input> for the II Url to point to the correct canister.
    let iiUrl;

    // TODO: Delete
    // console.log(`NETWORK: ${ process.env.DFX_NETWORK }`);
    // console.log(`NODE_ENV: ${ process.env.NODE_ENV }`);

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
    // Using the identity obtained from the auth client,
    // we can create an agent to interact with the IC.
    const createAgent = new HttpAgent({ identity });
    // TODO: Must comment out later!!!
    // if (process.env.DFX_NETWORK === "local") {
    createAgent.fetchRootKey();
    // }
    setAgent(createAgent);
    // Using the interface description of our webapp,
    // we create an Actor that we use to call the service methods.
    const DEXActor = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });
    const principal = await authClient.getIdentity().getPrincipal();

    // Get information about the tokens held by the Logged-in user.
    getUserTokens(agent, principal);
    // Set Order list
    getOrders(agent);

    setCurrentPrincipalId(principal.toText());
  };

  const handleDeposit = async (updateIndex) => {
    const tokenActor = Actor.createActor(tokenCanisters[updateIndex].factory, {
      agent,
      canisterId: tokenCanisters[updateIndex].canisterId,
    });

    const DEXActor = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });

    try {
      // Approve user token transfer by DEX.
      const resultApprove
        = await tokenActor.approve(Principal.fromText(DEXCanisterId), 5000);
      console.log(`resultApprove: ${resultApprove.Ok}`);
      // Deposit token from token canister to DEX.
      const resultDeposit
        = await DEXActor.deposit(Principal.fromText(tokenCanisters[updateIndex].canisterId));
      console.log(`resultDeposit: ${resultDeposit.Ok}`);
      // Get updated balance of token Canister.
      const balance
        = await tokenActor.balanceOf(Principal.fromText(currentPrincipalId));
      // Get updated balance in DEX.
      const dexBalance
        = await DEXActor.getBalance(Principal.fromText(tokenCanisters[updateIndex].canisterId));

      // Set new user infomation.
      setUserTokens(
        userTokens.map((userToken, index) => (
          index === updateIndex ? {
            symbol: userToken.symbol,
            balance: balance.toString(),
            dexBalance: dexBalance.toString(),
            fee: userToken.fee,
          } : userToken))
      );

    } catch (error) {
      console.log(`handleDeposit: ${error} `);
    }
  };

  const handleWithdraw = async (updateIndex) => {
    const tokenActor = Actor.createActor(tokenCanisters[updateIndex].factory, {
      agent,
      canisterId: tokenCanisters[updateIndex].canisterId,
    });

    const DEXActor = Actor.createActor(DEXidlFactory, {
      agent,
      canisterId: DEXCanisterId,
    });

    try {
      const resultWithdraw
        = await DEXActor.withdraw(Principal.fromText(tokenCanisters[updateIndex].canisterId), 5000);
      console.log(`resultWithdraw: ${resultWithdraw.Ok}`);
      // Get updated balance of token Canister.
      const balance
        = await tokenActor.balanceOf(Principal.fromText(currentPrincipalId));
      // Get updated balance in DEX.
      const dexBalance
        = await DEXActor.getBalance(Principal.fromText(tokenCanisters[updateIndex].canisterId));

      // Set new user infomation.
      setUserTokens(
        userTokens.map((userToken, index) => (
          index === updateIndex ? {
            symbol: userToken.symbol,
            balance: balance.toString(),
            dexBalance: dexBalance.toString(),
            fee: userToken.fee,
          } : userToken))
      );

    } catch (error) {
      console.log(`handleWithdraw: ${error} `);
    }
  };

  const checkClientIdentity = async () => {
    try {
      const authClient = await AuthClient.create();
      const resultAuthenticated = await authClient.isAuthenticated();
      if (resultAuthenticated) {
        const principal = authClient.getIdentity().getPrincipal();
        console.log(`principal: ${principal.toText()}`);
        setCurrentPrincipalId(principal.toText());

        // Using the identity obtained from the auth client,
        // we can create an agent to interact with the IC.
        const identity = authClient.getIdentity();
        const createAgent = new HttpAgent({ identity });
        // TODO: Must comment out later!!!
        // if (process.env.DFX_NETWORK === "local") {
        createAgent.fetchRootKey();
        // }

        getUserTokens(createAgent, principal);
        getOrders(createAgent);
        setAgent(createAgent);
      } else {
        console.log(`isAuthenticated: ${resultAuthenticated}`);
      }
    } catch (error) {
      console.log(`checkClientIdentity: ${error}`);
    }
  }

  // ページがリロードされた時、以下の関数を実行
  useEffect(() => {
    console.log('useEffect');
    checkClientIdentity();
  }, [])

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
      </ul>

      <main className="app">
        {/* LIST USER TOKEN */}
        {currentPrincipalId &&
          <div className="token-list">
            {/* {window.ic.plug.isConnected() && */}
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
                    <option value="THG">THG</option>
                    <option value="TPY">TPY</option>
                  </select>
                </div>
                <div>
                  <label>Amount</label>
                  <input
                    name="fromAmount"
                    type="number"
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
                    <option value="THG">THG</option>
                    <option value="TPY">TPY</option>
                  </select>
                </div>
                <div>
                  <label>Amount</label>
                  <input
                    name="toAmount"
                    type="number"
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
              {orderList.map((order, index) => {
                return (
                  <tr key={`${index}: ${order.token} `} >
                    <td data-th="From">{order.from.toString()}</td>
                    <td data-th="Amount">{order.fromAmount.toString()}</td>
                    <td>→</td>
                    <td data-th="To">{order.to.toString()}</td>
                    <td data-th="Amount">{order.toAmount.toString()}</td>
                    <td data-th="Action">
                      <div>
                        <button
                          className="btn-buy"
                          onClick={() => handleBuyOrder(order)}
                        >Buy</button>
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancelOrder(order.id)}
                        >Cancel</button>
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
};

export default App;