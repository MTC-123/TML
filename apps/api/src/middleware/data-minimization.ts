import type { FastifyRequest } from "fastify";

export function dataMinimization() {
  return async (request: FastifyRequest, _reply: unknown, payload: unknown): Promise<unknown> => {
    const fieldsHeader = request.headers["x-tml-fields"] as string | undefined;
    if (!fieldsHeader || typeof payload !== "object" || payload === null) return payload;

    const allowedFields = fieldsHeader.split(",").map((f) => f.trim());
    return filterFields(payload, allowedFields);
  };
}

function filterFields(obj: unknown, fields: string[]): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => filterFields(item, fields));
  }
  if (typeof obj === "object" && obj !== null) {
    const filtered: Record<string, unknown> = {};
    for (const field of fields) {
      if (field in (obj as Record<string, unknown>)) {
        filtered[field] = (obj as Record<string, unknown>)[field];
      }
    }
    return filtered;
  }
  return obj;
}
