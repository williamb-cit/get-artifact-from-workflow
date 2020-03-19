const { Octokit } = require("@octokit/rest");
const AdmZip = require('adm-zip');
const package = require("./package.json");

async function run() {
  const sha = Args.sha();
  const an = Args.artifactName(); 
  
  const action = new Action();
  const wri = await action.getWorkflowRunId(sha);
  const ai = await action.getArtifactId(wri, an);
  await action.downloadDistribution(ai, sha);
}

const Args = {

  sha: function() {
    const sha = process.argv[2];

    if (typeof sha === "undefined") {
      console.error("[ERROR] SHA is missing!");
      process.exit(1);
    }

    console.info(`[INFO] SHA: ${sha}`);
    return sha;
  },

  artifactName: function() {
    const name = process.argv[3];

    if (typeof name === "undefined") {
      console.error("[ERROR] Artifact name is missing!");
      process.exit(1);
    }

    console.info(`[INFO] Artifact name: ${name}`);
    return name;
  }

};

const Action = function() {

  if (typeof process.env.GITHUB_TOKEN === "undefined" || process.env.GITHUB_TOKEN === "") {
    console.error("[ERROR] GITHUB_TOKEN not set!");
    process.exit(1);
  }

  if (typeof process.env.GITHUB_OWNER === "undefined" || process.env.GITHUB_OWNER === ""
        || typeof process.env.GITHUB_REPO === "undefined" || process.env.GITHUB_REPO === "") {
    console.error("[ERROR] Invalid context! Check owner and repo.");
    process.exit(1);
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    baseUrl: "https://api.github.com",
    log: console,
    timeZone: "America/Sao_Paulo",
    userAgent: `${package.name}@${package.version}`
  });

  const context = {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO
  };

  return {

    getWorkflowRunId: async function(sha) {
      const { data: workflows } = await octokit.actions.listWorkflowRuns({
        ...context,
        status: "success",
        workflow_id: process.env.GITHUB_WORKFLOW_ID
      });

      const workflowRun = workflows.workflow_runs.find(element => sha === element.head_sha);
      console.info(`[INFO] Workflow run ID: ${workflowRun.id}`);

      return workflowRun.id;
    },

    getArtifactId: async function(workflowRunId, artifactName) {
      const { data: artifacts } = await octokit.actions.listWorkflowRunArtifacts({
        ...context,
        run_id: workflowRunId
      });

      const artifact = artifacts.artifacts.find(element => artifactName === element.name);
      console.info(`[INFO] Artifact: ${artifact.id}`);

      return artifact.id;
    },

    downloadDistribution: async function(artifactId, sha) {
      const { data: arrayBuffer } = await octokit.actions.downloadArtifact({
        ...context,
        artifact_id: artifactId,
        archive_format: "zip"
      });

      const zipFile = new AdmZip(Buffer.from(arrayBuffer));
      const entry = zipFile.getEntries().find(element => new RegExp(`${sha}\.*`).test(element.name));

      if (typeof entry === "undefined") {
        console.error(`[ERROR] Could not find distribution file: ${sha}.*`);
        process.exit(1);
      }

      zipFile.extractEntryTo(entry, __dirname, false, true);
      console.info(`[INFO] File downloaded: ${entry.name}`);
    }

  };

}

run();
