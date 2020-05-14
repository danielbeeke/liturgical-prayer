var umap = (function (_) {
  return {
    // About: get: _.get.bind(_)
    // It looks like WebKit/Safari didn't optimize bind at all,
    // so that using bind slows it down by 60%.
    // Firefox and Chrome are just fine in both cases,
    // so let's use the approach that works fast everywhere 👍
    get: function get(key) {
      return _.get(key);
    },
    set: function set(key, value) {
      return _.set(key, value), value;
    }
  };
});

var attr = /([^\s\\>"'=]+)\s*=\s*(['"]?)$/;
var empty = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
var node = /<[a-z][^>]+$/i;
var notNode = />[^<>]*$/;
var selfClosing = /<([a-z]+[a-z0-9:._-]*)([^>]*?)(\/>)/ig;
var trimEnd = /\s+$/;

var isNode = function isNode(template, i) {
  return 0 < i-- && (node.test(template[i]) || !notNode.test(template[i]) && isNode(template, i));
};

var regular = function regular(original, name, extra) {
  return empty.test(name) ? original : "<".concat(name).concat(extra.replace(trimEnd, ''), "></").concat(name, ">");
};

var instrument = (function (template, prefix, svg) {
  var text = [];
  var length = template.length;

  var _loop = function _loop(i) {
    var chunk = template[i - 1];
    text.push(attr.test(chunk) && isNode(template, i) ? chunk.replace(attr, function (_, $1, $2) {
      return "".concat(prefix).concat(i - 1, "=").concat($2 || '"').concat($1).concat($2 ? '' : '"');
    }) : "".concat(chunk, "<!--").concat(prefix).concat(i - 1, "-->"));
  };

  for (var i = 1; i < length; i++) {
    _loop(i);
  }

  text.push(template[length - 1]);
  var output = text.join('').trim();
  return svg ? output : output.replace(selfClosing, regular);
});

var isArray = Array.isArray;
var _ref = [],
  indexOf = _ref.indexOf,
  slice = _ref.slice;

var ELEMENT_NODE = 1;
var nodeType = 111;

var remove = function remove(_ref) {
  var firstChild = _ref.firstChild,
    lastChild = _ref.lastChild;
  var range = document.createRange();
  range.setStartAfter(firstChild);
  range.setEndAfter(lastChild);
  range.deleteContents();
  return firstChild;
};

var diffable = function diffable(node, operation) {
  return node.nodeType === nodeType ? 1 / operation < 0 ? operation ? remove(node) : node.lastChild : operation ? node.valueOf() : node.firstChild : node;
};
var persistent = function persistent(fragment) {
  var childNodes = fragment.childNodes;
  var length = childNodes.length; // If the fragment has no content
  // it should return undefined and break

  if (length < 2) return childNodes[0];
  var nodes = slice.call(childNodes, 0);
  var firstChild = nodes[0];
  var lastChild = nodes[length - 1];
  return {
    ELEMENT_NODE: ELEMENT_NODE,
    nodeType: nodeType,
    firstChild: firstChild,
    lastChild: lastChild,
    valueOf: function valueOf() {
      if (childNodes.length !== length) {
        var i = 0;

        while (i < length) {
          fragment.appendChild(nodes[i++]);
        }
      }

      return fragment;
    }
  };
};



/**
 * ISC License
 *
 * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * @param {Node} parentNode The container where children live
 * @param {Node[]} a The list of current/live children
 * @param {Node[]} b The list of future children
 * @param {(entry: Node, action: number) => Node} get
 * The callback invoked per each entry related DOM operation.
 * @param {Node} [before] The optional node used as anchor to insert before.
 * @returns {Node[]} The same list of future children.
 */
var udomdiff = (function (parentNode, a, b, get, before) {
  var bLength = b.length;
  var aEnd = a.length;
  var bEnd = bLength;
  var aStart = 0;
  var bStart = 0;
  var map = null;

  while (aStart < aEnd || bStart < bEnd) {
    // append head, tail, or nodes in between: fast path
    if (aEnd === aStart) {
      // we could be in a situation where the rest of nodes that
      // need to be added are not at the end, and in such case
      // the node to `insertBefore`, if the index is more than 0
      // must be retrieved, otherwise it's gonna be the first item.
      var node = bEnd < bLength ? bStart ? get(b[bStart - 1], -0).nextSibling : get(b[bEnd - bStart], 0) : before;

      while (bStart < bEnd) {
        parentNode.insertBefore(get(b[bStart++], 1), node);
      }
    } // remove head or tail: fast path
    else if (bEnd === bStart) {
      while (aStart < aEnd) {
        // remove the node only if it's unknown or not live
        if (!map || !map.has(a[aStart])) parentNode.removeChild(get(a[aStart], -1));
        aStart++;
      }
    } // same node: fast path
    else if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
    } // same tail: fast path
    else if (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    } // The once here single last swap "fast path" has been removed in v1.1.0
      // https://github.com/WebReflection/udomdiff/blob/single-final-swap/esm/index.js#L69-L85
    // reverse swap: also fast path
    else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      // this is a "shrink" operation that could happen in these cases:
      // [1, 2, 3, 4, 5]
      // [1, 4, 3, 2, 5]
      // or asymmetric too
      // [1, 2, 3, 4, 5]
      // [1, 2, 3, 5, 6, 4]
      var _node = get(a[--aEnd], -1).nextSibling;
      parentNode.insertBefore(get(b[bStart++], 1), get(a[aStart++], -1).nextSibling);
      parentNode.insertBefore(get(b[--bEnd], 1), _node); // mark the future index as identical (yeah, it's dirty, but cheap 👍)
      // The main reason to do this, is that when a[aEnd] will be reached,
      // the loop will likely be on the fast path, as identical to b[bEnd].
      // In the best case scenario, the next loop will skip the tail,
      // but in the worst one, this node will be considered as already
      // processed, bailing out pretty quickly from the map index check

      a[aEnd] = b[bEnd];
    } // map based fallback, "slow" path
    else {
      // the map requires an O(bEnd - bStart) operation once
      // to store all future nodes indexes for later purposes.
      // In the worst case scenario, this is a full O(N) cost,
      // and such scenario happens at least when all nodes are different,
      // but also if both first and last items of the lists are different
      if (!map) {
        map = new Map();
        var i = bStart;

        while (i < bEnd) {
          map.set(b[i], i++);
        }
      } // if it's a future node, hence it needs some handling


      if (map.has(a[aStart])) {
        // grab the index of such node, 'cause it might have been processed
        var index = map.get(a[aStart]); // if it's not already processed, look on demand for the next LCS

        if (bStart < index && index < bEnd) {
          var _i = aStart; // counts the amount of nodes that are the same in the future

          var sequence = 1;

          while (++_i < aEnd && _i < bEnd && map.get(a[_i]) === index + sequence) {
            sequence++;
          } // effort decision here: if the sequence is longer than replaces
          // needed to reach such sequence, which would brings again this loop
          // to the fast path, prepend the difference before a sequence,
          // and move only the future list index forward, so that aStart
          // and bStart will be aligned again, hence on the fast path.
          // An example considering aStart and bStart are both 0:
          // a: [1, 2, 3, 4]
          // b: [7, 1, 2, 3, 6]
          // this would place 7 before 1 and, from that time on, 1, 2, and 3
          // will be processed at zero cost


          if (sequence > index - bStart) {
            var _node2 = get(a[aStart], 0);

            while (bStart < index) {
              parentNode.insertBefore(get(b[bStart++], 1), _node2);
            }
          } // if the effort wasn't good enough, fallback to a replace,
            // moving both source and target indexes forward, hoping that some
          // similar node will be found later on, to go back to the fast path
          else {
            parentNode.replaceChild(get(b[bStart++], 1), get(a[aStart++], -1));
          }
        } // otherwise move the source forward, 'cause there's nothing to do
        else aStart++;
      } // this node has no meaning in the future list, so it's more than safe
        // to remove it, and check the next live node out instead, meaning
      // that only the live list index should be forwarded
      else parentNode.removeChild(get(a[aStart++], -1));
    }
  }

  return b;
});

var aria = function aria(node) {
  return function (value) {
    for (var key in value) {
      node.setAttribute(key === 'role' ? key : "aria-".concat(key), value[key]);
    }
  };
};
var attribute = function attribute(node, name) {
  var oldValue,
    orphan = true;
  var attributeNode = document.createAttributeNS(null, name);
  return function (newValue) {
    if (oldValue !== newValue) {
      oldValue = newValue;

      if (oldValue == null) {
        if (!orphan) {
          node.removeAttributeNodeNS(attributeNode);
          orphan = true;
        }
      } else {
        attributeNode.value = newValue;

        if (orphan) {
          node.setAttributeNodeNS(attributeNode);
          orphan = false;
        }
      }
    }
  };
};
var data = function data(_ref) {
  var dataset = _ref.dataset;
  return function (value) {
    for (var key in value) {
      dataset[key] = value[key];
    }
  };
};
var event = function event(node, name) {
  var oldValue,
    type = name.slice(2);
  if (!(name in node) && name.toLowerCase() in node) type = type.toLowerCase();
  return function (newValue) {
    var info = isArray(newValue) ? newValue : [newValue, false];

    if (oldValue !== info[0]) {
      if (oldValue) node.removeEventListener(type, oldValue, info[1]);
      if (oldValue = info[0]) node.addEventListener(type, oldValue, info[1]);
    }
  };
};
var ref = function ref(node) {
  return function (value) {
    if (typeof value === 'function') value(node);else value.current = node;
  };
};
var setter = function setter(node, key) {
  return function (value) {
    node[key] = value;
  };
};
var text = function text(node) {
  var oldValue;
  return function (newValue) {
    if (oldValue != newValue) {
      oldValue = newValue;
      node.textContent = newValue == null ? '' : newValue;
    }
  };
};

/*! (c) Andrea Giammarchi - ISC */
var createContent = function (document) {

  var FRAGMENT = 'fragment';
  var TEMPLATE = 'template';
  var HAS_CONTENT = ('content' in create(TEMPLATE));
  var createHTML = HAS_CONTENT ? function (html) {
    var template = create(TEMPLATE);
    template.innerHTML = html;
    return template.content;
  } : function (html) {
    var content = create(FRAGMENT);
    var template = create(TEMPLATE);
    var childNodes = null;

    if (/^[^\S]*?<(col(?:group)?|t(?:head|body|foot|r|d|h))/i.test(html)) {
      var selector = RegExp.$1;
      template.innerHTML = '<table>' + html + '</table>';
      childNodes = template.querySelectorAll(selector);
    } else {
      template.innerHTML = html;
      childNodes = template.childNodes;
    }

    append(content, childNodes);
    return content;
  };
  return function createContent(markup, type) {
    return (type === 'svg' ? createSVG : createHTML)(markup);
  };

  function append(root, childNodes) {
    var length = childNodes.length;

    while (length--) {
      root.appendChild(childNodes[0]);
    }
  }

  function create(element) {
    return element === FRAGMENT ? document.createDocumentFragment() : document.createElementNS('http://www.w3.org/1999/xhtml', element);
  } // it could use createElementNS when hasNode is there
  // but this fallback is equally fast and easier to maintain
  // it is also battle tested already in all IE


  function createSVG(svg) {
    var content = create(FRAGMENT);
    var template = create('div');
    template.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>';
    append(content, template.firstChild.childNodes);
    return content;
  }
}(document);

var reducePath = function reducePath(_ref, i) {
  var childNodes = _ref.childNodes;
  return childNodes[i];
}; // from a fragment container, create an array of indexes
// related to its child nodes, so that it's possible
// to retrieve later on exact node via reducePath

var createPath = function createPath(node) {
  var path = [];
  var _node = node,
    parentNode = _node.parentNode;

  while (parentNode) {
    path.push(indexOf.call(parentNode.childNodes, node));
    node = parentNode;
    parentNode = node.parentNode;
  }

  return path;
};
var _document = document,
  createTreeWalker = _document.createTreeWalker,
  importNode = _document.importNode;

var IE = importNode.length != 1; // IE11 and old Edge discard empty nodes when cloning, potentially
// resulting in broken paths to find updates. The workaround here
// is to import once, upfront, the fragment that will be cloned
// later on, so that paths are retrieved from one already parsed,
// hence without missing child nodes once re-cloned.

var createFragment = IE ? function (text, type) {
  return importNode.call(document, createContent(text, type), true);
} : createContent; // IE11 and old Edge have a different createTreeWalker signature that
// has been deprecated in other browsers. This export is needed only
// to guarantee the TreeWalker doesn't show warnings and, ultimately, works

var createWalker = IE ? function (fragment) {
  return createTreeWalker.call(document, fragment, 1 | 128, null, false);
} : function (fragment) {
  return createTreeWalker.call(document, fragment, 1 | 128);
};

var diff = function diff(comment, oldNodes, newNodes) {
  return udomdiff(comment.parentNode, // TODO: there is a possible edge case where a node has been
    //       removed manually, or it was a keyed one, attached
    //       to a shared reference between renders.
    //       In this case udomdiff might fail at removing such node
    //       as its parent won't be the expected one.
    //       The best way to avoid this issue is to filter oldNodes
    //       in search of those not live, or not in the current parent
    //       anymore, but this would require both a change to uwire,
    //       exposing a parentNode from the firstChild, as example,
    //       but also a filter per each diff that should exclude nodes
    //       that are not in there, penalizing performance quite a lot.
    //       As this has been also a potential issue with domdiff,
    //       and both lighterhtml and hyperHTML might fail with this
    //       very specific edge case, I might as well document this possible
    //       "diffing shenanigan" and call it a day.
    oldNodes, newNodes, diffable, comment);
}; // if an interpolation represents a comment, the whole
// diffing will be related to such comment.
// This helper is in charge of understanding how the new
// content for such interpolation/hole should be updated


var handleAnything = function handleAnything(comment) {
  var oldValue,
    text,
    nodes = [];

  var anyContent = function anyContent(newValue) {
    switch (typeof(newValue)) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean':
        if (oldValue !== newValue) {
          oldValue = newValue;
          if (text) text.textContent = newValue;else text = document.createTextNode(newValue);
          nodes = diff(comment, nodes, [text]);
        }

        break;
      // null, and undefined are used to cleanup previous content

      case 'object':
      case 'undefined':
        if (newValue == null) {
          if (oldValue != newValue) {
            oldValue = newValue;
            nodes = diff(comment, nodes, []);
          }

          break;
        } // arrays and nodes have a special treatment


        if (isArray(newValue)) {
          oldValue = newValue; // arrays can be used to cleanup, if empty

          if (newValue.length === 0) nodes = diff(comment, nodes, []); // or diffed, if these contains nodes or "wires"
          else if (typeof(newValue[0]) === 'object') nodes = diff(comment, nodes, newValue); // in all other cases the content is stringified as is
          else anyContent(String(newValue));
          break;
        } // if the new value is a DOM node, or a wire, and it's
        // different from the one already live, then it's diffed.
        // if the node is a fragment, it's appended once via its childNodes
        // There is no `else` here, meaning if the content
        // is not expected one, nothing happens, as easy as that.


        if ('ELEMENT_NODE' in newValue && oldValue !== newValue) {
          oldValue = newValue;
          nodes = diff(comment, nodes, newValue.nodeType === 11 ? slice.call(newValue.childNodes) : [newValue]);
        }

    }
  };

  return anyContent;
}; // attributes can be:
//  * ref=${...}      for hooks and other purposes
//  * aria=${...}     for aria attributes
//  * data=${...}     for dataset related attributes
//  * .setter=${...}  for Custom Elements setters or nodes with setters
//                    such as buttons, details, options, select, etc
//  * onevent=${...}  to automatically handle event listeners
//  * generic=${...}  to handle an attribute just like an attribute


var handleAttribute = function handleAttribute(node, name
                                               /*, svg*/
) {
  if (name === 'ref') return ref(node);
  if (name === 'aria') return aria(node);
  if (name === 'data') return data(node);
  if (name.slice(0, 1) === '.') return setter(node, name.slice(1));
  if (name.slice(0, 2) === 'on') return event(node, name);
  return attribute(node, name
    /*, svg*/
  );
}; // each mapped update carries the update type and its path
// the type is either node, attribute, or text, while
// the path is how to retrieve the related node to update.
// In the attribute case, the attribute name is also carried along.


function handlers(options) {
  var type = options.type,
    path = options.path;
  var node = path.reduceRight(reducePath, this);
  return type === 'node' ? handleAnything(node) : type === 'attr' ? handleAttribute(node, options.name
    /*, options.svg*/
  ) : text(node);
}

// that contain the related unique id. In the attribute cases
// isµX="attribute-name" will be used to map current X update to that
// attribute name, while comments will be like <!--isµX-->, to map
// the update to that specific comment node, hence its parent.
// style and textarea will have <!--isµX--> text content, and are handled
// directly through text-only updates.

var prefix = 'isµ'; // Template Literals are unique per scope and static, meaning a template
// should be parsed once, and once only, as it will always represent the same
// content, within the exact same amount of updates each time.
// This cache relates each template to its unique content and updates.

var cache = umap(new WeakMap());
var createCache = function createCache() {
  return {
    stack: [],
    // each template gets a stack for each interpolation "hole"
    entry: null,
    // each entry contains details, such as:
    //  * the template that is representing
    //  * the type of node it represents (html or svg)
    //  * the content fragment with all nodes
    //  * the list of updates per each node (template holes)
    //  * the "wired" node or fragment that will get updates
    // if the template or type are different from the previous one
    // the entry gets re-created each time
    wire: null // each rendered node represent some wired content and
    // this reference to the latest one. If different, the node
    // will be cleaned up and the new "wire" will be appended

  };
}; // the entry stored in the rendered node cache, and per each "hole"

var createEntry = function createEntry(type, template) {
  var _mapUpdates = mapUpdates(type, template),
    content = _mapUpdates.content,
    updates = _mapUpdates.updates;

  return {
    type: type,
    template: template,
    content: content,
    updates: updates,
    wire: null
  };
}; // a template is instrumented to be able to retrieve where updates are needed.
// Each unique template becomes a fragment, cloned once per each other
// operation based on the same template, i.e. data => html`<p>${data}</p>`


var mapTemplate = function mapTemplate(type, template) {
  var text = instrument(template, prefix, type === 'svg');
  var content = createFragment(text, type); // once instrumented and reproduced as fragment, it's crawled
  // to find out where each update is in the fragment tree

  var tw = createWalker(content);
  var nodes = [];
  var length = template.length - 1;
  var i = 0; // updates are searched via unique names, linearly increased across the tree
  // <div isµ0="attr" isµ1="other"><!--isµ2--><style><!--isµ3--</style></div>

  var search = "".concat(prefix).concat(i);

  while (i < length) {
    var node = tw.nextNode(); // if not all updates are bound but there's nothing else to crawl
    // it means that there is something wrong with the template.

    if (!node) throw "bad template: ".concat(text); // if the current node is a comment, and it contains isµX
    // it means the update should take care of any content

    if (node.nodeType === 8) {
      // The only comments to be considered are those
      // which content is exactly the same as the searched one.
      if (node.textContent === search) {
        nodes.push({
          type: 'node',
          path: createPath(node)
        });
        search = "".concat(prefix).concat(++i);
      }
    } else {
      // if the node is not a comment, loop through all its attributes
      // named isµX and relate attribute updates to this node and the
      // attribute name, retrieved through node.getAttribute("isµX")
      // the isµX attribute will be removed as irrelevant for the layout
      // let svg = -1;
      while (node.hasAttribute(search)) {
        nodes.push({
          type: 'attr',
          path: createPath(node),
          name: node.getAttribute(search) //svg: svg < 0 ? (svg = ('ownerSVGElement' in node ? 1 : 0)) : svg

        });
        node.removeAttribute(search);
        search = "".concat(prefix).concat(++i);
      } // if the node was a style or a textarea one, check its content
      // and if it is <!--isµX--> then update tex-only this node


      if (/^(?:style|textarea)$/i.test(node.tagName) && node.textContent.trim() === "<!--".concat(search, "-->")) {
        nodes.push({
          type: 'text',
          path: createPath(node)
        });
        search = "".concat(prefix).concat(++i);
      }
    }
  } // once all nodes to update, or their attributes, are known, the content
  // will be cloned in the future to represent the template, and all updates
  // related to such content retrieved right away without needing to re-crawl
  // the exact same template, and its content, more than once.


  return {
    content: content,
    nodes: nodes
  };
}; // if a template is unknown, perform the previous mapping, otherwise grab
// its details such as the fragment with all nodes, and updates info.


var mapUpdates = function mapUpdates(type, template) {
  var _ref = cache.get(template) || cache.set(template, mapTemplate(type, template)),
    content = _ref.content,
    nodes = _ref.nodes; // clone deeply the fragment


  var fragment = importNode.call(document, content, true); // and relate an update handler per each node that needs one

  var updates = nodes.map(handlers, fragment); // return the fragment and all updates to use within its nodes

  return {
    content: fragment,
    updates: updates
  };
}; // as html and svg can be nested calls, but no parent node is known
// until rendered somewhere, the unroll operation is needed to
// discover what to do with each interpolation, which will result
// into an update operation.


var unroll = function unroll(info, _ref2) {
  var type = _ref2.type,
    template = _ref2.template,
    values = _ref2.values;
  var length = values.length; // interpolations can contain holes and arrays, so these need
  // to be recursively discovered

  unrollValues(info, values, length);
  var entry = info.entry; // if the cache entry is either null or different from the template
  // and the type this unroll should resolve, create a new entry
  // assigning a new content fragment and the list of updates.

  if (!entry || entry.template !== template || entry.type !== type) info.entry = entry = createEntry(type, template);
  var _entry = entry,
    content = _entry.content,
    updates = _entry.updates,
    wire = _entry.wire; // even if the fragment and its nodes is not live yet,
  // it is already possible to update via interpolations values.

  for (var i = 0; i < length; i++) {
    updates[i](values[i]);
  } // if the entry was new, or representing a different template or type,
  // create a new persistent entity to use during diffing.
  // This is simply a DOM node, when the template has a single container,
  // as in `<p></p>`, or a "wire" in `<p></p><p></p>` and similar cases.


  return wire || (entry.wire = persistent(content));
}; // the stack retains, per each interpolation value, the cache
// related to each interpolation value, or null, if the render
// was conditional and the value is not special (Array or Hole)

var unrollValues = function unrollValues(_ref3, values, length) {
  var stack = _ref3.stack;

  for (var i = 0; i < length; i++) {
    var hole = values[i]; // each Hole gets unrolled and re-assigned as value
    // so that domdiff will deal with a node/wire, not with a hole

    if (hole instanceof Hole) values[i] = unroll(stack[i] || (stack[i] = createCache()), hole); // arrays are recursively resolved so that each entry will contain
    // also a DOM node or a wire, hence it can be diffed if/when needed
    else if (isArray(hole)) unrollValues(stack[i] || (stack[i] = createCache()), hole, hole.length); // if the value is nothing special, the stack doesn't need to retain data
      // this is useful also to cleanup previously retained data, if the value
      // was a Hole, or an Array, but not anymore, i.e.:
      // const update = content => html`<div>${content}</div>`;
    // update(listOfItems); update(null); update(html`hole`)
    else stack[i] = null;
  }

  if (length < stack.length) stack.splice(length);
};
/**
 * Holds all details wrappers needed to render the content further on.
 * @constructor
 * @param {string} type The hole type, either `html` or `svg`.
 * @param {string[]} template The template literals used to the define the content.
 * @param {Array} values Zero, one, or more interpolated values to render.
 */


function Hole(type, template, values) {
  this.type = type;
  this.template = template;
  this.values = values;
}

var create = Object.create,
  defineProperties = Object.defineProperties; // each rendered node gets its own cache

var cache$1 = umap(new WeakMap()); // both `html` and `svg` template literal tags are polluted
// with a `for(ref[, id])` and a `node` tag too

var tag = function tag(type) {
  // both `html` and `svg` tags have their own cache
  var keyed = umap(new WeakMap()); // keyed operations always re-use the same cache and unroll
  // the template and its interpolations right away

  var fixed = function fixed(cache) {
    return function (template) {
      for (var _len = arguments.length, values = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
      }

      return unroll(cache, {
        type: type,
        template: template,
        values: values
      });
    };
  };

  return defineProperties( // non keyed operations are recognized as instance of Hole
    // during the "unroll", recursively resolved and updated
    function (template) {
      for (var _len2 = arguments.length, values = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        values[_key2 - 1] = arguments[_key2];
      }

      return new Hole(type, template, values);
    }, {
      "for": {
        // keyed operations need a reference object, usually the parent node
        // which is showing keyed results, and optionally a unique id per each
        // related node, handy with JSON results and mutable list of objects
        // that usually carry a unique identifier
        value: function value(ref, id) {
          var memo = keyed.get(ref) || keyed.set(ref, create(null));
          return memo[id] || (memo[id] = fixed(createCache()));
        }
      },
      node: {
        // it is possible to create one-off content out of the box via node tag
        // this might return the single created node, or a fragment with all
        // nodes present at the root level and, of course, their child nodes
        value: function value(template) {
          for (var _len3 = arguments.length, values = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            values[_key3 - 1] = arguments[_key3];
          }

          return unroll(createCache(), {
            type: type,
            template: template,
            values: values
          }).valueOf();
        }
      }
    });
};

var html = tag('html');
var svg = tag('svg'); // rendering means understanding what `html` or `svg` tags returned
// and it relates a specific node to its own unique cache.
// Each time the content to render changes, the node is cleaned up
// and the new new content is appended, and if such content is a Hole
// then it's "unrolled" to resolve all its inner nodes.

var render = function render(where, what) {
  var hole = typeof what === 'function' ? what() : what;
  var info = cache$1.get(where) || cache$1.set(where, createCache());
  var wire = hole instanceof Hole ? unroll(info, hole) : hole;

  if (wire !== info.wire) {
    info.wire = wire;
    where.textContent = ''; // valueOf() simply returns the node itself, but in case it was a "wire"
    // it will eventually re-append all nodes to its fragment so that such
    // fragment can be re-appended many times in a meaningful way
    // (wires are basically persistent fragments facades with special behavior)

    where.appendChild(wire.valueOf());
  }

  return where;
};

