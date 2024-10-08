import lunr from "/root/blog/node_modules/lunr/lunr.js";
require("/root/blog/node_modules/lunr-languages/lunr.stemmer.support.js")(lunr);
require("@easyops-cn/docusaurus-search-local/dist/client/shared/lunrLanguageZh").lunrLanguageZh(lunr);
require("/root/blog/node_modules/lunr-languages/lunr.multi.js")(lunr);
export const language = ["en","zh"];
export const removeDefaultStopWordFilter = false;
export const removeDefaultStemmer = false;
export const Mark = null;
export const searchIndexUrl = "search-index{dir}.json?_=e0548741";
export const searchResultLimits = 8;
export const searchResultContextMaxLength = 50;
export const explicitSearchResultPath = false;
export const searchBarShortcut = true;
export const searchBarShortcutHint = true;
export const searchBarPosition = "right";
export const docsPluginIdForPreferredVersion = undefined;
export const indexDocs = true;
export const searchContextByPaths = null;
export const hideSearchBarWithNoSearchContext = false;
export const useAllContextsWithNoSearchContext = false;