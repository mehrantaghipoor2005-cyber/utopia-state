import Anthropic from "@anthropic-ai/sdk";
import { assistantTools, executeTool } from "@/lib/tools";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `تو یک دستیار هوش مصنوعی فارسی هستی به نام "یار" که مثل سیری کار می‌کنی.

قوانین مهم:
- همیشه به فارسی روان و طبیعی جواب بده
- مودب، دوستانه و صمیمی باش
- کوتاه و مفید جواب بده مگر اینکه توضیح بیشتری خواسته شود
- برای کارهای روزمره از ابزارهای موجود استفاده کن
- تاریخ و ساعت را با تقویم شمسی بیان کن
- اگر چیزی را نمی‌دانی صادقانه بگو

توانایی‌های تو:
- پاسخ به سوالات عمومی
- اعلام تاریخ و ساعت دقیق
- انجام محاسبات ریاضی
- مدیریت یادداشت‌ها
- تنظیم یادآور
- اطلاعات آب‌وهوا
- کمک در نوشتن متن، ترجمه، خلاصه‌سازی
- مشاوره و راهنمایی

شروع مکالمه را با معرفی خودت نکن مگر اینکه کاربر بپرسد.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "پیام‌ها نامعتبر هستند" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = [...messages];
          let continueLoop = true;

          while (continueLoop) {
            const response = await client.messages.create({
              model: "claude-opus-4-8",
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              tools: assistantTools,
              messages: currentMessages,
              stream: true,
            });

            let fullText = "";
            let toolUseBlocks: Anthropic.ToolUseBlock[] = [];
            let currentToolUse: Partial<Anthropic.ToolUseBlock> & { input_json: string } | null = null;
            let stopReason: string | null = null;

            for await (const event of response) {
              if (event.type === "content_block_start") {
                if (event.content_block.type === "tool_use") {
                  currentToolUse = {
                    type: "tool_use",
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: {},
                    input_json: "",
                  };
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  fullText += event.delta.text;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
                    )
                  );
                } else if (event.delta.type === "input_json_delta" && currentToolUse) {
                  currentToolUse.input_json += event.delta.partial_json;
                }
              } else if (event.type === "content_block_stop") {
                if (currentToolUse) {
                  try {
                    currentToolUse.input = JSON.parse(currentToolUse.input_json || "{}");
                  } catch {
                    currentToolUse.input = {};
                  }
                  toolUseBlocks.push(currentToolUse as Anthropic.ToolUseBlock);
                  currentToolUse = null;
                }
              } else if (event.type === "message_delta") {
                stopReason = event.delta.stop_reason ?? null;
              }
            }

            if (stopReason === "tool_use" && toolUseBlocks.length > 0) {
              // Send tool use notification to client
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_use", tools: toolUseBlocks.map(t => t.name) })}\n\n`
                )
              );

              // Build assistant message with all content
              const assistantContent: Anthropic.MessageParam["content"] = [];
              if (fullText) {
                (assistantContent as Anthropic.TextBlockParam[]).push({ type: "text", text: fullText });
              }
              for (const tool of toolUseBlocks) {
                (assistantContent as Anthropic.ToolUseBlockParam[]).push({
                  type: "tool_use",
                  id: tool.id,
                  name: tool.name,
                  input: tool.input,
                });
              }

              currentMessages = [
                ...currentMessages,
                { role: "assistant", content: assistantContent },
              ];

              // Execute all tools
              const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((tool) => ({
                type: "tool_result" as const,
                tool_use_id: tool.id,
                content: executeTool(tool.name, tool.input as Record<string, string>),
              }));

              currentMessages = [
                ...currentMessages,
                { role: "user", content: toolResults },
              ];
            } else {
              continueLoop = false;
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "خطای ناشناخته";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "خطای سرور";
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
