import React from 'react';

export const PlaceOrder = (props) => {
  const { currentPrincipalId, handleChangeOrder, handleSubmitOrder } = props;

  return (
    <>
      {currentPrincipalId &&
        <div className="create-order-area">
          <div className="title">
            <p>PLACE ORDER</p>
            {/* <button>+</button> */}
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
    </>
  )
};