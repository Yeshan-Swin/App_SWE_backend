const {
  suggestTimes,
  createEvent,
} = require('../controllers/scheduleController');
const Group = require('../models/Group');
const User = require('../models/User');
const Event = require('../models/Event');
const calendarUtils = require('../utils/calendar');

jest.mock('../models/Group', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/User', () => ({
  find: jest.fn(),
}));

jest.mock('../models/Event', () => ({
  create: jest.fn(),
}));

jest.mock('../utils/calendar', () => ({
  getUserCalendarBusyTimes: jest.fn(),
  findAvailableSlots: jest.fn(),
}));

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('scheduleController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseGroupDoc = {
    id: 'group-1',
    ownerId: 'owner-1',
    memberIds: ['member-1'],
  };

  it('suggestTimes returns availability slots for group members', async () => {
    const req = {
      user: { id: 'owner-1' },
      body: {
        group_id: 'group-1',
        range_start: '2025-03-01T09:00:00Z',
        range_end: '2025-03-01T17:00:00Z',
        duration_mins: 60,
        granularity_mins: 30,
        min_coverage: 0.5,
      },
    };
    const res = createRes();

    Group.findOne.mockResolvedValue(baseGroupDoc);
    calendarUtils.getUserCalendarBusyTimes
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    calendarUtils.findAvailableSlots.mockReturnValue([
      {
        start: '2025-03-01T09:00:00Z',
        end: '2025-03-01T10:00:00Z',
        score: 0.9,
        available_members: 2,
        total_members: 2,
        coverage_ratio: 1,
      },
    ]);

    await suggestTimes(req, res);

    expect(calendarUtils.getUserCalendarBusyTimes).toHaveBeenCalledTimes(2);
    expect(calendarUtils.findAvailableSlots).toHaveBeenCalledWith({
      allBusyTimes: {
        'owner-1': [],
        'member-1': [],
      },
      rangeStart: '2025-03-01T09:00:00Z',
      rangeEnd: '2025-03-01T17:00:00Z',
      durationMins: 60,
      granularityMins: 30,
      minCoverage: 0.5,
      totalMembers: 2,
    });
    expect(res.json).toHaveBeenCalledWith([
      {
        start: '2025-03-01T09:00:00Z',
        end: '2025-03-01T10:00:00Z',
        score: 0.9,
        available_members: 2,
        total_members: 2,
        coverage_ratio: 1,
      },
    ]);
  });

  it('createEvent persists event for group', async () => {
    const req = {
      user: { id: 'owner-1' },
      body: {
        group_id: 'group-1',
        start: '2025-03-02T10:00:00Z',
        end: '2025-03-02T11:00:00Z',
        title: 'Exam Prep',
        description: 'Review session',
        location: 'Library',
      },
    };
    const res = createRes();

    Group.findOne.mockResolvedValue(baseGroupDoc);
    User.find.mockResolvedValue([
      { email: 'owner@example.com' },
      { email: 'member@example.com' },
    ]);
    Event.create.mockResolvedValue({
      id: 'event-1',
    });

    await createEvent(req, res);

    expect(Event.create).toHaveBeenCalledWith({
      groupId: 'group-1',
      title: 'Exam Prep',
      description: 'Review session',
      location: 'Library',
      start: '2025-03-02T10:00:00Z',
      end: '2025-03-02T11:00:00Z',
      attendees: ['owner@example.com', 'member@example.com'],
      createdBy: 'owner-1',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Event created successfully',
      event_id: 'event-1',
    });
  });

  it('blocks scheduling for non-members', async () => {
    const req = {
      user: { id: 'intruder' },
      body: {
        group_id: 'group-1',
        start: '2025-03-02T10:00:00Z',
        end: '2025-03-02T11:00:00Z',
        title: 'Exam Prep',
      },
    };
    const res = createRes();

    Group.findOne.mockResolvedValue(baseGroupDoc);

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      detail: 'Not a member of this group',
    });
    expect(Event.create).not.toHaveBeenCalled();
  });
});