var toStr = Object.prototype.toString;
function hasOwnProperty(obj, prop) {
  if(obj == null) {
    return false
  }
  //to handle objects with null prototypes (too edge case?)
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

function isEmpty(value){
  if (!value) {
    return true;
  }
  if (isArray$1(value) && value.length === 0) {
    return true;
  } else if (typeof value !== 'string') {
    for (var i in value) {
      if (hasOwnProperty(value, i)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function toString(type){
  return toStr.call(type);
}

function isObject(obj){
  return typeof obj === 'object' && toString(obj) === "[object Object]";
}

var isArray$1 = Array.isArray || function(obj){
  /*istanbul ignore next:cant test*/
  return toStr.call(obj) === '[object Array]';
};

function isBoolean(obj){
  return typeof obj === 'boolean' || toString(obj) === '[object Boolean]';
}

function getKey(key){
  var intKey = parseInt(key);
  if (intKey.toString() === key) {
    return intKey;
  }
  return key;
}

function factory(options) {
  options = options || {};

  var objectPath = function(obj) {
    return Object.keys(objectPath).reduce(function(proxy, prop) {
      if(prop === 'create') {
        return proxy;
      }

      /*istanbul ignore else*/
      if (typeof objectPath[prop] === 'function') {
        proxy[prop] = objectPath[prop].bind(objectPath, obj);
      }

      return proxy;
    }, {});
  };

  function hasShallowProperty(obj, prop) {
    return (options.includeInheritedProps || (typeof prop === 'number' && Array.isArray(obj)) || hasOwnProperty(obj, prop))
  }

  function getShallowProperty(obj, prop) {
    if (hasShallowProperty(obj, prop)) {
      return obj[prop];
    }
  }

  function set(obj, path, value, doNotReplace){
    if (typeof path === 'number') {
      path = [path];
    }
    if (!path || path.length === 0) {
      return obj;
    }
    if (typeof path === 'string') {
      return set(obj, path.split('.').map(getKey), value, doNotReplace);
    }
    var currentPath = path[0];
    var currentValue = getShallowProperty(obj, currentPath);
    if (path.length === 1) {
      if (currentValue === void 0 || !doNotReplace) {
        obj[currentPath] = value;
      }
      return currentValue;
    }

    if (currentValue === void 0) {
      //check if we assume an array
      if(typeof path[1] === 'number') {
        obj[currentPath] = [];
      } else {
        obj[currentPath] = {};
      }
    }

    return set(obj[currentPath], path.slice(1), value, doNotReplace);
  }

  objectPath.has = function (obj, path) {
    if (typeof path === 'number') {
      path = [path];
    } else if (typeof path === 'string') {
      path = path.split('.');
    }

    if (!path || path.length === 0) {
      return !!obj;
    }

    for (var i = 0; i < path.length; i++) {
      var j = getKey(path[i]);

      if((typeof j === 'number' && isArray$1(obj) && j < obj.length) ||
        (options.includeInheritedProps ? (j in Object(obj)) : hasOwnProperty(obj, j))) {
        obj = obj[j];
      } else {
        return false;
      }
    }

    return true;
  };

  objectPath.ensureExists = function (obj, path, value){
    return set(obj, path, value, true);
  };

  objectPath.set = function (obj, path, value, doNotReplace){
    return set(obj, path, value, doNotReplace);
  };

  objectPath.insert = function (obj, path, value, at){
    var arr = objectPath.get(obj, path);
    at = ~~at;
    if (!isArray$1(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }
    arr.splice(at, 0, value);
  };

  objectPath.empty = function(obj, path) {
    if (isEmpty(path)) {
      return void 0;
    }
    if (obj == null) {
      return void 0;
    }

    var value, i;
    if (!(value = objectPath.get(obj, path))) {
      return void 0;
    }

    if (typeof value === 'string') {
      return objectPath.set(obj, path, '');
    } else if (isBoolean(value)) {
      return objectPath.set(obj, path, false);
    } else if (typeof value === 'number') {
      return objectPath.set(obj, path, 0);
    } else if (isArray$1(value)) {
      value.length = 0;
    } else if (isObject(value)) {
      for (i in value) {
        if (hasShallowProperty(value, i)) {
          delete value[i];
        }
      }
    } else {
      return objectPath.set(obj, path, null);
    }
  };

  objectPath.push = function (obj, path /*, values */){
    var arr = objectPath.get(obj, path);
    if (!isArray$1(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }

    arr.push.apply(arr, Array.prototype.slice.call(arguments, 2));
  };

  objectPath.coalesce = function (obj, paths, defaultValue) {
    var value;

    for (var i = 0, len = paths.length; i < len; i++) {
      if ((value = objectPath.get(obj, paths[i])) !== void 0) {
        return value;
      }
    }

    return defaultValue;
  };

  objectPath.get = function (obj, path, defaultValue){
    if (typeof path === 'number') {
      path = [path];
    }
    if (!path || path.length === 0) {
      return obj;
    }
    if (obj == null) {
      return defaultValue;
    }
    if (typeof path === 'string') {
      return objectPath.get(obj, path.split('.'), defaultValue);
    }

    var currentPath = getKey(path[0]);
    var nextObj = getShallowProperty(obj, currentPath);
    if (nextObj === void 0) {
      return defaultValue;
    }

    if (path.length === 1) {
      return nextObj;
    }

    return objectPath.get(obj[currentPath], path.slice(1), defaultValue);
  };

  objectPath.del = function del(obj, path) {
    if (typeof path === 'number') {
      path = [path];
    }

    if (obj == null) {
      return obj;
    }

    if (isEmpty(path)) {
      return obj;
    }
    if(typeof path === 'string') {
      return objectPath.del(obj, path.split('.'));
    }

    var currentPath = getKey(path[0]);
    if (!hasShallowProperty(obj, currentPath)) {
      return obj;
    }

    if(path.length === 1) {
      if (isArray$1(obj)) {
        obj.splice(currentPath, 1);
      } else {
        delete obj[currentPath];
      }
    } else {
      return objectPath.del(obj[currentPath], path.slice(1));
    }

    return obj;
  };

  return objectPath;
}

let getValue = factory();

function defaultCompare(a, b) {
  return a === b
}

function watch(getState, objectPath, compare) {
  compare = compare || defaultCompare;
  let currentValue = getValue(getState(), objectPath);
  return function w(fn) {
    return function () {
      let newValue = getValue(getState(), objectPath);
      if (!compare(currentValue, newValue)) {
        let oldValue = currentValue;
        currentValue = newValue;
        fn(newValue, oldValue, objectPath);
      }
    }
  }
}

function symbolObservablePonyfill(root) {
  var result;
  var Symbol = root.Symbol;

  if (typeof Symbol === 'function') {
    if (Symbol.observable) {
      result = Symbol.observable;
    } else {
      result = Symbol('observable');
      Symbol.observable = result;
    }
  } else {
    result = '@@observable';
  }

  return result;
}

/* global window */

var root;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = symbolObservablePonyfill(root);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var randomString = function randomString() {
  return Math.random().toString(36).substring(7).split('').join('.');
};

var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  var proto = obj;

  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
    throw new Error('It looks like you are passing several store enhancers to ' + 'createStore(). This is not supported. Instead, compose them ' + 'together to a single function.');
  }

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;
  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   */

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }
  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */


  function getState() {
    if (isDispatching) {
      throw new Error('You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
    }

    return currentState;
  }
  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */


  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.');
    }

    if (isDispatching) {
      throw new Error('You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.');
    }

    var isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error('You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.');
      }

      isSubscribed = false;
      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }
  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */


  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      listener();
    }

    return action;
  }
  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */


  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer; // This action has a similiar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.

    dispatch({
      type: ActionTypes.REPLACE
    });
  }
  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */


  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe: unsubscribe
        };
      }
    }, _ref[result] = function () {
      return this;
    }, _ref;
  } // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.


  dispatch({
    type: ActionTypes.INIT
  });
  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[result] = observable, _ref2;
}

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */


  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
  } catch (e) {} // eslint-disable-line no-empty

}

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionDescription = actionType && "action \"" + String(actionType) + "\"" || 'an action';
  return "Given " + actionDescription + ", reducer \"" + key + "\" returned undefined. " + "To ignore an action, you must explicitly return the previous state. " + "If you want this reducer to hold no value, you can return null instead of undefined.";
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === ActionTypes.INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!isPlainObject(inputState)) {
    return "The " + argumentName + " has unexpected type of \"" + {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + "\". Expected argument to be an object with the following " + ("keys: \"" + reducerKeys.join('", "') + "\"");
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });
  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });
  if (action && action.type === ActionTypes.REPLACE) return;

  if (unexpectedKeys.length > 0) {
    return "Unexpected " + (unexpectedKeys.length > 1 ? 'keys' : 'key') + " " + ("\"" + unexpectedKeys.join('", "') + "\" found in " + argumentName + ". ") + "Expected to find one of the known reducer keys instead: " + ("\"" + reducerKeys.join('", "') + "\". Unexpected keys will be ignored.");
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, {
      type: ActionTypes.INIT
    });

    if (typeof initialState === 'undefined') {
      throw new Error("Reducer \"" + key + "\" returned undefined during initialization. " + "If the state passed to the reducer is undefined, you must " + "explicitly return the initial state. The initial state may " + "not be undefined. If you don't want to set a value for this reducer, " + "you can use null instead of undefined.");
    }

    if (typeof reducer(undefined, {
      type: ActionTypes.PROBE_UNKNOWN_ACTION()
    }) === 'undefined') {
      throw new Error("Reducer \"" + key + "\" returned undefined when probed with a random type. " + ("Don't try to handle " + ActionTypes.INIT + " or other actions in \"redux/*\" ") + "namespace. They are considered private. Instead, you must return the " + "current state for any unknown actions, unless it is undefined, " + "in which case you must return the initial state, regardless of the " + "action type. The initial state may not be undefined, but can be null.");
    }
  });
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    keys.push.apply(keys, Object.getOwnPropertySymbols(object));
  }

  if (enumerableOnly) keys = keys.filter(function (sym) {
    return Object.getOwnPropertyDescriptor(object, sym).enumerable;
  });
  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(source, true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
function compose() {
  for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(void 0, arguments));
    };
  });
}

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function () {
      var store = createStore.apply(void 0, arguments);

      var _dispatch = function dispatch() {
        throw new Error('Dispatching while constructing your middleware is not allowed. ' + 'Other middleware would not be applied to this dispatch.');
      };

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch() {
          return _dispatch.apply(void 0, arguments);
        }
      };
      var chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = compose.apply(void 0, chain)(store.dispatch);
      return _objectSpread2({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

/*
 * This is a dummy function to check if the function name has been altered by minification.
 * If the function has been minified and NODE_ENV !== 'production', warn the user.
 */

function isCrushed() {}

if ( typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning('You are currently using minified code outside of NODE_ENV === "production". ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' + 'to ensure you have the correct code for your production build.');
}

/**
 * Returns whether the thing given is a Promise
 * @param obj
 * @returns {boolean}
 */
function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

/**
 * Resolves promises in the middleware chain.
 */
function promiseMiddleware({ dispatch }) {
  return next => action => {
    return isPromise(action.payload) && typeof action.success === 'undefined'
      ? action.payload
        .then(result => dispatch({ ...action, payload: result, success: true }))
        .catch(error => {
          dispatch({ ...action, payload: error, error: true });
          return Promise.reject(error);
        })
      : next(action);
  };
}

/**
 * @description
 * getSubset returns an object with the same structure as the original object passed in,
 * but contains only the specified keys and only if that key has a truth-y value.
 *
 * @param {Object} obj The object from which to create a subset.
 * @param {String[]} paths An array of (top-level) keys that should be included in the subset.
 *
 * @return {Object} An object that contains the specified keys with truth-y values
 */
function getSubset(obj, paths) {
  let subset = {};

  paths.forEach((key) => {
    let slice = obj[key];
    if (slice) subset[key] = slice;
  });

  return subset
}

let _isArray = Array.isArray || (Array.isArray = function(a){ return '' + a !== a && {}.toString.call(a) === '[object Array]'});

/**
 * @description
 * typeof method that
 * 1. groups all false-y & empty values as void
 * 2. distinguishes between object and array
 *
 * @param {*} thing The thing to inspect
 *
 * @return {String} Actionable type classification
 */
function typeOf(thing) {
  if (!thing) return 'void'

  if (_isArray(thing)) {
    if (!thing.length) return 'void'
    return 'array'
  }

  return typeof thing
}

/**
 * @description
 * createSlicer inspects the typeof paths and returns an appropriate slicer function.
 *
 * @param {String|String[]} [paths] The paths argument supplied to persistState.
 *
 * @return {Function} A slicer function, which returns the subset to store when called with Redux's store state.
 */
function createSlicer(paths) {
  switch (typeOf(paths)) {
    case 'void':
      return (state) => state
    case 'string':
      return (state) => getSubset(state, [paths])
    case 'array':
      return (state) => getSubset(state, paths)
    default:
      return console.error('Invalid paths argument, should be of type String, Array or Void')
  }
}

function mergeState(initialState, persistedState) {
  return persistedState
    ? {...initialState, ...persistedState}
    : initialState
}

/**
 * @description
 * persistState is a Store Enhancer that syncs (a subset of) store state to localStorage.
 *
 * @param {String|String[]} [paths] Specify keys to sync with localStorage, if left undefined the whole store is persisted
 * @param {Object} [config] Optional config object
 * @param {String} [config.key="redux"] String used as localStorage key
 * @param {Function} [config.slicer] (paths) => (state) => subset. A function that returns a subset
 * of store state that should be persisted to localStorage
 * @param {Function} [config.serialize=JSON.stringify] (subset) => serializedData. Called just before persisting to
 * localStorage. Should transform the subset into a format that can be stored.
 * @param {Function} [config.deserialize=JSON.parse] (persistedData) => subset. Called directly after retrieving
 * persistedState from localStorage. Should transform the data into the format expected by your application
 *
 * @return {Function} An enhanced store
 */
function persistState(paths, config) {
  const cfg = {
    key: 'redux',
    merge: mergeState,
    slicer: createSlicer,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    ...config
  };

  const {
    key,
    merge,
    slicer,
    serialize,
    deserialize
  } = cfg;

  return next => (reducer, initialState, enhancer) => {
    if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
      enhancer = initialState;
      initialState = undefined;
    }

    let persistedState;
    let finalInitialState;

    try {
      persistedState = deserialize(localStorage.getItem(key));
      finalInitialState = merge(initialState, persistedState);
    } catch (e) {
      console.warn('Failed to retrieve initialize state from localStorage:', e);
    }

    const store = next(reducer, finalInitialState, enhancer);
    const slicerFn = slicer(paths);

    store.subscribe(function () {
      const state = store.getState();
      const subset = slicerFn(state);

      try {
        localStorage.setItem(key, serialize(subset));
      } catch (e) {
        console.warn('Unable to persist state to localStorage:', e);
      }
    });

    return store
  }
}

/**
 * A copy of combineReducers where the whole state is given as a third parameter to the reducers.
 * @param reducers
 * @returns {function(*=, *=): {}}
 */
function sharedCombineReducers(reducers) {
  let reducerKeys = Object.keys(reducers);
  let finalReducers = {};

  for (let i = 0; i < reducerKeys.length; i++) {
    let key = reducerKeys[i];
    {
      if (typeof reducers[key] === 'undefined') {
        warning("No reducer provided for key \"" + key + "\"");
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  let finalReducerKeys = Object.keys(finalReducers); // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache;

  {
    unexpectedKeyCache = {};
  }

  let shapeAssertionError;

  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state, action) {
    if (state === void 0) {
      state = {};
    }

    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    {
      let warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);

      if (warningMessage) {
        warning(warningMessage);
      }
    }

    let hasChanged = false;
    let nextState = {};

    for (let _i = 0; _i < finalReducerKeys.length; _i++) {
      let _key = finalReducerKeys[_i];
      let reducer = finalReducers[_key];
      let previousStateForKey = state[_key];
      let nextStateForKey = reducer(previousStateForKey, action, state, nextState);

      if (typeof nextStateForKey === 'undefined') {
        let errorMessage = getUndefinedStateErrorMessage(_key, action);
        throw new Error(errorMessage);
      }

      nextState[_key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : state;
  };
}

const savableSlicer = (paths) => {
  return (state) => {
    return state;
  }
};

var obj;
var NOTHING = typeof Symbol !== "undefined" ? Symbol("immer-nothing") : ( obj = {}, obj["immer-nothing"] = true, obj );
var DRAFTABLE = typeof Symbol !== "undefined" && Symbol.for ? Symbol.for("immer-draftable") : "__$immer_draftable";
var DRAFT_STATE = typeof Symbol !== "undefined" && Symbol.for ? Symbol.for("immer-state") : "__$immer_state";
function isDraft(value) {
  return !!value && !!value[DRAFT_STATE];
}
function isDraftable(value) {
  if (!value) { return false; }
  return isPlainObject$1(value) || !!value[DRAFTABLE] || !!value.constructor[DRAFTABLE] || isMap(value) || isSet(value);
}
function isPlainObject$1(value) {
  if (!value || typeof value !== "object") { return false; }
  if (Array.isArray(value)) { return true; }
  var proto = Object.getPrototypeOf(value);
  return !proto || proto === Object.prototype;
}
function original(value) {
  if (value && value[DRAFT_STATE]) {
    return value[DRAFT_STATE].base;
  } // otherwise return undefined

} // We use Maps as `drafts` for Sets, not Objects
// See proxy.js

function assignSet(target, override) {
  override.forEach(function (value) {
    // When we add new drafts we have to remove their originals if present
    var prev = original(value);
    if (prev) { target.delete(prev); }
    target.add(value);
  });
  return target;
} // We use Maps as `drafts` for Maps, not Objects
// See proxy.js

function assignMap(target, override) {
  override.forEach(function (value, key) { return target.set(key, value); });
  return target;
}
var assign = Object.assign || (function (target) {
  var overrides = [], len = arguments.length - 1;
  while ( len-- > 0 ) overrides[ len ] = arguments[ len + 1 ];

  overrides.forEach(function (override) { return Object.keys(override).forEach(function (key) { return target[key] = override[key]; }); });
  return target;
});
var ownKeys$1 = typeof Reflect !== "undefined" && Reflect.ownKeys ? Reflect.ownKeys : typeof Object.getOwnPropertySymbols !== "undefined" ? function (obj) { return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj)); } : Object.getOwnPropertyNames;
function shallowCopy(base, invokeGetters) {
  if ( invokeGetters === void 0 ) invokeGetters = false;

  if (Array.isArray(base)) { return base.slice(); }
  if (isMap(base)) { return new Map(base); }
  if (isSet(base)) { return new Set(base); }
  var clone = Object.create(Object.getPrototypeOf(base));
  ownKeys$1(base).forEach(function (key) {
    if (key === DRAFT_STATE) {
      return; // Never copy over draft state.
    }

    var desc = Object.getOwnPropertyDescriptor(base, key);
    var value = desc.value;

    if (desc.get) {
      if (!invokeGetters) {
        throw new Error("Immer drafts cannot have computed properties");
      }

      value = desc.get.call(base);
    }

    if (desc.enumerable) {
      clone[key] = value;
    } else {
      Object.defineProperty(clone, key, {
        value: value,
        writable: true,
        configurable: true
      });
    }
  });
  return clone;
}
function each(obj, iter) {
  if (Array.isArray(obj) || isMap(obj) || isSet(obj)) {
    obj.forEach(function (entry, index) { return iter(index, entry, obj); });
  } else {
    ownKeys$1(obj).forEach(function (key) { return iter(key, obj[key], obj); });
  }
}
function isEnumerable(base, prop) {
  var desc = Object.getOwnPropertyDescriptor(base, prop);
  return !!desc && desc.enumerable;
}
function has(thing, prop) {
  return isMap(thing) ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
}
function get(thing, prop) {
  return isMap(thing) ? thing.get(prop) : thing[prop];
}
function is(x, y) {
  // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
var hasSymbol = typeof Symbol !== "undefined";
var hasMap = typeof Map !== "undefined";
function isMap(target) {
  return hasMap && target instanceof Map;
}
var hasSet = typeof Set !== "undefined";
function isSet(target) {
  return hasSet && target instanceof Set;
}
function makeIterable(next) {
  var obj;

  var self;
  return self = ( obj = {}, obj[Symbol.iterator] = function () { return self; }, obj.next = next, obj );
}
/** Map.prototype.values _-or-_ Map.prototype.entries */

function iterateMapValues(state, prop, receiver) {
  var isEntries = prop !== "values";
  return function () {
    var iterator = latest(state)[Symbol.iterator]();
    return makeIterable(function () {
      var result = iterator.next();

      if (!result.done) {
        var ref = result.value;
        var key = ref[0];
        var value = receiver.get(key);
        result.value = isEntries ? [key, value] : value;
      }

      return result;
    });
  };
}
function makeIterateSetValues(createProxy) {
  function iterateSetValues(state, prop) {
    var isEntries = prop === "entries";
    return function () {
      var iterator = latest(state)[Symbol.iterator]();
      return makeIterable(function () {
        var result = iterator.next();

        if (!result.done) {
          var value = wrapSetValue(state, result.value);
          result.value = isEntries ? [value, value] : value;
        }

        return result;
      });
    };
  }

  function wrapSetValue(state, value) {
    var key = original(value) || value;
    var draft = state.drafts.get(key);

    if (!draft) {
      if (state.finalized || !isDraftable(value) || state.finalizing) {
        return value;
      }

      draft = createProxy(value, state);
      state.drafts.set(key, draft);

      if (state.modified) {
        state.copy.add(draft);
      }
    }

    return draft;
  }

  return iterateSetValues;
}

function latest(state) {
  return state.copy || state.base;
}

function clone(obj) {
  if (!isDraftable(obj)) { return obj; }
  if (Array.isArray(obj)) { return obj.map(clone); }
  if (isMap(obj)) { return new Map(obj); }
  if (isSet(obj)) { return new Set(obj); }
  var cloned = Object.create(Object.getPrototypeOf(obj));

  for (var key in obj) { cloned[key] = clone(obj[key]); }

  return cloned;
}
function freeze(obj, deep) {
  if ( deep === void 0 ) deep = false;

  if (!isDraftable(obj) || isDraft(obj) || Object.isFrozen(obj)) { return; }

  if (isSet(obj)) {
    obj.add = obj.clear = obj.delete = dontMutateFrozenCollections;
  } else if (isMap(obj)) {
    obj.set = obj.clear = obj.delete = dontMutateFrozenCollections;
  }

  Object.freeze(obj);
  if (deep) { each(obj, function (_, value) { return freeze(value, true); }); }
}

function dontMutateFrozenCollections() {
  throw new Error("This object has been frozen and should not be mutated");
}

/** Each scope represents a `produce` call. */

var ImmerScope = function ImmerScope(parent) {
  this.drafts = [];
  this.parent = parent; // Whenever the modified draft contains a draft from another scope, we
  // need to prevent auto-freezing so the unowned draft can be finalized.

  this.canAutoFreeze = true; // To avoid prototype lookups:

  this.patches = null;
};

ImmerScope.prototype.usePatches = function usePatches (patchListener) {
  if (patchListener) {
    this.patches = [];
    this.inversePatches = [];
    this.patchListener = patchListener;
  }
};

ImmerScope.prototype.revoke = function revoke$1 () {
  this.leave();
  this.drafts.forEach(revoke);
  this.drafts = null; // Make draft-related methods throw.
};

ImmerScope.prototype.leave = function leave () {
  if (this === ImmerScope.current) {
    ImmerScope.current = this.parent;
  }
};
ImmerScope.current = null;

ImmerScope.enter = function () {
  return this.current = new ImmerScope(this.current);
};

function revoke(draft) {
  draft[DRAFT_STATE].revoke();
}

function willFinalize(scope, result, isReplaced) {
  scope.drafts.forEach(function (draft) {
    draft[DRAFT_STATE].finalizing = true;
  });

  if (!isReplaced) {
    if (scope.patches) {
      markChangesRecursively(scope.drafts[0]);
    } // This is faster when we don't care about which attributes changed.


    markChangesSweep(scope.drafts);
  } // When a child draft is returned, look for changes.
  else if (isDraft(result) && result[DRAFT_STATE].scope === scope) {
    markChangesSweep(scope.drafts);
  }
}
function createProxy(base, parent) {
  var isArray = Array.isArray(base);
  var draft = clonePotentialDraft(base);

  if (isMap(base)) {
    proxyMap(draft);
  } else if (isSet(base)) {
    proxySet(draft);
  } else {
    each(draft, function (prop) {
      proxyProperty(draft, prop, isArray || isEnumerable(base, prop));
    });
  } // See "proxy.js" for property documentation.


  var scope = parent ? parent.scope : ImmerScope.current;
  var state = {
    scope: scope,
    modified: false,
    finalizing: false,
    // es5 only
    finalized: false,
    assigned: isMap(base) ? new Map() : {},
    parent: parent,
    base: base,
    draft: draft,
    drafts: isSet(base) ? new Map() : null,
    copy: null,
    revoke: revoke$1,
    revoked: false // es5 only

  };
  createHiddenProperty(draft, DRAFT_STATE, state);
  scope.drafts.push(draft);
  return draft;
}

function revoke$1() {
  this.revoked = true;
}

function latest$1(state) {
  return state.copy || state.base;
} // Access a property without creating an Immer draft.


function peek(draft, prop) {
  var state = draft[DRAFT_STATE];

  if (state && !state.finalizing) {
    state.finalizing = true;
    var value = draft[prop];
    state.finalizing = false;
    return value;
  }

  return draft[prop];
}

function get$1(state, prop) {
  assertUnrevoked(state);
  var value = peek(latest$1(state), prop);
  if (state.finalizing) { return value; } // Create a draft if the value is unmodified.

  if (value === peek(state.base, prop) && isDraftable(value)) {
    prepareCopy(state);
    return state.copy[prop] = createProxy(value, state);
  }

  return value;
}

function set(state, prop, value) {
  assertUnrevoked(state);
  state.assigned[prop] = true;

  if (!state.modified) {
    if (is(value, peek(latest$1(state), prop))) { return; }
    markChanged(state);
    prepareCopy(state);
  }

  state.copy[prop] = value;
}

function markChanged(state) {
  if (!state.modified) {
    state.modified = true;
    if (state.parent) { markChanged(state.parent); }
  }
}

function prepareCopy(state) {
  if (!state.copy) { state.copy = clonePotentialDraft(state.base); }
}

function clonePotentialDraft(base) {
  var state = base && base[DRAFT_STATE];

  if (state) {
    state.finalizing = true;
    var draft = shallowCopy(state.draft, true);
    state.finalizing = false;
    return draft;
  }

  return shallowCopy(base);
} // property descriptors are recycled to make sure we don't create a get and set closure per property,
// but share them all instead


var descriptors = {};

function proxyProperty(draft, prop, enumerable) {
  var desc = descriptors[prop];

  if (desc) {
    desc.enumerable = enumerable;
  } else {
    descriptors[prop] = desc = {
      configurable: true,
      enumerable: enumerable,

      get: function get$1$1() {
        return get$1(this[DRAFT_STATE], prop);
      },

      set: function set$1(value) {
        set(this[DRAFT_STATE], prop, value);
      }

    };
  }

  Object.defineProperty(draft, prop, desc);
}

function proxyMap(target) {
  Object.defineProperties(target, mapTraps);

  if (hasSymbol) {
    Object.defineProperty(target, Symbol.iterator, proxyMethod(iterateMapValues));
  }
}

var mapTraps = finalizeTraps({
  size: function (state) { return latest$1(state).size; },
  has: function (state) { return function (key) { return latest$1(state).has(key); }; },
  set: function (state) { return function (key, value) {
    if (latest$1(state).get(key) !== value) {
      prepareCopy(state);
      markChanged(state);
      state.assigned.set(key, true);
      state.copy.set(key, value);
    }

    return state.draft;
  }; },
  delete: function (state) { return function (key) {
    prepareCopy(state);
    markChanged(state);
    state.assigned.set(key, false);
    state.copy.delete(key);
    return false;
  }; },
  clear: function (state) { return function () {
    if (!state.copy) {
      prepareCopy(state);
    }

    markChanged(state);
    state.assigned = new Map();

    for (var i = 0, list = latest$1(state).keys(); i < list.length; i += 1) {
      var key = list[i];

      state.assigned.set(key, false);
    }

    return state.copy.clear();
  }; },
  forEach: function (state, key, reciever) { return function (cb) {
    latest$1(state).forEach(function (value, key, map) {
      cb(reciever.get(key), key, map);
    });
  }; },
  get: function (state) { return function (key) {
    var value = latest$1(state).get(key);

    if (state.finalizing || state.finalized || !isDraftable(value)) {
      return value;
    }

    if (value !== state.base.get(key)) {
      return value;
    }

    var draft = createProxy(value, state);
    prepareCopy(state);
    state.copy.set(key, draft);
    return draft;
  }; },
  keys: function (state) { return function () { return latest$1(state).keys(); }; },
  values: iterateMapValues,
  entries: iterateMapValues
});

function proxySet(target) {
  Object.defineProperties(target, setTraps);

  if (hasSymbol) {
    Object.defineProperty(target, Symbol.iterator, proxyMethod(iterateSetValues));
  }
}

var iterateSetValues = makeIterateSetValues(createProxy);
var setTraps = finalizeTraps({
  size: function (state) {
    return latest$1(state).size;
  },
  add: function (state) { return function (value) {
    if (!latest$1(state).has(value)) {
      markChanged(state);

      if (!state.copy) {
        prepareCopy(state);
      }

      state.copy.add(value);
    }

    return state.draft;
  }; },
  delete: function (state) { return function (value) {
    markChanged(state);

    if (!state.copy) {
      prepareCopy(state);
    }

    return state.copy.delete(value);
  }; },
  has: function (state) { return function (key) {
    return latest$1(state).has(key);
  }; },
  clear: function (state) { return function () {
    markChanged(state);

    if (!state.copy) {
      prepareCopy(state);
    }

    return state.copy.clear();
  }; },
  keys: iterateSetValues,
  entries: iterateSetValues,
  values: iterateSetValues,
  forEach: function (state) { return function (cb, thisArg) {
    var iterator = iterateSetValues(state)();
    var result = iterator.next();

    while (!result.done) {
      cb.call(thisArg, result.value, result.value, state.draft);
      result = iterator.next();
    }
  }; }
});

function finalizeTraps(traps) {
  return Object.keys(traps).reduce(function (acc, key) {
    var builder = key === "size" ? proxyAttr : proxyMethod;
    acc[key] = builder(traps[key], key);
    return acc;
  }, {});
}

function proxyAttr(fn) {
  return {
    get: function get() {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);
      return fn(state);
    }

  };
}

function proxyMethod(trap, key) {
  return {
    get: function get() {
      return function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        return trap(state, key, state.draft).apply(void 0, args);
      };
    }

  };
}

function assertUnrevoked(state) {
  if (state.revoked === true) { throw new Error("Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + JSON.stringify(latest$1(state))); }
} // This looks expensive, but only proxies are visited, and only objects without known changes are scanned.


function markChangesSweep(drafts) {
  // The natural order of drafts in the `scope` array is based on when they
  // were accessed. By processing drafts in reverse natural order, we have a
  // better chance of processing leaf nodes first. When a leaf node is known to
  // have changed, we can avoid any traversal of its ancestor nodes.
  for (var i = drafts.length - 1; i >= 0; i--) {
    var state = drafts[i][DRAFT_STATE];

    if (!state.modified) {
      if (Array.isArray(state.base)) {
        if (hasArrayChanges(state)) { markChanged(state); }
      } else if (isMap(state.base)) {
        if (hasMapChanges(state)) { markChanged(state); }
      } else if (isSet(state.base)) {
        if (hasSetChanges(state)) { markChanged(state); }
      } else if (hasObjectChanges(state)) {
        markChanged(state);
      }
    }
  }
}

function markChangesRecursively(object) {
  if (!object || typeof object !== "object") { return; }
  var state = object[DRAFT_STATE];
  if (!state) { return; }
  var base = state.base;
  var draft = state.draft;
  var assigned = state.assigned;

  if (!Array.isArray(object)) {
    // Look for added keys.
    Object.keys(draft).forEach(function (key) {
      // The `undefined` check is a fast path for pre-existing keys.
      if (base[key] === undefined && !has(base, key)) {
        assigned[key] = true;
        markChanged(state);
      } else if (!assigned[key]) {
        // Only untouched properties trigger recursion.
        markChangesRecursively(draft[key]);
      }
    }); // Look for removed keys.

    Object.keys(base).forEach(function (key) {
      // The `undefined` check is a fast path for pre-existing keys.
      if (draft[key] === undefined && !has(draft, key)) {
        assigned[key] = false;
        markChanged(state);
      }
    });
  } else if (hasArrayChanges(state)) {
    markChanged(state);
    assigned.length = true;

    if (draft.length < base.length) {
      for (var i = draft.length; i < base.length; i++) { assigned[i] = false; }
    } else {
      for (var i$1 = base.length; i$1 < draft.length; i$1++) { assigned[i$1] = true; }
    }

    for (var i$2 = 0; i$2 < draft.length; i$2++) {
      // Only untouched indices trigger recursion.
      if (assigned[i$2] === undefined) { markChangesRecursively(draft[i$2]); }
    }
  }
}

function hasObjectChanges(state) {
  var base = state.base;
  var draft = state.draft; // Search for added keys and changed keys. Start at the back, because
  // non-numeric keys are ordered by time of definition on the object.

  var keys = Object.keys(draft);

  for (var i = keys.length - 1; i >= 0; i--) {
    var key = keys[i];
    var baseValue = base[key]; // The `undefined` check is a fast path for pre-existing keys.

    if (baseValue === undefined && !has(base, key)) {
      return true;
    } // Once a base key is deleted, future changes go undetected, because its
    // descriptor is erased. This branch detects any missed changes.
    else {
      var value = draft[key];
      var state$1 = value && value[DRAFT_STATE];

      if (state$1 ? state$1.base !== baseValue : !is(value, baseValue)) {
        return true;
      }
    }
  } // At this point, no keys were added or changed.
  // Compare key count to determine if keys were deleted.


  return keys.length !== Object.keys(base).length;
}

function hasArrayChanges(state) {
  var draft = state.draft;
  if (draft.length !== state.base.length) { return true; } // See #116
  // If we first shorten the length, our array interceptors will be removed.
  // If after that new items are added, result in the same original length,
  // those last items will have no intercepting property.
  // So if there is no own descriptor on the last position, we know that items were removed and added
  // N.B.: splice, unshift, etc only shift values around, but not prop descriptors, so we only have to check
  // the last one

  var descriptor = Object.getOwnPropertyDescriptor(draft, draft.length - 1); // descriptor can be null, but only for newly created sparse arrays, eg. new Array(10)

  if (descriptor && !descriptor.get) { return true; } // For all other cases, we don't have to compare, as they would have been picked up by the index setters

  return false;
}

function hasMapChanges(state) {
  var base = state.base;
  var draft = state.draft;
  if (base.size !== draft.size) { return true; } // IE11 supports only forEach iteration

  var hasChanges = false;
  draft.forEach(function (value, key) {
    if (!hasChanges) {
      hasChanges = isDraftable(value) ? value.modified : value !== base.get(key);
    }
  });
  return hasChanges;
}

function hasSetChanges(state) {
  var base = state.base;
  var draft = state.draft;
  if (base.size !== draft.size) { return true; } // IE11 supports only forEach iteration

  var hasChanges = false;
  draft.forEach(function (value, key) {
    if (!hasChanges) {
      hasChanges = isDraftable(value) ? value.modified : !base.has(key);
    }
  });
  return hasChanges;
}

function createHiddenProperty(target, prop, value) {
  Object.defineProperty(target, prop, {
    value: value,
    enumerable: false,
    writable: true
  });
}

var legacyProxy = /*#__PURE__*/Object.freeze({
  willFinalize: willFinalize,
  createProxy: createProxy
});

var obj$1, obj$1$1;

function willFinalize$1() {}
/**
 * Returns a new draft of the `base` object.
 *
 * The second argument is the parent draft-state (used internally).
 */

function createProxy$1(base, parent) {
  var scope = parent ? parent.scope : ImmerScope.current;
  var state = {
    // Track which produce call this is associated with.
    scope: scope,
    // True for both shallow and deep changes.
    modified: false,
    // Used during finalization.
    finalized: false,
    // Track which properties have been assigned (true) or deleted (false).
    assigned: {},
    // The parent draft state.
    parent: parent,
    // The base state.
    base: base,
    // The base proxy.
    draft: null,
    // Any property proxies.
    drafts: {},
    // The base copy with any updated values.
    copy: null,
    // Called by the `produce` function.
    revoke: null
  };
  var target = state;
  var traps = objectTraps;

  if (Array.isArray(base)) {
    target = [state];
    traps = arrayTraps;
  } // Map drafts must support object keys, so we use Map objects to track changes.
  else if (isMap(base)) {
    traps = mapTraps$1;
    state.drafts = new Map();
    state.assigned = new Map();
  } // Set drafts use a Map object to track which of its values are drafted.
  // And we don't need the "assigned" property, because Set objects have no keys.
  else if (isSet(base)) {
    traps = setTraps$1;
    state.drafts = new Map();
  }

  var ref = Proxy.revocable(target, traps);
  var revoke = ref.revoke;
  var proxy = ref.proxy;
  state.draft = proxy;
  state.revoke = revoke;
  scope.drafts.push(proxy);
  return proxy;
}
/**
 * Object drafts
 */

var objectTraps = {
  get: function get(state, prop) {
    if (prop === DRAFT_STATE) { return state; }
    var drafts = state.drafts; // Check for existing draft in unmodified state.

    if (!state.modified && has(drafts, prop)) {
      return drafts[prop];
    }

    var value = latest$2(state)[prop];

    if (state.finalized || !isDraftable(value)) {
      return value;
    } // Check for existing draft in modified state.


    if (state.modified) {
      // Assigned values are never drafted. This catches any drafts we created, too.
      if (value !== peek$1(state.base, prop)) { return value; } // Store drafts on the copy (when one exists).

      drafts = state.copy;
    }

    return drafts[prop] = createProxy$1(value, state);
  },

  has: function has(state, prop) {
    return prop in latest$2(state);
  },

  ownKeys: function ownKeys(state) {
    return Reflect.ownKeys(latest$2(state));
  },

  set: function set(state, prop, value) {
    if (!state.modified) {
      var baseValue = peek$1(state.base, prop); // Optimize based on value's truthiness. Truthy values are guaranteed to
      // never be undefined, so we can avoid the `in` operator. Lastly, truthy
      // values may be drafts, but falsy values are never drafts.

      var isUnchanged = value ? is(baseValue, value) || value === state.drafts[prop] : is(baseValue, value) && prop in state.base;
      if (isUnchanged) { return true; }
      markChanged$1(state);
    }

    state.assigned[prop] = true;
    state.copy[prop] = value;
    return true;
  },

  deleteProperty: function deleteProperty(state, prop) {
    // The `undefined` check is a fast path for pre-existing keys.
    if (peek$1(state.base, prop) !== undefined || prop in state.base) {
      state.assigned[prop] = false;
      markChanged$1(state);
    } else if (state.assigned[prop]) {
      // if an originally not assigned property was deleted
      delete state.assigned[prop];
    }

    if (state.copy) { delete state.copy[prop]; }
    return true;
  },

  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(state, prop) {
    var owner = latest$2(state);
    var desc = Reflect.getOwnPropertyDescriptor(owner, prop);

    if (desc) {
      desc.writable = true;
      desc.configurable = !Array.isArray(owner) || prop !== "length";
    }

    return desc;
  },

  defineProperty: function defineProperty() {
    throw new Error("Object.defineProperty() cannot be used on an Immer draft"); // prettier-ignore
  },

  getPrototypeOf: function getPrototypeOf(state) {
    return Object.getPrototypeOf(state.base);
  },

  setPrototypeOf: function setPrototypeOf() {
    throw new Error("Object.setPrototypeOf() cannot be used on an Immer draft"); // prettier-ignore
  }

};
/**
 * Array drafts
 */

var arrayTraps = {};
each(objectTraps, function (key, fn) {
  arrayTraps[key] = function () {
    arguments[0] = arguments[0][0];
    return fn.apply(this, arguments);
  };
});

arrayTraps.deleteProperty = function (state, prop) {
  if (isNaN(parseInt(prop))) {
    throw new Error("Immer only supports deleting array indices"); // prettier-ignore
  }

  return objectTraps.deleteProperty.call(this, state[0], prop);
};

arrayTraps.set = function (state, prop, value) {
  if (prop !== "length" && isNaN(parseInt(prop))) {
    throw new Error("Immer only supports setting array indices and the 'length' property"); // prettier-ignore
  }

  return objectTraps.set.call(this, state[0], prop, value);
}; // Used by Map and Set drafts


var reflectTraps = makeReflectTraps(["ownKeys", "has", "set", "deleteProperty", "defineProperty", "getOwnPropertyDescriptor", "preventExtensions", "isExtensible", "getPrototypeOf"]);
/**
 * Map drafts
 */

var mapTraps$1 = makeTrapsForGetters(( obj$1 = {}, obj$1[DRAFT_STATE] = function (state) { return state; }, obj$1.size = function (state) { return latest$2(state).size; }, obj$1.has = function (state) { return function (key) { return latest$2(state).has(key); }; }, obj$1.set = function (state) { return function (key, value) {
  var values = latest$2(state);

  if (!values.has(key) || values.get(key) !== value) {
    markChanged$1(state);
    state.assigned.set(key, true);
    state.copy.set(key, value);
  }

  return state.draft;
}; }, obj$1.delete = function (state) { return function (key) {
  if (latest$2(state).has(key)) {
    markChanged$1(state);
    state.assigned.set(key, false);
    return state.copy.delete(key);
  }

  return false;
}; }, obj$1.clear = function (state) { return function () {
  markChanged$1(state);
  state.assigned = new Map();

  for (var i = 0, list = latest$2(state).keys(); i < list.length; i += 1) {
    var key = list[i];

    state.assigned.set(key, false);
  }

  return state.copy.clear();
}; }, obj$1.forEach = function (state, _, receiver) { return function (cb, thisArg) { return latest$2(state).forEach(function (_, key, map) {
  var value = receiver.get(key);
  cb.call(thisArg, value, key, map);
}); }; }, obj$1.get = function (state) { return function (key) {
  var drafts = state[state.modified ? "copy" : "drafts"];

  if (drafts.has(key)) {
    return drafts.get(key);
  }

  var value = latest$2(state).get(key);

  if (state.finalized || !isDraftable(value)) {
    return value;
  }

  var draft = createProxy$1(value, state);
  drafts.set(key, draft);
  return draft;
}; }, obj$1.keys = function (state) { return function () { return latest$2(state).keys(); }; }, obj$1.values = iterateMapValues, obj$1.entries = iterateMapValues, obj$1[hasSymbol ? Symbol.iterator : "@@iterator"] = iterateMapValues, obj$1 ));
var iterateSetValues$1 = makeIterateSetValues(createProxy$1);
/**
 * Set drafts
 */

var setTraps$1 = makeTrapsForGetters(( obj$1$1 = {}, obj$1$1[DRAFT_STATE] = function (state) { return state; }, obj$1$1.size = function (state) { return latest$2(state).size; }, obj$1$1.has = function (state) { return function (key) { return latest$2(state).has(key); }; }, obj$1$1.add = function (state) { return function (value) {
  if (!latest$2(state).has(value)) {
    markChanged$1(state);
    state.copy.add(value);
  }

  return state.draft;
}; }, obj$1$1.delete = function (state) { return function (value) {
  markChanged$1(state);
  return state.copy.delete(value);
}; }, obj$1$1.clear = function (state) { return function () {
  markChanged$1(state);
  return state.copy.clear();
}; }, obj$1$1.forEach = function (state) { return function (cb, thisArg) {
  var iterator = iterateSetValues$1(state)();
  var result = iterator.next();

  while (!result.done) {
    cb.call(thisArg, result.value, result.value, state.draft);
    result = iterator.next();
  }
}; }, obj$1$1.keys = iterateSetValues$1, obj$1$1.values = iterateSetValues$1, obj$1$1.entries = iterateSetValues$1, obj$1$1[hasSymbol ? Symbol.iterator : "@@iterator"] = iterateSetValues$1, obj$1$1 ));
/**
 * Helpers
 */
// Retrieve the latest values of the draft.

function latest$2(state) {
  return state.copy || state.base;
} // Access a property without creating an Immer draft.


function peek$1(draft, prop) {
  var state = draft[DRAFT_STATE];
  var desc = Reflect.getOwnPropertyDescriptor(state ? latest$2(state) : draft, prop);
  return desc && desc.value;
}

function markChanged$1(state) {
  if (!state.modified) {
    state.modified = true;
    var base = state.base;
    var drafts = state.drafts;
    var parent = state.parent;
    var copy = shallowCopy(base);

    if (isSet(base)) {
      // Note: The `drafts` property is preserved for Set objects, since
      // we need to keep track of which values are drafted.
      assignSet(copy, drafts);
    } else {
      // Merge nested drafts into the copy.
      if (isMap(base)) { assignMap(copy, drafts); }else { assign(copy, drafts); }
      state.drafts = null;
    }

    state.copy = copy;

    if (parent) {
      markChanged$1(parent);
    }
  }
}
/** Create traps that all use the `Reflect` API on the `latest(state)` */


function makeReflectTraps(names) {
  return names.reduce(function (traps, name) {
    traps[name] = function (state) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      return Reflect[name].apply(Reflect, [ latest$2(state) ].concat( args ));
    };

    return traps;
  }, {});
}

function makeTrapsForGetters(getters) {
  return Object.assign({}, reflectTraps, {
    get: function get(state, prop, receiver) {
      return getters.hasOwnProperty(prop) ? getters[prop](state, prop, receiver) : Reflect.get(state, prop, receiver);
    },

    setPrototypeOf: function setPrototypeOf(state) {
      throw new Error("Object.setPrototypeOf() cannot be used on an Immer draft"); // prettier-ignore
    }

  });
}

var modernProxy = /*#__PURE__*/Object.freeze({
  willFinalize: willFinalize$1,
  createProxy: createProxy$1
});

function generatePatches(state, basePath, patches, inversePatches) {
  var generatePatchesFn = Array.isArray(state.base) ? generateArrayPatches : isSet(state.base) ? generateSetPatches : generatePatchesFromAssigned;
  generatePatchesFn(state, basePath, patches, inversePatches);
}

function generateArrayPatches(state, basePath, patches, inversePatches) {
  var assign, assign$1;

  var base = state.base;
  var copy = state.copy;
  var assigned = state.assigned; // Reduce complexity by ensuring `base` is never longer.

  if (copy.length < base.length) {
    (assign = [copy, base], base = assign[0], copy = assign[1]);
    (assign$1 = [inversePatches, patches], patches = assign$1[0], inversePatches = assign$1[1]);
  }

  var delta = copy.length - base.length; // Find the first replaced index.

  var start = 0;

  while (base[start] === copy[start] && start < base.length) {
    ++start;
  } // Find the last replaced index. Search from the end to optimize splice patches.


  var end = base.length;

  while (end > start && base[end - 1] === copy[end + delta - 1]) {
    --end;
  } // Process replaced indices.


  for (var i = start; i < end; ++i) {
    if (assigned[i] && copy[i] !== base[i]) {
      var path = basePath.concat([i]);
      patches.push({
        op: "replace",
        path: path,
        value: copy[i]
      });
      inversePatches.push({
        op: "replace",
        path: path,
        value: base[i]
      });
    }
  }

  var replaceCount = patches.length; // Process added indices.

  for (var i$1 = end + delta - 1; i$1 >= end; --i$1) {
    var path$1 = basePath.concat([i$1]);
    patches[replaceCount + i$1 - end] = {
      op: "add",
      path: path$1,
      value: copy[i$1]
    };
    inversePatches.push({
      op: "remove",
      path: path$1
    });
  }
} // This is used for both Map objects and normal objects.


function generatePatchesFromAssigned(state, basePath, patches, inversePatches) {
  var base = state.base;
  var copy = state.copy;
  each(state.assigned, function (key, assignedValue) {
    var origValue = get(base, key);
    var value = get(copy, key);
    var op = !assignedValue ? "remove" : has(base, key) ? "replace" : "add";
    if (origValue === value && op === "replace") { return; }
    var path = basePath.concat(key);
    patches.push(op === "remove" ? {
      op: op,
      path: path
    } : {
      op: op,
      path: path,
      value: value
    });
    inversePatches.push(op === "add" ? {
      op: "remove",
      path: path
    } : op === "remove" ? {
      op: "add",
      path: path,
      value: origValue
    } : {
      op: "replace",
      path: path,
      value: origValue
    });
  });
}

function generateSetPatches(state, basePath, patches, inversePatches) {
  var base = state.base;
  var copy = state.copy;
  var i = 0;

  for (var i$1 = 0, list = base; i$1 < list.length; i$1 += 1) {
    var value = list[i$1];

    if (!copy.has(value)) {
      var path = basePath.concat([i]);
      patches.push({
        op: "remove",
        path: path,
        value: value
      });
      inversePatches.unshift({
        op: "add",
        path: path,
        value: value
      });
    }

    i++;
  }

  i = 0;

  for (var i$2 = 0, list$1 = copy; i$2 < list$1.length; i$2 += 1) {
    var value$1 = list$1[i$2];

    if (!base.has(value$1)) {
      var path$1 = basePath.concat([i]);
      patches.push({
        op: "add",
        path: path$1,
        value: value$1
      });
      inversePatches.unshift({
        op: "remove",
        path: path$1,
        value: value$1
      });
    }

    i++;
  }
}

var applyPatches = function (draft, patches) {
  for (var i$1 = 0, list = patches; i$1 < list.length; i$1 += 1) {
    var patch = list[i$1];

    var path = patch.path;
    var op = patch.op;
    if (!path.length) { throw new Error("Illegal state"); }
    var base = draft;

    for (var i = 0; i < path.length - 1; i++) {
      base = get(base, path[i]);
      if (!base || typeof base !== "object") { throw new Error("Cannot apply patch, path doesn't resolve: " + path.join("/")); } // prettier-ignore
    }

    var value = clone(patch.value); // used to clone patch to ensure original patch is not modified, see #411

    var key = path[path.length - 1];

    switch (op) {
      case "replace":
        if (isMap(base)) {
          base.set(key, value);
        } else if (isSet(base)) {
          throw new Error('Sets cannot have "replace" patches.');
        } else {
          // if value is an object, then it's assigned by reference
          // in the following add or remove ops, the value field inside the patch will also be modifyed
          // so we use value from the cloned patch
          base[key] = value;
        }

        break;

      case "add":
        if (isSet(base)) {
          base.delete(patch.value);
        }

        Array.isArray(base) ? base.splice(key, 0, value) : isMap(base) ? base.set(key, value) : isSet(base) ? base.add(value) : base[key] = value;
        break;

      case "remove":
        Array.isArray(base) ? base.splice(key, 1) : isMap(base) ? base.delete(key) : isSet(base) ? base.delete(patch.value) : delete base[key];
        break;

      default:
        throw new Error("Unsupported patch operation: " + op);
    }
  }

  return draft;
};

function verifyMinified() {}

var configDefaults = {
  useProxies: typeof Proxy !== "undefined" && typeof Proxy.revocable !== "undefined" && typeof Reflect !== "undefined",
  autoFreeze: typeof process !== "undefined" ? process.env.NODE_ENV !== "production" : verifyMinified.name === "verifyMinified",
  onAssign: null,
  onDelete: null,
  onCopy: null
};
var Immer = function Immer(config) {
  assign(this, configDefaults, config);
  this.setUseProxies(this.useProxies);
  this.produce = this.produce.bind(this);
  this.produceWithPatches = this.produceWithPatches.bind(this);
};

Immer.prototype.produce = function produce (base, recipe, patchListener) {
  var this$1 = this;

  // curried invocation
  if (typeof base === "function" && typeof recipe !== "function") {
    var defaultBase = recipe;
    recipe = base;
    var self = this;
    return function curriedProduce(base) {
      var this$1 = this;
      if ( base === void 0 ) base = defaultBase;
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      return self.produce(base, function (draft) { return recipe.call.apply(recipe, [ this$1, draft ].concat( args )); }); // prettier-ignore
    };
  } // prettier-ignore


  {
    if (typeof recipe !== "function") {
      throw new Error("The first or second argument to `produce` must be a function");
    }

    if (patchListener !== undefined && typeof patchListener !== "function") {
      throw new Error("The third argument to `produce` must be a function or undefined");
    }
  }
  var result; // Only plain objects, arrays, and "immerable classes" are drafted.

  if (isDraftable(base)) {
    var scope = ImmerScope.enter();
    var proxy = this.createProxy(base);
    var hasError = true;

    try {
      result = recipe(proxy);
      hasError = false;
    } finally {
      // finally instead of catch + rethrow better preserves original stack
      if (hasError) { scope.revoke(); }else { scope.leave(); }
    }

    if (typeof Promise !== "undefined" && result instanceof Promise) {
      return result.then(function (result) {
        scope.usePatches(patchListener);
        return this$1.processResult(result, scope);
      }, function (error) {
        scope.revoke();
        throw error;
      });
    }

    scope.usePatches(patchListener);
    return this.processResult(result, scope);
  } else {
    result = recipe(base);
    if (result === NOTHING) { return undefined; }
    if (result === undefined) { result = base; }
    this.maybeFreeze(result, true);
    return result;
  }
};

Immer.prototype.produceWithPatches = function produceWithPatches (arg1, arg2, arg3) {
  var this$1 = this;

  if (typeof arg1 === "function") {
    return function (state) {
      var args = [], len = arguments.length - 1;
      while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

      return this$1.produceWithPatches(state, function (draft) { return arg1.apply(void 0, [ draft ].concat( args )); });
    };
  } // non-curried form


  if (arg3) { throw new Error("A patch listener cannot be passed to produceWithPatches"); }
  var patches, inversePatches;
  var nextState = this.produce(arg1, arg2, function (p, ip) {
    patches = p;
    inversePatches = ip;
  });
  return [nextState, patches, inversePatches];
};

Immer.prototype.createDraft = function createDraft (base) {
  if (!isDraftable(base)) {
    throw new Error("First argument to `createDraft` must be a plain object, an array, or an immerable object"); // prettier-ignore
  }

  var scope = ImmerScope.enter();
  var proxy = this.createProxy(base);
  proxy[DRAFT_STATE].isManual = true;
  scope.leave();
  return proxy;
};

Immer.prototype.finishDraft = function finishDraft (draft, patchListener) {
  var state = draft && draft[DRAFT_STATE];

  if (!state || !state.isManual) {
    throw new Error("First argument to `finishDraft` must be a draft returned by `createDraft`"); // prettier-ignore
  }

  if (state.finalized) {
    throw new Error("The given draft is already finalized"); // prettier-ignore
  }

  var scope = state.scope;
  scope.usePatches(patchListener);
  return this.processResult(undefined, scope);
};

Immer.prototype.setAutoFreeze = function setAutoFreeze (value) {
  this.autoFreeze = value;
};

Immer.prototype.setUseProxies = function setUseProxies (value) {
  this.useProxies = value;
  assign(this, value ? modernProxy : legacyProxy);
};

Immer.prototype.applyPatches = function applyPatches$1 (base, patches) {
  // If a patch replaces the entire state, take that replacement as base
  // before applying patches
  var i;

  for (i = patches.length - 1; i >= 0; i--) {
    var patch = patches[i];

    if (patch.path.length === 0 && patch.op === "replace") {
      base = patch.value;
      break;
    }
  }

  if (isDraft(base)) {
    // N.B: never hits if some patch a replacement, patches are never drafts
    return applyPatches(base, patches);
  } // Otherwise, produce a copy of the base state.


  return this.produce(base, function (draft) { return applyPatches(draft, patches.slice(i + 1)); });
};
/** @internal */


Immer.prototype.processResult = function processResult (result, scope) {
  var baseDraft = scope.drafts[0];
  var isReplaced = result !== undefined && result !== baseDraft;
  this.willFinalize(scope, result, isReplaced);

  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified) {
      scope.revoke();
      throw new Error("An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft."); // prettier-ignore
    }

    if (isDraftable(result)) {
      // Finalize the result in case it contains (or is) a subset of the draft.
      result = this.finalize(result, null, scope);
      this.maybeFreeze(result);
    }

    if (scope.patches) {
      scope.patches.push({
        op: "replace",
        path: [],
        value: result
      });
      scope.inversePatches.push({
        op: "replace",
        path: [],
        value: baseDraft[DRAFT_STATE].base
      });
    }
  } else {
    // Finalize the base draft.
    result = this.finalize(baseDraft, [], scope);
  }

  scope.revoke();

  if (scope.patches) {
    scope.patchListener(scope.patches, scope.inversePatches);
  }

  return result !== NOTHING ? result : undefined;
};
/**
 * @internal
 * Finalize a draft, returning either the unmodified base state or a modified
 * copy of the base state.
 */


