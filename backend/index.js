import express from "express";
import characterRoutes from "./routes/CharacterRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
// Add to your index.js temporarily

app.use("/api/game", gameRoutes); 
app.use("/api/characters", characterRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/characters`);
});

export default app;