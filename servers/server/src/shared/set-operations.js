function checkSet(param) {
  return param instanceof Set;
}

function checkSets(...params) {
  return !params.map(checkSet).includes(false);
}

function applyIfSets(left, right, operation, errorMessage = 'Operation') {
  if (checkSets(left, right)) {
    return operation(left, right);
  } else {
    throw new TypeError(`${errorMessage} only operates on sets`);
  }
}

function union(left, right) {
  return applyIfSets(left, right, (a, b) => new Set([...a, ...b]), 'Union');
}

function intersection(left, right) {
  return applyIfSets(
    left,
    right,
    (a, b) => new Set([...a].filter((x) => b.has(x))),
    'Intersection'
  );
}

function without(left, right) {
  return applyIfSets(
    left,
    right,
    (a, b) => new Set([...a].filter((x) => !b.has(x))),
    'Without'
  );
}

function isSubsetOf(left, right) {
  return applyIfSets(
    left,
    right,
    (a, b) => without(a, b).size == 0,
    'Is Subset Of'
  );
}

function isSupersetOf(left, right) {
  return applyIfSets(
    left,
    right,
    (a, b) => without(b, a).size == 0,
    'Is Superset Of'
  );
}

function isDisjoint(left, right) {
  return applyIfSets(
    left,
    right,
    (a, b) => intersection(a, b).size == 0,
    'Is Disjoint'
  );
}

function map(set, mappingFunction) {
  if (checkSet(set)) {
    return new Set([...set].map(mappingFunction));
  } else {
    throw new TypeError(`Map only operates on sets`);
  }
}

function filter(set, predicate) {
  if (checkSet(set)) {
    return new Set([...set].filter(predicate));
  } else {
    throw new TypeError(`Filter only operates on sets`);
  }
}

// TODO: RE - in the future we can add the other utility functions that are part of 'Array' for 'Set' (for example `some` and `any`)

/*
 * Yes, I know we shouldn't tamper with the prototypes, but surely it is ok
 * when we write our own polyfill for features not yet in the standards.
 */

function polyfill() {
  let polyfilled = false;
  return () => {
    if (!polyfilled) {
      polyfilled = true;
      if (!Set.prototype.union) {
        Set.prototype.union = function (that) {
          return union(this, that);
        };
      }
      if (!Set.prototype.intersection) {
        Set.prototype.intersection = function (that) {
          return intersection(this, that);
        };
      }
      if (!Set.prototype.without) {
        Set.prototype.without = function (that) {
          return without(this, that);
        };
      }
      if (!Set.prototype.isSubsetOf) {
        Set.prototype.isSubsetOf = function (that) {
          return isSubsetOf(this, that);
        };
      }
      if (!Set.prototype.isSupersetOf) {
        Set.prototype.isSupersetOf = function (that) {
          return isSupersetOf(this, that);
        };
      }
      if (!Set.prototype.isDisjoint) {
        Set.prototype.isDisjoint = function (that) {
          return isDisjoint(this, that);
        };
      }
      if (!Set.prototype.map) {
        Set.prototype.map = function (mappingFunction) {
          return map(this, mappingFunction);
        };
      }
      if (!Set.prototype.filter) {
        Set.prototype.filter = function (predicate) {
          return filter(this, predicate);
        };
      }
    }
  };
}
const polyfillClosure = polyfill();
module.exports = polyfillClosure;
module.exports = Object.assign(module.exports, {
  polyfill: polyfillClosure,
  union,
  intersection,
  without,
  isSubsetOf,
  isSupersetOf,
  isDisjoint,
  map,
});
