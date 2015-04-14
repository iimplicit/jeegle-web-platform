/* Allow client query execution */
Meteor.neo4j.allowClientQuery = false;
/* Custom URL to Neo4j should be here */
// Meteor.neo4j.connectionURL = "http://neo4j:xpgpfks!@@128.199.76.251:7474";
Meteor.neo4j.connectionURL = "http://neo4j:xpgpfks!@@128.199.249.209/:7474";
/* But deny all writing actions on client */
Meteor.neo4j.set.allow(Meteor.neo4j.rules.write);
