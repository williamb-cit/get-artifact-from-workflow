const { Octokit } = require("@octokit/rest");
const AdmZip = require('adm-zip');

async function run() {
  // Setup and validation.
  const package = require("./package.json");
  const token = process.env.GITHUB_TOKEN;
  const sha = process.env.GITHUB_SHA;

  const context = {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO
  };

  if (typeof token === "undefined" || token === "") {
    console.error("[ERROR] GITHUB_TOKEN not set!");
    process.exit(1);
  }

  if (typeof sha === "undefined" || sha === "") {
    console.error("[ERROR] GITHUB_SHA not set!");
    process.exit(1);
  }

  if (typeof context.owner === "undefined" || context.owner === ""
        || typeof context.repo === "undefined" || context.repo === "") {
    console.error("[ERROR] Invalid context! Check owner and repo.");
    process.exit(1);
  }

  // Octokit setup.
  const octokit = new Octokit({
    auth: token,
    baseUrl: "https://api.github.com",
    log: console,
    timeZone: "America/Sao_Paulo",
    userAgent: `${package.name}@${package.version}`
  });

  // Find the workflow that matches GITHUB_SHA.
  const { data: workflows } = await octokit.actions.listWorkflowRuns({
    ...context,
    status: "success",
    workflow_id: process.env.GITHUB_WORKFLOW_ID
  });

  const workflow = workflows.workflow_runs.find(element => sha === element.head_sha);
  console.log(`[INFO] Workflow run ID: ${workflow.id}`);

  // Get the first artifact.
  const { data: artifacts } = await octokit.actions.listWorkflowRunArtifacts({
    ...context,
    run_id: workflow.id
  });

  const artifact = artifacts.artifacts[0];
  console.log(`[INFO] Artifact: ${artifact.id} (${artifact.name})`);

  // Download the artifact.
  const { data: arrayBuffer } = await octokit.actions.downloadArtifact({
    ...context,
    artifact_id: artifact.id,
    archive_format: "zip"
  });

  const zipFile = new AdmZip(Buffer.from(arrayBuffer));
  const entry = zipFile.getEntries().find(entry => new RegExp(`${sha}\.*`).test(entry.name));

  if (typeof entry === "undefined") {
    console.error(`[ERROR] Could not find distribution file: ${sha}.*`);
    process.exit(1);
  }

  zipFile.extractEntryTo(entry, __dirname, false, true);
  console.info(`[INFO] File downloaded: ${entry.name}`);
}

run();
