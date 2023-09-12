import axios from "axios";
import cheerio = require("cheerio");
import moment = require("moment");
import { EuriborRates } from "./euribor-rates";
require("moment/locale/it");

export async function scraper(url: string): Promise<EuriborRates> {
  //let euribor3Index = "";
  const euriborRates: EuriborRates = {};

  try {
    const { data } = await axios.get(url);

    // https://cheerio.js.org/
    const $ = cheerio.load(data);

    // Take the table with the euribor indexes
    const table = $("table.table");

    let date: moment.Moment = moment();
    table.find("thead > tr").each((_idx, el) => {
      // The most recent date.
      const dateStr = $(el).find("th.text-right").first().text();

      // It depends to the URL to crawl.
      const formatString: string =
        url.indexOf("/it/") > 0 ? "DD/MM/YYYY" : "MM/DD/YYYY";
      date = moment(dateStr, formatString);
    });

    euriborRates.id = date.valueOf().toString();
    euriborRates.date = date.format("L");

    // Take all the 5 rows of the table, each row is a different euribor index.
    table.find("tbody > tr").each((_idx, el) => {
      // The most recent value is inside the first td.
      let scrapedRate = $(el).find("td").first().text();
      let prevScrapedRate = $(el).find("td").first().next().text();
      scrapedRate = scrapedRate.replace("%", "").trim();
      prevScrapedRate = prevScrapedRate.replace("%", "").trim();
      if (_idx == 0) {
        euriborRates.W1 = Number(scrapedRate);
        euriborRates.W1Prev = Number(prevScrapedRate);
      }
      if (_idx == 1) {
        euriborRates.M1 = Number(scrapedRate);
        euriborRates.M1Prev = Number(prevScrapedRate);
      }
      if (_idx == 2) {
        euriborRates.M3 = Number(scrapedRate);
        euriborRates.M3Prev = Number(prevScrapedRate);
      }
      if (_idx == 3) {
        euriborRates.M6 = Number(scrapedRate);
        euriborRates.M6Prev = Number(prevScrapedRate);
      }
      if (_idx == 4) {
        euriborRates.M12 = Number(scrapedRate);
        euriborRates.M12Prev = Number(prevScrapedRate);
      }
    });
  } catch (error) {
    console.log(error);
  }

  // https://momentjs.com/docs/#/get-set/date/
  // console.log("date.date()", date.date()); // day of mon
  // console.log("date.month()", date.month()); // 0-11
  // console.log("date.year()", date.year());

  // the number of milliseconds since the Unix Epoch (January 1, 1970, 00:00:00 UTC)

  return euriborRates;
}
