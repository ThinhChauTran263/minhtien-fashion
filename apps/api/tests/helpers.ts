import request from "supertest";
import { app } from "../src/app";

function getCookie(response: request.Response, name: string) {
  const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
  const cookie = cookies?.find((value) => value.startsWith(`${name}=`));
  return cookie?.split(";")[0].slice(name.length + 1);
}

export async function login(email = "customer.test@example.com", password = "customer123") {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  const token = getCookie(response, "mtf_access_token");
  if (!token) {
    throw new Error("Login did not return access token cookie");
  }
  return token;
}

export async function loginCookies(email = "customer.test@example.com", password = "customer123") {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return response.headers["set-cookie"] as unknown as string[];
}