Immer.prototype.finalize = function finalize (draft, path, scope) {
  var this$1 = this;

  var state = draft[DRAFT_STATE];

  if (!state) {
    if (Object.isFrozen(draft)) { return draft; }
    return this.finalizeTree(draft, null, scope);
  } // Never finalize drafts owned by another scope.


  if (state.scope !== scope) {
    return draft;
  }

  if (!state.modified) {
    this.maybeFreeze(state.base, true);
    return state.base;
  }

  if (!state.finalized) {
    state.finalized = true;
    this.finalizeTree(state.draft, path, scope); // We cannot really delete anything inside of a Set. We can only replace the whole Set.

    if (this.onDelete && !isSet(state.base)) {
      // The `assigned` object is unreliable with ES5 drafts.
      if (this.useProxies) {
        var assigned = state.assigned;
        each(assigned, function (prop, exists) {
          if (!exists) { this$1.onDelete(state, prop); }
        });
      } else {
        // TODO: Figure it out for Maps and Sets if we need to support ES5
        var base = state.base;
        var copy = state.copy;
        each(base, function (prop) {
          if (!has(copy, prop)) { this$1.onDelete(state, prop); }
        });
      }
    }

    if (this.onCopy) {
      this.onCopy(state);
    } // At this point, all descendants of `state.copy` have been finalized,
    // so we can be sure that `scope.canAutoFreeze` is accurate.


    if (this.autoFreeze && scope.canAutoFreeze) {
      freeze(state.copy, false);
    }

    if (path && scope.patches) {
      generatePatches(state, path, scope.patches, scope.inversePatches);
    }
  }

  return state.copy;
};
/**
 * @internal
 * Finalize all drafts in the given state tree.
 */


Immer.prototype.finalizeTree = function finalizeTree (root, rootPath, scope) {
  var this$1 = this;

  var state = root[DRAFT_STATE];

  if (state) {
    if (!this.useProxies) {
      // Create the final copy, with added keys and without deleted keys.
      state.copy = shallowCopy(state.draft, true);
    }

    root = state.copy;
  }

  var needPatches = !!rootPath && !!scope.patches;

  var finalizeProperty = function (prop, value, parent) {
    if (value === parent) {
      throw Error("Immer forbids circular references");
    } // In the `finalizeTree` method, only the `root` object may be a draft.


    var isDraftProp = !!state && parent === root;
    var isSetMember = isSet(parent);

    if (isDraft(value)) {
      var path = isDraftProp && needPatches && !isSetMember && // Set objects are atomic since they have no keys.
      !has(state.assigned, prop) // Skip deep patches for assigned keys.
        ? rootPath.concat(prop) : null; // Drafts owned by `scope` are finalized here.

      value = this$1.finalize(value, path, scope);
      replace(parent, prop, value); // Drafts from another scope must prevent auto-freezing.

      if (isDraft(value)) {
        scope.canAutoFreeze = false;
      } // Unchanged drafts are never passed to the `onAssign` hook.


      if (isDraftProp && value === get(state.base, prop)) { return; }
    } // Unchanged draft properties are ignored.
    else if (isDraftProp && is(value, get(state.base, prop))) {
      return;
    } // Search new objects for unfinalized drafts. Frozen objects should never contain drafts.
    else if (isDraftable(value) && !Object.isFrozen(value)) {
      each(value, finalizeProperty);
      this$1.maybeFreeze(value);
    }

    if (isDraftProp && this$1.onAssign && !isSetMember) {
      this$1.onAssign(state, prop, value);
    }
  };

  each(root, finalizeProperty);
  return root;
};

Immer.prototype.maybeFreeze = function maybeFreeze (value, deep) {
  if ( deep === void 0 ) deep = false;

  if (this.autoFreeze && !isDraft(value)) {
    freeze(value, deep);
  }
};

