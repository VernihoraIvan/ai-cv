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
  for (const [
    index,
    experience,
  ] of personalData.programmingExperience.entries()) {
    const content = `${experience.role} at ${experience.company} (${
      experience.period
    }). Highlights: ${experience.highlights.join(", ")}`;
    await embedAndStore("programmingExperience", content, { index });
  }

  // Embed projects
  for (const [index, project] of personalData.projects.entries()) {
    await embedAndStore("project", project, { index });
  }

  // Embed skills
  for (const [index, skill] of personalData.generalSkills.entries()) {
    await embedAndStore("generalSkill", skill, { index });
  }

  // Embed education
  for (const [index, education] of personalData.education.entries()) {
    await embedAndStore("education", education, { index });
  }

  // Embed non-programming experience
  for (const [
    index,
    experience,
  ] of personalData.nonProgrammingExperience.entries()) {
    const content = `${experience.role} at ${experience.company} (${
      experience.period
    }). Highlights: ${experience.highlights.join(", ")}`;
    await embedAndStore("nonProgrammingExperience", content, { index });
  }

  // Embed interests
  for (const [index, interest] of personalData.interests.entries()) {
    await embedAndStore("interest", interest, { index });
  }

  // Embed languages
  for (const [index, language] of personalData.languages.entries()) {
    await embedAndStore("language", language, { index });
  }

  // Embed location
  await embedAndStore("location", personalData.location);

  // Embed email
  await embedAndStore("email", personalData.email);

  // Embed linkedin
  await embedAndStore("linkedin", personalData.linkedin);

  // Embed github
  await embedAndStore("github", personalData.github);

  // Embed name
  await embedAndStore("name", personalData.name);

  // Embed age
  await embedAndStore("age", personalData.age.toString());

  // Embed nationality
  await embedAndStore("nationality", personalData.nationality);

  // Embed interests
  for (const [index, interest] of personalData.interests.entries()) {
    await embedAndStore("interest", interest, { index });
  }
  console.log("Embedding and storing complete.");
}

main().catch(console.error);
