import { app, InvocationContext, Timer } from "@azure/functions";
import { scraper } from "./scraper";
import { EuriborRates } from "./euribor-rates";
import { Telegraf } from "telegraf";
import escapeHtml = require("escape-html");
import { CosmosClient } from "@azure/cosmos";

export async function timerTrigger(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  const endpoint = process.env["CosmosEndpoint"];
  const key = process.env["CosmosKey"];
  const botToken = escapeHtml(process.env["TelegramBotToken"]);
  const chatId = escapeHtml(process.env["ChatId"]);
  const adminId = escapeHtml(process.env["AdminId"]);
  const databaseName = process.env["DatabaseName"];
  const containerName = process.env["ContainerName"];
  const url = process.env["Url"];

  const cosmosClient = new CosmosClient({ endpoint, key });

  const { database } = await cosmosClient.databases.createIfNotExists({
    id: databaseName,
  });

  context.log(`${database.id} database ready`);

  const { container } = await database.containers.createIfNotExists({
    id: containerName,
    partitionKey: { paths: ["/id"] },
  });

  // Scrape item
  const euriborRates = await scraper(url);
  context.log(`Url scraped`);

  const { resource: item } = await container
    .item(euriborRates.id, euriborRates.id)
    .read();
  context.log(`Checked if item already scraped`);

  const bot = new Telegraf(botToken);

  // if (euriborRates.M3 <= 2.728) {
  //   const thresholdMessage = `2.728 threshold reached, M3 value is: ${euriborRates.M3}`;
  //   context.log(thresholdMessage);
  //   bot.telegram.sendMessage(adminId, thresholdMessage);
  // }

  if (!item) {
    // Save item to cosmos Db
    const { resource: newItem } = await container.items.create(euriborRates);
    context.log(`Item '${newItem.id}' inserted`);

    // Send data to bot
    bot.telegram.sendMessage(chatId, prepareMessage(euriborRates));
    context.log("Data sent to chat");
  }
}

app.timer("timerTrigger", {
  schedule: process.env["Schedule"],
  handler: timerTrigger,
});

function prepareMessage(euriborRates: EuriborRates): string {
  return `${euriborRates.date}
  Euribor 1 week: ${euriborRates.W1} ${CalculateTrendEmoji(
    euriborRates.W1!,
    euriborRates.W1Prev!
  )}
  Euribor 1 month: ${euriborRates.M1} ${CalculateTrendEmoji(
    euriborRates.M1!,
    euriborRates.M1Prev!
  )}
  Euribor 3 months: ${euriborRates.M3} ${CalculateTrendEmoji(
    euriborRates.M3!,
    euriborRates.M3Prev!
  )}
  Euribor 6 months: ${euriborRates.M6} ${CalculateTrendEmoji(
    euriborRates.M6!,
    euriborRates.M6Prev!
  )}
  Euribor 12 months: ${euriborRates.M12} ${CalculateTrendEmoji(
    euriborRates.M12!,
    euriborRates.M12Prev!
  )}`;
}

function CalculateTrendEmoji(currentRate: number, lastRate: number): string {
  if (currentRate < lastRate) return "📉";
  return "📈";
}
