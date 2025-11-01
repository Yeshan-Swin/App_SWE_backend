const Group = require('../models/Group');
const User = require('../models/User');
const Event = require('../models/Event');
const {
  getUserCalendarBusyTimes,
  findAvailableSlots,
} = require('../utils/calendar');

async function getGroupForUser(groupId, userId) {
  const group = await Group.findOne({ id: groupId });
  if (!group) {
    return { error: { status: 404, detail: 'Group not found' } };
  }

  if (group.ownerId !== userId && !(group.memberIds || []).includes(userId)) {
    return { error: { status: 403, detail: 'Not a member of this group' } };
  }

  return { group };
}

async function suggestTimes(req, res) {
  const { group_id: groupId, range_start: rangeStart, range_end: rangeEnd } = req.body;
  const {
    duration_mins: durationMins = 60,
    granularity_mins: granularityMins = 15,
    min_coverage: minCoverage = 0.8,
  } = req.body;

  const { group, error } = await getGroupForUser(groupId, req.user.id);
  if (error) {
    return res.status(error.status).json({ detail: error.detail });
  }

  const memberIds = Array.from(
    new Set([group.ownerId, ...(group.memberIds || [])])
  );

  const busyTimesEntries = await Promise.all(
    memberIds.map(async (memberId) => {
      const busyTimes = await getUserCalendarBusyTimes(
        memberId,
        rangeStart,
        rangeEnd
      );
      return [memberId, busyTimes];
    })
  );

  const allBusyTimes = Object.fromEntries(busyTimesEntries);

  const slots = findAvailableSlots({
    allBusyTimes,
    rangeStart,
    rangeEnd,
    durationMins,
    granularityMins,
    minCoverage,
    totalMembers: memberIds.length,
  });

  return res.json(slots);
}

async function createEvent(req, res) {
  const {
    group_id: groupId,
    start,
    end,
    title,
    description,
    location,
  } = req.body;

  if (!groupId || !start || !end || !title) {
    return res.status(400).json({
      detail: 'group_id, start, end and title are required',
    });
  }

  const { group, error } = await getGroupForUser(groupId, req.user.id);
  if (error) {
    return res.status(error.status).json({ detail: error.detail });
  }

  const memberIds = Array.from(
    new Set([group.ownerId, ...(group.memberIds || [])])
  );

  const members = await User.find({ id: { $in: memberIds } });

  const event = await Event.create({
    groupId,
    title,
    description,
    location,
    start,
    end,
    attendees: members.map((member) => member.email).filter(Boolean),
    createdBy: req.user.id,
  });

  return res.status(201).json({
    message: 'Event created successfully',
    event_id: event.id,
  });
}

module.exports = {
  suggestTimes,
  createEvent,
};
