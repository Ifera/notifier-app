const { Application } = require('../../models/application');

async function createApp(req) {
  const app = new Application(req);

  return app.save();
}

async function getAppByID(id) {
  return Application.findById(id);
}

/**
 * Retrieves a paginated list of applications based on the specified parameters.
 *
 * @param {Object} options - Options for querying applications.
 * @param {string} [options.like=''] - Search for applications with names similar to the specified string.
 * @param {string} [options.sortBy='name'] - The field by which to sort the applications.
 * @param {number} [options.sortOrder=1] - The sort order: 1 for ascending, -1 for descending.
 * @param {number} [options.pageNumber=1] - The current page number for pagination. If 0, returns all results.
 * @param {number} [options.pageSize=3] - The number of applications to retrieve per page.
 * @param {boolean} [options.isActive=true] - Retrieve applications based on is_active flag.
 * @returns {Promise<Array>} A promise that resolves with an array of application documents.
 *
 * @example
 * const options = {
 *   like: 'example',       // Search for apps with names similar to 'example'
 *   sortBy: 'name',        // Sort applications by name
 *   sortOrder: -1,         // Sort in descending order
 *   pageNumber: 2,         // Retrieve the second page of results
 *   pageSize: 10           // Display 10 applications per page
 *   isActive: true         // Get only active applications
 * };
 * try {
 *   const applications = await getApps(options);
 *   console.log(applications); // Array of application documents
 * } catch (error) {
 *   console.error("Error:", error);
 * }
 */
async function getApps({
  like = '',
  sortBy = 'name',
  sortOrder = 1,
  pageNumber = 0,
  pageSize = 3,
  isActive = true,
}) {
  /* eslint-disable no-param-reassign */
  pageNumber = Number(pageNumber);
  pageSize = Number(pageSize);
  sortOrder = Number(sortOrder);
  /* eslint-enable no-param-reassign */

  const sortDirection = sortOrder === -1 ? 'desc' : 'asc';
  const nameRegex = new RegExp(like, 'i'); // 'i' -> case-insensitive
  const findQuery = {
    is_active: isActive,
    is_deleted: false, // only return non-deleted apps
  };

  if (like) findQuery.name = nameRegex;

  const totalApps = await Application.countDocuments(findQuery);
  const query = Application.find(findQuery).sort({ [sortBy]: sortDirection });

  if (pageNumber <= 0) {
    return {
      current_page: 1,
      last_page: 1,
      total_apps: totalApps,
      apps: await query,
    };
  }

  // if pageSize is less than 1, set it to 1
  const ps = pageSize < 1 ? 1 : pageSize;
  const lastPage = Math.ceil(totalApps / ps);

  // if pageNumber is greater than lastPage, set it to lastPage
  pageNumber = pageNumber > lastPage ? lastPage : pageNumber; // eslint-disable-line

  const skipCount = (pageNumber - 1) * ps;

  return {
    current_page: pageNumber,
    last_page: lastPage,
    total_apps: totalApps,
    apps: await query.skip(skipCount).limit(ps),
  };
}

async function updateApp(id, obj) {
  const app = await getAppByID(id);
  if (!app) return false;

  Object.assign(app, obj);
  app.modified_at = Date.now();

  return app.save();
}

async function deleteApp(id) {
  return updateApp(id, { is_active: false, is_deleted: true });
}

module.exports = {
  createApp,
  getAppByID,
  getApps,
  updateApp,
  deleteApp,
};
