import { ChatOpenAI } from "@langchain/openai";

export function buildModel(): ChatOpenAI {
  const apiKey = process.env.SUBCONSCIOUS_API_KEY;
  if (!apiKey || apiKey.startsWith("sky_REPLACE")) {
    throw new Error(
      "SUBCONSCIOUS_API_KEY is missing. Copy .env.example to .env and " +
        "paste your key from https://subconscious.dev.",
    );
  }

  const baseURL =
    process.env.SUBCONSCIOUS_BASE_URL ?? "https://api.subconscious.dev/v1";
  const model =
    process.env.SUBCONSCIOUS_MODEL ?? "subconscious/tim-qwen3.6-27b";

  // Subconscious authenticates with "Authorization: Api-Key <key>", not the
  // OpenAI default "Bearer <key>". Override via defaultHeaders and pass a
  // placeholder apiKey (the SDK requires it but our header takes precedence).
  return new ChatOpenAI({
    model,
    apiKey: "not-used",
    streaming: true,
    configuration: {
      baseURL,
      defaultHeaders: { Authorization: `Api-Key ${apiKey}` },
    },
  });
}
