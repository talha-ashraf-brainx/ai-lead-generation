import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";

export const EMAIL_QUEUE_NAME = "email-sends";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection: redisConnection });

export async function enqueueSendJob(campaignSendId: string, delayMs: number): Promise<void> {
  await emailQueue.add(
    "send",
    { campaignSendId },
    {
      delay: Math.max(0, delayMs),
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
