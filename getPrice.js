import { dex } from "./dex.js";
import Web3 from "web3";
const web3 = new Web3();

async function logPrice(amount, type) {
  const priceInfo = await dex.getPrice(amount, type);
  return {
    amount: amount,
    type: type,
    amountIn: web3.utils.fromWei(priceInfo.amountIn),
    amountOut: web3.utils.fromWei(priceInfo.amountOut),
    price: priceInfo.price,
  };
}

logPrice("0.1", "buy").then(console.log);
logPrice("1", "buy").then(console.log);
logPrice("0.1", "sell").then(console.log);
logPrice("1", "sell").then(console.log);
