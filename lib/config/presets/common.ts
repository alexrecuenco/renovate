export const removedPresets: Record<string, string | null> = {
  ':autodetectPinVersions': null,
  ':autodetectRangeStrategy': null,
  ':automergeBranchMergeCommit': ':automergeBranch',
  ':automergeBranchPush': ':automergeBranch',
  ':base': 'config:recommended',
  ':app': 'config:js-app',
  ':enableGradleLite': null,
  ':js-app': 'config:js-app',
  ':library': 'config:js-lib',
  ':masterIssue': ':dependencyDashboard',
  ':masterIssueApproval': ':dependencyDashboardApproval',
  ':switchToGradleLite': null,
  ':unpublishSafe': 'npm:unpublishSafe',
  'compatibility:additionalBranchPrefix': null,
  'config:application': 'config:js-app',
  'config:base': 'config:recommended',
  'config:base-js': 'config:recommended',
  'config:library': 'config:js-lib',
  'default:automergeBranchMergeCommit': ':automergeBranch',
  'default:automergeBranchPush': ':automergeBranch',
  'default:base': 'config:recommended',
  'default:app': 'config:js-app',
  'default:js-app': 'config:js-app',
  'default:library': 'config:js-lib',
  'default:onlyNpm': null,
  'default:unpublishSafe': 'npm:unpublishSafe',
  'helpers:oddIsUnstable': null,
  'helpers:oddIsUnstablePackages': null,
  'group:jsTestMonMajor': 'group:jsTestNonMajor',
  'github>whitesource/merge-confidence:beta': 'mergeConfidence:all-badges',
  'replacements:messageFormat-{{package}}-to-@messageformat/{{package}}':
    'replacements:messageFormat-to-scoped',
  'regexManagers:biomeVersions': 'customManagers:biomeVersions',
  'regexManagers:bitbucketPipelinesVersions':
    'customManagers:bitbucketPipelinesVersions',
  'regexManagers:dockerfileVersions': 'customManagers:dockerfileVersions',
  'regexManagers:githubActionsVersions': 'customManagers:githubActionsVersions',
  'regexManagers:gitlabPipelineVersions':
    'customManagers:gitlabPipelineVersions',
  'regexManagers:helmChartYamlAppVersions':
    'customManagers:helmChartYamlAppVersions',
  'regexManagers:mavenPropertyVersions': 'customManagers:mavenPropertyVersions',
  'regexManagers:tfvarsVersions': 'customManagers:tfvarsVersions',
};

const renamedMonorepos: Record<string, string> = {
  'arcus event-grid': 'arcus.event-grid',
  'arcus security': 'arcus.security',
  'arcus messaging': 'arcus.messaging',
  'arcus observability': 'arcus.observability',
  'arcus webapi': 'arcus.webapi',
  'arcus background-jobs': 'arcus.background-jobs',
  'aspnet AspNetWebStack': 'aspnet aspnetwebstack',
  'aspnet Extensions': 'aspnet extensions',
  'System.IO.Abstractions': 'system.io.abstractions',
  angular1: 'angularjs',
  angularcli: 'angular-cli',
  Fontsource: 'fontsource',
  hamcrest: 'javahamcrest',
  HotChocolate: 'hotchocolate',
  infrastructure: 'infrastructure-ui',
  lingui: 'linguijs',
  MassTransit: 'masstransit',
  material: 'material-components-web',
  mui: 'material-ui',
  openfeign: 'feign',
  opentelemetry: 'opentelemetry-js',
  OpenTelemetryDotnet: 'opentelemetry-dotnet',
  picasso: 'picassojs',
  reactrouter: 'react-router',
  sentry: 'sentry-javascript',
  Steeltoe: 'steeltoe',
  stryker: 'stryker-js',
  Swashbuckle: 'swashbuckle-aspnetcore',
};

for (const [from, to] of Object.entries(renamedMonorepos)) {
  removedPresets[`monorepo:${from}`] = `monorepo:${to}`;
  removedPresets[`group:${from}Monorepo`] = `group:${to}Monorepo`;
}
