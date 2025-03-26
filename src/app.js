import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import habitsRouter from "./modules/habits.module.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/study", habitsRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started to listen at port number ${PORT}...`);
});
