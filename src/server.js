import express from "express";
import dotenv from "dotenv";
import router from "./modules/app.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started to listen at port number ${PORT}...`);
});
