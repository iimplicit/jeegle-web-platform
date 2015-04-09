/* Allow client query execution */
Meteor.neo4j.allowClientQuery = false;
/* Custom URL to Neo4j should be here */
Meteor.neo4j.connectionURL = "http://neo4j:[PASSWORD]@jeegle.io:7474";
/* But deny all writing actions on client */
Meteor.neo4j.set.allow(Meteor.neo4j.rules.write);