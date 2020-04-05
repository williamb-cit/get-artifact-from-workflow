const { Octokit } = require("@octokit/rest");
const AdmZip = require('adm-zip');
const package = require("./package.json");

async function run() {
  const wi = Args.workflowId();
  const sha = Args.sha();
  const an = Args.artifactName();
  
  const action = new Action();
  const wri = await action.getWorkflowRunId(wi, sha);
  const ai = await action.getArtifactId(wri, an);
  await action.downloadDistribution(ai, sha);
}

const Validation = {

  isUndefined: function(obj) {
    return typeof obj === "undefined";
  },

  isStringEmpty: function(str) {
    return typeof str === "undefined" || str.trim() === "";
  }

};

const Args = {

  get: function(name) {
    const value = process.env[`INPUT_${name.toUpperCase()}`] || '';

    if (Validation.isStringEmpty(value)) {
      console.error(`[ERROR] ${name} is missing!`);
      process.exit(1);
    }

    return value;
  },

  workflowId: function() {
    const workflowId = Args.get("workflow-id");
    console.info(`[INFO] Workflow ID: ${workflowId}`);
    return workflowId;
  },

  sha: function() {
    const sha = Args.get("sha");
    console.info(`[INFO] SHA: ${sha}`);
    return sha;
  },

  artifactName: function() {
    const artifactName = Args.get("artifact-name");
    console.info(`[INFO] Artifact name: ${artifactName}`);
    return artifactName;
  }

};

const Action = function() {

  const octokit = new Octokit({
    auth: Args.get("token"),
    baseUrl: "https://api.github.com",
    log: console,
    timeZone: "America/Sao_Paulo",
    userAgent: `${package.name}@${package.version}`
  });

  const [ repositoryOwner, repositoryName ] = Args.get("repository").split("/");

  const context = {
    owner: repositoryOwner,
    repo: repositoryName
  };

  return {

    getWorkflowRunId: async function(workflowId, sha) {
      const { data: workflows } = await octokit.actions.listWorkflowRuns({
        ...context,
        status: "success",
        workflow_id: workflowId
      });

      const workflowRun = workflows.workflow_runs.find(element => sha === element.head_sha);

      if (Validation.isUndefined(workflowRun)) {
        console.error(`[ERROR] Workflow run for '${sha}' not found!`);
        process.exit(1);
      }

      console.info(`[INFO] Workflow run ID: ${workflowRun.id}`);
      return workflowRun.id;
    },

    getArtifactId: async function(workflowRunId, artifactName) {
      const { data: artifacts } = await octokit.actions.listWorkflowRunArtifacts({
        ...context,
        run_id: workflowRunId
      });

      const artifact = artifacts.artifacts.find(element => artifactName === element.name);

      if (Validation.isUndefined(artifact)) {
        console.error(`[ERROR] Artifact '${artifactName}' not found!`);
        process.exit(1);
      }

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

      if (Validation.isUndefined(entry)) {
        console.error(`[ERROR] Could not find distribution file: ${sha}.*`);
        process.exit(1);
      }

      zipFile.extractEntryTo(entry, __dirname, false, true);
      console.info(`[INFO] File downloaded: ${entry.name}`);
    }

  };

}

run();
