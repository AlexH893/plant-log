const express = require("express");
const axios = require("axios");
const db = require("./app");

const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PLANT_ID_API_URL = "https://plant.id/api/v3/kb/plants/name_search";
const API_KEY = "LkRMANX6QnypQ4JbiHoGbnuW0dmigllDPnf3WeBs2RJvAqYYAL";
require("dotenv").config();

const authenticateToken = require("../src/authenticateToken.js");

// GET Route to search for plants by name
router.get("/plants", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ error: "Query parameter 'query' is required" });
  }

  try {
    const response = await axios.get(PLANT_ID_API_URL, {
      params: { q: query },
      headers: { "Api-Key": API_KEY },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from Plant.id API:", error.message);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// GET all collections for authed user
router.get("/collection", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const query =
      "SELECT * FROM plant_collection WHERE user_id = ? AND active = 1";
    const [results] = await db.query(query, [userId]);
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching collections:", err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching collections." });
  }
});

// GET all plants in a collection
router.get("/collection/:id/plants", async (req, res) => {
  try {
    const collectionId = req.params.id;
    const [plants] = await db.query(
      `SELECT id, collection_id, scientific_name, common_name, nickname, quantity, last_watered, times_watered, deleted, is_custom
       FROM collection_plants
       WHERE collection_id = ? AND deleted = 0`,
      [collectionId]
    );
    res.json({ success: true, plants });
  } catch (error) {
    console.error("Error finding plants:", error);
    res.status(500).json({ error: "Error finding plants" });
  }
});

