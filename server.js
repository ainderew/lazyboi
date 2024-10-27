const express = require("express");
const app = express();
const cron = require("node-cron");
const automateSprout = require("./login");
const retryCatch = require("./retryCatch");
const db = require("./db/initDB");
const RecordKeeping = require("./service/RecordKeeping.service");

app.get("/", function(req, res) {
  console.log("SOMEONE PINGED ME");
  res.send({ Status: 200 });
});

app.get("/startCron", function(req, res) {
  res.send("CRON PAGE");
  console.log("running");

  cron.schedule(
    "0 7 * * 2-6",
    () => {
      const randomNum = Math.floor(Math.random() * (30 - 1 + 1)) + 1;

      console.log("LOGOUT");
      console.log(`Delayed by: ${randomNum} minutes`);
      setTimeout(() => retryCatch(automateSprout, "out", 10), randomNum * 1000 * 60);
    },
    {
      scheduled: true,
      timezone: "Asia/Manila",
    }
  );

  cron.schedule(
    "0 21 * * 1-5",
    () => {
      const randomNum = Math.floor(Math.random() * (30 - 1 + 1)) + 1;

      console.log("LOGIN");
      console.log(`Delayed by: ${randomNum} minutes`);
      setTimeout(() => retryCatch(automateSprout, "in", 10), randomNum * 1000 * 60);
    },
    {
      scheduled: true,
      timezone: "Asia/Manila",
    }
  );
});

app.get("/test-login", async function(req, res) {
  await automateSprout("in")

  const rk = new RecordKeeping("test_in")
  rk.writeRecord()

  res.send("TEST LOGIN ROUTE")
})

app.listen(4200, () => {
  console.log("Server Running PORT: 4200");
});
