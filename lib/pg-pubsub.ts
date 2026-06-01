// PG-based Pub/Sub using Supabase Realtime (Postgres Changes)
// Alternative to Redis pub/sub for real-time notifications

type PgPubSubCallback = (payload: unknown) => void;

type PgChannel = {
  unsubscribe: () => void;
};

let _client: any | null = null;

async function getClient() {
  if (!_client) {
    const { createClient } = await import("@/lib/supabase/server");
    _client = await createClient();
  }
  return _client;
}

function buildPgChannel(
  channelName: string,
  event: string,
  callback: PgPubSubCallback
): PgChannel {
  let unsubscribed = false;

  getClient().then((supabase) => {
    if (unsubscribed) return;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event }, (payload: any) => {
        callback(payload);
      })
      .subscribe((status: string) => {
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          unsubscribed = true;
        }
      });

    return channel;
  });

  return {
    unsubscribe() {
      unsubscribed = true;
      getClient().then((supabase: any) => {
        supabase.removeChannel(supabase.channel(channelName));
      });
    },
  };
}

export async function pgPublish(
  channel: string,
  event: string,
  payload: unknown
): Promise<void> {
  try {
    const supabase = await getClient();
    await supabase.channel(channel).send({
      type: "broadcast",
      event,
      payload: payload as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[pg-pubsub] publish error:", err);
  }
}

export async function pgSubscribe(
  channel: string,
  event: string,
  callback: PgPubSubCallback
): Promise<PgChannel> {
  return buildPgChannel(channel, event, callback);
}
