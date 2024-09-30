import { z } from 'zod';

const UrlSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string())]),
);

const MonorepoSchema = z.object({
  repoGroups: UrlSchema,
  orgGroups: UrlSchema,
  patternGroups: UrlSchema,
});

const PackageRuleSchema = z.object({
  matchCurrentVersion: z.string().optional(),
  matchDatasources: z.array(z.string()),
  matchPackageNames: z.array(z.string()),
  replacementName: z.string().optional(),
  replacementVersion: z.string().optional(),
  description: z.string().optional(),
  replacementNameTemplate: z.string().optional(),
});

const RuleSetSchema = z.object({
  description: z.string(),
  packageRules: z
    .array(PackageRuleSchema)
    .min(1)
    .refine(
      (rules) =>
        rules.some(
          (rule) =>
            rule.replacementName !== undefined ||
            rule.replacementNameTemplate !== undefined,
        ),
      {
        message:
          'At least one package rule must have either replacementName or replacementNameTemplate',
      },
    ),
});

const AllSchema = z.object({
  description: z.string(),
  extends: z.array(z.string()),
  ignoreDeps: z.array(z.string()).optional(),
});

const ReplacementsSchema = z
  .object({
    $schema: z.string(),
    all: AllSchema,
  })
  .catchall(RuleSetSchema);

export { MonorepoSchema, ReplacementsSchema };
