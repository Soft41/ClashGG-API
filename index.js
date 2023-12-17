import express from "express";
import env from "dotenv";
import router from "./router/router.js";
import mongoose from "mongoose";
import userRouter from "./router/userApi.js";
import {Worker} from "./worker/index.js";
import {Telegraf} from 'telegraf'
import cloudCookie from "./scheme/cloudCookie.js";
import cron from "node-cron";
import userService from "./services/userService.js";
import rainLog from "./scheme/rainLog.js";
import {ClashGGAPI} from "./clashGG-API.js";
import cors from 'cors'
env.config();


const PORT = process.env.PORT || 5000;
const app = express();
const captchaTokens = []
const maxQuantityTokens = 1;
let flagPromiseCaptchaReady = false;
app.use(cors())
app.use('/api', router)
app.use('/user', userRouter)
app.use(express.json())

const start = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL)
    app.listen(PORT, () => {
      console.log(`Good start, PORT: ${PORT}`);
    });
  }catch (e) {
    console.log(e);
  }
};

start();

const bot = new Telegraf('')
const chatId = []

const runUser = async (user) => {
  try {
    const worker = new Worker(user);
    const initSuccess = await worker.init();

    if (initSuccess) {

      // if (worker.user.isBanned) {
      //   console.log('BAN')
      //   return false
      // }

      await worker.updateInfo();

      const randomDelay = Math.floor(Math.random() * 10) + 5;
      console.log(`Waiting for ${randomDelay} seconds...(Rain)`);

      await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));

      let result = false
      while (!result) {
        let token = captchaTokens.pop()
        while (!(token || flagPromiseCaptchaReady)) {
          token = captchaTokens.pop()
          const currentTime = new Date();
          const currentMinutes = currentTime.getMinutes();

          if ((currentMinutes >= 30 && currentMinutes <= 57) || (currentMinutes >= 0 && currentMinutes <= 27)) {
            console.log('Время вышло')
            return
          }
        }

        if (!token) {
          console.log('NO TOKEN')
          return
        }
        console.log(`Остаток капч: ${captchaTokens.length}`)
        result = await worker.joinToRain(token);
        if (result.data.success) {
          console.log(result.data)
          console.log('Success join')
          return
        } else {
        }
        // data: { statusCode: 400, message: 'cant_join_now', error: 'Bad Request' }
        if (result.data.message === 'cant_join_now') {
          console.log('Время истекло')
          return
        }
      }

    } else {
      console.log('No cookie')
    }
  } catch (e) {
    console.log(e)
  }
};

const runAllUser = async () => {
  const allUsers = await userService.getAll();
  const userPromises = allUsers.map(user => runUser(user));

  await Promise.all(userPromises);
  console.log(`All promises completed (Rain).`);
  console.log(`Остаток капч после рейна: ${captchaTokens.length}`)
  while (captchaTokens.length !== 0) {
    captchaTokens.pop()
  }
  console.log(`Остаток капч после удаления: ${captchaTokens.length}`)
};

const calculateProfit = async (worker) => {
  const oldBalance = worker.user.balance || 0;
  await worker.updateInfo();
  const newBalance = worker.user.balance || 0;
  return newBalance - oldBalance;
};

const createLogEntry = async (worker, profit) => {
  const oldBalance = worker.user.balance || 0;
  const newBalance = oldBalance + profit;
  await rainLog.create({
    profit: profit,
    oldBalance: oldBalance,
    newBalance: newBalance,
    user: worker.user._id
  });
};

