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

import { Header } from './components/Header';
import { UserBoard } from './components/UserBoard';
import { PlaceOrder } from './components/PlaceOrder';
import { ListOrder } from './components/ListOrder';

// import { UserTokensProvider } from './context/UserTokens';

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

  const [userTokens, setUserTokens] = useState([]);

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
      const tokens = await getUserTokens(agent, Principal.fromText(currentPrincipalId));
      setUserTokens(tokens);

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
    // setUserTokens(tokens);
    return tokens;
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
    console.log(`process.env.DFX_NETWORK: ${process.env.DFX_NETWORK}`);

    let iiUrl;
    if (process.env.DFX_NETWORK === "local") {
      iiUrl = `http://localhost:8000/?canisterId=${IICanisterID}`;
    } else if (process.env.DFX_NETWORK === "ic") {
      iiUrl = `https://${IICanisterID}.ic0.app`;
    } else {
      iiUrl = `https://${IICanisterID}.dfinity.network`;
    }
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
    const newAgent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK === "local") {
      newAgent.fetchRootKey();
    }
    setAgent(newAgent);
    // Using the interface description of our webapp,
    // we create an Actor that we use to call the service methods.
    const DEXActor = Actor.createActor(DEXidlFactory, {
      newAgent,
      canisterId: DEXCanisterId,
    });
    const principal = await authClient.getIdentity().getPrincipal();

    // Get information about the tokens held by the Logged-in user.
    const tokens = await getUserTokens(newAgent, principal);
    setUserTokens(tokens);
    // Set Order list
    getOrders(newAgent);

    setCurrentPrincipalId(principal.toText());
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
        const newAgent = new HttpAgent({ identity });

        if (process.env.DFX_NETWORK === "local") {
          newAgent.fetchRootKey();
        }

        const tokens = await getUserTokens(newAgent, principal);
        setUserTokens(tokens);
        getOrders(newAgent);
        setAgent(newAgent);
      } else {
        console.log(`isAuthenticated: ${resultAuthenticated}`);
      }
    } catch (error) {
      console.log(`checkClientIdentity: ${error}`);
    }
  }

  const handleDeposit = async (updateIndex) => {
    // const [userTokens, setUserTokens] = useUserTokensContext();
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

  // ページがリロードされた時、以下の関数を実行
  useEffect(() => {
    console.log('useEffect');
    checkClientIdentity();
  }, [])

  return (
    <>
      <Header
        handleLogin={handleLogin}
      />
      <main className="app">
        {/* <UserTokensProvider> */}
        <UserBoard
          Actor={Actor}
          tokenCanisters={tokenCanisters}
          currentPrincipalId={currentPrincipalId}
          userTokens={userTokens}
          handleDeposit={handleDeposit}
          handleWithdraw={handleWithdraw}
        />
        {/* </UserTokensProvider> */}
        <PlaceOrder
          currentPrincipalId={currentPrincipalId}
          handleChangeOrder={handleChangeOrder}
          handleSubmitOrder={handleSubmitOrder}
        />
        <ListOrder
          orderList={orderList}
          handleBuyOrder={handleBuyOrder}
          handleCancelOrder={handleCancelOrder}
        />
      </main>
    </>
  )
};

export default App;