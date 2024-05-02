const express = require("express");
const app = express();

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const injuryRouter = require('./routes/injurys.js'); 
const sessionRouter = require("./routes/sessions");
const matchRouter = require("./routes/match");
const forumRouter = require("./routes/forum");
const blogRouter = require("./routes/blog");
const joueurRouter = require('./routes/joueurs.js'); 
const formRouter = require('./routes/form.js');
const { scrapeBlessures } = require('./controllers/InjuryController.js');
const corsMiddleware = require("./middlewares/cors");
const csvParser = require("csv-parser");
const { spawn } = require('child_process');
const { PythonShell } = require('python-shell');
const http=require("http");

const cron = require("node-cron");

const { scrapeArticles } = require("./controllers/BlogController");
const {
  scrapeMatches,
  watchCSVFiles,
} = require("./controllers/matchController");

const meetingRoutes = require("./routes/meeting");

const cors = require("cors");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(err));
app.use(corsMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/sessions", sessionRouter);
app.use("/matches", matchRouter);
app.use("/forum", forumRouter);
app.use("/blog", blogRouter);
app.use("/api", meetingRoutes);
app.use("/injury", injuryRouter);
app.use("/joueur", joueurRouter);
app.use("/api/form", formRouter);
watchCSVFiles();

// scrapeArticles();
//  scrapeMatches();
//  scrapeBlessures();
cron.schedule("5 0 * * *", async () => {
  try {
    await scrapeArticles();

    console.log("Scraping triggered successfully");
  } catch (error) {
    console.error("Error occurred while triggering scraping:", error);
  }
});
cron.schedule("0 0 * * * ", async () => {
  try {
    await scrapeMatches();
    console.log("Scraping triggered successfully");
  } catch (error) {
    console.error("Error occurred while triggering scraping:", error);
  }
});
cron.schedule("0 0 * * * ", async () => {
  try {
    await scrapeBlessures();
    console.log("Scraping triggered successfully");
  } catch (error) {
    console.error("Error occurred while triggering scraping:", error);
  }
});
app.post('/predict', (req, res) => {
  const data = req.body;
  const python = spawn('python', ['predict.py', data.position, data.team, data.nationality, data.age]);
  python.stdout.on('data', (data) => {
    res.send({ prediction: data.toString() });
  });
  python.on('error', (error) => {
      console.error(`Error occurred while executing Python script: ${error.message}`);
  });
});
// New imports and routes
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const { generateRandomPassword, validatePassword } = require("./utils/helper");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/", authRoute);
app.use("/api/users", userRoute);
const chatRoute = require("./routes/chat");
app.use("/api", chatRoute);

const server= http.createServer(app);
const WebSocket = require("ws");




const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const wss = new WebSocket.Server({ server });

let teamScores = {
  teamA: { score: 0, name: "" },
  teamB: { score: 0, name: "" },
};
let gameFinished = false;

wss.on("connection", (ws) => {
  console.log("Client connected");

  
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);

    const data = JSON.parse(message);

    if (data.type === "update_scores") {
      const { teamA, teamB, teamAName, teamBName } = data;

      teamScores.teamA.score = teamA;
      teamScores.teamA.name = teamAName;
      teamScores.teamB.score = teamB;
      teamScores.teamB.name = teamBName;

      console.log("Updated scores:", teamScores);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "score_updated",
              teamA: teamScores.teamA,
              teamB: teamScores.teamB,
              teamScores,
            })
          );
        }
      });
    } else if (data.type === "finish_game") {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "game_finished" }));
        }
      });
    } else if (data.type === "restart") {
      teamScores.teamA.score = 0;
      teamScores.teamB.score = 0;
      teamScores.teamA.name = "";
      teamScores.teamB.name = "";
      gameFinished = false;

      console.log("Game restarted");

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "game_restarted" }));
        }
      });
    } else     if (data.type === "new_chat_message") {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
    

  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});



