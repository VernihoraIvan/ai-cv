export const runtime = "edge";

import Chat from "@/components/Chat";
import { createNewSession } from "@/lib/session";
import { getChatMessages } from "@/lib/queries/chat_messages";

type Message = {
  content: string;
  role: "user" | "assistant";
};

export default async function Home() {
  const sessionId = await createNewSession();
  const initialMessages = (await getChatMessages(sessionId)) as Message[];

  return (
    <main>
      <div className="w-full h-full">
        <Chat initialMessages={initialMessages || []} sessionId={sessionId} />
      </div>
    </main>
  );
}
