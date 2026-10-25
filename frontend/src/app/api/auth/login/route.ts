import { NextRequest, NextResponse } from "next/server";
import {
  authenticateCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = authenticateCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid operator email or password. Please verify your credentials." },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user, SESSION_MAX_AGE_SECONDS);

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json(
      {
        success: true,
        user,
        message: "Session authenticated successfully.",
      },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error("Auth login error:", err);
    return NextResponse.json(
      { error: "Internal authentication error. Please try again." },
      { status: 500 }
    );
  }
}
