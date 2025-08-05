import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { image, prompt } = await request.json();

    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.FLUX_KONTEXT_API_KEY || "cac4ce77-177f-4d9c-adb1-3ddcbc2fb6a4";

    const fluxRes = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
      method: "POST",
      headers: {
        "x-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        input_image: image,
        output_format: "jpeg",
        safety_tolerance: 2,
        prompt_upsampling: false,
        num_images: 2, // Fixed to 2 variations
      }),
    });

    if (!fluxRes.ok) {
      let errorData = {};
      try {
        errorData = await fluxRes.json();
      } catch {
        errorData = { detail: await fluxRes.text() };
      }
      console.error("Flux API error:", errorData);
      throw new Error(
        (errorData as any).detail || "Failed to edit image with Flux API"
      );
    }

    const data = await fluxRes.json();

    if (!data.id || !data.polling_url) {
      throw new Error("Flux API response missing 'id' or 'polling_url'");
    }

    // Polling the result with exponential backoff
    let result;
    let attempts = 0;
    const maxAttempts = 40;
    const baseDelay = 2000;
    const maxDelay = 10000;

    const delay = (attempt: number) => {
      const exponentialDelay = Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
      return new Promise((res) => setTimeout(res, exponentialDelay));
    };

    while (attempts < maxAttempts) {
      await delay(attempts);
      
      try {
        const pollRes = await fetch(data.polling_url, {
          method: "GET",
          headers: {
            "x-key": apiKey,
            "Accept": "application/json",
          },
        });

        if (!pollRes.ok) {
          console.error("Polling error:", await pollRes.text());
          throw new Error("Error while polling for the result.");
        }

        const pollData = await pollRes.json();

        if (pollData.status === "Ready") {
          // Ensure we get exactly 2 variations
          const samples = pollData.result.samples || [pollData.result.sample];
          result = samples.slice(0, 2);
          break;
        } else if (pollData.status === "Failed" || pollData.status === "Error") {
          throw new Error(pollData.error || "Image generation failed.");
        } else if (pollData.status === "Processing") {
          console.log(`Still processing... Attempt ${attempts + 1}/${maxAttempts}`);
        }

        attempts++;
      } catch (error) {
        console.error("Polling attempt failed:", error);
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error("Image generation timed out after multiple attempts.");
        }
      }
    }

    if (!result) {
      throw new Error("Image generation timed out. Please try again with a simpler prompt or different image.");
    }

    return NextResponse.json({
      editedImageUrls: result,
      success: true,
    });
  } catch (error: any) {
    console.error("Error in image editing API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
} 