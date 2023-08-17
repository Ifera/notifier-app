const express = require('express');
const _ = require('lodash');

const router = express.Router();

const { validateReq, validateQueryParams } = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { validateQP, validatePost, validate } = require('../models/event');

const {
  createEvent,
  getEventByID,
  getEvents,
  updateEvent,
  deleteEvent,
} = require('../controllers/mongodb/event');

const filteredProps = [
  'id',
  'name',
  'description',
  'is_active',
  'created_at',
  'modified_at',
  'application',
];

router.get('/', validateQueryParams(validateQP), async (req, res) => {
  const result = await getEvents(req.query);
  result.events = _.map(result.events, _.partialRight(_.pick, filteredProps));

  res.send(result);
});

router.get('/:id', validateObjectId, async (req, res) => {
  const event = await getEventByID(req.params.id);

  if (!event)
    return res.status(404).send('The event with the given ID was not found.');

  return res.send(_.pick(event, filteredProps));
});

router.post('/', validateReq(validatePost), async (req, res) => {
  const event = await createEvent(req.body);
  res.send(_.pick(event, filteredProps));
});

router.delete('/:id', validateObjectId, async (req, res) => {
  const result = await deleteEvent(req.params.id);

  if (!result)
    return res.status(404).send('The event with the given ID was not found.');

  return res.send('Success');
});

router.patch(
  '/:id',
  [validateObjectId, validateReq(validate)],
  async (req, res) => {
    const event = await updateEvent(req.params.id, req.body);

    if (!event)
      return res.status(404).send('The event with the given ID was not found.');

    return res.send(_.pick(event, filteredProps));
  },
);

module.exports = router;
