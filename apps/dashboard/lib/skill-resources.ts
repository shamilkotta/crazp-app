export const MAX_SKILL_RESOURCES = 20;
export const MAX_SKILL_RESOURCE_BYTES = 512 * 1024;
export const SKILL_RESOURCE_PATH_PATTERN =
  /^(scripts|references|assets)\/[A-Za-z0-9._-]+$/;

export type SkillResourceKind = "script" | "reference" | "asset";

export function skillResourceEncoding(
  kind: SkillResourceKind,
  file: { type: string; name: string }
): "text" | "base64" {
  if (kind === "script" || kind === "reference") return "text";
  if (file.type.startsWith("text/") || file.type === "application/json") {
    return "text";
  }
  if (/\.(md|txt|json|ya?ml|csv|xml|svg|html)$/i.test(file.name)) {
    return "text";
  }
  return "base64";
}
