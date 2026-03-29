import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { gunzip, brotliDecompress } from "zlib";
import { promisify } from "util";
import { compressResponse } from "./compress";

const gunzipAsync = promisify(gunzip);
const brotliDecompressAsync = promisify(brotliDecompress);

function makeRequest(acceptEncoding: string): NextRequest {
  return new NextRequest("http://localhost/api/v1/test", {
    headers: { "accept-encoding": acceptEncoding },
  });
}

function makeResponse(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { "content-type": "application/json" },
  });
}

const smallBody = JSON.stringify({ ok: true });
const largeBody = JSON.stringify({ data: "x".repeat(1100) }); // > 1 KB

describe("compressResponse", () => {
  it("returns response unchanged when body is below 1 KB threshold", async () => {
    const req = makeRequest("gzip");
    const res = makeResponse(smallBody);
    const result = await compressResponse(res, req);
    expect(result.headers.get("content-encoding")).toBeNull();
    expect(await result.text()).toBe(smallBody);
  });

  it("gzip-compresses large responses when client accepts gzip", async () => {
    const req = makeRequest("gzip");
    const res = makeResponse(largeBody);
    const result = await compressResponse(res, req);
    expect(result.headers.get("content-encoding")).toBe("gzip");
    expect(result.headers.get("vary")).toBe("Accept-Encoding");
    const buf = Buffer.from(await result.arrayBuffer());
    const decompressed = await gunzipAsync(buf);
    expect(decompressed.toString()).toBe(largeBody);
  });

  it("prefers brotli over gzip when client accepts both", async () => {
    const req = makeRequest("br, gzip");
    const res = makeResponse(largeBody);
    const result = await compressResponse(res, req);
    expect(result.headers.get("content-encoding")).toBe("br");
    const buf = Buffer.from(await result.arrayBuffer());
    const decompressed = await brotliDecompressAsync(buf);
    expect(decompressed.toString()).toBe(largeBody);
  });

  it("returns response unchanged when client does not accept any encoding", async () => {
    const req = makeRequest("");
    const res = makeResponse(largeBody);
    const result = await compressResponse(res, req);
    expect(result.headers.get("content-encoding")).toBeNull();
    expect(await result.text()).toBe(largeBody);
  });

  it("preserves original status code on compressed response", async () => {
    const req = makeRequest("gzip");
    const res = makeResponse(largeBody, 201);
    const result = await compressResponse(res, req);
    expect(result.status).toBe(201);
  });
});
