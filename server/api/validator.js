var Validator = module.exports = function(req, res) {
   this.req = req;
   this.res = res;
};

Validator.prototype.error = function(message) {
   this.res.status(400).json({
      message: message
   });
   throw 'ValidatorError: ' + message;
};

Validator.prototype.body = function() {
   if (!this.req.body) {
      this.error('Request body not provided');
   }
};

Validator.prototype.exists = function(property, name) {
   if (!property) {
      this.error(name + ' does not exist');
   }
};

Validator.prototype.string = function(property, name) {
   if (typeof(property) !== 'string') {
      this.error(name + ' is not a string');
   }
};

Validator.prototype.number = function(property, name) {
   if (isNaN(property)) {
      this.error(name + ' is not a number');
   }
};

Validator.prototype.object = function(property, name) {
   if (typeof(property) !== 'object') {
      this.error(name + ' is not an object');
   }
};

Validator.prototype.notExists = function(property, message) {
   if (!!property) {
      this.error(message);
   }
}