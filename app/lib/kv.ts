import { IS_TEST } from "@/constants/index.ts";

type KvFeatureKey = readonly Deno.KvKeyPart[];

export type KvFeatureEntry<T> = {
  key: KvFeatureKey;
  value: T | null;
  versionstamp: string | null;
};

export type KvAtomicAction =
  | {
    type: "check";
    key: KvFeatureKey;
    versionstamp: string | null;
  }
  | {
    type: "set";
    key: KvFeatureKey;
    value: unknown;
    expireIn?: number;
  }
  | {
    type: "delete";
    key: KvFeatureKey;
  };

type KvListOptions = {
  limit?: number;
  reverse?: boolean;
};

const kv = await Deno.openKv(
  IS_TEST ? ":memory:" : undefined,
);

export const atomic = {
  check(
    key: KvFeatureKey,
    versionstamp: string | null,
  ): KvAtomicAction {
    return { type: "check", key, versionstamp };
  },
  set(
    key: KvFeatureKey,
    value: unknown,
    options: { expireIn?: number } = {},
  ): KvAtomicAction {
    return { type: "set", key, value, ...options };
  },
  delete(key: KvFeatureKey): KvAtomicAction {
    return { type: "delete", key };
  },
} as const;

/** Creates a KV boundary whose keys cannot escape the supplied feature prefix. */
export function createKvFeature(prefix: Deno.KvKeyPart) {
  const toKey = (key: KvFeatureKey): Deno.KvKey => [prefix, ...key];

  return {
    async get<T>(key: KvFeatureKey): Promise<KvFeatureEntry<T>> {
      const entry = await kv.get<T>(toKey(key));
      return {
        key,
        value: entry.value,
        versionstamp: entry.versionstamp,
      };
    },

    async list<T>(
      keyPrefix: KvFeatureKey,
      options: KvListOptions = {},
    ): Promise<KvFeatureEntry<T>[]> {
      const entries: KvFeatureEntry<T>[] = [];
      const iterator = kv.list<T>(
        { prefix: toKey(keyPrefix) },
        { limit: options.limit, reverse: options.reverse },
      );

      for await (const entry of iterator) {
        entries.push({
          key: entry.key.slice(1),
          value: entry.value,
          versionstamp: entry.versionstamp,
        });
      }

      return entries;
    },

    async commit(actions: readonly KvAtomicAction[]) {
      let operation = kv.atomic();

      for (const action of actions) {
        const key = toKey(action.key);
        switch (action.type) {
          case "check":
            operation = operation.check({
              key,
              versionstamp: action.versionstamp,
            });
            break;
          case "set":
            operation = operation.set(key, action.value, {
              expireIn: action.expireIn,
            });
            break;
          case "delete":
            operation = operation.delete(key);
            break;
        }
      }

      return await operation.commit();
    },
  };
}