const sendMessages = async (totalProfit, messages) => {
  const totalSummaryMessage = `Общая прибыль всех пользователей: ${totalProfit / 100}`;
  console.log(totalSummaryMessage);

  for (const id of chatId) {
    const fullMessage = `${totalSummaryMessage}\n\n${messages.join('\n')}`;
    try {
      await bot.telegram.sendMessage(id, fullMessage);
      console.log('Сообщение отправлено успешно.');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  }
};

const sendMessage = async () => {
  const allUsers = await userService.getAll();

  let totalProfit = 0;
  const above18BalanceMessages = [];
  const below18BalanceMessages = [];

  for (const user of allUsers) {
    const worker = new Worker(user);
    await worker.init();

    const profit = await calculateProfit(worker);
    totalProfit += profit;
    let message = `Логин: ${user.login} | прибыль: ${profit / 100} | баланс: ${(worker.user.balance || 0) / 100}`;
    // if (user.isBanned) {
    //   message = `Логин: ${user.login} | BANNED`;
    // } else {
    //   message = `Логин: ${user.login} | прибыль: ${profit / 100} | баланс: ${(worker.user.balance || 0) / 100}`;
    // }

    if (user.balance >= 1800) {
      above18BalanceMessages.push(message);
    } else {
      below18BalanceMessages.push(message);
    }

    await createLogEntry(worker, profit);
  }

  // Define a sorting function based on profit
  const profitComparator = (messageA, messageB) => {
    // Extract profit values from messages
    const profitA = parseFloat(messageA.match(/прибыль: ([\d.]+)/)[1]);
    const profitB = parseFloat(messageB.match(/прибыль: ([\d.]+)/)[1]);
    return profitB - profitA;
  };

  // Sort messages within each group
  above18BalanceMessages.sort(profitComparator);
  below18BalanceMessages.sort(profitComparator);

  // Create header messages for each group
  const above18Header = "Пользователи с балансом выше 18: \n";
  const below18Header = "Пользователи с балансом меньше 18: \n";

  // Combine headers and messages
  const messages = [above18Header, ...above18BalanceMessages, below18Header, ...below18BalanceMessages];

  await sendMessages(totalProfit, messages);
};

const sendSummary = async (currentDay = true) => {
  const allUsers = await userService.getAll();

  let totalProfit = 0;
  const messages = [];

  const currentDate = new Date();
  const targetDate = new Date(currentDate);

  if (!currentDay) {
    targetDate.setDate(currentDate.getDate() - 1); // Получение даты предыдущего дня
  }

  for (const user of allUsers) {
    const worker = new Worker(user);
    await worker.init();

    const profitEntries = await rainLog.find({
      user: user._id,
      createdAt: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)), // Начало дня
        $lte: new Date(targetDate.setHours(23, 59, 59, 999)), // Конец дня
      }
    }).sort({ createdAt: -1 });

    const userTotalProfit = profitEntries.reduce((acc, entry) => acc + entry.profit, 0);
    totalProfit += userTotalProfit;

    const message = `Логин: ${user.login} | прибыль${currentDay ? ' за текущий день' : ' за предыдущий день'}: ${userTotalProfit / 100} | баланс: ${user.balance / 100}`;
    messages.push(message);
  }

  const totalSummaryMessage = `Общая прибыль${currentDay ? ' за текущий день' : ' за предыдущий день'}: ${totalProfit / 100}`;
  console.log(totalSummaryMessage);

  for (const id of chatId) {
    const fullMessage = `${totalSummaryMessage}\n\n${messages.join('\n')}`;
    bot.telegram.sendMessage(id, fullMessage)
        .then(() => {
          console.log('Сообщение отправлено успешно.');
        })
        .catch(error => {
          console.error('Ошибка отправки сообщения:', error);
        });
  }
};

const initializeUsers = async () => {
  const allUsers = await userService.getAll();

  for (const user of allUsers) {
    const worker = new Worker(user);
    await worker.init();
  }

  console.log('Инициализация всех пользователей завершена.');
};

const removeAllCookie = async () => {
  try {
    await cloudCookie.deleteMany({});
    console.log('All cookies removed.');
  } catch (error) {
    console.error('Error removing cookies:', error);
  }
}

const solveAndCheckCaptcha = async () => {
  const clashAPI = new ClashGGAPI();
  const captchaId = await clashAPI.solver.solveCaptcha();
  console.log(`Captcha ID: ${captchaId}`);

  let ready = false;
  while (!ready) {
    ready = await clashAPI.solver.checkCaptcha(captchaId);
    const randomDelay = Math.floor(Math.random() * 10) + 5;
    console.log(`Waiting for ${randomDelay} seconds...(Captha)`);
    await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));
  }
  console.log('Captcha ready')
  captchaTokens.push(ready)
};

const fillCaptchaTokens = async () => {
  console.log(`Остаток капч перед получением новых: ${captchaTokens.length}`)
  while (captchaTokens.length !== 0) {
    captchaTokens.pop()
  }

  const promises = [];

  for (let i = 0; i < maxQuantityTokens; i++) {
    promises.push(solveAndCheckCaptcha(captchaTokens, i));
  }

  console.log(`All promises created.`); // Промежуточный лог

  flagPromiseCaptchaReady = false
  await Promise.all(promises);
  flagPromiseCaptchaReady = true
  console.log(`All promises completed (Captcha).`);
};

cron.schedule('15,45 * * * *', async () => {
  await removeAllCookie();
});

cron.schedule('28,58 * * * *', async () => {
  console.log('Join rain');
  await runAllUser();
});

cron.schedule('01,31 * * * *', async () => {
  console.log('Send messages');
  await sendMessage();
});

cron.schedule('57,27 * * * *', async () => {
  console.log('Get tokens');
  await fillCaptchaTokens();
});

cron.schedule('5 6,12,18 * * *', async () => {
  console.log('sendDailySummary (current day)');
  await sendSummary(true);
});

cron.schedule('5 0 * * *', async () => {
  console.log('sendDailySummary (previous day)');
  await sendSummary(false);
});

// fillCaptchaTokens()
// runAllUser()
// await sendMessage();
// initializeUsers()