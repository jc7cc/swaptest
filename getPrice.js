import { dex } from "./dex.js";

dex.getPrice("0.1", "buy").then(console.log);
dex.getPrice("1", "buy").then(console.log);
dex.getPrice("0.1", "sell").then(console.log);
dex.getPrice("1", "sell").then(console.log);
