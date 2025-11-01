const Group = require('../models/Group');
const User = require('../models/User');

async function buildGroupResponse(groupDoc) {
  if (!groupDoc) {
    return null;
  }

  const group = groupDoc.toJSON();
  const memberIds = new Set([
    group.owner_id,
    ...(group.member_ids || []),
  ]);

  const members = await User.find({ id: { $in: Array.from(memberIds) } });

  return {
    ...group,
    members: members.map((member) => member.toJSON()),
  };
}

async function getGroups(req, res) {
  const userId = req.user.id;

  const groups = await Group.find({
    $or: [{ ownerId: userId }, { memberIds: userId }],
  });

  const results = await Promise.all(groups.map((group) => buildGroupResponse(group)));
  return res.json(results);
}

async function createGroup(req, res) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ detail: 'Group name is required' });
  }

  const userId = req.user.id;
  const group = await Group.create({
    name,
    ownerId: userId,
    memberIds: [userId],
  });

  const owner = await User.findOne({ id: userId });

  return res.status(201).json({
    ...group.toJSON(),
    members: owner ? [owner.toJSON()] : [],
  });
}

async function getGroup(req, res) {
  const { groupId } = req.params;
  const group = await Group.findOne({ id: groupId });

  if (!group) {
    return res.status(404).json({ detail: 'Group not found' });
  }

  const userId = req.user.id;
  if (group.ownerId !== userId && !(group.memberIds || []).includes(userId)) {
    return res.status(403).json({ detail: 'Not a member of this group' });
  }

  const response = await buildGroupResponse(group);
  return res.json(response);
}

async function inviteToGroup(req, res) {
  const { groupId } = req.params;
  const { emails = [] } = req.body;

  const group = await Group.findOne({ id: groupId });
  if (!group) {
    return res.status(404).json({ detail: 'Group not found' });
  }

  if (group.ownerId !== req.user.id) {
    return res.status(403).json({
      detail: 'Only group owner can invite members',
    });
  }

  const invitedUsers = [];
  const currentMembers = new Set(group.memberIds || []);

  for (const email of emails) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && !currentMembers.has(user.id)) {
      await Group.updateOne(
        { id: groupId },
        { $addToSet: { memberIds: user.id } }
      );
      invitedUsers.push(user.email);
      currentMembers.add(user.id);
    }
  }

  return res.json({
    message: `Invited ${invitedUsers.length} users`,
    invited: invitedUsers,
  });
}

module.exports = {
  getGroups,
  createGroup,
  getGroup,
  inviteToGroup,
};
