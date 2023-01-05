import Web3 from "web3";
const web3 = new Web3();

export const status = {
  success: "success",
  fail: "fail",
};

export const delay = (second) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, second * 1000);
  });
};

export const afterPercent = (amount, percent) => {
  const BN = web3.utils.BN;
  const amountBN = new BN(amount);
  const percentBN = new BN(+percent * 100);
  const hundred = new BN("100");
  const res = amountBN.mul(percentBN).div(hundred).toString();
  return res;
};

export const token = {
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  isWBNB: (x) => {
    return stringEq(x, token.WBNB);
  },

  isBUSD: (x) => {
    return stringEq(x, token.BUSD);
  },
};

export const stringEq = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  return a.toLocaleLowerCase() === b.toLocaleLowerCase();
};

const BN = web3.utils.BN;
export const mulBN = (a, b) => {
  const aBN = new BN(a);
  const bBN = new BN(b);
  return aBN.mul(bBN).toString();
};

export const now = () => {
  return Math.floor(Date.now() / 1000);
};
