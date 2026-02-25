import { enqueuePendingRecipesForCuration } from "./curatorAI";

export const handleScheduled: ExportedHandlerScheduledHandler<Env> = async (
  _controller,
  env,
) => {
  try {
    const result = await enqueuePendingRecipesForCuration(env);
    console.log(`[curatorAI] Daily enqueue complete: queued=${result.queued}`);
  } catch (error) {
    console.error("[curatorAI] Daily enqueue failed", error);
    throw error;
  }
};
