export const runtime = "edge";

import Chat from "@/components/Chat";
import { createNewSession } from "@/lib/session";

export default async function Home() {
  const sessionId = await createNewSession();
  // const initialMessages = (await getChatMessages(sessionId)) as Message[];

  return (
    <main>
      <div className="w-full h-full">
        <Chat initialMessages={[]} sessionId={sessionId} />
      </div>
    </main>
  );
}
