import express from "express"

// Initialise express
const app = express();
// Add body-parser
app.use(express.json());

export default app;