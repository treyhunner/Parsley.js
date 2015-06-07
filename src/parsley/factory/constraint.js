define('parsley/factory/constraint', [
  'parsley/utils',
  'parsley/validator',
], function (ParsleyUtils, ParsleyValidator) {
  var requirementConverters = {
    string: function(string) {
      return string;
    },
    integer: function(string) {
      if (isNaN(string))
        throw 'Requirement is not an integer: "' + string + '"';
      return parseInt(string, 10);
    },
    number: function(string) {
      if (isNaN(string))
        throw 'Requirement is not a number: "' + string + '"';
      return parseFloat(string);
    },
    reference: function(string) { // Unused for now
      var result = $(string);
      if (result.length === 0)
        throw 'No such reference: "' + string + '"';
      return result;
    },
    regexp: function(regexp) {
      var flags = '';

      // Test if RegExp is literal, if not, nothing to be done, otherwise, we need to isolate flags and pattern
      if (!!(/^\/.*\/(?:[gimy]*)$/.test(regexp))) {
        // Replace the regexp literal string with the first match group: ([gimy]*)
        // If no flag is present, this will be a blank string
        flags = regexp.replace(/.*\/([gimy]*)$/, '$1');
        // Again, replace the regexp literal string with the first match group:
        // everything excluding the opening and closing slashes and the flags
        regexp = regexp.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
      }
      return new RegExp(regexp, flags);
    }
  };

  var convertArrayRequirement = function(string, length) {
    var m = string.match(/^\s*\[(.*)\]\s*$/)
    if (!m)
      throw 'Requirement is not an array: "' + string + '"';
    var values = m[1].split(',').map(ParsleyUtils.trimString);
    if (values.length !== length)
      throw 'Requirement has ' + values.length + ' values when ' + length + ' are needed';
    return values;
  };

  var convertRequirement = function(requirementType, string) {
    var converter = requirementConverters[requirementType || 'string'];
    if (!converter)
      throw 'Unknown requirement specification: "' + requirementType + '"';
    return converter(string);
  };

  var convertExtraOptionRequirement = function(requirementSpec, string, extraOptionReader) {
    var main = null, extra = {};
    for(var key in requirementSpec) {
      if (key) {
        var value = extraOptionReader(key);
        if('string' === typeof value)
          value = convertRequirement(requirementSpec[key], value);
        extra[key] = value;
      } else {
        main = convertRequirement(requirementSpec[key], string)
      }
    }
    return [main, extra];
  };


    // A utility function to call parseRequirements and validate at once
    parseAndValidate: function(value, requirements, extraOptionReader) {
      var args = this.parseRequirements(requirements, extraOptionReader);
      args.unshift(value);
      return this.validate.apply(this, args);
    },

    // Parses `requirements` into an array of arguments,
    // according to `this.requirementType`
    parseRequirements: function(requirements, extraOptionReader) {
      if ('string' !== typeof requirements) {
        // Assume requirement already parsed
        // but make sure we return an array
        return $.isArray(requirements) ? requirements : [requirements];
      }
      var type = this.requirementType;
      if ($.isArray(type)) {
        var values = convertArrayRequirement(requirements, type.length);
        for (var i = 0; i < values.length; i++)
          values[i] = convertRequirement(type[i], values[i]);
        return values;
      } else if ($.isPlainObject(type)) {
        return convertExtraOptionRequirement(type, requirements, extraOptionReader)
      } else {
        return [convertRequirement(type, requirements)];
      }
    },

  var ConstraintFactory = function (parsleyField, name, requirements, priority, isDomConstraint) {
    if (!new RegExp('ParsleyField').test(parsleyField.__class__))
      throw new Error('ParsleyField or ParsleyFieldMultiple instance expected');

    var validatorSpec = window.ParsleyValidator.validators[name];
    var validator = new ParsleyValidator(validatorSpec);

    $.extend(this, {
      validator: validator,
      name: name,
      requirements: requirements,
      priority: priority || parsleyField.options[name + 'Priority'] || validator.priority,
      isDomConstraint: true === isDomConstraint
    });
    this.parseRequirements(parsleyField.options);
  };

  ConstraintFactory.prototype = {
    validate: function(value) {
      this.validator.validate.apply(this.validator, value, this.requirements);
    }
  };
  return ConstraintFactory;
});
