const { Event } = require('../../models/event');
const { NotificationType } = require('../../models/notificationtype');
const { getAppByID } = require('./application');
const { ValidationError } = require('../../utils/error');

async function createEvent(req) {
  if (!req.application)
    throw new ValidationError('"application" (application ID) is required');

  const app = await getAppByID(req.application);
  if (!app)
    throw new ValidationError(
      'The application with the given ID was not found.',
    );

  const event = new Event(req);

  return event.save();
}

async function getEventByID(id) {
  return Event.findOne({ _id: id, is_deleted: false });
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
  if (!application)
    throw new Error('"application" (application ID) is required');

  pageNumber = Number(pageNumber);
  pageSize = Number(pageSize);
  sortOrder = Number(sortOrder);

  const sortDirection = sortOrder === -1 ? 'desc' : 'asc';
  const nameRegex = new RegExp(like, 'i'); // 'i' -> case-insensitive
  const findQuery = {
    application,
    is_active: isActive,
    is_deleted: false, // only return non-deleted apps
  };

  if (like) findQuery.name = nameRegex;

  const totalEvents = await Event.countDocuments(findQuery);
  const query = Event.find(findQuery).sort({ [sortBy]: sortDirection });

  if (pageNumber <= 0) {
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
    events: await query.skip(skipCount).limit(ps),
  };
}

async function updateEvent(id, obj) {
  const event = await getEventByID(id);
  if (!event) return false;

  Object.assign(event, obj);
  event.modified_at = Date.now();

  return event.save();
}

async function deleteEvent(id) {
  const event = updateEvent(id, { is_active: false, is_deleted: true });
  if (!event) return false;

  await NotificationType.updateMany(
    { event: id },
    { $set: { is_active: false, is_deleted: true } },
  );

  return event;
}

async function deleteEventsByAppID(id) {
  return Event.updateMany(
    { application: id },
    { is_active: false, is_deleted: true },
  );
}

async function isEventActive(id) {
  const res = await getEventByID(id);

  return !res ? false : res.is_active && !res.is_deleted;
}

module.exports = {
  createEvent,
  getEventByID,
  getEvents,
  updateEvent,
  deleteEvent,
  isEventActive,
};
