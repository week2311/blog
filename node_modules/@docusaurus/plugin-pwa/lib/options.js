"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptions = void 0;
const utils_validation_1 = require("@docusaurus/utils-validation");
const DEFAULT_OPTIONS = {
    debug: false,
    offlineModeActivationStrategies: [
        'appInstalled',
        'queryString',
        'standalone',
    ],
    injectManifestConfig: {},
    pwaHead: [],
    swCustom: undefined,
    swRegister: './registerSw.js',
};
const optionsSchema = utils_validation_1.Joi.object({
    debug: utils_validation_1.Joi.bool().default(DEFAULT_OPTIONS.debug),
    offlineModeActivationStrategies: utils_validation_1.Joi.array()
        .items(utils_validation_1.Joi.string()
        .valid('appInstalled', 'queryString', 'standalone', 'mobile', 'saveData', 'always')
        .required())
        .default(DEFAULT_OPTIONS.offlineModeActivationStrategies),
    injectManifestConfig: utils_validation_1.Joi.object().default(DEFAULT_OPTIONS.injectManifestConfig),
    pwaHead: utils_validation_1.Joi.array()
        .items(utils_validation_1.Joi.object({ tagName: utils_validation_1.Joi.string().required() }).unknown().required())
        .default(DEFAULT_OPTIONS.pwaHead),
    swCustom: utils_validation_1.Joi.string(),
    swRegister: utils_validation_1.Joi.alternatives()
        .try(utils_validation_1.Joi.string(), utils_validation_1.Joi.bool().valid(false))
        .default(DEFAULT_OPTIONS.swRegister),
    // @ts-expect-error: forbidden
    reloadPopup: utils_validation_1.Joi.any().forbidden().messages({
        'any.unknown': 'The reloadPopup option is removed in favor of swizzling. See https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-pwa#customizing-reload-popup for how to customize the reload popup using swizzling.',
    }),
});
function validateOptions({ validate, options, }) {
    return validate(optionsSchema, options);
}
exports.validateOptions = validateOptions;
