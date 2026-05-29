import { describe, it, expect } from "vitest";
import { FEATURE_FLAGS, getDefaultFlags } from "@/lib/feature-flags";

describe("feature-flags", () => {
  it("FEATURE_FLAGS contains all expected flag definitions", () => {
    const keys = Object.keys(FEATURE_FLAGS);
    expect(keys).toHaveLength(20);
    expect(FEATURE_FLAGS.premium_tts).toBeDefined();
    expect(FEATURE_FLAGS.ai_content_moderation).toBeDefined();
    expect(FEATURE_FLAGS.neo4j_graph_queries).toBeDefined();
  });

  it("FEATURE_FLAGS has correct category assignments", () => {
    const coreFlags = Object.values(FEATURE_FLAGS).filter((f) => f.category === "core");
    const aiFlags = Object.values(FEATURE_FLAGS).filter((f) => f.category === "ai");
    const neo4jFlags = Object.values(FEATURE_FLAGS).filter((f) => f.category === "neo4j");

    expect(coreFlags.length).toBeGreaterThan(0);
    expect(aiFlags.length).toBeGreaterThan(0);
    expect(neo4jFlags.length).toBeGreaterThan(0);
    expect(coreFlags.length + aiFlags.length + neo4jFlags.length).toBe(20);
  });

  it("FEATURE_FLAGS description matches id", () => {
    for (const [name, def] of Object.entries(FEATURE_FLAGS)) {
      expect(def.id).toBe(name);
      expect(typeof def.description).toBe("string");
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  it("FEATURE_FLAGS enabled is boolean for all flags", () => {
    for (const [, def] of Object.entries(FEATURE_FLAGS)) {
      expect(typeof def.enabled).toBe("boolean");
    }
  });

  it("getDefaultFlags returns all flags with correct enabled values", () => {
    const defaults = getDefaultFlags();
    const keys = Object.keys(defaults);

    expect(keys).toHaveLength(20);

    for (const key of keys) {
      expect(defaults[key]).toBe(FEATURE_FLAGS[key].enabled);
    }
  });

  it("getDefaultFlags returns a frozen snapshot independent of FEATURE_FLAGS", () => {
    const defaults1 = getDefaultFlags();
    const defaults2 = getDefaultFlags();

    expect(defaults1).toEqual(defaults2);
    expect(defaults1).not.toBe(defaults2);

    defaults1.custom_key = true;
    expect((defaults2 as Record<string, unknown>).custom_key).toBeUndefined();
  });

  it("getDefaultFlags has expected enabled core production flags", () => {
    const defaults = getDefaultFlags();
    expect(defaults.premium_tts).toBe(true);
    expect(defaults.beta_chat_rooms).toBe(true);
    expect(defaults.toy_viewer_3d).toBe(true);
    expect(defaults.ai_recommendations).toBe(true);
    expect(defaults.localized_discovery).toBe(true);
    expect(defaults.marketplace_video).toBe(true);
  });

  it("getDefaultFlags has AI features disabled by default", () => {
    const defaults = getDefaultFlags();
    expect(defaults.ai_content_moderation).toBe(false);
    expect(defaults.ai_translation_assist).toBe(false);
    expect(defaults.ai_post_composer).toBe(false);
    expect(defaults.ai_tag_suggestions).toBe(false);
    expect(defaults.ai_content_recommendations).toBe(false);
    expect(defaults.ai_people_discovery).toBe(false);
    expect(defaults.ai_media_caption).toBe(false);
    expect(defaults.ai_chat_assistant).toBe(false);
    expect(defaults.ai_onboarding_assistant).toBe(false);
    expect(defaults.ai_group_activity).toBe(false);
  });

  it("getDefaultFlags has Neo4j flags disabled by default", () => {
    const defaults = getDefaultFlags();
    expect(defaults.neo4j_graph_queries).toBe(false);
    expect(defaults.neo4j_community_detection).toBe(false);
    expect(defaults.neo4j_recommendations).toBe(false);
  });

  it("advanced_analytics is disabled by default", () => {
    expect(FEATURE_FLAGS.advanced_analytics.enabled).toBe(false);
  });
});
