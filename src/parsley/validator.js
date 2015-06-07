define('parsley/validator', [
    'parsley/utils'
], function (ParsleyUtils) {

  // A Validator needs to implement the methods `validate` and `parseRequirements`

  var ParsleyValidator = function(spec) {
    $.extend(true, this, spec);
  };

  ParsleyValidator.prototype = {
    // Returns `true` iff the given `value` is valid according the given requirements.
    validate: function(value, requirementArg1, requirementArg2) {
      if(this.fn) { // Legacy style validator
        if(arguments.length > 2)
          requirementArg1 = [].slice.call(arguments, 1);
        return this.fn.call(this, value, requirementArg1);
      }

      if ($.isArray(value)) {
        if (!this.validateMultiple)
          throw 'Validator ' + this.name + ' does not handle multiple values';
        return this.validateMultiple.apply(this, arguments);
      } else {
        if (this.validateNumber) {
          if (isNaN(value))
            return false;
          value = parseFloat(value);
          return this.validateNumber.apply(this, arguments);
        }
        if (this.validateString) {
          return this.validateString.apply(this, arguments);
        }
        throw 'Validator ' + this.name + ' only handles multiple values';
      }
    },

    // Defaults:
    requirementType: 'string',

    priority: 2
  };

  return ParsleyValidator;
});
