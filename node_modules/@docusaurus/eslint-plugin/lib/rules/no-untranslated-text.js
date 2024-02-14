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
    name: 'no-untranslated-text',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'enforce text labels in JSX to be wrapped by translate calls',
            recommended: false,
        },
        schema: [
            {
                type: 'object',
                properties: {
                    ignoredStrings: {
                        type: 'array',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            translateChildren: 'All text labels in JSX should be wrapped by translate calls',
        },
    },
    defaultOptions: [
        {
            ignoredStrings: [],
        },
    ],
    create(context, [options]) {
        const { ignoredStrings } = options;
        return {
            JSXElement(node) {
                if (node.openingElement.selfClosing ||
                    node.openingElement.name.name ===
                        'Translate') {
                    return;
                }
                if (node.children.some((child) => (0, util_1.isTextLabelChild)(child, { ignoredStrings }))) {
                    context.report({ node, messageId: 'translateChildren' });
                }
            },
            JSXFragment(node) {
                if (node.children.some((child) => (0, util_1.isTextLabelChild)(child, { ignoredStrings }))) {
                    context.report({ node, messageId: 'translateChildren' });
                }
            },
        };
    },
});
