import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/app";

function hasCookie(response: request.Response, name: string) {
  const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
  return cookies?.some((cookie) => cookie.startsWith(`${name}=`)) ?? false;
}

describe("Auth", () => {
  it("registers a user", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "new@example.com", password: "123456", name: "New User" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(hasCookie(res, "mtf_access_token")).toBe(true);
  });

  it("rejects duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "customer.test@example.com", password: "123456", name: "Customer Test" });
    expect(res.status).toBe(400);
  });

  it("logs in and returns tokens", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "customer.test@example.com", password: "customer123" });
    expect(res.status).toBe(200);
    expect(hasCookie(res, "mtf_access_token")).toBe(true);
    expect(hasCookie(res, "mtf_refresh_token")).toBe(true);
  });

  it("rejects invalid password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "customer.test@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("refreshes a valid token", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({ email: "customer.test@example.com", password: "customer123" });
    const res = await request(app).post("/api/auth/refresh").set("Cookie", loginRes.headers["set-cookie"] as unknown as string[]).send({});
    expect(res.status).toBe(200);
    expect(hasCookie(res, "mtf_access_token")).toBe(true);
  });

  it("rejects expired refresh token", async () => {
    const expired = jwt.sign({ userId: "x", email: "x@example.com", role: "CUSTOMER" }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "-1s" });
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: expired });
    expect(res.status).toBe(401);
  });
});


