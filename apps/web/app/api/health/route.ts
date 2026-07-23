import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      service: "lushra-web",
      status: "healthy",
      timestamp: new Date().toISOString()
    },
    {
      status: 200
    }
  );
}
