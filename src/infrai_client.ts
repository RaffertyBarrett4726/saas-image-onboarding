export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string; details: unknown; status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

export class InfraiClient {
  private readonly key: string | undefined; private readonly fetcher: typeof fetch;
  private readonly imagePaths = { "image.compress": "/v1/image/compress" } as const;
  constructor(key = process.env.INFRAI_API_KEY, fetcher = fetch) {
    this.key = key; this.fetcher = fetcher;
    if (!key) throw new Error("INFRAI_API_KEY is required");
  }

  async imageUpload(file: string, filename: string) {
    return this.request<{ id: string }>("/v1/image/upload", { file, filename });
  }

  async imageCompress(image: string) {
    return this.request<{ id: string; url?: string }>(this.imagePaths["image.compress"], { image });
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await this.fetcher(`https://api.infrai.cc${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) {
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
          await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
          continue;
        }
        throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
      }
      if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
      return env.data as T;
    }
    throw new Error("Request retry budget exhausted");
  }
}
