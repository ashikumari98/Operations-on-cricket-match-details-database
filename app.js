const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());
let database = null;

const initializeDbAndServer = async()=>{
    try {
        database=await open({
            filename: databasePath,
            driver: sqlite3.Database,
        });
        app.listen(3000,()=>
        console.log("Server Running at http://localhost:3000/");
        );
    } catch (error) {
        console.log("DB Error: ${error.message}");
        process.exit(1);
    }
}
initializeDBAndServer();

const convertPlayerDbObjectToResponseObject=(dbObject)=>{
    return{
        playerId:dbObject.player_id,
        playerName:dbObject.player_name,
        };
};


const convertMatchDbObjectToResponseObject=(dbObject)=>{
    return{
        matchId:dbObject.match_id,
        match:dbObject.match,
        year:dbObject.year,
        };
};

const convertPlayermatchDbObjectToResponseObject=(dbObject)=>{
    return{
        playerMatchId:dbObject.player_match_id,
        playerId:dbObject.player_id,
        matchId:dbObject.match_id,
        score:dbObject.score,
        fours:dbObject.fours,
        sixes:dbObject.sixes,
        };
};



app.get("/players/",async(request,response)=>{
    const {playerId} request.params;
    const getPlayerQuery=`
    SELECT
    player_name
    FROM
    player;
    `;
    const playerArray=await database.all(getPlayerQuery):
    response.send(playerArray.map((eachPlayer)=>({playerName:eachPlayer.player_name})
    );
});

app.get("/players/:playerId/",async(request,response)=>{
    const {playerId} request.params;
    const getPlayerQuery=`
    SELECT
    *
    FROM
    player
    WHERE player_id=${playerId};
    `;
    const playerArray=await database.all(getPlayerQuery):
    response.send(convertPlayerDbObjectToResponseObject(player));
});


app.put("/players/:playerId/",async(request,response)=>{
    const { playerName } =request.body;
    const {playerId} =request.params;
    const updatePlayerQuery =`
    UPDATE
    player
    SET
    player_name=${playerName},
    WHERE
    player_id=${playerId};
    `;
    await database.run(updatePlayerQuery);
    response.send("Player Details Updated");
});


app.get("/matches/:matchId/",async(request,response)=>{
    const {matchId} = request.params;
    const getMatchQuery=`
    SELECT
    *
    FROM
    match;
    `;
    const matchArray=await database.all(getMatchQuery):
    response.send(matchArray.map((eachMatch)=>({matchName:eachMatch.match_name})
    );
});

app.get("/players/:playerId/matches",async(request,response)=>{
    const {playerId} = request.params;
    const getPlayerMatchesQuery =`
    SELECT
    *
    FROM 
    player_match_score
    NATURAL JOIN
    match_details
    WHERE
    player_id=${playerId};
    `;
    const playerMatches=await database.all(getPlayerMatchesQuery);
    response.send(playerMatches.map((eachMatch)=>convertMatchDbObjectToResponseObject(eachMatch)
    )
    );
});


app.get("/matches/:matchId/players/",async(request,response)=>{
    const getPlayerMatchesQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
        const playerMatches=await database.all(getPlayerMatchesQuery);
        response.send(playerMatches.map((eachMatch)=>convertMatchDbObjectToResponseObject(eachMatch)
    )
    );
})


app.get("/states/:stateId/stats/",async(request,response)=>{
    const getPlayerScored=`
   SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes 
    FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
    const stats=await database.get(getPlayerScored);
    console.log(stats);
    response.send({
        totalScore: stats["SUM(score)"],
        totalFours: stats["SUM(fours)"],
        totalSixes: stats["SUM(sixes)"],
        });
});