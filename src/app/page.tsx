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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-3xl h-full">
        <Chat initialMessages={initialMessages || []} sessionId={sessionId} />
      </div>
    </main>
  );
}
