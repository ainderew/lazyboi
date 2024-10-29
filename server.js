const express = require("express");
const app = express();
const path = require("path")
const cron = require("node-cron");
const automateSprout = require("./login");
const retryCatch = require("./retryCatch");
const db = require("./db/initDB");

const RecordKeeping = require("./service/RecordKeeping.service");
const { LOGIN_MODE } = require("./enums");
const checkRecord = require("./routes/CheckRecords.route");

app.use("/boom", express.static(path.join(__dirname, 'public')));

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
  await automateSprout(LOGIN_MODE.in)

  const rk = new RecordKeeping()
  rk.writeRecord("test_in")

  res.send("TEST LOGIN ROUTE")
})

app.get("/test-logout", async function(req, res) {
  await automateSprout(LOGIN_MODE.out)

  const rk = new RecordKeeping()
  rk.writeRecord("test_in")

  res.send("TEST LOGOUT ROUTE")
})

app.get("/get-records", checkRecord)

app.listen(4200, () => {
  console.log("Server Running PORT: 4200");
});
