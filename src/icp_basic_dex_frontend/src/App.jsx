import React from 'react';
import './App.css';

const App = () => {
  return (
    <>
      <ul>
        <li>SIMPLE DEX</li>
        <li style={{ float: 'right' }}>
          <button id="button-connect" className="button-rainbow">
            <div className="button-container">
              {/* <img src="plug-light.svg" alt="Plug logo" class="plug-icon"> */}
              <span id="btn-title">Connect with Plug</span>
            </div>
          </button>
        </li>
      </ul>
      <main className="app">
        {/* LIST USER TOKEN */}
        <div className="token-list">
          <p>Token</p>
          <table>
            <tbody>
              <tr>
                <th>Token</th>
                <th>Balance</th>
                <th>Fee</th>
                <th>Action</th>
              </tr>
              <tr>
                <td data-th="Token">HOGE</td>
                <td data-th="Balance">100</td>
                <td data-th="Fee">5</td>
                <td data-th="Action">
                  <div className="btn-token">
                    <button className='btn-deposit'>Deposit</button>
                    <button className='btn-withdraw'>Withdraw</button>
                    <button className='btn-faucet'>Faucet</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td data-th="Token">PIYO</td>
                <td data-th="Balance">200</td>
                <td data-th="Fee">5</td>
                <td data-th="Action">
                  <div className="btn-token">
                    <button className='btn-deposit'>Deposit</button>
                    <button className='btn-withdraw'>Withdraw</button>
                    <button className='btn-faucet'>Faucet</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* CREATE ORDER */}
        <div className="create-order-area">
          <div className="title">
            <p>CREATE ORDER</p>
            <button>+</button>
          </div>
          <form className="form">
            <div>
              <div>
                <label>From</label>
                <input></input>
              </div>
              <div>
                <label>Amount</label>
                <input></input>
              </div>
              <div>
                <span>→</span>
              </div>
              <div>
                <label>To</label>
                <input></input>
              </div>
              <div>
                <label>Amount</label>
                <input></input>
              </div>
            </div>
            <button>Add Order</button>
          </form>
        </div>
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
              <tr>
                <td data-th="From">HOGE</td>
                <td data-th="Amount">100</td>
                <td>→</td>
                <td data-th="To">PIYO</td>
                <td data-th="Amount">100</td>
                <td data-th="Action">
                  <div>
                    <button className="btn-buy">Buy</button>
                    <button className="btn-cancel">Cancel</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td data-th="From">PIYO</td>
                <td data-th="Amount">10</td>
                <td>→</td>
                <td data-th="To">HOGE</td>
                <td data-th="Amount">10</td>
                <td data-th="Action">
                  <div>
                    <button className="btn-buy">Buy</button>
                    <button className="btn-cancel">Cancel</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}

export default App;