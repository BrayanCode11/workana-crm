import { z } from "zod";

export const preparedMessageFields = [
  { key: "initial_message", label: "Consulta inicial", sentLabel: "Consulta enviada", action: "initial_sent" },
  { key: "follow_up_1_message", label: "Seguimiento 1", sentLabel: "Seguimiento 1 enviado", action: "follow_up_1_sent" },
  { key: "follow_up_2_message", label: "Seguimiento 2", sentLabel: "Seguimiento 2 enviado", action: "follow_up_2_sent" },
] as const;

export type PreparedMessageKey = (typeof preparedMessageFields)[number]["key"];
export type PreparedMessages = Record<PreparedMessageKey, string | null>;

const optionalMessage = z.string().max(20000, "Utiliza como máximo 20.000 caracteres.");
const preparedMessagesSchema = z.object({
  initial_message: optionalMessage,
  follow_up_1_message: optionalMessage,
  follow_up_2_message: optionalMessage,
});

export function parsePreparedMessages(input: Record<PreparedMessageKey, unknown>):
  | { values: PreparedMessages }
  | { errors: Partial<Record<PreparedMessageKey, string>> } {
  const parsed = preparedMessagesSchema.safeParse({
    initial_message: String(input.initial_message ?? ""),
    follow_up_1_message: String(input.follow_up_1_message ?? ""),
    follow_up_2_message: String(input.follow_up_2_message ?? ""),
  });
  if (!parsed.success) {
    const errors: Partial<Record<PreparedMessageKey, string>> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as PreparedMessageKey;
      if (!errors[field]) errors[field] = issue.message;
    });
    return { errors };
  }
  return {
    values: {
      initial_message: parsed.data.initial_message.trim() || null,
      follow_up_1_message: parsed.data.follow_up_1_message.trim() || null,
      follow_up_2_message: parsed.data.follow_up_2_message.trim() || null,
    },
  };
}

export function preparedMessagesFromFormData(formData: FormData) {
  return parsePreparedMessages({
    initial_message: formData.get("initial_message"),
    follow_up_1_message: formData.get("follow_up_1_message"),
    follow_up_2_message: formData.get("follow_up_2_message"),
  });
}
