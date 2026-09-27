// Registered via `node --import ./tests/support/register.mjs --test ...`.
// Activates mock-loader.mjs for every module the test run imports,
// including modules dynamically imported later inside test files.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(pathToFileURL("./tests/support/mock-loader.mjs").href, pathToFileURL("./").href);
