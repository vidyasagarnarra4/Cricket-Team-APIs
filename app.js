const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketTeam.db");

app.use(express.json());

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT * FROM cricket_team ORDER by player_id;
    `;
  const playersListArray = await db.all(getPlayersQuery);

  const formattedPlayersList = playersListArray.map((eachPlayer) =>
    convertDbObjectToResponseObject(eachPlayer)
  );
  response.send(formattedPlayersList);
});

app.post("/players/", async (request, response) => {
  const addingNewPlayerData = request.body;
  const { playerName, jerseyNumber, role } = addingNewPlayerData;

  const addPlayerQuery = `
        INSERT INTO cricket_team (player_Name, jersey_number, role)
        VALUES ("${playerName}", ${jerseyNumber}, "${role}");
    `;

  const newPlayer = await db.run(addPlayerQuery);
  response.send("Player Added to Team");
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `SELECT * FROM cricket_team WHERE player_id = ${playerId}`;
  const playerDetails = await db.get(getPlayerQuery);

  const formattedPlayerDetails = convertDbObjectToResponseObject(playerDetails);
  response.send(formattedPlayerDetails);
});

app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const playerUpdateDetails = request.body;
    const { playerName, jerseyNumber, role } = playerUpdateDetails;

    const updatePlayerQuery = `
        UPDATE cricket_team 
        SET 
            player_name='${playerName}',
            jersey_number=${jerseyNumber},
            role='${role}'
        WHERE player_id = ${playerId};
    `;

    await db.run(updatePlayerQuery);
    response.send("Player Details Updated");
  } catch (error) {
    console.error("Error updating player details:", error);
    response.status(500).send("Internal Server Error");
  }
});

app.delete("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const deletePlayerQuery = `DELETE FROM cricket_team WHERE player_id = ${playerId}`;
  await db.run(deletePlayerQuery);
  response.send("Player Removed");
});

module.exports = app;
