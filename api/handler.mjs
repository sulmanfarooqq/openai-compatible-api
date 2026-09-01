import worker from "../src/robust-worker.mjs";

export default worker.fetch;

export const config = {
  runtime: "edge",
};
