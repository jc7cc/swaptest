import Web3 from "web3";
const web3 = new Web3();
const privateKey = process.argv[2];
const account = web3.eth.accounts.privateKeyToAccount(privateKey);

export const env = {
  account: account,
  gasPrice: "5",
  slippage: 0.01, // percentage
  amount: "0.1",
};
