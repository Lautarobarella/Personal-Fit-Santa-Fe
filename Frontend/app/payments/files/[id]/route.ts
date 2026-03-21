import { NextRequest, NextResponse } from "next/server";

function resolveBackendBaseUrl(): string {
  const rawUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080";

  const withoutTrailingSlash = rawUrl.replace(/\/+$/, "");
  return withoutTrailingSlash.replace(/\/api$/i, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.id;

    const backendBaseUrl = resolveBackendBaseUrl();
    const backendUrl = `${backendBaseUrl}/api/payments/files/${fileId}`;

    // Forward auth context from browser -> Next route -> backend.
    // Backend auth uses JWT cookies and can also accept Authorization header.
    const forwardHeaders = new Headers();
    const cookieHeader = request.headers.get("cookie");
    const authorizationHeader = request.headers.get("authorization");
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (cookieHeader) {
      forwardHeaders.set("cookie", cookieHeader);
    }

    if (!cookieHeader && (accessToken || refreshToken)) {
      const fallbackCookies: string[] = [];
      if (accessToken) fallbackCookies.push(`accessToken=${accessToken}`);
      if (refreshToken) fallbackCookies.push(`refreshToken=${refreshToken}`);
      forwardHeaders.set("cookie", fallbackCookies.join("; "));
    }

    if (authorizationHeader) {
      forwardHeaders.set("authorization", authorizationHeader);
    } else if (accessToken) {
      forwardHeaders.set("authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(backendUrl, {
      headers: forwardHeaders,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);

      return NextResponse.json(
        { error: "File not found or access denied", details: errorText },
        { status: response.status },
      );
    }

    const fileBuffer = await response.arrayBuffer();

    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");

    const headers = new Headers();
    if (contentType) headers.set("content-type", contentType);
    if (contentDisposition) headers.set("content-disposition", contentDisposition);
    headers.set("cache-control", "private, no-store");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
