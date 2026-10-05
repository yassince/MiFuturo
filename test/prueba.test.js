import supertest from "supertest";
import app from "../server.js";


describe("GET /", () => {
    it("Debería retornar 200 OK para '/'", async () => {
        const response = await supertest(app).get("/");
        expect(response.status).toBe(200);
    });
});