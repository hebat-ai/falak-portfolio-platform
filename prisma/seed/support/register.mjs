// Registered via `node --import ./prisma/seed/support/register.mjs <script>`.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(pathToFileURL("./prisma/seed/support/ts-extension-loader.mjs").href, pathToFileURL("./").href);
