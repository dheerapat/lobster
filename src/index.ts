import { Kernel } from "./kernel/kernel.js";

const kernel = new Kernel();
kernel.bootstrap();

process.on("SIGINT", () => kernel.shutdown());
process.on("SIGTERM", () => kernel.shutdown());
