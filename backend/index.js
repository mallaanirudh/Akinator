import express from "express";
import characterRoutes from "./routes/CharacterRoutes.js";
import cors from "cors"
import gameRoutes from "./routes/gameRoutes.js";
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));
// Routes
app.use("/api/game", gameRoutes); 
app.use("/api/characters", characterRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;