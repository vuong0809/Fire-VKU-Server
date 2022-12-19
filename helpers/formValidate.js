const Joi = require("@hapi/joi");

const modelConfigSchema = Joi.object({
  filename: Joi.string().required(),
  featureHeader: Joi.array().items(Joi.string().required()),
  outputHeader: Joi.string().required(),
  outputCount: Joi.number().required()
});

module.exports.modelConfigValidation = modelConfigSchema;
