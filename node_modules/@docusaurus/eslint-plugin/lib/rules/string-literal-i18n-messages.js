"use strict";
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
exports.default = (0, util_1.createRule)({
    name: 'string-literal-i18n-messages',
    meta: {
        type: 'problem',
        docs: {
            description: 'enforce translate APIs to be called on plain text labels',
            recommended: 'error',
        },
        schema: [],
        messages: {
            translateChildren: '<Translate> children must be hardcoded strings. You can have in-string dynamic placeholders using the values prop.',
            translateArg: 'translation message must be a hardcoded string. You can have in-string dynamic placeholders using the values argument.',
        },
    },
    defaultOptions: [],
    create(context) {
        return {
            JSXElement(node) {
                if (node.openingElement.name.name !==
                    'Translate') {
                    return;
                }
                if (node.children.some((child) => !(0, util_1.isTextLabelChild)(child))) {
                    context.report({ node, messageId: 'translateChildren' });
                }
            },
            CallExpression(node) {
                if (node.callee.type !== 'Identifier' ||
                    node.callee.name !== 'translate') {
                    return;
                }
                const param = node.arguments[0];
                if (!param || param.type !== 'ObjectExpression') {
                    context.report({ node, messageId: 'translateArg' });
                    return;
                }
                const messageProperty = param.properties.find((property) => property.type === 'Property' &&
                    property.key.name === 'message');
                if (!messageProperty) {
                    return;
                }
                if (!(0, util_1.isStringWithoutExpressions)(messageProperty.value)) {
                    context.report({ node, messageId: 'translateArg' });
                }
            },
        };
    },
});
