
var Entity = function(properties) {
  this.id    = "entity" + Helpers.getUniqueID();
  properties = properties      || {};
  this.name  = properties.name || "entity";
  this.desc  = properties.desc || "an entity";
  this.initMixins(properties);
};

Entity.prototype.initMixins = function(properties) {
  this.mixins      = {};
  this.mixinGroups = {};
  if (properties.mixins) {
    for (var i=0; i<properties.mixins.length; i++) {
      this.addMixin(properties.mixins[i]);
    }
  }
};

Entity.prototype.addMixin = function(mixin) {
  for (var key in mixin) {
    if (key != 'name' && key != 'group' && !this.hasOwnProperty(key)) {
      this[key] = mixin[key];
    }
  }
  this.mixins[mixin.name]       = true;
  this.mixinGroups[mixin.group] = true;
  if (mixin.init) {
    mixin.call(this, properties);
  }
};

Entity.prototype.hasMixin = function(mixin) {
  if (typeof mixin === 'object') {
    return this.mixins[mixin.name] || this.mixinGroups[mixin.name];
  } else {
    return this.mixins[mixin] || this.mixinGroups[mixin];
  }
};

Entity.prototype.nameOne = function(shouldCapitalize) {
  var prefixes = shouldCapitalize ? ['A','An'] : ['a','an'];
  var first    = this.name.charAt(0).toLowerCase();
  var prefix   = 'aeiou'.indexOf(first)<0 ? prefixes[0] : prefixes[1];
  return prefix +" "+ this.name;
};

Entity.prototype.nameThe = function(shouldCapitalize) {
  var prefix = shouldCapitalize ? 'The' : 'the';
  return prefix +" "+ this.name;
};

Entity.prototype.capitalizeName = function() {
  var first = this.name.charAt(0).toUpperCase();
  var other = this.name.substring(1);
  return first + other;
};

Entity.prototype.wrapDesc = function(charsWide) {
  return Helpers.wrap(this.desc, charsWide, '<br>', false);
};

Entity.prototype.getPopupHTML = function(charsWide) {
  charsWide = charsWide || 50;
  var html = '<table>';
  html += '<tr><td class="popupName">'+ this.capitalizeName() + '</td></tr>';
  html += '<tr><td class="popupDesc">'+ this.wrapDesc(charsWide) +'</td></tr>';
  html += '</table>';
  return html;
};

Entity.prototype.onRespectOffered = function(fromEntity) {
  var msg = this.nameThe() + " smiles at you";
  Screens.print(msg, true);
};

Entity.prototype.onLookedAt = function(fromEntity) {
  var msg = this.nameThe() + " looks back at you and smiles";
  Screens.print(msg, true);
};
