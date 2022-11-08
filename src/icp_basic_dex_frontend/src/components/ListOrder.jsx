import React from 'react';

export const ListOrder = (props) => {
  const { orderList, handleBuyOrder, handleCancelOrder } = props;

  return (
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
  );
}