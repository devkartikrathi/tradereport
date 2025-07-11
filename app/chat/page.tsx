import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/sidebar";
import ChatInterface from "@/components/chatbot/chat-interface";

export default async function ChatPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Sidebar>
      <div className="p-8">
        <ChatInterface />
      </div>
    </Sidebar>
  );
}
