var Query = require('decypher').Query;

module.exports = {}

/**
 * Returns a query that updates the given file node with an absolute fuckpile of text
 * in an indexed property.
 */
module.exports.mergeMetaNode = function(name, checksum) {
  var query = new Query();
  query.merge("(f:Meta {Type: 'topicmodel', SHA256: $checksum, Name: $botname})", {checksum, botname: name})
  query.add("ON CREATE SET f.Uuid = apoc.create.uuid()")
  query.return("f.SHA256 as checksum")
  return query;
}

module.exports.checkMetaNode = function(name, checksum) {
  var query = new Query();
  query.match("(f:Meta {Type: 'topicmodel', SHA256: $checksum, Name: $botname})", {checksum, botname: name})
  query.return("f.SHA256 as checksum")
  return query;
}

module.exports.mergeTopic = function(name, code, checksum) {
  var query = new Query();
  query.merge("(t:Topic:Facet {Code: $code, Name: $name, ModelSHA256: $checksum})", {name, code, checksum})
  query.add("ON CREATE SET t.Uuid = apoc.create.uuid()")
  query.return("t.Uuid as uuid")
  return query;
}

module.exports.mergeWord = function(word, topicCode, tmChecksum, weight) {
  var query = new Query();
  query.match("(t:Topic:Facet {Code: $topicCode, ModelSHA256: $tmChecksum})", {topicCode, tmChecksum})
  query.merge("(w:Word:Facet {Name: $word})", {word, weight})
  query.merge("(w)<-[:HAS_FACET {weight: $weight}]-(t)", {word, weight})
  query.add("ON CREATE SET w.Uuid = apoc.create.uuid()")
  query.return("w.Uuid as uuid")
  return query;
}