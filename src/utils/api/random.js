export const prerender = false; // Opt out of prerendering for this endpoint

export async function GET() {
  // Generate random data
  const randomNumber = Math.random();
  const timestamp = new Date().toISOString();

  // Return a Response object with JSON data
  return new Response(
    JSON.stringify({
      number: randomNumber,
      timestamp: timestamp,
      message: `Here's a random number: ${randomNumber}`,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
