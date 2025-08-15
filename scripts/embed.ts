import "dotenv/config";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { createAzure } from "@ai-sdk/azure";
import { embed } from "ai";
import personalData from "../data/personal-data.json";

async function embedAndStore(category: string, content: string, metadata = {}) {
  const supabase = createSupabaseClient();

  const azure = createAzure({
    resourceName: "ai-powered-cv117",
    apiKey: process.env.AZURE_OPENAI_API_KEY,
  });

  const embeddingModel = azure.textEmbeddingModel("text-embedding-3-small", {
    dimensions: 768,
  });

  console.log(`Embedding ${category}: ${content}`);

  const { embedding } = await embed({
    model: embeddingModel,
    value: content,
  });

  const { error } = await supabase.from("knowledge_base").insert({
    category,
    content,
    embedding,
    metadata,
  });

  if (error) {
    console.error(`Error inserting ${category}: ${content}`, error);
  } else {
    console.log(`Successfully inserted ${category}: ${content}`);
  }
}

async function main() {
  // Embed summary
  await embedAndStore("summary", personalData.summary);

  // Embed experience
  for (const [index, experience] of personalData.experience.entries()) {
    const content = `${experience.role} at ${experience.company} (${
      experience.period
    }). Highlights: ${experience.highlights.join(", ")}`;
    await embedAndStore("experience", content, { index });
  }

  // Embed projects
  for (const [index, project] of personalData.projects.entries()) {
    await embedAndStore("project", project, { index });
  }

  // Embed skills
  for (const [index, skill] of personalData.skills.entries()) {
    await embedAndStore("skill", skill, { index });
  }

  // Embed education
  await embedAndStore("education", personalData.education);

  console.log("Embedding and storing complete.");
}

main().catch(console.error);
