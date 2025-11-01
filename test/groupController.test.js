const {
  getGroups,
  createGroup,
  getGroup,
  inviteToGroup,
} = require('../controllers/groupController');
const Group = require('../models/Group');
const User = require('../models/User');

jest.mock('../models/Group', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock('../models/User', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('groupController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns groups for current user with member details', async () => {
    const req = { user: { id: 'user-1' } };
    const res = createRes();

    const groupDoc = {
      ownerId: 'user-1',
      memberIds: ['user-1', 'user-2'],
      toJSON: () => ({
        id: 'group-1',
        name: 'Study Group',
        owner_id: 'user-1',
        member_ids: ['user-1', 'user-2'],
        created_at: '2025-01-01T00:00:00.000Z',
      }),
    };

    Group.find.mockResolvedValue([groupDoc]);
    User.find.mockResolvedValue([
      {
        toJSON: () => ({
          id: 'user-1',
          email: 'owner@example.com',
          name: 'Owner',
          timezone: 'UTC',
          avatar_url: null,
          created_at: '2025-01-01T00:00:00.000Z',
        }),
      },
      {
        toJSON: () => ({
          id: 'user-2',
          email: 'member@example.com',
          name: 'Member',
          timezone: 'UTC',
          avatar_url: null,
          created_at: '2025-01-01T00:00:00.000Z',
        }),
      },
    ]);

    await getGroups(req, res);

    expect(Group.find).toHaveBeenCalledWith({
      $or: [{ ownerId: 'user-1' }, { memberIds: 'user-1' }],
    });
    expect(User.find).toHaveBeenCalledWith({
      id: { $in: ['user-1', 'user-2'] },
    });
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 'group-1',
        name: 'Study Group',
        owner_id: 'user-1',
        member_ids: ['user-1', 'user-2'],
        created_at: '2025-01-01T00:00:00.000Z',
        members: [
          {
            id: 'user-1',
            email: 'owner@example.com',
            name: 'Owner',
            timezone: 'UTC',
            avatar_url: null,
            created_at: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'user-2',
            email: 'member@example.com',
            name: 'Member',
            timezone: 'UTC',
            avatar_url: null,
            created_at: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
    ]);
  });

  it('creates a group with owner as member', async () => {
    const req = {
      user: { id: 'user-1' },
      body: { name: 'New Group' },
    };
    const res = createRes();

    const groupDoc = {
      toJSON: () => ({
        id: 'group-1',
        name: 'New Group',
        owner_id: 'user-1',
        member_ids: ['user-1'],
        created_at: '2025-01-01T00:00:00.000Z',
      }),
    };
    Group.create.mockResolvedValue(groupDoc);
    User.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 'user-1',
        email: 'owner@example.com',
        name: 'Owner',
        timezone: 'UTC',
        avatar_url: null,
        created_at: '2025-01-01T00:00:00.000Z',
      }),
    });

    await createGroup(req, res);

    expect(Group.create).toHaveBeenCalledWith({
      name: 'New Group',
      ownerId: 'user-1',
      memberIds: ['user-1'],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 'group-1',
      name: 'New Group',
      owner_id: 'user-1',
      member_ids: ['user-1'],
      created_at: '2025-01-01T00:00:00.000Z',
      members: [
        {
          id: 'user-1',
          email: 'owner@example.com',
          name: 'Owner',
          timezone: 'UTC',
          avatar_url: null,
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('prevents non-owner from inviting members', async () => {
    const req = {
      user: { id: 'user-2' },
      params: { groupId: 'group-1' },
      body: { emails: ['new@example.com'] },
    };
    const res = createRes();

    const groupDoc = {
      ownerId: 'user-1',
      memberIds: ['user-1'],
    };
    Group.findOne.mockResolvedValue(groupDoc);

    await inviteToGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'Only group owner can invite members',
    });
    expect(Group.updateOne).not.toHaveBeenCalled();
  });

  it('returns group details when requester is member', async () => {
    const req = {
      user: { id: 'user-2' },
      params: { groupId: 'group-1' },
    };
    const res = createRes();

    const groupDoc = {
      ownerId: 'user-1',
      memberIds: ['user-2'],
      toJSON: () => ({
        id: 'group-1',
        name: 'Study Group',
        owner_id: 'user-1',
        member_ids: ['user-2'],
        created_at: '2025-01-01T00:00:00.000Z',
      }),
    };

    Group.findOne.mockResolvedValue(groupDoc);
    User.find.mockResolvedValue([
      {
        toJSON: () => ({
          id: 'user-1',
          email: 'owner@example.com',
          name: 'Owner',
          timezone: 'UTC',
          avatar_url: null,
          created_at: '2025-01-01T00:00:00.000Z',
        }),
      },
      {
        toJSON: () => ({
          id: 'user-2',
          email: 'member@example.com',
          name: 'Member',
          timezone: 'UTC',
          avatar_url: null,
          created_at: '2025-01-01T00:00:00.000Z',
        }),
      },
    ]);

    await getGroup(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id: 'group-1',
      name: 'Study Group',
      owner_id: 'user-1',
      member_ids: ['user-2'],
      created_at: '2025-01-01T00:00:00.000Z',
      members: [
        {
          id: 'user-1',
          email: 'owner@example.com',
          name: 'Owner',
          timezone: 'UTC',
          avatar_url: null,
          created_at: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'user-2',
          email: 'member@example.com',
          name: 'Member',
          timezone: 'UTC',
          avatar_url: null,
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ],
    });
  });
});
