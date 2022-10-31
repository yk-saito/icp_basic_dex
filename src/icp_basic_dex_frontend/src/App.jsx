import React, { useEffect, useState } from 'react';
import './App.css';

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

  return (
    <>
      {/* HEADER */}
      <ul>
        <li>SIMPLE DEX</li>
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