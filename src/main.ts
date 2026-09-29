import { InfraiClient } from "./infrai_client.ts";
import { TenantImageService } from "./tenant_image_service.ts";

const service = new TenantImageService(new InfraiClient());
const tenant = await service.onboard({ tenantId: "acme", filename: "brand.png", file: "data:image/png;base64,BASE64_IMAGE" });
console.log(JSON.stringify({ tenant: tenant.id, status: tenant.status, compressedImageId: tenant.compressedImageId }));
