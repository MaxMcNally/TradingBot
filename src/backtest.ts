#!/usr/bin/env ts-node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { fetchYahooData } from "./utils/yahoo";
import { runStrategy } from "./strategies/runStrategy";

const argv = yargs(hideBin(process.argv))
  .option("symbol", { type: "string", demandOption: true })
  .option("start", { type: "string", demandOption: true })
  .option("end", { type: "string", demandOption: true })
  .parseSync();

async function main() {
  const data = await fetchYahooData(argv.symbol, argv.start, argv.end);
  const result = runStrategy(argv.symbol, data);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
