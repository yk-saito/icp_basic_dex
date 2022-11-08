import React from 'react';

export const Header = (props) => {
  const { handleLogin } = props;

  return (
    <ul>
      <li>SIMPLE DEX</li>
      <li style={{ float: 'right' }}>
        <button
          onClick={handleLogin}>
          Login Internet Identity
        </button>
      </li>
    </ul>
  )
}