function replace(parent, prop, value) {
  if (isMap(parent)) {
    parent.set(prop, value);
  } else if (isSet(parent)) {
    // In this case, the `prop` is actually a draft.
    parent.delete(prop);
    parent.add(value);
  } else if (Array.isArray(parent) || isEnumerable(parent, prop)) {
    // Preserve non-enumerable properties.
    parent[prop] = value;
  } else {
    Object.defineProperty(parent, prop, {
      value: value,
      writable: true,
      configurable: true
    });
  }
}

var immer = new Immer();
/**
 * The `produce` function takes a value and a "recipe function" (whose
 * return value often depends on the base state). The recipe function is
 * free to mutate its first argument however it wants. All mutations are
 * only ever applied to a __copy__ of the base state.
 *
 * Pass only a function to create a "curried producer" which relieves you
 * from passing the recipe function every time.
 *
 * Only plain objects and arrays are made mutable. All other objects are
 * considered uncopyable.
 *
 * Note: This function is __bound__ to its `Immer` instance.
 *
 * @param {any} base - the initial state
 * @param {Function} producer - function that receives a proxy of the base state as first argument and which can be freely modified
 * @param {Function} patchListener - optional function that will be called with all the patches produced here
 * @returns {any} a new state, or the initial state if nothing was modified
 */

var produce = immer.produce;
/**
 * Like `produce`, but `produceWithPatches` always returns a tuple
 * [nextState, patches, inversePatches] (instead of just the next state)
 */

var produceWithPatches = immer.produceWithPatches.bind(immer);
/**
 * Pass true to automatically freeze all copies created by Immer.
 *
 * By default, auto-freezing is disabled in production.
 */

var setAutoFreeze = immer.setAutoFreeze.bind(immer);
/**
 * Pass true to use the ES2015 `Proxy` class when creating drafts, which is
 * always faster than using ES5 proxies.
 *
 * By default, feature detection is used, so calling this is rarely necessary.
 */

var setUseProxies = immer.setUseProxies.bind(immer);
/**
 * Apply an array of Immer patches to the first argument.
 *
 * This function is a producer, which means copy-on-write is in effect.
 */

var applyPatches$1 = immer.applyPatches.bind(immer);
/**
 * Create an Immer draft from the given base state, which may be a draft itself.
 * The draft can be modified until you finalize it with the `finishDraft` function.
 */

var createDraft = immer.createDraft.bind(immer);
/**
 * Finalize an Immer draft from a `createDraft` call, returning the base state
 * (if no changes were made) or a modified copy. The draft must *not* be
 * mutated afterwards.
 *
 * Pass a function as the 2nd argument to generate Immer patches based on the
 * changes that were made.
 */

var finishDraft = immer.finishDraft.bind(immer);

/**
 * Holds information about the user, is a Redux reducer
 */
function AppReducer (state = {
  path: 'pray',
  language: 'English',
  verticalGridEnabled: false,
  bible: 'de4e12af7f28f599-02'
}, action) {
  return produce(state, nextState => {
    if (action.type === 'navigate') nextState.path = action.payload.path;
    if (action.type === 'set-language') nextState.language = action.payload.language;
    if (action.type === 'set-bible') nextState.bible = action.payload.bible;
    if (action.type === 'toggle-grid') nextState.verticalGridEnabled = !nextState.verticalGridEnabled;
  });
}

