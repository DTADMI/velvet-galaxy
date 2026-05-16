-- Neo4j graph model setup script
-- Run this in Neo4j Browser or via cypher-shell after creating the AuraDB instance

-- Constraints (ensures uniqueness and creates indexes)
CREATE CONSTRAINT profile_id IF NOT EXISTS FOR (p:Profile) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT group_id IF NOT EXISTS FOR (g:Group) REQUIRE g.id IS UNIQUE;
CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT artwork_id IF NOT EXISTS FOR (a:Artwork) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT post_id IF NOT EXISTS FOR (p:Post) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT tag_name IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE;

-- Indexes for performance
CREATE INDEX profile_username IF NOT EXISTS FOR (p:Profile) ON (p.username);
CREATE INDEX group_name IF NOT EXISTS FOR (g:Group) ON (g.name);
CREATE INDEX event_title IF NOT EXISTS FOR (e:Event) ON (e.title);
CREATE INDEX post_created IF NOT EXISTS FOR (p:Post) ON (p.created_at);

-- Graph projection for community detection (optional, requires GDS plugin)
-- CALL gds.graph.project(
--   'social-graph',
--   ['Profile'],
--   {
--     FOLLOWS: {orientation: 'UNDIRECTED'},
--     FRIENDS: {orientation: 'UNDIRECTED'},
--     HAS_RELATIONSHIP: {orientation: 'UNDIRECTED'}
--   }
-- );
