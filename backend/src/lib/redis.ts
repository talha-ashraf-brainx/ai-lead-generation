import { Redis } from "ioredis";
import { env } from "./env.js";

// BullMQ's blocking connections require this — see https://docs.bullmq.io/guide/going-to-production#maxretriesperrequest
export const redisConnection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
