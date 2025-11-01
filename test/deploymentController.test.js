const {
  createDeploymentRecord,
  getDeployments,
  getLatestDeployments,
} = require('../controllers/deploymentController');
const Deployment = require('../models/Deployment');

jest.mock('../models/Deployment', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
}));

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('deploymentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a deployment record when payload is complete', async () => {
    const req = {
      body: {
        environment: 'preview',
        branch: 'main',
        commit: 'abc123',
        status: 'success',
        deployed_by: 'alice@example.com',
        duration_seconds: 120,
      },
    };
    const res = createRes();

    Deployment.create.mockResolvedValue({ id: 'deploy-1' });

    await createDeploymentRecord(req, res);

    expect(Deployment.create).toHaveBeenCalledWith({
      environment: 'preview',
      branch: 'main',
      commit: 'abc123',
      status: 'success',
      deployedBy: 'alice@example.com',
      durationSeconds: 120,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Deployment recorded',
      id: 'deploy-1',
    });
  });

  it('rejects deployment creation when required fields missing', async () => {
    const req = {
      body: {
        environment: 'preview',
        branch: 'main',
      },
    };
    const res = createRes();

    await createDeploymentRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'environment, branch, commit, status and deployed_by are required',
    });
    expect(Deployment.create).not.toHaveBeenCalled();
  });

  it('lists deployments with optional environment filter', async () => {
    const req = {
      query: {
        limit: '5',
        environment: 'production',
      },
    };
    const res = createRes();

    const deploymentDoc = {
      toJSON: () => ({
        id: 'deploy-1',
        environment: 'production',
        branch: 'main',
        commit: 'abc123',
        status: 'success',
        deployed_by: 'bob@example.com',
        duration_seconds: 90,
        created_at: '2025-01-01T00:00:00.000Z',
      }),
    };

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([deploymentDoc]),
    };
    Deployment.find.mockReturnValue(mockQuery);

    await getDeployments(req, res);

    expect(Deployment.find).toHaveBeenCalledWith({ environment: 'production' });
    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockQuery.limit).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 'deploy-1',
        environment: 'production',
        branch: 'main',
        commit: 'abc123',
        status: 'success',
        deployed_by: 'bob@example.com',
        duration_seconds: 90,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('returns latest preview and production deployments', async () => {
    const req = {};
    const res = createRes();

    const previewDoc = {
      toJSON: () => ({ id: 'preview-1' }),
    };
    const prodDoc = {
      toJSON: () => ({ id: 'prod-1' }),
    };

    const mockPreviewQuery = {
      sort: jest.fn().mockResolvedValue(previewDoc),
    };
    const mockProdQuery = {
      sort: jest.fn().mockResolvedValue(prodDoc),
    };

    Deployment.findOne
      .mockReturnValueOnce(mockPreviewQuery)
      .mockReturnValueOnce(mockProdQuery);

    await getLatestDeployments(req, res);

    expect(Deployment.findOne).toHaveBeenNthCalledWith(1, {
      environment: 'preview',
    });
    expect(Deployment.findOne).toHaveBeenNthCalledWith(2, {
      environment: 'production',
    });
    expect(res.json).toHaveBeenCalledWith({
      preview: { id: 'preview-1' },
      production: { id: 'prod-1' },
    });
  });
});
