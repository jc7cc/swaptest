import { dex } from "./dex.js";

let startFrom = process.argv[3];

async function main() {
  if (startFrom === "sell") {
    dex.sell();
    startFrom = "buy";
    return;
  }

  if (startFrom === "buy") {
    dex.buy();
    startFrom = "sell";
    return;
  }
}

if (process.arch[4] === "iterate") {
  setInterval(main, 1000 * 10);
} else {
  main();
}
