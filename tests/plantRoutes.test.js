const chai = require("chai");
const chaiHttp = require("chai-http");
const { app } = require("../server/app.js");
require("dotenv").config();

chai.use(chaiHttp);
const { expect } = chai;

const testUsername = "test";
const testPassword = "tester";

describe("Collection API tests", () => {
  let testToken;
  let newCollectionId;

  // Generate a random collection name each time
  function generateRandomCollectionName() {
    const randomSuffix = Math.floor(Math.random() * 1000); // Random number between 0 and 999
    return `Test Collection ${randomSuffix}`;
  }

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

  // GET collection by ID
  describe("GET /api/collection/:id", () => {
    it("should return 200 and the collection if the user is authorized", async () => {
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
        .get(`/api/collection/`)
        .set("Authorization", `Bearer ${testToken}`);

      // Assertions for GET response
      expect(res).to.have.status(200);
    });
  });

  // POST add custom plant to a collection
  describe("POST /collection/:id/add-custom-plant", () => {
    const plantNamePost = generateRandomCollectionName();

    let testToken;
    let collectionId = 1;

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
        common_name: "Shagbark Hickory " + plantNamePost,
        nickname: "Hickory" + plantNamePost,
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

      // Assertions for POST response
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success").that.equals(true);
      expect(res.body).to.have.property("plantId").that.is.a("number");
    });
  });
});
