// import { icp_basic_dex_backend } from "../../declarations/icp_basic_dex_backend";

// document.querySelector("form").addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const button = e.target.querySelector("button");

//   const name = document.getElementById("name").value.toString();

//   button.setAttribute("disabled", true);

//   // Interact with foo actor, calling the greet method
//   const greeting = await icp_basic_dex_backend.greet(name);

//   button.removeAttribute("disabled");

//   document.getElementById("greeting").innerText = greeting;

//   return false;
// });

// Elements list
const els = {};

// Initialises the application listeners and handlers
function main() {
  els.btnTitle = document.querySelector('#btn-title');
  els.button = document.querySelector('#button-connect');
  els.button.addEventListener("click", onButtonPress);
}

// Button press handler
async function onButtonPress() {
  // Lock button events
  els.button.disabled = true;

  // Request for the Plug wallet connection
  // witch returns a boolean response
  const isConnected = await window.ic?.plug?.requestConnect();

  // Terminate on requestConnect permission refusal
  if (!isConnected) {
    els.btnTitle.textContent = "Plug wallet connection was refused";
    return;
  }

  // If truthy proceeds to the next step (request balance)
  // otherwise updates the button text with failure message
  els.btnTitle.textContent = "Plug wallet is connected";

  console.log("Principal: " + window.ic.plug.principalId);
  console.log("AccountID: " + window.ic.plug.accountId);
}

// Calls the Main function when the document is ready
document.addEventListener("DOMContentLoaded", main);