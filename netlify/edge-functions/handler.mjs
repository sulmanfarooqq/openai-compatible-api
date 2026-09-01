export const config = { path: "/edge/*" };

import worker from "../../src/robust-worker.mjs";

export default worker.fetch;
