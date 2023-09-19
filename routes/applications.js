const express = require('express');
const _ = require('lodash');

const router = express.Router();

const {
  validateReq,
  validateQueryParams,
  validateBulkDelete,
} = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');

const { validateQP, validatePost, validate } = require('../models/application');
const { DB_TYPE } = require('../globals');
const { BadRequest, NotFound } = require('../utils/error');
const { trim } = require('../utils');

const {
  createApp,
  getAppByID,
  getApps,
  updateApp,
  deleteApp,
  deleteApps,
} = require(`../controllers/${DB_TYPE}/application`); // eslint-disable-line

const filteredProps = [
  'id',
  'name',
  'description',
  'is_active',
  'created_at',
  'modified_at',
];

router.get('/', validateQueryParams(validateQP), async (req, res) => {
  const result = await getApps(req.query);
  result.results = _.map(result.results, _.partialRight(_.pick, filteredProps));

  res.send(result);
});

router.get('/:id', validateObjectId, async (req, res) => {
  const app = await getAppByID(req.params.id);

  if (!app) throw new NotFound('The app with the given ID was not found.');

  return res.send(_.pick(app, filteredProps));
});

router.post('/', validateReq(validatePost), async (req, res) => {
  const app = await createApp(trim(req.body));
  return res.send(_.pick(app, filteredProps));
});

router.delete('/', validateBulkDelete, async (req, res) => {
  const result = await deleteApps(req.body.ids);

  if (!result || result.length === 0) throw new NotFound('Nothing to delete.');

  return res.send('Success');
});

router.delete('/:id', validateObjectId, async (req, res) => {
  const result = await deleteApp(req.params.id);

  if (!result) throw new NotFound('The app with the given ID was not found.');

  return res.send('Success');
});

router.patch(
  '/:id',
  [validateObjectId, validateReq(validate)],
  async (req, res) => {
    if (Object.keys(req.body).length === 0)
      throw new BadRequest('The request body should not be empty');

    const app = await updateApp(req.params.id, trim(req.body));

    if (!app) throw new NotFound('The app with the given ID was not found.');

    return res.send(_.pick(app, filteredProps));
  },
);

module.exports = router;