function Slugify(text) {
  return text
  .toString()                     // Cast to string
  .toLowerCase()                  // Convert the string to lowercase letters
  .normalize('NFD')       // The normalize() method returns the Unicode Normalization Form of a given string.
  .trim()                         // Remove whitespace from both sides of a string
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
  .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

const Content = {"Bibles":[{"id":"de4e12af7f28f599-02","dblId":"de4e12af7f28f599","relatedDbl":null,"name":"King James (Authorised) Version","nameLocal":"King James Version","abbreviation":"engKJV","abbreviationLocal":"KJV","description":"Protestant","descriptionLocal":"Protestant","language":{"id":"eng","name":"English","nameLocal":"English","script":"Latin","scriptDirection":"LTR"},"countries":[{"id":"GB","name":"United Kingdom","nameLocal":"United Kingdom"}],"type":"text","updatedAt":"2020-02-25T07:04:57.000Z","audioBibles":[],"books":[{"id":"GEN","bibleId":"de4e12af7f28f599-02","abbreviation":"Gen","name":"Genesis","nameLong":"The First Book of Moses, called Genesis"},{"id":"EXO","bibleId":"de4e12af7f28f599-02","abbreviation":"Exo","name":"Exodus","nameLong":"The Second Book of Moses, called Exodus"},{"id":"LEV","bibleId":"de4e12af7f28f599-02","abbreviation":"Lev","name":"Leviticus","nameLong":"The Third Book of Moses, called Leviticus"},{"id":"NUM","bibleId":"de4e12af7f28f599-02","abbreviation":"Num","name":"Numbers","nameLong":"The Fourth Book of Moses, called Numbers"},{"id":"DEU","bibleId":"de4e12af7f28f599-02","abbreviation":"Deu","name":"Deuteronomy","nameLong":"The Fifth Book of Moses, called Deuteronomy"},{"id":"JOS","bibleId":"de4e12af7f28f599-02","abbreviation":"Jos","name":"Joshua","nameLong":"The Book of Joshua"},{"id":"JDG","bibleId":"de4e12af7f28f599-02","abbreviation":"Jdg","name":"Judges","nameLong":"The Book of Judges"},{"id":"RUT","bibleId":"de4e12af7f28f599-02","abbreviation":"Rut","name":"Ruth","nameLong":"The Book of Ruth"},{"id":"1SA","bibleId":"de4e12af7f28f599-02","abbreviation":"1Sa","name":"1 Samuel","nameLong":"The First Book of Samuel Otherwise Called The First Book of the Kings"},{"id":"2SA","bibleId":"de4e12af7f28f599-02","abbreviation":"2Sa","name":"2 Samuel","nameLong":"The Second Book of Samuel Otherwise Called The Second Book of the Kings"},{"id":"1KI","bibleId":"de4e12af7f28f599-02","abbreviation":"1Ki","name":"1 Kings","nameLong":"The First Book of the Kings, Commonly Called the Third Book of the Kings"},{"id":"2KI","bibleId":"de4e12af7f28f599-02","abbreviation":"2Ki","name":"2 Kings","nameLong":"The Second Book of the Kings, Commonly Called the Fourth Book of the Kings"},{"id":"1CH","bibleId":"de4e12af7f28f599-02","abbreviation":"1Ch","name":"1 Chronicles","nameLong":"The First Book of the Chronicles"},{"id":"2CH","bibleId":"de4e12af7f28f599-02","abbreviation":"2Ch","name":"2 Chronicles","nameLong":"The Second Book of the Chronicles"},{"id":"EZR","bibleId":"de4e12af7f28f599-02","abbreviation":"Ezr","name":"Ezra","nameLong":"Ezra"},{"id":"NEH","bibleId":"de4e12af7f28f599-02","abbreviation":"Neh","name":"Nehemiah","nameLong":"The Book of Nehemiah"},{"id":"EST","bibleId":"de4e12af7f28f599-02","abbreviation":"Est","name":"Esther","nameLong":"The Book of Esther"},{"id":"JOB","bibleId":"de4e12af7f28f599-02","abbreviation":"Job","name":"Job","nameLong":"The Book of Job"},{"id":"PSA","bibleId":"de4e12af7f28f599-02","abbreviation":"Psa","name":"Psalms","nameLong":"The Book of Psalms","chapters":[{"id":"PSA.1","bibleId":"de4e12af7f28f599-02","number":"1","bookId":"PSA","reference":"Psalms 1","copyright":"PUBLIC DOMAIN except in the United Kingdom, where a Crown Copyright applies to printing the KJV. See http://www.cambridge.org/about-us/who-we-are/queens-printers-patent","content":"<p class=\"q1\"><span data-number=\"1\" class=\"v\">1</span>Blessed <span class=\"add\">is</span> the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.</p><p class=\"q1\"><span data-number=\"2\" class=\"v\">2</span>But his delight <span class=\"add\">is</span> in the law of the <span class=\"nd\">LORD</span>; and in his law doth he meditate day and night.</p><p class=\"q1\"><span data-number=\"3\" class=\"v\">3</span>And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper.</p><p class=\"b\"></p><p class=\"q1\"><span data-number=\"4\" class=\"v\">4</span>The ungodly <span class=\"add\">are</span> not so: but <span class=\"add\">are</span> like the chaff which the wind driveth away.</p><p class=\"q1\"><span data-number=\"5\" class=\"v\">5</span>Therefore the ungodly shall not stand in the judgment, nor sinners in the congregation of the righteous.</p><p class=\"q1\"><span data-number=\"6\" class=\"v\">6</span>For the <span class=\"nd\">LORD</span> knoweth the way of the righteous: but the way of the ungodly shall perish.</p>","next":{"id":"PSA.2","number":"2","bookId":"PSA"},"previous":{"id":"PSA.intro","number":"intro","bookId":"PSA"}},{"id":"PSA.2","bibleId":"de4e12af7f28f599-02","number":"2","bookId":"PSA","reference":"Psalms 2","copyright":"PUBLIC DOMAIN except in the United Kingdom, where a Crown Copyright applies to printing the KJV. See http://www.cambridge.org/about-us/who-we-are/queens-printers-patent","content":"<p class=\"q1\"><span data-number=\"1\" class=\"v\">1</span>Why do the heathen rage, and the people imagine a vain thing?</p><p class=\"q1\"><span data-number=\"2\" class=\"v\">2</span>The kings of the earth set themselves, and the rulers take counsel together, against the <span class=\"nd\">LORD</span>, and against his anointed, <span class=\"add\">saying</span>,</p><p class=\"q1\"><span data-number=\"3\" class=\"v\">3</span>Let us break their bands asunder, and cast away their cords from us.</p><p class=\"q1\"><span data-number=\"4\" class=\"v\">4</span>He that sitteth in the heavens shall laugh: the Lord shall have them in derision.</p><p class=\"q1\"><span data-number=\"5\" class=\"v\">5</span>Then shall he speak unto them in his wrath, and vex them in his sore displeasure.</p><p class=\"q1\"><span data-number=\"6\" class=\"v\">6</span>Yet have I set my king upon my holy hill of Zion.</p><p class=\"b\"></p><p class=\"q1\"><span data-number=\"7\" class=\"v\">7</span>I will declare the decree: the <span class=\"nd\">LORD</span> hath said unto me, Thou <span class=\"add\">art</span> my Son; this day have I begotten thee.</p><p class=\"q1\"><span data-number=\"8\" class=\"v\">8</span>Ask of me, and I shall give <span class=\"add\">thee</span> the heathen <span class=\"add\">for</span> thine inheritance, and the uttermost parts of the earth <span class=\"add\">for</span> thy possession.</p><p class=\"q1\"><span data-number=\"9\" class=\"v\">9</span>Thou shalt break them with a rod of iron; thou shalt dash them in pieces like a potter’s vessel.</p><p class=\"b\"></p><p class=\"q1\"><span data-number=\"10\" class=\"v\">10</span>Be wise now therefore, O ye kings: be instructed, ye judges of the earth.</p><p class=\"q1\"><span data-number=\"11\" class=\"v\">11</span>Serve the <span class=\"nd\">LORD</span> with fear, and rejoice with trembling.</p><p class=\"q1\"><span data-number=\"12\" class=\"v\">12</span>Kiss the Son, lest he be angry, and ye perish <span class=\"add\">from</span> the way, when his wrath is kindled but a little. Blessed <span class=\"add\">are</span> all they that put their trust in him.</p>","next":{"id":"PSA.3","number":"3","bookId":"PSA"},"previous":{"id":"PSA.1","number":"1","bookId":"PSA"}}]},{"id":"PRO","bibleId":"de4e12af7f28f599-02","abbreviation":"Pro","name":"Proverbs","nameLong":"The Proverbs"},{"id":"ECC","bibleId":"de4e12af7f28f599-02","abbreviation":"Ecc","name":"Ecclesiastes","nameLong":"Ecclesiastes or, the Preacher"},{"id":"SNG","bibleId":"de4e12af7f28f599-02","abbreviation":"Sng","name":"Song of Solomon","nameLong":"The Song of Solomon"},{"id":"ISA","bibleId":"de4e12af7f28f599-02","abbreviation":"Isa","name":"Isaiah","nameLong":"The Book of the Prophet Isaiah"},{"id":"JER","bibleId":"de4e12af7f28f599-02","abbreviation":"Jer","name":"Jeremiah","nameLong":"The Book of the Prophet Jeremiah"},{"id":"LAM","bibleId":"de4e12af7f28f599-02","abbreviation":"Lam","name":"Lamentations","nameLong":"The Lamentations of Jeremiah"},{"id":"EZK","bibleId":"de4e12af7f28f599-02","abbreviation":"Ezk","name":"Ezekiel","nameLong":"The Book of the Prophet Ezekiel"},{"id":"DAN","bibleId":"de4e12af7f28f599-02","abbreviation":"Dan","name":"Daniel","nameLong":"The Book of Daniel"},{"id":"HOS","bibleId":"de4e12af7f28f599-02","abbreviation":"Hos","name":"Hosea","nameLong":"Hosea"},{"id":"JOL","bibleId":"de4e12af7f28f599-02","abbreviation":"Jol","name":"Joel","nameLong":"Joel"},{"id":"AMO","bibleId":"de4e12af7f28f599-02","abbreviation":"Amo","name":"Amos","nameLong":"Amos"},{"id":"OBA","bibleId":"de4e12af7f28f599-02","abbreviation":"Oba","name":"Obadiah","nameLong":"Obadiah"},{"id":"JON","bibleId":"de4e12af7f28f599-02","abbreviation":"Jon","name":"Jonah","nameLong":"Jonah"},{"id":"MIC","bibleId":"de4e12af7f28f599-02","abbreviation":"Mic","name":"Micah","nameLong":"Micah"},{"id":"NAM","bibleId":"de4e12af7f28f599-02","abbreviation":"Nam","name":"Nahum","nameLong":"Nahum"},{"id":"HAB","bibleId":"de4e12af7f28f599-02","abbreviation":"Hab","name":"Habakkuk","nameLong":"Habakkuk"},{"id":"ZEP","bibleId":"de4e12af7f28f599-02","abbreviation":"Zep","name":"Zephaniah","nameLong":"Zephaniah"},{"id":"HAG","bibleId":"de4e12af7f28f599-02","abbreviation":"Hag","name":"Haggai","nameLong":"Haggai"},{"id":"ZEC","bibleId":"de4e12af7f28f599-02","abbreviation":"Zec","name":"Zechariah","nameLong":"Zechariah"},{"id":"MAL","bibleId":"de4e12af7f28f599-02","abbreviation":"Mal","name":"Malachi","nameLong":"Malachi"},{"id":"MAT","bibleId":"de4e12af7f28f599-02","abbreviation":"Mat","name":"Matthew","nameLong":"THE GOSPEL ACCORDING TO ST. MATTHEW"},{"id":"MRK","bibleId":"de4e12af7f28f599-02","abbreviation":"Mrk","name":"Mark","nameLong":"THE GOSPEL ACCORDING TO ST. MARK"},{"id":"LUK","bibleId":"de4e12af7f28f599-02","abbreviation":"Luk","name":"Luke","nameLong":"THE GOSPEL ACCORDING TO ST. LUKE"},{"id":"JHN","bibleId":"de4e12af7f28f599-02","abbreviation":"Jhn","name":"John","nameLong":"THE GOSPEL ACCORDING TO ST. JOHN"},{"id":"ACT","bibleId":"de4e12af7f28f599-02","abbreviation":"Act","name":"Acts","nameLong":"THE ACTS OF THE APOSTLES"},{"id":"ROM","bibleId":"de4e12af7f28f599-02","abbreviation":"Rom","name":"Romans","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE ROMANS"},{"id":"1CO","bibleId":"de4e12af7f28f599-02","abbreviation":"1Co","name":"1 Corinthians","nameLong":"THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS"},{"id":"2CO","bibleId":"de4e12af7f28f599-02","abbreviation":"2Co","name":"2 Corinthians","nameLong":"THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS"},{"id":"GAL","bibleId":"de4e12af7f28f599-02","abbreviation":"Gal","name":"Galatians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE GALATIANS"},{"id":"EPH","bibleId":"de4e12af7f28f599-02","abbreviation":"Eph","name":"Ephesians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE EPHESIANS"},{"id":"PHP","bibleId":"de4e12af7f28f599-02","abbreviation":"Php","name":"Philippians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE PHILIPPIANS"},{"id":"COL","bibleId":"de4e12af7f28f599-02","abbreviation":"Col","name":"Colossians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE COLOSSIANS"},{"id":"1TH","bibleId":"de4e12af7f28f599-02","abbreviation":"1Th","name":"1 Thessalonians","nameLong":"THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS"},{"id":"2TH","bibleId":"de4e12af7f28f599-02","abbreviation":"2Th","name":"2 Thessalonians","nameLong":"THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS"},{"id":"1TI","bibleId":"de4e12af7f28f599-02","abbreviation":"1Ti","name":"1 Timothy","nameLong":"THE FIRST EPISTLE OF PAUL THE APOSTLE TO TIMOTHY"},{"id":"2TI","bibleId":"de4e12af7f28f599-02","abbreviation":"2Ti","name":"2 Timothy","nameLong":"THE SECOND EPISTLE OF PAUL THE APOSTLE TO TIMOTHY"},{"id":"TIT","bibleId":"de4e12af7f28f599-02","abbreviation":"Tit","name":"Titus","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO TITUS"},{"id":"PHM","bibleId":"de4e12af7f28f599-02","abbreviation":"Phm","name":"Philemon","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO PHILEMON"},{"id":"HEB","bibleId":"de4e12af7f28f599-02","abbreviation":"Heb","name":"Hebrews","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE HEBREWS"},{"id":"JAS","bibleId":"de4e12af7f28f599-02","abbreviation":"Jas","name":"James","nameLong":"THE GENERAL EPISTLE OF JAMES"},{"id":"1PE","bibleId":"de4e12af7f28f599-02","abbreviation":"1Pe","name":"1 Peter","nameLong":"THE FIRST EPISTLE GENERAL OF PETER"},{"id":"2PE","bibleId":"de4e12af7f28f599-02","abbreviation":"2Pe","name":"2 Peter","nameLong":"THE SECOND EPISTLE GENERAL OF PETER"},{"id":"1JN","bibleId":"de4e12af7f28f599-02","abbreviation":"1Jn","name":"1 John","nameLong":"THE FIRST EPISTLE GENERAL OF JOHN"},{"id":"2JN","bibleId":"de4e12af7f28f599-02","abbreviation":"2Jn","name":"2 John","nameLong":"THE SECOND EPISTLE OF JOHN"},{"id":"3JN","bibleId":"de4e12af7f28f599-02","abbreviation":"3Jn","name":"3 John","nameLong":"THE THIRD EPISTLE OF JOHN"},{"id":"JUD","bibleId":"de4e12af7f28f599-02","abbreviation":"Jud","name":"Jude","nameLong":"THE GENERAL EPISTLE OF JUDE"},{"id":"REV","bibleId":"de4e12af7f28f599-02","abbreviation":"Rev","name":"Revelation","nameLong":"THE REVELATION OF ST. JOHN THE DIVINE"}]},{"id":"9879dbb7cfe39e4d-04","dblId":"9879dbb7cfe39e4d","relatedDbl":null,"name":"World English Bible","nameLocal":"World English Bible","abbreviation":"WEB","abbreviationLocal":"WEB","description":"Protestant","descriptionLocal":"Protestant","language":{"id":"eng","name":"English","nameLocal":"English","script":"Latin","scriptDirection":"LTR"},"countries":[{"id":"US","name":"United States","nameLocal":"United States"}],"type":"text","updatedAt":"2020-05-05T13:23:59.000Z","audioBibles":[{"id":"105a06b6146d11e7-01","name":"English - World English Bible (NT)","nameLocal":"English - World English Bible (NT)","dblId":"105a06b6146d11e7"}],"books":[{"id":"GEN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Genesis","name":"Genesis","nameLong":"The First Book of Moses, Commonly Called Genesis"},{"id":"EXO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Exodus","name":"Exodus","nameLong":"The Second Book of Mosis, Commonly Called Exodus"},{"id":"LEV","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Leviticus","name":"Leviticus","nameLong":"The Third Book of Mosis, Commonly Called Leviticus"},{"id":"NUM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Numbers","name":"Numbers","nameLong":"The Fourth Book of Moses, Commonly Called Numbers"},{"id":"DEU","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Deuteronomy","name":"Deuteronomy","nameLong":"The Fifth Book of Moses, Commonly Called Deuteronomy"},{"id":"JOS","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Joshua","name":"Joshua","nameLong":"The Book of Joshua"},{"id":"JDG","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Judges","name":"Judges","nameLong":"The Book of Judges"},{"id":"RUT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ruth","name":"Ruth","nameLong":"The Book of Ruth"},{"id":"1SA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Samuel","name":"1 Samuel","nameLong":"The First Book of Samuel"},{"id":"2SA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Samuel","name":"2 Samuel","nameLong":"The Second Book of Samuel"},{"id":"1KI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Kings","name":"1 Kings","nameLong":"The First Book of Kings"},{"id":"2KI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Kings","name":"2 Kings","nameLong":"The Second Book of Kings"},{"id":"1CH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Chronicles","name":"1 Chronicles","nameLong":"The First Book of Chronicles"},{"id":"2CH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Chronicles","name":"2 Chronicles","nameLong":"The Second Book of Chronicles"},{"id":"EZR","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ezra","name":"Ezra","nameLong":"The Book of Ezra"},{"id":"NEH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Nehemiah","name":"Nehemiah","nameLong":"The Book of Nehemiah"},{"id":"EST","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Esther","name":"Esther","nameLong":"The Book of Esther"},{"id":"JOB","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Job","name":"Job","nameLong":"The Book of Job"},{"id":"PSA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Psalm","name":"Psalms","nameLong":"The Psalms","chapters":[{"id":"PSA.1","bibleId":"9879dbb7cfe39e4d-04","number":"1","bookId":"PSA","reference":"Psalms 1","copyright":"\n          PUBLIC DOMAIN\n        ","content":"<p class=\"ms1\">BOOK 1</p><p class=\"q1\"><span data-number=\"1\" data-sid=\"PSA 1:1\" class=\"v\">1</span>Blessed is the man who doesn’t walk in the counsel of the wicked,</p><p data-vid=\"PSA 1:1\" class=\"q2\">nor stand on the path of sinners,</p><p data-vid=\"PSA 1:1\" class=\"q2\">nor sit in the seat of scoffers;</p><p class=\"q1\"><span data-number=\"2\" data-sid=\"PSA 1:2\" class=\"v\">2</span>but his delight is in Yahweh’s law.</p><p data-vid=\"PSA 1:2\" class=\"q2\">On his law he meditates day and night.</p><p class=\"q1\"><span data-number=\"3\" data-sid=\"PSA 1:3\" class=\"v\">3</span>He will be like a tree planted by the streams of water,</p><p data-vid=\"PSA 1:3\" class=\"q2\">that produces its fruit in its season,</p><p data-vid=\"PSA 1:3\" class=\"q2\">whose leaf also does not wither.</p><p data-vid=\"PSA 1:3\" class=\"q2\">Whatever he does shall prosper.</p><p class=\"q1\"><span data-number=\"4\" data-sid=\"PSA 1:4\" class=\"v\">4</span>The wicked are not so,</p><p data-vid=\"PSA 1:4\" class=\"q2\">but are like the chaff which the wind drives away.</p><p class=\"q1\"><span data-number=\"5\" data-sid=\"PSA 1:5\" class=\"v\">5</span>Therefore the wicked shall not stand in the judgment,</p><p data-vid=\"PSA 1:5\" class=\"q2\">nor sinners in the congregation of the righteous.</p><p class=\"q1\"><span data-number=\"6\" data-sid=\"PSA 1:6\" class=\"v\">6</span>For Yahweh knows the way of the righteous,</p><p data-vid=\"PSA 1:6\" class=\"q2\">but the way of the wicked shall perish.</p>","next":{"id":"PSA.2","number":"2","bookId":"PSA"},"previous":{"id":"PSA.intro","number":"intro","bookId":"PSA"}},{"id":"PSA.2","bibleId":"9879dbb7cfe39e4d-04","number":"2","bookId":"PSA","reference":"Psalms 2","copyright":"\n          PUBLIC DOMAIN\n        ","content":"<p class=\"q1\"><span data-number=\"1\" data-sid=\"PSA 2:1\" class=\"v\">1</span>Why do the nations rage,</p><p data-vid=\"PSA 2:1\" class=\"q2\">and the peoples plot a vain thing?</p><p class=\"q1\"><span data-number=\"2\" data-sid=\"PSA 2:2\" class=\"v\">2</span>The kings of the earth take a stand,</p><p data-vid=\"PSA 2:2\" class=\"q2\">and the rulers take counsel together,</p><p data-vid=\"PSA 2:2\" class=\"q2\">against Yahweh, and against his Anointed, saying,</p><p class=\"q1\"><span data-number=\"3\" data-sid=\"PSA 2:3\" class=\"v\">3</span>“Let’s break their bonds apart,</p><p data-vid=\"PSA 2:3\" class=\"q2\">and cast their cords from us.”</p><p class=\"q1\"><span data-number=\"4\" data-sid=\"PSA 2:4\" class=\"v\">4</span>He who sits in the heavens will laugh.</p><p data-vid=\"PSA 2:4\" class=\"q2\">The Lord will have them in derision.</p><p class=\"q1\"><span data-number=\"5\" data-sid=\"PSA 2:5\" class=\"v\">5</span>Then he will speak to them in his anger,</p><p data-vid=\"PSA 2:5\" class=\"q2\">and terrify them in his wrath:</p><p class=\"q1\"><span data-number=\"6\" data-sid=\"PSA 2:6\" class=\"v\">6</span>“Yet I have set my King on my holy hill of Zion.”</p><p class=\"q2\"><span data-number=\"7\" data-sid=\"PSA 2:7\" class=\"v\">7</span>I will tell of the decree:</p><p data-vid=\"PSA 2:7\" class=\"q1\">Yahweh said to me, “You are my son.</p><p data-vid=\"PSA 2:7\" class=\"q2\">Today I have become your father.</p><p class=\"q1\"><span data-number=\"8\" data-sid=\"PSA 2:8\" class=\"v\">8</span>Ask of me, and I will give the nations for your inheritance,</p><p data-vid=\"PSA 2:8\" class=\"q2\">the uttermost parts of the earth for your possession.</p><p class=\"q1\"><span data-number=\"9\" data-sid=\"PSA 2:9\" class=\"v\">9</span>You shall break them with a rod of iron.</p><p data-vid=\"PSA 2:9\" class=\"q2\">You shall dash them in pieces like a potter’s vessel.”</p><p class=\"q1\"><span data-number=\"10\" data-sid=\"PSA 2:10\" class=\"v\">10</span>Now therefore be wise, you kings.</p><p data-vid=\"PSA 2:10\" class=\"q2\">Be instructed, you judges of the earth.</p><p class=\"q1\"><span data-number=\"11\" data-sid=\"PSA 2:11\" class=\"v\">11</span>Serve Yahweh with fear,</p><p data-vid=\"PSA 2:11\" class=\"q2\">and rejoice with trembling.</p><p class=\"q1\"><span data-number=\"12\" data-sid=\"PSA 2:12\" class=\"v\">12</span>Give sincere homage to the Son, lest he be angry, and you perish on the way,</p><p data-vid=\"PSA 2:12\" class=\"q2\">for his wrath will soon be kindled.</p><p data-vid=\"PSA 2:12\" class=\"q2\">Blessed are all those who take refuge in him.</p>","next":{"id":"PSA.3","number":"3","bookId":"PSA"},"previous":{"id":"PSA.1","number":"1","bookId":"PSA"}}]},{"id":"PRO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Proverbs","name":"Proverbs","nameLong":"The Proverbs"},{"id":"ECC","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ecclesiastes","name":"Ecclesiastes","nameLong":"Ecclesiates or, The Preacher"},{"id":"SNG","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Song of Solomon","name":"Song of Solomon","nameLong":"The Song of Solomon"},{"id":"ISA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Isaiah","name":"Isaiah","nameLong":"The Book of Isaiah"},{"id":"JER","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Jeremiah","name":"Jeremiah","nameLong":"The Book of Jeremiah"},{"id":"LAM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Lamentations","name":"Lamentations","nameLong":"The Lamentations of Jeremiah"},{"id":"EZK","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ezekiel","name":"Ezekiel","nameLong":"The Book of Ezekiel"},{"id":"DAN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Daniel","name":"Daniel","nameLong":"The Book of Daniel"},{"id":"HOS","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Hosea","name":"Hosea","nameLong":"The Book of Hosea"},{"id":"JOL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Joel","name":"Joel","nameLong":"The Book of Joel"},{"id":"AMO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Amos","name":"Amos","nameLong":"The Book of Amos"},{"id":"OBA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Obadiah","name":"Obadiah","nameLong":"The Book of Obadiah"},{"id":"JON","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Jonah","name":"Jonah","nameLong":"The Book of Jonah"},{"id":"MIC","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Micah","name":"Micah","nameLong":"The Book of Micah"},{"id":"NAM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Nahum","name":"Nahum","nameLong":"The Book of Nahum"},{"id":"HAB","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Habakkuk","name":"Habakkuk","nameLong":"The Book of Habakkuk"},{"id":"ZEP","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Zephaniah","name":"Zephaniah","nameLong":"The Book of Zephaniah"},{"id":"HAG","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Haggai","name":"Haggai","nameLong":"The Book of Haggai"},{"id":"ZEC","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Zechariah","name":"Zechariah","nameLong":"The Book of Zechariah"},{"id":"MAL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Malachi","name":"Malachi","nameLong":"The Book of Malachi"},{"id":"MAT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Matthew","name":"Matthew","nameLong":"The Good News According to Matthew"},{"id":"MRK","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Mark","name":"Mark","nameLong":"The Good News According to Mark"},{"id":"LUK","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Luke","name":"Luke","nameLong":"The Good News According to Luke"},{"id":"JHN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"John","name":"John","nameLong":"The Good News According to John"},{"id":"ACT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Acts","name":"Acts","nameLong":"The Acts of the Apostles"},{"id":"ROM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Romans","name":"Romans","nameLong":"Paul’s Letter to the Romans"},{"id":"1CO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Corinthians","name":"1 Corinthians","nameLong":"Paul’s First Letter to the Corinthians"},{"id":"2CO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Corinthians","name":"2 Corinthians","nameLong":"Paul’s Second Letter to the Corinthians"},{"id":"GAL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Galatians","name":"Galatians","nameLong":"Paul’s Letter to the Galatians"},{"id":"EPH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ephesians","name":"Ephesians","nameLong":"Paul’s Letter to the Ephesians"},{"id":"PHP","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Philippians","name":"Philippians","nameLong":"Paul’s Letter to the Philippians"},{"id":"COL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Colossians","name":"Colossians","nameLong":"Paul’s Letter to the Colossians"},{"id":"1TH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Thessalonians","name":"1 Thessalonians","nameLong":"Paul’s First Letter to the Thessalonians"},{"id":"2TH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Thessalonians","name":"2 Thessalonians","nameLong":"Paul’s Second Letter to the Thessalonians"},{"id":"1TI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Timothy","name":"1 Timothy","nameLong":"Paul’s First Letter to Timothy"},{"id":"2TI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Timothy","name":"2 Timothy","nameLong":"Paul’s Second Letter to Timothy"},{"id":"TIT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Titus","name":"Titus","nameLong":"Paul’s Letter to Titus"},{"id":"PHM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Philemon","name":"Philemon","nameLong":"Paul’s Letter to Philemon"},{"id":"HEB","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Hebrews","name":"Hebrews","nameLong":"The Letter to the Hebrews"},{"id":"JAS","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"James","name":"James","nameLong":"The Letter from James"},{"id":"1PE","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Peter","name":"1 Peter","nameLong":"Peter’s First Letter"},{"id":"2PE","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Peter","name":"2 Peter","nameLong":"Peter’s Second Letter"},{"id":"1JN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 John","name":"1 John","nameLong":"John’s First Letter"},{"id":"2JN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 John","name":"2 John","nameLong":"John’s Second Letter"},{"id":"3JN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"3 John","name":"3 John","nameLong":"John’s Third Letter"},{"id":"JUD","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Jude","name":"Jude","nameLong":"The Letter from Jude"},{"id":"REV","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Revelation","name":"Revelation","nameLong":"The Revelation to John"}]}],"Categories":[{"Title":"Morning prayer","Shuffle":"x","Description":"Something to start your day with","Morning":"x","Meal":"x","UniqueID":"EYgQr"},{"Title":"Evening Prayers","Description":"Something at the close of every day","Evening":"x","UniqueID":"mCjpL"},{"Title":"Confession","Description":"What has been going on in your life?","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"HC2KJ"},{"Title":"Opening/invocation","Description":"These words help you to start your prayer","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"MXxdX"},{"Title":"Miscellaneous","Shuffle":"x","Description":"Words by others who prayed before you","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"fzNNJ"},{"Title":"The Lord's Prayer","Description":"The prayer the Master taught","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"5VRK8"},{"Title":"The Jesus Prayer","Description":"A confession to repeat","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"IghhC"},{"Title":"Table Graces","Description":"Something to start you meal with","Meal":"x","UniqueID":"OguRv"},{"Title":"Psalms","Description":"The Book of Psalms (/sɑːmz/ or /sɔː(l)mz/ SAW(L)MZ; Hebrew: תְּהִלִּים, Tehillim, \"praises\"), commonly referred to simply as Psalms, the Psalter or \"the Psalms\", is the first book of the Ketuvim (\"Writings\"), the third section of the Hebrew Bible, and thus a book of the Christian Old Testament.","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"tHAMC"}],"Moments":[{"Title":"Morning","Background":"https://i.pinimg.com/564x/1d/10/91/1d10912ac2685c9ed04a51c7c10cf9ad.jpg","Color":"#91add9","Background Color":"#f9f9ed","Starts":"07:00","Ends":"12:00","Enabled":"x","UniqueID":"bDSNg"},{"Title":"Afternoon","Background":"https://i.pinimg.com/564x/82/a8/14/82a8148e37a3dc8b09a46e1134d4f1f7.jpg","Color":"#97c2c9","Background Color":"#fefafa","Starts":"12:00","Ends":"17:00","UniqueID":"VcfiJ"},{"Title":"Evening","Background":"https://i.pinimg.com/564x/4c/14/4a/4c144a73978a6ba3ef29d884a40929e3.jpg","Color":"#ae96be","Background Color":"#deebd9","Starts":"19:00","Ends":"23:00","Enabled":"x","UniqueID":"9w1t5"},{"Title":"Meal","Background":"https://i.pinimg.com/564x/01/4f/0a/014f0ae3ce93914c31fcd64b5eaca68c.jpg","Color":"#d4a5b2","Background Color":"#edf7f4","Starts":"17:00","Ends":"19:00","UniqueID":"kgDnW"}],"Suggestions":[{"Title":"Friends","Description":"Whom do you want to pray for?","UniqueID":"v65ov"},{"Title":"Family","Description":"Who are your parents, brothers, sisters?","UniqueID":"A26w5"},{"Title":"My church","Description":"What is going on in the church?","UniqueID":"CphJj"},{"Title":"My city","Description":"What is going on in your city?","UniqueID":"rYWhp"},{"Title":"The world","Description":"What is going on in the world?","UniqueID":"Z0iLr"}],"Morning prayer":[{"Title":"Morning Prayer (Thérèsa of Lisieux)","Content":"O my God! \nI offer You all my actions of this day \nfor the intentions and for the glory of Christ Jesus. \nI desire to sanctify every beat of my heart, \nmy every thought, my simplest works, \nby uniting them to His infinite merits; \nand I wish to make reparation for my sins \nby casting them into the furnace of His merciful love.\n\nO my God! \nI ask of You for myself and for those whom I hold dear, \nthe grace to fulfill perfectly Your holy will, \nto accept for love of You the joys and sorrows of this passing life, \nso that we may one day be united together in heaven for all eternity.\n","Author":"by Thérèse of Lisieux","UniqueID":"re3Hz"},{"Title":"Morning Prayer (George Washington)","Content":"Almighty God, and most merciful father, \r\nwho commanded the children of Israel to offer a daily sacrifice to You, \r\nthat thereby they might glorify and praise You for Your protection both night and day; \r\nreceive, O Lord, my morning sacrifice which I now offer up to You. \r\n\r\nI yield to You humble and hearty thanks that You have preserved me from the danger of the past night, \r\nand brought me to the light of the day, and the comforts thereof, \r\na day which is consecrated to Your service and for Your honor.\r\nLet my heart, therefore, Gracious God, be so affected with the glory and majesty of it, \r\nthat I may not do my own works, but wait on You, \r\nand discharge those weighty duties You require of me.\r\n\r\nAnd since You are a God of pure eyes, \r\nand will be sanctified in all who draw near to You, \r\nwho does not regard the sacrifice of fools, nor hear sinners who tread in Your courts: \r\nPardon my sins, I beseech You, \r\nremove them from Your presence, as far as the east is from the west, \r\nand accept of me for the merits of Your son Jesus Christ, \r\nthat when I come into Your temple, and compass Your altar, \r\nmy prayers may come before You as incense.\r\n\r\nAnd as You would hear me calling upon You in my prayers, \r\nso give me grace to hear You calling on me in Your word, \r\nthat it may be wisdom, righteousness, reconciliation and peace to the saving of the soul in the day of the Lord Jesus.\r\nGrant that I may hear it with reverence, receive it with meekness, mingle it with faith, and that it may accomplish in me, gracious God, the good work for which You have sent it.\r\nBless my family, kindred, friends and country, be our God,\r\nand guide this day and for ever for his sake, \r\nwho lay down in the Grave and arose again for us, Jesus Christ our Lord.\r","Author":"by George Washington","UniqueID":"xWE7D"},{"Title":"Morning Prayer","Content":"We sincerely thank You for the rest of the past night, \r\nand for the gift of a new day, \r\nwith its opportunities of pleasing You. \r\n\r\nGrant that we may spend its hours in the perfect freedom of Your service, \r\nin such a way that at eventide we may again give You thanks; \r\nthrough Jesus Christ our Lord.\r","Author":"Eastern Church","UniqueID":"fjIBB"},{"Title":"Morning Prayer","Content":"O God, who is faithful and true, \r\nwho “has mercy on thousands and ten thousands of them that love You,” \r\nthe lover of the humble, and the protector of the needy, \r\nof whom all things stand in need, for all things are subject to You; \r\n\r\nlook down upon Your people, who bow down their heads to You, \r\nand bless them with spiritual blessing. \r\n“Keep them as the apple of an eye,” \r\npreserve them in piety and righteousness, \r\nand give them eternal life in Christ Jesus Thy beloved Son, \r\nwith whom glory, honour, and worship be to Thee and to the Holy Spirit, \r\nnow and always, and forever and ever.\r","Author":"Apostolic Constitutions","UniqueID":"aHJ14"},{"Title":"The Thanksgiving for the Morning","Content":"O God, the God of spirits and of all flesh, \r\nwho is beyond compare, and stands in need of nothing, \r\nwho has given the sun to have rule over the day, \r\nand the moon and the stars to have rule over the night, \r\nnow also look down upon us with gracious eyes, \r\nand receive our morning thanksgivings, \r\nand have mercy upon us; \r\n\r\nfor we have not “spread out our hands unto a strange God;” \r\nfor there is not among us any new God, \r\nbut You, the eternal God, who is without end, \r\nwho has given us our being through Christ, \r\nand given us our well-being through Him. \r\n\r\nGrant us also, through Him, eternal life; \r\nwith whom glory, and honour, and worship \r\nbe to You and to the Holy Spirit forever.\r","Author":"Apostolic Constitutions","UniqueID":"c8XlD"},{"Title":"You Have Loved Us First","Content":"You have loved us first, O God, \r\nalas! We speak of it in terms of history \r\nas if You have only loved us first but a single time, \r\nrather than that without ceasing You have loved us first \r\nmany things and every day and our whole life through. \r\n\r\nWhen we wake up in the morning \r\nand turn our soul toward You - You are the first - \r\nYou have loved us first; \r\nif I rise at dawn \r\nand at the same second turn my soul toward You in prayer, \r\nYou are there ahead of me, \r\nYou have loved me first. \r\nWhen I withdraw from the distractions of the day \r\nand turn my soul toward You, \r\nYou are the first and thus forever. \r\n","Author":"by Sören Kierkegaard","UniqueID":"LYbQ6"},{"Title":"Each Morning Broken","Content":"Lord! \r\nMake our heart Your temple in which You live. \r\nGrant that every impure thought, \r\nevery earthly desire might be like the idol Dagon \r\n- each morning broken at the feet of the Ark of the Covenant. \r\n\r\nTeach us to master flesh and blood \r\nand let this mastery of ourselves be our bloody sacrifice \r\nin order that we might be able to say with the Apostle: \r\n\"I die every day.\"\r","Author":"by Sören Kierkegaard","UniqueID":"dFT79"}],"Evening Prayers":[{"Title":"Evening Prayer","Content":"Keep watch, dear Lord, \nwith those who work, \nor watch, \nor weep this night, \nand give your angels charge over those who sleep. \n\nTend the sick, Lord Christ; \ngive rest to the weary, \nbless\nthe dying, \nsoothe the suffering, \npity the afflicted, \nshield the joyous; \nand all for your love's sake.","Author":"by St. Augustine","UniqueID":"Z6I8C"},{"Title":"Evening Prayer","Content":"Save us, O God, and raise us up by Your Christ. \r\nLet us stand up, and beg for the mercies of the Lord, \r\nand His compassions, \r\nfor the angel of peace, \r\nfor what things are good and profitable, \r\nfor a Christian departure out of this life, \r\nan evening and a night of peace, \r\nand free from sin; \r\n\r\nand let us beg that the whole course of our life may be unblamable. \r\nLet us dedicate ourselves and one another to the living God through His Christ.\r","Author":"Apostolic Constitutions","UniqueID":"l3TBP"},{"Title":"Evening Prayer","Content":"All you children, praise the Lord: \r\nPraise the name of the Lord. \r\nWe praise You, \r\nwe sing hymns to You, \r\nwe bless You for your great glory, \r\nO Lord our King, the Father of Christ the spotless Lamb, \r\nwho takes away the sin of the world. \r\n\r\nPraise becomes You, \r\nhymns become You, \r\nglory becomes You, \r\nthe God and Father, \r\nthrough the Son, \r\nin the most holy Spirit, \r\nforever and ever.\r","Author":"Apostolic Constitutions","UniqueID":"NwaTU"}],"The Jesus Prayer":[{"Title":"The Jesus Prayer","Content":"Lord Jesus Christ, Son of God\nHave mercy on me, a sinner.","UniqueID":"18Rv7"}],"The Lord's Prayer":[{"Title":"The Lord's Prayer","Content":"Our Father in heaven, \nhallowed be your name. \nYour kingdom come, \nyour will be done, on earth as it is in heaven. \n\nGive us this day our daily bread, \nand forgive us our debts, \nas we also have forgiven our debtors. \nAnd lead us not into temptation, \nbut deliver us from evil.\n\nFor yours is the Kingdom and the power and the glory, forever.","UniqueID":"wIZxV"}],"Confession":[{"Title":"Confession of Sins","Content":"Lord of grace and truth,\nwe confess our unworthiness\nto stand in your presence as your children.\nWe have sinned:\nforgive and heal us.\n\nThe Virgin Mary accepted your call\nto be the mother of Jesus.\nForgive our disobedience to your will.\nWe have sinned:\nforgive and heal us.\n\nYour Son our Saviour\nwas born in poverty in a manger.\nForgive our greed and rejection of your ways.\nWe have sinned:\nforgive and heal us.\n\nThe shepherds left their flocks\nto go to Bethlehem.\nForgive our self-interest and lack of vision.\nWe have sinned:\nforgive and heal us.\n\nThe wise men followed the star\nto find Jesus the King.\nForgive our reluctance to seek you.\nWe have sinned:\nforgive and heal us.\n","Author":"Book of Common Prayer","UniqueID":"gpxtG"},{"Title":"Confession of Sins","Content":"Most merciful God,\r\nwe confess that we have sinned against you\r\nin thought, word, and deed,\r\nby what we have done,\r\nand by what we have left undone.\r\n\r\nWe have not loved you with our whole heart;\r\nwe have not loved our neighbors as ourselves.\r\nWe are truly sorry and we humbly repent.\r\n\r\nFor the sake of your Son Jesus Christ,\r\nhave mercy on us and forgive us;\r\nthat we may delight in your will,\r\nand walk in your ways,\r\nto the glory of your Name. \r","Author":"Book of Common Prayer","UniqueID":"gLUDQ"},{"Title":"For Soul Cleansing","Content":"O God, who hast taught us Your divine and saving oracles, \r\nenlighten the souls of us sinners for the comprehension of the things which have been spoken before, \r\nso that we may not only be seen to be hearers of spiritual things, \r\nbut also doers of good deeds, \r\nstriving after guileless faith, blameless life, and pure conversation.\r\n\r\nRelease, pardon, and forgive, O God, all our voluntary and involuntary sins, \r\nwhich we have committed in action and in word, \r\nknowingly and ignorantly, \r\nby night and by day, in mind and thought, \r\nforgive us all in goodness and love.\r\n\r\nSanctify, O Lord, our souls, bodies and spirits; \r\nexamine our minds and search our consciences; \r\ntake from us all evil imaginations, \r\nall impurity of thought, \r\nall inclinations to lust, \r\nall depravity of conception, \r\nall envy, pride and hypocrisy, \r\nall falsehood, deceit and irregular living, \r\nall covetousness, vain glory and sloth; \r\nall malice, anger and wrath, \r\nall remembrance of injuries, \r\nall blasphemy \r\nand every motion of flesh and spirit that is contrary to the purity of Your will.\r","Author":"from the Liturgy of St. James","UniqueID":"xckM4"},{"Title":"For Pardon","Content":"O Lord, who has mercy upon all, \r\ntake away from me my sins, \r\nand mercifully set alight in me the fire of Your Holy Spirit. \r\n\r\nTake away from me the heart of stone, \r\nand give me a heart of flesh, \r\na heart to love and adore You, \r\na heart to delight in You, \r\nto follow and to enjoy You, \r\nfor Christ’s sake.\r","Author":"by Ambrose","UniqueID":"rwCaI"},{"Title":"Confession of Sins","Content":"O You who beholds all things, \r\nwe have sinned against You in thought, word, and deed; \r\nblot out our transgressions, \r\nbe merciful to us sinners, \r\nand grant that our names may be found written in the book of life, \r\nfor the sake of Christ Jesus our Saviour. \r","Author":"by Nerses of Clajes","UniqueID":"GImXH"},{"Title":"For Steadfastness","Content":"O God, the light of every heart that sees You, \r\nthe Life of every soul that loves You, \r\nthe strength of every mind that seeks You,\r\nhelp me always to continue steadfast in Your holy love. \r\n\r\nBe the joy of my heart; \r\ntake it all for Yourself, and abide in it. \r\nThe house of my soul is, I confess, too narrow for You; \r\nenlarge it, that You may enter in; \r\nit is ruinous, but You repair it. \r\nIt has that within which must offend Your eyes; \r\nI confess and know it; \r\nbut whose help shall I implore in cleansing it, but Yours alone? \r\n\r\nTo You, therefore, I cry urgently, \r\nbegging that You will cleanse me from my secret faults, \r\nand keep Your servant from presumptuous sins, \r\nthat they never get dominion over me.\r","Author":"by St. Augustine","UniqueID":"7GhDr"},{"Title":"Hold Us Up Against Our Sins","Content":"Father in Heaven! \r\nHold not our sins up against us \r\nbut hold us up against our sins \r\nso that the thought of You \r\nwhen it wakens in our soul, \r\nand each time it wakens, \r\nshould not remind us of what we have committed \r\nbut of what You did forgive, \r\nnot of how we went astray \r\nbut of how You did save us!\r","Author":"by Sören Kierkegaard","UniqueID":"Td0D8"},{"Title":"Prayer for Forgiveness","Content":"Almighty and most merciful Father, \r\nI have erred and strayed from your ways like a lost sheep. \r\nI have followed too much the devices and desires of my own heart. \r\nI have offended against your holy laws. \r\nI have left undone those things which I ought to have done; \r\nand I have done those things which I ought not to have done; \r\nand there is no good in me.\r\n\r\nO Lord, have mercy upon me, a miserable sinner. \r\nSpare all those, O God, who confess their faults. \r\nRestore those who are penitent; \r\naccording to your promises declared to us in Christ Jesus our Lord. \r\nAnd Grant that I and all who confess his holy name \r\nmay hereafter live a godly, righteous, and sober life; \r\nto his glory and not our own.\r\n","Author":"Adapted from the Book of Common Prayer","UniqueID":"4AY0P"}],"Opening/invocation":[{"Title":"Invocation","Content":"O Lord, open my lips\nAnd my mouth shall proclaim your praise.\n\nO God, make speed to save us.\nO Lord, make haste to help us.\n\nGlory to the Father and the Son And the Holy Spirit,\nAs it was in the beginning, is now, and will be forever.\n","UniqueID":"zAwkB"}],"Miscellaneous":[{"Title":"Draw Thou Our Hearts","Content":"O Lord Jesus Christ, draw our hearts unto You; \njoin them together in inseparable love, \nthat we may abide in You, and You in us, \nand that the everlasting covenant between us may stand sure forever. \n\nO wound our hearts with the fiery darts of Your piercing love. \nLet them pierce through all our slothful members and inward powers, \nthat we, being happily wounded, may so become whole and sound. \nLet us have no lover but yourself alone; \nlet us seek no joy nor comfort except in You.","Author":"by Myles Coverdale, Bishop of Exeter, 1530 A.D.","UniqueID":"qozsG"},{"Title":"Prayer for the Power of the Holy Spirit","Content":"O Holy Spirit, descend plentifully into my heart. \nEnlighten the dark corners of this neglected dwelling and scatter there Your cheerful beams.\nBreathe in me, O Holy Spirit, that my thoughts may all be holy.\nAct in me, O Holy Spirit, that my work, too, may be holy.\nDraw my heart, O Holy Spirit, that I love but what is holy.\nStrengthen me, O Holy Spirit, to defend all that is holy.\nGuard me, then, O Holy Spirit, that I always may be holy.","Author":"by (Saint) Augustine of Hippo, 398 A.D.","UniqueID":"fCuVb"},{"Title":"Prayer to Thirst for God","Content":"Lord God, I have tasted your goodness \r\nand it has satisfied me, \r\nyet it has made me thirst for even more. \r\n\r\nI am so painfully aware of my need \r\nfor even more grace than I now enjoy; \r\nand even when I do not want more, \r\nI am ashamed of my lack of desire. \r\nI want you completely, mighty God, \r\nand I want to want you even more than I do.\r\nFill me with longing for you; make me even thirstier. \r\nShow me your glory, I pray, \r\nso that I may know you always better and better, \r\ngrowing in my faith and love. \r\n\r\nFrom your infinite mercy, \r\nbegin a new work of love within me this moment. \r\nSay to my soul, ‘Rise up my love, \r\nmy fair one, and come away.’ \r\nAnd give me grace to rise up and follow you, \r\nfrom this misty lowland where I have wandered so long.\r\n","Author":"adapted from a prayer by A. W. Tozer","UniqueID":"7WMbS"},{"Title":"Prayer Not to Judge Others","Content":"Heavenly Father, \r\ngive me grace to endeavor after a truly Christian spirit \r\nto seek to attain that temper of endurance and patience \r\nof which my blessed Savior has set me the highest example, \r\nand which, while it prepares me for the spiritual happiness of the life to come, \r\nwill secure the best enjoyment of what the world can give. \r\n\r\nIncline me, O God, to think humbly of myself, \r\nto be severe only in the examination of my own conduct, \r\nto consider my fellow creatures with kindness, \r\nand to judge of all they say and do with that charity \r\nthat I would desire from them myself. \r\nIn Christ's name I pray.\r","Author":"by Jane Austen","UniqueID":"XnVnW"},{"Title":"For God's Peace","Content":"Drop Your still dews of quietness \ntill all our strivings cease,\ntake from our souls the strain and stress \nand let our ordered lives confess,\nthe beauty of Your peace.\n","Author":"by J.G. Whittier","UniqueID":"PrE9u"},{"Title":"Blessing of Mark","Content":"O Sovereign and almighty Lord, \nbless all your people, and all your flock. \nGive your peace, your help, \nand your love unto us your servants, the sheep of your fold, \nthat we may be united in the bond of peace and love, \none body and one spirit, \nin one hope of our calling, \nin your divine and boundless love.\n","Author":"From the Liturgy of Mark, 2d Century A.D.","UniqueID":"2u0Y1"},{"Title":"Prayer by Anne Brontë","Content":"My God, oh, let me call You mine,\r\nWeak, wretched sinner that I am,\r\nMy trembling soul wants to be yours;\r\nMy feeble faith still clings to You.\r\nNot only for the past I grieve,\r\nThe future fills me with dismay;\r\nUnless You hasten to relieve,\r\nYour petitioner is a castaway.\r\n\r\nI cannot say my faith is strong,\r\nI dare not hope my love is great;\r\nBut strength and love to You belong;\r\nOh, do not leave me desolate!\r\nI know I owe my all to You;\r\nOh, take the heart I cannot give!\r\nYou be my strenght— my Saviour too,\r\nAnd make me to Thy glory live.\r\n","Author":"by Anne Bronte","UniqueID":"aMDYE"},{"Title":"Dedication (Teresa of Ávila)","Content":"May it please you, my good Lord, \nthat there may come a day when I can repay a little of my great debt to you. \nO Jesus, strengthen my soul, you who are good above all good; \nand since you have inclined my soul in this way, \nshow me how I may act for you, whatever it may cost, O Lord. \nHere is my life, my honor and my will; \nI have given them all to you and they are yours: \nuse me to do whatever you want.","Author":"by Teresa of Ávila","UniqueID":"XOYGy"},{"Title":"Prayer of the Ancient Christians","Content":"I give you thanks Holy Father, \r\nfor your holy name which you have caused to dwell in my heart, \r\nand for the knowledge and faith and immortality which you have made known to me through Jesus your servant; \r\nto you be the glory forever.\r\n\r\nYou, almighty Master, created all things for your name's sake, \r\nand gave food and drink to men to enjoy, that they might give you thanks; \r\nbut to me you have graciously given spiritual food and drink, \r\nand eternal life through your servant Jesus. \r\n\r\nAbove all I give thanks because you are mighty; \r\nto you be the glory forever.\r\nRemember your church, Lord, \r\nto deliver it from all evil and to make it perfect in your love;\r\nand gather it, the one that has been sanctified, \r\nfrom the four winds into your kingdom, \r\nwhich you have prepared for it; \r\nfor yours is the glory forever.\r\n\r\nMay grace come, and may this world pass away. \r\nHosanna to the God of David. \r\nIf anyone is holy, let him come; \r\nif anyone is not, let him repent. \r\nCome, oh Lord!\r","Author":"Translation of a prayer (in Greek) from ca.150 A.D.","UniqueID":"Pa1N3"},{"Title":"The Heart of a Child","Content":"Grant me this day, O God, the heart of a child,\r\nPure and transparent as a spring;\r\nA simple heart, which never harbors sorrows;\r\nA heart glorious in self-giving,\r\ntender in compassion;\r\nA heart faithful and generous,\r\nwhich will never forget any good\r\nor bear a grudge for any evil.\r\n\r\nMake me a heart gentle and humble,\r\nloving without asking any return,\r\nlarge-hearted and undauntable,\r\nwhich no ingratitude can sour\r\nand no indifference can weary;\r\na heart penetrated by the love of Jesus \r\nwhose desire will only be satisfied in heaven.\r\n\r\nGrant me, O Lord, the mind and heart of your dear Son.\r","Author":"Translated from an old French prayer, ca. 1880","UniqueID":"j4Ugq"},{"Title":"We Beg You Lord","Content":"We beg You, Lord,\r\nto help and defend us.\r\nDeliver the oppressed, ‘\r\npity the insignificant,\r\nraise the fallen,\r\nshow Yourself to the needy,\r\nheal the sick,\r\nbring back those of Your people who have gone astray,\r\nfeed the hungry,\r\nlift up the weak,\r\ntake off the prisoners’ chains.\r\nMay every nation come to know\r\nthat You alone are God,\r\nthat Jesus Christ is your Child,\r\nthat we are Your people, \r\nthe sheep that You pasture.\r","Author":"from a prayer by St. Clement of Rome","UniqueID":"rEPOP"},{"Title":"Prayer for Holiness","Content":"All provident Lord, \r\nplace Your holy fear as a guard before my eyes so they may not look lustfully; \r\nbefore my ears so that they may not delight in hearing evil words; \r\nbefore my mouth so that it may not speak any falsehoods; \r\nbefore my heart so that it may not think evil; before my hands so that they may not do injustice;\r\n before my feet, that they may not walk in the paths of injustice; \r\nbut so direct them, that they may always be according to all Your commandments. \r\n\r\nHave mercy upon Your Creatures and upon me, a great sinner, \r\nI pray in the Name of Christ.\r","Author":"by (St.) Nersess the Gracious, 12th century","UniqueID":"ctcYs"},{"Title":"Prayer for Inner Peace","Content":"Heavenly God, may I have peace within, this day;\r\nMay I trust God that I am exactly where I am meant to be.\r\nMay I not forget the infinite possibilities that are born of faith.\r\nMay I use those gifts that I have received, \r\nand pass on the love that has been given to me.\r\nMay I be confident knowing I am a child of God.\r\nLet this presence settle into my bones, \r\nand allow my soul the freedom to sing, dance, praise and love. \r\nThis I pray in Christ’s name.\r","Author":" ","UniqueID":"jmlmH"},{"Title":"Song of Zechariah","Content":"Blessed be the Lord God of Israel,\r\nfor he has looked favorably on his people and redeemed them. \r\nHe has raised up a mighty savior for us in the house of his servant David, \r\nas he spoke through the mouth of his holy prophets from of old, \r\nthat we would be saved from our enemies \r\nand from the hand of all who hate us. \r\n\r\nThus he has shown the mercy promised to our ancestors, \r\nand has remembered his holy covenant, \r\nthe oath that he swore to our ancestor Abraham, \r\nto grant us that we, being rescued from the hands of our enemies, \r\nmight serve him without fear, \r\nin holiness and righteousness before him all our days. \r\n\r\nAnd you, child, will be called the prophet of the Most High; \r\nfor you will go before the Lord to prepare his ways, \r\nto give knowledge of salvation to his people \r\nby the forgiveness of their sins. \r\nBy the tender mercy of our God, \r\nthe dawn from on high will break upon us, \r\nto give light to those who sit in darkness and in the shadow of death, \r\nto guide our feet into the way of peace.\r","Author":"Luke 1:69-79","UniqueID":"PXBdi"},{"Title":"Song of Mary","Content":"My soul magnifies the Lord, \r\nand my spirit rejoices in God my Savior, \r\nfor he has looked with favor on the lowliness of his servant. \r\nSurely, from now on all generations will call me blessed; \r\nfor the Mighty One has done great things for me, \r\nand holy is his name.\r\n\r\nHis mercy is for those who fear him \r\nfrom generation to generation.\r\nHe has shown strength with his arm; \r\nhe has scattered the proud in the thoughts of their hearts. \r\nHe has brought down the powerful from their thrones, \r\nand lifted up the lowly; \r\nHe has filled the hungry with good things, \r\nand sent the rich away empty. \r\n\r\nHe has helped his servant Israel, \r\nin remembrance of his mercy, \r\naccording to the promise he made to our ancestors, \r\nto Abraham and to his descendants forever.\r","Author":"Luke1:47-55","UniqueID":"YXqTj"},{"Title":"A Pure Heart","Content":"O God Almighty, \r\nFather of our Lord Jesus Christ, Your only begotten Son, \r\ngive me a body unstained, \r\na pure heart, \r\na watchful mind, \r\nand an upright understanding, \r\nand the presence of Your Holy Spirit, \r\nthat I may obtain and ever hold fast to an unshaken faith in Your truth, \r\nthrough Jesus Christ, Your Son, our Lord; \r\nthrough whom be glory to You in the Holy Ghost, \r\nforever and ever.\r","Author":"from the Clementine Liturgy","UniqueID":"y6Eib"},{"Title":"For Growth in Grace","Content":"Give perfection to beginners, O Father; \r\ngive intelligence to the little ones; \r\n\r\ngive aid to those who are running their course. \r\nGive sorrow to the indifferent; \r\ngive passion of spirit to the lukewarm. \r\n\r\nGive to the perfect a good completion; \r\nfor the sake of Christ Jesus our Lord.\r","Author":"By Iranaeus, Old Gallican Sacramentary","UniqueID":"O5Cel"},{"Title":"For Christian Graces","Content":"Grant us, Your servants, O God, to be set on fire with Your Spirit, \r\nstrengthened by Your power,\r\nilluminated by Your splendour, \r\nfilled with Your grace, \r\nand to go forward by Your aid. \r\n\r\nGive us, O Lord, a right faith, \r\nperfect love, \r\ntrue humility. \r\n\r\nGrant, O Lord, that there may be in us simple affection, \r\nbrave patience, \r\npersevering obedience, \r\nperpetual peace, \r\na pure mind, \r\na right and honest heart, \r\na good will, \r\na holy conscience, \r\nspiritual strength, \r\na life unspotted and unblamable; \r\n\r\nand after having manfullyboldly finished our course, \r\nmay we be enabled happily to enter into Your kingdom;\r\nthrough Jesus Christ our Lord.\r","Author":"From the Old Gallican Sacramentary","UniqueID":"nK44l"},{"Title":"Prayer to The Crucified Christ","Content":"Lord Jesus Christ, \r\nYou stretched out your arms of love on the hard wood of the cross,\r\nthat everyone might come within the reach of your saving embrace:  \r\nSo clothe us in your Spirit that we, reaching forth our hands in love, \r\nmay bring those who do not know you to the knowledge and love of you; \r\nfor the honor of your Name.","Author":"from The Book of Common Prayer","UniqueID":"n57Ct"},{"Title":"Let Me Be an Instrument of Your Peace","Content":"Lord, make me an instrument of Your peace;\r\nwhere there is hatred, let me show love;\r\nwhere there is injury, pardon;\r\nwhere there is doubt, faith;\r\nwhere there is despair, hope;\r\nwhere there is darkness, light;\r\nand where there is sadness, joy.\r\n\r\nO Divine Master,\r\ngrant that I may not so much seek to be consoled as to console;\r\nto be understood, as to understand;\r\nto be loved, as to love;\r\nfor it is in giving that we receive,\r\nit is in pardoning that we are pardoned,\r\nand it is in dying that we are born to Eternal Life.\r","Author":"Ascribed to St. Francis","UniqueID":"ZwHKp"},{"Title":"For Protection","Content":"Lord Jesus Christ, Keeper and Preserver of all things, \r\nlet Your right hand guard us by day and by night, \r\nwhen we sit at home, and when we walk abroad, \r\nwhen we lie down and when we rise up, \r\nthat we may be kept from all evil, \r\nand have mercy upon us sinners. \r","Author":"By Nerses of Clajes","UniqueID":"hqkE4"},{"Title":"For Right Blessings","Content":"O Lord our God, teach us, we beseech You, \r\nto ask Thee rightly for the right blessings. \r\nSteer the vessel of our life toward Yourself, \r\nYou tranquil Haven of all storm-tossed souls. \r\nShow us the course wherein we should go. \r\nRenew a willing spirit within us. \r\nLet Your Spirit curb our wayward senses, \r\nand guide and enable us unto that which is our true good, \r\nto keep Your laws, \r\nand in all our works always to rejoice in Your glorious and gladdening Presence. \r\nFor Yours is the glory and praise from all Your saints forever and ever. ","Author":"by Basil","UniqueID":"LnwH0"},{"Title":"For Refreshment","Content":"O Lord our God, under the shadow of Your wings let us hope. \r\nYou will support us, both when little, and even to gray hairs. \r\nWhen our strength is from You, it is strength; \r\nbut, when our own, it is feebleness. \r\n\r\nWe return unto You, O Lord, \r\nthat from their weariness our souls may rise towards You, \r\nleaning on the things which You have created, \r\nand passing on to You, who has wonderfully made them; \r\nfor with You is refreshment and true strength.\r","Author":"By St. Augustine","UniqueID":"Fs0Dl"},{"Title":"A Non-Traditional Blessing","Content":"May God bless us with a restless discomfort\r\nabout easy answers, half-truths and superficial relationships,\r\nso that we may seek truth boldly and love deep within your heart.\r\n\r\nMay God bless us with holy anger at injustice, oppression,\r\nand exploitation of people, so that we may tirelessly work for\r\njustice, freedom, and peace among all people.\r\n\r\nMay God bless us with the gift of tears to shed with those who suffer\r\nfrom pain, rejection, starvation, or the loss of all that they cherish, so that we may\r\nreach out our hand to comfort them and transform their pain into joy.\r\n\r\nMay God bless us with enough foolishness to believe that\r\nwe really can make a difference in this world, so that we are able,\r\nwith God's grace, to do what others claim cannot be done.\r\n\r\nAnd the blessing of God the Supreme Majesty and our Creator,\r\nJesus Christ the Incarnate Word who is our brother and Saviour,\r\nand the Holy Spirit, our Advocate and Guide, be with us\r\nand remain with us, this day and forevermore.\r","Author":"by Ruth M. Fox","UniqueID":"bZCk9"},{"Title":"The Absorbeat","Content":"May the power of your love, Lord Christ,\r\nfiery and sweet as honey,\r\nso absorb our hearts\r\nas to withdraw them from all that is under heaven.\r\nGrant that we may be ready\r\nto die for love of your love,\r\nas you died for love of our love.","Author":"Ascribed to St. Francis","UniqueID":"osrUN"},{"Title":"Canticle of the Creatures","Content":"Most High, all powerful, good Lord,\r\nyours are the praises, the glory, the honour\r\nand all blessing.\r\n\r\nTo you alone, Most High, do they belong\r\nand no human is worthy to mention your name.\r\nPraised be you, my Lord, with all your creatures,\r\nespecially Sir Brother Sun, who is the day and through whom you give us light.\r\nAnd he is beautiful and radiant with great splendour;\r\nand bears a likeness of you, Most High One.\r\n\r\nPraised be you, my Lord, through Sister Moon and the stars:\r\nin heaven you formed them clear and precious and beautiful.\r\nPraised be you, my Lord, through Brother Wind;\r\nand through the air, cloudy and serene, and every kind of weather,\r\nthrough which you give sustenance to your creatures.\r\n\r\nPraised be you, my Lord, through Sister Water,\r\nwho is very useful and humble and precious and chaste.\r\nPraised be you, my Lord, through Brother Fire,\r\nthrough whom you light the night:\r\nand he is beautiful and playful and robust and strong.\r\n\r\nPraised be you, my Lord, through our Sister, Mother Earth,\r\nwho sustains and governs us\r\nand who produces various fruit\r\nwith coloured flowers and herbs.\r\n\r\nPraised be you, my Lord,\r\nthrough those who give pardon for your love\r\nand bear infirmity and tribulation.\r\nBlessed are those who endure in peace:\r\nfor by you, Most High, shall they be crowned.\r\n\r\nPraised be you, my Lord, for our Sister, Bodily Death,\r\nfrom whom no one living can escape:\r\nwoe to those who die in mortal sin.\r\nBlessed are those whom death will find in your most holy will,\r\nfor the second death shall do them no harm.\r\n\r\nPraise and bless my Lord and give him thanks\r\nand serve him with great humility.\r","Author":"By St. Francis","UniqueID":"pSWA9"},{"Title":"The Prayer Before the Crucifix","Content":"Most High, glorious God,\r\nenlighten the darkness of my heart\r\nand give me true faith,\r\ncertain hope,\r\nand perfect charity,\r\nsense and knowledge,\r\nLord, that I may carry out\r\nYour holy and true command.\r","Author":"By St. Francis","UniqueID":"dGCbu"},{"Title":"A Prayer for Spiritual Blessings","Content":"\"Most high God, our loving Father, infinite in majesty, \r\nwe humbly beseech You for all Your servants everywhere, \r\nthat You would give us a pure mind, \r\nperfect love, \r\nsincerity in conduct, \r\npurity in heart, \r\nstrength in action, \r\ncourage in distress, \r\nself-command in character. \r\n\r\nMay our prayers ascend to Your gracious ears, \r\nand Your loving benediction descend upon us all, \r\nthat we may in all things be protected under the shadow of Your wings. \r\n\r\nGrant us pardon of our sins; \r\nperfect our work; \r\naccept our prayers; \r\nprotect us by Your own Name, O God of Jacob; \r\n\r\nSend us Your saving help from Your holy place, \r\nand strengthen us out of Zion. \r\nRemember all Your people everywhere, \r\ngive us all the grace of devotion to Your will; \r\nfulfill our desires with good gifts, \r\nand crown us with Your mercy. \r\n\r\nWhen we serve You with faithful devotion, \r\npardon our sins and correct us with Fatherly tenderness. \r\nGrant that, being delivered from all adversity, \r\nand both here and eternally justified, \r\nwe may praise You forever and ever, \r\nsaying Holy, Holy, Holy; \r\nthrough Jesus Christ our Lord and Saviour, \r\nWho with You and the Holy Ghost, lives and reigns, \r\never one God, world without end.\r\"","Author":"From the Gallican Sacramentary","UniqueID":"5FTiR"},{"Title":"Adoration","Content":"O You Good Omnipotent, \r\nWho so cares for every one of us, \r\nas if You would care for him alone; \r\nand so for all, as if all were but one! \r\n\r\nBlessed is the man who loves You, \r\nand his friend in You, \r\nand his enemy for You. \r\nFor he only loses none dear to him, \r\nto whom all are dear in Him who cannot be lost. \r\n\r\nAnd who is that but our God, \r\nthe God that made heaven and earth, \r\nand fills them, even by filling them creating them. \r\n\r\nAnd Your law is truth, and truth is Yourself. \r\nI behold how some things pass away that others may replace them, \r\nbut You never depart, O God, \r\nmy Father supremely good, \r\nBeauty of all things beautiful. \r\n\r\nTo You will I entrust whatsoever I have received from You, \r\nso shall I lose nothing. \r\nYou have made me for Yourself, \r\nand my heart is restless until it finds rest in You.\r","Author":"By St. Augustine","UniqueID":"7ZGXc"},{"Title":"The Holy Spirit","Content":"O Holy Spirit, Love of God, \r\ninfuse Your grace, and descend plentifully into my heart; \r\nenlighten the dark corners of this neglected dwelling, \r\nand scatter there Your cheerful beams; \r\n\r\nDwell in that soul that longs to be Your temple; \r\nwater that barren soil, over-run with weeds and briars, \r\nand lost for want of cultivating, \r\nand make it fruitful with Your dew from heaven. \r\n\r\nOh come, You refreshment of them that languish and faint. \r\nCome, You Star and Guide of them that sail in the tempestuous sea of the world; \r\nYou only Haven of the tossed and shipwrecked. \r\n\r\nCome, You Glory and Crown of the living, \r\nand only Safeguard of the dying. \r\n\r\nCome, Holy Spirit, in much mercy, \r\nand make me fit to receive You.","Author":"by St. Augustine","UniqueID":"4BGlX"},{"Title":"For Entire Love","Content":"O Lord, my God, \r\nLight of the blind and Strength of the weak; \r\nyes, also, Light of those that see, and Strength of the strong; \r\nlisten unto my soul, and hear it crying out of the depths.\r\n\r\nO Lord, help us to turn and seek You; \r\nfor You have not forsaken Your creatures \r\nas we have forsaken You, our Creator. \r\nLet us turn and seek You, \r\nfor we know You are here in our hearts, \r\nwhen we confess to You, \r\nwhen we cast ourselves upon You, \r\nand weep in Your bosom, after all our rugged ways; \r\n\r\nand You gently wipe away our tears, \r\nand we weep the more for joy; \r\nbecause You, Lord, who made us \r\ndoes remake and comfort us.\r\n\r\nHear, Lord, my prayer, \r\nand grant that I may most entirely love You, \r\nand rescue me, O Lord, from every temptation, \r\neven unto the end.\r\nby St. Augustine","Author":"by St. Augustine","UniqueID":"rEAAL"},{"Title":"Refuge and Peace","Content":"O, You full of compassion, \r\nI commit and commend myself to You, \r\nin whom I am, and live, and know. \r\n\r\nBe the goal of my pilgrimage, \r\nand my rest by the way. \r\nLet my soul take refuge from the crowding turmoil of worldly thoughts \r\nbeneath the shadow of Your wings; \r\nlet my heart, this sea of restless waves, \r\nfind peace in You, O God. \r\n\r\nYou generous Giver of all good gifts, \r\ngive to him who is weary refreshing food; \r\ngather our distracted thoughts and powers into harmony again; \r\nand set the prisoner free. \r\n\r\nSee, he stands at you door and knocks; \r\nbe it open to him, that he may enter with a free step, \r\nand be quickened by You. \r\n\r\nFor You are the Well-spring of Life, \r\nthe Light of eternal Brightness, \r\nwherein the just live who love You. \r\nBe it unto me according to Your word.","Author":"by St. Augustine","UniqueID":"ozU77"},{"Title":"Late Have I Loved You","Content":"Late have I loved you, \r\nbeauty so ancient and so new: \r\nlate have I loved you. \r\nAnd see, you were within \r\nand I was in the external world and sought you there, \r\nand in my unlovely state I plunged into those lovely created things which you made. \r\n\r\nYou were with me, and I was not with you. \r\nThe lovely things kept me far from you, \r\nthough if they did not have their existence in you, \r\nthey had no existence at all. \r\n\r\nYou called and cried out loud and shattered my deafness. \r\nYou were radiant and resplendent, you put to flight my blindness. \r\nYou were fragrant, and I drew in my breath and now pant after you. \r\nI tasted you, and I feel but hunger and thirst for you. \r\nYou touched me, and I am set on fire to attain the peace which is yours.\r","Author":"by St. Augustine","UniqueID":"KySCS"},{"Title":"Invocation","Content":"Lord God, of might inconceivable, \r\nof glory incomprehensible, \r\nof mercy immeasurable, \r\nof compassion unspeakable; \r\n\r\nO Master, do look down upon us in Your tender love, \r\nand show forth, towards us and those who pray with us, \r\nYour rich mercies and compassions.\r","Author":"from the Liturgy of St. Chrysostom","UniqueID":"T66T1"},{"Title":"For the Holy Spirit","Content":"O God , give me a body undefiled, \r\na pure heart, \r\na watchful mind, \r\nan unfailing knowledge, \r\nthe influence of the Holy Ghost \r\nfor the obtaining and assured enjoying of the truth, \r\nthrough Your Christ.\r","Author":"Apostolic Constitutions","UniqueID":"eyFOo"},{"Title":"Unchangeable","Content":"You who are unchangeable, whom nothing changes! \r\nYou who are unchangeable in love, precisely for our welfare, \r\nnot submitting to any change: \r\nmay we too will our welfare, \r\nsubmitting ourselves to the discipline of Your unchangeableness, \r\nso that we may in unconditional obedience find our rest \r\nand remain at rest in Your unchangeableness. \r\n\r\nYou are not like us; \r\nif we are to preserve only some degree of constancy, \r\nwe must not permit ourselves too much to be moved, \r\nnor by too many things. \r\n\r\nYou on the contrary are moved, \r\nand moved in infinite love, by all things. \r\nEven that which we humans beings call an insignificant trifle, and pass by unmoved, \r\nthe need of a sparrow, even this moved You; \r\nand what we so often scarcely notice, \r\na human sigh, this moves You, \r\nYou who are unchangeable! \r\n\r\nYou who in infinite love is moved, \r\nmay this our prayer also move You to add Your blessing, \r\nin order that there may be brought about such a change in us who pray \r\nas to bring us into conformity with Your unchangeable will, \r\nYou who are unchangeable!\r","Author":"by Sören Kierkgaard","UniqueID":"hIinz"},{"Title":"You Have Loved Us First","Content":"Father in Heaven! \r\nYou have loved us first, \r\nhelp us never to forget that You are love \r\nso that this sure conviction might triumph in our hearts \r\nover the seduction of the world, \r\nover the inquietude of the soul, \r\nover the anxiety for the future, \r\nover the fright of the past, \r\nover the distress of the moment. \r\n\r\nBut grant also that this conviction might discipline our soul \r\nso that our heart might remain faithful and sincere \r\nin the love which we bear to all those \r\nwhom You have commanded us to love as we love ourselves.\r","Author":"by Sören Kierkgaard","UniqueID":"GkXpf"},{"Title":"Have A Little Patience","Content":"Father in Heaven! \r\nShow us a little patience \r\nfor we often intend in all sincerity to commune with You \r\nand yet we speak in such a foolish fashion. \r\nSometimes, when we judge that what has come to us is good, \r\nwe do not have enough words to thank You; \r\njust as a mistaken child is thankful for having gotten his own way. \r\nSometimes things go so badly that we call upon You; \r\njust as an unreasoning child fears what would do him good. \r\n\r\nOh, but if we are so childish, \r\nhow far from being Your true children \r\nYou who are our true Father, \r\nah, as if an animal would pretend to have a man as a father. \r\nHow childish we are and how little our proposals \r\nand our language resemble the language which should not be this way \r\nand that we should be otherwise. \r\nHave then a little patience with us.\r","Author":"by Sören Kierkgaard","UniqueID":"Yc8rl"},{"Title":"To Will One Thing","Content":"Father in Heaven! \r\nWhat are we without You! \r\nWhat is all that we know, \r\nvast accumulation though it be, \r\nbut a chipped fragment if we do not know You! \r\nWhat is all our striving, \r\ncould it ever encompass a world, \r\nbut a half-finished work if we do not know You: \r\nYou the One, who is one thing and who is all!\r\n\r\nSo may You give to the intellect, \r\nwisdom to comprehend that one thing; \r\nto the heart, sincerity to receive this understanding; \r\nto the will, purity that wills only one thing. \r\nIn prosperity may You grant perseverance to will one thing; \r\namid distractions, collectedness to will one thing; \r\nin suffering, patience to will one thing.\r\n\r\nYou that gives both the beginning and the completion, \r\nmay You early, at the dawn of the day, \r\ngive to the young the resolution to will one thing. \r\nAs the day wanes, \r\nmay You give to the old a renewed remembrance of their first resolution, \r\nthat the first may be like the last, \r\nthe last like the first, \r\nin possession of a life that has willed only one thing. \r\n\r\nAlas, but this has indeed not come to pass. \r\nSomething has come in between. \r\nThe separation of sin lies in between. \r\nEach day, and day after day \r\nsomething is being placed in between: \r\ndelay, blockage, interruption, \r\ndelusion, corruption. \r\nSo in this time of repentance \r\nmay You give the courage once again \r\nto will one thing.\r","Author":"by Sören Kierkgaard","UniqueID":"zZJsu"},{"Title":"Calm the Waves","Content":"O Lord, calm the waves of this heart,\r\nCalm its storms.\r\nBe still, O my soul, so God can work.\r\nBe still, O my soul, let God’s rest live in you, \r\nGod’s peace cover you.\r\n\r\nWe know that the World cannot give us peace,\r\nOnly You can bring peace,\r\nWe trust your promise,\r\nEven the whole world cannot take away Your peace.\r","Author":"by Sören Kierkgaard","UniqueID":"0UMEc"},{"Title":"We Belong to You","Content":"O God, \r\nwhen at times our strength is taken from us, \r\nwhen sorrow overcomes us like a kind of fog \r\nin which our vision is plunged as into a dark night; \r\nwhen our hearts do tremble with our loss: \r\n\r\nthen teach us and strengthen the conviction in our hearts \r\nthat in death, no less than in life, \r\nwe belong to You.\r","Author":"by Sören Kierkgaard","UniqueID":"gbe8B"}],"Table Graces":[{"Title":"Table Graces","Content":"You are blessed, O Lord, \r\nwho nourishes me from my youth, \r\nwho gives food to all flesh. \r\n\r\nFill our hearts with joy and gladness,\r\nthat having always what is sufficient for us, \r\nwe may abound to every good work, \r\nin Christ Jesus our Lord, \r\nthrough whom glory, honour, and power be to You forever.\r\n","UniqueID":"zAwkB"}],"Psalms":[{"Title":"Psalms 1","Content":"[bible:Psalms 1]","UniqueID":"HRFEn"},{"Title":"Psalms 2","Content":"[bible:Psalms 2]","UniqueID":"2CKmX"}],"Quotes":[{"Quote":"The function of prayer is not to influence God, but rather to change the nature of the one who prays.","Author":"Sören Kierkegaard","UniqueID":"9GI7x"}],"Pages":[{"Title":"How to pray","Icon":"face","Content":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eleifend ligula ipsum, sed suscipit nulla bibendum et. Maecenas rhoncus lacus elit. Nunc ullamcorper sollicitudin blandit. Phasellus sem ipsum, viverra at tempor a, varius pretium lorem. Ut ullamcorper, ante sit amet sagittis feugiat, neque erat congue elit, sed viverra arcu leo et turpis. Aenean odio enim, hendrerit nec ligula non, cursus tincidunt leo. Nam vel velit tincidunt, sodales augue et, hendrerit tellus. Mauris porta, mauris vel dapibus dictum, turpis risus tempus lacus, facilisis scelerisque lacus augue ac nulla. Suspendisse at ornare nunc. Curabitur at finibus odio. Suspendisse potenti. Sed aliquet euismod lacus in iaculis.\n\nVivamus eleifend lectus ligula, a dignissim est dignissim nec. Praesent felis nulla, suscipit ut feugiat vel, consequat porta arcu. Etiam imperdiet aliquam dui non laoreet. Nam tellus justo, fringilla ornare ligula sit amet, suscipit maximus ligula. Donec a pellentesque arcu, vitae sollicitudin erat. Vestibulum bibendum scelerisque tristique. Proin sit amet diam ut eros ornare rhoncus. Donec ac condimentum ante. Integer facilisis in massa et vulputate. Maecenas vitae posuere nibh.\n\nMaecenas sem metus, malesuada id euismod id, fermentum faucibus augue. Cras semper ex convallis arcu scelerisque sollicitudin. Ut euismod posuere lectus, quis faucibus mauris aliquam non. Quisque tristique ligula ante, eget hendrerit risus efficitur at. Duis ac dignissim eros, ac tempus nisl. Quisque vel tristique arcu. Curabitur molestie commodo pharetra. Nam mauris nibh, semper congue rhoncus quis, malesuada eu lorem. Donec eu risus nec lacus condimentum dictum vel at sapien. Etiam ipsum lorem, molestie ultricies risus at, suscipit pellentesque sapien. ","UniqueID":"Ycm0Q"},{"Title":"About","Icon":"info_big","Content":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eleifend ligula ipsum, sed suscipit nulla bibendum et. Maecenas rhoncus lacus elit. Nunc ullamcorper sollicitudin blandit. Phasellus sem ipsum, viverra at tempor a, varius pretium lorem. Ut ullamcorper, ante sit amet sagittis feugiat, neque erat congue elit, sed viverra arcu leo et turpis. Aenean odio enim, hendrerit nec ligula non, cursus tincidunt leo. Nam vel velit tincidunt, sodales augue et, hendrerit tellus. Mauris porta, mauris vel dapibus dictum, turpis risus tempus lacus, facilisis scelerisque lacus augue ac nulla. Suspendisse at ornare nunc. Curabitur at finibus odio. Suspendisse potenti. Sed aliquet euismod lacus in iaculis.\n\nVivamus eleifend lectus ligula, a dignissim est dignissim nec. Praesent felis nulla, suscipit ut feugiat vel, consequat porta arcu. Etiam imperdiet aliquam dui non laoreet. Nam tellus justo, fringilla ornare ligula sit amet, suscipit maximus ligula. Donec a pellentesque arcu, vitae sollicitudin erat. Vestibulum bibendum scelerisque tristique. Proin sit amet diam ut eros ornare rhoncus. Donec ac condimentum ante. Integer facilisis in massa et vulputate. Maecenas vitae posuere nibh.\n\nMaecenas sem metus, malesuada id euismod id, fermentum faucibus augue. Cras semper ex convallis arcu scelerisque sollicitudin. Ut euismod posuere lectus, quis faucibus mauris aliquam non. Quisque tristique ligula ante, eget hendrerit risus efficitur at. Duis ac dignissim eros, ac tempus nisl. Quisque vel tristique arcu. Curabitur molestie commodo pharetra. Nam mauris nibh, semper congue rhoncus quis, malesuada eu lorem. Donec eu risus nec lacus condimentum dictum vel at sapien. Etiam ipsum lorem, molestie ultricies risus at, suscipit pellentesque sapien. ","UniqueID":"hcAV3"},{"Title":"Privacy and security","Icon":"shield","Content":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eleifend ligula ipsum, sed suscipit nulla bibendum et. Maecenas rhoncus lacus elit. Nunc ullamcorper sollicitudin blandit. Phasellus sem ipsum, viverra at tempor a, varius pretium lorem. Ut ullamcorper, ante sit amet sagittis feugiat, neque erat congue elit, sed viverra arcu leo et turpis. Aenean odio enim, hendrerit nec ligula non, cursus tincidunt leo. Nam vel velit tincidunt, sodales augue et, hendrerit tellus. Mauris porta, mauris vel dapibus dictum, turpis risus tempus lacus, facilisis scelerisque lacus augue ac nulla. Suspendisse at ornare nunc. Curabitur at finibus odio. Suspendisse potenti. Sed aliquet euismod lacus in iaculis.\n\nVivamus eleifend lectus ligula, a dignissim est dignissim nec. Praesent felis nulla, suscipit ut feugiat vel, consequat porta arcu. Etiam imperdiet aliquam dui non laoreet. Nam tellus justo, fringilla ornare ligula sit amet, suscipit maximus ligula. Donec a pellentesque arcu, vitae sollicitudin erat. Vestibulum bibendum scelerisque tristique. Proin sit amet diam ut eros ornare rhoncus. Donec ac condimentum ante. Integer facilisis in massa et vulputate. Maecenas vitae posuere nibh.\n\nMaecenas sem metus, malesuada id euismod id, fermentum faucibus augue. Cras semper ex convallis arcu scelerisque sollicitudin. Ut euismod posuere lectus, quis faucibus mauris aliquam non. Quisque tristique ligula ante, eget hendrerit risus efficitur at. Duis ac dignissim eros, ac tempus nisl. Quisque vel tristique arcu. Curabitur molestie commodo pharetra. Nam mauris nibh, semper congue rhoncus quis, malesuada eu lorem. Donec eu risus nec lacus condimentum dictum vel at sapien. Etiam ipsum lorem, molestie ultricies risus at, suscipit pellentesque sapien. ","UniqueID":"9BST5"}]};

let moments = Content['Moments'];

let initialCategories = Content['Categories'].map((category, index) => {
  let allowedMoments = [];

  moments.forEach(moment => {
    if (category[moment.Title]) allowedMoments.push(moment.Title);
  });

  return {
    enabled: true,
    moments: allowedMoments,
    order: index,
    isFreeForm: false,
    name: category.Title,
    icon: category.Icon,
    shuffle: category.Shuffle,
    slug: Slugify(category.Title),
    description: category.Description,
  }
});

let isEnabledFor = (momentName) => {
  return (category) => category.moments.includes(momentName)
};

let initialState = {
  moments: [],
  freeCategories: []
};

moments.forEach(moment => {
  initialState.moments.push({
    name: moment.Title,
    color: moment.Color,
    from: moment.Starts,
    till: moment.Ends,
    colorBackground: moment['Background Color'],
    background: moment.Background,
    slug: Slugify(moment.Title),
    prayerCategories: initialCategories.filter(isEnabledFor(moment.Title)),
    enabled: moment.Enabled
  });
});

/**
 * Holds information about the schedule, is a Redux reducer
 */
function ScheduleReducer (state = initialState, action) {
  return produce(state, nextState => {
    let moment = action.payload && action.payload.momentSlug && nextState.moments.find(moment => moment.slug === action.payload.momentSlug);
    let category = action.payload && action.payload.categorySlug && moment && moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
    let freeCategory = action.payload && action.payload.categorySlug && nextState.freeCategories.find(category => category.slug === action.payload.categorySlug);

    if (action.type === 'moment-toggle') {
      moment.enabled = !moment.enabled;
    }

    if (action.type === 'category-toggle') {
      category.enabled = !category.enabled;
    }

    if (action.type === 'set-category-order') {
      for (let [categorySlug, order] of Object.entries(action.payload.order)) {
        let category = moment.prayerCategories.find(category => category.slug === categorySlug);
        category.order = order;
      }
    }

    if (action.type === 'create-category') {
      nextState.freeCategories.push({
        name: action.payload.category.name,
        slug: action.payload.category.slug,
        items: action.payload.category.items
      });

      let {items, ...slimCategory} = action.payload.category;

      /**
       * Add the category to all the moments
       */
      nextState.moments.forEach(innerMoment => {
        innerMoment.prayerCategories.push(Object.assign({}, slimCategory, { enabled: innerMoment.slug === moment.slug}));
      });
    }

    if (action.type === 'delete-category') {
      /**
       * Remove the category from all the moments
       */
      nextState.moments.forEach(moment => {
        let category = action.payload && action.payload.categorySlug && moment.prayerCategories.find(category => category.slug === action.payload.categorySlug);
        let existingCategoryIndex = moment.prayerCategories.indexOf(category);
        moment.prayerCategories.splice(existingCategoryIndex, 1);
      });

      /**
       * Remove it from the free categories.
       */
      let foundCategory = nextState.freeCategories.find(freeCategory => freeCategory.slug === category.slug);
      let existingFreeCategoryIndex = nextState.freeCategories.indexOf(foundCategory);
      nextState.freeCategories.splice(existingFreeCategoryIndex, 1);
    }

    if (action.type === 'add-prayer-point') {
      freeCategory.items.push({
        slug: Slugify(action.payload.prayerPoint),
        title: action.payload.prayerPoint,
        description: action.payload.description,
        order: freeCategory.items.length
      });
    }

    if (action.type === 'delete-prayer-point') {
      let item = freeCategory.items.find(item => item.slug === action.payload.prayerPointSlug);
      let ItemIndex = freeCategory.items.indexOf(item);
      freeCategory.items.splice(ItemIndex, 1);
    }

    if (action.type === 'update-prayer-point') {
      let item = freeCategory.items.find(item => item.slug === action.payload.prayerPointSlug);
      item.title = action.payload.title;
      item.description = action.payload.description;
    }

    if (action.type === 'set-prayer-points-order') {
      for (let [prayerPointSlug, order] of Object.entries(action.payload.order)) {
        let category = freeCategory.items.find(category => category.slug === prayerPointSlug);
        category.order = order;
      }
    }

    if (action.type === 'set-moment-time') {
      moment.from = action.payload.from;
      moment.till = action.payload.till;
    }

  });
}

/**
 * Holds information about the schedule, is a Redux reducer
 */
function PrayReducer (state = {
  usedPrayers: [],
  calendar: []
}, action) {
  return produce(state, nextState => {

    let setCurrentMomentCategoryContent = (content) => {
      let date = new Date(action.payload.date);
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();
      let momentSlug = action.payload.momentSlug;
      let categorySlug = action.payload.categorySlug;
      let dateString = `${year}-${month}-${day}`;

      let currentDateObject = nextState.calendar.find(item => item.date === dateString);
      if (!currentDateObject) {
        currentDateObject = {
          date: dateString
        };
        nextState.calendar.push(currentDateObject);
      }

      if (!currentDateObject[momentSlug]) {
        currentDateObject[momentSlug] = {};
      }

      currentDateObject[momentSlug][categorySlug] = content;
    };

    if (action.type === 'mark-fixed-prayer') {
      nextState.usedPrayers.push(action.payload.prayerId);
      setCurrentMomentCategoryContent(action.payload.prayerId);
    }

    if (action.type === 'clear-fixed-prayer-category') {
      let categoryPrayersIds = Content[action.payload.categoryName].map(prayer => prayer.UniqueID);
      nextState.usedPrayers = nextState.usedPrayers.filter(prayer => !categoryPrayersIds.includes(prayer));
    }

    if (action.type === 'mark-free-prayer') {
      setCurrentMomentCategoryContent(action.payload.items);
    }

  });
}

const initialState$1 = {};

const reducers = sharedCombineReducers({
  app: AppReducer,
  schedule: ScheduleReducer,
  pray: PrayReducer
});

const middleware = applyMiddleware(
  promiseMiddleware,
);

const composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

let enhancers = typeof navigator !== 'undefined' ?
composeEnhancers(middleware, persistState(null, {
  slicer: savableSlicer
})) : middleware;

const Store = createStore(reducers, initialState$1, enhancers);

/**
 * Some helpers to easily create Custom Elements composed in a base class.
 */
class BaseElement extends HTMLElement {
  constructor () {
    super();
    this.interval = false;
    this.subscribers = [];

    // Binds draw to the element.
    const elementDraw = this.draw;
    let that = this;
    this.root = document.querySelector('prayer-app');

    this.draw = function () {
      render(this, () => elementDraw.apply(this, arguments));

      let page = document.querySelector('.page');

      if (page) {
        setTimeout(() => {
          page.classList.remove('hidden');
        });
      }

      this.afterDraw();

      let inputs = this.querySelectorAll('input,textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          document.body.classList.add('has-focused-input');
        });
        input.addEventListener('blur', () => {
          document.body.classList.remove('has-focused-input');
        });
      });

      /**
       * After the draw attach click handler for internal hrefs.
       * @type {NodeListOf<HTMLElementTagNameMap[string]> | NodeListOf<Element> | NodeListOf<SVGElementTagNameMap[string]>}
       */
      let links = this.querySelectorAll('a');
      links.forEach(link => {
        if (typeof link.hasListener === 'undefined') {
          link.hasListener = true;

          if (link.getAttribute('href') === location.pathname) link.classList.add('active');

          link.addEventListener('click', event => {
            event.preventDefault();

            if (link.getAttribute('href') === location.pathname) return;

            links.forEach(innerLink => {
              let isCurrent = innerLink.getAttribute('href') === link.getAttribute('href');
              innerLink.classList[isCurrent ? 'add' : 'remove']('active');
            });

            let page = document.querySelector('.page');

            if (page) {
              page.addEventListener('transitionend', () => {
                that.root.router.navigate(link.getAttribute('href'));
              }, {once: true});
              page.classList.add('hidden');
            }
            else {
              that.root.router.navigate(link.getAttribute('href'));
            }
          });

        }
      });
    };
  }

  get route () {
    return this.root.router.currentRoute;
  }

  connectedCallback () {
    this.draw();
  }

  /**
   * API, needs to be implemented by the child element.
   * Holds the lighterHTML template.
   */
  draw () {
    throw new Error('Please implement draw() method');
  }

  /**
   * A wrapper around redux-watch.
   * The element knows which subscribers there are and unsubscribes them when removed from the DOM.
   * @param objectPath
   * @param callback
   */
  watch (objectPath, callback) {
    if (!Array.isArray(objectPath)) { objectPath = [objectPath]; }

    const wrappedWatch = function(objectPath, callback) {
      return Store.subscribe(watch(Store.getState, objectPath)((newVal, oldVal, objectPath) => {
        let oldValue = oldVal.get(objectPath);
        let newValue = newVal.get(objectPath);

        if (newValue !== oldValue) {
          callback(newValue, oldValue);
        }
      }));
    };

    objectPath.forEach(objectPathItem => this.subscribers.push(wrappedWatch(objectPathItem, callback)));
  }

  /**
   * When removed from the DOM unsubscribe all redux subscribers.
   */
  disconnectedCallback () {
    this.subscribers.forEach(unsubscribe => unsubscribe());

    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  afterDraw () {}

  tokenize (content) {
    return this.root.tokenizer.replace(content);
  }
}

const toggleMoment = (momentSlug) => {
  Store.dispatch({
    type: 'moment-toggle',
    payload: {
      momentSlug: momentSlug
    }
  });
};

const setMomentTime = (momentSlug, from, till) => {
  Store.dispatch({
    type: 'set-moment-time',
    payload: {
      momentSlug: momentSlug,
      from: from,
      till: till
    }
  });
};

const toggleCategory = (momentSlug, categorySlug) => {
  Store.dispatch({
    type: 'category-toggle',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug
    }
  });
};

const setCategoriesOrder = (momentSlug, order) => {
  Store.dispatch({
    type: 'set-category-order',
    payload: {
      momentSlug: momentSlug,
      order: order
    }
  });
};

const createFreeCategory = (momentSlug, category) => {
  Store.dispatch({
    type: 'create-category',
    payload: {
      momentSlug: momentSlug,
      category: category
    }
  });
};

const deleteFreeCategory = (momentSlug, categorySlug) => {
  Store.dispatch({
    type: 'delete-category',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug
    }
  });
};

const addPrayerPoint = (momentSlug, categorySlug, prayerPoint, description) => {
  Store.dispatch({
    type: 'add-prayer-point',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      prayerPoint: prayerPoint,
      description: description
    }
  });
};

const updatePrayerPoint = (categorySlug, prayerPointSlug, title, description) => {
  Store.dispatch({
    type: 'update-prayer-point',
    payload: {
      categorySlug: categorySlug,
      prayerPointSlug: prayerPointSlug,
      title: title,
      description: description
    }
  });
};

const deletePrayerPoint = (momentSlug, categorySlug, prayerPointSlug) => {
  Store.dispatch({
    type: 'delete-prayer-point',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      prayerPointSlug: prayerPointSlug
    }
  });
};

