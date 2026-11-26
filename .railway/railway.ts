import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "The_master.time_site";
export default defineRailway(() => {
  const The_masterTime_site = service("The_master.time_site", {
    source: github("jankowski-dev/The_master.time_site", { branch: "main", checkSuites: false }),
    build: { buildCommand: "npm run build", buildEnvironment: "V3", builder: "NIXPACKS" },
    start: "npm run start",
    healthcheck: "/api/health",
    healthcheckTimeout: 100,
    replicas: { "us-west2": 1 },
    domains: ["master-time.pro"],
    networking: { privateNetworkEndpoint: "themastertimesite" },
  });

  return project("Web-App", {
    variables: { managed: false },
    resources: [The_masterTime_site],
  });
});
