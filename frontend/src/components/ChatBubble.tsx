interface ChatBubbleProps {
  role: string;
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isAgent = role === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
          isAgent
            ? "rounded-bl-md bg-stone-100 text-stone-800"
            : "rounded-br-md bg-amber-600 text-white"
        }`}
      >
        {isAgent && (
          <p className="mb-1 text-xs font-medium text-amber-700">采访记者</p>
        )}
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
