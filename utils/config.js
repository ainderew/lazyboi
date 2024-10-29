
const dotenv = require("dotenv")
dotenv.config()

export const config = {
  API_ENDPOINT: process.env.API_ENDPOINT || "http://localhost:4200"
}


