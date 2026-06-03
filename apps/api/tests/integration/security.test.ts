import request from "supertest";
import { app } from "../../src/app";

describe("Security hardening", () => {
  it("sanitizes XSS payloads", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "xss@example.com", password: "123456", name: "<script>alert(1)</script>Alice" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.name).toBe("Alice");
  });

  it("rate limits failed login attempts", async () => {
    const agent = request(app);
    for (let i = 0; i < 5; i += 1) {
      await agent.post("/api/auth/login").set("x-rate-limit-test", "true").send({ email: "customer.test@example.com", password: "bad-password" });
    }
    const res = await agent.post("/api/auth/login").set("x-rate-limit-test", "true").send({ email: "customer.test@example.com", password: "bad-password" });
    expect(res.status).toBe(429);
  });
});
