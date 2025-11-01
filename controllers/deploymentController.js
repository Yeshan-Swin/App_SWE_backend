const Deployment = require('../models/Deployment');

async function createDeploymentRecord(req, res) {
  const {
    environment,
    branch,
    commit,
    status,
    deployed_by: deployedBy,
    duration_seconds: durationSeconds,
  } = req.body;

  if (!environment || !branch || !commit || !status || !deployedBy) {
    return res.status(400).json({
      detail: 'environment, branch, commit, status and deployed_by are required',
    });
  }

  const record = await Deployment.create({
    environment,
    branch,
    commit,
    status,
    deployedBy,
    durationSeconds,
  });

  return res.status(201).json({
    message: 'Deployment recorded',
    id: record.id,
  });
}

async function getDeployments(req, res) {
  const { limit = 20, environment } = req.query;
  const query = {};

  if (environment) {
    query.environment = environment;
  }

  const limitValue = Number(limit) || 20;

  const deployments = await Deployment.find(query)
    .sort({ createdAt: -1 })
    .limit(limitValue);

  return res.json(deployments.map((deployment) => deployment.toJSON()));
}

async function getLatestDeployments(_req, res) {
  const [preview, production] = await Promise.all([
    Deployment.findOne({ environment: 'preview' }).sort({ createdAt: -1 }),
    Deployment.findOne({ environment: 'production' }).sort({ createdAt: -1 }),
  ]);

  return res.json({
    preview: preview ? preview.toJSON() : null,
    production: production ? production.toJSON() : null,
  });
}

module.exports = {
  createDeploymentRecord,
  getDeployments,
  getLatestDeployments,
};
