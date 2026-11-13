import { NextResponse } from "next/server";
import { FALLBACK_TRENDS_DATA } from "@/lib/trendsApi";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const effectiveUserId = body.userId || "6a9881707a0426c73af163e5";

    const mlServiceUrl =
      process.env.ML_SERVICE_URL || "https://shortsyou.onrender.com/api/v1";
    const mlApiKey =
      process.env.ML_API_KEY || "md_live_qaXw0BOxaKIujBuwspZzGBpuTAm6nRUo";

    try {
      const response = await fetch(`${mlServiceUrl}/predict-trends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mlApiKey}`,
        },
        body: JSON.stringify({
          userId: effectiveUserId,
        }),
        signal: AbortSignal.timeout(12000), // 12-second timeout
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data && Array.isArray(data.trends)) {
          return NextResponse.json({
            success: true,
            data,
          });
        }
      }
    } catch (fetchErr) {
      console.warn("External ML predict-trends call failed or timed out:", fetchErr);
    }

    // Return rich fallback matching the API schema if external endpoint is sleeping or delayed
    return NextResponse.json({
      success: true,
      data: {
        ...FALLBACK_TRENDS_DATA,
        userId: effectiveUserId,
      },
    });
  } catch (error) {
    console.error("Error in /api/trends/predict route:", error);
    return NextResponse.json({
      success: true,
      data: FALLBACK_TRENDS_DATA,
    });
  }
}
