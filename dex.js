import Web3 from "web3";
import { routerv2ABI } from "./routerV2.js";

export const web3 = new Web3("http://176.9.92.6:8000");

const routerAddress = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
const router = new web3.eth.Contract(routerv2ABI, routerAddress);

const status = {
  success: "success",
  fail: "fail",
};

const token = {
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
};

const type = {
  buy: "buy",
  sell: "sell",
};

async function getAmountsOut(amountsIn, path) {
  try {
    const res = await router.methods.getAmountsOut(
      web3.utils.toWei(amountsIn),
      path,
    ).call();
    return {
      status: status.success,
      amountIn: res[0],
      amountOut: res[1],
      price: +(+web3.utils.fromWei(res[0]) / +web3.utils.fromWei(res[1]))
        .toFixed(2),
    };
  } catch (err) {
    return {
      status: status.fail,
    };
  }
}

async function getAmountsIn(amountsOut, path) {
  try {
    const res = await router.methods.getAmountsIn(
      web3.utils.toWei(amountsOut),
      path,
    ).call();
    return {
      status: status.success,
      amountIn: res[0],
      amountOut: res[1],
      price: +(+web3.utils.fromWei(res[1]) / +web3.utils.fromWei(res[0]))
        .toFixed(2),
    };
  } catch (err) {
    return {
      status: status.fail,
    };
  }
}

async function getBNBPrice(swapType) {
  switch (swapType) {
    case type.buy:
      return await getAmountsIn("0.1", [token.BUSD, token.WBNB]);
    case type.sell:
      return await getAmountsOut("0.1", [token.WBNB, token.BUSD]);
  }
}

getBNBPrice(type.buy).then(console.log);
getBNBPrice(type.sell).then(console.log);
