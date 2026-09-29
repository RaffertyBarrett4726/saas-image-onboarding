import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const onboardingSchema = z.object({ tenantId: z.string().min(1), filename: z.string().min(1), file: z.string().min(1) });
export type OnboardingRequest = z.infer<typeof onboardingSchema>;
export type Tenant = { id: string; status: "active"; logoImageId: string; compressedImageId: string };

export class TenantImageService {
  private readonly tenants = new Map<string, Tenant>();
  private readonly infrai: InfraiClient;
  constructor(infrai: InfraiClient) { this.infrai = infrai; }

  async onboard(input: unknown): Promise<Tenant> {
    const request = onboardingSchema.parse(input);
    if (this.tenants.has(request.tenantId)) throw new Error("TENANT_ALREADY_ACTIVE");
    const uploaded = await this.infrai.imageUpload(request.file, request.filename);
    const compressed = await this.infrai.imageCompress(uploaded.id);
    const tenant: Tenant = { id: request.tenantId, status: "active", logoImageId: uploaded.id, compressedImageId: compressed.id };
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  get(tenantId: string) { return this.tenants.get(tenantId); }
}
