import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getRefreshTokenLifetime, formatTokenLifetime } from "../src/pages/ui/info/tokenExpiry.ts";

const jwt = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

test("prefers the refresh lifetime from the token response", () => {
  assert.equal(getRefreshTokenLifetime(jwt({ exp: 200, iat: 100 }), 3600), 3600);
  assert.equal(getRefreshTokenLifetime("opaque-refresh", 3600), 3600);
});

test("older sessions use exp - iat from a refresh JWT, not time remaining", () => {
  assert.equal(getRefreshTokenLifetime(jwt({ exp: 1700003600, iat: 1700000000 })), 3600);
});

test("opaque, malformed and incomplete JWTs have unknown lifetimes", () => {
  assert.equal(getRefreshTokenLifetime("opaque-refresh-token"), undefined);
  assert.equal(getRefreshTokenLifetime("header.%%%.signature"), undefined);
  assert.equal(getRefreshTokenLifetime(jwt({ exp: 200 })), undefined);
  assert.equal(getRefreshTokenLifetime(jwt({ exp: "200", iat: 100 })), undefined);
  assert.equal(getRefreshTokenLifetime(jwt({ exp: 100, iat: 200 })), undefined);
  assert.equal(getRefreshTokenLifetime(jwt({ exp: 1e20, iat: 100 })), undefined);
  assert.equal(getRefreshTokenLifetime("opaque", 0), undefined);
});

test("formats a fixed lifetime without a clock or countdown", () => {
  assert.equal(formatTokenLifetime(86401), "1d 0h 0m 1s");
  assert.equal(formatTokenLifetime(3600), "1h 0m");
  assert.equal(formatTokenLifetime(90), "1m 30s");
  assert.equal(formatTokenLifetime(1), "1s");
});

test("OIDC callback saves only the refresh lifetime and accepts an opaque token", async () => {
  const html = readFileSync(new URL("../public/callback.html", import.meta.url), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);

  const storage = new Map([
    ["api", "https://oscar.example"],
    ["provider_url", "https://identity.example"],
    ["client_id", "test-client"],
    ["url_authorize", "https://identity.example/auth"],
    ["url_user_info", "https://identity.example/userinfo"],
    ["token_endpoint", "https://identity.example/token"],
  ]);
  const localStorage = {
    state: "expected-state",
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const location = { origin: "https://dashboard.example", search: "?code=test&state=expected-state" };
  runInNewContext(script, {
    localStorage,
    location,
    window: { location },
    URL,
    URLSearchParams,
    history: { replaceState: () => {} },
    fetch: async (url) => ({
      json: async () => url === "https://identity.example/token"
        ? { access_token: "opaque-access", refresh_token: "opaque-refresh", expires_in: 600, refresh_expires_in: 3600 }
        : { name: "Test User", sub: "test-user" },
    }),
    axios: async () => ({ data: { minio_provider: { endpoint: "https://minio.example:9000" }, config: {} } }),
    console,
  });
  await new Promise(setImmediate);
  const auth = JSON.parse(storage.get("authData"));
  assert.equal(auth.refresh_token_lifetime_seconds, 3600);
  assert.equal(auth.refresh_token, "opaque-refresh");
  assert.equal(auth.access_token_expires_at, undefined);
  assert.equal(auth.refresh_token_expires_at, undefined);
});