// GET collection by ID
router.get("/collection/:id", async (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM plant_collection WHERE id = ?";

  try {
    const [results] = await db.query(query, [id]);
    if (results.length === 0) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    console.error("Error retrieving collection:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET plant by ID
router.get("/plant/:id", async (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM plant WHERE id = ?";

  try {
    const [results] = await db.query(query, [id]);
    if (results.length === 0) {
      return res.status(404).json({ message: "Plant not found" });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error("Error retrieving plant:", err);
    res.status(500).send(err);
  }
});

// PUT Water plant
router.put("/collection/:collectionId/plant/:plantId", async (req, res) => {
  const { collectionId, plantId } = req.params;

  const sql = `
    UPDATE collection_plants
    SET last_watered = NOW(), times_watered = times_watered + 1
    WHERE collection_id = ? AND id = ?
  `;

  try {
    const [results] = await db.query(sql, [collectionId, plantId]);

    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Plant not found in the collection" });
    }

    res.status(200).json({
      success: true,
      message: "Plant successfully watered",
      last_watered: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error updating last_watered:", err);
    res.status(500).json({ error: "Error updating plant watering status" });
  }
});

// PUT update plant nickname
router.put(
  "/collection/:collectionId/plant/:plantId/nickname",
  async (req, res) => {
    const { collectionId, plantId } = req.params;
    const nickname = req.body.nickname;

    console.log("Collection ID:", collectionId);
    console.log("Plant ID:", plantId);
    console.log("Nickname:", nickname);

    // Validate input
    if (!nickname) {
      return res.status(400).json({ message: "Nickname is required." });
    }

    try {
      // Update query to modify the nickname in the plant table
      const updateQuery = `
      UPDATE collection_plants
      SET nickname = ?
      WHERE id = ? AND deleted = 0
    `;

      // Use plantId from the route and nickname from the body
      const [result] = await db.query(updateQuery, [nickname, plantId]);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Plant not found or already deleted." });
      }

      res.status(200).json({ message: "Nickname updated successfully." });
    } catch (err) {
      console.error("Error updating nickname:", err);
      res.status(500).json({
        message: "An error occurred while updating the nickname.",
        error: err.message,
      });
    }
  }
);

// PUT update plant last_watered date
router.put(
  "/collection/:collectionId/plant/:plantId/last-watered",
  async (req, res) => {
    const { collectionId, plantId } = req.params;
    const { lastWatered } = req.body; // Expecting a date string in the request body

    console.log("Collection ID:", collectionId);
    console.log("Plant ID:", plantId);
    console.log("Last Watered Date:", lastWatered);

    // Validate input
    if (!lastWatered) {
      return res
        .status(400)
        .json({ message: "Last watered date is required." });
    }

    try {
      // Update query to modify the last_watered field in the plant table
      const updateQuery = `
      UPDATE collection_plants
      SET last_watered = ?
      WHERE id = ? AND deleted = 0
    `;

      // Use plantId from the route and lastWatered from the body
      const [result] = await db.query(updateQuery, [lastWatered, plantId]);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Plant not found or already deleted." });
      }

      res
        .status(200)
        .json({ message: "Last watered date updated successfully." });
    } catch (err) {
      console.error("Error updating last watered date:", err);
      res.status(500).json({
        message: "An error occurred while updating the last watered date.",
        error: err.message,
      });
    }
  }
);

// PUT soft delete plant
router.put(
  "/collection/:collectionId/plant/:plantId/delete",
  async (req, res) => {
    const { collectionId, plantId } = req.params;

    console.log(
      `Attempting to delete plant with ID: ${plantId} in collection: ${collectionId}`
    );

    try {
      // Update query to mark the plant as deleted within a specific collection
      const updateQuery = `
      UPDATE collection_plants
      SET deleted = 1
      WHERE collection_id = ? AND id = ? AND deleted = 0
    `;

      // Execute the query with both collectionId and plantId
      const [result] = await db.query(updateQuery, [collectionId, plantId]);

      if (result.affectedRows === 0) {
        console.log(
          `No plant found with ID: ${plantId} or it's already deleted`
        );
        return res.status(404).json({
          message: "Plant not found or already deleted in this collection.",
        });
      }

      res.status(200).json({ message: "Plant deleted successfully." });
    } catch (err) {
      console.error("Error deleting plant:", err);
      res.status(500).json({
        message: "An error occurred while deleting the plant.",
        error: err.message,
      });
    }
  }
);

// POST Create a new collection
router.post("/collection", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId; // Corrected to use 'userId' instead of 'id'

  console.log("Received request to create collection:");
  console.log("Name:", name);
  console.log("User ID:", userId);

  if (!userId) {
    return res.status(400).json({ message: "User ID is missing" });
  }

  const query = "INSERT INTO plant_collection (name, user_id) VALUES (?, ?)";

  try {
    const [results] = await db.query(query, [name, userId]);
    console.log("Collection inserted with ID:", results.insertId);

    res.status(201).json({
      id: results.insertId,
      name: name,
      date_created: new Date(),
      active: 1,
      user_id: userId, // Return the user ID for confirmation
    });
  } catch (err) {
    console.error("Error inserting collection:", err);
    res.status(500).send(err);
  }
});

// POST Add a plant to a collection
// router.post("/collection/:id/add-plant", async (req, res) => {
//   console.log("Reached /collection/:id/add-plant route");

//   const collectionId = req.params.id;
//   const {
//     scientific_name,
//     common_name,
//     nickname,
//     quantity,
//     last_watered,
//     deleted,
//     is_custom,
//   } = req.body;

//   try {
//     // Insert the plant into the plant table with NOW() for date_added
//     const [plantResult] = await db.query(
//       "INSERT INTO plant (scientific_name, common_name, nickname, quantity, last_watered, date_added, deleted, is_custom) VALUES (?, ?, ?, ?, ?, NOW(), 0, 0)",
//       [
//         scientific_name,
//         common_name,
//         nickname,
//         quantity,
//         last_watered,
//         deleted,
//         is_custom,
//       ]
//     );
//     // Retrieve the newly inserted plantId
//     const plantId = plantResult.insertId;

//     // Now insert the plant into the collection_plants table with NOW() for date_added
//     await db.query(
//       "INSERT INTO collection_plants (collection_id, plant_id, common_name, scientific_name, nickname, quantity, last_watered, date_added, deleted, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0)",
//       [
//         collectionId,
//         plantId, // Use the plantId retrieved from the plant table
//         common_name,
//         scientific_name,
//         nickname,
//         quantity,
//         deleted,
//         is_custom,
//       ]
//     );

//     res.json({ success: true, plantId });
//   } catch (error) {
//     console.error("Error adding plant to collection:", error);
//     res.status(500).json({ error: "Error adding plant to collection" });
//   }
// });

router.post("/collection/:collectionId/plants/add", async (req, res) => {
  const { collectionId } = req.params;
  const { plants } = req.body;

  if (!Array.isArray(plants) || plants.length === 0) {
    return res
      .status(400)
      .json({ message: "Plants data must be a non-empty array." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const addedPlants = await Promise.all(
      plants.map(async (plant) => {
        const {
          scientific_name,
          common_name,
          nickname,
          quantity,
          last_watered,
        } = plant;

        // Handle "Today" or missing last_watered
        const safeLastWatered =
          last_watered === "Today"
            ? new Date().toISOString().split("T")[0]
            : last_watered || null;

        console.log("Inserting plant:", {
          common_name,
          scientific_name,
          nickname,
          quantity,
          safeLastWatered,
        });

        // Insert into plant table
        const [result] = await connection.execute(
          `
          INSERT INTO plant (common_name, scientific_name, nickname, quantity, last_watered, date_added, deleted, is_custom)
          VALUES (?, ?, ?, ?, ?, NOW(), 0, 0)
          `,
          [
            common_name,
            scientific_name || null,
            nickname || null,
            quantity,
            safeLastWatered,
          ]
        );

        const plantId = result.insertId;

        await connection.execute(
          `
          INSERT INTO collection_plants (common_name, scientific_name, collection_id, plant_id, quantity, date_added, deleted)
          VALUES (?, ?, ?, ?, ?, NOW(), 0)
          `,
          [common_name, scientific_name, collectionId, plantId, quantity]
        );

        return {
          id: plantId,
          common_name,
          scientific_name,
          nickname,
          quantity,
          last_watered: safeLastWatered,
        };
      })
    );

    await connection.commit();
    res.status(201).json({ success: true, plants: addedPlants });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error adding plants:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add plants.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// LOOKUP MISSING FIELDS IN DB IN COLLECTION_PLANTS
// TO ADD THEM INTO POST CALL

// POST Add a CUSTOM plant to a collection
router.post("/collection/:id/add-custom-plant", async (req, res) => {
  console.log("Reached /collection/:id/add-plant custom route");

  const collectionId = req.params.id;
  const {
    scientific_name,
    common_name,
    nickname,
    quantity,
    last_watered,
    deleted,
    is_custom,
  } = req.body;

  try {
    // Insert the plant into the plant table with NOW() for date_added
    const [plantResult] = await db.query(
      "INSERT INTO plant (scientific_name, common_name, nickname, quantity, last_watered, date_added, deleted, is_custom) VALUES (?, ?, ?, ?, ?, NOW(), 0, 0)",
      [
        scientific_name,
        common_name,
        nickname,
        quantity,
        last_watered,
        deleted,
        is_custom,
      ]
    );

    const plantId = plantResult.insertId;

    // Now insert the plant into the collection_plants table with NOW() for date_added
    await db.query(
      "INSERT INTO collection_plants (collection_id, plant_id, common_name, scientific_name, nickname, quantity, last_watered, date_added, deleted, is_custom) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, 0)",
      [
        collectionId,
        plantId, // Use the plantId retrieved from the plant table
        common_name,
        scientific_name,
        nickname,
        quantity,
        deleted,
        is_custom,
      ]
    );

    res.json({ success: true, plantId });
  } catch (error) {
    console.error("Error adding plant to collection:", error);
    res.status(500).json({ error: "Error adding plant to collection" });
  }
});

// Signup route
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    // Check if username already exists
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length > 0) {
      return res.status(400).json({ error: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [result] = await db.query(
      "INSERT INTO users (username, password, date_created) VALUES (?, ?, NOW())",
      [username, hashedPassword]
    );

    res
      .status(201)
      .json({ message: "User created successfully!", userId: result.insertId });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while creating the user." });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    // Check if the username exists
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = rows[0];

    // Compare the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return the token and optionally user info
    res.json({ message: "Login successful!", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "An error occurred during login." });
  }
});

module.exports = router;
