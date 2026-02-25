import { CurationQueueMessage, curateRecipeById } from "./curatorAI";

export const handleCurationQueue: ExportedHandlerQueueHandler<Env, CurationQueueMessage> =
  async (batch, env) => {
    let acked = 0;
    let retried = 0;

    for (const message of batch.messages) {
      const recipeId = Number(message.body?.recipeId);

      if (!Number.isInteger(recipeId) || recipeId <= 0) {
        console.warn("[curatorAI] Invalid queue message", message.body);
        message.ack();
        acked += 1;
        continue;
      }

      try {
        const result = await curateRecipeById(env, recipeId);
        if (!result.processed) {
          console.log(`[curatorAI] Skipped recipe ${recipeId}: ${result.reason}`);
        }
        message.ack();
        acked += 1;
      } catch (error) {
        console.error(`[curatorAI] Queue curation failed for recipe ${recipeId}`, error);
        message.retry();
        retried += 1;
      }
    }

    console.log(
      `[curatorAI] Queue batch complete: queue=${batch.queue}, total=${batch.messages.length}, acked=${acked}, retried=${retried}`,
    );
  };
