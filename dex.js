import Web3 from "web3";
import { routerv2ABI } from "./routerV2.js";
import { Common } from "@ethereumjs/common";
import { default as TX } from "@ethereumjs/tx";
import { env } from "./env.js";
import { mulBN, stringEq, token } from "./utils.js";
import fs from "fs";

export const web3 = new Web3("http://176.9.92.6:8000");

// const routerAddress = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
const routerAddress = "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8";
const router = new web3.eth.Contract(routerv2ABI, routerAddress);

const status = {
  success: "success",
  fail: "fail",
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
      price: +(+web3.utils.fromWei(res[1]) / +web3.utils.fromWei(res[0]))
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
      price: +(+web3.utils.fromWei(res[0]) / +web3.utils.fromWei(res[1]))
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

function makeTx(
  privateKey,
  from,
  nonce,
  to,
  value,
  gasLimit,
  gasPrice,
  data,
) {
  const txObject = {
    nonce: web3.utils.toHex(nonce),
    from: from,
    to: to,
    value: web3.utils.toHex(value),
    gasLimit: web3.utils.toHex(gasLimit),
    gasPrice: web3.utils.toHex(gasPrice),
    data: data,
  };

  const common = Common.custom({
    name: "bnb",
    networkId: 56,
    chainId: 56,
  }, "petersburg");
  const tx = TX.Transaction.fromTxData(txObject, { common });
  const signedTx = tx.sign(
    Buffer.from(web3.utils.stripHexPrefix(privateKey), "hex"),
  );

  const serializedTx = signedTx.serialize();
  const ResTx = "0x" + serializedTx.toString("hex");

  return ResTx;
}

async function sendTx_(
  privateKey,
  from,
  to,
  value,
  gasLimit,
  gasPrice,
  data,
) {
  try {
    const nonce = await web3.eth.getTransactionCount(
      from,
      "pending",
    );

    const tx = makeTx(
      privateKey,
      from,
      nonce,
      to,
      value,
      gasLimit,
      gasPrice,
      data,
    );
    return web3.eth.sendSignedTransaction(tx);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function buyBNB(amount, price) {
  try {
    const receipt = await sendTx_(
      env.account.privateKey,
      env.account.address,
      routerAddress,
      "0",
      "200000",
      web3.utils.toWei("5", "Gwei"),
      router.methods.swapTokensForExactETH(
        web3.utils.toWei(amount),
        web3.utils.toWei(amount * price * (1 + env.slippage)),
        [token.BUSD, token.WBNB],
        env.account.address,
        Math.floor(Date.now() / 1000) + 1000 * 60,
      ).encodeABI(),
    );

    if (receipt.status) {
      return {
        status: status.success,
        receipt: receipt,
      };
    }

    return {
      status: status.fail,
    };
  } catch (err) {
    console.log(err);
    return {
      status: status.fail,
    };
  }
}

const sellBNB = async (amountIn, price) => {
  try {
    const receipt = await sendTx_(
      env.account.privateKey,
      env.account.address,
      routerAddress,
      web3.utils.toWei(amountIn),
      "200000",
      web3.utils.toWei("5", "Gwei"),
      router.methods.swapExactETHForTokens(
        web3.utils.toWei((amountIn / price) * (1 - env.slippage)),
        [token.WBNB, token.BUSD],
        env.account.address,
        Math.floor(Date.now() / 1000) + 1000 * 60,
      ).encodeABI(),
    );

    if (receipt.status) {
      return {
        status: status.success,
        receipt: receipt,
      };
    }

    return {
      status: status.fail,
    };
  } catch (err) {
    console.log(err);
    return {
      status: status.fail,
    };
  }
};

const topics = {
  deposit: "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
  transfer:
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  withdrawl:
    "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65",
  isDeposit: (topic) => {
    return stringEq(topic, topics.deposit);
  },

  isTransfer: (topic) => {
    return stringEq(topic, topics.transfer);
  },

  isWithdrawl: (topic) => {
    return stringEq(topic, topics.withdrawl);
  },
};

const txSucceded = (receipt) => {
  return receipt && receipt.status;
};

const txFailed = (receipt) => {
  return !(txSucceded(receipt));
};

const isTransferOut = (topics, address) => {
  const topicAddress = web3.eth.abi.decodeParameter("address", topics[1]);
  return stringEq(topicAddress, address);
};

const isTransferIn = (topics, address) => {
  const topicAddress = web3.eth.abi.decodeParameter("address", topics[2]);
  return stringEq(topicAddress, address);
};

const getTransfer = (receipt) => {
  let bnbIn = "0";
  let bnbOut = "0";
  let busdIn = "0";
  let busdOut = "0";
  const logs = receipt.logs;
  logs.forEach(
    (log) => {
      const tokenAddress = log.address;
      if (token.isWBNB(tokenAddress) && topics.isDeposit(log.topics[0])) {
        bnbOut = web3.eth.abi.decodeParameter("uint256", log.data);
      }

      if (token.isWBNB(tokenAddress) && topics.isWithdrawl(log.topics[0])) {
        bnbIn = web3.eth.abi.decodeParameter("uint256", log.data);
      }

      if (
        token.isBUSD(tokenAddress) && topics.isTransfer(log.topics[0]) &&
        isTransferIn(log.topics, receipt.from)
      ) {
        busdIn = web3.eth.abi.decodeParameter("uint256", log.data);
      }

      if (
        token.isBUSD(tokenAddress) && topics.isTransfer(log.topics[0]) &&
        isTransferOut(log.topics, env.account.address)
      ) {
        busdOut = web3.eth.abi.decodeParameter("uint256", log.data);
      }
    },
  );
  return {
    bnbIn: web3.utils.fromWei(bnbIn),
    bnbOut: web3.utils.fromWei(bnbOut),
    busdIn: web3.utils.fromWei(busdIn),
    busdOut: web3.utils.fromWei(busdOut),
  };
};

export const decodeLog = (receipt, gasPrice) => {
  if (receipt === undefined) return;
  if (txSucceded(receipt)) {
    return {
      ...getTransfer(receipt),
      txFee: web3.utils.fromWei(
        mulBN(receipt.gasUsed.toString(), web3.utils.toWei(gasPrice, "Gwei")),
      ),
      gasUsed: receipt.gasUsed,
      gasPrice: web3.utils.toWei(gasPrice, "Gwei"),
    };
  }

  // if tx failed
  return {
    txFee: web3.utils.fromWei(mulBN(receipt.gasUsed.toString(), gasPrice)),
    gasUsed: receipt.gasUsed,
    gasPrice: web3.utils.toWei(gasPrice, "Gwei"),
  };
};

async function buyLog() {
  const buyinfo = await getBNBPrice(type.buy);
  const res = await buyBNB(env.amount, buyinfo.price);
  let data;
  if (res.status === status.success) {
    const transferInfo = decodeLog(res.receipt, env.gasPrice);
    data =
      `${buyinfo.price},${env.slippage}%,${transferInfo.bnbIn},${transferInfo.bnbOut},${transferInfo.busdIn},${transferInfo.busdOut},${transferInfo.gasPrice},${transferInfo.gasUsed},${transferInfo.txFee},${receipt.transactionHash}`;
    fs.appendFileSync("log", data);
  } else {
    if (res.receipt) {
      const transferInfo = decodeLog(res.receipt, env.gasPrice);
      data =
        `${buyinfo.price},${env.slippage}%,0,0,0,0,0,${transferInfo.gasUsed},${transferInfo.txFee},${receipt.transactionHash}`;
      fs.appendFileSync("log", data);
    }
  }
}

async function sellLog() {
  const sellInfo = await getBNBPrice(type.sell);
  const res = await sellBNB(env.amount, sellInfo.price);
  let data;
  if (res.status === status.success) {
    const transferInfo = decodeLog(res.receipt, env.gasPrice);
    data =
      `${buyinfo.price},${env.slippage}%,${transferInfo.bnbIn},${transferInfo.bnbOut},${transferInfo.busdIn},${transferInfo.busdOut},${transferInfo.gasPrice},${transferInfo.gasUsed},${transferInfo.txFee},${receipt.transactionHash}`;
    fs.appendFileSync("log", data);
  } else {
    if (res.receipt) {
      const transferInfo = decodeLog(res.receipt, env.gasPrice);
      data =
        `${buyinfo.price},${env.slippage}%,0,0,0,0,0,${transferInfo.gasUsed},${transferInfo.txFee},${receipt.transactionHash}`;
      fs.appendFileSync("log", data);
    }
  }
}

export const dex = {
  buy: buyLog,
  sell: sellLog,
};
