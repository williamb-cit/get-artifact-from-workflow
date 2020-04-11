const fs = require("fs");
const path = require("path");

const core = require('@actions/core');
const { Octokit } = require("@octokit/rest");

const AdmZip = require('adm-zip');
const package = require("./package.json");

async function run() {
  const an = Args.artifactName();
  const t = Args.token();
  const tp = Args.targetPath();
  const wi = Args.workflowId();
  
  const action = new Action(t);
  const wri = await action.getWorkflowRunId(wi);
  const ai = await action.getArtifactId(wri, an);
  await action.downloadDistribution(ai, tp);
}

const Validation = {

  isUndefined: function(obj) {
    return typeof obj === "undefined";
  },

  isStringEmpty: function(str) {
    return typeof str === "undefined" || str.trim() === "";
  }

};

const Env = {

  githubContext: function() {
    const [ repositoryOwner, repositoryName ] = process.env.GITHUB_REPOSITORY.split("/");

    return {
      repo: {
        owner: repositoryOwner,
        repo: repositoryName
      },
      sha: process.env.GITHUB_SHA
    };
  },

  githubWorkspace: function() {
    return process.env.GITHUB_WORKSPACE;
  },

  octokitLogRequests: function() {
    return !Validation.isUndefined(process.env.OCTOKIT_LOG_REQUESTS) && process.env.OCTOKIT_LOG_REQUESTS.toLowerCase() === "true";
  }

};

const Args = {

  get: function(name, options) {
    return core.getInput(name, options);
  },

  artifactName: function() {
    let artifactName = Args.get("artifact-name", { required: false });

    if (Validation.isStringEmpty(artifactName)) {
      artifactName = `distro-${Env.githubContext().sha}`;
    }

    console.info(`[INFO] Artifact name: ${artifactName}`);
    return artifactName;
  },

  targetPath: function() {
    let targetPath = Args.get("target-path", { required: false });

    if (Validation.isStringEmpty(targetPath)) {
      targetPath = Env.githubWorkspace();
    }

    console.info(`[INFO] Target path: ${targetPath}`);
    return targetPath;
  },

  token: function() {
    return Args.get("token", { required: true });
  },

  workflowId: function() {
    const workflowId = Args.get("workflow-id", { required: true });
    console.info(`[INFO] Workflow ID: ${workflowId}`);
    return workflowId;
  }

};

const Action = function(token) {

  const octokit = new Octokit({
    auth: token,
    baseUrl: "https://api.github.com",
    log: Env.octokitLogRequests() ? console : null,
    timeZone: "America/Sao_Paulo",
    userAgent: `${package.name}@${package.version}`
  });

  const context = Env.githubContext();
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

    downloadDistribution: async function(artifactId, targetPath) {
      const { data: arrayBuffer } = await octokit.actions.downloadArtifact({
        ...context.repo,
        artifact_id: artifactId,
        archive_format: "zip"
      });

      const zipFile = new AdmZip(Buffer.from(arrayBuffer));
      const distroContentPath = path.join(targetPath, `distro-${context.sha}`);

      fs.mkdir(distroContentPath, (err) => {
        // If directory already exists, the content will be merged.
        if (err && err.code !== "EEXIST") throw err;

        zipFile.extractAllTo(distroContentPath, true);
        core.setOutput("distro-content-path", distroContentPath);
        console.info(`[INFO] Files extracted to: ${distroContentPath}`);
      });
    }

  };

}

run();
