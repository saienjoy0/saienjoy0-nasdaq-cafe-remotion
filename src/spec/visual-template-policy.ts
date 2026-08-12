import type {VisualTemplateId} from "./visual-template-contract";
import type {VisualTemplatePolicy} from "./visual-director-contract";

const unique = <T,>(values: readonly T[]) => [...new Set(values)];

export const candidateTemplatesForPolicy = (
  authoredTemplate: VisualTemplateId,
  capabilityTemplates: readonly VisualTemplateId[],
  policy: VisualTemplatePolicy | undefined,
) => {
  if (!policy) return unique([authoredTemplate, ...capabilityTemplates]).sort();
  if (policy.mode === "authored-only") return [authoredTemplate];
  return unique([authoredTemplate, ...policy.allowedTemplateIds]).sort();
};
