const chai = require("chai");
const chaiHttp = require("chai-http");
const { app } = require("../server/app.js");
require("dotenv").config();

chai.use(chaiHttp);
const { expect } = chai;

const testUsername = "test";
const testPassword = "tester";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Generate a random collection name each time
function generateRandomCollectionName() {
  const randomSuffix = Math.floor(Math.random() * 1000); // Random number between 0 and 999
  return `Test Collection ${randomSuffix}`;
}
describe("Collection API tests", () => {
  let testToken;
  let newCollectionId;
  let createdPlantId;

  // POST /signup - User Signup Test
  describe("POST /api/signup", () => {
    it("should create a new user and return status 201", async () => {
      const newUser = {
        username: `testuser_${Date.now()}`, // Ensure a unique username
        password: "TestPassword123!",
      };

      const res = await chai.request(app).post("/api/signup").send(newUser);

      // Assertions for successful signup
      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        "message",
        "User created successfully!"
      );
      expect(res.body).to.have.property("userId").that.is.a("number");
    });

    it("should return 400 if username already exists", async () => {
      const existingUser = {
        username: "existinguser", // Use a known username
        password: "TestPassword123!",
      };

      // First request to create the user
      await chai.request(app).post("/api/signup").send(existingUser);

      // Second request should fail with 400
      const res = await chai
        .request(app)
        .post("/api/signup")
        .send(existingUser);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property("error", "Username already exists.");
    });

    it("should return 400 if username or password is missing", async () => {
      const res = await chai.request(app).post("/api/signup").send({});

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        "error",
        "Username and password are required."
      );
    });
  });

  // Login once before all tests
  before(async () => {
    const loginResponse = await chai
      .request(app)
      .post("/api/login")
      .send({ username: testUsername, password: testPassword });

    testToken = loginResponse.body.token;

    if (!testToken) {
      throw new Error("Token was not received from login.");
    }
  });

  // POST Create Collection
  describe("POST /api/collection", () => {
    it("should create a new collection and return status 201", async () => {
      const newCollectionName = generateRandomCollectionName();

      const res = await chai
        .request(app)
        .post("/api/collection")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: newCollectionName });

      // Assertions for POST response
      expect(res).to.have.status(201); // Expect 201 for successful creation
      expect(res.body).to.have.property("name", newCollectionName);
      expect(res.body).to.have.property("user_id").that.is.a("number");
      expect(res.body).to.have.property("id").that.is.a("number");

      // Store the collection ID for use in the next request
      newCollectionId = res.body.id;
    });
  });

  // POST add custom plant
  describe("POST /collection/:id/add-custom-plant", () => {
    before(async () => {
      const loginResponse = await chai
        .request(app)
        .post("/api/login")
        .send({ username: testUsername, password: testPassword });

      testToken = loginResponse.body.token;

      if (!testToken) {
        throw new Error("Token was not received from login.");
      }
    });

    it("should add a custom plant to the collection and return status 200", async () => {
      const plantData = {
        scientific_name: "Carya ovata",
        common_name: "Shagbark Hickory",
        nickname: "HickoryTest",
        quantity: 1,
        last_watered: null,
        deleted: 0,
        is_custom: 1,
      };

      const res = await chai
        .request(app)
        .post(`/api/collection/${newCollectionId}/add-custom-plant`)
        .set("Authorization", `Bearer ${testToken}`)
        .send(plantData);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("plantId");
      createdPlantId = res.body.plantId;
    });
  });

  // GET all plants in collection
  describe("GET /api/collection/:id/plants", () => {
    it("should return 200 OK and find the newly added plant in the response", async () => {
      console.log("Created Plant ID GET all plants:", createdPlantId);

      const res = await chai
        .request(app)
        .get(`/api/collection/${newCollectionId}/plants`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res).to.have.status(200);
      expect(res.body.plants).to.be.an("array");
    });
  });

  // PUT water plant
  describe("PUT /api/collection/:collectionId/plant/:plantId", () => {
    it("should successfully water a plant and log the event", async () => {
      console.log("Created Plant ID PUT water plants:", createdPlantId);

      // Ensure createdPlantId is set before making the PUT request
      // if (!createdPlantId) {
      //   throw new Error("createdPlantId is not defined");
      // }

      const res = await chai
        .request(app)
        .put(`/api/collection/${newCollectionId}/plant/${createdPlantId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res).to.have.status(200);
      console.log(res.body);
      // expect(res.body).to.have.property("success", true);
      // expect(res.body).to.have.property(
      //   "message",
      //   "Plant successfully watered and watering event logged"
      // );
      // expect(res.body).to.have.property("last_watered").that.is.a("string");
      // expect(res.body)
      //   .to.have.property("watering_event_id")
      //   .that.is.a("number");
    });
  });

  // GET collection by ID
  describe("GET /api/collection/:id", () => {
    it("should return 200 and the collection if the user is authorized", async () => {
      console.log("Created Plant ID GET collection by ID ", createdPlantId);

      if (!newCollectionId) {
        throw new Error("Collection ID was not set.");
      }

      // Use the collection ID from the previous request in the GET request
      const res = await chai
        .request(app)
        .get(`/api/collection/${newCollectionId}`)
        .set("Authorization", `Bearer ${testToken}`);

      // Assertions for GET response
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("id", newCollectionId);
      expect(res.body).to.have.property("name");
      expect(res.body).to.have.property("user_id");
    });
  });

  // GET all collections for authed user
  describe("GET /api/collection", () => {
    it("should return 200 and all collection(s) if the user is authorized", async () => {
      // Use the collection ID from the previous request in the GET request
      const res = await chai
        .request(app)
        .get(`/api/collection`)
        .set("Authorization", `Bearer ${testToken}`);

      // Assertions for GET response
      expect(res).to.have.status(200);
    });
  });

  // GET total plant count for user
  describe("GET /api/total-plants/:userId", () => {
    it("should return the total number of plants for the authenticated user", async () => {
      const res = await chai
        .request(app)
        .get(`/api/total-plants/6`) // Use test user ID
        .set("Authorization", `Bearer ${testToken}`);

      expect(res).to.have.status(200);
    });
  });

  // delete collection by id
  // describe("DELETE /api/collection/:id", () => {
  //   it("should delete a collection and return status 200", async () => {
  //     if (!newCollectionId) {
  //       throw new Error("Collection ID is missing for deletion test.");
  //     }

  //     const res = await chai
  //       .request(app)
  //       .delete(/api/collection/${newCollectionId})
  //       .set("Authorization", Bearer ${testToken});

  //     expect(res).to.have.status(200);
  //     expect(res.body).to.have.property(
  //       "message",
  //       "Collection deleted successfully"
  //     );
  //   });

  //   it("should return 404 if the collection does not exist", async () => {
  //     const nonExistentId = 999999; // An ID that is unlikely to exist

  //     const res = await chai
  //       .request(app)
  //       .delete(/api/collection/${nonExistentId})
  //       .set("Authorization", Bearer ${testToken});

  //     expect(res).to.have.status(404);
  //     expect(res.body).to.have.property(
  //       "message",
  //       "Collection not found or unauthorized"
  //     );
  //   });

  //   it("should return 401 if no authentication token is provided", async () => {
  //     const res = await chai
  //       .request(app)
  //       .delete(/api/collection/${newCollectionId});

  //     expect(res).to.have.status(401);
  //     expect(res.body).to.have.property("error", "Unauthorized");
  //   });
  // });

  // GET all plants in collection by collection id

  // PUT fertilize plant
  describe("PUT /api/collection/:collectionId/fertilize-plant/:createdPlantId", () => {
    it("should successfully fertilize a plant and log the event", async () => {
      console.log(createdPlantId); // Ensure this logs the correct plantId

      // Ensure createdPlantId is set before making the PUT request
      if (!createdPlantId) {
        throw new Error("createdPlantId is not defined");
      }

      const res = await chai
        .request(app)
        .put(
          `/api/collection/${newCollectionId}/fertilize-plant/${createdPlantId}`
        )
        .set("Authorization", `Bearer ${testToken}`);

      expect(res).to.have.status(200);
      console.log(res.body);
    });
  });
});
