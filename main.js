import { dex } from "./dex.js";
import { env } from "./env.js";

let startFrom = "sell";

async function main() {
  if (startFrom === "sell") {
    startFrom = "buy";
    dex.sell();
  }

  if (startFrom === "buy") {
    startFrom = "sell";
    dex.buy();
  }
}

main();
//setInterval(main, 1000 * 60);