const setPrayerPointsOrder = (momentSlug, categorySlug, order) => {
  Store.dispatch({
    type: 'set-prayer-points-order',
    payload: {
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      order: order
    }
  });
};

const navigate = (path) => {
  Store.dispatch({
    type: 'navigate',
    payload: {
      path: path
    }
  });
};

const setBible = (bible) => {
  Store.dispatch({
    type: 'set-bible',
    payload: {
      bible: bible
    }
  });
};

const toggleGrid = () => {
  Store.dispatch({
    type: 'toggle-grid'
  });
};

customElements.define('prayer-settings', class PrayerSettings extends BaseElement {

  connectedCallback() {
    this.draw();
  }

  draw () {
    let t = this.root.t;
    let s = Store.getState().schedule;
    let a = Store.getState().app;
    let bibles = Content.Bibles;
    let englishBibles = bibles.filter(bible => bible.language.id === 'eng');

    return html`
      <h2 class="page-title">${t`When and how do you want to pray?`}</h2>

      <div class="field">
        <label>
          ${t.direct('Enabled moments and settings')}
        </label>
        
        <div class="item-list">
        ${s.moments.map(moment => html`
          <div class="${'item moment ' + (moment.enabled ? 'enabled' : '')}" style="${`--color-primary: ${moment.color};`}">
            <input type="checkbox" id="${'toggle-' + moment.slug}" .checked="${moment.enabled}" onchange="${() => {toggleMoment(moment.slug); this.draw();}}">
            <label for="${'toggle-' + moment.slug}">
              <span class="title">${t.direct(moment.name)}</span>
            </label>
            <a href="${'/settings/' + moment.slug}">
              <prayer-icon name="pencil" />
            </a>
          </div>
        `)}
        </div>
      </div>

      <div class="field">
        <label>${t`Bible translation`}</label>
        <select onchange="${event => setBible(event.target.value)}">
            ${englishBibles.map(bible => html`
                <option value="${bible.id}" .selected="${a.bible === bible.id}">${bible.name}</option>
            `)}            
        </select>
      </div>
      
      <div class="end"></div>
    `;
  }
});

