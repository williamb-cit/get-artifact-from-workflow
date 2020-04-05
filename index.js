const core = require('@actions/core');
const { Octokit } = require("@octokit/rest");

const AdmZip = require('adm-zip');
const package = require("./package.json");

async function run() {
  const t = Args.token();
  const wi = Args.workflowId();
  const an = Args.artifactName();
  
  const action = new Action(t);
  const wri = await action.getWorkflowRunId(wi);
  const ai = await action.getArtifactId(wri, an);
  await action.downloadDistribution(ai);
}

const Validation = {

  isUndefined: function(obj) {
    return typeof obj === "undefined";
  }

};

const Args = {

  get: function(name) {
    return core.getInput(name, { required: true });
  },

  artifactName: function() {
    const artifactName = Args.get("artifact-name");
    console.info(`[INFO] Artifact name: ${artifactName}`);
    return artifactName;
  },

  token: function() {
    return Args.get("token");
  },

  workflowId: function() {
    const workflowId = Args.get("workflow-id");
    console.info(`[INFO] Workflow ID: ${workflowId}`);
    return workflowId;
  }

};

const Action = function(token) {

  const octokit = new Octokit({
    auth: token,
    baseUrl: "https://api.github.com",
    log: console,
    timeZone: "America/Sao_Paulo",
    userAgent: `${package.name}@${package.version}`
  });

  const [ repositoryOwner, repositoryName ] = process.env.GITHUB_REPOSITORY.split("/");

  const context = {
    repo: {
      owner: repositoryOwner,
      repo: repositoryName
    },
    sha: process.env.GITHUB_SHA
  };

  console.info(`[INFO] SHA: ${context.sha}`);

  return {

    getWorkflowRunId: async function(workflowId) {
      const { data: workflows } = await octokit.actions.listWorkflowRuns({
        ...context.repo,
        status: "success",
        workflow_id: workflowId
      });

      const workflowRun = workflows.workflow_runs.find(element => context.sha === element.head_sha);

      if (Validation.isUndefined(workflowRun)) {
        console.error(`[ERROR] Workflow run for '${context.sha}' not found!`);
        process.exit(1);
      }

      console.info(`[INFO] Workflow run ID: ${workflowRun.id}`);
      return workflowRun.id;
    },

    getArtifactId: async function(workflowRunId, artifactName) {
      const { data: artifacts } = await octokit.actions.listWorkflowRunArtifacts({
        ...context.repo,
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

    downloadDistribution: async function(artifactId) {
      const { data: arrayBuffer } = await octokit.actions.downloadArtifact({
        ...context.repo,
        artifact_id: artifactId,
        archive_format: "zip"
      });

      const zipFile = new AdmZip(Buffer.from(arrayBuffer));
      const entry = zipFile.getEntries().find(element => new RegExp(`${context.sha}\.*`).test(element.name));

      if (Validation.isUndefined(entry)) {
        console.error(`[ERROR] Could not find distribution file: ${context.sha}.*`);
        process.exit(1);
      }

      zipFile.extractEntryTo(entry, __dirname, false, true);
      console.info(`[INFO] File downloaded: ${entry.name}`);
    }

  };

}

run();
