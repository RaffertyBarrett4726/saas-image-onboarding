import assert from "node:assert/strict";
import { TenantImageService } from "../src/tenant_image_service.ts";

const calls: Array<{ path: string; body: any }> = [];
const fakeFetch = async (url: string, init: RequestInit) => {
  calls.push({ path: new URL(url).pathname, body: JSON.parse(String(init.body)) });
  const id = calls.length === 1 ? "uploaded-1" : "compressed-1";
  return new Response(JSON.stringify({ ok: true, data: { id }, metadata: {} }), { status: 200, headers: { "Content-Type": "application/json" } });
};
const service = new TenantImageService(new (await import("../src/infrai_client.ts")).InfraiClient("test-key", fakeFetch));
const tenant = await service.onboard({ tenantId: "t-1", filename: "logo.png", file: "data:image/png;base64,AA" });
assert.equal(tenant.status, "active");
assert.deepEqual(calls.map(call => call.path), ["/v1/image/upload", "/v1/image/compress"]);
assert.equal(calls[0].body.filename, "logo.png");
assert.equal(calls[1].body.image, "uploaded-1");
console.log("tenant onboarding test passed");