function getCurrentActiveMoment(moments) {
  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();

  let time = (hour * 60) + minutes;

  let activeMoments = moments.filter(moment => {
    let fromHours = parseInt(moment.from.split(':')[0]);
    let fromMinutes = parseInt(moment.from.split(':')[1]);
    let momentFromTime = (fromHours * 60) + fromMinutes;

    let tillHours = parseInt(moment.till.split(':')[0]);
    let tillMinutes = parseInt(moment.till.split(':')[1]);
    let momentTillTime = (tillHours * 60) + tillMinutes;

    return moment.enabled && time > momentFromTime && time < momentTillTime;
  });

  if (activeMoments) {
    return activeMoments[0];
  }
}

customElements.define('prayer-home', class PrayerHome extends BaseElement {

  draw () {
    let t = this.root.t;
    let s = Store.getState().schedule;

    this.dataset.items = s.moments.filter(moment => moment.enabled).length.toString();

    return html`

    <span class="prefix">${t`Welcome,`}</span>
    <h1 class="title">${t`Some beautiful prayers are to be prayed.`}</h1>
    
    <div class="moments slider">
      ${s.moments.filter(moment => moment.enabled).map(moment => html`
        <a class="moment card" data-moment="${moment.slug}" href="${'/pray/' + moment.slug}" style="${`--color-primary: ${moment.color};  --color-secondary: ${moment.colorBackground}`}">
          <div class="image" style="${`background-image: url(${moment.background});`}"></div>
          <span class="button">
            ${t`Pray`}
            <prayer-icon name="arrow-right" />
          </span>
          <span class="title">${t.direct(moment.name)}</span>
        </a>
      `)}
      
      <div class="end"></div>
    </div>
    
    <div class="end"></div>
    `;
  }

  afterDraw() {
    let s = Store.getState().schedule;
    let activeMoment = getCurrentActiveMoment(s.moments);

    if (activeMoment) {
      let activeMomentCard = this.querySelector(`[data-moment="${activeMoment.slug}"]`);
      activeMomentCard.scrollIntoView();
    }
  }
});

const markFreePrayer = (date, momentSlug, categorySlug, items) => {
  Store.dispatch({
    type: 'mark-free-prayer',
    payload: {
      items: items,
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      date: date
    }
  });
};

const markFixedPrayer = (date, momentSlug, categorySlug, prayerId) => {
  Store.dispatch({
    type: 'mark-fixed-prayer',
    payload: {
      prayerId: prayerId,
      momentSlug: momentSlug,
      categorySlug: categorySlug,
      date: date
    }
  });
};

const clearFixedPrayerCategory = (categoryName) => {
  Store.dispatch({
    type: 'clear-fixed-prayer-category',
    payload: {
      categoryName: categoryName,
    }
  });
};

class PrayerScheduler {

  /**
   * Returns a couple of items from the list.
   * @param date
   * @param prayerCategory
   * @param momentSlug
   * @returns {{marked: boolean, Content: Hole, Title: *, category: *}}
   */
  getFreeFormPrayer (date, prayerCategory, momentSlug) {
    this.s = Store.getState().schedule;
    this.p = Store.getState().pray;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let dateString = `${year}-${month}-${day}`;
    let currentDateObject = this.p.calendar.find(item => item.date === dateString);
    let assignedItemIds = currentDateObject && currentDateObject[momentSlug] && currentDateObject[momentSlug][prayerCategory.slug];

    let freeCategory = this.s.freeCategories.find(freeCategory => freeCategory.slug === prayerCategory.slug);
    let assignedItems = assignedItemIds && assignedItemIds.length ? freeCategory.items.filter(item => assignedItemIds.includes(item.slug)) : [];

    if (assignedItems.length) {
      return {
        Title: prayerCategory.name,
        items: assignedItems,
        marked: true,
        category: prayerCategory,
      }
    }
    else {
      return this.getNextFreePrayer(date, prayerCategory);
    }
  }

  /**
   * Populates the next items of the free prayer category to pray for.
   * @param date
   * @param prayerCategory
   * @returns {{marked: boolean, Content: Hole, Title: *, category: *, items: *[]}}
   */
  getNextFreePrayer (date, prayerCategory) {
    this.p = Store.getState().pray;
    this.s = Store.getState().schedule;

    // for (let [date, moments] of Object.entries(this.p.calendar)) {
    //
    // }

    let previousItems = {};

    let chunks = [];

    let addToChunks = (items) => {
      for (let [day, moments] of Object.entries(items)) {
        for (let [moment, categories] of Object.entries(moments)) {
          for (let [category, Content] of Object.entries(categories)) {
            if (Array.isArray(Content)) {
              chunks.push(Content);
            }
          }
        }
      }
    };

    addToChunks(previousItems);

    let freeCategory = this.s.freeCategories.find(freeCategory => freeCategory.slug === prayerCategory.slug);

    let max = Math.ceil(freeCategory.items.length / 7);

    let itemsAllowedByDistanceOfPastUsage = [];

    // Check if the item has been used last 7 days.
    freeCategory.items.forEach(item => {
      let found = false;
      for (let i = 0; i < 7; i++) {
        if (chunks[i] && chunks[i].includes(item.slug)) {
          found = true;
        }
      }

      if (!found) {
        itemsAllowedByDistanceOfPastUsage.push(item);
      }
    });

    let allowedItems = itemsAllowedByDistanceOfPastUsage.slice(0, max);

    return {
      Title: prayerCategory.name,
      items: allowedItems,
      marked: false,
      category: prayerCategory,
    };
  }


  /**
   * First try to see if this moment and day combination has already been assigned prayers.
   * If not gather new ones.
   * @param date
   * @param prayerCategory
   * @param momentSlug
   * @returns {any|({} & number & {marked: boolean, category: *})|({} & bigint & {marked: boolean, category: *})|({} & null & {marked: boolean, category: *})|({} & [] & {marked: boolean, category: *})|any}
   */
  getFixedPrayer (date, prayerCategory, momentSlug) {
    this.p = Store.getState().pray;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    let dateString = `${year}-${month}-${day}`;
    let currentDateObject = this.p.calendar.find(item => item.date === dateString);
    let assignedPrayerId = currentDateObject ? currentDateObject[momentSlug] && currentDateObject[momentSlug][prayerCategory.slug] : false;

    if (assignedPrayerId) {
      let allPrayers = Content[prayerCategory.name];
      let foundPrayer = allPrayers.find(prayer => prayer.UniqueID === assignedPrayerId);

      if (!foundPrayer) {
        throw new Error('Could not find prayer: ' + assignedPrayerId)
      }

      return Object.assign({}, foundPrayer, {
        category: prayerCategory,
        marked: true,
      });
    }
    else {
      return this.getNextFixedPrayer(prayerCategory);
    }
  }

  /**
   * This also clears the state if all prayers of one category has been used.
   * @param prayerCategory
   * @returns {any}
   */
  getNextFixedPrayer (prayerCategory) {
    this.p = Store.getState().pray;
    if (!Content[prayerCategory.name]) {
      throw new Error(`The category: ${prayerCategory.name} could not be found in the content data.`);
    }

    let allPrayers = Content[prayerCategory.name];
    let unusedPrayers = allPrayers.filter(prayer => !this.p.usedPrayers.includes(prayer.UniqueID));

    if (prayerCategory.shuffle) {
      unusedPrayers = this.shuffle([...unusedPrayers]);
    }

    if (!unusedPrayers.length) {
      clearFixedPrayerCategory(prayerCategory.name);
      return Object.assign({}, allPrayers[0], {
        category: prayerCategory
      });
    }
    else {
      return Object.assign({}, unusedPrayers[0], {
        category: prayerCategory
      });
    }
  }

  shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

}

let toLines = (content) => {
  if (typeof content === 'object') {
    return content;
  }

  return content.toString().replace(/(?:\r\n|\r|\n)/g, 'NEWLINE').split('NEWLINE').map(line => html`${line}<br />`)
};

customElements.define('prayer-pray', class PrayerPray extends BaseElement {

  draw () {
    let date = new Date();
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    let t = this.root.t;
    this.setAttribute('style', `--color-primary: ${moment.color}; --color-secondary: ${moment.colorBackground}`);

    let activeCategories = moment.prayerCategories.filter(category => category.enabled).sort((a, b) => a.order - b.order);
    let prayerScheduler = new PrayerScheduler();
    let prayers = activeCategories.map(category => {
      return category.isFreeForm ? prayerScheduler.getFreeFormPrayer(date, category, moment.slug) : prayerScheduler.getFixedPrayer(date, category, moment.slug);
    });

    prayers.forEach(prayer => {
      if (!prayer.marked) {
        if (prayer.category.isFreeForm) {
          markFreePrayer(date.toDateString(), moment.slug, prayer.category.slug, prayer.items.map(item => item.slug));
        }
        else {
          markFixedPrayer(date.toDateString(), moment.slug, prayer.category.slug, prayer.UniqueID);
        }
      }
    });

    return html`
      <a class="close-prayers" href="/pray">
        <prayer-icon name="cross" />
      </a>

      <div class="pre-header">
        <span class="moment">${t.direct(moment.name)}</span>
        <div class="indicator">
            ${prayers.map((prayer, index) => html`<div class="${'indicator-item' + (index === 0 ? ' active' : '')}"></div>`)}
        </div>      
      </div>

      <div class="slider">
      ${prayers.map((prayer, index) => {
        let category = prayer.category.isFreeForm ? t.direct('Your category') : (prayer.category.name !== prayer.Title ? prayer.category.name : '');
              
        return html`<div class="prayer" data-id="${prayer.UniqueID}">
          <div class="header">
            <h2 class="title">${prayer.category.isFreeForm ? prayer.category.name : prayer.Title}</h2>
            <div class="meta">
              ${category ? html`<small class="category"><prayer-icon name="tag" />${category}</small>` : html`` }
              ${prayer.Author ? html`<em class="author"><prayer-icon name="author" />${prayer.Author}</em>` : html``}            
            </div>
          </div>
          <div class="inner">
            <p class="content">${prayer.category.isFreeForm ? 
              prayer.items.map(item => html`
                <span class="prayer-item">${item.title}</span>
                ${item.description ? html`<em class="description">${item.description}</em>` : ''}
              `) : 
              toLines(this.tokenize(prayer.Content))}
            </p>
            <span class="amen">Amen</span>  
          </div>
        </div>`      
      })}
      </div>
    `;
    }

    afterDraw() {
      let indicators = this.querySelectorAll('.indicator-item');
      let prayers = this.querySelectorAll('.prayer');

      let options = {
        root: this.querySelector('.slider'),
        rootMargin: '30px',
        threshold: .8
      };

      let observer = new IntersectionObserver((entries, observer) => {
        let active = [];
        entries.forEach(entry => {
          if (entry.isIntersecting) active.push(entry.target);
        });

        let activeIndex = [...prayers].indexOf(active[0]);
        indicators.forEach((indicator, index) => indicator.classList[index === activeIndex ? 'add' : 'remove']('active'));
      }, options);

      prayers.forEach(prayer => {
        observer.observe(prayer);
      });

    }
});

let _w = window,
  _b = document.body,
  _d = document.documentElement;

// get position of mouse/touch in relation to viewport
let getPoint = function( e )
{

  let scrollX = Math.max( 0, _w.pageXOffset || _d.scrollLeft || _b.scrollLeft || 0 ) - ( _d.clientLeft || 0 ),
    scrollY = Math.max( 0, _w.pageYOffset || _d.scrollTop || _b.scrollTop || 0 ) - ( _d.clientTop || 0 ),
    pointX  = e ? ( Math.max( 0, e.pageX || e.clientX || 0 ) - scrollX ) : 0,
    pointY  = e ? ( Math.max( 0, e.pageY || e.clientY || 0 ) - scrollY ) : 0;

  if (!pointX && !pointY) {
    pointX = e.targetTouches[0].pageX;
    pointY = e.targetTouches[0].pageY;
  }

  return { x: pointX, y: pointY };
};

function isTouchDevice() {
  let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');

  let mq = function (query) {
    return window.matchMedia(query).matches;
  };

  if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    return true;
  }

  let query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
  return mq(query);
}

function Sortable ( container, options ) {
    if( container && container instanceof Element ) {
      this._container = container;
      this._options   = options || {}; /* nothing atm */
      this._clickItem = null;
      this._dragItem  = null;
      this._hovItem   = null;
      this._sortLists = [];
      this._click     = {};
      this._dragging  = false;

      this._container.setAttribute( "data-is-sortable", 1 );
      this._container.style["position"] = "static";

      this.handlers = {
        "touchstart": this._onPress.bind( this ),
        "touchend": this._onRelease.bind( this ),
        "touchmove": this._onMove.bind( this ),
      };

      if (!isTouchDevice()) {
        this.handlers['mousedown'] =  this._onPress.bind( this );
        this.handlers['mouseup'] =  this._onRelease.bind( this );
        this.handlers['mousemove'] =  this._onMove.bind( this );
      }

      for (let [eventName, handler] of Object.entries(this.handlers)) {
        document.body.addEventListener( eventName, handler, true );
      }
    }
}

