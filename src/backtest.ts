#!/usr/bin/env ts-node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runStrategy } from "./strategies/runStrategy.ts";
import {YahooDataProvider} from "./dataProviders/yahooProvider.ts"
const argv = yargs(hideBin(process.argv))
  .option("symbol", { type: "string", demandOption: true })
  .option("start", { type: "string", demandOption: true })
  .option("end", { type: "string", demandOption: true })
  .parseSync();

async function main() {
  const dataProvider = new YahooDataProvider()
  const data = await dataProvider.getHistorical(argv.symbol, argv.start, argv.end);
  if(data){
  const result = runStrategy(argv.symbol, data?.map((d)=> {
    const {date,close, open} = d;
    return {date : date.toDateString(),close, open}
  })); 
  console.log(JSON.stringify(result, null, 2));
  }

}

main().catch(console.error);