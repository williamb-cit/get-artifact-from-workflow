const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

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
    console.error("GITHUB_TOKEN not set!");
    process.exit(1);
  }

  if (typeof sha === "undefined" || sha === "") {
    console.error("GITHUB_SHA not set!");
    process.exit(1);
  }

  if (typeof context.owner === "undefined" || context.owner === ""
        || typeof context.repo === "undefined" || context.repo === "") {
    console.error("Invalid context! Check owner and repo.");
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
  console.log(`> Workflow run ID: ${workflow.id}`);

  // Get the first artifact.
  const { data: artifacts } = await octokit.actions.listWorkflowRunArtifacts({
    ...context,
    run_id: workflow.id
  });

  const artifact = artifacts.artifacts[0];
  console.log(`> Artifact: ${artifact.id} (${artifact.name})`);

  // Download the artifact.
  const { data: artifactBytes } = await octokit.actions.downloadArtifact({
    ...context,
    artifact_id: artifact.id,
    archive_format: "zip"
  });

  const fileName = `${sha}.zip`;
  const filePath = path.join(__dirname, fileName);

  fs.unlink(filePath, () => {
    fs.writeFile(filePath, Buffer.from(artifactBytes), (err) => {
      if (err) throw err;
      console.log(`> File '${fileName}' created`);
    });
  });
}

run();
