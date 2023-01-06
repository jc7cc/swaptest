import { dex } from "./dex.js";

let startFrom = "sell";

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

main();
//setInterval(main, 1000 * 60);
