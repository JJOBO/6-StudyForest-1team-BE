import express from "express";
import router from "./modules/app.js"; 

const app = express();
const PORT = 2020;

app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Server started to listen at port number ${PORT}...`);
});