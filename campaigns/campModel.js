const db = require('../database/dbConfig');

const CampUpdate = require('../campaignUpdates/updateModel.js');

module.exports = {
  find,
  findCampaign,
  findById,
  findCampaignWithComments,
  findUser,
  findCampByUserId,
  insert,
  update,
  remove
};

function find() {
  return db('campaigns')
    .join('users', 'users.id', 'campaigns.users_id')
    .select(
      'users.username',
      'users.profile_image',
      'users.location',
      'campaigns.*'
    )
    .then(campaigns => {
      return db('comments').then(comments => {
        campaigns.map(cam => {
          return (cam.comments_length = comments.filter(
            com => com.camp_id === cam.camp_id
          ).length);
        });
        return campaigns;
      });
    });
}

function findCampaign(camp_id) {
  return db('campaigns')
    .where({ camp_id })
    .first()
}

async function findById(camp_id) {
  const campaign = await db('campaigns')
    .where({ camp_id })
    .join('users', 'users.id', 'campaigns.users_id')
    .select(
      'users.username',
      'users.profile_image',
      'users.location',
      'campaigns.*'
    )
    .first();
  campaign.updates = await CampUpdate.findUpdatesByCamp(camp_id);
  return campaign;
}

async function findCampaignWithComments(camp_id) {
  const campaign = await db('campaigns')
    .where({ camp_id })
    .join('users', 'users.id', 'campaigns.users_id')
    .select(
      'users.profile_image',
      'campaigns.created_at',
      'campaigns.camp_name',
      'campaigns.camp_desc'
    )
    .first();
  return campaign;
}

function findUser(id) {
  return db('users')
    .where({ id })
    .first()
}

async function findCampByUserId(users_id) {
  const campaigns = await db('campaigns')
    .where({ users_id: users_id })
    .join('users', 'users.id', 'campaigns.users_id')
    .select(
      'users.username',
      'users.profile_image',
      'users.location',
      'campaigns.*'
    );
  const withUpdates = campaigns.map(async camp => {
    camp.updates = await CampUpdate.findUpdatesByCamp(camp.camp_id);
    return camp;
  });
  const result = await Promise.all(withUpdates);
  return result;
}

async function insert(campaign) {
  const [camp_id] = await db('campaigns')
    .insert(campaign)
    .returning('camp_id');
  if (camp_id) {
    const camp = await findById(camp_id);
    return camp;
  }
}

async function update(campaign, camp_id) {
  const editedCamp = await db('campaigns')
    .where({ camp_id })
    .update(campaign);
  if (editedCamp) {
    const camp = await findById(camp_id);
    return camp;
  }
}

async function remove(camp_id) {
  const deleted = await db('campaigns')
    .where({ camp_id })
    .del();
  if (deleted) {
    return camp_id;
  } else {
    return 0;
  }
}
