const knex = require('../../knex/knex');

async function createEvent(req) {
  const ret = await knex('events').insert(req).returning('*');
  return !ret ? null : ret[0];
}

async function getEventByID(id) {
  return knex('events')
    .select('*')
    .where({ id })
    .andWhere('is_deleted', false)
    .first();
}

/**
 * Retrieves a paginated list of events of an application based on the specified parameters.
 *
 * @param {Object} options - Options for querying applications.
 * @param {string} [options.application] - The application ID [Required].
 * @param {string} [options.like=''] - Search for event with names similar to the specified string.
 * @param {string} [options.sortBy='name'] - The field by which to sort the result. ['name','created_at','modified_at','is_active'].
 * @param {number} [options.sortOrder=1] - The sort order: 1 for ascending, -1 for descending.
 * @param {number} [options.pageNumber=1] - The current page number for pagination. If 0, returns all results.
 * @param {number} [options.pageSize=3] - The number of results to retrieve per page.
 * @param {boolean} [options.isActive=true] - Retrieve result based on is_active flag.
 * @returns {Promise<Array>} A promise that resolves with an array of resultant documents.
 *
 * @example
 * const options = {
 *   application: 'app id', // Application ID
 *   like: 'example',       // Search for events with names similar to 'example'
 *   sortBy: 'name',        // Sort events by name
 *   sortOrder: -1,         // Sort in descending order
 *   pageNumber: 2,         // Retrieve the second page of results
 *   pageSize: 10           // Display 10 events per page
 *   isActive: true         // Get only active events
 * };
 * try {
 *   const events = await getEvents(options);
 *   console.log(events); // Array of event documents
 * } catch (error) {
 *   console.error("Error:", error);
 * }
 */
async function getEvents({
  application,
  like = '',
  sortBy = 'name',
  sortOrder = 1,
  pageNumber = 0,
  pageSize = 3,
  isActive = true,
}) {
  pageNumber = Number(pageNumber);
  pageSize = Number(pageSize);
  sortOrder = Number(sortOrder);

  const totalEventsQuery = knex('events')
    .count('id as totalEvents')
    .where('is_deleted', false)
    .andWhere('is_active', isActive)
    .andWhere('application', application)
    .first();

  // Filter by name using regex (matches anywhere in the name)
  if (like) {
    totalEventsQuery.andWhere('name', '~*', `.*${like}.*`); // Case-insensitive regex search
  }

  const res = await totalEventsQuery;
  const totalEvents = Number(res.totalEvents);
  const sortDirection = sortOrder === -1 ? 'desc' : 'asc';

  const query = knex('events')
    .select('*')
    .where('is_deleted', false)
    .andWhere('is_active', isActive)
    .andWhere('application', application)
    .orderBy(sortBy, sortDirection)
    .returning('*');

  if (like) {
    query.andWhere('name', '~*', `.*${like}.*`); // Case-insensitive regex search
  }

  if (pageNumber <= 0 || totalEvents <= 0) {
    return {
      current_page: 1,
      last_page: 1,
      total_events: totalEvents,
      events: await query,
    };
  }

  // if pageSize is less than 1, set it to 1
  const ps = pageSize < 1 ? 1 : pageSize;
  const lastPage = Math.ceil(totalEvents / ps);

  // if pageNumber is greater than lastPage, set it to lastPage
  pageNumber = pageNumber > lastPage ? lastPage : pageNumber; // eslint-disable-line

  const skipCount = (pageNumber - 1) * ps;

  return {
    current_page: pageNumber,
    last_page: lastPage,
    total_events: totalEvents,
    events: await query.limit(ps).offset(skipCount),
  };
}

async function updateEvent(id, req) {
  const ret = await knex('events').update(req).where({ id }).returning('*');
  return !ret ? null : ret[0];
}

async function deleteEvent(id) {
  return updateEvent(id, { is_active: false, is_deleted: true });
}

async function deleteEvents(ids) {
  return knex('events')
    .update({ is_active: false, is_deleted: true })
    .whereIn('id', ids)
    .returning('*');
}

module.exports = {
  createEvent,
  getEventByID,
  getEvents,
  updateEvent,
  deleteEvent,
  deleteEvents,
};
