import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { KybService } from "@/server/services/kyb.service";
import { AuthUtils } from "@/server/utils/auth";
import { ConflictError, UnauthorizedError } from "@/server/utils/errors";

vi.mock("@/server/services/kyb.service");
vi.mock("@/server/utils/auth");

describe("POST /api/v1/kyb/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthUtils.authenticateRequest).mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
      user: { id: "user-123", email: "test@example.com" },
    } as never);

    vi.mocked(KybService.uploadToCloudinary).mockResolvedValue({
      publicId: "kyb/user-123/file-uuid",
      secureUrl: "https://res.cloudinary.com/demo/raw/upload/kyb/user-123/file-uuid.pdf",
    });

    vi.mocked(KybService.deleteFromCloudinary).mockResolvedValue(undefined);
  });

  const createMockFile = (
    name: string,
    size = 1024,
    type = "application/pdf",
  ): File => {
    const buffer = new ArrayBuffer(size);
    return new File([buffer], name, { type });
  };

  const createMockFormDataRequest = (
    fields: Record<string, string | File>,
  ): NextRequest => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    return {
      formData: async () => formData,
      headers: new Headers({ Authorization: "Bearer mock-token" }),
    } as unknown as NextRequest;
  };

  it("should successfully submit KYB documents", async () => {
    const mockResult = {
      id: "kyb-123",
      status: "pending" as const,
      registrationType: "Corporation",
      registrationNo: "REG-001",
      createdAt: new Date(),
    };
    vi.mocked(KybService.submit).mockResolvedValue(mockResult);

    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-001",
      incorporationCertificate: createMockFile("cert.pdf"),
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("KYB documents submitted successfully");
    expect(data.data.id).toBe("kyb-123");
    expect(data.data.status).toBe("pending");
    expect(KybService.uploadToCloudinary).toHaveBeenCalledTimes(2);
    expect(KybService.submit).toHaveBeenCalledOnce();
  });

  it("should accept optional formC02C07 file", async () => {
    const mockResult = {
      id: "kyb-456",
      status: "pending" as const,
      registrationType: "Corporation",
      registrationNo: "REG-002",
      createdAt: new Date(),
    };
    vi.mocked(KybService.submit).mockResolvedValue(mockResult);

    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-002",
      incorporationCertificate: createMockFile("cert.pdf"),
      memorandumArticle: createMockFile("memo.pdf"),
      formC02C07: createMockFile("form.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(KybService.uploadToCloudinary).toHaveBeenCalledTimes(3);
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(AuthUtils.authenticateRequest).mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    );

    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-001",
      incorporationCertificate: createMockFile("cert.pdf"),
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Authentication required");
  });

  it("should return 400 when required files are missing", async () => {
    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-001",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Incorporation certificate is required");
  });

  it("should return 400 for invalid registration type", async () => {
    const req = createMockFormDataRequest({
      registrationType: "InvalidType",
      registrationNo: "REG-001",
      incorporationCertificate: createMockFile("cert.pdf"),
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
  });

  it("should return 400 when file exceeds 5MB", async () => {
    const oversizedFile = createMockFile("cert.pdf", 6 * 1024 * 1024);

    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-001",
      incorporationCertificate: oversizedFile,
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("exceeds maximum file size");
  });

  it("should return 400 for unsupported MIME type", async () => {
    const invalidFile = createMockFile("cert.exe", 1024, "application/x-msdownload");

    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-001",
      incorporationCertificate: invalidFile,
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("unsupported file type");
  });

  it("should return 409 when KYB already pending", async () => {
    vi.mocked(KybService.submit).mockRejectedValue(
      new ConflictError("A KYB verification is already pending review"),
    );

    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-001",
      incorporationCertificate: createMockFile("cert.pdf"),
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("A KYB verification is already pending review");

    expect(KybService.deleteFromCloudinary).toHaveBeenCalled();
  });

  it("should return 500 for unexpected errors and cleanup files", async () => {
    vi.mocked(KybService.submit).mockRejectedValue(new Error("DB failure"));

    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "REG-001",
      incorporationCertificate: createMockFile("cert.pdf"),
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Internal server error");
    expect(KybService.deleteFromCloudinary).toHaveBeenCalled();
  });

  it("should return 400 when registration number is empty", async () => {
    const req = createMockFormDataRequest({
      registrationType: "Corporation",
      registrationNo: "",
      incorporationCertificate: createMockFile("cert.pdf"),
      memorandumArticle: createMockFile("memo.pdf"),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation failed");
  });
});


