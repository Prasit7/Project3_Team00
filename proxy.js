import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  isManagerEmail,
  MANAGER_HOME_PATH,
  MANAGER_LOGIN_PATH,
  normalizeCallbackUrl,
} from "./lib/auth/shared";

const protectedApiPrefixes = [
  "/api/employees",
  "/api/inventory",
  "/api/menu",
  "/api/reports",
  "/api/xreport",
  "/api/zreport",
];

function isProtectedManagerPage(pathname) {
  return pathname.startsWith(MANAGER_HOME_PATH) && pathname !== MANAGER_LOGIN_PATH;
}

function isProtectedApi(pathname) {
  return protectedApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function unauthorizedApiResponse(message, status) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        message,
      },
    },
    { status }
  );
}

function buildLoginRedirect(request, errorCode) {
  const loginUrl = new URL(MANAGER_LOGIN_PATH, request.url);
  const callbackUrl = normalizeCallbackUrl(`${request.nextUrl.pathname}${request.nextUrl.search}`);

  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  if (errorCode) {
    loginUrl.searchParams.set("error", errorCode);
  }

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const protectPage = isProtectedManagerPage(pathname);
  const protectApi = isProtectedApi(pathname);

  if (!protectPage && !protectApi) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.email) {
    return protectApi
      ? unauthorizedApiResponse("Sign in is required to access manager resources.", 401)
      : buildLoginRedirect(request);
  }

  if (!isManagerEmail(token.email)) {
    return protectApi
      ? unauthorizedApiResponse("This Google account is not allowed to access manager resources.", 403)
      : buildLoginRedirect(request, "AccessDenied");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/manager/:path*",
    "/api/employees/:path*",
    "/api/inventory/:path*",
    "/api/menu/:path*",
    "/api/reports/:path*",
    "/api/xreport",
    "/api/zreport",
  ],
};
