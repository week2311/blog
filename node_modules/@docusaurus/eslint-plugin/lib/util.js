"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = exports.isTextLabelChild = exports.isStringWithoutExpressions = void 0;
const utils_1 = require("@typescript-eslint/utils");
const isMadeOfIgnoredStrings = (text, ignoredStrings) => text
    .trim()
    .split(/\s+/)
    .every((string) => !string || ignoredStrings.includes(string));
const isValidTranslationLabel = (text, { ignoredStrings } = {}) => {
    if (!ignoredStrings) {
        return typeof text === 'string';
    }
    return (typeof text === 'string' && !isMadeOfIgnoredStrings(text, ignoredStrings));
};
function isStringWithoutExpressions(text, options) {
    switch (text.type) {
        case 'Literal':
            return isValidTranslationLabel(text.value, options);
        case 'TemplateLiteral':
            return (text.expressions.length === 0 &&
                isValidTranslationLabel(text.quasis[0].value.raw, options));
        default:
            return false;
    }
}
exports.isStringWithoutExpressions = isStringWithoutExpressions;
function isTextLabelChild(child, options) {
    switch (child.type) {
        case 'JSXText':
            return isValidTranslationLabel(child.value, options);
        case 'JSXExpressionContainer':
            return isStringWithoutExpressions(child.expression, options);
        default:
            return false;
    }
}
exports.isTextLabelChild = isTextLabelChild;
exports.createRule = utils_1.ESLintUtils.RuleCreator((name) => `https://docusaurus.io/docs/api/misc/@docusaurus/eslint-plugin/${name}`);
