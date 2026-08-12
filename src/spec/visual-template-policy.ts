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
  const capabilitySet = new Set(capabilityTemplates);
  const explicitlyAllowed = policy.allowedTemplateIds.filter((template) => capabilitySet.has(template));
  return unique([authoredTemplate, ...explicitlyAllowed]).sort();
};
