const express = require("express");
const axios = require("axios");
const { db } = require("./app");

const router = express.Router();

const PLANT_ID_API_URL = "https://plant.id/api/v3/kb/plants/name_search";
const API_KEY = "LkRMANX6QnypQ4JbiHoGbnuW0dmigllDPnf3WeBs2RJvAqYYAL";

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

// GET all collections
router.get("/collection", async (req, res) => {
  const { name } = req.query;
  let query = "SELECT * FROM plant_collection WHERE active = 1";

  if (name) {
    query += " AND name LIKE ?";
  }

  try {
    const [results] = await db.query(query, name ? [`%${name}%`] : []);
    // Return the collections as the response
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching collections:", err);
    res.status(500).send(err);
  }
});

// GET all plants in a collection
router.get("/collection/:id/plants", async (req, res) => {
  try {
    // Retrieve all plants for the given collection ID
    const collectionId = req.params.id;
    const [plants] = await db.query(
      `SELECT id, collection_id, scientific_name, common_name, nickname, quantity, last_watered, deleted, is_custom
       FROM collection_plants
       WHERE collection_id = ? AND deleted = 0`,
      [collectionId]
    );
    console.log("Plants fetched from database:", plants);

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
    SET last_watered = NOW()
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
router.post("/collection", async (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO plant_collection (name) VALUES (?)";

  try {
    const [results] = await db.query(query, [name]);
    res.status(201).json({
      id: results.insertId,
      name: name,
      date_created: new Date(),
      active: 1,
    });
  } catch (err) {
    console.error("Error inserting collection:", err);
    res.status(500).send(err);
  }
});

// POST Add a plant to a collection
router.post("/collection/:id/add-plant", async (req, res) => {
  console.log("Reached /collection/:id/add-plant route");

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
    // Retrieve the newly inserted plantId
    const plantId = plantResult.insertId;

    // Now insert the plant into the collection_plants table with NOW() for date_added
    await db.query(
      "INSERT INTO collection_plants (collection_id, plant_id, common_name, scientific_name, nickname, quantity, last_watered, date_added, deleted, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0)",
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

module.exports = router;
