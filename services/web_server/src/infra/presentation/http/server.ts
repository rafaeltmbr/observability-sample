import express from "express";
import cors from "cors";

import { config } from "../../config";
import { fibonacciRouter } from "./routers/fibonacciRouter";
import { errorMiddleware } from "./middlewares/errorMiddleware";

const server = express();
server.use(cors());
server.use(express.json());
server.use("/fibonacci", fibonacciRouter);
server.use(errorMiddleware);

server.listen(config.httpServerPort, () => {
  console.log(`Server listening at http://localhost:${config.httpServerPort}`);
});
