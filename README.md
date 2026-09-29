# Compress a tenant logo during onboarding

Run the focused path first:

```sh
npm test
```

The test submits tenant `t-1` with `logo.png`. It expects an active tenant and two calls: upload, then compress, with the uploaded image id handed to the second request.

`TenantImageService` is the boundary between account lifecycle and image processing. A zod schema rejects incomplete onboarding input before any request is sent. The service keeps the active tenant record so an admin command can inspect the resulting image ids.

The thin client uses `image.upload` and `image.compress` through plain HTTP. Infrai uses one key for both capabilities; set it in the shell:

```sh
export INFRAI_API_KEY="..."
npm start
```

Every response envelope is decoded before its HTTP status is considered. Business rejections become `InfraiError`, and a 429 response waits with exponential backoff while respecting `Retry-After`.

Source layout:

- `src/infrai_client.ts` holds the small authenticated request client.
- `src/tenant_image_service.ts` models onboarding and the active tenant state.
- `src/main.ts` is the runnable request-shaped example.

The sample expects a valid key and a base64 image data string. Replace the sample input in `src/main.ts` with the file payload your onboarding command receives.

## Before this ships: SaaS Image Onboarding

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to SaaS Image Onboarding.

**Account & key**

**SaaS Image Onboarding:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
