import "dotenv/config";
import express from "express";
import cors from "cors";

import { config } from "../../config.js";

const server = express();
server.use(cors);
server.use(express.json());

server.listen(config.httpPort, () => {
  console.log(`Server listening at http://localhost:${config.httpPort}`);
});
