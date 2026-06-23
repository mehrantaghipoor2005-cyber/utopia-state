import Anthropic from "@anthropic-ai/sdk";

export const assistantTools: Anthropic.Tool[] = [
  {
    name: "get_current_datetime",
    description:
      "دریافت تاریخ و ساعت فعلی. برای پرسش‌های مربوط به زمان، تاریخ، روز هفته استفاده کنید.",
    input_schema: {
      type: "object" as const,
      properties: {
        timezone: {
          type: "string",
          description: "منطقه زمانی مانند Asia/Tehran. پیش‌فرض: Asia/Tehran",
        },
      },
      required: [],
    },
  },
  {
    name: "calculate",
    description:
      "انجام محاسبات ریاضی. برای جمع، تفریق، ضرب، تقسیم و عملیات پیچیده‌تر.",
    input_schema: {
      type: "object" as const,
      properties: {
        expression: {
          type: "string",
          description: "عبارت ریاضی برای محاسبه مثل: 2+2 یا 15*4+10",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "manage_notes",
    description:
      "مدیریت یادداشت‌ها: ذخیره یادداشت جدید، نمایش همه یادداشت‌ها، یا حذف یادداشت.",
    input_schema: {
      type: "object" as const,
      properties: {
        action: {
          type: "string",
          enum: ["add", "list", "delete"],
          description: "عملیات: add (اضافه کردن)، list (نمایش)، delete (حذف)",
        },
        content: {
          type: "string",
          description: "متن یادداشت (برای عملیات add)",
        },
        note_id: {
          type: "string",
          description: "شناسه یادداشت (برای عملیات delete)",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "set_reminder",
    description: "تنظیم یادآور برای کارهای مهم.",
    input_schema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description: "توضیح کاری که باید یادآوری شود",
        },
        time_description: {
          type: "string",
          description: "زمان یادآور مثل: فردا ساعت ۳ عصر، یک ساعت دیگر",
        },
      },
      required: ["task", "time_description"],
    },
  },
  {
    name: "get_weather",
    description: "دریافت اطلاعات آب و هوای یک شهر.",
    input_schema: {
      type: "object" as const,
      properties: {
        city: {
          type: "string",
          description: "نام شهر مثل: تهران، اصفهان، مشهد",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "web_search",
    description: "جستجو در اینترنت برای یافتن اطلاعات به‌روز.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "متن جستجو",
        },
      },
      required: ["query"],
    },
  },
];

const notes: Array<{ id: string; content: string; created_at: string }> = [];

export function executeTool(
  toolName: string,
  toolInput: Record<string, string>
): string {
  switch (toolName) {
    case "get_current_datetime": {
      const timezone = toolInput.timezone || "Asia/Tehran";
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        calendar: "persian",
      };
      const persianDate = new Intl.DateTimeFormat("fa-IR", options).format(now);
      const gregorianOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      };
      const gregorianDate = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", gregorianOptions).format(now);
      return JSON.stringify({
        persian_date: persianDate,
        gregorian_date: gregorianDate,
        timezone: timezone,
      });
    }

    case "calculate": {
      try {
        const expr = toolInput.expression
          .replace(/[^\d+\-*/().%\s]/g, "")
          .trim();
        // Safe evaluation using Function constructor with limited scope
        const result = new Function(`"use strict"; return (${expr})`)();
        return JSON.stringify({ expression: toolInput.expression, result });
      } catch {
        return JSON.stringify({ error: "خطا در محاسبه. لطفاً عبارت را بررسی کنید." });
      }
    }

    case "manage_notes": {
      const { action, content, note_id } = toolInput;
      if (action === "add" && content) {
        const note = {
          id: `note_${Date.now()}`,
          content,
          created_at: new Intl.DateTimeFormat("fa-IR", {
            timeZone: "Asia/Tehran",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date()),
        };
        notes.push(note);
        return JSON.stringify({ success: true, message: "یادداشت ذخیره شد", note });
      } else if (action === "list") {
        return JSON.stringify({ notes: notes.length > 0 ? notes : [], count: notes.length });
      } else if (action === "delete" && note_id) {
        const idx = notes.findIndex((n) => n.id === note_id);
        if (idx !== -1) {
          notes.splice(idx, 1);
          return JSON.stringify({ success: true, message: "یادداشت حذف شد" });
        }
        return JSON.stringify({ error: "یادداشت یافت نشد" });
      }
      return JSON.stringify({ error: "پارامترهای نادرست" });
    }

    case "set_reminder": {
      const { task, time_description } = toolInput;
      return JSON.stringify({
        success: true,
        message: `یادآور تنظیم شد: "${task}" برای ${time_description}`,
        note: "برای یادآور واقعی به اپلیکیشن تقویم دسترسی لازم است.",
      });
    }

    case "get_weather": {
      const city = toolInput.city;
      // Mock weather data — in production, connect to a real weather API
      const weatherData: Record<string, { temp: number; condition: string; humidity: number; wind: number }> = {
        تهران: { temp: 28, condition: "آفتابی با کمی ابر", humidity: 35, wind: 15 },
        اصفهان: { temp: 32, condition: "آفتابی", humidity: 25, wind: 10 },
        مشهد: { temp: 30, condition: "نیمه ابری", humidity: 30, wind: 20 },
        شیراز: { temp: 35, condition: "آفتابی", humidity: 20, wind: 12 },
        تبریز: { temp: 22, condition: "ابری", humidity: 55, wind: 18 },
      };
      const data = weatherData[city] || { temp: 25, condition: "اطلاعات موجود نیست", humidity: 40, wind: 10 };
      return JSON.stringify({
        city,
        temperature: `${data.temp}°C`,
        condition: data.condition,
        humidity: `${data.humidity}%`,
        wind_speed: `${data.wind} km/h`,
      });
    }

    case "web_search": {
      return JSON.stringify({
        message: "جستجوی اینترنتی در محیط آزمایشی غیرفعال است.",
        query: toolInput.query,
        suggestion: "برای جستجوی واقعی، کلید API موتور جستجو را اضافه کنید.",
      });
    }

    default:
      return JSON.stringify({ error: `ابزار ${toolName} شناخته نشده است` });
  }
}