// class prototype
Sortable.prototype = {
  constructor: Sortable,

  destroy: function () {
    for (let [eventName, handler] of Object.entries(this.handlers)) {
      document.body.removeEventListener( eventName, handler, true);
    }
  },

  // serialize order into array list
  toArray: function( attr )
  {
    attr = attr || "id";

    let data = [],
      item = null,
      uniq = "";

    for( let i = 0; i < this._container.children.length; ++i )
    {
      item = this._container.children[ i ],
        uniq = item.getAttribute( attr ) || "";
      uniq = uniq.replace( /[^0-9]+/gi, "" );
      data.push( uniq );
    }
    return data;
  },

  // serialize order array into a string
  toString: function( attr, delimiter )
  {
    delimiter = delimiter || ":";
    return this.toArray( attr ).join( delimiter );
  },

  // checks if mouse x/y is on top of an item
  _isOnTop: function( item, x, y )
  {
    let box = item.getBoundingClientRect(),
      isx = ( x > box.left && x < ( box.left + box.width ) ),
      isy = ( y > box.top && y < ( box.top + box.height ) );
    return ( isx && isy );
  },

  // manipulate the className of an item (for browsers that lack classList support)
  _itemClass: function( item, task, cls )
  {
    let list  = item.className.split( /\s+/ ),
      index = list.indexOf( cls );

    if( task === "add" && index == -1 )
    {
      list.push( cls );
      item.className = list.join( " " );
    }
    else if( task === "remove" && index != -1 )
    {
      list.splice( index, 1 );
      item.className = list.join( " " );
    }
  },

  // swap position of two item in sortable list container
  _swapItems: function( item1, item2 )
  {
    let parent1 = item1.parentNode,
      parent2 = item2.parentNode;

    if( parent1 !== parent2 )
    {
      // move to new list
      parent2.insertBefore( item1, item2 );
    }
    else {
      // sort is same list
      let temp = document.createElement( "div" );
      parent1.insertBefore( temp, item1 );
      parent2.insertBefore( item1, item2 );
      parent1.insertBefore( item2, temp );
      parent1.removeChild( temp );
    }
  },

  // update item position
  _moveItem: function( item, x, y )
  {
    item.style["-webkit-transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
    item.style["-moz-transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
    item.style["-ms-transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
    item.style["transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
  },

  // make a temp fake item for dragging and add to container
  _makeDragItem: function( item )
  {
    this._trashDragItem();
    this._sortLists = document.querySelectorAll( "[data-is-sortable]" );

    this._clickItem = item;
    this._itemClass( this._clickItem, "add", "active" );

    this._dragItem = document.createElement( item.tagName );
    this._dragItem.classList = item.classList;
    this._dragItem.classList.add('drag-ghost');
    this._dragItem.innerHTML = item.innerHTML;
    this._dragItem.style["position"] = "absolute";
    this._dragItem.style["z-index"] = "999";
    this._dragItem.style["display"] = "inline-flex";
    this._dragItem.style["left"] = ( item.offsetLeft || 0 ) + "px";
    this._dragItem.style["top"] = ( item.offsetTop || 0 ) + "px";
    this._dragItem.style["width"] = ( item.offsetWidth || 0 ) + "px";

    this._container.appendChild( this._dragItem );
  },

  // remove drag item that was added to container
  _trashDragItem: function()
  {
    if( this._dragItem && this._clickItem )
    {
      this._itemClass( this._clickItem, "remove", "active" );
      this._clickItem = null;

      this._container.removeChild( this._dragItem );
      this._dragItem = null;
    }
  },

  // on item press/drag
  _onPress: function( e )
  {
    if( e && e.target && e.target.parentNode === this._container )
    {
      e.preventDefault();

      this._dragging = true;
      document.body.classList.add('is-sorting');
      this._click = getPoint( e );
      this._makeDragItem( e.target );
      this._onMove( e );
    }
  },

  // on item release/drop
  _onRelease: function( e )
  {
    this._dragging = false;
    document.body.classList.remove('is-sorting');
    this._trashDragItem();
    if (e.target.classList.contains('drag-ghost')) {
      this._container.dispatchEvent(new CustomEvent('sorted'));
    }
  },

  // on item drag/move
  _onMove: function( e )
  {
    if( this._dragItem && this._dragging )
    {
      e.preventDefault();

      let point     = getPoint( e );
      let container = this._container;

      // drag fake item
      this._moveItem( this._dragItem, ( point.x - this._click.x ), ( point.y - this._click.y ) );

      // keep an eye for other sortable lists and switch over to it on hover
      for( let a = 0; a < this._sortLists.length; ++a )
      {
        let subContainer = this._sortLists[ a ];

        if( this._isOnTop( subContainer, point.x, point.y ) )
        {
          container = subContainer;
        }
      }

      // container is empty, move clicked item over to it on hover
      if( this._isOnTop( container, point.x, point.y ) && container.children.length === 0 )
      {
        container.appendChild( this._clickItem );
        return;
      }

      // check if current drag item is over another item and swap places
      for( let b = 0; b < container.children.length; ++b )
      {
        let subItem = container.children[ b ];

        if( subItem === this._clickItem || subItem === this._dragItem )
        {
          continue;
        }
        if( this._isOnTop( subItem, point.x, point.y ) )
        {
          this._hovItem = subItem;
          this._swapItems( this._clickItem, subItem );
        }
      }
    }
  }
};

let addWbr = (string) => {
  let realString = string.toString();
  let split = realString.split(/[/]+/);
  return html`${
    split.map((part, index) => index !== split.length - 1 && split.length > 1 ? html`${part}/<wbr>` : html`${part}`)
  }`;
};

customElements.define('prayer-moment-configure', class PrayerMomentConfigure extends BaseElement {

  async connectedCallback() {
    this.draw();
    let list = this.querySelector('.categories');

    this.sortable = new Sortable(list);
    list.addEventListener('sorted', () => {
      let order = {};
      [...list.children].forEach((child, index) => {
        order[child.dataset.slug] = index;
      });

      // Sort them to their original place so lighterHTML may do its work.
      [...list.children]
      .sort((a,b)=> a.dataset.order > b.dataset.order ? 1 : -1)
      .map(node => list.appendChild(node));

      setCategoriesOrder(this.route.parameters.moment, order);
      this.draw();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sortable.destroy();
  }

  setTime () {
    setMomentTime(this.route.parameters.moment, this.from, this.till);
  }

  draw () {
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    this.from = moment.from;
    this.till = moment.till;
    let categories = [...moment.prayerCategories].sort((a, b) => a.order - b.order);

    let t = this.root.t;

    let categoryIsEnabled = (categorySlug) => {
      let category = categories.find(category => category.slug === categorySlug);
      if (category) {
        return category.enabled;
      }
    };

    return html`
      <h2 class="page-title">
        <a class="back-button" href="/settings"><prayer-icon name="arrow-left" /></a>
        ${t.direct(moment.name)}
      </h2>

      <div class="field">
        <label>${t`Prayer categories`}</label>
        <div class="categories sortable item-list">
        ${categories.map(category => html`
          <div class="${'prayer-category item ' + (categoryIsEnabled(category.slug) ? 'enabled' : '')}" data-order="${category.order}" data-slug="${category.slug}">
            <prayer-icon name="handle" />
            <input type="checkbox" id="${'toggle-' + category.slug}" 
            .checked="${categoryIsEnabled(category.slug)}" 
            onchange="${() => {toggleCategory(moment.slug, category.slug); this.draw();}}">
            <label for="${'toggle-' + category.slug}">
              <span class="title">${addWbr(t.direct(category.name))}</span>
            </label>
            <a href="${`/settings/${this.route.parameters.moment}/prayer-category/${category.slug}`}">
              <img  src="${`/images/${category.isFreeForm ? 'pencil' : 'info'}.svg`}" />
            </a>
          </div>
        `)}
        </div>      
      </div>
      
      <div class="field">
        <label>${t.direct('Create your own category')}</label>
        <p>
          ${t`Do you want to pray for your family, friends, church or city? Create category and add your own prayer points.`}
          <br /><br />
          <a class="button" href="${`/settings/${this.route.parameters.moment}/create-free-category`}">
          ${t.direct('Create category')}
          <prayer-icon name="arrow-right" />
        </a>
        </p>      
      </div>
      
      <div class="row">
        <div class="field">
          <label>${t.direct('From')}</label>
          <small class="description">${t`Usually starts at:`}</small>
          <input value="${moment.from}" type="time" onchange="${event => {this.from = event.target.value; this.setTime();}}">        
        </div>
        
         <div class="field">
          <label>${t.direct('Till')}</label>
          <small class="description">${t`Usually ends at:`}</small>
          <input value="${moment.till}" type="time" onchange="${event => {this.till = event.target.value; this.setTime();}}">
        </div>

        <p class="description">${t`We use this information to scroll to the right moment when you open the app.`}</p>
   
      </div>
    
     
      <div class="end"></div>
    `;
  }
});

customElements.define('prayer-category-details', class PrayerCategoryDetails extends BaseElement {

  connectedCallback() {
    super.connectedCallback();
    let list = this.querySelector('.prayer-items');

    if (list) {
      this.sortable = new Sortable(list);
      list.addEventListener('sorted', () => {
        let order = {};
        [...list.children].forEach((child, index) => {
          order[child.dataset.slug] = index;
        });

        // Sort them to their original place so lighterHTML may do its work.
        [...list.children]
        .sort((a,b)=> a.dataset.order > b.dataset.order ? 1 : -1)
        .map(node => list.appendChild(node));

        setPrayerPointsOrder(this.moment.slug, this.category.slug, order);
        this.draw();
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.sortable) this.sortable.destroy();
  }

  draw () {
    let t = this.root.t;

    let s = Store.getState().schedule;
    this.moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    this.category = this.moment.prayerCategories.find(category => category.slug === this.route.parameters.category);
    this.freeCategory = s.freeCategories.find(category => category.slug === this.route.parameters.category);

    if (!this.category) {
      this.root.router.navigate('/settings');
    }

    return html`
      <h2 class="page-title">
        <a class="back-button" href="${'/settings/' + this.moment.slug}"><prayer-icon name="arrow-left" /></a>
        ${this.category.name}
      </h2>
      <p>${this.category.description}</p>

      ${this.category.isFreeForm && this.freeCategory.items.length ? html`
        <div class="field">
          <label>${t`Your prayer points`}</label>
          <div class="prayer-items sortable item-list">
          ${[...this.freeCategory.items].sort((a, b) => a.order - b.order).map((item, index) => html`
            <div class="item prayer-point enabled" data-slug="${item.slug}" data-order="${item.order}">
              <prayer-icon name="handle" />
              <label>
                <span class="title">${item.title}</span>
                ${item.description ? html`<em class="description">${item.description}</em>` : html``}
              </label>
              <a href="${`/settings/${this.moment.slug}/prayer-category/${this.freeCategory.slug}/${item.slug}`}"><prayer-icon name="pencil" /></a>
            </div>
          `)}
          </div>
        </div>
      ` : html``}
      ${this.category.isFreeForm ? html`
        <a class="button" href="${`/settings/${this.moment.slug}/prayer-category/${this.category.slug}/create`}">
          ${t.direct('Create prayer point')}
          <prayer-icon name="arrow-right" />
        </a>
        
        <button class="button danger" onclick="${() => {deleteFreeCategory(this.moment.slug, this.category.slug); this.root.router.navigate(`/settings/${this.moment.slug}`);}}">
            ${t.direct('Delete category')}
            <prayer-icon name="remove" />
        </button>        

        
        <div class="end"></div>
      ` : html``}
    `;
  }
});

customElements.define('prayer-create-free-category', class PrayerCreateFreeCategory extends BaseElement {

  constructor() {
    super();
    let t = this.root.t;
    this.selected = '';
    this.otherText = '';
    let s = Store.getState().schedule;
    this.categoryExists = false;

    this.suggestions = [{
      Title: t.direct('- Select -'),
      Description: '',
      slug: ''
    }, ...Content['Suggestions'].map(suggestion => {
      return Object.assign(suggestion, {
        slug: Slugify(suggestion.Title)
      })
    }), {
      Title: t.direct('Other...'),
      Description: '',
      slug: '_other_'
    }];

    this.existingCategories = [
      ...s.freeCategories.map(freeCategory => freeCategory.slug),
      ...Content['Categories'].map(prayerCategory => Slugify(prayerCategory.Title))
    ];

    this.suggestions = this.suggestions.filter(suggestion => !this.existingCategories.includes(suggestion.slug));
  }

  createCategory () {
    let s = Store.getState().schedule;
    let moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    let selectedSuggestion = this.suggestions.find(suggestion => suggestion.slug === this.selected);

    return this.selected === '_other_' ? {
      name: this.otherText,
      enabled: true,
      isFreeForm: true,
      description: '',
      items: [],
      order: moment.prayerCategories.length,
      slug: Slugify(this.otherText)
    } : {
      name: selectedSuggestion.Title,
      enabled: true,
      description: selectedSuggestion.Description,
      items: [],
      isFreeForm: true,
      order: moment.prayerCategories.length,
      slug: Slugify(selectedSuggestion.Title)
    };
  }

  saveCategory () {
    let category = this.createCategory();
    if (!this.existingCategories.includes(category.slug)) {
      createFreeCategory(this.route.parameters.moment, category);
      this.root.router.navigate(`/settings/${this.route.parameters.moment}/prayer-category/${category.slug}`);
    }
  }

  validate () {
    let category = this.createCategory();
    this.categoryExists = this.existingCategories.includes(category.slug);
    this.draw();
  }

  draw () {
    let t = this.root.t;

    return html`
    <h2 class="page-title">
        <a class="back-button" href="${'/settings/' + this.route.parameters.moment}"><prayer-icon name="arrow-left" /></a>
        ${t.direct('Create category')}
    </h2>

    <div class="field">
    <label>${t.direct('Title')}</label>
    <select onchange="${event => {this.selected = event.target.value; this.draw();}}">
        ${this.suggestions.map(suggestion => html`
          <option value="${suggestion.slug}">${suggestion.Title}</option>
        `)}
    </select>
    </div>
    

    ${this.selected === '_other_' ? html`
      <div class="field">      <label>${t.direct('Title')}</label>
        <input type="text" onkeyup="${event => {this.otherText = event.target.value; this.validate();}}">
      </div>
    ` : html``}
    
    ${this.categoryExists ? html`
    <span>${t`The category already exists`}</span>
    ` : html`
    <button class="button" onclick="${() => this.saveCategory()}">${t.direct('Save')}</button>
    `}
    `;
  }
});

customElements.define('prayer-menu', class PrayerMenu extends BaseElement {

  draw () {
    let t = this.root.t;

    return html`
      <a class="${'menu-item' + (location.pathname === '/settings' ? ' active' : '')}" href="/settings">
        <prayer-icon name="settings" />
        <span class="title">${t.direct('Settings')}</span>
      </a>

      <a class="${'menu-item' + (location.pathname === '/pray' ? ' active' : '')}" href="/pray">
        <prayer-icon name="compass" />
        <span class="title">${t.direct('Home')}</span>
      </a>

      <a class="${'menu-item' + (location.pathname === '/menu' ? ' active' : '')}" href="/menu">
        <prayer-icon name="dots" />
        <span class="title">${t.direct('Menu')}</span>
      </a>

    `;
  }
});

customElements.define('prayer-icon', class PrayerIcon extends BaseElement {

  async connectedCallback () {
    let name = this.getAttribute('name');
    if (!window.svgCache) window.svgCache = {};
    if (!window.svgCacheWaiters) window.svgCacheWaiters = {};

    if (!window.svgCache[name]) {
      let iconPromise = window.svgCache[name] = fetch(`/images/${name}.svg`);
      iconPromise
      .then(response => response.text())
      .then(response => {
        window.svgCache[name] = response;
        this.innerHTML = window.svgCache[name];

        if (window.svgCacheWaiters[name]) {
          window.svgCacheWaiters[name].forEach(callback => {
            callback();
          });
        }
      });
    }

    if (window.svgCache[name] && window.svgCache[name].then) {
      if (!window.svgCacheWaiters[name]) {
        window.svgCacheWaiters[name] = [];
      }

      window.svgCacheWaiters[name].push(() => {
        this.innerHTML = window.svgCache[name];
      });
    }
    else if (window.svgCache[name]) {
      this.innerHTML = window.svgCache[name];

    }
  }
});

customElements.define('prayer-page', class PrayerHome extends BaseElement {

  draw () {
    let page = Content['Pages'].find(page => page.slug === location.pathname.substr(1));

    return html`
      <h2 class="page-title">${page.Title}</h2>
      <p>${toLines(page.Content)}</p>
      <div class="end"></div>
    `;
  }
});

customElements.define('prayer-main-menu', class PrayerMenu extends BaseElement {

  draw () {
    let t = this.root.t;

    let pages = Content.Pages.map(page => {
      page.slug = Slugify(page.Title);
      return page;
    });

    return html`
      <div class="main-menu">

        <a class="menu-item" href="/pray">
          <prayer-icon name="compass" />
          <span class="title">${t.direct('Home')}</span>
        </a>

        ${pages.map(page => html`
          <a class="menu-item" href="${'/' + page.slug}">
            <prayer-icon name="${page.Icon}" />
            <span class="title">${page.Title}</span>
          </a>
        `)}
        
        <a class="menu-item" href="/settings">
          <prayer-icon name="settings" />
          <span class="title">${t.direct('Settings')}</span>
        </a>

      </div>

    `;
  }
});

customElements.define('prayer-category-prayer-point', class PrayerCategoryPrayerPoint extends BaseElement {
  draw() {
    let t = this.root.t;
    let s = Store.getState().schedule;
    this.freeCategory = s.freeCategories.find(category => category.slug === this.route.parameters.category);
    let item = Object.assign({}, this.freeCategory.items.find(item => item.slug === this.route.parameters.item));

    let categoryUrl = `/settings/${this.route.parameters.moment}/prayer-category/${this.route.parameters.category}`;

    return html`
      <h2 class="page-title">
        <a class="back-button" href="${categoryUrl}"><prayer-icon name="arrow-left" /></a>
        ${item.title}
      </h2>
      
      <div class="field">
        <label>${t.direct('Title')}</label>
        <div class="field-inner">
          <input .value="${item.title}" onchange="${event => item.title = event.target.value}" type="text">
        </div>
      </div>      
      
      <div class="field">
        <label>${t.direct('Description (optional)')}</label>
        <div class="field-inner">
          <textarea onchange="${event => item.description = event.target.value}" .value="${item.description}"></textarea>
        </div>
      </div>      

      <div class="row">
        <button class="button" onclick="${() => {
          updatePrayerPoint(this.freeCategory.slug, item.slug, item.title, item.description); 
          this.root.router.navigate(categoryUrl);}
        }">${t.direct('Update')}</button>        
      </div>

        <button class="button danger" onclick="${() => {deletePrayerPoint(this.route.parameters.moment, this.freeCategory.slug, item.slug); this.root.router.navigate(categoryUrl);}}">
            ${t.direct('Delete')}
            <prayer-icon name="remove" />
        </button>        

        
        <div class="end"></div>
      
    `
  }
});

customElements.define('prayer-category-prayer-point-create', class PrayerCategoryPrayerPoint extends BaseElement {
  draw() {
    let t = this.root.t;
    let s = Store.getState().schedule;
    this.moment = s.moments.find(moment => moment.slug === this.route.parameters.moment);
    this.freeCategory = s.freeCategories.find(category => category.slug === this.route.parameters.category);
    this.addText = '';
    this.addDescription = '';

    this.categoryUrl = `/settings/${this.route.parameters.moment}/prayer-category/${this.route.parameters.category}`;

    return html`
      <h2 class="page-title">
        <a class="back-button" href="${this.categoryUrl}"><prayer-icon name="arrow-left" /></a>
        ${t.direct('Create prayer point')}
      </h2>
      
      <div class="field">
        <label>${t.direct('Add a prayer point')}</label>
        <div class="field-inner">
          <input .value="${this.addText}" onchange="${event => this.addText = event.target.value}" type="text">
        </div>
      </div>      
      
      <div class="field">
        <label>${t.direct('Add a description (optional)')}</label>
        <div class="field-inner">
          <textarea onchange="${event => this.addDescription = event.target.value}" .value="${this.addDescription}"></textarea>
        </div>
      </div>      

      <div class="row">
        <button class="button" onclick="${() => this.addPrayerPoint()}">${t.direct('Add')}</button>        
      </div>

      
      <div class="end"></div>
      
    `
  }

  addPrayerPoint () {
    addPrayerPoint(this.moment.slug, this.freeCategory.slug, this.addText, this.addDescription);
    this.addText = null;
    this.addDescription = null;
    this.root.router.navigate(this.categoryUrl);
  }

});

class TranslatedText extends Hole {
  constructor(text, context) {
    super();
    this.text = text;
    this.template = [text];
    this.values = [];
    this.context = context;
    this.type = 'html';
  }

  toString () {
    return this.text;
  }
}

function mixString (a, b, asCodeString) {
  let total = Math.max(a.length, b.length);
  let string = '';

  for (let part = 0; part < total; part++) {
    let valueString = '';
    if (typeof b[part] === 'object') {
      let keys = Object.keys(b[part]);
      valueString = asCodeString ? '{' + keys[0] + '}' : b[part][keys[0]];
    }
    else if (typeof b[part] === 'string') {
      valueString = b[part];
    }

    string += a[part] + valueString;
  }

  return string;
}

async function I14n (language) {
  let translations = {};
  translations[language] = {};
  if (['Dutch'].includes(language)) {
    translations[language] = (await import(`../Translations/${language}.js`)).Translations;
  }

  /**
   *
   * @param context
   * @param values
   * @returns {TranslatedText}
   * @constructor
   */
  let translate = function Translate (context, ...values) {
    if (typeof context === 'string') {
      return (strings, ...values) => {
        let translatedText = Translate(strings, ...values);
        translatedText.context = context;
        return translatedText;
      }
    }
    else {
      let stringsToTranslate = context;
      let codeString = mixString(stringsToTranslate, values, true);

      /**
       * Translation is not available.
       */
      if (typeof translations[language][codeString] === 'undefined') {
        return new TranslatedText(mixString(stringsToTranslate, values));
      }

      /**
       * We have a translation. Fill in the tokens.
       */
      else {
        let translatedString = translations[language][codeString];
        let tokens = Object.assign({}, ...values);

        let replacements = translatedString.match(/\{[a-zA-Z]*}/g);
        if (replacements) {
          replacements.forEach(replacement => {
            let variableName = replacement.substr(1).substr(0, replacement.length - 2);
            translatedString = translatedString.replace(replacement, tokens[variableName]);
          });
        }

        return new TranslatedText(translatedString);
      }
    }
  };

  translate.direct = (variable) => {
    if (typeof translations[language][variable] === 'undefined') {
      return new TranslatedText(variable);
    }
    else {
      return new TranslatedText(translations[language][variable]);
    }
  };

  return translate;
}

/**
 * Client side router with hash history
 */
class Router {
  /**
   * Create a new instance of a client side router
   * @param {Object} options Router options
   * @param {boolean} [options.debug=false] - Enable debugging console messages
   * @param {Object} [options.context=window] - Context to listen for changes on
   * @param {boolean} [options.startListening=true] - Initiate listen on construct
   * @param {Object} [options.routes={}] - Initiate routes on construct
   * @param {string} [options.initialPath=''] - Initiate routes on construct
   */
  constructor(options) {
    this.options = Object.assign(
      {
        debug: false,
        context: window,
        routes: {}
      },
      options
    );

    this.isListening = false;
    this.routes = [];

    if (options.routes) {
      for (let [route, routeOptions] of Object.entries(options.routes)) {
        this.add(route, routeOptions);
      }
    }

    this.onHashChange = this.check.bind(this);
    this.listen();

    if (this.options.initialPath) {
      this.sync(this.options.initialPath);
    }
  }

  /**
   * Add a new route
   * @param {string|RegExp|function} route - Name of route to match or global function
   * @param {function=} routeOptions - Object with a handler to execute when route matches
   * @returns {Router} - This router instance
   */
  add(route, routeOptions) {
    let newRoute = typeof route === 'string' ? Router.cleanPath(route) : route;

    let newRouteSplit = newRoute.split('/');
    let replacedParts = [];
    let tokens = [];
    newRouteSplit.forEach(part => {
      if (part.substr(0, 1) === ':') {
        replacedParts.push('([a-z\\-]*)');
        tokens.push(part.substr(1));
      }
      else {
        replacedParts.push(part);
      }
    });

    let regexRoute = '^' + replacedParts.join('/') + '$';
    newRoute = new RegExp(regexRoute);

    this.routes.push(Object.assign({
      path: route,
      tokens: tokens,
      route: newRoute,
    }, routeOptions));

    return this;
  }

  /**
   * Reload the current route
   * @returns {Router} - This router instance
   */
  reload() {
    return this.check();
  }

  sync (path) {
    if (!this.match(path)) return;

    this.options.context.history.pushState(
      null,
      null,
      '/' + Router.cleanPath(path || '')
    );
  }

  /**
   * Recheck the path and reload the page
   * @private
   * @returns {Router} - This router instance
   */
  check() {
    const hash = Router.cleanPath(location.pathname);

    for (let route of this.routes) {
      const match = hash.match(route.route);

      if (match !== null) {
        match.shift();

        navigate(hash);

        if (this.options.debug) {
          console.log(`Fetching: /${hash}`);
        }
      }
    }

    return this;
  }

  /**
   * Start listening for hash changes on the context
   * @param {any} [instance=Window] - Context to start listening on
   * @returns {Router} - This router instance
   */
  listen(instance) {
    this.check();

    if (!this.isListening || instance) {
      (instance || this.options.context).addEventListener(
        'hashchange',
        this.onHashChange
      );

      this.isListening = true;
    }

    return this;
  }

  /**
   * Navigate router to path
   * @param {string} path - Path to navigate the router to
   * @returns {Router} - This router instance
   */
  navigate(path) {
    if (this.options.debug) {
      console.log(`Redirecting to: /${Router.cleanPath(path || '')}`);
    }

    this.options.context.history.pushState(
      null,
      null,
      '/' + Router.cleanPath(path || '')
    );

    window.dispatchEvent(new CustomEvent('hashchange'));

    return this;
  }

  match (path) {
    path = Router.cleanPath(path);
    let activeRoute = null;
    for (let route of this.routes) {
      const match = path.match(route.route);

      if (match !== null && !activeRoute) {
        match.shift();

        let tokens = {};
        route.tokens.forEach((tokenName, index) => {
          tokens[tokenName] = match[index];
        });

        activeRoute = Object.assign({}, route, {
          parameters: tokens
        });

        if (this.options.debug) {
          console.log(`Syncing: /${path}`);
        }
      }
    }

    return activeRoute;
  }

  /**
   * Name of the current route
   * @returns {object} - Current route
   */
  get currentRoute() {
    return this.match(location.pathname);
  }

  /**
   * Strip the path of slashes and hashes
   * @param {string} path - Path to clean of hashes
   * @returns {string} - Cleaned path
   */
  static cleanPath(path) {
    if (!path) {
      return '';
    }

    return String(path).replace(/^[#\/]+|\/+$|\?.*$/g, '');
  }

  /**
   * Parse a route URL to get all parts
   * @param {string} path - Route to split into parts
   * @returns {string[]} - Parts of the URL
   */
  static parseRoute(path) {
    return Router.cleanPath(path).split('/');
  }
  
  part (index) {
    let split =  location.pathname.split('/');
    return typeof split[index] !== 'undefined' ? split[index] : false;
  }
}

let pageRoutes = {};
Content.Pages.forEach(page => {
  page.slug = Slugify(page.Title);
  pageRoutes[page.slug] = { template: html`<prayer-page class="page hidden" /><prayer-menu />` };
});

const Routes = {
  'pray': { template: html`<prayer-home class="page hidden" /><prayer-menu />` },
  'menu': { template: html`<prayer-main-menu class="page hidden" /><prayer-menu />` },
  'settings': { template: html`<prayer-settings class="page hidden" /><prayer-menu />` },
  'settings/:moment': { template: html`<prayer-moment-configure class="page hidden" /><prayer-menu />` },
  'pray/:moment': { template: html`<prayer-pray class="page hidden" />` },
  'settings/:moment/prayer-category/:category': { template: html`<prayer-category-details class="page hidden" /><prayer-menu />` },
  'settings/:moment/prayer-category/:category/create': { template: html`<prayer-category-prayer-point-create class="page hidden" /><prayer-menu />` },
  'settings/:moment/prayer-category/:category/:item': { template: html`<prayer-category-prayer-point class="page hidden" /><prayer-menu />` },
  'settings/:moment/create-free-category': { template: html`<prayer-create-free-category class="page hidden" /><prayer-menu />` },
  ...pageRoutes
};

class BibleTokenizer {

  constructor() {
    this.cache = new Map();
  }

  tokenize (parameter) {
    if (this.cache.get(parameter)) {
      return this.cache.get(parameter);
    }
    else {
      return this.getBiblePart(parameter);
    }
  }

  getBiblePart (parameter) {
    let a = Store.getState().app;
    let selectedBible = Content.Bibles.find(bible => bible.id === a.bible);
    let bookName = parameter.split(' ')[0];
    let chapterNumber = parameter.split(' ')[1];
    let book = selectedBible.books.find(book => book.name === bookName);
    let identifier = `${book.id}.${chapterNumber}`;
    let chapter = book.chapters.find(chapter => chapter.id === identifier);
    return new Hole('html', ['<div class="scripture-styles">', chapter.content, '</div>'], []);
  }
}

class Tokenizer {

  constructor() {
    this.modules = {
      'bible': new BibleTokenizer()
    };
  }

  replace (content) {

    let matches = content.matchAll('^\\[([a-zA-Z]*):(.*)\\]$');

    for (let match of matches) {
      let tokenModule = match[1];
      let parameter = match[2];

      if (this.modules[tokenModule]) {
        content = this.modules[tokenModule].tokenize(parameter);
      }
    }

    return content;
  }

}

/**
 * This file is a CustomElement but for convenience it is placed in the root of the application.
 * This is the starting file of this application.
 *
 * Created by Daniël Beeke
 */

customElements.define('prayer-app', class PrayerApp extends BaseElement {

  /**
   * This is the main startup function of the app.
   */
  async connectedCallback () {
    let a = Store.getState().app;
    this.t = await I14n(a.language);
    this.tokenizer = new Tokenizer();

    this.router = new Router({
      routes: Routes,
      debug: false,
      initialPath: location.pathname.substr(1) ? location.pathname.substr(1) : 'pray'
    });

    // Helper for vertical grid.
    window.addEventListener('keyup', event => {
      if (event.shiftKey && event.key === 'G') {
        event.preventDefault();
        toggleGrid();
      }
    });

    /**
     * Keep the router in sync with the store and draw after each route change.
     */
    this.watch('app.path', (path) => {
      this.router.sync(path);
      this.draw();
    });

    /**
     * Rerender everything if the language is changed.
     */
    this.watch('app.language', async (language) => {
      this.t = await I14n(language);
      [...this.children].forEach(child => typeof child.draw !== 'undefined' ? child.draw() : null);
    });

    this.watch('app.verticalGridEnabled', (enabled) => {
      this.dataset.gridEnabled = enabled;
    });

    this.draw();
  }

  draw () {
    let a = Store.getState().app;
    this.dataset.gridEnabled = a.verticalGridEnabled;
    return this.router.currentRoute ? this.router.currentRoute.template : null;
  }

});

window.oncontextmenu = function(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};
