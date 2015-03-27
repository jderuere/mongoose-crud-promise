var mongoose = require('mongoose');
module.exports = function (schema, name, population) {
  var model = mongoose.model(name, schema);

  schema.statics.promise = {};
  population = population || [];

  var callback = function (error, result, resolve, reject) {
    if (error) reject({ code: 400, message: error });
    else if (result === undefined)  reject({ code: 404, message: name + ' not found.' });
    else resolve(result);
  };

  var queryFct = function (query, depth) {
    return new Promise(function (resolve, reject) {
      query.exec(function (error, result) {
        callback(error, result, resolve, reject);
      });
    }).then(function (documents) {
        return schema.statics.promise.populate(documents, depth);
      });
  };

  schema.statics.promise.query = function (query, depth) {
    return queryFct(query, depth);
  };

  /**
   *
   * @param criteria
   * @param {Number} [depth]
   * @param [select]
   */
  schema.statics.promise.find = function (criteria, depth, select) {
    var find = model.find(criteria, select);
    return queryFct(find, depth);
  };

  /**
   *
   * @param id
   * @param {Number} [depth]
   */
  schema.statics.promise.findById = function (id, depth) {
    var find = model.findById(id);
    return queryFct(find, depth);
  };

  schema.statics.promise.create = function (document) {
    return new Promise(function (resolve, reject) {
      model.create(document, function (error, result) {
        callback(error, result, resolve, reject);
      });
    });
  };

  schema.statics.promise.save = function (document) {
    return new Promise(function (resolve, reject) {
      document.save(function (error, result) {
        callback(error, result, resolve, reject);
      });
    });
  };

  /**
   * Update a json document
   * @param id
   * @param document - JSON document
   * @returns {Promise}
   */
  schema.statics.promise.update = function (id, document) {
    document._id = id;
    var modelDocument = model(document);
    modelDocument.isNew = false;
    return schema.statics.promise.save(modelDocument);
  };

  /**
   * Update models matching criteria
   * @param criteria
   * @param attributes - Attributes to update
   * @returns {Promise}
   */
  schema.statics.promise.updates = function (criteria, attributes) {
    return new Promise(function (resolve, reject) {
      model.update(criteria, attributes, function (error, result) {
        callback(error, result, resolve, reject);
      });
    });
  };

  schema.statics.promise.remove = function (criteria) {
    return new Promise(function (resolve, reject) {
      model.remove(criteria, function (error, result) {
        callback(error, result, resolve, reject);
      });
    });
  };

  /**
   * Objects to populate
   * @param documents
   * @param {Number} [depth]
   * @returns {Promise}
   */
  schema.statics.promise.populate = function (documents, depth) {
    return population.reduce(function (previous, population, index) {
      return previous.then(function (documents) {
        return (depth === undefined || depth > index) ? new Promise(function (resolve, reject) {
          model.populate(documents, population, function (error, result) {
            callback(error, result, resolve, reject);
          });
        }) : documents;
      });
    }, Promise.resolve(documents));
  };

  /**
   * Objects to populate
   * @param documents
   * @param population
   * @returns {Promise}
   */
  schema.statics.promise.populateWith = function (documents, population) {
    return new Promise(function (resolve, reject) {
      model.populate(documents, population, function (error, result) {
        callback(error, result, resolve, reject);
      });
    })
  };
};

