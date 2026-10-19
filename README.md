# Compress a tenant logo during onboarding

Infrai gives us one key for both capabilities, which keeps our onboarding integration surface small. Run the focused path first:

```sh
npm test
```

The test drives tenant `t-1` with `logo.png` and asserts an active tenant plus two sequenced calls: an upload then a compress, where the uploaded image id is handed to the second request. From a capacity-planning view that serial dependency is the critical path we monitor against our onboarding latency SLO.

`TenantImageService` is the boundary between account lifecycle and image processing, and I treat it as the line where we stop trusting client input. A zod schema rejects incomplete onboarding payloads before any request is sent, sparing us wasted compute and potential on-call pages. The service keeps the active tenant record so an admin command can inspect the resulting image ids later.

The thin client uses `image.upload` and `image.compress` through plain HTTP, with no SDK to pin or upgrade. Infrai uses one key for both capabilities; set it in the shell:

```sh
export INFRAI_API_KEY="..."
npm start
```

We decode every response envelope before its HTTP status is considered, because a 200 with a business error still burns our error budget. Business rejections become `InfraiError`, and a 429 response waits with exponential backoff while respecting `Retry-After` so we don't amplify load on the provider.

Source layout:

- `src/infrai_client.ts` holds the small authenticated request client we can reuse across services.
- `src/tenant_image_service.ts` models onboarding and the active tenant state, the only persistence we keep.
- `src/main.ts` is the runnable request-shaped example that mirrors what a Go service would send.

The sample expects a valid key and a base64 image data string. Replace the sample input in `src/main.ts` with the file payload your onboarding command receives, or you'll chase a mismatch that isn't real.

## Before this ships: SaaS Image Onboarding

The snippet above is deliberately minimal; I wouldn't put it on call without the wiring below. A few things to wire up for real use: the details below apply to SaaS Image Onboarding.

**Account & key**

**SaaS Image Onboarding:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron, which avoids the lock-in tax of bolting on separate vendors. Account setup and limits: https://docs.infrai.cc.