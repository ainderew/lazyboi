const express = require("express");
const app = express();
const cron = require("node-cron");
const { clickElementByText } = require("./login");

app.get("/", function (req, res) {
  res.send({Status: 200})
});

app.get("/startCron", function (req, res) {
  res.send("CRON PAGE");

  console.log("running");
  cron.schedule("* * * * *", () => {
    console.log("testing every minute pings");
    let now = new Date();
    console.log(now);
  });

  cron.schedule(
    "0 7 * * *",
    () => {
      console.log("LOGOUT");
      const randomNum = Math.floor(Math.random() * (40 - 1 + 1)) + 1;
      setTimeout(clickElementByText, randomNum);
      clickElementByText();
    },
    {
      scheduled: true,
      timezone: "Asia/Manila",
    }
  );

  cron.schedule(
    "0 22 * * *",
    () => {
      console.log("LOGIN");
      const randomNum = Math.floor(Math.random() * (40 - 1 + 1)) + 1;
      setTimeout(clickElementByText, randomNum);
      clickElementByText();
    },
    {
      scheduled: true,
      timezone: "Asia/Manila",
    }
  );
});

app.listen(3000, () => {
  console.log("Server Running PORT: 3000");
});
