const mongoose = require('mongoose');
const Joi = require('joi');
const { qpSchema } = require('../utils/params');
const { USE_MONGO_DB } = require('../globals');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
    unique: true,
  },
  description: {
    type: String,
    default: '',
    maxlength: 255,
  },
  is_active: {
    type: Boolean,
    default: false,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  modified_at: {
    type: Date,
    default: Date.now,
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },
});

const Event = mongoose.model('Event', eventSchema);

// the keys that will remain same for query, post and put
const data = (required) => ({
  application: USE_MONGO_DB
    ? Joi.objectId().required(required)
    : Joi.number().integer().positive().required(required),
});

function validateQP(req) {
  const _schema = qpSchema.keys({
    ...data(false),
  });

  return _schema.validate(req);
}

const schema = Joi.object({
  name: Joi.string().min(3).max(50),
  description: Joi.string().max(255),
  is_active: Joi.boolean(),
  is_deleted: Joi.boolean(),
  ...data(false),
});

function validatePost(req) {
  const _schema = schema.keys({
    name: Joi.string().min(3).max(50).required(),
    ...data(true),
  });

  return _schema.validate(req);
}

// used for patch/put req
function validate(req) {
  return schema.validate(req);
}

module.exports = {
  Event,
  validateQP,
  validatePost,
  validate,
};
