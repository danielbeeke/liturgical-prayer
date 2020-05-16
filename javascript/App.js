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

  function replaceState(state) {
    currentState = state;
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
    replaceState: replaceState,
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
    let copyState = JSON.parse(JSON.stringify(state));
    delete copyState.app.path;
    return copyState;
  }
};

let exports = {};

/*! remotestorage.js 1.2.3, https://remotestorage.io, MIT licensed */
!function (e, t) {
  exports.RemoteStorage = t();
}(undefined, (function () {
  return function (e) {
    var t = {};

    function r(n) {
      if (t[n]) return t[n].exports;
      var o = t[n] = {i: n, l: !1, exports: {}};
      return e[n].call(o.exports, o, o.exports, r), o.l = !0, o.exports
    }

    return r.m = e, r.c = t, r.d = function (e, t, n) {
      r.o(e, t) || Object.defineProperty(e, t, {enumerable: !0, get: n});
    }, r.r = function (e) {
      "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {value: "Module"}), Object.defineProperty(e, "__esModule", {value: !0});
    }, r.t = function (e, t) {
      if (1 & t && (e = r(e)), 8 & t) return e;
      if (4 & t && "object" == typeof e && e && e.__esModule) return e;
      var n = Object.create(null);
      if (r.r(n), Object.defineProperty(n, "default", {
        enumerable: !0,
        value: e
      }), 2 & t && "string" != typeof e) for (var o in e) r.d(n, o, function (t) {
        return e[t]
      }.bind(null, o));
      return n
    }, r.n = function (e) {
      var t = e && e.__esModule ? function () {
        return e.default
      } : function () {
        return e
      };
      return r.d(t, "a", t), t
    }, r.o = function (e, t) {
      return Object.prototype.hasOwnProperty.call(e, t)
    }, r.p = "", r(r.s = 17)
  }([function (e, t, r) {
    (function (t, r) {
      function n(e) {
        return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
          return typeof e
        } : function (e) {
          return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
        })(e)
      }

      var o = {
        logError: function (e) {
          "string" == typeof e ? console.error(e) : console.error(e.message, e.stack);
        },
        globalContext: "undefined" != typeof window ? window : "object" === ("undefined" == typeof self ? "undefined" : n(self)) ? self : t,
        getGlobalContext: function () {
          return "undefined" != typeof window ? window : "object" === ("undefined" == typeof self ? "undefined" : n(self)) ? self : t
        },
        extend: function (e) {
          var t = Array.prototype.slice.call(arguments, 1);
          return t.forEach((function (t) {
            for (var r in t) e[r] = t[r];
          })), e
        },
        containingFolder: function (e) {
          if ("" === e) return "/";
          if (!e) throw "Path not given!";
          return e.replace(/\/+/g, "/").replace(/[^\/]+\/?$/, "")
        },
        isFolder: function (e) {
          return "/" === e.substr(-1)
        },
        isDocument: function (e) {
          return !o.isFolder(e)
        },
        baseName: function (e) {
          var t = e.split("/");
          return o.isFolder(e) ? t[t.length - 2] + "/" : t[t.length - 1]
        },
        cleanPath: function (e) {
          return e.replace(/\/+/g, "/").split("/").map(encodeURIComponent).join("/").replace(/'/g, "%27")
        },
        bindAll: function (e) {
          for (var t in this) "function" == typeof e[t] && (e[t] = e[t].bind(e));
        },
        equal: function (e, t, r) {
          var i;
          if (r = r || [], n(e) !== n(t)) return !1;
          if ("number" == typeof e || "boolean" == typeof e || "string" == typeof e) return e === t;
          if ("function" == typeof e) return e.toString() === t.toString();
          if (e instanceof ArrayBuffer && t instanceof ArrayBuffer && (e = new Uint8Array(e), t = new Uint8Array(t)), e instanceof Array) {
            if (e.length !== t.length) return !1;
            for (var s = 0, a = e.length; s < a; s++) if (!o.equal(e[s], t[s], r)) return !1
          } else {
            for (i in e) if (e.hasOwnProperty(i) && !(i in t)) return !1;
            for (i in t) if (t.hasOwnProperty(i)) {
              if (!(i in e)) return !1;
              var u;
              if ("object" === n(t[i])) {
                if (r.indexOf(t[i]) >= 0) continue;
                (u = r.slice()).push(t[i]);
              }
              if (!o.equal(e[i], t[i], u)) return !1
            }
          }
          return !0
        },
        deepClone: function (e) {
          var t;
          return void 0 === e ? void 0 : (function e(t, r) {
            var o, i;
            if ("object" === n(t) && !Array.isArray(t) && null !== t) for (o in t) "object" === n(t[o]) && null !== t[o] && ("[object ArrayBuffer]" === t[o].toString() ? (r[o] = new ArrayBuffer(t[o].byteLength), i = new Int8Array(t[o]), new Int8Array(r[o]).set(i)) : e(t[o], r[o]));
          }(e, t = JSON.parse(JSON.stringify(e))), t)
        },
        pathsFromRoot: function (e) {
          for (var t = [e], r = e.replace(/\/$/, "").split("/"); r.length > 1;) r.pop(), t.push(r.join("/") + "/");
          return t
        },
        localStorageAvailable: function () {
          var e = o.getGlobalContext();
          if (!("localStorage" in e)) return !1;
          try {
            return e.localStorage.setItem("rs-check", 1), e.localStorage.removeItem("rs-check"), !0
          } catch (e) {
            return !1
          }
        },
        getJSONFromLocalStorage: function (e) {
          var t = o.getGlobalContext();
          try {
            return JSON.parse(t.localStorage.getItem(e))
          } catch (e) {
          }
        },
        shouldBeTreatedAsBinary: function (e, t) {
          return t && t.match(/charset=binary/) || /[\x00-\x08\x0E-\x1F\uFFFD]/.test(e)
        },
        getTextFromArrayBuffer: function (e, n) {
          return new Promise((function (i) {
            if ("undefined" == typeof Blob) {
              var s = new r(new Uint8Array(e));
              i(s.toString(n));
            } else {
              var a;
              if (o.globalContext.BlobBuilder = o.globalContext.BlobBuilder || o.globalContext.WebKitBlobBuilder, void 0 !== o.globalContext.BlobBuilder) {
                var u = new t.BlobBuilder;
                u.append(e), a = u.getBlob();
              } else a = new Blob([e]);
              var c = new FileReader;
              "function" == typeof c.addEventListener ? c.addEventListener("loadend", (function (e) {
                i(e.target.result);
              })) : c.onloadend = function (e) {
                i(e.target.result);
              }, c.readAsText(a, n);
            }
          }))
        }
      };
      e.exports = o;
    }).call(this, r(10), r(18).Buffer);
  }, function (e, t, r) {
    var n = r(3);
    e.exports = function () {
      n.logging && console.log.apply(console, arguments);
    };
  }, function (e, t, r) {
    var n = r(1), o = {
      addEventListener: function (e, t) {
        if ("string" != typeof e) throw new Error("Argument eventName should be a string");
        if ("function" != typeof t) throw new Error("Argument handler should be a function");
        n("[Eventhandling] Adding event listener", e), this._validateEvent(e), this._handlers[e].push(t);
      }, removeEventListener: function (e, t) {
        this._validateEvent(e);
        for (var r = this._handlers[e].length, n = 0; n < r; n++) if (this._handlers[e][n] === t) return void this._handlers[e].splice(n, 1)
      }, _emit: function (e) {
        this._validateEvent(e);
        var t = Array.prototype.slice.call(arguments, 1);
        this._handlers[e].slice().forEach((function (e) {
          e.apply(this, t);
        }));
      }, _validateEvent: function (e) {
        if (!(e in this._handlers)) throw new Error("Unknown event: " + e)
      }, _delegateEvent: function (e, t) {
        t.on(e, function (t) {
          this._emit(e, t);
        }.bind(this));
      }, _addEvent: function (e) {
        this._handlers[e] = [];
      }
    };
    o.on = o.addEventListener, o.off = o.removeEventListener, e.exports = function (e) {
      var t = Array.prototype.slice.call(arguments, 1);
      for (var r in o) e[r] = o[r];
      e._handlers = {}, t.forEach((function (t) {
        e._addEvent(t);
      }));
    };
  }, function (e, t) {
    var r = {
      cache: !0,
      changeEvents: {local: !0, window: !1, remote: !0, conflict: !0},
      cordovaRedirectUri: void 0,
      logging: !1,
      modules: [],
      backgroundSyncInterval: 6e4,
      disableFeatures: [],
      discoveryTimeout: 1e4,
      isBackground: !1,
      requestTimeout: 3e4,
      syncInterval: 1e4
    };
    e.exports = r;
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o = r(1), i = r(0);

    function s(e) {
      var t, r = e || u.getLocation().href, n = r.indexOf("#");
      if (-1 !== n && -1 !== (t = r.substring(n + 1)).indexOf("=")) return t.split("&").reduce((function (e, t) {
        var r = t.split("=");
        if ("state" === r[0] && r[1].match(/rsDiscovery/)) {
          var n = decodeURIComponent(r[1]), o = n.substr(n.indexOf("rsDiscovery=")).split("&")[0].split("=")[1];
          e.rsDiscovery = JSON.parse(atob(o)), (n = n.replace(new RegExp("&?rsDiscovery=" + o), "")).length > 0 && (e.state = n);
        } else e[decodeURIComponent(r[0])] = decodeURIComponent(r[1]);
        return e
      }), {})
    }

    var a, u = function e(t, r) {
      var n = r.authURL, s = r.scope, a = r.redirectUri, u = r.clientId;
      if (o("[Authorize] authURL = ", n, "scope = ", s, "redirectUri = ", a, "clientId = ", u), !i.localStorageAvailable() && "remotestorage" === t.backend) {
        a += a.indexOf("#") > 0 ? "&" : "#";
        var c = {
          userAddress: t.remote.userAddress,
          href: t.remote.href,
          storageApi: t.remote.storageApi,
          properties: t.remote.properties
        };
        a += "rsDiscovery=" + btoa(JSON.stringify(c));
      }
      var l = function (e, t, r, n) {
        var o = t.indexOf("#"), i = e;
        return i += e.indexOf("?") > 0 ? "&" : "?", i += "redirect_uri=" + encodeURIComponent(t.replace(/#.*$/, "")), i += "&scope=" + encodeURIComponent(r), i += "&client_id=" + encodeURIComponent(n), -1 !== o && o + 1 !== t.length && (i += "&state=" + encodeURIComponent(t.substring(o + 1))), i += "&response_type=token"
      }(n, a, s, u);
      if (i.globalContext.cordova) return e.openWindow(l, a, "location=yes,clearsessioncache=yes,clearcache=yes").then((function (e) {
        t.remote.configure({token: e.access_token});
      }));
      e.setLocation(l);
    };
    u.IMPLIED_FAKE_TOKEN = !1, u.Unauthorized = function (e) {
      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      this.name = "Unauthorized", this.message = void 0 === e ? "App authorization expired or revoked." : e, void 0 !== t.code && (this.code = t.code), this.stack = (new Error).stack;
    }, u.Unauthorized.prototype = Object.create(Error.prototype), u.Unauthorized.prototype.constructor = u.Unauthorized, u.getLocation = function () {
      return document.location
    }, u.setLocation = function (e) {
      if ("string" == typeof e) document.location.href = e; else {
        if ("object" !== n(e)) throw "Invalid location " + e;
        document.location = e;
      }
    }, u.openWindow = function (e, t, r) {
      return new Promise((function (n, o) {
        var i = open(e, "_blank", r);
        if (!i || i.closed) return o("Authorization popup was blocked");
        var a = function () {
          return o("Authorization was canceled")
        };
        i.addEventListener("loadstart", (function (e) {
          if (0 === e.url.indexOf(t)) {
            i.removeEventListener("exit", a), i.close();
            var r = s(e.url);
            return r ? n(r) : o("Authorization error")
          }
        })), i.addEventListener("exit", a);
      }))
    }, u._rs_supported = function () {
      return "undefined" != typeof document
    }, u._rs_init = function (e) {
      a = function () {
        var n = !1;
        if (r) {
          if (r.error) throw "access_denied" === r.error ? new u.Unauthorized("Authorization failed: access denied", {code: "access_denied"}) : new u.Unauthorized("Authorization failed: ".concat(r.error));
          r.rsDiscovery && e.remote.configure(r.rsDiscovery), r.access_token && (e.remote.configure({token: r.access_token}), n = !0), r.remotestorage && (e.connect(r.remotestorage), n = !0), r.state && (t = u.getLocation(), u.setLocation(t.href.split("#")[0] + "#" + r.state));
        }
        n || e.remote.stopWaitingForToken();
      };
      var t, r = s();
      r && ((t = u.getLocation()).hash = ""), e.on("features-loaded", a);
    }, u._rs_cleanup = function (e) {
      e.removeEventListener("features-loaded", a);
    }, e.exports = u;
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o = r(2), i = r(0), s = r(3), a = r(22), u = r(23), c = u.SchemaNotFound, l = function (e, t) {
      if ("/" !== t[t.length - 1]) throw "Not a folder: " + t;
      "/" === t && (this.makePath = function (e) {
        return ("/" === e[0] ? "" : "/") + e
      }), this.storage = e, this.base = t;
      var r = this.base.split("/");
      r.length > 2 ? this.moduleName = r[1] : this.moduleName = "root", o(this, "change"), this.on = this.on.bind(this), e.onChange(this.base, this._fireChange.bind(this));
    };
    l.Types = u, l.prototype = {
      scope: function (e) {
        return new l(this.storage, this.makePath(e))
      }, getListing: function (e, t) {
        if ("string" != typeof e) e = ""; else if (e.length > 0 && "/" !== e[e.length - 1]) return Promise.reject("Not a folder: " + e);
        return this.storage.get(this.makePath(e), t).then((function (e) {
          return 404 === e.statusCode ? {} : e.body
        }))
      }, getAll: function (e, t) {
        if ("string" != typeof e) e = ""; else if (e.length > 0 && "/" !== e[e.length - 1]) return Promise.reject("Not a folder: " + e);
        return this.storage.get(this.makePath(e), t).then(function (r) {
          if (404 === r.statusCode) return {};
          if ("object" === n(r.body)) {
            var o = Object.keys(r.body);
            if (0 === o.length) return {};
            var i = o.map(function (o) {
              return this.storage.get(this.makePath(e + o), t).then((function (e) {
                if ("string" == typeof e.body) try {
                  e.body = JSON.parse(e.body);
                } catch (e) {
                }
                "object" === n(e.body) && (r.body[o] = e.body);
              }))
            }.bind(this));
            return Promise.all(i).then((function () {
              return r.body
            }))
          }
        }.bind(this))
      }, getFile: function (e, t) {
        return "string" != typeof e ? Promise.reject("Argument 'path' of baseClient.getFile must be a string") : this.storage.get(this.makePath(e), t).then((function (e) {
          return {data: e.body, contentType: e.contentType, revision: e.revision}
        }))
      }, storeFile: function (e, t, r) {
        return "string" != typeof e ? Promise.reject("Argument 'mimeType' of baseClient.storeFile must be a string") : "string" != typeof t ? Promise.reject("Argument 'path' of baseClient.storeFile must be a string") : "string" != typeof r && "object" !== n(r) ? Promise.reject("Argument 'body' of baseClient.storeFile must be a string, ArrayBuffer, or ArrayBufferView") : (this.storage.access.checkPathPermission(this.makePath(t), "rw") || console.warn("WARNING: Editing a document to which only read access ('r') was claimed"), this.storage.put(this.makePath(t), r, e).then(function (e) {
          return 200 === e.statusCode || 201 === e.statusCode ? e.revision : Promise.reject("Request (PUT " + this.makePath(t) + ") failed with status: " + e.statusCode)
        }.bind(this)))
      }, getObject: function (e, t) {
        return "string" != typeof e ? Promise.reject("Argument 'path' of baseClient.getObject must be a string") : this.storage.get(this.makePath(e), t).then(function (t) {
          if ("object" === n(t.body)) return t.body;
          if ("string" == typeof t.body) try {
            return JSON.parse(t.body)
          } catch (t) {
            throw "Not valid JSON: " + this.makePath(e)
          } else if (void 0 !== t.body && 200 === t.statusCode) return Promise.reject("Not an object: " + this.makePath(e))
        }.bind(this))
      }, storeObject: function (e, t, r) {
        if ("string" != typeof e) return Promise.reject("Argument 'typeAlias' of baseClient.storeObject must be a string");
        if ("string" != typeof t) return Promise.reject("Argument 'path' of baseClient.storeObject must be a string");
        if ("object" !== n(r)) return Promise.reject("Argument 'object' of baseClient.storeObject must be an object");
        this._attachType(r, e);
        try {
          var o = this.validate(r);
          if (!o.valid) return Promise.reject(o)
        } catch (e) {
          return Promise.reject(e)
        }
        return this.storage.put(this.makePath(t), JSON.stringify(r), "application/json; charset=UTF-8").then(function (e) {
          return 200 === e.statusCode || 201 === e.statusCode ? e.revision : Promise.reject("Request (PUT " + this.makePath(t) + ") failed with status: " + e.statusCode)
        }.bind(this))
      }, remove: function (e) {
        return "string" != typeof e ? Promise.reject("Argument 'path' of baseClient.remove must be a string") : (this.storage.access.checkPathPermission(this.makePath(e), "rw") || console.warn("WARNING: Removing a document to which only read access ('r') was claimed"), this.storage.delete(this.makePath(e)))
      }, getItemURL: function (e) {
        if ("string" != typeof e) throw "Argument 'path' of baseClient.getItemURL must be a string";
        return this.storage.connected ? (e = this._cleanPath(this.makePath(e)), this.storage.remote.href + e) : void 0
      }, cache: function (e, t) {
        if ("string" != typeof e) throw "Argument 'path' of baseClient.cache must be a string";
        if (void 0 === t) t = "ALL"; else if ("string" != typeof t) throw "Argument 'strategy' of baseClient.cache must be a string or undefined";
        if ("FLUSH" !== t && "SEEN" !== t && "ALL" !== t) throw 'Argument \'strategy\' of baseclient.cache must be one of ["FLUSH", "SEEN", "ALL"]';
        return this.storage.caching.set(this.makePath(e), t), this
      }, flush: function (e) {
        return this.storage.local.flush(e)
      }, declareType: function (e, t, r) {
        r || (r = t, t = this._defaultTypeURI(e)), l.Types.declare(this.moduleName, e, t, r);
      }, validate: function (e) {
        var t = l.Types.getSchema(e["@context"]);
        if (t) return a.validateResult(e, t);
        throw new c(e["@context"])
      }, schemas: {
        configurable: !0, get: function () {
          return l.Types.inScope(this.moduleName)
        }
      }, _defaultTypeURI: function (e) {
        return "http://remotestorage.io/spec/modules/" + encodeURIComponent(this.moduleName) + "/" + encodeURIComponent(e)
      }, _attachType: function (e, t) {
        e["@context"] = l.Types.resolveAlias(this.moduleName + "/" + t) || this._defaultTypeURI(t);
      }, makePath: function (e) {
        return this.base + (e || "")
      }, _fireChange: function (e) {
        s.changeEvents[e.origin] && (["new", "old", "lastCommon"].forEach((function (t) {
          if ((!e[t + "ContentType"] || /^application\/(.*)json(.*)/.exec(e[t + "ContentType"])) && "string" == typeof e[t + "Value"]) try {
            e[t + "Value"] = JSON.parse(e[t + "Value"]);
          } catch (e) {
          }
        })), this._emit("change", e));
      }, _cleanPath: i.cleanPath
    }, l._rs_init = function () {
    }, e.exports = l;
  }, function (e, t, r) {

    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o, i, s = r(1), a = r(0), u = r(2), c = r(4), l = r(3), h = "remotestorage:wireclient", f = {
      "draft-dejong-remotestorage-00": 2,
      "draft-dejong-remotestorage-01": 3,
      "draft-dejong-remotestorage-02": 4,
      "https://www.w3.org/community/rww/wiki/read-write-web-00#simple": 1
    };
    if ("function" == typeof ArrayBufferView) i = function (e) {
      return e && e instanceof ArrayBufferView
    }; else {
      var d = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
      i = function (e) {
        for (var t = 0; t < 8; t++) if (e instanceof d[t]) return !0;
        return !1
      };
    }
    var p = a.isFolder, m = a.cleanPath, y = a.shouldBeTreatedAsBinary, g = a.getJSONFromLocalStorage,
      v = a.getTextFromArrayBuffer;

    function b(e) {
      return "string" != typeof e ? e : "*" === e ? "*" : '"' + e + '"'
    }

    function _(e) {
      return "string" != typeof e ? e : e.replace(/^["']|["']$/g, "")
    }

    var w = function (e) {
      if (this.rs = e, this.connected = !1, u(this, "connected", "not-connected"), o) {
        var t = g(h);
        t && setTimeout(function () {
          this.configure(t);
        }.bind(this), 0);
      }
      this._revisionCache = {}, this.connected && setTimeout(this._emit.bind(this), 0, "connected");
    };
    w.prototype = {
      _request: function (e, t, r, n, o, i, a) {
        if (("PUT" === e || "DELETE" === e) && "/" === t[t.length - 1]) return Promise.reject("Don't " + e + " on directories!");
        var u, l = this;
        return r !== c.IMPLIED_FAKE_TOKEN && (n.Authorization = "Bearer " + r), this.rs._emit("wire-busy", {
          method: e,
          isFolder: p(t)
        }), w.request(e, t, {body: o, headers: n, responseType: "arraybuffer"}).then((function (r) {
          if (l.online || (l.online = !0, l.rs._emit("network-online")), l.rs._emit("wire-done", {
            method: e,
            isFolder: p(t),
            success: !0
          }), o = r.status, [401, 403, 404, 412].indexOf(o) >= 0) return s("[WireClient] Error response status", r.status), u = i ? _(r.getResponseHeader("ETag")) : void 0, 401 === r.status && l.rs._emit("error", new c.Unauthorized), Promise.resolve({
            statusCode: r.status,
            revision: u
          });
          if (function (e) {
            return [201, 204, 304].indexOf(e) >= 0
          }(r.status) || 200 === r.status && "GET" !== e) return u = _(r.getResponseHeader("ETag")), s("[WireClient] Successful request", u), Promise.resolve({
            statusCode: r.status,
            revision: u
          });
          var n = r.getResponseHeader("Content-Type");
          u = i ? _(r.getResponseHeader("ETag")) : 200 === r.status ? a : void 0;
          var o, h = function (e) {
            var t, r = "UTF-8";
            return e && (t = e.match(/charset=(.+)$/)) && (r = t[1]), r
          }(n);
          return y(r.response, n) ? (s("[WireClient] Successful request with unknown or binary mime-type", u), Promise.resolve({
            statusCode: r.status,
            body: r.response,
            contentType: n,
            revision: u
          })) : v(r.response, h).then((function (e) {
            return s("[WireClient] Successful request", u), Promise.resolve({
              statusCode: r.status,
              body: e,
              contentType: n,
              revision: u
            })
          }))
        }), (function (r) {
          return l.online && (l.online = !1, l.rs._emit("network-offline")), l.rs._emit("wire-done", {
            method: e,
            isFolder: p(t),
            success: !1
          }), Promise.reject(r)
        }))
      }, configure: function (e) {
        if ("object" !== n(e)) throw new Error("WireClient configure settings parameter should be an object");
        void 0 !== e.userAddress && (this.userAddress = e.userAddress), void 0 !== e.href && (this.href = e.href), void 0 !== e.storageApi && (this.storageApi = e.storageApi), void 0 !== e.token && (this.token = e.token), void 0 !== e.properties && (this.properties = e.properties), void 0 !== this.storageApi && (this._storageApi = f[this.storageApi] || 5, this.supportsRevs = this._storageApi >= 2), this.href && this.token ? (this.connected = !0, this.online = !0, this._emit("connected")) : this.connected = !1, o && (localStorage[h] = JSON.stringify({
          userAddress: this.userAddress,
          href: this.href,
          storageApi: this.storageApi,
          token: this.token,
          properties: this.properties
        }));
      }, stopWaitingForToken: function () {
        this.connected || this._emit("not-connected");
      }, get: function (e, t) {
        var r = this;
        if (!this.connected) return Promise.reject("not connected (path: " + e + ")");
        t || (t = {});
        var o = {};
        return this.supportsRevs && t.ifNoneMatch && (o["If-None-Match"] = b(t.ifNoneMatch)), this._request("GET", this.href + m(e), this.token, o, void 0, this.supportsRevs, this._revisionCache[e]).then((function (t) {
          if (!p(e)) return Promise.resolve(t);
          var o, i = {};
          if (void 0 !== t.body) try {
            t.body = JSON.parse(t.body);
          } catch (t) {
            return Promise.reject("Folder description at " + r.href + m(e) + " is not JSON")
          }
          if (200 === t.statusCode && "object" === n(t.body)) {
            if (0 === Object.keys(t.body).length) t.statusCode = 404; else if ("http://remotestorage.io/spec/folder-description" === (o = t.body)["@context"] && "object" === n(o.items)) {
              for (var s in t.body.items) r._revisionCache[e + s] = t.body.items[s].ETag;
              i = t.body.items;
            } else Object.keys(t.body).forEach((function (n) {
              r._revisionCache[e + n] = t.body[n], i[n] = {ETag: t.body[n]};
            }));
            return t.body = i, Promise.resolve(t)
          }
          return Promise.resolve(t)
        }))
      }, put: function (e, t, r, n) {
        if (!this.connected) return Promise.reject("not connected (path: " + e + ")");
        n || (n = {}), !r.match(/charset=/) && (t instanceof ArrayBuffer || i(t)) && (r += "; charset=binary");
        var o = {"Content-Type": r};
        return this.supportsRevs && (n.ifMatch && (o["If-Match"] = b(n.ifMatch)), n.ifNoneMatch && (o["If-None-Match"] = b(n.ifNoneMatch))), this._request("PUT", this.href + m(e), this.token, o, t, this.supportsRevs)
      }, delete: function (e, t) {
        if (!this.connected) throw new Error("not connected (path: " + e + ")");
        t || (t = {});
        var r = {};
        return this.supportsRevs && t.ifMatch && (r["If-Match"] = b(t.ifMatch)), this._request("DELETE", this.href + m(e), this.token, r, void 0, this.supportsRevs)
      }
    }, w.isArrayBufferView = i, w.request = function (e, t, r) {
      return "function" == typeof fetch ? w._fetchRequest(e, t, r) : "function" == typeof XMLHttpRequest ? w._xhrRequest(e, t, r) : (s("[WireClient] add a polyfill for fetch or XMLHttpRequest"), Promise.reject("[WireClient] add a polyfill for fetch or XMLHttpRequest"))
    }, w._fetchRequest = function (e, t, r) {
      var n, o, i = {};
      "function" == typeof AbortController && (o = new AbortController);
      var a = fetch(t, {
        method: e,
        headers: r.headers,
        body: r.body,
        signal: o ? o.signal : void 0
      }).then((function (e) {
        switch (s("[WireClient fetch]", e), e.headers.forEach((function (e, t) {
          i[t.toUpperCase()] = e;
        })), n = {
          readyState: 4,
          status: e.status,
          statusText: e.statusText,
          response: void 0,
          getResponseHeader: function (e) {
            return i[e.toUpperCase()] || null
          },
          responseType: r.responseType,
          responseURL: t
        }, r.responseType) {
          case"arraybuffer":
            return e.arrayBuffer();
          case"blob":
            return e.blob();
          case"json":
            return e.json();
          case void 0:
          case"":
          case"text":
            return e.text();
          default:
            throw new Error("responseType 'document' is not currently supported using fetch")
        }
      })).then((function (e) {
        return n.response = e, r.responseType && "text" !== r.responseType || (n.responseText = e), n
      })), u = new Promise((function (e, t) {
        setTimeout((function () {
          t("timeout"), o && o.abort();
        }), l.requestTimeout);
      }));
      return Promise.race([a, u])
    }, w._xhrRequest = function (e, t, r) {
      return new Promise((function (o, a) {
        s("[WireClient]", e, t);
        var u = !1, c = setTimeout((function () {
          u = !0, a("timeout");
        }), l.requestTimeout), h = new XMLHttpRequest;
        if (h.open(e, t, !0), r.responseType && (h.responseType = r.responseType), r.headers) for (var f in r.headers) h.setRequestHeader(f, r.headers[f]);
        h.onload = function () {
          u || (clearTimeout(c), o(h));
        }, h.onerror = function (e) {
          u || (clearTimeout(c), a(e));
        };
        var d = r.body;
        "object" === n(d) && !i(d) && d instanceof ArrayBuffer && (d = new Uint8Array(d)), h.send(d);
      }))
    }, Object.defineProperty(w.prototype, "storageType", {
      get: function () {
        if (this.storageApi) {
          var e = this.storageApi.match(/draft-dejong-(remotestorage-\d\d)/);
          return e ? e[1] : "2012.04"
        }
      }
    }), w._rs_init = function (e) {
      o = a.localStorageAvailable(), e.remote = new w(e), this.online = !0;
    }, w._rs_supported = function () {
      return "function" == typeof fetch || "function" == typeof XMLHttpRequest
    }, w._rs_cleanup = function () {
      o && delete localStorage[h];
    }, e.exports = w;
  }, function (e, t, r) {
    function n(e, t) {
      return !t || "object" !== c(t) && "function" != typeof t ? function (e) {
        if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return e
      }(e) : t
    }

    function o(e) {
      var t = "function" == typeof Map ? new Map : void 0;
      return (o = function (e) {
        if (null === e || (r = e, -1 === Function.toString.call(r).indexOf("[native code]"))) return e;
        var r;
        if ("function" != typeof e) throw new TypeError("Super expression must either be null or a function");
        if (void 0 !== t) {
          if (t.has(e)) return t.get(e);
          t.set(e, n);
        }

        function n() {
          return s(e, arguments, u(this).constructor)
        }

        return n.prototype = Object.create(e.prototype, {
          constructor: {
            value: n,
            enumerable: !1,
            writable: !0,
            configurable: !0
          }
        }), a(n, e)
      })(e)
    }

    function i() {
      if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
      if (Reflect.construct.sham) return !1;
      if ("function" == typeof Proxy) return !0;
      try {
        return Date.prototype.toString.call(Reflect.construct(Date, [], (function () {
        }))), !0
      } catch (e) {
        return !1
      }
    }

    function s(e, t, r) {
      return (s = i() ? Reflect.construct : function (e, t, r) {
        var n = [null];
        n.push.apply(n, t);
        var o = new (Function.bind.apply(e, n));
        return r && a(o, r.prototype), o
      }).apply(null, arguments)
    }

    function a(e, t) {
      return (a = Object.setPrototypeOf || function (e, t) {
        return e.__proto__ = t, e
      })(e, t)
    }

    function u(e) {
      return (u = Object.setPrototypeOf ? Object.getPrototypeOf : function (e) {
        return e.__proto__ || Object.getPrototypeOf(e)
      })(e)
    }

    function c(e) {
      return (c = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    function l(e, t) {
      if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }

    function h(e, t) {
      for (var r = 0; r < t.length; r++) {
        var n = t[r];
        n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n);
      }
    }

    var f, d, p = r(0), m = p.isFolder, y = p.isDocument, g = p.equal, v = p.deepClone, b = p.pathsFromRoot, _ = r(12),
      w = r(2), P = r(1), E = r(4), S = r(3);

    function T(e, t, r) {
      return {action: e, path: t, promise: r}
    }

    function A(e, t) {
      return e.common.revision !== t && (!e.remote || e.remote.revision !== t)
    }

    function R(e) {
      return e.common && e.common.revision
    }

    var k = function () {
      function e(t) {
        var r = this;
        l(this, e), this.rs = t, this._tasks = {}, this._running = {}, this._timeStarted = {}, this.numThreads = 10, this.rs.local.onDiff((function (e) {
          r.addTask(e), r.doTasks();
        })), this.rs.caching.onActivate((function (e) {
          r.addTask(e), r.doTasks();
        })), w(this, "done", "req-done");
      }

      var t, r, n;
      return t = e, n = [{
        key: "_rs_init", value: function (t) {
          f = function () {
            P("[Sync] syncCycleCb calling syncCycle"), _.isBrowser() && function (e) {
              function t(t) {
                var r, n;
                r = e.getCurrentSyncInterval(), S.isBackground = !t, n = e.getCurrentSyncInterval(), e._emit("sync-interval-change", {
                  oldValue: r,
                  newValue: n
                });
              }

              _.on("background", (function () {
                return t(!1)
              })), _.on("foreground", (function () {
                return t(!0)
              }));
            }(t), t.sync || (t.sync = new e(t), t.syncStopped && (P("[Sync] Instantiating sync stopped"), t.sync.stopped = !0, delete t.syncStopped)), P("[Sync] syncCycleCb calling syncCycle"), t.syncCycle();
          }, d = function () {
            t.removeEventListener("connected", d), t.startSync();
          }, t.on("ready", f), t.on("connected", d);
        }
      }, {
        key: "_rs_cleanup", value: function (e) {
          e.stopSync(), e.removeEventListener("ready", f), e.removeEventListener("connected", d), e.sync = void 0, delete e.sync;
        }
      }], (r = [{
        key: "now", value: function () {
          return (new Date).getTime()
        }
      }, {
        key: "queueGetRequest", value: function (e) {
          var t = this;
          return new Promise((function (r, n) {
            t.rs.remote.connected ? t.rs.remote.online ? (t.addTask(e, function () {
              this.rs.local.get(e).then((function (e) {
                return r(e)
              }));
            }.bind(t)), t.doTasks()) : n("cannot fulfill maxAge requirement - remote is not online") : n("cannot fulfill maxAge requirement - remote is not connected");
          }))
        }
      }, {
        key: "corruptServerItemsMap", value: function (e, t) {
          if ("object" !== c(e) || Array.isArray(e)) return !0;
          for (var r in e) {
            var n = e[r];
            if ("object" !== c(n)) return !0;
            if ("string" != typeof n.ETag) return !0;
            if (m(r)) {
              if (-1 !== r.substring(0, r.length - 1).indexOf("/")) return !0
            } else {
              if (-1 !== r.indexOf("/")) return !0;
              if (t) {
                if ("string" != typeof n["Content-Type"]) return !0;
                if ("number" != typeof n["Content-Length"]) return !0
              }
            }
          }
          return !1
        }
      }, {
        key: "corruptItemsMap", value: function (e) {
          if ("object" !== c(e) || Array.isArray(e)) return !0;
          for (var t in e) if ("boolean" != typeof e[t]) return !0;
          return !1
        }
      }, {
        key: "corruptRevision", value: function (e) {
          return "object" !== c(e) || Array.isArray(e) || e.revision && "string" != typeof e.revision || e.body && "string" != typeof e.body && "object" !== c(e.body) || e.contentType && "string" != typeof e.contentType || e.contentLength && "number" != typeof e.contentLength || e.timestamp && "number" != typeof e.timestamp || e.itemsMap && this.corruptItemsMap(e.itemsMap)
        }
      }, {
        key: "isCorrupt", value: function (e) {
          return "object" !== c(e) || Array.isArray(e) || "string" != typeof e.path || this.corruptRevision(e.common) || e.local && this.corruptRevision(e.local) || e.remote && this.corruptRevision(e.remote) || e.push && this.corruptRevision(e.push)
        }
      }, {
        key: "hasTasks", value: function () {
          return Object.getOwnPropertyNames(this._tasks).length > 0
        }
      }, {
        key: "collectDiffTasks", value: function () {
          var e = this, t = 0;
          return this.rs.local.forAllNodes((function (r) {
            t > 100 || (e.isCorrupt(r) ? (P("[Sync] WARNING: corrupt node in local cache", r), "object" === c(r) && r.path && (e.addTask(r.path), t++)) : e.needsFetch(r) && e.rs.access.checkPathPermission(r.path, "r") ? (e.addTask(r.path), t++) : y(r.path) && e.needsPush(r) && e.rs.access.checkPathPermission(r.path, "rw") && (e.addTask(r.path), t++));
          })).then((function () {
            return t
          }), (function (e) {
            throw e
          }))
        }
      }, {
        key: "inConflict", value: function (e) {
          return e.local && e.remote && (void 0 !== e.remote.body || e.remote.itemsMap)
        }
      }, {
        key: "needsRefresh", value: function (e) {
          return !!e.common && (!e.common.timestamp || this.now() - e.common.timestamp > S.syncInterval)
        }
      }, {
        key: "needsFetch", value: function (e) {
          return !!this.inConflict(e) || !(!e.common || void 0 !== e.common.itemsMap || void 0 !== e.common.body) || !(!e.remote || void 0 !== e.remote.itemsMap || void 0 !== e.remote.body)
        }
      }, {
        key: "needsPush", value: function (e) {
          return !this.inConflict(e) && (!(!e.local || e.push) || void 0)
        }
      }, {
        key: "needsRemotePut", value: function (e) {
          return e.local && e.local.body
        }
      }, {
        key: "needsRemoteDelete", value: function (e) {
          return e.local && !1 === e.local.body
        }
      }, {
        key: "getParentPath", value: function (e) {
          var t = e.match(/^(.*\/)([^\/]+\/?)$/);
          if (t) return t[1];
          throw new Error('Not a valid path: "' + e + '"')
        }
      }, {
        key: "deleteChildPathsFromTasks", value: function () {
          for (var e in this._tasks) for (var t = b(e), r = 1; r < t.length; r++) this._tasks[t[r]] && (Array.isArray(this._tasks[e]) && this._tasks[e].length && Array.prototype.push.apply(this._tasks[t[r]], this._tasks[e]), delete this._tasks[e]);
        }
      }, {
        key: "collectRefreshTasks", value: function () {
          var e = this;
          return this.rs.local.forAllNodes((function (t) {
            var r;
            if (e.needsRefresh(t)) {
              try {
                r = e.getParentPath(t.path);
              } catch (e) {
              }
              r && e.rs.access.checkPathPermission(r, "r") ? e.addTask(r) : e.rs.access.checkPathPermission(t.path, "r") && e.addTask(t.path);
            }
          })).then((function () {
            e.deleteChildPathsFromTasks();
          }), (function (e) {
            throw e
          }))
        }
      }, {
        key: "flush", value: function (e) {
          for (var t in e) "FLUSH" === this.rs.caching.checkPath(t) && e[t] && !e[t].local && (P("[Sync] Flushing", t), e[t] = void 0);
          return e
        }
      }, {
        key: "doTask", value: function (e) {
          var t = this;
          return this.rs.local.getNodes([e]).then((function (r) {
            var n = r[e];
            return void 0 === n ? T("get", e, t.rs.remote.get(e)) : function (e) {
              return e.remote && e.remote.revision && !e.remote.itemsMap && !e.remote.body
            }(n) ? T("get", e, t.rs.remote.get(e)) : t.needsRemotePut(n) ? (n.push = v(n.local), n.push.timestamp = t.now(), t.rs.local.setNodes(t.flush(r)).then((function () {
              var r;
              return r = R(n) ? {ifMatch: n.common.revision} : {ifNoneMatch: "*"}, T("put", e, t.rs.remote.put(e, n.push.body, n.push.contentType, r))
            }))) : t.needsRemoteDelete(n) ? (n.push = {
              body: !1,
              timestamp: t.now()
            }, t.rs.local.setNodes(t.flush(r)).then((function () {
              return R(n) ? T("delete", e, t.rs.remote.delete(e, {ifMatch: n.common.revision})) : T("get", e, t.rs.remote.get(e))
            }))) : R(n) ? T("get", e, t.rs.remote.get(e, {ifNoneMatch: n.common.revision})) : T("get", e, t.rs.remote.get(e))
          }))
        }
      }, {
        key: "autoMergeFolder", value: function (e) {
          if (e.remote.itemsMap && (e.common = e.remote, delete e.remote, e.common.itemsMap)) {
            for (var t in e.common.itemsMap) e.local.itemsMap[t] || (e.local.itemsMap[t] = !1);
            g(e.local.itemsMap, e.common.itemsMap) && delete e.local;
          }
          return e
        }
      }, {
        key: "autoMergeDocument", value: function (e) {
          return function (e) {
            return (!e.remote || !e.remote.revision || e.remote.revision === e.common.revision) && (void 0 === e.common.body && !1 === e.remote.body || e.remote.body === e.common.body && e.remote.contentType === e.common.contentType)
          }(e) ? delete (e = function (e) {
            return e.remote && !1 === e.remote.body && e.local && !1 === e.local.body && delete e.local, e
          }(e)).remote : void 0 !== e.remote.body && (P("[Sync] Emitting keep/revert"), this.rs.local._emitChange({
            origin: "conflict",
            path: e.path,
            oldValue: e.local.body,
            newValue: e.remote.body,
            lastCommonValue: e.common.body,
            oldContentType: e.local.contentType,
            newContentType: e.remote.contentType,
            lastCommonContentType: e.common.contentType
          }), e.remote.body ? e.common = e.remote : e.common = {}, delete e.remote, delete e.local), e
        }
      }, {
        key: "autoMerge", value: function (e) {
          if (e.remote) {
            if (e.local) return m(e.path) ? this.autoMergeFolder(e) : this.autoMergeDocument(e);
            if (m(e.path)) void 0 !== e.remote.itemsMap && (e.common = e.remote, delete e.remote); else if (void 0 !== e.remote.body) {
              var t = {
                origin: "remote",
                path: e.path,
                oldValue: !1 === e.common.body ? void 0 : e.common.body,
                newValue: !1 === e.remote.body ? void 0 : e.remote.body,
                oldContentType: e.common.contentType,
                newContentType: e.remote.contentType
              };
              if ((t.oldValue || t.newValue) && this.rs.local._emitChange(t), !e.remote.body) return;
              e.common = e.remote, delete e.remote;
            }
            return e
          }
          e.common.body && this.rs.local._emitChange({
            origin: "remote",
            path: e.path,
            oldValue: e.common.body,
            newValue: void 0,
            oldContentType: e.common.contentType,
            newContentType: void 0
          });
        }
      }, {
        key: "updateCommonTimestamp", value: function (e, t) {
          var r = this;
          return this.rs.local.getNodes([e]).then((function (n) {
            return n[e] && n[e].common && n[e].common.revision === t && (n[e].common.timestamp = r.now()), r.rs.local.setNodes(r.flush(n))
          }))
        }
      }, {
        key: "markChildren", value: function (e, t, r, n) {
          var o = this, i = [], s = {}, a = {};
          for (var u in t) i.push(e + u), s[e + u] = t[u];
          for (var c in n) i.push(e + c);
          return this.rs.local.getNodes(i).then((function (t) {
            var i;
            for (var u in t) if (i = t[u], s[u]) i && i.common ? A(i, s[u].ETag) && (r[u] = v(i), r[u].remote = {
              revision: s[u].ETag,
              timestamp: o.now()
            }, r[u] = o.autoMerge(r[u])) : "ALL" === o.rs.caching.checkPath(u) && (r[u] = {
              path: u,
              common: {timestamp: o.now()},
              remote: {revision: s[u].ETag, timestamp: o.now()}
            }), r[u] && s[u]["Content-Type"] && (r[u].remote.contentType = s[u]["Content-Type"]), r[u] && s[u]["Content-Length"] && (r[u].remote.contentLength = s[u]["Content-Length"]); else if (n[u.substring(e.length)] && i && i.common) {
              if (i.common.itemsMap) for (var c in i.common.itemsMap) a[u + c] = !0;
              if (i.local && i.local.itemsMap) for (var l in i.local.itemsMap) a[u + l] = !0;
              if (i.remote || m(u)) r[u] = void 0; else if (r[u] = o.autoMerge(i), void 0 === r[u]) {
                var h = o.getParentPath(u), f = r[h], d = u.substring(e.length);
                f && f.local && (delete f.local.itemsMap[d], g(f.local.itemsMap, f.common.itemsMap) && delete f.local);
              }
            }
            return o.deleteRemoteTrees(Object.keys(a), r).then((function (e) {
              return o.rs.local.setNodes(o.flush(e))
            }))
          }))
        }
      }, {
        key: "deleteRemoteTrees", value: function (e, t) {
          var r = this;
          return 0 === e.length ? Promise.resolve(t) : this.rs.local.getNodes(e).then((function (e) {
            var n = {}, o = function (e, t) {
              if (e && e.itemsMap) for (var r in e.itemsMap) n[t + r] = !0;
            };
            for (var i in e) {
              var s = e[i];
              s && (m(i) ? (o(s.common, i), o(s.local, i)) : s.common && void 0 !== s.common.body && (t[i] = v(s), t[i].remote = {
                body: !1,
                timestamp: r.now()
              }, t[i] = r.autoMerge(t[i])));
            }
            return r.deleteRemoteTrees(Object.keys(n), t).then((function (e) {
              return r.rs.local.setNodes(r.flush(e))
            }))
          }))
        }
      }, {
        key: "completeFetch", value: function (e, t, r, n) {
          var o, i, s = this, a = b(e);
          return m(e) ? o = [e] : (i = a[1], o = [e, i]), this.rs.local.getNodes(o).then((function (o) {
            var a, u, l = {}, h = o[e], f = function (e) {
              if (e && e.itemsMap) for (a in e.itemsMap) t[a] || (l[a] = !0);
            };
            if ("object" === c(h) && h.path === e && "object" === c(h.common) || (h = {
              path: e,
              common: {}
            }, o[e] = h), h.remote = {
              revision: n,
              timestamp: s.now()
            }, m(e)) for (a in f(h.common), f(h.remote), h.remote.itemsMap = {}, t) h.remote.itemsMap[a] = !0; else h.remote.body = t, h.remote.contentType = r, (u = o[i]) && u.local && u.local.itemsMap && (a = e.substring(i.length), u.local.itemsMap[a] = !0, g(u.local.itemsMap, u.common.itemsMap) && delete u.local);
            return o[e] = s.autoMerge(h), {toBeSaved: o, missingChildren: l}
          }))
        }
      }, {
        key: "completePush", value: function (e, t, r, n) {
          var o = this;
          return this.rs.local.getNodes([e]).then((function (i) {
            var s = i[e];
            if (!s.push) throw o.stopped = !0, new Error("completePush called but no push version!");
            return r ? (P("[Sync] We have a conflict"), s.remote && s.remote.revision === n || (s.remote = {
              revision: n || "conflict",
              timestamp: o.now()
            }, delete s.push), i[e] = o.autoMerge(s)) : (s.common = {
              revision: n,
              timestamp: o.now()
            }, "put" === t ? (s.common.body = s.push.body, s.common.contentType = s.push.contentType, g(s.local.body, s.push.body) && s.local.contentType === s.push.contentType && delete s.local, delete s.push) : "delete" === t && (!1 === s.local.body ? i[e] = void 0 : delete s.push)), o.rs.local.setNodes(o.flush(i))
          }))
        }
      }, {
        key: "dealWithFailure", value: function (e) {
          var t = this;
          return this.rs.local.getNodes([e]).then((function (r) {
            if (r[e]) return delete r[e].push, t.rs.local.setNodes(t.flush(r))
          }))
        }
      }, {
        key: "interpretStatus", value: function (e) {
          var t = {
            statusCode: e,
            successful: void 0,
            conflict: void 0,
            unAuth: void 0,
            notFound: void 0,
            changed: void 0,
            networkProblems: void 0
          };
          if ("offline" === e || "timeout" === e) return t.successful = !1, t.networkProblems = !0, t;
          var r = Math.floor(e / 100);
          return t.successful = 2 === r || 304 === e || 412 === e || 404 === e, t.conflict = 412 === e, t.unAuth = 401 === e && this.rs.remote.token !== E.IMPLIED_FAKE_TOKEN || 402 === e || 403 === e, t.notFound = 404 === e, t.changed = 304 !== e, t
        }
      }, {
        key: "handleGetResponse", value: function (e, t, r, n, o) {
          var i = this;
          return t.notFound && (r = !!m(e) && {}), t.changed ? this.completeFetch(e, r, n, o).then((function (t) {
            return m(e) ? i.corruptServerItemsMap(r) ? (P("[Sync] WARNING: Discarding corrupt folder description from server for " + e), !1) : i.markChildren(e, r, t.toBeSaved, t.missingChildren).then((function () {
              return !0
            })) : i.rs.local.setNodes(i.flush(t.toBeSaved)).then((function () {
              return !0
            }))
          })) : this.updateCommonTimestamp(e, o).then((function () {
            return !0
          }))
        }
      }, {
        key: "handleResponse", value: function (t, r, n) {
          var o, i = this, s = this.interpretStatus(n.statusCode);
          if (s.successful) {
            if ("get" === r) return this.handleGetResponse(t, s, n.body, n.contentType, n.revision);
            if ("put" === r || "delete" === r) return this.completePush(t, r, s.conflict, n.revision).then((function () {
              return !0
            }));
            throw new Error("cannot handle response for unknown action ".concat(r))
          }
          return o = s.unAuth ? new E.Unauthorized : s.networkProblems ? new e.SyncError("Network request failed.") : new Error("HTTP response code " + s.statusCode + " received."), this.dealWithFailure(t).then((function () {
            throw i.rs._emit("error", o), o
          }))
        }
      }, {
        key: "finishTask", value: function (e) {
          var t = this;
          if (void 0 !== e.action) return e.promise.then((function (r) {
            return t.handleResponse(e.path, e.action, r)
          }), (function (r) {
            return P("[Sync] wireclient rejects its promise!", e.path, e.action, r), t.handleResponse(e.path, e.action, {statusCode: "offline"})
          })).then((function (r) {
            if (delete t._timeStarted[e.path], delete t._running[e.path], r && t._tasks[e.path]) {
              for (var n = 0; n < t._tasks[e.path].length; n++) t._tasks[e.path][n]();
              delete t._tasks[e.path];
            }
            t.rs._emit("sync-req-done"), t.collectTasks(!1).then((function () {
              !t.hasTasks() || t.stopped ? (P("[Sync] Sync is done! Reschedule?", Object.getOwnPropertyNames(t._tasks).length, t.stopped), t.done || (t.done = !0, t.rs._emit("sync-done"))) : setTimeout((function () {
                t.doTasks();
              }), 10);
            }));
          }), (function (r) {
            P("[Sync] Error", r), delete t._timeStarted[e.path], delete t._running[e.path], t.rs._emit("sync-req-done"), t.done || (t.done = !0, t.rs._emit("sync-done"));
          }));
          delete this._running[e.path];
        }
      }, {
        key: "doTasks", value: function () {
          var e, t, r = 0;
          if ((e = (this.rs.remote.connected ? this.rs.remote.online ? this.numThreads : 1 : 0) - Object.getOwnPropertyNames(this._running).length) <= 0) return !0;
          for (t in this._tasks) if (!this._running[t] && (this._timeStarted[t] = this.now(), this._running[t] = this.doTask(t), this._running[t].then(this.finishTask.bind(this)), ++r >= e)) return !0;
          return r >= e
        }
      }, {
        key: "collectTasks", value: function (e) {
          var t = this;
          return this.hasTasks() || this.stopped ? Promise.resolve() : this.collectDiffTasks().then((function (r) {
            return r || !1 === e ? Promise.resolve() : t.collectRefreshTasks()
          }), (function (e) {
            throw e
          }))
        }
      }, {
        key: "addTask", value: function (e, t) {
          this._tasks[e] || (this._tasks[e] = []), "function" == typeof t && this._tasks[e].push(t);
        }
      }, {
        key: "sync", value: function () {
          var e = this;
          return this.done = !1, this.doTasks() ? Promise.resolve() : this.collectTasks().then((function () {
            try {
              e.doTasks();
            } catch (e) {
              P("[Sync] doTasks error", e);
            }
          }), (function (e) {
            throw P("[Sync] Sync error", e), new Error("Local cache unavailable")
          }))
        }
      }]) && h(t.prototype, r), n && h(t, n), e
    }();
    k.SyncError = function (e) {
      function t(e) {
        var r;
        l(this, t), (r = n(this, u(t).call(this))).name = "SyncError";
        var o = "Sync failed: ";
        return "object" === c(e) && "message" in e ? (o += e.message, r.stack = e.stack, r.originalError = e) : o += e, r.message = o, r
      }

      return function (e, t) {
        if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function");
        e.prototype = Object.create(t && t.prototype, {
          constructor: {
            value: e,
            writable: !0,
            configurable: !0
          }
        }), t && a(e, t);
      }(t, e), t
    }(o(Error)), e.exports = k;
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o = r(0), i = r(3), s = r(1), a = o.isFolder, u = o.isDocument, c = o.deepClone;

    function l(e) {
      if ("object" === n(e) && "string" == typeof e.path) if (a(e.path)) {
        if (e.local && e.local.itemsMap) return e.local;
        if (e.common && e.common.itemsMap) return e.common
      } else {
        if (e.local) {
          if (e.local.body && e.local.contentType) return e.local;
          if (!1 === e.local.body) return
        }
        if (e.common && e.common.body && e.common.contentType) return e.common;
        if (e.body && e.contentType) return {body: e.body, contentType: e.contentType}
      }
    }

    function h(e, t) {
      var r;
      for (r in e) {
        if (e[r] && e[r].remote) return !0;
        var n = l(e[r]);
        if (n && n.timestamp && (new Date).getTime() - n.timestamp <= t) return !1;
        if (!n) return !0
      }
      return !0
    }

    var f = o.pathsFromRoot;

    function d(e) {
      var t = {path: e, common: {}};
      return a(e) && (t.common.itemsMap = {}), t
    }

    function p(e, t) {
      return e.common || (e.common = {itemsMap: {}}), e.common.itemsMap || (e.common.itemsMap = {}), e.local || (e.local = c(e.common)), e.local.itemsMap || (e.local.itemsMap = e.common.itemsMap), e.local.itemsMap[t] = !0, e
    }

    var m = {
      get: function (e, t, r) {
        return "number" == typeof t ? this.getNodes(f(e)).then((function (n) {
          var o = l(n[e]);
          return h(n, t) ? r(e) : o ? {
            statusCode: 200,
            body: o.body || o.itemsMap,
            contentType: o.contentType
          } : {statusCode: 404}
        })) : this.getNodes([e]).then((function (t) {
          var r = l(t[e]);
          if (r) {
            if (a(e)) for (var n in r.itemsMap) r.itemsMap.hasOwnProperty(n) && !1 === r.itemsMap[n] && delete r.itemsMap[n];
            return {statusCode: 200, body: r.body || r.itemsMap, contentType: r.contentType}
          }
          return {statusCode: 404}
        }))
      }, put: function (e, t, r) {
        var n = f(e);
        return this._updateNodes(n, (function (e, n) {
          try {
            for (var o = 0, i = e.length; o < i; o++) {
              var a = e[o], u = n[a], c = void 0;
              if (u || (n[a] = u = d(a)), 0 === o) c = l(u), u.local = {
                body: t,
                contentType: r,
                previousBody: c ? c.body : void 0,
                previousContentType: c ? c.contentType : void 0
              }; else u = p(u, e[o - 1].substring(a.length));
            }
            return n
          } catch (e) {
            throw s("[Cachinglayer] Error during PUT", n, e), e
          }
        }))
      }, delete: function (e) {
        var t = f(e);
        return this._updateNodes(t, (function (e, t) {
          for (var r = 0, n = e.length; r < n; r++) {
            var o = e[r], i = t[o], s = void 0;
            if (i) if (0 === r) s = l(i), i.local = {
              body: !1,
              previousBody: s ? s.body : void 0,
              previousContentType: s ? s.contentType : void 0
            }; else {
              i.local || (i.local = c(i.common));
              var a = e[r - 1].substring(o.length);
              if (delete i.local.itemsMap[a], Object.getOwnPropertyNames(i.local.itemsMap).length > 0) break
            } else console.error("Cannot delete non-existing node " + o);
          }
          return t
        }))
      }, flush: function (e) {
        var t = this;
        return t._getAllDescendentPaths(e).then((function (e) {
          return t.getNodes(e)
        })).then((function (e) {
          for (var r in e) {
            var n = e[r];
            n && n.common && n.local && t._emitChange({
              path: n.path,
              origin: "local",
              oldValue: !1 === n.local.body ? void 0 : n.local.body,
              newValue: !1 === n.common.body ? void 0 : n.common.body
            }), e[r] = void 0;
          }
          return t.setNodes(e)
        }))
      }, _emitChange: function (e) {
        i.changeEvents[e.origin] && this._emit("change", e);
      }, fireInitial: function () {
        if (i.changeEvents.local) {
          var e = this;
          e.forAllNodes((function (t) {
            var r;
            u(t.path) && (r = l(t)) && e._emitChange({
              path: t.path,
              origin: "local",
              oldValue: void 0,
              oldContentType: void 0,
              newValue: r.body,
              newContentType: r.contentType
            });
          })).then((function () {
            e._emit("local-events-done");
          }));
        }
      }, onDiff: function (e) {
        this.diffHandler = e;
      }, migrate: function (e) {
        return "object" !== n(e) || e.common || (e.common = {}, "string" == typeof e.path ? "/" === e.path.substr(-1) && "object" === n(e.body) && (e.common.itemsMap = e.body) : (e.local || (e.local = {}), e.local.body = e.body, e.local.contentType = e.contentType)), e
      }, _updateNodesRunning: !1, _updateNodesQueued: [], _updateNodes: function (e, t) {
        return new Promise(function (r, n) {
          this._doUpdateNodes(e, t, {resolve: r, reject: n});
        }.bind(this))
      }, _doUpdateNodes: function (e, t, r) {
        var n = this;
        n._updateNodesRunning ? n._updateNodesQueued.push({
          paths: e,
          cb: t,
          promise: r
        }) : (n._updateNodesRunning = !0, n.getNodes(e).then((function (i) {
          var s, a = c(i), l = [], h = o.equal;
          for (var f in i = t(e, i)) h(s = i[f], a[f]) ? delete i[f] : u(f) && (h(s.local.body, s.local.previousBody) && s.local.contentType === s.local.previousContentType || l.push({
            path: f,
            origin: "window",
            oldValue: s.local.previousBody,
            newValue: !1 === s.local.body ? void 0 : s.local.body,
            oldContentType: s.local.previousContentType,
            newContentType: s.local.contentType
          }), delete s.local.previousBody, delete s.local.previousContentType);
          n.setNodes(i).then((function () {
            n._emitChangeEvents(l), r.resolve({statusCode: 200});
          }));
        })).then((function () {
          return Promise.resolve()
        }), (function (e) {
          r.reject(e);
        })).then((function () {
          n._updateNodesRunning = !1;
          var e = n._updateNodesQueued.shift();
          e && n._doUpdateNodes(e.paths, e.cb, e.promise);
        })));
      }, _emitChangeEvents: function (e) {
        for (var t = 0, r = e.length; t < r; t++) this._emitChange(e[t]), this.diffHandler && this.diffHandler(e[t].path);
      }, _getAllDescendentPaths: function (e) {
        var t = this;
        return a(e) ? t.getNodes([e]).then((function (r) {
          var n = [e], o = l(r[e]), i = Object.keys(o.itemsMap).map((function (r) {
            return t._getAllDescendentPaths(e + r).then((function (e) {
              for (var t = 0, r = e.length; t < r; t++) n.push(e[t]);
            }))
          }));
          return Promise.all(i).then((function () {
            return n
          }))
        })) : Promise.resolve([e])
      }, _getInternals: function () {
        return {getLatest: l, makeNode: d, isOutdated: h}
      }
    };
    e.exports = function (e) {
      for (var t in m) e[t] = m[t];
    };
  }, function (e, t, r) {

    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o, i = r(0), s = r(11), a = r(13), u = r(14), c = r(5), l = r(3), h = r(4), f = r(7), d = r(1), p = r(27),
      m = i.getGlobalContext(), y = r(2), g = i.getJSONFromLocalStorage;

    function v(e) {
      return 403 !== e.statusCode && 401 !== e.statusCode || this._emit("error", new h.Unauthorized), Promise.resolve(e)
    }

    var b = function (e) {
      "object" === n(e) && i.extend(l, e), y(this, "ready", "authing", "connecting", "connected", "disconnected", "not-connected", "conflict", "error", "features-loaded", "sync-interval-change", "sync-req-done", "sync-done", "wire-busy", "wire-done", "network-offline", "network-online"), this._pending = [], this._setGPD({
        get: this._pendingGPD("get"),
        put: this._pendingGPD("put"),
        delete: this._pendingGPD("delete")
      }), this._cleanups = [], this._pathHandlers = {change: {}}, this.apiKeys = {}, (o = i.localStorageAvailable()) && (this.apiKeys = g("remotestorage:api-keys") || {}, this.setBackend(localStorage.getItem("remotestorage:backend") || "remotestorage"));
      var t = this.on;
      this.on = function (e, r) {
        if (this._allLoaded) switch (e) {
          case"features-loaded":
            setTimeout(r, 0);
            break;
          case"ready":
            this.remote && setTimeout(r, 0);
            break;
          case"connected":
            this.remote && this.remote.connected && setTimeout(r, 0);
            break;
          case"not-connected":
            this.remote && !this.remote.connected && setTimeout(r, 0);
        }
        return t.call(this, e, r)
      }, this._init(), this.fireInitial = function () {
        this.local && setTimeout(this.local.fireInitial.bind(this.local), 0);
      }.bind(this), this.on("ready", this.fireInitial.bind(this)), this.loadModules();
    };

    function _(e) {
      return "number" == typeof e && e > 1e3 && e < 36e5
    }

    b.Authorize = h, b.SyncError = f.SyncError, b.Unauthorized = h.Unauthorized, b.DiscoveryError = u.DiscoveryError, b.prototype = {
      loadModules: function () {
        l.modules.forEach(this.addModule.bind(this));
      },
      authorize: function (e) {
        this.access.setStorageType(this.remote.storageApi), void 0 === e.scope && (e.scope = this.access.scopeParameter), e.redirectUri = m.cordova ? l.cordovaRedirectUri : String(h.getLocation()), void 0 === e.clientId && (e.clientId = e.redirectUri.match(/^(https?:\/\/[^/]+)/)[0]), h(this, e);
      },
      impliedauth: function (e, t) {
        e = this.remote.storageApi, t = String(document.location), d("ImpliedAuth proceeding due to absent authURL; storageApi = " + e + " redirectUri = " + t), this.remote.configure({token: h.IMPLIED_FAKE_TOKEN}), document.location = t;
      },
      connect: function (e, t) {
        var r = this;
        if (this.setBackend("remotestorage"), e.indexOf("@") < 0) this._emit("error", new b.DiscoveryError("User address doesn't contain an @.")); else {
          if (m.cordova) {
            if ("string" != typeof l.cordovaRedirectUri) return void this._emit("error", new b.DiscoveryError("Please supply a custom HTTPS redirect URI for your Cordova app"));
            if (!m.cordova.InAppBrowser) return void this._emit("error", new b.DiscoveryError("Please include the InAppBrowser Cordova plugin to enable OAuth"))
          }
          this.remote.configure({userAddress: e}), this._emit("connecting");
          var n = setTimeout(function () {
            this._emit("error", new b.DiscoveryError("No storage information found for this user address."));
          }.bind(this), l.discoveryTimeout);
          u(e).then((function (o) {
            if (clearTimeout(n), r._emit("authing"), o.userAddress = e, r.remote.configure(o), !r.remote.connected) if (o.authURL) if (void 0 === t) r.authorize({authURL: o.authURL}); else {
              if ("string" != typeof t) throw new Error("Supplied bearer token must be a string");
              d("Skipping authorization sequence and connecting with known token"), r.remote.configure({token: t});
            } else r.impliedauth();
          }), (function () {
            clearTimeout(n), r._emit("error", new b.DiscoveryError("No storage information found for this user address."));
          }));
        }
      },
      reconnect: function () {
        this.remote.configure({token: null}), "remotestorage" === this.backend ? this.connect(this.remote.userAddress) : this.remote.connect();
      },
      disconnect: function () {
        this.remote && this.remote.configure({
          userAddress: null,
          href: null,
          storageApi: null,
          token: null,
          properties: null
        }), this._setGPD({
          get: this._pendingGPD("get"),
          put: this._pendingGPD("put"),
          delete: this._pendingGPD("delete")
        });
        var e = this._cleanups.length, t = 0, r = function () {
          ++t >= e && (this._init(), d("Done cleaning up, emitting disconnected and disconnect events"), this._emit("disconnected"));
        }.bind(this);
        e > 0 ? this._cleanups.forEach(function (e) {
          var t = e(this);
          "object" === n(t) && "function" == typeof t.then ? t.then(r) : r();
        }.bind(this)) : r();
      },
      setBackend: function (e) {
        this.backend = e, o && (e ? localStorage.setItem("remotestorage:backend", e) : localStorage.removeItem("remotestorage:backend"));
      },
      onChange: function (e, t) {
        this._pathHandlers.change[e] || (this._pathHandlers.change[e] = []), this._pathHandlers.change[e].push(t);
      },
      enableLog: function () {
        l.logging = !0;
      },
      disableLog: function () {
        l.logging = !1;
      },
      log: function () {
        d.apply(b, arguments);
      },
      setApiKeys: function (e) {
        var t = this, r = ["googledrive", "dropbox"];
        if ("object" !== n(e) || !Object.keys(e).every((function (e) {
          return r.includes(e)
        }))) return console.error("setApiKeys() was called with invalid arguments"), !1;
        Object.keys(e).forEach((function (r) {
          var n = e[r];
          if (n) {
            switch (r) {
              case"dropbox":
                t.apiKeys.dropbox = {appKey: n}, void 0 !== t.dropbox && t.dropbox.clientId === n || s._rs_init(t);
                break;
              case"googledrive":
                t.apiKeys.googledrive = {clientId: n}, void 0 !== t.googledrive && t.googledrive.clientId === n || a._rs_init(t);
            }
            return !0
          }
          delete t.apiKeys[r];
        })), o && localStorage.setItem("remotestorage:api-keys", JSON.stringify(this.apiKeys));
      },
      setCordovaRedirectUri: function (e) {
        if ("string" != typeof e || !e.match(/http(s)?:\/\//)) throw new Error("Cordova redirect URI must be a URI string");
        l.cordovaRedirectUri = e;
      },
      _init: p.loadFeatures,
      features: p.features,
      loadFeature: p.loadFeature,
      featureSupported: p.featureSupported,
      featureDone: p.featureDone,
      featuresDone: p.featuresDone,
      featuresLoaded: p.featuresLoaded,
      featureInitialized: p.featureInitialized,
      featureFailed: p.featureFailed,
      hasFeature: p.hasFeature,
      _setCachingModule: p._setCachingModule,
      _collectCleanupFunctions: p._collectCleanupFunctions,
      _fireReady: p._fireReady,
      initFeature: p.initFeature,
      _setGPD: function (e, t) {
        function r(e) {
          return function () {
            return e.apply(t, arguments).then(v.bind(this))
          }
        }

        this.get = r(e.get), this.put = r(e.put), this.delete = r(e.delete);
      },
      _pendingGPD: function (e) {
        return function () {
          var t = Array.prototype.slice.call(arguments);
          return new Promise(function (r, n) {
            this._pending.push({method: e, args: t, promise: {resolve: r, reject: n}});
          }.bind(this))
        }.bind(this)
      },
      _processPending: function () {
        this._pending.forEach(function (e) {
          try {
            this[e.method].apply(this, e.args).then(e.promise.resolve, e.promise.reject);
          } catch (t) {
            e.promise.reject(t);
          }
        }.bind(this)), this._pending = [];
      },
      _bindChange: function (e) {
        e.on("change", this._dispatchEvent.bind(this, "change"));
      },
      _dispatchEvent: function (e, t) {
        var r = this;
        Object.keys(this._pathHandlers[e]).forEach((function (n) {
          var o = n.length;
          t.path.substr(0, o) === n && r._pathHandlers[e][n].forEach((function (e) {
            var o = {};
            for (var i in t) o[i] = t[i];
            o.relativePath = t.path.replace(new RegExp("^" + n), "");
            try {
              e(o);
            } catch (e) {
              console.error("'change' handler failed: ", e, e.stack), r._emit("error", e);
            }
          }));
        }));
      },
      scope: function (e) {
        if ("string" != typeof e) throw "Argument 'path' of baseClient.scope must be a string";
        if (!this.access.checkPathPermission(e, "r")) {
          var t = e.replace(/(['\\])/g, "\\$1");
          console.warn("WARNING: please call remoteStorage.access.claim('" + t + "', 'r') (read only) or remoteStorage.access.claim('" + t + "', 'rw') (read/write) first");
        }
        return new c(this, e)
      },
      getSyncInterval: function () {
        return l.syncInterval
      },
      setSyncInterval: function (e) {
        if (!_(e)) throw e + " is not a valid sync interval";
        var t = l.syncInterval;
        l.syncInterval = parseInt(e, 10), this._emit("sync-interval-change", {oldValue: t, newValue: e});
      },
      getBackgroundSyncInterval: function () {
        return l.backgroundSyncInterval
      },
      setBackgroundSyncInterval: function (e) {
        if (!_(e)) throw e + " is not a valid sync interval";
        var t = l.backgroundSyncInterval;
        l.backgroundSyncInterval = parseInt(e, 10), this._emit("sync-interval-change", {oldValue: t, newValue: e});
      },
      getCurrentSyncInterval: function () {
        return l.isBackground ? l.backgroundSyncInterval : l.syncInterval
      },
      getRequestTimeout: function () {
        return l.requestTimeout
      },
      setRequestTimeout: function (e) {
        l.requestTimeout = parseInt(e, 10);
      },
      syncCycle: function () {
        this.sync && !this.sync.stopped && (this.on("sync-done", function () {
          d("[Sync] Sync done. Setting timer to", this.getCurrentSyncInterval()), this.sync && !this.sync.stopped && (this._syncTimer && (clearTimeout(this._syncTimer), this._syncTimer = void 0), this._syncTimer = setTimeout(this.sync.sync.bind(this.sync), this.getCurrentSyncInterval()));
        }.bind(this)), this.sync.sync());
      },
      startSync: function () {
        return l.cache ? (this.sync.stopped = !1, this.syncStopped = !1, this.sync.sync()) : (console.warn("Nothing to sync, because caching is disabled."), Promise.resolve())
      },
      stopSync: function () {
        clearTimeout(this._syncTimer), this._syncTimer = void 0, this.sync ? (d("[Sync] Stopping sync"), this.sync.stopped = !0) : (d("[Sync] Will instantiate sync stopped"), this.syncStopped = !0);
      }
    }, b.util = i, Object.defineProperty(b.prototype, "connected", {
      get: function () {
        return this.remote.connected
      }
    });
    var w = r(15);
    Object.defineProperty(b.prototype, "access", {
      get: function () {
        var e = new w;
        return Object.defineProperty(this, "access", {value: e}), e
      }, configurable: !0
    });
    var P = r(16);
    Object.defineProperty(b.prototype, "caching", {
      configurable: !0, get: function () {
        var e = new P;
        return Object.defineProperty(this, "caching", {value: e}), e
      }
    }), e.exports = b, r(32);
  }, function (e, t) {
    var r;
    r = function () {
      return this
    }();
    try {
      r = r || new Function("return this")();
    } catch (e) {
      "object" == typeof window && (r = window);
    }
    e.exports = r;
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o, i = r(4), s = r(5), a = r(6), u = r(0), c = r(2), l = r(24), h = r(7), f = "remotestorage:dropbox",
      d = u.isFolder, p = u.cleanPath, m = u.shouldBeTreatedAsBinary, y = u.getJSONFromLocalStorage,
      g = u.getTextFromArrayBuffer, v = function (e) {
        return p("/remotestorage/" + e).replace(/\/$/, "")
      }, b = function (e, t) {
        return new RegExp("^" + t.join("\\/") + "(\\/|$)").test(e.error_summary)
      }, _ = function (e) {
        return e instanceof ArrayBuffer || a.isArrayBufferView(e)
      }, w = function (e) {
        if (this.rs = e, this.connected = !1, this.rs = e, this._initialFetchDone = !1, c(this, "connected", "not-connected"), this.clientId = e.apiKeys.dropbox.appKey, this._revCache = new l("rev"), this._fetchDeltaCursor = null, this._fetchDeltaPromise = null, this._itemRefs = {}, o = u.localStorageAvailable()) {
          var t = y(f);
          t && this.configure(t), this._itemRefs = y("".concat(f, ":shares")) || {};
        }
        this.connected && setTimeout(this._emit.bind(this), 0, "connected");
      };

    function P(e) {
      e._dropboxOrigSync || (e._dropboxOrigSync = e.sync.sync.bind(e.sync), e.sync.sync = function () {
        return this.dropbox.fetchDelta.apply(this.dropbox, arguments).then(e._dropboxOrigSync, (function (t) {
          e._emit("error", new h.SyncError(t)), e._emit("sync-done");
        }))
      }.bind(e));
    }

    function E(e) {
      e._dropboxOrigSyncCycle && (e.syncCycle = e._dropboxOrigSyncCycle, delete e._dropboxOrigSyncCycle);
    }

    function S(e) {
      !function (e) {
        e._origRemote || (e._origRemote = e.remote, e.remote = e.dropbox);
      }(e), e.sync ? P(e) : function (e) {
        var t = arguments;
        e._dropboxOrigSyncCycle || (e._dropboxOrigSyncCycle = e.syncCycle, e.syncCycle = function () {
          if (!e.sync) throw new Error("expected sync to be initialized by now");
          P(e), e._dropboxOrigSyncCycle(t), E(e);
        });
      }(e), function (e) {
        e._origBaseClientGetItemURL || (e._origBaseClientGetItemURL = s.prototype.getItemURL, s.prototype.getItemURL = function () {
          throw new Error("getItemURL is not implemented for Dropbox yet")
        });
      }(e);
    }

    function T(e) {
      !function (e) {
        e._origRemote && (e.remote = e._origRemote, delete e._origRemote);
      }(e), function (e) {
        e._dropboxOrigSync && (e.sync.sync = e._dropboxOrigSync, delete e._dropboxOrigSync);
      }(e), function (e) {
        e._origBaseClientGetItemURL && (s.prototype.getItemURL = e._origBaseClientGetItemURL, delete e._origBaseClientGetItemURL);
      }(e), E(e);
    }

    w.prototype = {
      online: !0, connect: function () {
        this.rs.setBackend("dropbox"), this.token ? S(this.rs) : this.rs.authorize({
          authURL: "https://www.dropbox.com/oauth2/authorize",
          scope: "",
          clientId: this.clientId
        });
      }, configure: function (e) {
        void 0 !== e.userAddress && (this.userAddress = e.userAddress), void 0 !== e.token && (this.token = e.token);
        var t = function () {
          o && localStorage.setItem(f, JSON.stringify({userAddress: this.userAddress, token: this.token}));
        }, r = function () {
          this.connected = !1, o && localStorage.removeItem(f);
        };
        this.token ? (this.connected = !0, this.userAddress ? (this._emit("connected"), t.apply(this)) : this.info().then(function (e) {
          this.userAddress = e.email, this._emit("connected"), t.apply(this);
        }.bind(this)).catch(function () {
          r.apply(this), this.rs._emit("error", new Error("Could not fetch user info."));
        }.bind(this))) : r.apply(this);
      }, stopWaitingForToken: function () {
        this.connected || this._emit("not-connected");
      }, _getFolder: function (e) {
        var t = this._revCache, r = this, n = function (n) {
          var i, s;
          if (200 !== n.status && 409 !== n.status) return Promise.reject("Unexpected response status: " + n.status);
          try {
            i = JSON.parse(n.responseText);
          } catch (e) {
            return Promise.reject(e)
          }
          return 409 === n.status ? b(i, ["path", "not_found"]) ? Promise.resolve({}) : Promise.reject(new Error("API returned an error: " + i.error_summary)) : (s = i.entries.reduce((function (n, o) {
            var i = "folder" === o[".tag"], s = o.path_lower.split("/").slice(-1)[0] + (i ? "/" : "");
            return i ? n[s] = {ETag: t.get(e + s)} : (n[s] = {ETag: o.rev}, r._revCache.set(e + s, o.rev)), n
          }), {}), i.has_more ? o(i.cursor).then((function (e) {
            return Object.assign(s, e)
          })) : Promise.resolve(s))
        }, o = function (e) {
          var t = {body: {cursor: e}};
          return r._request("POST", "https://api.dropboxapi.com/2/files/list_folder/continue", t).then(n)
        };
        return this._request("POST", "https://api.dropboxapi.com/2/files/list_folder", {body: {path: v(e)}}).then(n).then((function (r) {
          return Promise.resolve({
            statusCode: 200,
            body: r,
            contentType: "application/json; charset=UTF-8",
            revision: t.get(e)
          })
        }))
      }, get: function (e, t) {
        var r = this;
        if (!this.connected) return Promise.reject("not connected (path: " + e + ")");
        var n = this, o = this._revCache.get(e);
        if (null === o) return Promise.resolve({statusCode: 404});
        if (t && t.ifNoneMatch) {
          if (!this._initialFetchDone) return this.fetchDelta().then((function () {
            return r.get(e, t)
          }));
          if (o && o === t.ifNoneMatch) return Promise.resolve({statusCode: 304})
        }
        if ("/" === e.substr(-1)) return this._getFolder(e, t);
        var i = {headers: {"Dropbox-API-Arg": JSON.stringify({path: v(e)})}, responseType: "arraybuffer"};
        return t && t.ifNoneMatch && (i.headers["If-None-Match"] = t.ifNoneMatch), this._request("GET", "https://content.dropboxapi.com/2/files/download", i).then((function (t) {
          var r, o, i, s, a = t.status;
          return 200 !== a && 409 !== a ? Promise.resolve({statusCode: a}) : (r = t.getResponseHeader("Dropbox-API-Result"), g(t.response, "UTF-8").then((function (u) {
            o = u, 409 === a && (r = o);
            try {
              r = JSON.parse(r);
            } catch (e) {
              return Promise.reject(e)
            }
            if (409 === a) return b(r, ["path", "not_found"]) ? {statusCode: 404} : Promise.reject(new Error('API error while downloading file ("' + e + '"): ' + r.error_summary));
            if (i = t.getResponseHeader("Content-Type"), s = r.rev, n._revCache.set(e, s), n._shareIfNeeded(e), m(u, i)) o = t.response; else try {
              o = JSON.parse(o), i = "application/json; charset=UTF-8";
            } catch (e) {
            }
            return {statusCode: a, body: o, contentType: i, revision: s}
          })))
        }))
      }, put: function (e, t, r, n) {
        var o = this;
        if (!this.connected) throw new Error("not connected (path: " + e + ")");
        var i = this._revCache.get(e);
        if (n && n.ifMatch && i && i !== n.ifMatch) return Promise.resolve({statusCode: 412, revision: i});
        if (n && "*" === n.ifNoneMatch && i && "rev" !== i) return Promise.resolve({statusCode: 412, revision: i});
        if (!r.match(/charset=/) && _(t) && (r += "; charset=binary"), t.length > 157286400) return Promise.reject(new Error("Cannot upload file larger than 150MB"));
        var s = n && (n.ifMatch || "*" === n.ifNoneMatch), a = {body: t, contentType: r, path: e};
        return (s ? this._getMetadata(e).then((function (e) {
          return n && "*" === n.ifNoneMatch && e ? Promise.resolve({
            statusCode: 412,
            revision: e.rev
          }) : n && n.ifMatch && e && e.rev !== n.ifMatch ? Promise.resolve({
            statusCode: 412,
            revision: e.rev
          }) : o._uploadSimple(a)
        })) : o._uploadSimple(a)).then((function (t) {
          return o._shareIfNeeded(e), t
        }))
      }, delete: function (e, t) {
        var r = this;
        if (!this.connected) throw new Error("not connected (path: " + e + ")");
        var n = this._revCache.get(e);
        return t && t.ifMatch && n && t.ifMatch !== n ? Promise.resolve({
          statusCode: 412,
          revision: n
        }) : t && t.ifMatch ? this._getMetadata(e).then((function (n) {
          return t && t.ifMatch && n && n.rev !== t.ifMatch ? Promise.resolve({
            statusCode: 412,
            revision: n.rev
          }) : r._deleteSimple(e)
        })) : this._deleteSimple(e)
      }, _shareIfNeeded: function (e) {
        e.match(/^\/public\/.*[^/]$/) && void 0 === this._itemRefs[e] && this.share(e);
      }, share: function (e) {
        var t = this, r = {body: {path: v(e)}};
        return this._request("POST", "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", r).then((function (r) {
          if (200 !== r.status && 409 !== r.status) return Promise.reject(new Error("Invalid response status:" + r.status));
          var n;
          try {
            n = JSON.parse(r.responseText);
          } catch (e) {
            return Promise.reject(new Error("Invalid response body: " + r.responseText))
          }
          return 409 === r.status ? b(n, ["shared_link_already_exists"]) ? t._getSharedLink(e) : Promise.reject(new Error("API error: " + n.error_summary)) : Promise.resolve(n.url)
        })).then((function (r) {
          return t._itemRefs[e] = r, o && localStorage.setItem(f + ":shares", JSON.stringify(t._itemRefs)), Promise.resolve(r)
        }), (function (t) {
          return t.message = 'Sharing Dropbox file or folder ("' + e + '") failed: ' + t.message, Promise.reject(t)
        }))
      }, info: function () {
        return this._request("POST", "https://api.dropboxapi.com/2/users/get_current_account", {}).then((function (e) {
          var t = e.responseText;
          try {
            t = JSON.parse(t);
          } catch (e) {
            return Promise.reject(new Error("Could not query current account info: Invalid API response: " + t))
          }
          return Promise.resolve({email: t.email})
        }))
      }, _request: function (e, t, r) {
        var o = this;
        return r.headers || (r.headers = {}), r.headers.Authorization = "Bearer " + this.token, "object" !== n(r.body) || _(r.body) || (r.body = JSON.stringify(r.body), r.headers["Content-Type"] = "application/json; charset=UTF-8"), this.rs._emit("wire-busy", {
          method: e,
          isFolder: d(t)
        }), a.request.call(this, e, t, r).then((function (n) {
          return n && 503 === n.status ? (o.online && (o.online = !1, o.rs._emit("network-offline")), setTimeout(o._request(e, t, r), 3210)) : (o.online || (o.online = !0, o.rs._emit("network-online")), o.rs._emit("wire-done", {
            method: e,
            isFolder: d(t),
            success: !0
          }), Promise.resolve(n))
        }), (function (r) {
          return o.online && (o.online = !1, o.rs._emit("network-offline")), o.rs._emit("wire-done", {
            method: e,
            isFolder: d(t),
            success: !1
          }), Promise.reject(r)
        }))
      }, fetchDelta: function () {
        var e = this;
        if (this._fetchDeltaPromise) return this._fetchDeltaPromise;
        var t = Array.prototype.slice.call(arguments), r = this, o = function e(n) {
          var o, s = "https://api.dropboxapi.com/2/files/list_folder";
          return "string" == typeof n ? (s += "/continue", o = {cursor: n}) : o = {
            path: "/remotestorage",
            recursive: !0,
            include_deleted: !0
          }, r._request("POST", s, {body: o}).then((function (o) {
            if (401 === o.status) return r.rs._emit("error", new i.Unauthorized), Promise.resolve(t);
            if (200 !== o.status && 409 !== o.status) return Promise.reject(new Error("Invalid response status: " + o.status));
            var s;
            try {
              s = JSON.parse(o.responseText);
            } catch (e) {
              return Promise.reject(new Error("Invalid response body: " + o.responseText))
            }
            if (409 === o.status) {
              if (!b(s, ["path", "not_found"])) return Promise.reject(new Error("API returned an error: " + s.error_summary));
              s = {cursor: null, entries: [], has_more: !1};
            }
            if (n || r._revCache.deactivatePropagation(), s.entries.forEach((function (e) {
              var t = e.path_lower.substr("/remotestorage".length);
              "deleted" === e[".tag"] ? (r._revCache.delete(t), r._revCache.delete(t + "/")) : "file" === e[".tag"] && r._revCache.set(t, e.rev);
            })), r._fetchDeltaCursor = s.cursor, s.has_more) return e(s.cursor);
            r._revCache.activatePropagation(), r._initialFetchDone = !0;
          })).catch((function (e) {
            return "timeout" === e || e instanceof ProgressEvent ? Promise.resolve() : Promise.reject(e)
          }))
        };
        return this._fetchDeltaPromise = o(r._fetchDeltaCursor).catch((function (t) {
          return "object" === n(t) && "message" in t ? t.message = "Dropbox: fetchDelta: " + t.message : t = "Dropbox: fetchDelta: ".concat(t), e._fetchDeltaPromise = null, Promise.reject(t)
        })).then((function () {
          return e._fetchDeltaPromise = null, Promise.resolve(t)
        })), this._fetchDeltaPromise
      }, _getMetadata: function (e) {
        var t = {path: v(e)};
        return this._request("POST", "https://api.dropboxapi.com/2/files/get_metadata", {body: t}).then((function (e) {
          if (200 !== e.status && 409 !== e.status) return Promise.reject(new Error("Invalid response status:" + e.status));
          var t;
          try {
            t = JSON.parse(e.responseText);
          } catch (t) {
            return Promise.reject(new Error("Invalid response body: " + e.responseText))
          }
          return 409 === e.status ? b(t, ["path", "not_found"]) ? Promise.resolve() : Promise.reject(new Error("API error: " + t.error_summary)) : Promise.resolve(t)
        })).then(void 0, (function (t) {
          return t.message = 'Could not load metadata for file or folder ("' + e + '"): ' + t.message, Promise.reject(t)
        }))
      }, _uploadSimple: function (e) {
        var t = this, r = {path: v(e.path), mode: {".tag": "overwrite"}, mute: !0};
        return e.ifMatch && (r.mode = {
          ".tag": "update",
          update: e.ifMatch
        }), this._request("POST", "https://content.dropboxapi.com/2/files/upload", {
          body: e.body,
          headers: {"Content-Type": "application/octet-stream", "Dropbox-API-Arg": JSON.stringify(r)}
        }).then((function (r) {
          if (200 !== r.status && 409 !== r.status) return Promise.resolve({statusCode: r.status});
          var n = r.responseText;
          try {
            n = JSON.parse(n);
          } catch (e) {
            return Promise.reject(new Error("Invalid API result: " + n))
          }
          return 409 === r.status ? b(n, ["path", "conflict"]) ? t._getMetadata(e.path).then((function (e) {
            return Promise.resolve({statusCode: 412, revision: e.rev})
          })) : Promise.reject(new Error("API error: " + n.error_summary)) : (t._revCache.set(e.path, n.rev), Promise.resolve({
            statusCode: r.status,
            revision: n.rev
          }))
        }))
      }, _deleteSimple: function (e) {
        var t = this, r = {path: v(e)};
        return this._request("POST", "https://api.dropboxapi.com/2/files/delete", {body: r}).then((function (e) {
          if (200 !== e.status && 409 !== e.status) return Promise.resolve({statusCode: e.status});
          var t = e.responseText;
          try {
            t = JSON.parse(t);
          } catch (e) {
            return Promise.reject(new Error("Invalid response body: " + t))
          }
          return 409 === e.status ? b(t, ["path_lookup", "not_found"]) ? Promise.resolve({statusCode: 404}) : Promise.reject(new Error("API error: " + t.error_summary)) : Promise.resolve({statusCode: 200})
        })).then((function (r) {
          return 200 !== r.statusCode && 404 !== r.statusCode || (t._revCache.delete(e), delete t._itemRefs[e]), Promise.resolve(r)
        }), (function (t) {
          return t.message = 'Could not delete Dropbox file or folder ("' + e + '"): ' + t.message, Promise.reject(t)
        }))
      }, _getSharedLink: function (e) {
        var t = {body: {path: v(e), direct_only: !0}};
        return this._request("POST", "https://api.dropbox.com/2/sharing/list_shared_links", t).then((function (e) {
          if (200 !== e.status && 409 !== e.status) return Promise.reject(new Error("Invalid response status: " + e.status));
          var t;
          try {
            t = JSON.parse(e.responseText);
          } catch (t) {
            return Promise.reject(new Error("Invalid response body: " + e.responseText))
          }
          return 409 === e.status ? Promise.reject(new Error("API error: " + e.error_summary)) : t.links.length ? Promise.resolve(t.links[0].url) : Promise.reject(new Error("No links returned"))
        }), (function (t) {
          return t.message = 'Could not get link to a shared file or folder ("' + e + '"): ' + t.message, Promise.reject(t)
        }))
      }
    }, w._rs_init = function (e) {
      o = u.localStorageAvailable(), e.apiKeys.dropbox && (e.dropbox = new w(e)), "dropbox" === e.backend && S(e);
    }, w._rs_supported = function () {
      return !0
    }, w._rs_cleanup = function (e) {
      T(e), o && localStorage.removeItem(f), e.setBackend(void 0);
    }, e.exports = w;
  }, function (e, t, r) {
    var n = r(2), o = "undefined" != typeof window ? "browser" : "node", i = {}, s = function () {
      return i
    };
    s.isBrowser = function () {
      return "browser" === o
    }, s.isNode = function () {
      return "node" === o
    }, s.goBackground = function () {
      s._emit("background");
    }, s.goForeground = function () {
      s._emit("foreground");
    }, s._rs_init = function () {
      function e() {
        document[i.hiddenProperty] ? s.goBackground() : s.goForeground();
      }

      n(s, "background", "foreground"), "browser" === o && (void 0 !== document.hidden ? (i.hiddenProperty = "hidden", i.visibilityChangeEvent = "visibilitychange") : void 0 !== document.mozHidden ? (i.hiddenProperty = "mozHidden", i.visibilityChangeEvent = "mozvisibilitychange") : void 0 !== document.msHidden ? (i.hiddenProperty = "msHidden", i.visibilityChangeEvent = "msvisibilitychange") : void 0 !== document.webkitHidden && (i.hiddenProperty = "webkitHidden", i.visibilityChangeEvent = "webkitvisibilitychange"), document.addEventListener(i.visibilityChangeEvent, e, !1), e());
    }, s._rs_cleanup = function () {
    }, e.exports = s;
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o, i = r(5), s = r(6), a = r(2), u = r(0), c = "https://www.googleapis.com", l = "remotestorage:googledrive",
      h = u.isFolder, f = u.cleanPath, d = u.shouldBeTreatedAsBinary, p = u.getJSONFromLocalStorage,
      m = u.getTextFromArrayBuffer;

    function y(e) {
      return "/" === e.substr(-1) && (e = e.substr(0, e.length - 1)), decodeURIComponent(e)
    }

    function g(e) {
      return e.replace(/[^\/]+\/?$/, "")
    }

    function v(e) {
      var t = e.split("/");
      return "/" === e.substr(-1) ? t[t.length - 2] + "/" : t[t.length - 1]
    }

    function b(e) {
      return f("".concat("/remotestorage", "/").concat(e))
    }

    function _(e) {
      return e.replace(/^["'](.*)["']$/, "$1")
    }

    var w = function (e) {
      this.maxAge = e, this._items = {};
    };
    w.prototype = {
      get: function (e) {
        var t = this._items[e], r = (new Date).getTime();
        return t && t.t >= r - this.maxAge ? t.v : void 0
      }, set: function (e, t) {
        this._items[e] = {v: t, t: (new Date).getTime()};
      }
    };
    var P = function (e, t) {
      if (a(this, "connected", "not-connected"), this.rs = e, this.clientId = t, this._fileIdCache = new w(300), o = u.localStorageAvailable()) {
        var r = p(l);
        r && this.configure(r);
      }
    };
    P.prototype = {
      connected: !1, online: !0, configure: function (e) {
        var t = this;
        void 0 !== e.userAddress && (this.userAddress = e.userAddress), void 0 !== e.token && (this.token = e.token);
        var r = function () {
          o && localStorage.setItem(l, JSON.stringify({userAddress: this.userAddress, token: this.token}));
        }, n = function () {
          this.connected = !1, delete this.token, o && localStorage.removeItem(l);
        };
        this.token ? (this.connected = !0, this.userAddress ? (this._emit("connected"), r.apply(this)) : this.info().then((function (e) {
          t.userAddress = e.user.emailAddress, t._emit("connected"), r.apply(t);
        })).catch((function () {
          n.apply(t), t.rs._emit("error", new Error("Could not fetch user info."));
        }))) : n.apply(this);
      }, connect: function () {
        this.rs.setBackend("googledrive"), this.rs.authorize({
          authURL: "https://accounts.google.com/o/oauth2/auth",
          scope: "https://www.googleapis.com/auth/drive",
          clientId: this.clientId
        });
      }, stopWaitingForToken: function () {
        this.connected || this._emit("not-connected");
      }, get: function (e, t) {
        return "/" === e.substr(-1) ? this._getFolder(b(e), t) : this._getFile(b(e), t)
      }, put: function (e, t, r, n) {
        var o = this, i = b(e);

        function s(e) {
          if (e.status >= 200 && e.status < 300) {
            var t = JSON.parse(e.responseText), r = _(t.etag);
            return Promise.resolve({statusCode: 200, contentType: t.mimeType, revision: r})
          }
          return 412 === e.status ? Promise.resolve({
            statusCode: 412,
            revision: "conflict"
          }) : Promise.reject("PUT failed with status " + e.status + " (" + e.responseText + ")")
        }

        return this._getFileId(i).then((function (e) {
          return e ? n && "*" === n.ifNoneMatch ? s({status: 412}) : o._updateFile(e, i, t, r, n).then(s) : o._createFile(i, t, r, n).then(s)
        }))
      }, delete: function (e, t) {
        var r = this, o = b(e);
        return this._getFileId(o).then((function (e) {
          return e ? r._getMeta(e).then((function (o) {
            var i;
            return "object" === n(o) && "string" == typeof o.etag && (i = _(o.etag)), t && t.ifMatch && t.ifMatch !== i ? {
              statusCode: 412,
              revision: i
            } : r._request("DELETE", c + "/drive/v2/files/" + e, {}).then((function (e) {
              return 200 === e.status || 204 === e.status ? {statusCode: 200} : Promise.reject("Delete failed: " + e.status + " (" + e.responseText + ")")
            }))
          })) : Promise.resolve({statusCode: 200})
        }))
      }, info: function () {
        return this._request("GET", "https://www.googleapis.com/drive/v2/about?fields=user", {}).then((function (e) {
          try {
            var t = JSON.parse(e.responseText);
            return Promise.resolve(t)
          } catch (e) {
            return Promise.reject(e)
          }
        }))
      }, _updateFile: function (e, t, r, n, o) {
        var i = this, s = {mimeType: n}, a = {"Content-Type": "application/json; charset=UTF-8"};
        return o && o.ifMatch && (a["If-Match"] = '"' + o.ifMatch + '"'), this._request("PUT", c + "/upload/drive/v2/files/" + e + "?uploadType=resumable", {
          body: JSON.stringify(s),
          headers: a
        }).then((function (e) {
          return 412 === e.status ? e : i._request("PUT", e.getResponseHeader("Location"), {body: n.match(/^application\/json/) ? JSON.stringify(r) : r})
        }))
      }, _createFile: function (e, t, r) {
        var n = this;
        return this._getParentId(e).then((function (o) {
          var i = {title: y(v(e)), mimeType: r, parents: [{kind: "drive#fileLink", id: o}]};
          return n._request("POST", c + "/upload/drive/v2/files?uploadType=resumable", {
            body: JSON.stringify(i),
            headers: {"Content-Type": "application/json; charset=UTF-8"}
          }).then((function (e) {
            return n._request("POST", e.getResponseHeader("Location"), {body: r.match(/^application\/json/) ? JSON.stringify(t) : t})
          }))
        }))
      }, _getFile: function (e, t) {
        var r = this;
        return this._getFileId(e).then((function (e) {
          return r._getMeta(e).then((function (e) {
            var o;
            if ("object" === n(e) && "string" == typeof e.etag && (o = _(e.etag)), t && t.ifNoneMatch && o === t.ifNoneMatch) return Promise.resolve({statusCode: 304});
            if (!e.downloadUrl) {
              if (!e.exportLinks || !e.exportLinks["text/html"]) return Promise.resolve({
                statusCode: 200,
                body: "",
                contentType: e.mimeType,
                revision: o
              });
              e.mimeType += ";export=text/html", e.downloadUrl = e.exportLinks["text/html"];
            }
            return r._request("GET", e.downloadUrl, {responseType: "arraybuffer"}).then((function (t) {
              return m(t.response, "UTF-8").then((function (r) {
                var n = r;
                if (e.mimeType.match(/^application\/json/)) try {
                  n = JSON.parse(n);
                } catch (e) {
                } else d(r, e.mimeType) && (n = t.response);
                return {statusCode: 200, body: n, contentType: e.mimeType, revision: o}
              }))
            }))
          }))
        }))
      }, _getFolder: function (e) {
        var t = this;
        return this._getFileId(e).then((function (r) {
          var n, o, i, s;
          return r ? (n = "'" + r + "' in parents", t._request("GET", c + "/drive/v2/files?q=" + encodeURIComponent(n) + "&fields=" + encodeURIComponent("items(downloadUrl,etag,fileSize,id,mimeType,title)") + "&maxResults=1000", {}).then((function (r) {
            if (200 !== r.status) return Promise.reject("request failed or something: " + r.status);
            try {
              o = JSON.parse(r.responseText);
            } catch (e) {
              return Promise.reject("non-JSON response from GoogleDrive")
            }
            s = {};
            var n = !0, a = !1, u = void 0;
            try {
              for (var c, l = o.items[Symbol.iterator](); !(n = (c = l.next()).done); n = !0) {
                var h = c.value;
                i = _(h.etag), "application/vnd.google-apps.folder" === h.mimeType ? (t._fileIdCache.set(e + h.title + "/", h.id), s[h.title + "/"] = {ETag: i}) : (t._fileIdCache.set(e + h.title, h.id), s[h.title] = {
                  ETag: i,
                  "Content-Type": h.mimeType,
                  "Content-Length": h.fileSize
                });
              }
            } catch (e) {
              a = !0, u = e;
            } finally {
              try {
                n || null == l.return || l.return();
              } finally {
                if (a) throw u
              }
            }
            return Promise.resolve({
              statusCode: 200,
              body: s,
              contentType: "application/json; charset=UTF-8",
              revision: void 0
            })
          }))) : Promise.resolve({statusCode: 404})
        }))
      }, _getParentId: function (e) {
        var t = this, r = g(e);
        return this._getFileId(r).then((function (e) {
          return e ? Promise.resolve(e) : t._createFolder(r)
        }))
      }, _createFolder: function (e) {
        var t = this;
        return this._getParentId(e).then((function (r) {
          return t._request("POST", c + "/drive/v2/files", {
            body: JSON.stringify({
              title: y(v(e)),
              mimeType: "application/vnd.google-apps.folder",
              parents: [{id: r}]
            }), headers: {"Content-Type": "application/json; charset=UTF-8"}
          }).then((function (e) {
            var t = JSON.parse(e.responseText);
            return Promise.resolve(t.id)
          }))
        }))
      }, _getFileId: function (e) {
        var t, r = this;
        return "/" === e ? Promise.resolve("root") : (t = this._fileIdCache.get(e)) ? Promise.resolve(t) : this._getFolder(g(e)).then((function () {
          return (t = r._fileIdCache.get(e)) ? Promise.resolve(t) : "/" === e.substr(-1) ? r._createFolder(e).then((function () {
            return r._getFileId(e)
          })) : Promise.resolve()
        }))
      }, _getMeta: function (e) {
        return this._request("GET", c + "/drive/v2/files/" + e, {}).then((function (t) {
          return 200 === t.status ? Promise.resolve(JSON.parse(t.responseText)) : Promise.reject("request (getting metadata for " + e + ") failed with status: " + t.status)
        }))
      }, _request: function (e, t, r) {
        var n = this;
        return r.headers || (r.headers = {}), r.headers.Authorization = "Bearer " + this.token, this.rs._emit("wire-busy", {
          method: e,
          isFolder: h(t)
        }), s.request.call(this, e, t, r).then((function (r) {
          return r && 401 === r.status ? void n.connect() : (n.online || (n.online = !0, n.rs._emit("network-online")), n.rs._emit("wire-done", {
            method: e,
            isFolder: h(t),
            success: !0
          }), Promise.resolve(r))
        }), (function (r) {
          return n.online && (n.online = !1, n.rs._emit("network-offline")), n.rs._emit("wire-done", {
            method: e,
            isFolder: h(t),
            success: !1
          }), Promise.reject(r)
        }))
      }
    }, P._rs_init = function (e) {
      var t, r = e.apiKeys.googledrive;
      r && (e.googledrive = new P(e, r.clientId), "googledrive" === e.backend && (e._origRemote = e.remote, e.remote = e.googledrive, (t = e)._origBaseClientGetItemURL || (t._origBaseClientGetItemURL = i.prototype.getItemURL, i.prototype.getItemURL = function () {
        throw new Error("getItemURL is not implemented for Google Drive yet")
      })));
    }, P._rs_supported = function () {
      return !0
    }, P._rs_cleanup = function (e) {
      var t;
      e.setBackend(void 0), e._origRemote && (e.remote = e._origRemote, delete e._origRemote), (t = e)._origBaseClientGetItemURL && (i.prototype.getItemURL = t._origBaseClientGetItemURL, delete t._origBaseClientGetItemURL);
    }, e.exports = P;
  }, function (e, t, r) {

    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o, i = r(1), s = r(0), a = r(25), u = {}, c = function (e) {
      return new Promise((function (t, r) {
        return e in u ? t(u[e]) : new a({
          tls_only: !1,
          uri_fallback: !0,
          request_timeout: 5e3
        }).lookup(e, (function (s, a) {
          if (s) return r(s);
          if ("object" !== n(a.idx.links.remotestorage) || "number" != typeof a.idx.links.remotestorage.length || a.idx.links.remotestorage.length <= 0) return i("[Discover] WebFinger record for " + e + " does not have remotestorage defined in the links section ", JSON.stringify(a.json)), r("WebFinger record for " + e + " does not have remotestorage defined in the links section.");
          var c = a.idx.links.remotestorage[0],
            l = c.properties["http://tools.ietf.org/html/rfc6749#section-4.2"] || c.properties["auth-endpoint"],
            h = c.properties["http://remotestorage.io/spec/version"] || c.type;
          return u[e] = {
            href: c.href,
            storageApi: h,
            authURL: l,
            properties: c.properties
          }, o && (localStorage["remotestorage:discover"] = JSON.stringify({cache: u})), t(u[e])
        }))
      }))
    };
    (c.DiscoveryError = function (e) {
      this.name = "DiscoveryError", this.message = e, this.stack = (new Error).stack;
    }).prototype = Object.create(Error.prototype), c.DiscoveryError.prototype.constructor = c.DiscoveryError, c._rs_init = function () {
      if (o = s.localStorageAvailable()) {
        var e;
        try {
          e = JSON.parse(localStorage["remotestorage:discover"]);
        } catch (e) {
        }
        e && (u = e.cache);
      }
    }, c._rs_supported = function () {
      return !!s.globalContext.XMLHttpRequest
    }, c._rs_cleanup = function () {
      o && delete localStorage["remotestorage:discover"];
    }, e.exports = c;
  }, function (e, t) {
    var r = function () {
      this.reset();
    };
    r.prototype = {
      claim: function (e, t) {
        if ("string" != typeof e || -1 !== e.indexOf("/") || 0 === e.length) throw new Error("Scope should be a non-empty string without forward slashes");
        if (!t.match(/^rw?$/)) throw new Error("Mode should be either 'r' or 'rw'");
        this._adjustRootPaths(e), this.scopeModeMap[e] = t;
      }, get: function (e) {
        return this.scopeModeMap[e]
      }, remove: function (e) {
        var t, r = {};
        for (t in this.scopeModeMap) r[t] = this.scopeModeMap[t];
        for (t in this.reset(), delete r[e], r) this.set(t, r[t]);
      }, checkPermission: function (e, t) {
        var r = this.get(e);
        return r && ("r" === t || "rw" === r)
      }, checkPathPermission: function (e, t) {
        return !!this.checkPermission("*", t) || !!this.checkPermission(this._getModuleName(e), t)
      }, reset: function () {
        this.rootPaths = [], this.scopeModeMap = {};
      }, _getModuleName: function (e) {
        if ("/" !== e[0]) throw new Error("Path should start with a slash");
        var t = e.replace(/^\/public/, "").match(/^\/([^/]*)\//);
        return t ? t[1] : "*"
      }, _adjustRootPaths: function (e) {
        "*" in this.scopeModeMap || "*" === e ? this.rootPaths = ["/"] : e in this.scopeModeMap || (this.rootPaths.push("/" + e + "/"), this.rootPaths.push("/public/" + e + "/"));
      }, _scopeNameForParameter: function (e) {
        if ("*" === e.name && this.storageType) {
          if ("2012.04" === this.storageType) return "";
          if (this.storageType.match(/remotestorage-0[01]/)) return "root"
        }
        return e.name
      }, setStorageType: function (e) {
        this.storageType = e;
      }
    }, Object.defineProperty(r.prototype, "scopes", {
      get: function () {
        return Object.keys(this.scopeModeMap).map(function (e) {
          return {name: e, mode: this.scopeModeMap[e]}
        }.bind(this))
      }
    }), Object.defineProperty(r.prototype, "scopeParameter", {
      get: function () {
        return this.scopes.map(function (e) {
          return this._scopeNameForParameter(e) + ":" + e.mode
        }.bind(this)).join(" ")
      }
    }), r._rs_init = function () {
    }, e.exports = r;
  }, function (e, t, r) {
    var n = r(0), o = r(1), i = n.containingFolder, s = function () {
      this.reset();
    };
    s.prototype = {
      pendingActivations: [], set: function (e, t) {
        if ("string" != typeof e) throw new Error("path should be a string");
        if (!n.isFolder(e)) throw new Error("path should be a folder");
        if (this._remoteStorage && this._remoteStorage.access && !this._remoteStorage.access.checkPathPermission(e, "r")) throw new Error('No access to path "' + e + '". You have to claim access to it first.');
        if (!t.match(/^(FLUSH|SEEN|ALL)$/)) throw new Error("strategy should be 'FLUSH', 'SEEN', or 'ALL'");
        this._rootPaths[e] = t, "ALL" === t && (this.activateHandler ? this.activateHandler(e) : this.pendingActivations.push(e));
      }, enable: function (e) {
        this.set(e, "ALL");
      }, disable: function (e) {
        this.set(e, "FLUSH");
      }, onActivate: function (e) {
        var t;
        for (o("[Caching] Setting activate handler", e, this.pendingActivations), this.activateHandler = e, t = 0; t < this.pendingActivations.length; t++) e(this.pendingActivations[t]);
        delete this.pendingActivations;
      }, checkPath: function (e) {
        return void 0 !== this._rootPaths[e] ? this._rootPaths[e] : "/" === e ? "SEEN" : this.checkPath(i(e))
      }, reset: function () {
        this._rootPaths = {}, this._remoteStorage = null;
      }
    }, s._rs_init = function (e) {
      this._remoteStorage = e;
    }, e.exports = s;
  }, function (e, t, r) {
    e.exports = r(9);
  }, function (e, t, r) {
    (function (e) {

      /*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <http://feross.org>
 * @license  MIT
 */
      var n = r(19), o = r(20), i = r(21);

      function s() {
        return u.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823
      }

      function a(e, t) {
        if (s() < t) throw new RangeError("Invalid typed array length");
        return u.TYPED_ARRAY_SUPPORT ? (e = new Uint8Array(t)).__proto__ = u.prototype : (null === e && (e = new u(t)), e.length = t), e
      }

      function u(e, t, r) {
        if (!(u.TYPED_ARRAY_SUPPORT || this instanceof u)) return new u(e, t, r);
        if ("number" == typeof e) {
          if ("string" == typeof t) throw new Error("If encoding is specified then the first argument must be a string");
          return h(this, e)
        }
        return c(this, e, t, r)
      }

      function c(e, t, r, n) {
        if ("number" == typeof t) throw new TypeError('"value" argument must not be a number');
        return "undefined" != typeof ArrayBuffer && t instanceof ArrayBuffer ? function (e, t, r, n) {
          if (t.byteLength, r < 0 || t.byteLength < r) throw new RangeError("'offset' is out of bounds");
          if (t.byteLength < r + (n || 0)) throw new RangeError("'length' is out of bounds");
          t = void 0 === r && void 0 === n ? new Uint8Array(t) : void 0 === n ? new Uint8Array(t, r) : new Uint8Array(t, r, n);
          u.TYPED_ARRAY_SUPPORT ? (e = t).__proto__ = u.prototype : e = f(e, t);
          return e
        }(e, t, r, n) : "string" == typeof t ? function (e, t, r) {
          "string" == typeof r && "" !== r || (r = "utf8");
          if (!u.isEncoding(r)) throw new TypeError('"encoding" must be a valid string encoding');
          var n = 0 | p(t, r), o = (e = a(e, n)).write(t, r);
          o !== n && (e = e.slice(0, o));
          return e
        }(e, t, r) : function (e, t) {
          if (u.isBuffer(t)) {
            var r = 0 | d(t.length);
            return 0 === (e = a(e, r)).length ? e : (t.copy(e, 0, 0, r), e)
          }
          if (t) {
            if ("undefined" != typeof ArrayBuffer && t.buffer instanceof ArrayBuffer || "length" in t) return "number" != typeof t.length || (n = t.length) != n ? a(e, 0) : f(e, t);
            if ("Buffer" === t.type && i(t.data)) return f(e, t.data)
          }
          var n;
          throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")
        }(e, t)
      }

      function l(e) {
        if ("number" != typeof e) throw new TypeError('"size" argument must be a number');
        if (e < 0) throw new RangeError('"size" argument must not be negative')
      }

      function h(e, t) {
        if (l(t), e = a(e, t < 0 ? 0 : 0 | d(t)), !u.TYPED_ARRAY_SUPPORT) for (var r = 0; r < t; ++r) e[r] = 0;
        return e
      }

      function f(e, t) {
        var r = t.length < 0 ? 0 : 0 | d(t.length);
        e = a(e, r);
        for (var n = 0; n < r; n += 1) e[n] = 255 & t[n];
        return e
      }

      function d(e) {
        if (e >= s()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + s().toString(16) + " bytes");
        return 0 | e
      }

      function p(e, t) {
        if (u.isBuffer(e)) return e.length;
        if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(e) || e instanceof ArrayBuffer)) return e.byteLength;
        "string" != typeof e && (e = "" + e);
        var r = e.length;
        if (0 === r) return 0;
        for (var n = !1; ;) switch (t) {
          case"ascii":
          case"latin1":
          case"binary":
            return r;
          case"utf8":
          case"utf-8":
          case void 0:
            return B(e).length;
          case"ucs2":
          case"ucs-2":
          case"utf16le":
          case"utf-16le":
            return 2 * r;
          case"hex":
            return r >>> 1;
          case"base64":
            return q(e).length;
          default:
            if (n) return B(e).length;
            t = ("" + t).toLowerCase(), n = !0;
        }
      }

      function m(e, t, r) {
        var n = !1;
        if ((void 0 === t || t < 0) && (t = 0), t > this.length) return "";
        if ((void 0 === r || r > this.length) && (r = this.length), r <= 0) return "";
        if ((r >>>= 0) <= (t >>>= 0)) return "";
        for (e || (e = "utf8"); ;) switch (e) {
          case"hex":
            return O(this, t, r);
          case"utf8":
          case"utf-8":
            return A(this, t, r);
          case"ascii":
            return R(this, t, r);
          case"latin1":
          case"binary":
            return k(this, t, r);
          case"base64":
            return T(this, t, r);
          case"ucs2":
          case"ucs-2":
          case"utf16le":
          case"utf-16le":
            return I(this, t, r);
          default:
            if (n) throw new TypeError("Unknown encoding: " + e);
            e = (e + "").toLowerCase(), n = !0;
        }
      }

      function y(e, t, r) {
        var n = e[t];
        e[t] = e[r], e[r] = n;
      }

      function g(e, t, r, n, o) {
        if (0 === e.length) return -1;
        if ("string" == typeof r ? (n = r, r = 0) : r > 2147483647 ? r = 2147483647 : r < -2147483648 && (r = -2147483648), r = +r, isNaN(r) && (r = o ? 0 : e.length - 1), r < 0 && (r = e.length + r), r >= e.length) {
          if (o) return -1;
          r = e.length - 1;
        } else if (r < 0) {
          if (!o) return -1;
          r = 0;
        }
        if ("string" == typeof t && (t = u.from(t, n)), u.isBuffer(t)) return 0 === t.length ? -1 : v(e, t, r, n, o);
        if ("number" == typeof t) return t &= 255, u.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? o ? Uint8Array.prototype.indexOf.call(e, t, r) : Uint8Array.prototype.lastIndexOf.call(e, t, r) : v(e, [t], r, n, o);
        throw new TypeError("val must be string, number or Buffer")
      }

      function v(e, t, r, n, o) {
        var i, s = 1, a = e.length, u = t.length;
        if (void 0 !== n && ("ucs2" === (n = String(n).toLowerCase()) || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
          if (e.length < 2 || t.length < 2) return -1;
          s = 2, a /= 2, u /= 2, r /= 2;
        }

        function c(e, t) {
          return 1 === s ? e[t] : e.readUInt16BE(t * s)
        }

        if (o) {
          var l = -1;
          for (i = r; i < a; i++) if (c(e, i) === c(t, -1 === l ? 0 : i - l)) {
            if (-1 === l && (l = i), i - l + 1 === u) return l * s
          } else -1 !== l && (i -= i - l), l = -1;
        } else for (r + u > a && (r = a - u), i = r; i >= 0; i--) {
          for (var h = !0, f = 0; f < u; f++) if (c(e, i + f) !== c(t, f)) {
            h = !1;
            break
          }
          if (h) return i
        }
        return -1
      }

      function b(e, t, r, n) {
        r = Number(r) || 0;
        var o = e.length - r;
        n ? (n = Number(n)) > o && (n = o) : n = o;
        var i = t.length;
        if (i % 2 != 0) throw new TypeError("Invalid hex string");
        n > i / 2 && (n = i / 2);
        for (var s = 0; s < n; ++s) {
          var a = parseInt(t.substr(2 * s, 2), 16);
          if (isNaN(a)) return s;
          e[r + s] = a;
        }
        return s
      }

      function _(e, t, r, n) {
        return J(B(t, e.length - r), e, r, n)
      }

      function w(e, t, r, n) {
        return J(function (e) {
          for (var t = [], r = 0; r < e.length; ++r) t.push(255 & e.charCodeAt(r));
          return t
        }(t), e, r, n)
      }

      function P(e, t, r, n) {
        return w(e, t, r, n)
      }

      function E(e, t, r, n) {
        return J(q(t), e, r, n)
      }

      function S(e, t, r, n) {
        return J(function (e, t) {
          for (var r, n, o, i = [], s = 0; s < e.length && !((t -= 2) < 0); ++s) r = e.charCodeAt(s), n = r >> 8, o = r % 256, i.push(o), i.push(n);
          return i
        }(t, e.length - r), e, r, n)
      }

      function T(e, t, r) {
        return 0 === t && r === e.length ? n.fromByteArray(e) : n.fromByteArray(e.slice(t, r))
      }

      function A(e, t, r) {
        r = Math.min(e.length, r);
        for (var n = [], o = t; o < r;) {
          var i, s, a, u, c = e[o], l = null, h = c > 239 ? 4 : c > 223 ? 3 : c > 191 ? 2 : 1;
          if (o + h <= r) switch (h) {
            case 1:
              c < 128 && (l = c);
              break;
            case 2:
              128 == (192 & (i = e[o + 1])) && (u = (31 & c) << 6 | 63 & i) > 127 && (l = u);
              break;
            case 3:
              i = e[o + 1], s = e[o + 2], 128 == (192 & i) && 128 == (192 & s) && (u = (15 & c) << 12 | (63 & i) << 6 | 63 & s) > 2047 && (u < 55296 || u > 57343) && (l = u);
              break;
            case 4:
              i = e[o + 1], s = e[o + 2], a = e[o + 3], 128 == (192 & i) && 128 == (192 & s) && 128 == (192 & a) && (u = (15 & c) << 18 | (63 & i) << 12 | (63 & s) << 6 | 63 & a) > 65535 && u < 1114112 && (l = u);
          }
          null === l ? (l = 65533, h = 1) : l > 65535 && (l -= 65536, n.push(l >>> 10 & 1023 | 55296), l = 56320 | 1023 & l), n.push(l), o += h;
        }
        return function (e) {
          var t = e.length;
          if (t <= 4096) return String.fromCharCode.apply(String, e);
          var r = "", n = 0;
          for (; n < t;) r += String.fromCharCode.apply(String, e.slice(n, n += 4096));
          return r
        }(n)
      }

      t.Buffer = u, t.SlowBuffer = function (e) {
        +e != e && (e = 0);
        return u.alloc(+e)
      }, t.INSPECT_MAX_BYTES = 50, u.TYPED_ARRAY_SUPPORT = void 0 !== e.TYPED_ARRAY_SUPPORT ? e.TYPED_ARRAY_SUPPORT : function () {
        try {
          var e = new Uint8Array(1);
          return e.__proto__ = {
            __proto__: Uint8Array.prototype, foo: function () {
              return 42
            }
          }, 42 === e.foo() && "function" == typeof e.subarray && 0 === e.subarray(1, 1).byteLength
        } catch (e) {
          return !1
        }
      }(), t.kMaxLength = s(), u.poolSize = 8192, u._augment = function (e) {
        return e.__proto__ = u.prototype, e
      }, u.from = function (e, t, r) {
        return c(null, e, t, r)
      }, u.TYPED_ARRAY_SUPPORT && (u.prototype.__proto__ = Uint8Array.prototype, u.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && u[Symbol.species] === u && Object.defineProperty(u, Symbol.species, {
        value: null,
        configurable: !0
      })), u.alloc = function (e, t, r) {
        return function (e, t, r, n) {
          return l(t), t <= 0 ? a(e, t) : void 0 !== r ? "string" == typeof n ? a(e, t).fill(r, n) : a(e, t).fill(r) : a(e, t)
        }(null, e, t, r)
      }, u.allocUnsafe = function (e) {
        return h(null, e)
      }, u.allocUnsafeSlow = function (e) {
        return h(null, e)
      }, u.isBuffer = function (e) {
        return !(null == e || !e._isBuffer)
      }, u.compare = function (e, t) {
        if (!u.isBuffer(e) || !u.isBuffer(t)) throw new TypeError("Arguments must be Buffers");
        if (e === t) return 0;
        for (var r = e.length, n = t.length, o = 0, i = Math.min(r, n); o < i; ++o) if (e[o] !== t[o]) {
          r = e[o], n = t[o];
          break
        }
        return r < n ? -1 : n < r ? 1 : 0
      }, u.isEncoding = function (e) {
        switch (String(e).toLowerCase()) {
          case"hex":
          case"utf8":
          case"utf-8":
          case"ascii":
          case"latin1":
          case"binary":
          case"base64":
          case"ucs2":
          case"ucs-2":
          case"utf16le":
          case"utf-16le":
            return !0;
          default:
            return !1
        }
      }, u.concat = function (e, t) {
        if (!i(e)) throw new TypeError('"list" argument must be an Array of Buffers');
        if (0 === e.length) return u.alloc(0);
        var r;
        if (void 0 === t) for (t = 0, r = 0; r < e.length; ++r) t += e[r].length;
        var n = u.allocUnsafe(t), o = 0;
        for (r = 0; r < e.length; ++r) {
          var s = e[r];
          if (!u.isBuffer(s)) throw new TypeError('"list" argument must be an Array of Buffers');
          s.copy(n, o), o += s.length;
        }
        return n
      }, u.byteLength = p, u.prototype._isBuffer = !0, u.prototype.swap16 = function () {
        var e = this.length;
        if (e % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
        for (var t = 0; t < e; t += 2) y(this, t, t + 1);
        return this
      }, u.prototype.swap32 = function () {
        var e = this.length;
        if (e % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
        for (var t = 0; t < e; t += 4) y(this, t, t + 3), y(this, t + 1, t + 2);
        return this
      }, u.prototype.swap64 = function () {
        var e = this.length;
        if (e % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
        for (var t = 0; t < e; t += 8) y(this, t, t + 7), y(this, t + 1, t + 6), y(this, t + 2, t + 5), y(this, t + 3, t + 4);
        return this
      }, u.prototype.toString = function () {
        var e = 0 | this.length;
        return 0 === e ? "" : 0 === arguments.length ? A(this, 0, e) : m.apply(this, arguments)
      }, u.prototype.equals = function (e) {
        if (!u.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
        return this === e || 0 === u.compare(this, e)
      }, u.prototype.inspect = function () {
        var e = "", r = t.INSPECT_MAX_BYTES;
        return this.length > 0 && (e = this.toString("hex", 0, r).match(/.{2}/g).join(" "), this.length > r && (e += " ... ")), "<Buffer " + e + ">"
      }, u.prototype.compare = function (e, t, r, n, o) {
        if (!u.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
        if (void 0 === t && (t = 0), void 0 === r && (r = e ? e.length : 0), void 0 === n && (n = 0), void 0 === o && (o = this.length), t < 0 || r > e.length || n < 0 || o > this.length) throw new RangeError("out of range index");
        if (n >= o && t >= r) return 0;
        if (n >= o) return -1;
        if (t >= r) return 1;
        if (this === e) return 0;
        for (var i = (o >>>= 0) - (n >>>= 0), s = (r >>>= 0) - (t >>>= 0), a = Math.min(i, s), c = this.slice(n, o), l = e.slice(t, r), h = 0; h < a; ++h) if (c[h] !== l[h]) {
          i = c[h], s = l[h];
          break
        }
        return i < s ? -1 : s < i ? 1 : 0
      }, u.prototype.includes = function (e, t, r) {
        return -1 !== this.indexOf(e, t, r)
      }, u.prototype.indexOf = function (e, t, r) {
        return g(this, e, t, r, !0)
      }, u.prototype.lastIndexOf = function (e, t, r) {
        return g(this, e, t, r, !1)
      }, u.prototype.write = function (e, t, r, n) {
        if (void 0 === t) n = "utf8", r = this.length, t = 0; else if (void 0 === r && "string" == typeof t) n = t, r = this.length, t = 0; else {
          if (!isFinite(t)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
          t |= 0, isFinite(r) ? (r |= 0, void 0 === n && (n = "utf8")) : (n = r, r = void 0);
        }
        var o = this.length - t;
        if ((void 0 === r || r > o) && (r = o), e.length > 0 && (r < 0 || t < 0) || t > this.length) throw new RangeError("Attempt to write outside buffer bounds");
        n || (n = "utf8");
        for (var i = !1; ;) switch (n) {
          case"hex":
            return b(this, e, t, r);
          case"utf8":
          case"utf-8":
            return _(this, e, t, r);
          case"ascii":
            return w(this, e, t, r);
          case"latin1":
          case"binary":
            return P(this, e, t, r);
          case"base64":
            return E(this, e, t, r);
          case"ucs2":
          case"ucs-2":
          case"utf16le":
          case"utf-16le":
            return S(this, e, t, r);
          default:
            if (i) throw new TypeError("Unknown encoding: " + n);
            n = ("" + n).toLowerCase(), i = !0;
        }
      }, u.prototype.toJSON = function () {
        return {type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0)}
      };

      function R(e, t, r) {
        var n = "";
        r = Math.min(e.length, r);
        for (var o = t; o < r; ++o) n += String.fromCharCode(127 & e[o]);
        return n
      }

      function k(e, t, r) {
        var n = "";
        r = Math.min(e.length, r);
        for (var o = t; o < r; ++o) n += String.fromCharCode(e[o]);
        return n
      }

      function O(e, t, r) {
        var n = e.length;
        (!t || t < 0) && (t = 0), (!r || r < 0 || r > n) && (r = n);
        for (var o = "", i = t; i < r; ++i) o += F(e[i]);
        return o
      }

      function I(e, t, r) {
        for (var n = e.slice(t, r), o = "", i = 0; i < n.length; i += 2) o += String.fromCharCode(n[i] + 256 * n[i + 1]);
        return o
      }

      function C(e, t, r) {
        if (e % 1 != 0 || e < 0) throw new RangeError("offset is not uint");
        if (e + t > r) throw new RangeError("Trying to access beyond buffer length")
      }

      function M(e, t, r, n, o, i) {
        if (!u.isBuffer(e)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (t > o || t < i) throw new RangeError('"value" argument is out of bounds');
        if (r + n > e.length) throw new RangeError("Index out of range")
      }

      function N(e, t, r, n) {
        t < 0 && (t = 65535 + t + 1);
        for (var o = 0, i = Math.min(e.length - r, 2); o < i; ++o) e[r + o] = (t & 255 << 8 * (n ? o : 1 - o)) >>> 8 * (n ? o : 1 - o);
      }

      function x(e, t, r, n) {
        t < 0 && (t = 4294967295 + t + 1);
        for (var o = 0, i = Math.min(e.length - r, 4); o < i; ++o) e[r + o] = t >>> 8 * (n ? o : 3 - o) & 255;
      }

      function U(e, t, r, n, o, i) {
        if (r + n > e.length) throw new RangeError("Index out of range");
        if (r < 0) throw new RangeError("Index out of range")
      }

      function j(e, t, r, n, i) {
        return i || U(e, 0, r, 4), o.write(e, t, r, n, 23, 4), r + 4
      }

      function L(e, t, r, n, i) {
        return i || U(e, 0, r, 8), o.write(e, t, r, n, 52, 8), r + 8
      }

      u.prototype.slice = function (e, t) {
        var r, n = this.length;
        if ((e = ~~e) < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n), (t = void 0 === t ? n : ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), t < e && (t = e), u.TYPED_ARRAY_SUPPORT) (r = this.subarray(e, t)).__proto__ = u.prototype; else {
          var o = t - e;
          r = new u(o, void 0);
          for (var i = 0; i < o; ++i) r[i] = this[i + e];
        }
        return r
      }, u.prototype.readUIntLE = function (e, t, r) {
        e |= 0, t |= 0, r || C(e, t, this.length);
        for (var n = this[e], o = 1, i = 0; ++i < t && (o *= 256);) n += this[e + i] * o;
        return n
      }, u.prototype.readUIntBE = function (e, t, r) {
        e |= 0, t |= 0, r || C(e, t, this.length);
        for (var n = this[e + --t], o = 1; t > 0 && (o *= 256);) n += this[e + --t] * o;
        return n
      }, u.prototype.readUInt8 = function (e, t) {
        return t || C(e, 1, this.length), this[e]
      }, u.prototype.readUInt16LE = function (e, t) {
        return t || C(e, 2, this.length), this[e] | this[e + 1] << 8
      }, u.prototype.readUInt16BE = function (e, t) {
        return t || C(e, 2, this.length), this[e] << 8 | this[e + 1]
      }, u.prototype.readUInt32LE = function (e, t) {
        return t || C(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + 16777216 * this[e + 3]
      }, u.prototype.readUInt32BE = function (e, t) {
        return t || C(e, 4, this.length), 16777216 * this[e] + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3])
      }, u.prototype.readIntLE = function (e, t, r) {
        e |= 0, t |= 0, r || C(e, t, this.length);
        for (var n = this[e], o = 1, i = 0; ++i < t && (o *= 256);) n += this[e + i] * o;
        return n >= (o *= 128) && (n -= Math.pow(2, 8 * t)), n
      }, u.prototype.readIntBE = function (e, t, r) {
        e |= 0, t |= 0, r || C(e, t, this.length);
        for (var n = t, o = 1, i = this[e + --n]; n > 0 && (o *= 256);) i += this[e + --n] * o;
        return i >= (o *= 128) && (i -= Math.pow(2, 8 * t)), i
      }, u.prototype.readInt8 = function (e, t) {
        return t || C(e, 1, this.length), 128 & this[e] ? -1 * (255 - this[e] + 1) : this[e]
      }, u.prototype.readInt16LE = function (e, t) {
        t || C(e, 2, this.length);
        var r = this[e] | this[e + 1] << 8;
        return 32768 & r ? 4294901760 | r : r
      }, u.prototype.readInt16BE = function (e, t) {
        t || C(e, 2, this.length);
        var r = this[e + 1] | this[e] << 8;
        return 32768 & r ? 4294901760 | r : r
      }, u.prototype.readInt32LE = function (e, t) {
        return t || C(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24
      }, u.prototype.readInt32BE = function (e, t) {
        return t || C(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]
      }, u.prototype.readFloatLE = function (e, t) {
        return t || C(e, 4, this.length), o.read(this, e, !0, 23, 4)
      }, u.prototype.readFloatBE = function (e, t) {
        return t || C(e, 4, this.length), o.read(this, e, !1, 23, 4)
      }, u.prototype.readDoubleLE = function (e, t) {
        return t || C(e, 8, this.length), o.read(this, e, !0, 52, 8)
      }, u.prototype.readDoubleBE = function (e, t) {
        return t || C(e, 8, this.length), o.read(this, e, !1, 52, 8)
      }, u.prototype.writeUIntLE = function (e, t, r, n) {
        (e = +e, t |= 0, r |= 0, n) || M(this, e, t, r, Math.pow(2, 8 * r) - 1, 0);
        var o = 1, i = 0;
        for (this[t] = 255 & e; ++i < r && (o *= 256);) this[t + i] = e / o & 255;
        return t + r
      }, u.prototype.writeUIntBE = function (e, t, r, n) {
        (e = +e, t |= 0, r |= 0, n) || M(this, e, t, r, Math.pow(2, 8 * r) - 1, 0);
        var o = r - 1, i = 1;
        for (this[t + o] = 255 & e; --o >= 0 && (i *= 256);) this[t + o] = e / i & 255;
        return t + r
      }, u.prototype.writeUInt8 = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 1, 255, 0), u.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), this[t] = 255 & e, t + 1
      }, u.prototype.writeUInt16LE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 2, 65535, 0), u.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8) : N(this, e, t, !0), t + 2
      }, u.prototype.writeUInt16BE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 2, 65535, 0), u.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, this[t + 1] = 255 & e) : N(this, e, t, !1), t + 2
      }, u.prototype.writeUInt32LE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 4, 4294967295, 0), u.TYPED_ARRAY_SUPPORT ? (this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = 255 & e) : x(this, e, t, !0), t + 4
      }, u.prototype.writeUInt32BE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 4, 4294967295, 0), u.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = 255 & e) : x(this, e, t, !1), t + 4
      }, u.prototype.writeIntLE = function (e, t, r, n) {
        if (e = +e, t |= 0, !n) {
          var o = Math.pow(2, 8 * r - 1);
          M(this, e, t, r, o - 1, -o);
        }
        var i = 0, s = 1, a = 0;
        for (this[t] = 255 & e; ++i < r && (s *= 256);) e < 0 && 0 === a && 0 !== this[t + i - 1] && (a = 1), this[t + i] = (e / s >> 0) - a & 255;
        return t + r
      }, u.prototype.writeIntBE = function (e, t, r, n) {
        if (e = +e, t |= 0, !n) {
          var o = Math.pow(2, 8 * r - 1);
          M(this, e, t, r, o - 1, -o);
        }
        var i = r - 1, s = 1, a = 0;
        for (this[t + i] = 255 & e; --i >= 0 && (s *= 256);) e < 0 && 0 === a && 0 !== this[t + i + 1] && (a = 1), this[t + i] = (e / s >> 0) - a & 255;
        return t + r
      }, u.prototype.writeInt8 = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 1, 127, -128), u.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), e < 0 && (e = 255 + e + 1), this[t] = 255 & e, t + 1
      }, u.prototype.writeInt16LE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 2, 32767, -32768), u.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8) : N(this, e, t, !0), t + 2
      }, u.prototype.writeInt16BE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 2, 32767, -32768), u.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, this[t + 1] = 255 & e) : N(this, e, t, !1), t + 2
      }, u.prototype.writeInt32LE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 4, 2147483647, -2147483648), u.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24) : x(this, e, t, !0), t + 4
      }, u.prototype.writeInt32BE = function (e, t, r) {
        return e = +e, t |= 0, r || M(this, e, t, 4, 2147483647, -2147483648), e < 0 && (e = 4294967295 + e + 1), u.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = 255 & e) : x(this, e, t, !1), t + 4
      }, u.prototype.writeFloatLE = function (e, t, r) {
        return j(this, e, t, !0, r)
      }, u.prototype.writeFloatBE = function (e, t, r) {
        return j(this, e, t, !1, r)
      }, u.prototype.writeDoubleLE = function (e, t, r) {
        return L(this, e, t, !0, r)
      }, u.prototype.writeDoubleBE = function (e, t, r) {
        return L(this, e, t, !1, r)
      }, u.prototype.copy = function (e, t, r, n) {
        if (r || (r = 0), n || 0 === n || (n = this.length), t >= e.length && (t = e.length), t || (t = 0), n > 0 && n < r && (n = r), n === r) return 0;
        if (0 === e.length || 0 === this.length) return 0;
        if (t < 0) throw new RangeError("targetStart out of bounds");
        if (r < 0 || r >= this.length) throw new RangeError("sourceStart out of bounds");
        if (n < 0) throw new RangeError("sourceEnd out of bounds");
        n > this.length && (n = this.length), e.length - t < n - r && (n = e.length - t + r);
        var o, i = n - r;
        if (this === e && r < t && t < n) for (o = i - 1; o >= 0; --o) e[o + t] = this[o + r]; else if (i < 1e3 || !u.TYPED_ARRAY_SUPPORT) for (o = 0; o < i; ++o) e[o + t] = this[o + r]; else Uint8Array.prototype.set.call(e, this.subarray(r, r + i), t);
        return i
      }, u.prototype.fill = function (e, t, r, n) {
        if ("string" == typeof e) {
          if ("string" == typeof t ? (n = t, t = 0, r = this.length) : "string" == typeof r && (n = r, r = this.length), 1 === e.length) {
            var o = e.charCodeAt(0);
            o < 256 && (e = o);
          }
          if (void 0 !== n && "string" != typeof n) throw new TypeError("encoding must be a string");
          if ("string" == typeof n && !u.isEncoding(n)) throw new TypeError("Unknown encoding: " + n)
        } else "number" == typeof e && (e &= 255);
        if (t < 0 || this.length < t || this.length < r) throw new RangeError("Out of range index");
        if (r <= t) return this;
        var i;
        if (t >>>= 0, r = void 0 === r ? this.length : r >>> 0, e || (e = 0), "number" == typeof e) for (i = t; i < r; ++i) this[i] = e; else {
          var s = u.isBuffer(e) ? e : B(new u(e, n).toString()), a = s.length;
          for (i = 0; i < r - t; ++i) this[i + t] = s[i % a];
        }
        return this
      };
      var D = /[^+\/0-9A-Za-z-_]/g;

      function F(e) {
        return e < 16 ? "0" + e.toString(16) : e.toString(16)
      }

      function B(e, t) {
        var r;
        t = t || 1 / 0;
        for (var n = e.length, o = null, i = [], s = 0; s < n; ++s) {
          if ((r = e.charCodeAt(s)) > 55295 && r < 57344) {
            if (!o) {
              if (r > 56319) {
                (t -= 3) > -1 && i.push(239, 191, 189);
                continue
              }
              if (s + 1 === n) {
                (t -= 3) > -1 && i.push(239, 191, 189);
                continue
              }
              o = r;
              continue
            }
            if (r < 56320) {
              (t -= 3) > -1 && i.push(239, 191, 189), o = r;
              continue
            }
            r = 65536 + (o - 55296 << 10 | r - 56320);
          } else o && (t -= 3) > -1 && i.push(239, 191, 189);
          if (o = null, r < 128) {
            if ((t -= 1) < 0) break;
            i.push(r);
          } else if (r < 2048) {
            if ((t -= 2) < 0) break;
            i.push(r >> 6 | 192, 63 & r | 128);
          } else if (r < 65536) {
            if ((t -= 3) < 0) break;
            i.push(r >> 12 | 224, r >> 6 & 63 | 128, 63 & r | 128);
          } else {
            if (!(r < 1114112)) throw new Error("Invalid code point");
            if ((t -= 4) < 0) break;
            i.push(r >> 18 | 240, r >> 12 & 63 | 128, r >> 6 & 63 | 128, 63 & r | 128);
          }
        }
        return i
      }

      function q(e) {
        return n.toByteArray(function (e) {
          if ((e = function (e) {
            return e.trim ? e.trim() : e.replace(/^\s+|\s+$/g, "")
          }(e).replace(D, "")).length < 2) return "";
          for (; e.length % 4 != 0;) e += "=";
          return e
        }(e))
      }

      function J(e, t, r, n) {
        for (var o = 0; o < n && !(o + r >= t.length || o >= e.length); ++o) t[o + r] = e[o];
        return o
      }
    }).call(this, r(10));
  }, function (e, t, r) {
    t.byteLength = function (e) {
      var t = c(e), r = t[0], n = t[1];
      return 3 * (r + n) / 4 - n
    }, t.toByteArray = function (e) {
      var t, r, n = c(e), s = n[0], a = n[1], u = new i(function (e, t, r) {
        return 3 * (t + r) / 4 - r
      }(0, s, a)), l = 0, h = a > 0 ? s - 4 : s;
      for (r = 0; r < h; r += 4) t = o[e.charCodeAt(r)] << 18 | o[e.charCodeAt(r + 1)] << 12 | o[e.charCodeAt(r + 2)] << 6 | o[e.charCodeAt(r + 3)], u[l++] = t >> 16 & 255, u[l++] = t >> 8 & 255, u[l++] = 255 & t;
      2 === a && (t = o[e.charCodeAt(r)] << 2 | o[e.charCodeAt(r + 1)] >> 4, u[l++] = 255 & t);
      1 === a && (t = o[e.charCodeAt(r)] << 10 | o[e.charCodeAt(r + 1)] << 4 | o[e.charCodeAt(r + 2)] >> 2, u[l++] = t >> 8 & 255, u[l++] = 255 & t);
      return u
    }, t.fromByteArray = function (e) {
      for (var t, r = e.length, o = r % 3, i = [], s = 0, a = r - o; s < a; s += 16383) i.push(l(e, s, s + 16383 > a ? a : s + 16383));
      1 === o ? (t = e[r - 1], i.push(n[t >> 2] + n[t << 4 & 63] + "==")) : 2 === o && (t = (e[r - 2] << 8) + e[r - 1], i.push(n[t >> 10] + n[t >> 4 & 63] + n[t << 2 & 63] + "="));
      return i.join("")
    };
    for (var n = [], o = [], i = "undefined" != typeof Uint8Array ? Uint8Array : Array, s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", a = 0, u = s.length; a < u; ++a) n[a] = s[a], o[s.charCodeAt(a)] = a;

    function c(e) {
      var t = e.length;
      if (t % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
      var r = e.indexOf("=");
      return -1 === r && (r = t), [r, r === t ? 0 : 4 - r % 4]
    }

    function l(e, t, r) {
      for (var o, i, s = [], a = t; a < r; a += 3) o = (e[a] << 16 & 16711680) + (e[a + 1] << 8 & 65280) + (255 & e[a + 2]), s.push(n[(i = o) >> 18 & 63] + n[i >> 12 & 63] + n[i >> 6 & 63] + n[63 & i]);
      return s.join("")
    }

    o["-".charCodeAt(0)] = 62, o["_".charCodeAt(0)] = 63;
  }, function (e, t) {
    t.read = function (e, t, r, n, o) {
      var i, s, a = 8 * o - n - 1, u = (1 << a) - 1, c = u >> 1, l = -7, h = r ? o - 1 : 0, f = r ? -1 : 1,
        d = e[t + h];
      for (h += f, i = d & (1 << -l) - 1, d >>= -l, l += a; l > 0; i = 256 * i + e[t + h], h += f, l -= 8) ;
      for (s = i & (1 << -l) - 1, i >>= -l, l += n; l > 0; s = 256 * s + e[t + h], h += f, l -= 8) ;
      if (0 === i) i = 1 - c; else {
        if (i === u) return s ? NaN : 1 / 0 * (d ? -1 : 1);
        s += Math.pow(2, n), i -= c;
      }
      return (d ? -1 : 1) * s * Math.pow(2, i - n)
    }, t.write = function (e, t, r, n, o, i) {
      var s, a, u, c = 8 * i - o - 1, l = (1 << c) - 1, h = l >> 1,
        f = 23 === o ? Math.pow(2, -24) - Math.pow(2, -77) : 0, d = n ? 0 : i - 1, p = n ? 1 : -1,
        m = t < 0 || 0 === t && 1 / t < 0 ? 1 : 0;
      for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (a = isNaN(t) ? 1 : 0, s = l) : (s = Math.floor(Math.log(t) / Math.LN2), t * (u = Math.pow(2, -s)) < 1 && (s--, u *= 2), (t += s + h >= 1 ? f / u : f * Math.pow(2, 1 - h)) * u >= 2 && (s++, u /= 2), s + h >= l ? (a = 0, s = l) : s + h >= 1 ? (a = (t * u - 1) * Math.pow(2, o), s += h) : (a = t * Math.pow(2, h - 1) * Math.pow(2, o), s = 0)); o >= 8; e[r + d] = 255 & a, d += p, a /= 256, o -= 8) ;
      for (s = s << o | a, c += o; c > 0; e[r + d] = 255 & s, d += p, s /= 256, c -= 8) ;
      e[r + d - p] |= 128 * m;
    };
  }, function (e, t) {
    var r = {}.toString;
    e.exports = Array.isArray || function (e) {
      return "[object Array]" == r.call(e)
    };
  }, function (e, t, r) {
    var n, o, i;
    o = [], void 0 === (i = "function" == typeof (n = function () {
      var e, t, r, n;
      Object.keys || (Object.keys = (e = Object.prototype.hasOwnProperty, t = !{toString: null}.propertyIsEnumerable("toString"), n = (r = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"]).length, function (o) {
        if ("object" != typeof o && "function" != typeof o || null === o) throw new TypeError("Object.keys called on non-object");
        var i = [];
        for (var s in o) e.call(o, s) && i.push(s);
        if (t) for (var a = 0; a < n; a++) e.call(o, r[a]) && i.push(r[a]);
        return i
      })), Object.create || (Object.create = function () {
        function e() {
        }

        return function (t) {
          if (1 !== arguments.length) throw new Error("Object.create implementation only accepts one parameter.");
          return e.prototype = t, new e
        }
      }()), Array.isArray || (Array.isArray = function (e) {
        return "[object Array]" === Object.prototype.toString.call(e)
      }), Array.prototype.indexOf || (Array.prototype.indexOf = function (e) {
        if (null === this) throw new TypeError;
        var t = Object(this), r = t.length >>> 0;
        if (0 === r) return -1;
        var n = 0;
        if (arguments.length > 1 && ((n = Number(arguments[1])) != n ? n = 0 : 0 !== n && n !== 1 / 0 && n !== -1 / 0 && (n = (n > 0 || -1) * Math.floor(Math.abs(n)))), n >= r) return -1;
        for (var o = n >= 0 ? n : Math.max(r - Math.abs(n), 0); o < r; o++) if (o in t && t[o] === e) return o;
        return -1
      }), Object.isFrozen || (Object.isFrozen = function (e) {
        for (var t = "tv4_test_frozen_key"; e.hasOwnProperty(t);) t += Math.random();
        try {
          return e[t] = !0, delete e[t], !1
        } catch (e) {
          return !0
        }
      });
      var o = {"+": !0, "#": !0, ".": !0, "/": !0, ";": !0, "?": !0, "&": !0}, i = {"*": !0};

      function s(e) {
        return encodeURI(e).replace(/%25[0-9][0-9]/g, (function (e) {
          return "%" + e.substring(3)
        }))
      }

      function a(e) {
        var t = "";
        o[e.charAt(0)] && (t = e.charAt(0), e = e.substring(1));
        var r = "", n = "", a = !0, u = !1, c = !1;
        "+" === t ? a = !1 : "." === t ? (n = ".", r = ".") : "/" === t ? (n = "/", r = "/") : "#" === t ? (n = "#", a = !1) : ";" === t ? (n = ";", r = ";", u = !0, c = !0) : "?" === t ? (n = "?", r = "&", u = !0) : "&" === t && (n = "&", r = "&", u = !0);
        for (var l = [], h = e.split(","), f = [], d = {}, p = 0; p < h.length; p++) {
          var m = h[p], y = null;
          if (-1 !== m.indexOf(":")) {
            var g = m.split(":");
            m = g[0], y = parseInt(g[1], 10);
          }
          for (var v = {}; i[m.charAt(m.length - 1)];) v[m.charAt(m.length - 1)] = !0, m = m.substring(0, m.length - 1);
          var b = {truncate: y, name: m, suffices: v};
          f.push(b), d[m] = b, l.push(m);
        }
        var _ = function (e) {
          for (var t = "", o = 0, i = 0; i < f.length; i++) {
            var l = f[i], h = e(l.name);
            if (null == h || Array.isArray(h) && 0 === h.length || "object" == typeof h && 0 === Object.keys(h).length) o++; else if (t += i === o ? n : r || ",", Array.isArray(h)) {
              u && (t += l.name + "=");
              for (var d = 0; d < h.length; d++) d > 0 && (t += l.suffices["*"] && r || ",", l.suffices["*"] && u && (t += l.name + "=")), t += a ? encodeURIComponent(h[d]).replace(/!/g, "%21") : s(h[d]);
            } else if ("object" == typeof h) {
              u && !l.suffices["*"] && (t += l.name + "=");
              var p = !0;
              for (var m in h) p || (t += l.suffices["*"] && r || ","), p = !1, t += a ? encodeURIComponent(m).replace(/!/g, "%21") : s(m), t += l.suffices["*"] ? "=" : ",", t += a ? encodeURIComponent(h[m]).replace(/!/g, "%21") : s(h[m]);
            } else u && (t += l.name, c && "" === h || (t += "=")), null != l.truncate && (h = h.substring(0, l.truncate)), t += a ? encodeURIComponent(h).replace(/!/g, "%21") : s(h);
          }
          return t
        };
        return _.varNames = l, {prefix: n, substitution: _}
      }

      function u(e) {
        if (!(this instanceof u)) return new u(e);
        for (var t = e.split("{"), r = [t.shift()], n = [], o = [], i = []; t.length > 0;) {
          var s = t.shift(), c = s.split("}")[0], l = s.substring(c.length + 1), h = a(c);
          o.push(h.substitution), n.push(h.prefix), r.push(l), i = i.concat(h.substitution.varNames);
        }
        this.fill = function (e) {
          for (var t = r[0], n = 0; n < o.length; n++) t += (0, o[n])(e), t += r[n + 1];
          return t
        }, this.varNames = i, this.template = e;
      }

      u.prototype = {
        toString: function () {
          return this.template
        }, fillFromObject: function (e) {
          return this.fill((function (t) {
            return e[t]
          }))
        }
      };
      var c = function (e, t, r, n, o) {
        if (this.missing = [], this.missingMap = {}, this.formatValidators = e ? Object.create(e.formatValidators) : {}, this.schemas = e ? Object.create(e.schemas) : {}, this.collectMultiple = t, this.errors = [], this.handleError = t ? this.collectError : this.returnError, n && (this.checkRecursive = !0, this.scanned = [], this.scannedFrozen = [], this.scannedFrozenSchemas = [], this.scannedFrozenValidationErrors = [], this.validatedSchemasKey = "tv4_validation_id", this.validationErrorsKey = "tv4_validation_errors_id"), o && (this.trackUnknownProperties = !0, this.knownPropertyPaths = {}, this.unknownPropertyPaths = {}), this.errorReporter = r || g("en"), "string" == typeof this.errorReporter) throw new Error("debug");
        if (this.definedKeywords = {}, e) for (var i in e.definedKeywords) this.definedKeywords[i] = e.definedKeywords[i].slice(0);
      };

      function l(e, t) {
        if (e === t) return !0;
        if (e && t && "object" == typeof e && "object" == typeof t) {
          if (Array.isArray(e) !== Array.isArray(t)) return !1;
          if (Array.isArray(e)) {
            if (e.length !== t.length) return !1;
            for (var r = 0; r < e.length; r++) if (!l(e[r], t[r])) return !1
          } else {
            var n;
            for (n in e) if (void 0 === t[n] && void 0 !== e[n]) return !1;
            for (n in t) if (void 0 === e[n] && void 0 !== t[n]) return !1;
            for (n in e) if (!l(e[n], t[n])) return !1
          }
          return !0
        }
        return !1
      }

      c.prototype.defineKeyword = function (e, t) {
        this.definedKeywords[e] = this.definedKeywords[e] || [], this.definedKeywords[e].push(t);
      }, c.prototype.createError = function (e, t, r, n, o, i, s) {
        var a = new P(e, t, r, n, o);
        return a.message = this.errorReporter(a, i, s), a
      }, c.prototype.returnError = function (e) {
        return e
      }, c.prototype.collectError = function (e) {
        return e && this.errors.push(e), null
      }, c.prototype.prefixErrors = function (e, t, r) {
        for (var n = e; n < this.errors.length; n++) this.errors[n] = this.errors[n].prefixWith(t, r);
        return this
      }, c.prototype.banUnknownProperties = function (e, t) {
        for (var r in this.unknownPropertyPaths) {
          var n = this.createError(v.UNKNOWN_PROPERTY, {path: r}, r, "", null, e, t), o = this.handleError(n);
          if (o) return o
        }
        return null
      }, c.prototype.addFormat = function (e, t) {
        if ("object" == typeof e) {
          for (var r in e) this.addFormat(r, e[r]);
          return this
        }
        this.formatValidators[e] = t;
      }, c.prototype.resolveRefs = function (e, t) {
        if (void 0 !== e.$ref) {
          if ((t = t || {})[e.$ref]) return this.createError(v.CIRCULAR_REFERENCE, {urls: Object.keys(t).join(", ")}, "", "", null, void 0, e);
          t[e.$ref] = !0, e = this.getSchema(e.$ref, t);
        }
        return e
      }, c.prototype.getSchema = function (e, t) {
        var r;
        if (void 0 !== this.schemas[e]) return r = this.schemas[e], this.resolveRefs(r, t);
        var n = e, o = "";
        if (-1 !== e.indexOf("#") && (o = e.substring(e.indexOf("#") + 1), n = e.substring(0, e.indexOf("#"))), "object" == typeof this.schemas[n]) {
          r = this.schemas[n];
          var i = decodeURIComponent(o);
          if ("" === i) return this.resolveRefs(r, t);
          if ("/" !== i.charAt(0)) return;
          for (var s = i.split("/").slice(1), a = 0; a < s.length; a++) {
            var u = s[a].replace(/~1/g, "/").replace(/~0/g, "~");
            if (void 0 === r[u]) {
              r = void 0;
              break
            }
            r = r[u];
          }
          if (void 0 !== r) return this.resolveRefs(r, t)
        }
        void 0 === this.missing[n] && (this.missing.push(n), this.missing[n] = n, this.missingMap[n] = n);
      }, c.prototype.searchSchemas = function (e, t) {
        if (Array.isArray(e)) for (var r = 0; r < e.length; r++) this.searchSchemas(e[r], t); else if (e && "object" == typeof e) for (var n in "string" == typeof e.id && function (e, t) {
          if (t.substring(0, e.length) === e) {
            var r = t.substring(e.length);
            if (t.length > 0 && "/" === t.charAt(e.length - 1) || "#" === r.charAt(0) || "?" === r.charAt(0)) return !0
          }
          return !1
        }(t, e.id) && void 0 === this.schemas[e.id] && (this.schemas[e.id] = e), e) if ("enum" !== n) if ("object" == typeof e[n]) this.searchSchemas(e[n], t); else if ("$ref" === n) {
          var o = m(e[n]);
          o && void 0 === this.schemas[o] && void 0 === this.missingMap[o] && (this.missingMap[o] = o);
        }
      }, c.prototype.addSchema = function (e, t) {
        if ("string" != typeof e || void 0 === t) {
          if ("object" != typeof e || "string" != typeof e.id) return;
          e = (t = e).id;
        }
        e === m(e) + "#" && (e = m(e)), this.schemas[e] = t, delete this.missingMap[e], y(t, e), this.searchSchemas(t, e);
      }, c.prototype.getSchemaMap = function () {
        var e = {};
        for (var t in this.schemas) e[t] = this.schemas[t];
        return e
      }, c.prototype.getSchemaUris = function (e) {
        var t = [];
        for (var r in this.schemas) e && !e.test(r) || t.push(r);
        return t
      }, c.prototype.getMissingUris = function (e) {
        var t = [];
        for (var r in this.missingMap) e && !e.test(r) || t.push(r);
        return t
      }, c.prototype.dropSchemas = function () {
        this.schemas = {}, this.reset();
      }, c.prototype.reset = function () {
        this.missing = [], this.missingMap = {}, this.errors = [];
      }, c.prototype.validateAll = function (e, t, r, n, o) {
        var i;
        if (!(t = this.resolveRefs(t))) return null;
        if (t instanceof P) return this.errors.push(t), t;
        var s, a = this.errors.length, u = null, c = null;
        if (this.checkRecursive && e && "object" == typeof e) {
          if (i = !this.scanned.length, e[this.validatedSchemasKey]) {
            var l = e[this.validatedSchemasKey].indexOf(t);
            if (-1 !== l) return this.errors = this.errors.concat(e[this.validationErrorsKey][l]), null
          }
          if (Object.isFrozen(e) && -1 !== (s = this.scannedFrozen.indexOf(e))) {
            var h = this.scannedFrozenSchemas[s].indexOf(t);
            if (-1 !== h) return this.errors = this.errors.concat(this.scannedFrozenValidationErrors[s][h]), null
          }
          if (this.scanned.push(e), Object.isFrozen(e)) -1 === s && (s = this.scannedFrozen.length, this.scannedFrozen.push(e), this.scannedFrozenSchemas.push([])), u = this.scannedFrozenSchemas[s].length, this.scannedFrozenSchemas[s][u] = t, this.scannedFrozenValidationErrors[s][u] = []; else {
            if (!e[this.validatedSchemasKey]) try {
              Object.defineProperty(e, this.validatedSchemasKey, {
                value: [],
                configurable: !0
              }), Object.defineProperty(e, this.validationErrorsKey, {value: [], configurable: !0});
            } catch (t) {
              e[this.validatedSchemasKey] = [], e[this.validationErrorsKey] = [];
            }
            c = e[this.validatedSchemasKey].length, e[this.validatedSchemasKey][c] = t, e[this.validationErrorsKey][c] = [];
          }
        }
        var f = this.errors.length,
          d = this.validateBasic(e, t, o) || this.validateNumeric(e, t, o) || this.validateString(e, t, o) || this.validateArray(e, t, o) || this.validateObject(e, t, o) || this.validateCombinations(e, t, o) || this.validateHypermedia(e, t, o) || this.validateFormat(e, t, o) || this.validateDefinedKeywords(e, t, o) || null;
        if (i) {
          for (; this.scanned.length;) delete this.scanned.pop()[this.validatedSchemasKey];
          this.scannedFrozen = [], this.scannedFrozenSchemas = [];
        }
        if (d || f !== this.errors.length) for (; r && r.length || n && n.length;) {
          var p = r && r.length ? "" + r.pop() : null, m = n && n.length ? "" + n.pop() : null;
          d && (d = d.prefixWith(p, m)), this.prefixErrors(f, p, m);
        }
        return null !== u ? this.scannedFrozenValidationErrors[s][u] = this.errors.slice(a) : null !== c && (e[this.validationErrorsKey][c] = this.errors.slice(a)), this.handleError(d)
      }, c.prototype.validateFormat = function (e, t) {
        if ("string" != typeof t.format || !this.formatValidators[t.format]) return null;
        var r = this.formatValidators[t.format].call(null, e, t);
        return "string" == typeof r || "number" == typeof r ? this.createError(v.FORMAT_CUSTOM, {message: r}, "", "/format", null, e, t) : r && "object" == typeof r ? this.createError(v.FORMAT_CUSTOM, {message: r.message || "?"}, r.dataPath || "", r.schemaPath || "/format", null, e, t) : null
      }, c.prototype.validateDefinedKeywords = function (e, t, r) {
        for (var n in this.definedKeywords) if (void 0 !== t[n]) for (var o = this.definedKeywords[n], i = 0; i < o.length; i++) {
          var s = (0, o[i])(e, t[n], t, r);
          if ("string" == typeof s || "number" == typeof s) return this.createError(v.KEYWORD_CUSTOM, {
            key: n,
            message: s
          }, "", "", null, e, t).prefixWith(null, n);
          if (s && "object" == typeof s) {
            var a = s.code;
            if ("string" == typeof a) {
              if (!v[a]) throw new Error("Undefined error code (use defineError): " + a);
              a = v[a];
            } else "number" != typeof a && (a = v.KEYWORD_CUSTOM);
            var u = "object" == typeof s.message ? s.message : {key: n, message: s.message || "?"},
              c = s.schemaPath || "/" + n.replace(/~/g, "~0").replace(/\//g, "~1");
            return this.createError(a, u, s.dataPath || null, c, null, e, t)
          }
        }
        return null
      }, c.prototype.validateBasic = function (e, t, r) {
        var n;
        return (n = this.validateType(e, t, r)) ? n.prefixWith(null, "type") : (n = this.validateEnum(e, t, r)) ? n.prefixWith(null, "type") : null
      }, c.prototype.validateType = function (e, t) {
        if (void 0 === t.type) return null;
        var r = typeof e;
        null === e ? r = "null" : Array.isArray(e) && (r = "array");
        var n = t.type;
        Array.isArray(n) || (n = [n]);
        for (var o = 0; o < n.length; o++) {
          var i = n[o];
          if (i === r || "integer" === i && "number" === r && e % 1 == 0) return null
        }
        return this.createError(v.INVALID_TYPE, {type: r, expected: n.join("/")}, "", "", null, e, t)
      }, c.prototype.validateEnum = function (e, t) {
        if (void 0 === t.enum) return null;
        for (var r = 0; r < t.enum.length; r++) if (l(e, t.enum[r])) return null;
        return this.createError(v.ENUM_MISMATCH, {value: "undefined" != typeof JSON ? JSON.stringify(e) : e}, "", "", null, e, t)
      }, c.prototype.validateNumeric = function (e, t, r) {
        return this.validateMultipleOf(e, t, r) || this.validateMinMax(e, t, r) || this.validateNaN(e, t, r) || null
      };
      var h = Math.pow(2, -51), f = 1 - h;

      function d(e) {
        var t = String(e).replace(/^\s+|\s+$/g, "").match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
        return t ? {
          href: t[0] || "",
          protocol: t[1] || "",
          authority: t[2] || "",
          host: t[3] || "",
          hostname: t[4] || "",
          port: t[5] || "",
          pathname: t[6] || "",
          search: t[7] || "",
          hash: t[8] || ""
        } : null
      }

      function p(e, t) {
        return t = d(t || ""), e = d(e || ""), t && e ? (t.protocol || e.protocol) + (t.protocol || t.authority ? t.authority : e.authority) + (r = t.protocol || t.authority || "/" === t.pathname.charAt(0) ? t.pathname : t.pathname ? (e.authority && !e.pathname ? "/" : "") + e.pathname.slice(0, e.pathname.lastIndexOf("/") + 1) + t.pathname : e.pathname, n = [], r.replace(/^(\.\.?(\/|$))+/, "").replace(/\/(\.(\/|$))+/g, "/").replace(/\/\.\.$/, "/../").replace(/\/?[^\/]*/g, (function (e) {
          "/.." === e ? n.pop() : n.push(e);
        })), n.join("").replace(/^\//, "/" === r.charAt(0) ? "/" : "")) + (t.protocol || t.authority || t.pathname ? t.search : t.search || e.search) + t.hash : null;
        var r, n;
      }

      function m(e) {
        return e.split("#")[0]
      }

      function y(e, t) {
        if (e && "object" == typeof e) if (void 0 === t ? t = e.id : "string" == typeof e.id && (t = p(t, e.id), e.id = t), Array.isArray(e)) for (var r = 0; r < e.length; r++) y(e[r], t); else for (var n in "string" == typeof e.$ref && (e.$ref = p(t, e.$ref)), e) "enum" !== n && y(e[n], t);
      }

      function g(e) {
        var t = E[e = e || "en"];
        return function (e) {
          var r = t[e.code] || w[e.code];
          if ("string" != typeof r) return "Unknown error code " + e.code + ": " + JSON.stringify(e.messageParams);
          var n = e.params;
          return r.replace(/\{([^{}]*)\}/g, (function (e, t) {
            var r = n[t];
            return "string" == typeof r || "number" == typeof r ? r : e
          }))
        }
      }

      c.prototype.validateMultipleOf = function (e, t) {
        var r = t.multipleOf || t.divisibleBy;
        if (void 0 === r) return null;
        if ("number" == typeof e) {
          var n = e / r % 1;
          if (n >= h && n < f) return this.createError(v.NUMBER_MULTIPLE_OF, {
            value: e,
            multipleOf: r
          }, "", "", null, e, t)
        }
        return null
      }, c.prototype.validateMinMax = function (e, t) {
        if ("number" != typeof e) return null;
        if (void 0 !== t.minimum) {
          if (e < t.minimum) return this.createError(v.NUMBER_MINIMUM, {
            value: e,
            minimum: t.minimum
          }, "", "/minimum", null, e, t);
          if (t.exclusiveMinimum && e === t.minimum) return this.createError(v.NUMBER_MINIMUM_EXCLUSIVE, {
            value: e,
            minimum: t.minimum
          }, "", "/exclusiveMinimum", null, e, t)
        }
        if (void 0 !== t.maximum) {
          if (e > t.maximum) return this.createError(v.NUMBER_MAXIMUM, {
            value: e,
            maximum: t.maximum
          }, "", "/maximum", null, e, t);
          if (t.exclusiveMaximum && e === t.maximum) return this.createError(v.NUMBER_MAXIMUM_EXCLUSIVE, {
            value: e,
            maximum: t.maximum
          }, "", "/exclusiveMaximum", null, e, t)
        }
        return null
      }, c.prototype.validateNaN = function (e, t) {
        return "number" != typeof e ? null : !0 === isNaN(e) || e === 1 / 0 || e === -1 / 0 ? this.createError(v.NUMBER_NOT_A_NUMBER, {value: e}, "", "/type", null, e, t) : null
      }, c.prototype.validateString = function (e, t, r) {
        return this.validateStringLength(e, t, r) || this.validateStringPattern(e, t, r) || null
      }, c.prototype.validateStringLength = function (e, t) {
        return "string" != typeof e ? null : void 0 !== t.minLength && e.length < t.minLength ? this.createError(v.STRING_LENGTH_SHORT, {
          length: e.length,
          minimum: t.minLength
        }, "", "/minLength", null, e, t) : void 0 !== t.maxLength && e.length > t.maxLength ? this.createError(v.STRING_LENGTH_LONG, {
          length: e.length,
          maximum: t.maxLength
        }, "", "/maxLength", null, e, t) : null
      }, c.prototype.validateStringPattern = function (e, t) {
        if ("string" != typeof e || "string" != typeof t.pattern && !(t.pattern instanceof RegExp)) return null;
        var r;
        if (t.pattern instanceof RegExp) r = t.pattern; else {
          var n, o = "", i = t.pattern.match(/^\/(.+)\/([img]*)$/);
          i ? (n = i[1], o = i[2]) : n = t.pattern, r = new RegExp(n, o);
        }
        return r.test(e) ? null : this.createError(v.STRING_PATTERN, {pattern: t.pattern}, "", "/pattern", null, e, t)
      }, c.prototype.validateArray = function (e, t, r) {
        return Array.isArray(e) && (this.validateArrayLength(e, t, r) || this.validateArrayUniqueItems(e, t, r) || this.validateArrayItems(e, t, r)) || null
      }, c.prototype.validateArrayLength = function (e, t) {
        var r;
        return void 0 !== t.minItems && e.length < t.minItems && (r = this.createError(v.ARRAY_LENGTH_SHORT, {
          length: e.length,
          minimum: t.minItems
        }, "", "/minItems", null, e, t), this.handleError(r)) ? r : void 0 !== t.maxItems && e.length > t.maxItems && (r = this.createError(v.ARRAY_LENGTH_LONG, {
          length: e.length,
          maximum: t.maxItems
        }, "", "/maxItems", null, e, t), this.handleError(r)) ? r : null
      }, c.prototype.validateArrayUniqueItems = function (e, t) {
        if (t.uniqueItems) for (var r = 0; r < e.length; r++) for (var n = r + 1; n < e.length; n++) if (l(e[r], e[n])) {
          var o = this.createError(v.ARRAY_UNIQUE, {match1: r, match2: n}, "", "/uniqueItems", null, e, t);
          if (this.handleError(o)) return o
        }
        return null
      }, c.prototype.validateArrayItems = function (e, t, r) {
        if (void 0 === t.items) return null;
        var n, o;
        if (Array.isArray(t.items)) {
          for (o = 0; o < e.length; o++) if (o < t.items.length) {
            if (n = this.validateAll(e[o], t.items[o], [o], ["items", o], r + "/" + o)) return n
          } else if (void 0 !== t.additionalItems) if ("boolean" == typeof t.additionalItems) {
            if (!t.additionalItems && (n = this.createError(v.ARRAY_ADDITIONAL_ITEMS, {}, "/" + o, "/additionalItems", null, e, t), this.handleError(n))) return n
          } else if (n = this.validateAll(e[o], t.additionalItems, [o], ["additionalItems"], r + "/" + o)) return n
        } else for (o = 0; o < e.length; o++) if (n = this.validateAll(e[o], t.items, [o], ["items"], r + "/" + o)) return n;
        return null
      }, c.prototype.validateObject = function (e, t, r) {
        return "object" != typeof e || null === e || Array.isArray(e) ? null : this.validateObjectMinMaxProperties(e, t, r) || this.validateObjectRequiredProperties(e, t, r) || this.validateObjectProperties(e, t, r) || this.validateObjectDependencies(e, t, r) || null
      }, c.prototype.validateObjectMinMaxProperties = function (e, t) {
        var r, n = Object.keys(e);
        return void 0 !== t.minProperties && n.length < t.minProperties && (r = this.createError(v.OBJECT_PROPERTIES_MINIMUM, {
          propertyCount: n.length,
          minimum: t.minProperties
        }, "", "/minProperties", null, e, t), this.handleError(r)) ? r : void 0 !== t.maxProperties && n.length > t.maxProperties && (r = this.createError(v.OBJECT_PROPERTIES_MAXIMUM, {
          propertyCount: n.length,
          maximum: t.maxProperties
        }, "", "/maxProperties", null, e, t), this.handleError(r)) ? r : null
      }, c.prototype.validateObjectRequiredProperties = function (e, t) {
        if (void 0 !== t.required) for (var r = 0; r < t.required.length; r++) {
          var n = t.required[r];
          if (void 0 === e[n]) {
            var o = this.createError(v.OBJECT_REQUIRED, {key: n}, "", "/required/" + r, null, e, t);
            if (this.handleError(o)) return o
          }
        }
        return null
      }, c.prototype.validateObjectProperties = function (e, t, r) {
        var n;
        for (var o in e) {
          var i = r + "/" + o.replace(/~/g, "~0").replace(/\//g, "~1"), s = !1;
          if (void 0 !== t.properties && void 0 !== t.properties[o] && (s = !0, n = this.validateAll(e[o], t.properties[o], [o], ["properties", o], i))) return n;
          if (void 0 !== t.patternProperties) for (var a in t.patternProperties) if (new RegExp(a).test(o) && (s = !0, n = this.validateAll(e[o], t.patternProperties[a], [o], ["patternProperties", a], i))) return n;
          if (s) this.trackUnknownProperties && (this.knownPropertyPaths[i] = !0, delete this.unknownPropertyPaths[i]); else if (void 0 !== t.additionalProperties) {
            if (this.trackUnknownProperties && (this.knownPropertyPaths[i] = !0, delete this.unknownPropertyPaths[i]), "boolean" == typeof t.additionalProperties) {
              if (!t.additionalProperties && (n = this.createError(v.OBJECT_ADDITIONAL_PROPERTIES, {key: o}, "", "/additionalProperties", null, e, t).prefixWith(o, null), this.handleError(n))) return n
            } else if (n = this.validateAll(e[o], t.additionalProperties, [o], ["additionalProperties"], i)) return n
          } else this.trackUnknownProperties && !this.knownPropertyPaths[i] && (this.unknownPropertyPaths[i] = !0);
        }
        return null
      }, c.prototype.validateObjectDependencies = function (e, t, r) {
        var n;
        if (void 0 !== t.dependencies) for (var o in t.dependencies) if (void 0 !== e[o]) {
          var i = t.dependencies[o];
          if ("string" == typeof i) {
            if (void 0 === e[i] && (n = this.createError(v.OBJECT_DEPENDENCY_KEY, {
              key: o,
              missing: i
            }, "", "", null, e, t).prefixWith(null, o).prefixWith(null, "dependencies"), this.handleError(n))) return n
          } else if (Array.isArray(i)) for (var s = 0; s < i.length; s++) {
            var a = i[s];
            if (void 0 === e[a] && (n = this.createError(v.OBJECT_DEPENDENCY_KEY, {
              key: o,
              missing: a
            }, "", "/" + s, null, e, t).prefixWith(null, o).prefixWith(null, "dependencies"), this.handleError(n))) return n
          } else if (n = this.validateAll(e, i, [], ["dependencies", o], r)) return n
        }
        return null
      }, c.prototype.validateCombinations = function (e, t, r) {
        return this.validateAllOf(e, t, r) || this.validateAnyOf(e, t, r) || this.validateOneOf(e, t, r) || this.validateNot(e, t, r) || null
      }, c.prototype.validateAllOf = function (e, t, r) {
        if (void 0 === t.allOf) return null;
        for (var n, o = 0; o < t.allOf.length; o++) {
          var i = t.allOf[o];
          if (n = this.validateAll(e, i, [], ["allOf", o], r)) return n
        }
        return null
      }, c.prototype.validateAnyOf = function (e, t, r) {
        if (void 0 === t.anyOf) return null;
        var n, o, i = [], s = this.errors.length;
        this.trackUnknownProperties && (n = this.unknownPropertyPaths, o = this.knownPropertyPaths);
        for (var a = !0, u = 0; u < t.anyOf.length; u++) {
          this.trackUnknownProperties && (this.unknownPropertyPaths = {}, this.knownPropertyPaths = {});
          var c = t.anyOf[u], l = this.errors.length, h = this.validateAll(e, c, [], ["anyOf", u], r);
          if (null === h && l === this.errors.length) {
            if (this.errors = this.errors.slice(0, s), this.trackUnknownProperties) {
              for (var f in this.knownPropertyPaths) o[f] = !0, delete n[f];
              for (var d in this.unknownPropertyPaths) o[d] || (n[d] = !0);
              a = !1;
              continue
            }
            return null
          }
          h && i.push(h.prefixWith(null, "" + u).prefixWith(null, "anyOf"));
        }
        return this.trackUnknownProperties && (this.unknownPropertyPaths = n, this.knownPropertyPaths = o), a ? (i = i.concat(this.errors.slice(s)), this.errors = this.errors.slice(0, s), this.createError(v.ANY_OF_MISSING, {}, "", "/anyOf", i, e, t)) : void 0
      }, c.prototype.validateOneOf = function (e, t, r) {
        if (void 0 === t.oneOf) return null;
        var n, o, i = null, s = [], a = this.errors.length;
        this.trackUnknownProperties && (n = this.unknownPropertyPaths, o = this.knownPropertyPaths);
        for (var u = 0; u < t.oneOf.length; u++) {
          this.trackUnknownProperties && (this.unknownPropertyPaths = {}, this.knownPropertyPaths = {});
          var c = t.oneOf[u], l = this.errors.length, h = this.validateAll(e, c, [], ["oneOf", u], r);
          if (null === h && l === this.errors.length) {
            if (null !== i) return this.errors = this.errors.slice(0, a), this.createError(v.ONE_OF_MULTIPLE, {
              index1: i,
              index2: u
            }, "", "/oneOf", null, e, t);
            if (i = u, this.trackUnknownProperties) {
              for (var f in this.knownPropertyPaths) o[f] = !0, delete n[f];
              for (var d in this.unknownPropertyPaths) o[d] || (n[d] = !0);
            }
          } else h && s.push(h);
        }
        return this.trackUnknownProperties && (this.unknownPropertyPaths = n, this.knownPropertyPaths = o), null === i ? (s = s.concat(this.errors.slice(a)), this.errors = this.errors.slice(0, a), this.createError(v.ONE_OF_MISSING, {}, "", "/oneOf", s, e, t)) : (this.errors = this.errors.slice(0, a), null)
      }, c.prototype.validateNot = function (e, t, r) {
        if (void 0 === t.not) return null;
        var n, o, i = this.errors.length;
        this.trackUnknownProperties && (n = this.unknownPropertyPaths, o = this.knownPropertyPaths, this.unknownPropertyPaths = {}, this.knownPropertyPaths = {});
        var s = this.validateAll(e, t.not, null, null, r), a = this.errors.slice(i);
        return this.errors = this.errors.slice(0, i), this.trackUnknownProperties && (this.unknownPropertyPaths = n, this.knownPropertyPaths = o), null === s && 0 === a.length ? this.createError(v.NOT_PASSED, {}, "", "/not", null, e, t) : null
      }, c.prototype.validateHypermedia = function (e, t, r) {
        if (!t.links) return null;
        for (var n, o = 0; o < t.links.length; o++) {
          var i = t.links[o];
          if ("describedby" === i.rel) {
            for (var s = new u(i.href), a = !0, c = 0; c < s.varNames.length; c++) if (!(s.varNames[c] in e)) {
              a = !1;
              break
            }
            if (a) {
              var l = {$ref: s.fillFromObject(e)};
              if (n = this.validateAll(e, l, [], ["links", o], r)) return n
            }
          }
        }
      };
      var v = {
        INVALID_TYPE: 0,
        ENUM_MISMATCH: 1,
        ANY_OF_MISSING: 10,
        ONE_OF_MISSING: 11,
        ONE_OF_MULTIPLE: 12,
        NOT_PASSED: 13,
        NUMBER_MULTIPLE_OF: 100,
        NUMBER_MINIMUM: 101,
        NUMBER_MINIMUM_EXCLUSIVE: 102,
        NUMBER_MAXIMUM: 103,
        NUMBER_MAXIMUM_EXCLUSIVE: 104,
        NUMBER_NOT_A_NUMBER: 105,
        STRING_LENGTH_SHORT: 200,
        STRING_LENGTH_LONG: 201,
        STRING_PATTERN: 202,
        OBJECT_PROPERTIES_MINIMUM: 300,
        OBJECT_PROPERTIES_MAXIMUM: 301,
        OBJECT_REQUIRED: 302,
        OBJECT_ADDITIONAL_PROPERTIES: 303,
        OBJECT_DEPENDENCY_KEY: 304,
        ARRAY_LENGTH_SHORT: 400,
        ARRAY_LENGTH_LONG: 401,
        ARRAY_UNIQUE: 402,
        ARRAY_ADDITIONAL_ITEMS: 403,
        FORMAT_CUSTOM: 500,
        KEYWORD_CUSTOM: 501,
        CIRCULAR_REFERENCE: 600,
        UNKNOWN_PROPERTY: 1e3
      }, b = {};
      for (var _ in v) b[v[_]] = _;
      var w = {
        INVALID_TYPE: "Invalid type: {type} (expected {expected})",
        ENUM_MISMATCH: "No enum match for: {value}",
        ANY_OF_MISSING: 'Data does not match any schemas from "anyOf"',
        ONE_OF_MISSING: 'Data does not match any schemas from "oneOf"',
        ONE_OF_MULTIPLE: 'Data is valid against more than one schema from "oneOf": indices {index1} and {index2}',
        NOT_PASSED: 'Data matches schema from "not"',
        NUMBER_MULTIPLE_OF: "Value {value} is not a multiple of {multipleOf}",
        NUMBER_MINIMUM: "Value {value} is less than minimum {minimum}",
        NUMBER_MINIMUM_EXCLUSIVE: "Value {value} is equal to exclusive minimum {minimum}",
        NUMBER_MAXIMUM: "Value {value} is greater than maximum {maximum}",
        NUMBER_MAXIMUM_EXCLUSIVE: "Value {value} is equal to exclusive maximum {maximum}",
        NUMBER_NOT_A_NUMBER: "Value {value} is not a valid number",
        STRING_LENGTH_SHORT: "String is too short ({length} chars), minimum {minimum}",
        STRING_LENGTH_LONG: "String is too long ({length} chars), maximum {maximum}",
        STRING_PATTERN: "String does not match pattern: {pattern}",
        OBJECT_PROPERTIES_MINIMUM: "Too few properties defined ({propertyCount}), minimum {minimum}",
        OBJECT_PROPERTIES_MAXIMUM: "Too many properties defined ({propertyCount}), maximum {maximum}",
        OBJECT_REQUIRED: "Missing required property: {key}",
        OBJECT_ADDITIONAL_PROPERTIES: "Additional properties not allowed",
        OBJECT_DEPENDENCY_KEY: "Dependency failed - key must exist: {missing} (due to key: {key})",
        ARRAY_LENGTH_SHORT: "Array is too short ({length}), minimum {minimum}",
        ARRAY_LENGTH_LONG: "Array is too long ({length}), maximum {maximum}",
        ARRAY_UNIQUE: "Array items are not unique (indices {match1} and {match2})",
        ARRAY_ADDITIONAL_ITEMS: "Additional items not allowed",
        FORMAT_CUSTOM: "Format validation failed ({message})",
        KEYWORD_CUSTOM: "Keyword failed: {key} ({message})",
        CIRCULAR_REFERENCE: "Circular $refs: {urls}",
        UNKNOWN_PROPERTY: "Unknown property (not in schema)"
      };

      function P(e, t, r, n, o) {
        if (Error.call(this), void 0 === e) throw new Error("No error code supplied: " + n);
        this.message = "", this.params = t, this.code = e, this.dataPath = r || "", this.schemaPath = n || "", this.subErrors = o || null;
        var i = new Error(this.message);
        if (this.stack = i.stack || i.stacktrace, !this.stack) try {
          throw i
        } catch (i) {
          this.stack = i.stack || i.stacktrace;
        }
      }

      P.prototype = Object.create(Error.prototype), P.prototype.constructor = P, P.prototype.name = "ValidationError", P.prototype.prefixWith = function (e, t) {
        if (null !== e && (e = e.replace(/~/g, "~0").replace(/\//g, "~1"), this.dataPath = "/" + e + this.dataPath), null !== t && (t = t.replace(/~/g, "~0").replace(/\//g, "~1"), this.schemaPath = "/" + t + this.schemaPath), null !== this.subErrors) for (var r = 0; r < this.subErrors.length; r++) this.subErrors[r].prefixWith(e, t);
        return this
      };
      var E = {}, S = function e(t) {
        var r, n, o = new c, i = {
          setErrorReporter: function (e) {
            return "string" == typeof e ? this.language(e) : (n = e, !0)
          }, addFormat: function () {
            o.addFormat.apply(o, arguments);
          }, language: function (e) {
            return e ? (E[e] || (e = e.split("-")[0]), !!E[e] && (r = e, e)) : r
          }, addLanguage: function (e, t) {
            var r;
            for (r in v) t[r] && !t[v[r]] && (t[v[r]] = t[r]);
            var n = e.split("-")[0];
            if (E[n]) for (r in E[e] = Object.create(E[n]), t) void 0 === E[n][r] && (E[n][r] = t[r]), E[e][r] = t[r]; else E[e] = t, E[n] = t;
            return this
          }, freshApi: function (t) {
            var r = e();
            return t && r.language(t), r
          }, validate: function (e, t, i, s) {
            var a = g(r), u = new c(o, !1, n ? function (e, t, r) {
              return n(e, t, r) || a(e, t, r)
            } : a, i, s);
            "string" == typeof t && (t = {$ref: t}), u.addSchema("", t);
            var l = u.validateAll(e, t, null, null, "");
            return !l && s && (l = u.banUnknownProperties(e, t)), this.error = l, this.missing = u.missing, this.valid = null === l, this.valid
          }, validateResult: function () {
            var e = {
              toString: function () {
                return this.valid ? "valid" : this.error.message
              }
            };
            return this.validate.apply(e, arguments), e
          }, validateMultiple: function (e, t, i, s) {
            var a = g(r), u = new c(o, !0, n ? function (e, t, r) {
              return n(e, t, r) || a(e, t, r)
            } : a, i, s);
            "string" == typeof t && (t = {$ref: t}), u.addSchema("", t), u.validateAll(e, t, null, null, ""), s && u.banUnknownProperties(e, t);
            var l = {
              toString: function () {
                return this.valid ? "valid" : this.error.message
              }
            };
            return l.errors = u.errors, l.missing = u.missing, l.valid = 0 === l.errors.length, l
          }, addSchema: function () {
            return o.addSchema.apply(o, arguments)
          }, getSchema: function () {
            return o.getSchema.apply(o, arguments)
          }, getSchemaMap: function () {
            return o.getSchemaMap.apply(o, arguments)
          }, getSchemaUris: function () {
            return o.getSchemaUris.apply(o, arguments)
          }, getMissingUris: function () {
            return o.getMissingUris.apply(o, arguments)
          }, dropSchemas: function () {
            o.dropSchemas.apply(o, arguments);
          }, defineKeyword: function () {
            o.defineKeyword.apply(o, arguments);
          }, defineError: function (e, t, r) {
            if ("string" != typeof e || !/^[A-Z]+(_[A-Z]+)*$/.test(e)) throw new Error("Code name must be a string in UPPER_CASE_WITH_UNDERSCORES");
            if ("number" != typeof t || t % 1 != 0 || t < 1e4) throw new Error("Code number must be an integer > 10000");
            if (void 0 !== v[e]) throw new Error("Error already defined: " + e + " as " + v[e]);
            if (void 0 !== b[t]) throw new Error("Error code already used: " + b[t] + " as " + t);
            for (var n in v[e] = t, b[t] = e, w[e] = w[t] = r, E) {
              var o = E[n];
              o[e] && (o[t] = o[t] || o[e]);
            }
          }, reset: function () {
            o.reset(), this.error = null, this.missing = [], this.valid = !0;
          }, missing: [], error: null, valid: !0, normSchema: y, resolveUrl: p, getDocumentUri: m, errorCodes: v
        };
        return i.language(t || "en"), i
      }();
      return S.addLanguage("en-gb", w), S.tv4 = S, S
    }) ? n.apply(t, o) : n) || (e.exports = i);
  }, function (e, t) {
    var r = {
      uris: {}, schemas: {}, aliases: {}, declare: function (e, t, r, n) {
        var o = e + "/" + t;
        if (n.extends) {
          var i, s = n.extends.split("/");
          i = 1 === s.length ? e + "/" + s.shift() : s.join("/");
          var a = this.uris[i];
          if (!a) throw "Type '" + o + "' tries to extend unknown schema '" + i + "'";
          n.extends = this.schemas[a];
        }
        this.uris[o] = r, this.aliases[r] = o, this.schemas[r] = n;
      }, resolveAlias: function (e) {
        return this.uris[e]
      }, getSchema: function (e) {
        return this.schemas[e]
      }, inScope: function (e) {
        var t = e.length, r = {};
        for (var n in this.uris) if (n.substr(0, t + 1) === e + "/") {
          var o = this.uris[n];
          r[o] = this.schemas[o];
        }
        return r
      }
    }, n = function (e) {
      var t = new Error("Schema not found: " + e);
      return t.name = "SchemaNotFound", t
    };
    n.prototype = Error.prototype, r.SchemaNotFound = n, e.exports = r;
  }, function (e, t) {
    function r(e) {
      this.defaultValue = e, this._canPropagate = !1, this._storage = {}, this._itemsRev = {}, this.activatePropagation();
    }

    r.prototype = {
      get: function (e) {
        e = e.toLowerCase();
        var t = this._storage[e];
        return void 0 === t && (t = this.defaultValue, this._storage[e] = t), t
      }, set: function (e, t) {
        return e = e.toLowerCase(), this._storage[e] === t ? t : (this._storage[e] = t, t || delete this._itemsRev[e], this._updateParentFolderItemRev(e, t), this._canPropagate && this._propagate(e), t)
      }, delete: function (e) {
        return this.set(e, null)
      }, deactivatePropagation: function () {
        return this._canPropagate = !1, !0
      }, activatePropagation: function () {
        return !!this._canPropagate || (this._generateFolderRev("/"), this._canPropagate = !0, !0)
      }, _hashCode: function (e) {
        var t, r = 0;
        if (0 === e.length) return r;
        for (t = 0; t < e.length; t++) r = (r << 5) - r + e.charCodeAt(t), r |= 0;
        return r
      }, _generateHash: function (e) {
        var t = e.sort().join("|");
        return "" + this._hashCode(t)
      }, _updateParentFolderItemRev: function (e, t) {
        if ("/" !== e) {
          var r = this._getParentFolder(e);
          this._itemsRev[r] || (this._itemsRev[r] = {});
          var n = this._itemsRev[r];
          t ? n[e] = t : delete n[e], this._updateParentFolderItemRev(r, this.defaultValue);
        }
      }, _getParentFolder: function (e) {
        return e.substr(0, e.lastIndexOf("/", e.length - 2) + 1)
      }, _propagate: function (e) {
        if ("/" !== e) {
          var t = this._getParentFolder(e), r = this._itemsRev[t], n = [];
          for (var o in r) n.push(r[o]);
          var i = this._generateHash(n);
          this.set(t, i);
        }
      }, _generateFolderRev: function (e) {
        var t = this._itemsRev[e], r = this.defaultValue;
        if (t) {
          var n = [];
          for (var o in t) {
            var i = void 0;
            i = "/" === o.substr(-1) ? this._generateFolderRev(o) : t[o], n.push(i);
          }
          n.length > 0 && (r = this._generateHash(n));
        }
        return this.set(e, r), r
      }
    }, e.exports = r;
  }, function (e, t, r) {
    var n;
    /*!
 * webfinger.js
 *   version 2.7.0
 *   http://github.com/silverbucket/webfinger.js
 *
 * Developed and Maintained by:
 *   Nick Jennings <nick@silverbucket.net> 2012
 *
 * webfinger.js is released under the AGPL (see LICENSE).
 *
 * You don't have to do anything special to choose one license or the other and you don't
 * have to notify anyone which license you are using.
 * Please see the corresponding license file for details of these licenses.
 * You are free to use, modify and distribute this software, but all copyright
 * information must remain.
 *
 */
    "function" != typeof fetch && "function" != typeof XMLHttpRequest && (XMLHttpRequest = r(26)), function (r) {
      var o = {
        "http://webfist.org/spec/rel": "webfist",
        "http://webfinger.net/rel/avatar": "avatar",
        remotestorage: "remotestorage",
        "http://tools.ietf.org/id/draft-dejong-remotestorage": "remotestorage",
        remoteStorage: "remotestorage",
        "http://www.packetizer.com/rel/share": "share",
        "http://webfinger.net/rel/profile-page": "profile",
        me: "profile",
        vcard: "vcard",
        blog: "blog",
        "http://packetizer.com/rel/blog": "blog",
        "http://schemas.google.com/g/2010#updates-from": "updates",
        "https://camlistore.org/rel/server": "camilstore"
      }, i = {
        avatar: [],
        remotestorage: [],
        blog: [],
        vcard: [],
        updates: [],
        share: [],
        profile: [],
        webfist: [],
        camlistore: []
      }, s = ["webfinger", "host-meta", "host-meta.json"];

      function a(e) {
        return e.toString = function () {
          return this.message
        }, e
      }

      function u(e) {
        "object" != typeof e && (e = {}), this.config = {
          tls_only: void 0 === e.tls_only || e.tls_only,
          webfist_fallback: void 0 !== e.webfist_fallback && e.webfist_fallback,
          uri_fallback: void 0 !== e.uri_fallback && e.uri_fallback,
          request_timeout: void 0 !== e.request_timeout ? e.request_timeout : 1e4
        };
      }

      u.prototype.__fetchJRD = function (e, t, r) {
        if ("function" == typeof fetch) return this.__fetchJRD_fetch(e, t, r);
        if ("function" == typeof XMLHttpRequest) return this.__fetchJRD_XHR(e, t, r);
        throw new Error("add a polyfill for fetch or XMLHttpRequest")
      }, u.prototype.__fetchJRD_fetch = function (e, t, r) {
        var n, o = this;
        "function" == typeof AbortController && (n = new AbortController);
        var i = fetch(e, {
          headers: {Accept: "application/jrd+json, application/json"},
          signal: n ? n.signal : void 0
        }).then((function (t) {
          if (t.ok) return t.text();
          throw 404 === t.status ? a({
            message: "resource not found",
            url: e,
            status: t.status
          }) : a({message: "error during request", url: e, status: t.status})
        }), (function (t) {
          throw a({message: "error during request", url: e, status: void 0, err: t})
        })).then((function (t) {
          if (o.__isValidJSON(t)) return t;
          throw a({message: "invalid json", url: e, status: void 0})
        })), s = new Promise((function (t, r) {
          setTimeout((function () {
            r(a({message: "request timed out", url: e, status: void 0})), n && n.abort();
          }), o.config.request_timeout);
        }));
        Promise.race([i, s]).then((function (e) {
          r(e);
        })).catch((function (e) {
          t(e);
        }));
      }, u.prototype.__fetchJRD_XHR = function (e, t, r) {
        var n = this, o = !1, i = new XMLHttpRequest;

        function s() {
          if (!o) {
            if (o = !0, 200 === i.status) return n.__isValidJSON(i.responseText) ? r(i.responseText) : t(a({
              message: "invalid json",
              url: e,
              status: i.status
            }));
            if (404 === i.status) return t(a({message: "resource not found", url: e, status: i.status}));
            if (i.status >= 301 && i.status <= 302) {
              var s = i.getResponseHeader("Location");
              return function (e) {
                return "string" == typeof e && "https" === e.split("://")[0]
              }(s) ? u() : t(a({message: "no redirect URL found", url: e, status: i.status}))
            }
            return t(a({message: "error during request", url: e, status: i.status}))
          }
        }

        function u() {
          i.onreadystatechange = function () {
            4 === i.readyState && s();
          }, i.onload = function () {
            s();
          }, i.ontimeout = function () {
            return t(a({message: "request timed out", url: e, status: i.status}))
          }, i.open("GET", e, !0), i.timeout = n.config.request_timeout, i.setRequestHeader("Accept", "application/jrd+json, application/json"), i.send();
        }

        return u()
      }, u.prototype.__isValidJSON = function (e) {
        try {
          JSON.parse(e);
        } catch (e) {
          return !1
        }
        return !0
      }, u.prototype.__isLocalhost = function (e) {
        return /^localhost(\.localdomain)?(\:[0-9]+)?$/.test(e)
      }, u.prototype.__processJRD = function (e, t, r, n) {
        var s = JSON.parse(t);
        if ("object" != typeof s || "object" != typeof s.links) return void 0 !== s.error ? r(a({
          message: s.error,
          request: e
        })) : r(a({message: "unknown response from server", request: e}));
        var u = s.links;
        Array.isArray(u) || (u = []);
        var c = {object: s, json: t, idx: {}};
        c.idx.properties = {name: void 0}, c.idx.links = JSON.parse(JSON.stringify(i)), u.map((function (e, t) {
          if (o.hasOwnProperty(e.rel) && c.idx.links[o[e.rel]]) {
            var r = {};
            Object.keys(e).map((function (t, n) {
              r[t] = e[t];
            })), c.idx.links[o[e.rel]].push(r);
          }
        }));
        var l = JSON.parse(t).properties;
        for (var h in l) l.hasOwnProperty(h) && "http://packetizer.com/ns/name" === h && (c.idx.properties.name = l[h]);
        return n(c)
      }, u.prototype.lookup = function (e, t) {
        if ("string" != typeof e) throw new Error("first parameter must be a user address");
        if ("function" != typeof t) throw new Error("second parameter must be a callback");
        var r = this, n = "";
        n = e.indexOf("://") > -1 ? e.replace(/ /g, "").split("/")[2] : e.replace(/ /g, "").split("@")[1];
        var o = 0, i = "https";

        function a() {
          var t = "";
          return e.split("://")[1] || (t = "acct:"), i + "://" + n + "/.well-known/" + s[o] + "?resource=" + t + e
        }

        function u(e) {
          if (r.config.uri_fallback && "webfist.org" !== n && o !== s.length - 1) return o += 1, c();
          if (!r.config.tls_only && "https" === i) return o = 0, i = "http", c();
          if (!r.config.webfist_fallback || "webfist.org" === n) return t(e);
          o = 0, i = "http", n = "webfist.org";
          var u = a();
          r.__fetchJRD(u, t, (function (e) {
            r.__processJRD(u, e, t, (function (e) {
              "object" == typeof e.idx.links.webfist && "string" == typeof e.idx.links.webfist[0].href && r.__fetchJRD(e.idx.links.webfist[0].href, t, (function (e) {
                r.__processJRD(u, e, t, (function (e) {
                  return t(null, t)
                }));
              }));
            }));
          }));
        }

        function c() {
          var e = a();
          r.__fetchJRD(e, u, (function (n) {
            r.__processJRD(e, n, t, (function (e) {
              t(null, e);
            }));
          }));
        }

        return (r.__isLocalhost(n) && (i = "http"), setTimeout(c, 0))
      }, u.prototype.lookupLink = function (e, t, r) {
        if (!i.hasOwnProperty(t)) return r("unsupported rel " + t);
        this.lookup(e, (function (e, n) {
          var o = n.idx.links[t];
          return e ? r(e) : 0 === o.length ? r('no links found with rel="' + t + '"') : r(null, o[0])
        }));
      }, void 0 === (n = function () {
        return u
      }.apply(t, [])) || (e.exports = n);
    }();
  }, function (e, t) {
    e.exports = XMLHttpRequest;
  }, function (e, t, r) {

    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o = r(0), i = r(1), s = r(28), a = r(3), u = {
      features: [], featuresDone: 0, readyFired: !1, loadFeatures: function () {
        var e = this;
        for (var t in this.features = [], this.featuresDone = 0, this.readyFired = !1, this.featureModules = {
          WireClient: r(6),
          Dropbox: r(11),
          GoogleDrive: r(13),
          Access: r(15),
          Discover: r(14),
          Authorize: r(4),
          BaseClient: r(5),
          Env: r(12)
        }, a.cache && o.extend(this.featureModules, {
          Caching: r(16),
          IndexedDB: r(29),
          LocalStorage: r(30),
          InMemoryStorage: r(31),
          Sync: r(7)
        }), a.disableFeatures.forEach((function (t) {
          e.featureModules[t] && delete e.featureModules[t];
        })), this._allLoaded = !1, this.featureModules) this.loadFeature(t);
      }, hasFeature: function (e) {
        for (var t = this.features.length - 1; t >= 0; t--) if (this.features[t].name === e) return this.features[t].supported;
        return !1
      }, loadFeature: function (e) {
        var t = this, r = this.featureModules[e], o = !r._rs_supported || r._rs_supported();
        i("[RemoteStorage] [FEATURE ".concat(e, "] initializing ...")), "object" === n(o) ? o.then((function () {
          t.featureSupported(e, !0), t.initFeature(e);
        }), (function () {
          t.featureSupported(e, !1);
        })) : "boolean" == typeof o ? (this.featureSupported(e, o), o && this.initFeature(e)) : this.featureSupported(e, !1);
      }, initFeature: function (e) {
        var t, r = this, o = this.featureModules[e];
        try {
          t = o._rs_init(this);
        } catch (t) {
          return void this.featureFailed(e, t)
        }
        "object" === n(t) && "function" == typeof t.then ? t.then((function () {
          r.featureInitialized(e);
        }), (function (t) {
          r.featureFailed(e, t);
        })) : this.featureInitialized(e);
      }, featureFailed: function (e, t) {
        i("[RemoteStorage] [FEATURE ".concat(e, "] initialization failed (").concat(t, ")")), this.featureDone();
      }, featureSupported: function (e, t) {
        i("[RemoteStorage] [FEATURE ".concat(e, "]  ").concat(t ? "" : " not", " supported")), t || this.featureDone();
      }, featureInitialized: function (e) {
        i("[RemoteStorage] [FEATURE ".concat(e, "] initialized.")), this.features.push({
          name: e,
          init: this.featureModules[e]._rs_init,
          supported: !0,
          cleanup: this.featureModules[e]._rs_cleanup
        }), this.featureDone();
      }, featureDone: function () {
        this.featuresDone++, this.featuresDone === Object.keys(this.featureModules).length && setTimeout(this.featuresLoaded.bind(this), 0);
      }, _setCachingModule: function () {
        var e = this;
        ["IndexedDB", "LocalStorage", "InMemoryStorage"].some((function (t) {
          if (e.features.some((function (e) {
            return e.name === t
          }))) return e.features.local = e.featureModules[t], !0
        }));
      }, _fireReady: function () {
        try {
          this.readyFired || (this._emit("ready"), this.readyFired = !0);
        } catch (e) {
          console.error("'ready' failed: ", e, e.stack), this._emit("error", e);
        }
      }, featuresLoaded: function () {
        var e = this;
        i("[REMOTESTORAGE] All features loaded !"), this._setCachingModule(), this.local = a.cache && this.features.local && new this.features.local, this.local && this.remote ? (this._setGPD(s, this), this._bindChange(this.local)) : this.remote && this._setGPD(this.remote, this.remote), this.remote && (this.remote.on("connected", (function () {
          e._fireReady(), e._emit("connected");
        })), this.remote.on("not-connected", (function () {
          e._fireReady(), e._emit("not-connected");
        })), this.remote.connected && (this._fireReady(), this._emit("connected")), this.hasFeature("Authorize") || this.remote.stopWaitingForToken()), this._collectCleanupFunctions();
        try {
          this._allLoaded = !0, this._emit("features-loaded");
        } catch (e) {
          o.logError(e), this._emit("error", e);
        }
        this._processPending();
      }, _collectCleanupFunctions: function () {
        this._cleanups = [];
        for (var e = 0; e < this.features.length; e++) {
          var t = this.features[e].cleanup;
          "function" == typeof t && this._cleanups.push(t);
        }
      }
    };
    e.exports = u;
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o = r(1);

    function i(e) {
      return "dropbox" === this.backend && e.match(/^\/public\/.*[^\/]$/)
    }

    var s = {
      get: function (e, t) {
        if (this.local) {
          if (void 0 === t) t = "object" === n((r = this).remote) && r.remote.connected && r.remote.online ? 2 * r.getSyncInterval() : (o("Not setting default maxAge, because remote is offline or not connected"), !1); else if ("number" != typeof t && !1 !== t) return Promise.reject("Argument 'maxAge' must be 'false' or a number");
          return this.local.get(e, t, this.sync.queueGetRequest.bind(this.sync))
        }
        return this.remote.get(e);
        var r;
      }, put: function (e, t, r) {
        return i.bind(this)(e) ? s._wrapBusyDone.call(this, this.remote.put(e, t, r)) : this.local ? this.local.put(e, t, r) : s._wrapBusyDone.call(this, this.remote.put(e, t, r))
      }, delete: function (e) {
        return this.local ? this.local.delete(e) : s._wrapBusyDone.call(this, this.remote.delete(e))
      }, _wrapBusyDone: function (e) {
        var t = this;
        return this._emit("wire-busy"), e.then((function (e) {
          return t._emit("wire-done", {success: !0}), Promise.resolve(e)
        }), (function (e) {
          return t._emit("wire-done", {success: !1}), Promise.reject(e)
        }))
      }
    };
    e.exports = s;
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o, i = r(1), s = r(8), a = r(2), u = r(0), c = function (e) {
      this.db = e || o, this.db ? (s(this), a(this, "change", "local-events-done"), this.getsRunning = 0, this.putsRunning = 0, this.changesQueued = {}, this.changesRunning = {}) : i("[IndexedDB] Failed to open DB");
    };
    c.prototype = {
      getNodes: function (e) {
        for (var t = [], r = {}, n = 0, o = e.length; n < o; n++) void 0 !== this.changesQueued[e[n]] ? r[e[n]] = u.deepClone(this.changesQueued[e[n]] || void 0) : void 0 !== this.changesRunning[e[n]] ? r[e[n]] = u.deepClone(this.changesRunning[e[n]] || void 0) : t.push(e[n]);
        return t.length > 0 ? this.getNodesFromDb(t).then((function (e) {
          for (var t in r) e[t] = r[t];
          return e
        })) : Promise.resolve(r)
      }, setNodes: function (e) {
        for (var t in e) this.changesQueued[t] = e[t] || !1;
        return this.maybeFlush(), Promise.resolve()
      }, maybeFlush: function () {
        0 === this.putsRunning ? this.flushChangesQueued() : this.commitSlownessWarning || (this.commitSlownessWarning = setInterval((function () {
          console.warn("WARNING: waited more than 10 seconds for previous commit to finish");
        }), 1e4));
      }, flushChangesQueued: function () {
        this.commitSlownessWarning && (clearInterval(this.commitSlownessWarning), this.commitSlownessWarning = null), Object.keys(this.changesQueued).length > 0 && (this.changesRunning = this.changesQueued, this.changesQueued = {}, this.setNodesInDb(this.changesRunning).then(this.flushChangesQueued.bind(this)));
      }, getNodesFromDb: function (e) {
        var t = this;
        return new Promise((function (r, n) {
          var o = t.db.transaction(["nodes"], "readonly"), i = o.objectStore("nodes"), s = {};
          t.getsRunning++, e.map((function (e) {
            i.get(e).onsuccess = function (t) {
              s[e] = t.target.result;
            };
          })), o.oncomplete = function () {
            r(s), this.getsRunning--;
          }.bind(t), o.onerror = o.onabort = function () {
            n("get transaction error/abort"), this.getsRunning--;
          }.bind(t);
        }))
      }, setNodesInDb: function (e) {
        var t = this;
        return new Promise((function (r, o) {
          var s = t.db.transaction(["nodes"], "readwrite"), a = s.objectStore("nodes"), u = (new Date).getTime();
          for (var c in t.putsRunning++, i("[IndexedDB] Starting put", e, t.putsRunning), e) {
            var l = e[c];
            if ("object" === n(l)) try {
              a.put(l);
            } catch (e) {
              throw i("[IndexedDB] Error while putting", l, e), e
            } else try {
              a.delete(c);
            } catch (e) {
              throw i("[IndexedDB] Error while removing", a, l, e), e
            }
          }
          s.oncomplete = function () {
            this.putsRunning--, i("[IndexedDB] Finished put", e, this.putsRunning, (new Date).getTime() - u + "ms"), r();
          }.bind(t), s.onerror = function () {
            this.putsRunning--, o("transaction error");
          }.bind(t), s.onabort = function () {
            o("transaction abort"), this.putsRunning--;
          }.bind(t);
        }))
      }, reset: function (e) {
        var t = this, r = this.db.name;
        this.db.close(), c.clean(this.db.name, (function () {
          c.open(r, (function (r, n) {
            r ? i("[IndexedDB] Error while resetting local storage", r) : t.db = n, "function" == typeof e && e(self);
          }));
        }));
      }, forAllNodes: function (e) {
        var t = this;
        return new Promise((function (r) {
          t.db.transaction(["nodes"], "readonly").objectStore("nodes").openCursor().onsuccess = function (n) {
            var o = n.target.result;
            o ? (e(t.migrate(o.value)), o.continue()) : r();
          };
        }))
      }, closeDB: function () {
        0 === this.putsRunning ? this.db.close() : setTimeout(this.closeDB.bind(this), 100);
      }
    }, c.open = function (e, t) {
      var r = setTimeout((function () {
        t("timeout trying to open db");
      }), 1e4);
      try {
        var n = indexedDB.open(e, 2);
        n.onerror = function () {
          i("[IndexedDB] Opening DB failed", n), clearTimeout(r), t(n.error);
        }, n.onupgradeneeded = function (e) {
          var t = n.result;
          i("[IndexedDB] Upgrade: from ", e.oldVersion, " to ", e.newVersion), 1 !== e.oldVersion && (i("[IndexedDB] Creating object store: nodes"), t.createObjectStore("nodes", {keyPath: "path"})), i("[IndexedDB] Creating object store: changes"), t.createObjectStore("changes", {keyPath: "path"});
        }, n.onsuccess = function () {
          clearTimeout(r);
          var o = n.result;
          if (!o.objectStoreNames.contains("nodes") || !o.objectStoreNames.contains("changes")) return i("[IndexedDB] Missing object store. Resetting the database."), void c.clean(e, (function () {
            c.open(e, t);
          }));
          t(null, n.result);
        };
      } catch (n) {
        i("[IndexedDB] Failed to open database: " + n), i("[IndexedDB] Resetting database and trying again."), clearTimeout(r), c.clean(e, (function () {
          c.open(e, t);
        }));
      }
    }, c.clean = function (e, t) {
      var r = indexedDB.deleteDatabase(e);
      r.onsuccess = function () {
        i("[IndexedDB] Done removing DB"), t();
      }, r.onerror = r.onabort = function (t) {
        console.error('Failed to remove database "' + e + '"', t);
      };
    }, c._rs_init = function (e) {
      return new Promise((function (t, r) {
        c.open("remotestorage", (function (n, i) {
          n ? r(n) : (o = i, i.onerror = function () {
            e._emit("error", n);
          }, t());
        }));
      }))
    }, c._rs_supported = function () {
      return new Promise((function (e, t) {
        var r = u.getGlobalContext(), n = !1;
        if ("undefined" != typeof navigator && navigator.userAgent.match(/Android (2|3|4\.[0-3])/) && (navigator.userAgent.match(/Chrome|Firefox/) || (n = !0)), "indexedDB" in r && !n) try {
          var o = indexedDB.open("rs-check");
          o.onerror = function () {
            t();
          }, o.onsuccess = function () {
            o.result.close(), indexedDB.deleteDatabase("rs-check"), e();
          };
        } catch (e) {
          t();
        } else t();
      }))
    }, c._rs_cleanup = function (e) {
      return new Promise((function (t) {
        e.local && e.local.closeDB(), c.clean("remotestorage", t);
      }))
    }, e.exports = c;
  }, function (e, t, r) {
    var n = r(8), o = r(1), i = r(2), s = r(0), a = "remotestorage:cache:nodes:", u = function () {
      n(this), o("[LocalStorage] Registering events"), i(this, "change", "local-events-done");
    };

    function c(e) {
      return e.substr(0, a.length) === a || "remotestorage:cache:changes:" === e.substr(0, "remotestorage:cache:changes:".length)
    }

    u.prototype = {
      getNodes: function (e) {
        for (var t = {}, r = 0, n = e.length; r < n; r++) try {
          t[e[r]] = JSON.parse(localStorage[a + e[r]]);
        } catch (n) {
          t[e[r]] = void 0;
        }
        return Promise.resolve(t)
      }, setNodes: function (e) {
        for (var t in e) localStorage[a + t] = JSON.stringify(e[t]);
        return Promise.resolve()
      }, forAllNodes: function (e) {
        for (var t, r = 0, n = localStorage.length; r < n; r++) if (localStorage.key(r).substr(0, a.length) === a) {
          try {
            t = this.migrate(JSON.parse(localStorage[localStorage.key(r)]));
          } catch (e) {
            t = void 0;
          }
          t && e(t);
        }
        return Promise.resolve()
      }
    }, u._rs_init = function () {
    }, u._rs_supported = function () {
      return s.localStorageAvailable()
    }, u._rs_cleanup = function () {
      for (var e = [], t = 0, r = localStorage.length; t < r; t++) {
        var n = localStorage.key(t);
        c(n) && e.push(n);
      }
      e.forEach((function (e) {
        o("[LocalStorage] Removing", e), delete localStorage[e];
      }));
    }, e.exports = u;
  }, function (e, t, r) {
    var n = r(2), o = r(1), i = r(8), s = function () {
      i(this), o("[InMemoryStorage] Registering events"), n(this, "change", "local-events-done"), this._storage = {};
    };
    s.prototype = {
      getNodes: function (e) {
        for (var t = {}, r = 0, n = e.length; r < n; r++) t[e[r]] = this._storage[e[r]];
        return Promise.resolve(t)
      }, setNodes: function (e) {
        for (var t in e) void 0 === e[t] ? delete this._storage[t] : this._storage[t] = e[t];
        return Promise.resolve()
      }, forAllNodes: function (e) {
        for (var t in this._storage) e(this.migrate(this._storage[t]));
        return Promise.resolve()
      }
    }, s._rs_init = function () {
    }, s._rs_supported = function () {
      return !0
    }, s._rs_cleanup = function () {
    }, e.exports = s;
  }, function (e, t, r) {
    var n = r(5), o = r(9);
    o.prototype.addModule = function (e) {
      var t = e.name, r = e.builder;
      if (Object.defineProperty(this, t, {
        configurable: !0, get: function () {
          var e = this._loadModule(t, r);
          return Object.defineProperty(this, t, {value: e}), e
        }
      }), -1 !== t.indexOf("-")) {
        var n = t.replace(/\-[a-z]/g, (function (e) {
          return e[1].toUpperCase()
        }));
        Object.defineProperty(this, n, {
          get: function () {
            return this[t]
          }
        });
      }
    }, o.prototype._loadModule = function (e, t) {
      if (t) return t(new n(this, "/" + e + "/"), new n(this, "/public/" + e + "/")).exports;
      throw "Unknown module: " + e
    };
  }])
}));

let RemoteStorage = exports.RemoteStorage;

const remoteStorage = new RemoteStorage();
remoteStorage.setSyncInterval(360000);
remoteStorage.setApiKeys({
  dropbox: 'vn0fct0a7i84a9l',
  googledrive: '817985380080-38u25eathssicikju2qiqngmuk2u4qgg.apps.googleusercontent.com'
});
remoteStorage.access.claim('LiturgicalPrayerApp', 'rw');
remoteStorage.caching.enable('/LiturgicalPrayerApp/');

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

const Content = {"Bibles":[{"id":"de4e12af7f28f599-02","dblId":"de4e12af7f28f599","relatedDbl":null,"name":"King James (Authorised) Version","nameLocal":"King James Version","abbreviation":"engKJV","abbreviationLocal":"KJV","description":"Protestant","descriptionLocal":"Protestant","language":{"id":"eng","name":"English","nameLocal":"English","script":"Latin","scriptDirection":"LTR"},"countries":[{"id":"GB","name":"United Kingdom","nameLocal":"United Kingdom"}],"type":"text","updatedAt":"2020-02-25T07:04:57.000Z","audioBibles":[],"books":[{"id":"GEN","bibleId":"de4e12af7f28f599-02","abbreviation":"Gen","name":"Genesis","nameLong":"The First Book of Moses, called Genesis"},{"id":"EXO","bibleId":"de4e12af7f28f599-02","abbreviation":"Exo","name":"Exodus","nameLong":"The Second Book of Moses, called Exodus"},{"id":"LEV","bibleId":"de4e12af7f28f599-02","abbreviation":"Lev","name":"Leviticus","nameLong":"The Third Book of Moses, called Leviticus"},{"id":"NUM","bibleId":"de4e12af7f28f599-02","abbreviation":"Num","name":"Numbers","nameLong":"The Fourth Book of Moses, called Numbers"},{"id":"DEU","bibleId":"de4e12af7f28f599-02","abbreviation":"Deu","name":"Deuteronomy","nameLong":"The Fifth Book of Moses, called Deuteronomy"},{"id":"JOS","bibleId":"de4e12af7f28f599-02","abbreviation":"Jos","name":"Joshua","nameLong":"The Book of Joshua"},{"id":"JDG","bibleId":"de4e12af7f28f599-02","abbreviation":"Jdg","name":"Judges","nameLong":"The Book of Judges"},{"id":"RUT","bibleId":"de4e12af7f28f599-02","abbreviation":"Rut","name":"Ruth","nameLong":"The Book of Ruth"},{"id":"1SA","bibleId":"de4e12af7f28f599-02","abbreviation":"1Sa","name":"1 Samuel","nameLong":"The First Book of Samuel Otherwise Called The First Book of the Kings"},{"id":"2SA","bibleId":"de4e12af7f28f599-02","abbreviation":"2Sa","name":"2 Samuel","nameLong":"The Second Book of Samuel Otherwise Called The Second Book of the Kings"},{"id":"1KI","bibleId":"de4e12af7f28f599-02","abbreviation":"1Ki","name":"1 Kings","nameLong":"The First Book of the Kings, Commonly Called the Third Book of the Kings"},{"id":"2KI","bibleId":"de4e12af7f28f599-02","abbreviation":"2Ki","name":"2 Kings","nameLong":"The Second Book of the Kings, Commonly Called the Fourth Book of the Kings"},{"id":"1CH","bibleId":"de4e12af7f28f599-02","abbreviation":"1Ch","name":"1 Chronicles","nameLong":"The First Book of the Chronicles"},{"id":"2CH","bibleId":"de4e12af7f28f599-02","abbreviation":"2Ch","name":"2 Chronicles","nameLong":"The Second Book of the Chronicles"},{"id":"EZR","bibleId":"de4e12af7f28f599-02","abbreviation":"Ezr","name":"Ezra","nameLong":"Ezra"},{"id":"NEH","bibleId":"de4e12af7f28f599-02","abbreviation":"Neh","name":"Nehemiah","nameLong":"The Book of Nehemiah"},{"id":"EST","bibleId":"de4e12af7f28f599-02","abbreviation":"Est","name":"Esther","nameLong":"The Book of Esther"},{"id":"JOB","bibleId":"de4e12af7f28f599-02","abbreviation":"Job","name":"Job","nameLong":"The Book of Job"},{"id":"PSA","bibleId":"de4e12af7f28f599-02","abbreviation":"Psa","name":"Psalms","nameLong":"The Book of Psalms","chapters":[{"id":"PSA.1","bibleId":"de4e12af7f28f599-02","number":"1","bookId":"PSA","reference":"Psalms 1","copyright":"PUBLIC DOMAIN except in the United Kingdom, where a Crown Copyright applies to printing the KJV. See http://www.cambridge.org/about-us/who-we-are/queens-printers-patent","content":"<p class=\"q1\"><span data-number=\"1\" class=\"v\">1</span>Blessed <span class=\"add\">is</span> the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.</p><p class=\"q1\"><span data-number=\"2\" class=\"v\">2</span>But his delight <span class=\"add\">is</span> in the law of the <span class=\"nd\">LORD</span>; and in his law doth he meditate day and night.</p><p class=\"q1\"><span data-number=\"3\" class=\"v\">3</span>And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper.</p><p class=\"b\"></p><p class=\"q1\"><span data-number=\"4\" class=\"v\">4</span>The ungodly <span class=\"add\">are</span> not so: but <span class=\"add\">are</span> like the chaff which the wind driveth away.</p><p class=\"q1\"><span data-number=\"5\" class=\"v\">5</span>Therefore the ungodly shall not stand in the judgment, nor sinners in the congregation of the righteous.</p><p class=\"q1\"><span data-number=\"6\" class=\"v\">6</span>For the <span class=\"nd\">LORD</span> knoweth the way of the righteous: but the way of the ungodly shall perish.</p>","next":{"id":"PSA.2","number":"2","bookId":"PSA"},"previous":{"id":"PSA.intro","number":"intro","bookId":"PSA"}},{"id":"PSA.2","bibleId":"de4e12af7f28f599-02","number":"2","bookId":"PSA","reference":"Psalms 2","copyright":"PUBLIC DOMAIN except in the United Kingdom, where a Crown Copyright applies to printing the KJV. See http://www.cambridge.org/about-us/who-we-are/queens-printers-patent","content":"<p class=\"q1\"><span data-number=\"1\" class=\"v\">1</span>Why do the heathen rage, and the people imagine a vain thing?</p><p class=\"q1\"><span data-number=\"2\" class=\"v\">2</span>The kings of the earth set themselves, and the rulers take counsel together, against the <span class=\"nd\">LORD</span>, and against his anointed, <span class=\"add\">saying</span>,</p><p class=\"q1\"><span data-number=\"3\" class=\"v\">3</span>Let us break their bands asunder, and cast away their cords from us.</p><p class=\"q1\"><span data-number=\"4\" class=\"v\">4</span>He that sitteth in the heavens shall laugh: the Lord shall have them in derision.</p><p class=\"q1\"><span data-number=\"5\" class=\"v\">5</span>Then shall he speak unto them in his wrath, and vex them in his sore displeasure.</p><p class=\"q1\"><span data-number=\"6\" class=\"v\">6</span>Yet have I set my king upon my holy hill of Zion.</p><p class=\"b\"></p><p class=\"q1\"><span data-number=\"7\" class=\"v\">7</span>I will declare the decree: the <span class=\"nd\">LORD</span> hath said unto me, Thou <span class=\"add\">art</span> my Son; this day have I begotten thee.</p><p class=\"q1\"><span data-number=\"8\" class=\"v\">8</span>Ask of me, and I shall give <span class=\"add\">thee</span> the heathen <span class=\"add\">for</span> thine inheritance, and the uttermost parts of the earth <span class=\"add\">for</span> thy possession.</p><p class=\"q1\"><span data-number=\"9\" class=\"v\">9</span>Thou shalt break them with a rod of iron; thou shalt dash them in pieces like a potter’s vessel.</p><p class=\"b\"></p><p class=\"q1\"><span data-number=\"10\" class=\"v\">10</span>Be wise now therefore, O ye kings: be instructed, ye judges of the earth.</p><p class=\"q1\"><span data-number=\"11\" class=\"v\">11</span>Serve the <span class=\"nd\">LORD</span> with fear, and rejoice with trembling.</p><p class=\"q1\"><span data-number=\"12\" class=\"v\">12</span>Kiss the Son, lest he be angry, and ye perish <span class=\"add\">from</span> the way, when his wrath is kindled but a little. Blessed <span class=\"add\">are</span> all they that put their trust in him.</p>","next":{"id":"PSA.3","number":"3","bookId":"PSA"},"previous":{"id":"PSA.1","number":"1","bookId":"PSA"}}]},{"id":"PRO","bibleId":"de4e12af7f28f599-02","abbreviation":"Pro","name":"Proverbs","nameLong":"The Proverbs"},{"id":"ECC","bibleId":"de4e12af7f28f599-02","abbreviation":"Ecc","name":"Ecclesiastes","nameLong":"Ecclesiastes or, the Preacher"},{"id":"SNG","bibleId":"de4e12af7f28f599-02","abbreviation":"Sng","name":"Song of Solomon","nameLong":"The Song of Solomon"},{"id":"ISA","bibleId":"de4e12af7f28f599-02","abbreviation":"Isa","name":"Isaiah","nameLong":"The Book of the Prophet Isaiah"},{"id":"JER","bibleId":"de4e12af7f28f599-02","abbreviation":"Jer","name":"Jeremiah","nameLong":"The Book of the Prophet Jeremiah"},{"id":"LAM","bibleId":"de4e12af7f28f599-02","abbreviation":"Lam","name":"Lamentations","nameLong":"The Lamentations of Jeremiah"},{"id":"EZK","bibleId":"de4e12af7f28f599-02","abbreviation":"Ezk","name":"Ezekiel","nameLong":"The Book of the Prophet Ezekiel"},{"id":"DAN","bibleId":"de4e12af7f28f599-02","abbreviation":"Dan","name":"Daniel","nameLong":"The Book of Daniel"},{"id":"HOS","bibleId":"de4e12af7f28f599-02","abbreviation":"Hos","name":"Hosea","nameLong":"Hosea"},{"id":"JOL","bibleId":"de4e12af7f28f599-02","abbreviation":"Jol","name":"Joel","nameLong":"Joel"},{"id":"AMO","bibleId":"de4e12af7f28f599-02","abbreviation":"Amo","name":"Amos","nameLong":"Amos"},{"id":"OBA","bibleId":"de4e12af7f28f599-02","abbreviation":"Oba","name":"Obadiah","nameLong":"Obadiah"},{"id":"JON","bibleId":"de4e12af7f28f599-02","abbreviation":"Jon","name":"Jonah","nameLong":"Jonah"},{"id":"MIC","bibleId":"de4e12af7f28f599-02","abbreviation":"Mic","name":"Micah","nameLong":"Micah"},{"id":"NAM","bibleId":"de4e12af7f28f599-02","abbreviation":"Nam","name":"Nahum","nameLong":"Nahum"},{"id":"HAB","bibleId":"de4e12af7f28f599-02","abbreviation":"Hab","name":"Habakkuk","nameLong":"Habakkuk"},{"id":"ZEP","bibleId":"de4e12af7f28f599-02","abbreviation":"Zep","name":"Zephaniah","nameLong":"Zephaniah"},{"id":"HAG","bibleId":"de4e12af7f28f599-02","abbreviation":"Hag","name":"Haggai","nameLong":"Haggai"},{"id":"ZEC","bibleId":"de4e12af7f28f599-02","abbreviation":"Zec","name":"Zechariah","nameLong":"Zechariah"},{"id":"MAL","bibleId":"de4e12af7f28f599-02","abbreviation":"Mal","name":"Malachi","nameLong":"Malachi"},{"id":"MAT","bibleId":"de4e12af7f28f599-02","abbreviation":"Mat","name":"Matthew","nameLong":"THE GOSPEL ACCORDING TO ST. MATTHEW"},{"id":"MRK","bibleId":"de4e12af7f28f599-02","abbreviation":"Mrk","name":"Mark","nameLong":"THE GOSPEL ACCORDING TO ST. MARK"},{"id":"LUK","bibleId":"de4e12af7f28f599-02","abbreviation":"Luk","name":"Luke","nameLong":"THE GOSPEL ACCORDING TO ST. LUKE"},{"id":"JHN","bibleId":"de4e12af7f28f599-02","abbreviation":"Jhn","name":"John","nameLong":"THE GOSPEL ACCORDING TO ST. JOHN"},{"id":"ACT","bibleId":"de4e12af7f28f599-02","abbreviation":"Act","name":"Acts","nameLong":"THE ACTS OF THE APOSTLES"},{"id":"ROM","bibleId":"de4e12af7f28f599-02","abbreviation":"Rom","name":"Romans","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE ROMANS"},{"id":"1CO","bibleId":"de4e12af7f28f599-02","abbreviation":"1Co","name":"1 Corinthians","nameLong":"THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS"},{"id":"2CO","bibleId":"de4e12af7f28f599-02","abbreviation":"2Co","name":"2 Corinthians","nameLong":"THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS"},{"id":"GAL","bibleId":"de4e12af7f28f599-02","abbreviation":"Gal","name":"Galatians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE GALATIANS"},{"id":"EPH","bibleId":"de4e12af7f28f599-02","abbreviation":"Eph","name":"Ephesians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE EPHESIANS"},{"id":"PHP","bibleId":"de4e12af7f28f599-02","abbreviation":"Php","name":"Philippians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE PHILIPPIANS"},{"id":"COL","bibleId":"de4e12af7f28f599-02","abbreviation":"Col","name":"Colossians","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE COLOSSIANS"},{"id":"1TH","bibleId":"de4e12af7f28f599-02","abbreviation":"1Th","name":"1 Thessalonians","nameLong":"THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS"},{"id":"2TH","bibleId":"de4e12af7f28f599-02","abbreviation":"2Th","name":"2 Thessalonians","nameLong":"THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS"},{"id":"1TI","bibleId":"de4e12af7f28f599-02","abbreviation":"1Ti","name":"1 Timothy","nameLong":"THE FIRST EPISTLE OF PAUL THE APOSTLE TO TIMOTHY"},{"id":"2TI","bibleId":"de4e12af7f28f599-02","abbreviation":"2Ti","name":"2 Timothy","nameLong":"THE SECOND EPISTLE OF PAUL THE APOSTLE TO TIMOTHY"},{"id":"TIT","bibleId":"de4e12af7f28f599-02","abbreviation":"Tit","name":"Titus","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO TITUS"},{"id":"PHM","bibleId":"de4e12af7f28f599-02","abbreviation":"Phm","name":"Philemon","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO PHILEMON"},{"id":"HEB","bibleId":"de4e12af7f28f599-02","abbreviation":"Heb","name":"Hebrews","nameLong":"THE EPISTLE OF PAUL THE APOSTLE TO THE HEBREWS"},{"id":"JAS","bibleId":"de4e12af7f28f599-02","abbreviation":"Jas","name":"James","nameLong":"THE GENERAL EPISTLE OF JAMES"},{"id":"1PE","bibleId":"de4e12af7f28f599-02","abbreviation":"1Pe","name":"1 Peter","nameLong":"THE FIRST EPISTLE GENERAL OF PETER"},{"id":"2PE","bibleId":"de4e12af7f28f599-02","abbreviation":"2Pe","name":"2 Peter","nameLong":"THE SECOND EPISTLE GENERAL OF PETER"},{"id":"1JN","bibleId":"de4e12af7f28f599-02","abbreviation":"1Jn","name":"1 John","nameLong":"THE FIRST EPISTLE GENERAL OF JOHN"},{"id":"2JN","bibleId":"de4e12af7f28f599-02","abbreviation":"2Jn","name":"2 John","nameLong":"THE SECOND EPISTLE OF JOHN"},{"id":"3JN","bibleId":"de4e12af7f28f599-02","abbreviation":"3Jn","name":"3 John","nameLong":"THE THIRD EPISTLE OF JOHN"},{"id":"JUD","bibleId":"de4e12af7f28f599-02","abbreviation":"Jud","name":"Jude","nameLong":"THE GENERAL EPISTLE OF JUDE"},{"id":"REV","bibleId":"de4e12af7f28f599-02","abbreviation":"Rev","name":"Revelation","nameLong":"THE REVELATION OF ST. JOHN THE DIVINE"}]},{"id":"9879dbb7cfe39e4d-04","dblId":"9879dbb7cfe39e4d","relatedDbl":null,"name":"World English Bible","nameLocal":"World English Bible","abbreviation":"WEB","abbreviationLocal":"WEB","description":"Protestant","descriptionLocal":"Protestant","language":{"id":"eng","name":"English","nameLocal":"English","script":"Latin","scriptDirection":"LTR"},"countries":[{"id":"US","name":"United States","nameLocal":"United States"}],"type":"text","updatedAt":"2020-05-05T13:23:59.000Z","audioBibles":[{"id":"105a06b6146d11e7-01","name":"English - World English Bible (NT)","nameLocal":"English - World English Bible (NT)","dblId":"105a06b6146d11e7"}],"books":[{"id":"GEN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Genesis","name":"Genesis","nameLong":"The First Book of Moses, Commonly Called Genesis"},{"id":"EXO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Exodus","name":"Exodus","nameLong":"The Second Book of Mosis, Commonly Called Exodus"},{"id":"LEV","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Leviticus","name":"Leviticus","nameLong":"The Third Book of Mosis, Commonly Called Leviticus"},{"id":"NUM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Numbers","name":"Numbers","nameLong":"The Fourth Book of Moses, Commonly Called Numbers"},{"id":"DEU","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Deuteronomy","name":"Deuteronomy","nameLong":"The Fifth Book of Moses, Commonly Called Deuteronomy"},{"id":"JOS","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Joshua","name":"Joshua","nameLong":"The Book of Joshua"},{"id":"JDG","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Judges","name":"Judges","nameLong":"The Book of Judges"},{"id":"RUT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ruth","name":"Ruth","nameLong":"The Book of Ruth"},{"id":"1SA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Samuel","name":"1 Samuel","nameLong":"The First Book of Samuel"},{"id":"2SA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Samuel","name":"2 Samuel","nameLong":"The Second Book of Samuel"},{"id":"1KI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Kings","name":"1 Kings","nameLong":"The First Book of Kings"},{"id":"2KI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Kings","name":"2 Kings","nameLong":"The Second Book of Kings"},{"id":"1CH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Chronicles","name":"1 Chronicles","nameLong":"The First Book of Chronicles"},{"id":"2CH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Chronicles","name":"2 Chronicles","nameLong":"The Second Book of Chronicles"},{"id":"EZR","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ezra","name":"Ezra","nameLong":"The Book of Ezra"},{"id":"NEH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Nehemiah","name":"Nehemiah","nameLong":"The Book of Nehemiah"},{"id":"EST","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Esther","name":"Esther","nameLong":"The Book of Esther"},{"id":"JOB","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Job","name":"Job","nameLong":"The Book of Job"},{"id":"PSA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Psalm","name":"Psalms","nameLong":"The Psalms","chapters":[{"id":"PSA.1","bibleId":"9879dbb7cfe39e4d-04","number":"1","bookId":"PSA","reference":"Psalms 1","copyright":"\n          PUBLIC DOMAIN\n        ","content":"<p class=\"ms1\">BOOK 1</p><p class=\"q1\"><span data-number=\"1\" data-sid=\"PSA 1:1\" class=\"v\">1</span>Blessed is the man who doesn’t walk in the counsel of the wicked,</p><p data-vid=\"PSA 1:1\" class=\"q2\">nor stand on the path of sinners,</p><p data-vid=\"PSA 1:1\" class=\"q2\">nor sit in the seat of scoffers;</p><p class=\"q1\"><span data-number=\"2\" data-sid=\"PSA 1:2\" class=\"v\">2</span>but his delight is in Yahweh’s law.</p><p data-vid=\"PSA 1:2\" class=\"q2\">On his law he meditates day and night.</p><p class=\"q1\"><span data-number=\"3\" data-sid=\"PSA 1:3\" class=\"v\">3</span>He will be like a tree planted by the streams of water,</p><p data-vid=\"PSA 1:3\" class=\"q2\">that produces its fruit in its season,</p><p data-vid=\"PSA 1:3\" class=\"q2\">whose leaf also does not wither.</p><p data-vid=\"PSA 1:3\" class=\"q2\">Whatever he does shall prosper.</p><p class=\"q1\"><span data-number=\"4\" data-sid=\"PSA 1:4\" class=\"v\">4</span>The wicked are not so,</p><p data-vid=\"PSA 1:4\" class=\"q2\">but are like the chaff which the wind drives away.</p><p class=\"q1\"><span data-number=\"5\" data-sid=\"PSA 1:5\" class=\"v\">5</span>Therefore the wicked shall not stand in the judgment,</p><p data-vid=\"PSA 1:5\" class=\"q2\">nor sinners in the congregation of the righteous.</p><p class=\"q1\"><span data-number=\"6\" data-sid=\"PSA 1:6\" class=\"v\">6</span>For Yahweh knows the way of the righteous,</p><p data-vid=\"PSA 1:6\" class=\"q2\">but the way of the wicked shall perish.</p>","next":{"id":"PSA.2","number":"2","bookId":"PSA"},"previous":{"id":"PSA.intro","number":"intro","bookId":"PSA"}},{"id":"PSA.2","bibleId":"9879dbb7cfe39e4d-04","number":"2","bookId":"PSA","reference":"Psalms 2","copyright":"\n          PUBLIC DOMAIN\n        ","content":"<p class=\"q1\"><span data-number=\"1\" data-sid=\"PSA 2:1\" class=\"v\">1</span>Why do the nations rage,</p><p data-vid=\"PSA 2:1\" class=\"q2\">and the peoples plot a vain thing?</p><p class=\"q1\"><span data-number=\"2\" data-sid=\"PSA 2:2\" class=\"v\">2</span>The kings of the earth take a stand,</p><p data-vid=\"PSA 2:2\" class=\"q2\">and the rulers take counsel together,</p><p data-vid=\"PSA 2:2\" class=\"q2\">against Yahweh, and against his Anointed, saying,</p><p class=\"q1\"><span data-number=\"3\" data-sid=\"PSA 2:3\" class=\"v\">3</span>“Let’s break their bonds apart,</p><p data-vid=\"PSA 2:3\" class=\"q2\">and cast their cords from us.”</p><p class=\"q1\"><span data-number=\"4\" data-sid=\"PSA 2:4\" class=\"v\">4</span>He who sits in the heavens will laugh.</p><p data-vid=\"PSA 2:4\" class=\"q2\">The Lord will have them in derision.</p><p class=\"q1\"><span data-number=\"5\" data-sid=\"PSA 2:5\" class=\"v\">5</span>Then he will speak to them in his anger,</p><p data-vid=\"PSA 2:5\" class=\"q2\">and terrify them in his wrath:</p><p class=\"q1\"><span data-number=\"6\" data-sid=\"PSA 2:6\" class=\"v\">6</span>“Yet I have set my King on my holy hill of Zion.”</p><p class=\"q2\"><span data-number=\"7\" data-sid=\"PSA 2:7\" class=\"v\">7</span>I will tell of the decree:</p><p data-vid=\"PSA 2:7\" class=\"q1\">Yahweh said to me, “You are my son.</p><p data-vid=\"PSA 2:7\" class=\"q2\">Today I have become your father.</p><p class=\"q1\"><span data-number=\"8\" data-sid=\"PSA 2:8\" class=\"v\">8</span>Ask of me, and I will give the nations for your inheritance,</p><p data-vid=\"PSA 2:8\" class=\"q2\">the uttermost parts of the earth for your possession.</p><p class=\"q1\"><span data-number=\"9\" data-sid=\"PSA 2:9\" class=\"v\">9</span>You shall break them with a rod of iron.</p><p data-vid=\"PSA 2:9\" class=\"q2\">You shall dash them in pieces like a potter’s vessel.”</p><p class=\"q1\"><span data-number=\"10\" data-sid=\"PSA 2:10\" class=\"v\">10</span>Now therefore be wise, you kings.</p><p data-vid=\"PSA 2:10\" class=\"q2\">Be instructed, you judges of the earth.</p><p class=\"q1\"><span data-number=\"11\" data-sid=\"PSA 2:11\" class=\"v\">11</span>Serve Yahweh with fear,</p><p data-vid=\"PSA 2:11\" class=\"q2\">and rejoice with trembling.</p><p class=\"q1\"><span data-number=\"12\" data-sid=\"PSA 2:12\" class=\"v\">12</span>Give sincere homage to the Son, lest he be angry, and you perish on the way,</p><p data-vid=\"PSA 2:12\" class=\"q2\">for his wrath will soon be kindled.</p><p data-vid=\"PSA 2:12\" class=\"q2\">Blessed are all those who take refuge in him.</p>","next":{"id":"PSA.3","number":"3","bookId":"PSA"},"previous":{"id":"PSA.1","number":"1","bookId":"PSA"}}]},{"id":"PRO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Proverbs","name":"Proverbs","nameLong":"The Proverbs"},{"id":"ECC","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ecclesiastes","name":"Ecclesiastes","nameLong":"Ecclesiates or, The Preacher"},{"id":"SNG","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Song of Solomon","name":"Song of Solomon","nameLong":"The Song of Solomon"},{"id":"ISA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Isaiah","name":"Isaiah","nameLong":"The Book of Isaiah"},{"id":"JER","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Jeremiah","name":"Jeremiah","nameLong":"The Book of Jeremiah"},{"id":"LAM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Lamentations","name":"Lamentations","nameLong":"The Lamentations of Jeremiah"},{"id":"EZK","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ezekiel","name":"Ezekiel","nameLong":"The Book of Ezekiel"},{"id":"DAN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Daniel","name":"Daniel","nameLong":"The Book of Daniel"},{"id":"HOS","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Hosea","name":"Hosea","nameLong":"The Book of Hosea"},{"id":"JOL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Joel","name":"Joel","nameLong":"The Book of Joel"},{"id":"AMO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Amos","name":"Amos","nameLong":"The Book of Amos"},{"id":"OBA","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Obadiah","name":"Obadiah","nameLong":"The Book of Obadiah"},{"id":"JON","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Jonah","name":"Jonah","nameLong":"The Book of Jonah"},{"id":"MIC","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Micah","name":"Micah","nameLong":"The Book of Micah"},{"id":"NAM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Nahum","name":"Nahum","nameLong":"The Book of Nahum"},{"id":"HAB","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Habakkuk","name":"Habakkuk","nameLong":"The Book of Habakkuk"},{"id":"ZEP","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Zephaniah","name":"Zephaniah","nameLong":"The Book of Zephaniah"},{"id":"HAG","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Haggai","name":"Haggai","nameLong":"The Book of Haggai"},{"id":"ZEC","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Zechariah","name":"Zechariah","nameLong":"The Book of Zechariah"},{"id":"MAL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Malachi","name":"Malachi","nameLong":"The Book of Malachi"},{"id":"MAT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Matthew","name":"Matthew","nameLong":"The Good News According to Matthew"},{"id":"MRK","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Mark","name":"Mark","nameLong":"The Good News According to Mark"},{"id":"LUK","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Luke","name":"Luke","nameLong":"The Good News According to Luke"},{"id":"JHN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"John","name":"John","nameLong":"The Good News According to John"},{"id":"ACT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Acts","name":"Acts","nameLong":"The Acts of the Apostles"},{"id":"ROM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Romans","name":"Romans","nameLong":"Paul’s Letter to the Romans"},{"id":"1CO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Corinthians","name":"1 Corinthians","nameLong":"Paul’s First Letter to the Corinthians"},{"id":"2CO","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Corinthians","name":"2 Corinthians","nameLong":"Paul’s Second Letter to the Corinthians"},{"id":"GAL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Galatians","name":"Galatians","nameLong":"Paul’s Letter to the Galatians"},{"id":"EPH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Ephesians","name":"Ephesians","nameLong":"Paul’s Letter to the Ephesians"},{"id":"PHP","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Philippians","name":"Philippians","nameLong":"Paul’s Letter to the Philippians"},{"id":"COL","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Colossians","name":"Colossians","nameLong":"Paul’s Letter to the Colossians"},{"id":"1TH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Thessalonians","name":"1 Thessalonians","nameLong":"Paul’s First Letter to the Thessalonians"},{"id":"2TH","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Thessalonians","name":"2 Thessalonians","nameLong":"Paul’s Second Letter to the Thessalonians"},{"id":"1TI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Timothy","name":"1 Timothy","nameLong":"Paul’s First Letter to Timothy"},{"id":"2TI","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Timothy","name":"2 Timothy","nameLong":"Paul’s Second Letter to Timothy"},{"id":"TIT","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Titus","name":"Titus","nameLong":"Paul’s Letter to Titus"},{"id":"PHM","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Philemon","name":"Philemon","nameLong":"Paul’s Letter to Philemon"},{"id":"HEB","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Hebrews","name":"Hebrews","nameLong":"The Letter to the Hebrews"},{"id":"JAS","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"James","name":"James","nameLong":"The Letter from James"},{"id":"1PE","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 Peter","name":"1 Peter","nameLong":"Peter’s First Letter"},{"id":"2PE","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 Peter","name":"2 Peter","nameLong":"Peter’s Second Letter"},{"id":"1JN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"1 John","name":"1 John","nameLong":"John’s First Letter"},{"id":"2JN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"2 John","name":"2 John","nameLong":"John’s Second Letter"},{"id":"3JN","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"3 John","name":"3 John","nameLong":"John’s Third Letter"},{"id":"JUD","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Jude","name":"Jude","nameLong":"The Letter from Jude"},{"id":"REV","bibleId":"9879dbb7cfe39e4d-04","abbreviation":"Revelation","name":"Revelation","nameLong":"The Revelation to John"}]}],"Categories":[{"Title":"Morning prayer","Shuffle":"x","Enabled":"x","Description":"Something to start your day with","Morning":"x","Meal":"x","UniqueID":"EYgQr"},{"Title":"Evening Prayers","Description":"Something at the close of every day","Evening":"x","UniqueID":"mCjpL"},{"Title":"Confession","Description":"What has been going on in your life?","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"HC2KJ"},{"Title":"Opening/invocation","Description":"These words help you to start your prayer","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"MXxdX"},{"Title":"Miscellaneous","Shuffle":"x","Description":"Words by others who prayed before you","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"fzNNJ"},{"Title":"The Lord's Prayer","Enabled":"x","Description":"The prayer the Master taught","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"5VRK8"},{"Title":"The Jesus Prayer","Description":"A confession to repeat","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"IghhC"},{"Title":"Table Graces","Description":"Something to start you meal with","Meal":"x","UniqueID":"OguRv"},{"Title":"Psalms","Description":"The Book of Psalms (/sɑːmz/ or /sɔː(l)mz/ SAW(L)MZ; Hebrew: תְּהִלִּים, Tehillim, \"praises\"), commonly referred to simply as Psalms, the Psalter or \"the Psalms\", is the first book of the Ketuvim (\"Writings\"), the third section of the Hebrew Bible, and thus a book of the Christian Old Testament.","Morning":"x","Afternoon":"x","Evening":"x","Meal":"x","UniqueID":"tHAMC"}],"Moments":[{"Title":"Morning","Background":"https://i.pinimg.com/564x/1d/10/91/1d10912ac2685c9ed04a51c7c10cf9ad.jpg","Color":"#91add9","Background Color":"#f9f9ed","Starts":"07:00","Ends":"12:00","Enabled":"x","UniqueID":"bDSNg"},{"Title":"Afternoon","Background":"https://i.pinimg.com/564x/82/a8/14/82a8148e37a3dc8b09a46e1134d4f1f7.jpg","Color":"#97c2c9","Background Color":"#fefafa","Starts":"12:00","Ends":"17:00","UniqueID":"VcfiJ"},{"Title":"Evening","Background":"https://i.pinimg.com/564x/4c/14/4a/4c144a73978a6ba3ef29d884a40929e3.jpg","Color":"#ae96be","Background Color":"#deebd9","Starts":"19:00","Ends":"23:00","UniqueID":"9w1t5"},{"Title":"Meal","Background":"https://i.pinimg.com/564x/01/4f/0a/014f0ae3ce93914c31fcd64b5eaca68c.jpg","Color":"#d4a5b2","Background Color":"#edf7f4","Starts":"17:00","Ends":"19:00","UniqueID":"kgDnW"}],"Suggestions":[{"Title":"Friends","Description":"Whom do you want to pray for?","UniqueID":"v65ov"},{"Title":"Family","Description":"Who are your parents, brothers, sisters?","UniqueID":"A26w5"},{"Title":"My church","Description":"What is going on in the church?","UniqueID":"CphJj"},{"Title":"My city","Description":"What is going on in your city?","UniqueID":"rYWhp"},{"Title":"The world","Description":"What is going on in the world?","UniqueID":"Z0iLr"}],"Opening/invocation":[{"Title":"Invocation","Content":"O Lord, open my lips\nAnd my mouth shall proclaim your praise.\n\nO God, make speed to save us.\nO Lord, make haste to help us.\n\nGlory to the Father and the Son And the Holy Spirit,\nAs it was in the beginning, is now, and will be forever.\n","UniqueID":"zAwkB"}],"Morning prayer":[{"Title":"Morning Prayer (Thérèsa of Lisieux)","Content":"O my God! \nI offer You all my actions of this day \nfor the intentions and for the glory of Christ Jesus. \nI desire to sanctify every beat of my heart, \nmy every thought, my simplest works, \nby uniting them to His infinite merits; \nand I wish to make reparation for my sins \nby casting them into the furnace of His merciful love.\n\nO my God! \nI ask of You for myself and for those whom I hold dear, \nthe grace to fulfill perfectly Your holy will, \nto accept for love of You the joys and sorrows of this passing life, \nso that we may one day be united together in heaven for all eternity.\n","Author":"by Thérèse of Lisieux","UniqueID":"re3Hz"},{"Title":"Morning Prayer (George Washington)","Content":"Almighty God, and most merciful father, \r\nwho commanded the children of Israel to offer a daily sacrifice to You, \r\nthat thereby they might glorify and praise You for Your protection both night and day; \r\nreceive, O Lord, my morning sacrifice which I now offer up to You. \r\n\r\nI yield to You humble and hearty thanks that You have preserved me from the danger of the past night, \r\nand brought me to the light of the day, and the comforts thereof, \r\na day which is consecrated to Your service and for Your honor.\r\nLet my heart, therefore, Gracious God, be so affected with the glory and majesty of it, \r\nthat I may not do my own works, but wait on You, \r\nand discharge those weighty duties You require of me.\r\n\r\nAnd since You are a God of pure eyes, \r\nand will be sanctified in all who draw near to You, \r\nwho does not regard the sacrifice of fools, nor hear sinners who tread in Your courts: \r\nPardon my sins, I beseech You, \r\nremove them from Your presence, as far as the east is from the west, \r\nand accept of me for the merits of Your son Jesus Christ, \r\nthat when I come into Your temple, and compass Your altar, \r\nmy prayers may come before You as incense.\r\n\r\nAnd as You would hear me calling upon You in my prayers, \r\nso give me grace to hear You calling on me in Your word, \r\nthat it may be wisdom, righteousness, reconciliation and peace to the saving of the soul in the day of the Lord Jesus.\r\nGrant that I may hear it with reverence, receive it with meekness, mingle it with faith, and that it may accomplish in me, gracious God, the good work for which You have sent it.\r\nBless my family, kindred, friends and country, be our God,\r\nand guide this day and for ever for his sake, \r\nwho lay down in the Grave and arose again for us, Jesus Christ our Lord.\r","Author":"by George Washington","UniqueID":"xWE7D"},{"Title":"Morning Prayer","Content":"We sincerely thank You for the rest of the past night, \r\nand for the gift of a new day, \r\nwith its opportunities of pleasing You. \r\n\r\nGrant that we may spend its hours in the perfect freedom of Your service, \r\nin such a way that at eventide we may again give You thanks; \r\nthrough Jesus Christ our Lord.\r","Author":"Eastern Church","UniqueID":"fjIBB"},{"Title":"Morning Prayer","Content":"O God, who is faithful and true, \r\nwho “has mercy on thousands and ten thousands of them that love You,” \r\nthe lover of the humble, and the protector of the needy, \r\nof whom all things stand in need, for all things are subject to You; \r\n\r\nlook down upon Your people, who bow down their heads to You, \r\nand bless them with spiritual blessing. \r\n“Keep them as the apple of an eye,” \r\npreserve them in piety and righteousness, \r\nand give them eternal life in Christ Jesus Thy beloved Son, \r\nwith whom glory, honour, and worship be to Thee and to the Holy Spirit, \r\nnow and always, and forever and ever.\r","Author":"Apostolic Constitutions","UniqueID":"aHJ14"},{"Title":"The Thanksgiving for the Morning","Content":"O God, the God of spirits and of all flesh, \r\nwho is beyond compare, and stands in need of nothing, \r\nwho has given the sun to have rule over the day, \r\nand the moon and the stars to have rule over the night, \r\nnow also look down upon us with gracious eyes, \r\nand receive our morning thanksgivings, \r\nand have mercy upon us; \r\n\r\nfor we have not “spread out our hands unto a strange God;” \r\nfor there is not among us any new God, \r\nbut You, the eternal God, who is without end, \r\nwho has given us our being through Christ, \r\nand given us our well-being through Him. \r\n\r\nGrant us also, through Him, eternal life; \r\nwith whom glory, and honour, and worship \r\nbe to You and to the Holy Spirit forever.\r","Author":"Apostolic Constitutions","UniqueID":"c8XlD"},{"Title":"You Have Loved Us First","Content":"You have loved us first, O God, \r\nalas! We speak of it in terms of history \r\nas if You have only loved us first but a single time, \r\nrather than that without ceasing You have loved us first \r\nmany things and every day and our whole life through. \r\n\r\nWhen we wake up in the morning \r\nand turn our soul toward You - You are the first - \r\nYou have loved us first; \r\nif I rise at dawn \r\nand at the same second turn my soul toward You in prayer, \r\nYou are there ahead of me, \r\nYou have loved me first. \r\nWhen I withdraw from the distractions of the day \r\nand turn my soul toward You, \r\nYou are the first and thus forever. \r\n","Author":"by Sören Kierkegaard","UniqueID":"LYbQ6"},{"Title":"Each Morning Broken","Content":"Lord! \r\nMake our heart Your temple in which You live. \r\nGrant that every impure thought, \r\nevery earthly desire might be like the idol Dagon \r\n- each morning broken at the feet of the Ark of the Covenant. \r\n\r\nTeach us to master flesh and blood \r\nand let this mastery of ourselves be our bloody sacrifice \r\nin order that we might be able to say with the Apostle: \r\n\"I die every day.\"\r","Author":"by Sören Kierkegaard","UniqueID":"dFT79"}],"Evening Prayers":[{"Title":"Evening Prayer","Content":"Keep watch, dear Lord, \nwith those who work, \nor watch, \nor weep this night, \nand give your angels charge over those who sleep. \n\nTend the sick, Lord Christ; \ngive rest to the weary, \nbless\nthe dying, \nsoothe the suffering, \npity the afflicted, \nshield the joyous; \nand all for your love's sake.","Author":"by St. Augustine","UniqueID":"Z6I8C"},{"Title":"Evening Prayer","Content":"Save us, O God, and raise us up by Your Christ. \r\nLet us stand up, and beg for the mercies of the Lord, \r\nand His compassions, \r\nfor the angel of peace, \r\nfor what things are good and profitable, \r\nfor a Christian departure out of this life, \r\nan evening and a night of peace, \r\nand free from sin; \r\n\r\nand let us beg that the whole course of our life may be unblamable. \r\nLet us dedicate ourselves and one another to the living God through His Christ.\r","Author":"Apostolic Constitutions","UniqueID":"l3TBP"},{"Title":"Evening Prayer","Content":"All you children, praise the Lord: \r\nPraise the name of the Lord. \r\nWe praise You, \r\nwe sing hymns to You, \r\nwe bless You for your great glory, \r\nO Lord our King, the Father of Christ the spotless Lamb, \r\nwho takes away the sin of the world. \r\n\r\nPraise becomes You, \r\nhymns become You, \r\nglory becomes You, \r\nthe God and Father, \r\nthrough the Son, \r\nin the most holy Spirit, \r\nforever and ever.\r","Author":"Apostolic Constitutions","UniqueID":"NwaTU"}],"Psalms":[{"Title":"Psalms 1","Content":"[bible:Psalms 1]","UniqueID":"HRFEn"},{"Title":"Psalms 2","Content":"[bible:Psalms 2]","UniqueID":"2CKmX"}],"The Jesus Prayer":[{"Title":"The Jesus Prayer","Content":"Lord Jesus Christ, Son of God\nHave mercy on me, a sinner.","UniqueID":"18Rv7"}],"Confession":[{"Title":"Confession of Sins","Content":"Lord of grace and truth,\nwe confess our unworthiness\nto stand in your presence as your children.\nWe have sinned:\nforgive and heal us.\n\nThe Virgin Mary accepted your call\nto be the mother of Jesus.\nForgive our disobedience to your will.\nWe have sinned:\nforgive and heal us.\n\nYour Son our Saviour\nwas born in poverty in a manger.\nForgive our greed and rejection of your ways.\nWe have sinned:\nforgive and heal us.\n\nThe shepherds left their flocks\nto go to Bethlehem.\nForgive our self-interest and lack of vision.\nWe have sinned:\nforgive and heal us.\n\nThe wise men followed the star\nto find Jesus the King.\nForgive our reluctance to seek you.\nWe have sinned:\nforgive and heal us.\n","Author":"Book of Common Prayer","UniqueID":"gpxtG"},{"Title":"Confession of Sins","Content":"Most merciful God,\r\nwe confess that we have sinned against you\r\nin thought, word, and deed,\r\nby what we have done,\r\nand by what we have left undone.\r\n\r\nWe have not loved you with our whole heart;\r\nwe have not loved our neighbors as ourselves.\r\nWe are truly sorry and we humbly repent.\r\n\r\nFor the sake of your Son Jesus Christ,\r\nhave mercy on us and forgive us;\r\nthat we may delight in your will,\r\nand walk in your ways,\r\nto the glory of your Name. \r","Author":"Book of Common Prayer","UniqueID":"gLUDQ"},{"Title":"For Soul Cleansing","Content":"O God, who hast taught us Your divine and saving oracles, \r\nenlighten the souls of us sinners for the comprehension of the things which have been spoken before, \r\nso that we may not only be seen to be hearers of spiritual things, \r\nbut also doers of good deeds, \r\nstriving after guileless faith, blameless life, and pure conversation.\r\n\r\nRelease, pardon, and forgive, O God, all our voluntary and involuntary sins, \r\nwhich we have committed in action and in word, \r\nknowingly and ignorantly, \r\nby night and by day, in mind and thought, \r\nforgive us all in goodness and love.\r\n\r\nSanctify, O Lord, our souls, bodies and spirits; \r\nexamine our minds and search our consciences; \r\ntake from us all evil imaginations, \r\nall impurity of thought, \r\nall inclinations to lust, \r\nall depravity of conception, \r\nall envy, pride and hypocrisy, \r\nall falsehood, deceit and irregular living, \r\nall covetousness, vain glory and sloth; \r\nall malice, anger and wrath, \r\nall remembrance of injuries, \r\nall blasphemy \r\nand every motion of flesh and spirit that is contrary to the purity of Your will.\r","Author":"from the Liturgy of St. James","UniqueID":"xckM4"},{"Title":"For Pardon","Content":"O Lord, who has mercy upon all, \r\ntake away from me my sins, \r\nand mercifully set alight in me the fire of Your Holy Spirit. \r\n\r\nTake away from me the heart of stone, \r\nand give me a heart of flesh, \r\na heart to love and adore You, \r\na heart to delight in You, \r\nto follow and to enjoy You, \r\nfor Christ’s sake.\r","Author":"by Ambrose","UniqueID":"rwCaI"},{"Title":"Confession of Sins","Content":"O You who beholds all things, \r\nwe have sinned against You in thought, word, and deed; \r\nblot out our transgressions, \r\nbe merciful to us sinners, \r\nand grant that our names may be found written in the book of life, \r\nfor the sake of Christ Jesus our Saviour. \r","Author":"by Nerses of Clajes","UniqueID":"GImXH"},{"Title":"For Steadfastness","Content":"O God, the light of every heart that sees You, \r\nthe Life of every soul that loves You, \r\nthe strength of every mind that seeks You,\r\nhelp me always to continue steadfast in Your holy love. \r\n\r\nBe the joy of my heart; \r\ntake it all for Yourself, and abide in it. \r\nThe house of my soul is, I confess, too narrow for You; \r\nenlarge it, that You may enter in; \r\nit is ruinous, but You repair it. \r\nIt has that within which must offend Your eyes; \r\nI confess and know it; \r\nbut whose help shall I implore in cleansing it, but Yours alone? \r\n\r\nTo You, therefore, I cry urgently, \r\nbegging that You will cleanse me from my secret faults, \r\nand keep Your servant from presumptuous sins, \r\nthat they never get dominion over me.\r","Author":"by St. Augustine","UniqueID":"7GhDr"},{"Title":"Hold Us Up Against Our Sins","Content":"Father in Heaven! \r\nHold not our sins up against us \r\nbut hold us up against our sins \r\nso that the thought of You \r\nwhen it wakens in our soul, \r\nand each time it wakens, \r\nshould not remind us of what we have committed \r\nbut of what You did forgive, \r\nnot of how we went astray \r\nbut of how You did save us!\r","Author":"by Sören Kierkegaard","UniqueID":"Td0D8"},{"Title":"Prayer for Forgiveness","Content":"Almighty and most merciful Father, \r\nI have erred and strayed from your ways like a lost sheep. \r\nI have followed too much the devices and desires of my own heart. \r\nI have offended against your holy laws. \r\nI have left undone those things which I ought to have done; \r\nand I have done those things which I ought not to have done; \r\nand there is no good in me.\r\n\r\nO Lord, have mercy upon me, a miserable sinner. \r\nSpare all those, O God, who confess their faults. \r\nRestore those who are penitent; \r\naccording to your promises declared to us in Christ Jesus our Lord. \r\nAnd Grant that I and all who confess his holy name \r\nmay hereafter live a godly, righteous, and sober life; \r\nto his glory and not our own.\r\n","Author":"Adapted from the Book of Common Prayer","UniqueID":"4AY0P"},{"Title":"For Forgiveness","Content":"O God, \r\nwhose nature and property is \r\never to have mercy and to forgive, \r\nreceive our humble petitions; \r\nand though we are tied and bound with the chain of our sins, \r\nyet let the pitifulness of your great mercy loose us; \r\nfor the honour of Jesus Christ, \r\nour Mediator, and Advocate.","Author":"by Gregory the Great","UniqueID":"BzWEQ"}],"Miscellaneous":[{"Title":"Draw Thou Our Hearts","Content":"O Lord Jesus Christ, draw our hearts unto You; \njoin them together in inseparable love, \nthat we may abide in You, and You in us, \nand that the everlasting covenant between us may stand sure forever. \n\nO wound our hearts with the fiery darts of Your piercing love. \nLet them pierce through all our slothful members and inward powers, \nthat we, being happily wounded, may so become whole and sound. \nLet us have no lover but yourself alone; \nlet us seek no joy nor comfort except in You.","Author":"by Myles Coverdale, Bishop of Exeter, 1530 A.D.","UniqueID":"qozsG"},{"Title":"Prayer for the Power of the Holy Spirit","Content":"O Holy Spirit, descend plentifully into my heart. \nEnlighten the dark corners of this neglected dwelling and scatter there Your cheerful beams.\nBreathe in me, O Holy Spirit, that my thoughts may all be holy.\nAct in me, O Holy Spirit, that my work, too, may be holy.\nDraw my heart, O Holy Spirit, that I love but what is holy.\nStrengthen me, O Holy Spirit, to defend all that is holy.\nGuard me, then, O Holy Spirit, that I always may be holy.","Author":"by (Saint) Augustine of Hippo, 398 A.D.","UniqueID":"fCuVb"},{"Title":"Prayer to Thirst for God","Content":"Lord God, I have tasted your goodness \r\nand it has satisfied me, \r\nyet it has made me thirst for even more. \r\n\r\nI am so painfully aware of my need \r\nfor even more grace than I now enjoy; \r\nand even when I do not want more, \r\nI am ashamed of my lack of desire. \r\nI want you completely, mighty God, \r\nand I want to want you even more than I do.\r\nFill me with longing for you; make me even thirstier. \r\nShow me your glory, I pray, \r\nso that I may know you always better and better, \r\ngrowing in my faith and love. \r\n\r\nFrom your infinite mercy, \r\nbegin a new work of love within me this moment. \r\nSay to my soul, ‘Rise up my love, \r\nmy fair one, and come away.’ \r\nAnd give me grace to rise up and follow you, \r\nfrom this misty lowland where I have wandered so long.\r\n","Author":"adapted from a prayer by A. W. Tozer","UniqueID":"7WMbS"},{"Title":"Prayer Not to Judge Others","Content":"Heavenly Father, \r\ngive me grace to endeavor after a truly Christian spirit \r\nto seek to attain that temper of endurance and patience \r\nof which my blessed Savior has set me the highest example, \r\nand which, while it prepares me for the spiritual happiness of the life to come, \r\nwill secure the best enjoyment of what the world can give. \r\n\r\nIncline me, O God, to think humbly of myself, \r\nto be severe only in the examination of my own conduct, \r\nto consider my fellow creatures with kindness, \r\nand to judge of all they say and do with that charity \r\nthat I would desire from them myself. \r\nIn Christ's name I pray.\r","Author":"by Jane Austen","UniqueID":"XnVnW"},{"Title":"For God's Peace","Content":"Drop Your still dews of quietness \ntill all our strivings cease,\ntake from our souls the strain and stress \nand let our ordered lives confess,\nthe beauty of Your peace.\n","Author":"by J.G. Whittier","UniqueID":"PrE9u"},{"Title":"Blessing of Mark","Content":"O Sovereign and almighty Lord, \nbless all your people, and all your flock. \nGive your peace, your help, \nand your love unto us your servants, the sheep of your fold, \nthat we may be united in the bond of peace and love, \none body and one spirit, \nin one hope of our calling, \nin your divine and boundless love.\n","Author":"From the Liturgy of Mark, 2d Century A.D.","UniqueID":"2u0Y1"},{"Title":"Prayer by Anne Brontë","Content":"My God, oh, let me call You mine,\r\nWeak, wretched sinner that I am,\r\nMy trembling soul wants to be yours;\r\nMy feeble faith still clings to You.\r\nNot only for the past I grieve,\r\nThe future fills me with dismay;\r\nUnless You hasten to relieve,\r\nYour petitioner is a castaway.\r\n\r\nI cannot say my faith is strong,\r\nI dare not hope my love is great;\r\nBut strength and love to You belong;\r\nOh, do not leave me desolate!\r\nI know I owe my all to You;\r\nOh, take the heart I cannot give!\r\nYou be my strenght— my Saviour too,\r\nAnd make me to Thy glory live.\r\n","Author":"by Anne Bronte","UniqueID":"aMDYE"},{"Title":"Dedication (Teresa of Ávila)","Content":"May it please you, my good Lord, \nthat there may come a day when I can repay a little of my great debt to you. \nO Jesus, strengthen my soul, you who are good above all good; \nand since you have inclined my soul in this way, \nshow me how I may act for you, whatever it may cost, O Lord. \nHere is my life, my honor and my will; \nI have given them all to you and they are yours: \nuse me to do whatever you want.","Author":"by Teresa of Ávila","UniqueID":"XOYGy"},{"Title":"Prayer of the Ancient Christians","Content":"I give you thanks Holy Father, \r\nfor your holy name which you have caused to dwell in my heart, \r\nand for the knowledge and faith and immortality which you have made known to me through Jesus your servant; \r\nto you be the glory forever.\r\n\r\nYou, almighty Master, created all things for your name's sake, \r\nand gave food and drink to men to enjoy, that they might give you thanks; \r\nbut to me you have graciously given spiritual food and drink, \r\nand eternal life through your servant Jesus. \r\n\r\nAbove all I give thanks because you are mighty; \r\nto you be the glory forever.\r\nRemember your church, Lord, \r\nto deliver it from all evil and to make it perfect in your love;\r\nand gather it, the one that has been sanctified, \r\nfrom the four winds into your kingdom, \r\nwhich you have prepared for it; \r\nfor yours is the glory forever.\r\n\r\nMay grace come, and may this world pass away. \r\nHosanna to the God of David. \r\nIf anyone is holy, let him come; \r\nif anyone is not, let him repent. \r\nCome, oh Lord!\r","Author":"Translation of a prayer (in Greek) from ca.150 A.D.","UniqueID":"Pa1N3"},{"Title":"The Heart of a Child","Content":"Grant me this day, O God, the heart of a child,\r\nPure and transparent as a spring;\r\nA simple heart, which never harbors sorrows;\r\nA heart glorious in self-giving,\r\ntender in compassion;\r\nA heart faithful and generous,\r\nwhich will never forget any good\r\nor bear a grudge for any evil.\r\n\r\nMake me a heart gentle and humble,\r\nloving without asking any return,\r\nlarge-hearted and undauntable,\r\nwhich no ingratitude can sour\r\nand no indifference can weary;\r\na heart penetrated by the love of Jesus \r\nwhose desire will only be satisfied in heaven.\r\n\r\nGrant me, O Lord, the mind and heart of your dear Son.\r","Author":"Translated from an old French prayer, ca. 1880","UniqueID":"j4Ugq"},{"Title":"We Beg You Lord","Content":"We beg You, Lord,\r\nto help and defend us.\r\nDeliver the oppressed, ‘\r\npity the insignificant,\r\nraise the fallen,\r\nshow Yourself to the needy,\r\nheal the sick,\r\nbring back those of Your people who have gone astray,\r\nfeed the hungry,\r\nlift up the weak,\r\ntake off the prisoners’ chains.\r\nMay every nation come to know\r\nthat You alone are God,\r\nthat Jesus Christ is your Child,\r\nthat we are Your people, \r\nthe sheep that You pasture.\r","Author":"from a prayer by St. Clement of Rome","UniqueID":"rEPOP"},{"Title":"Prayer for Holiness","Content":"All provident Lord, \r\nplace Your holy fear as a guard before my eyes so they may not look lustfully; \r\nbefore my ears so that they may not delight in hearing evil words; \r\nbefore my mouth so that it may not speak any falsehoods; \r\nbefore my heart so that it may not think evil; before my hands so that they may not do injustice;\r\n before my feet, that they may not walk in the paths of injustice; \r\nbut so direct them, that they may always be according to all Your commandments. \r\n\r\nHave mercy upon Your Creatures and upon me, a great sinner, \r\nI pray in the Name of Christ.\r","Author":"by (St.) Nersess the Gracious, 12th century","UniqueID":"ctcYs"},{"Title":"Prayer for Inner Peace","Content":"Heavenly God, may I have peace within, this day;\r\nMay I trust God that I am exactly where I am meant to be.\r\nMay I not forget the infinite possibilities that are born of faith.\r\nMay I use those gifts that I have received, \r\nand pass on the love that has been given to me.\r\nMay I be confident knowing I am a child of God.\r\nLet this presence settle into my bones, \r\nand allow my soul the freedom to sing, dance, praise and love. \r\nThis I pray in Christ’s name.\r","Author":" ","UniqueID":"jmlmH"},{"Title":"Song of Zechariah","Content":"Blessed be the Lord God of Israel,\r\nfor he has looked favorably on his people and redeemed them. \r\nHe has raised up a mighty savior for us in the house of his servant David, \r\nas he spoke through the mouth of his holy prophets from of old, \r\nthat we would be saved from our enemies \r\nand from the hand of all who hate us. \r\n\r\nThus he has shown the mercy promised to our ancestors, \r\nand has remembered his holy covenant, \r\nthe oath that he swore to our ancestor Abraham, \r\nto grant us that we, being rescued from the hands of our enemies, \r\nmight serve him without fear, \r\nin holiness and righteousness before him all our days. \r\n\r\nAnd you, child, will be called the prophet of the Most High; \r\nfor you will go before the Lord to prepare his ways, \r\nto give knowledge of salvation to his people \r\nby the forgiveness of their sins. \r\nBy the tender mercy of our God, \r\nthe dawn from on high will break upon us, \r\nto give light to those who sit in darkness and in the shadow of death, \r\nto guide our feet into the way of peace.\r","Author":"Luke 1:69-79","UniqueID":"PXBdi"},{"Title":"Song of Mary","Content":"My soul magnifies the Lord, \r\nand my spirit rejoices in God my Savior, \r\nfor he has looked with favor on the lowliness of his servant. \r\nSurely, from now on all generations will call me blessed; \r\nfor the Mighty One has done great things for me, \r\nand holy is his name.\r\n\r\nHis mercy is for those who fear him \r\nfrom generation to generation.\r\nHe has shown strength with his arm; \r\nhe has scattered the proud in the thoughts of their hearts. \r\nHe has brought down the powerful from their thrones, \r\nand lifted up the lowly; \r\nHe has filled the hungry with good things, \r\nand sent the rich away empty. \r\n\r\nHe has helped his servant Israel, \r\nin remembrance of his mercy, \r\naccording to the promise he made to our ancestors, \r\nto Abraham and to his descendants forever.\r","Author":"Luke1:47-55","UniqueID":"YXqTj"},{"Title":"A Pure Heart","Content":"O God Almighty, \r\nFather of our Lord Jesus Christ, Your only begotten Son, \r\ngive me a body unstained, \r\na pure heart, \r\na watchful mind, \r\nand an upright understanding, \r\nand the presence of Your Holy Spirit, \r\nthat I may obtain and ever hold fast to an unshaken faith in Your truth, \r\nthrough Jesus Christ, Your Son, our Lord; \r\nthrough whom be glory to You in the Holy Ghost, \r\nforever and ever.\r","Author":"from the Clementine Liturgy","UniqueID":"y6Eib"},{"Title":"For Growth in Grace","Content":"Give perfection to beginners, O Father; \r\ngive intelligence to the little ones; \r\n\r\ngive aid to those who are running their course. \r\nGive sorrow to the indifferent; \r\ngive passion of spirit to the lukewarm. \r\n\r\nGive to the perfect a good completion; \r\nfor the sake of Christ Jesus our Lord.\r","Author":"By Iranaeus, Old Gallican Sacramentary","UniqueID":"O5Cel"},{"Title":"For Christian Graces","Content":"Grant us, Your servants, O God, to be set on fire with Your Spirit, \r\nstrengthened by Your power,\r\nilluminated by Your splendour, \r\nfilled with Your grace, \r\nand to go forward by Your aid. \r\n\r\nGive us, O Lord, a right faith, \r\nperfect love, \r\ntrue humility. \r\n\r\nGrant, O Lord, that there may be in us simple affection, \r\nbrave patience, \r\npersevering obedience, \r\nperpetual peace, \r\na pure mind, \r\na right and honest heart, \r\na good will, \r\na holy conscience, \r\nspiritual strength, \r\na life unspotted and unblamable; \r\n\r\nand after having manfullyboldly finished our course, \r\nmay we be enabled happily to enter into Your kingdom;\r\nthrough Jesus Christ our Lord.\r","Author":"From the Old Gallican Sacramentary","UniqueID":"nK44l"},{"Title":"Prayer to The Crucified Christ","Content":"Lord Jesus Christ, \r\nYou stretched out your arms of love on the hard wood of the cross,\r\nthat everyone might come within the reach of your saving embrace:  \r\nSo clothe us in your Spirit that we, reaching forth our hands in love, \r\nmay bring those who do not know you to the knowledge and love of you; \r\nfor the honor of your Name.","Author":"from The Book of Common Prayer","UniqueID":"n57Ct"},{"Title":"Let Me Be an Instrument of Your Peace","Content":"Lord, make me an instrument of Your peace;\r\nwhere there is hatred, let me show love;\r\nwhere there is injury, pardon;\r\nwhere there is doubt, faith;\r\nwhere there is despair, hope;\r\nwhere there is darkness, light;\r\nand where there is sadness, joy.\r\n\r\nO Divine Master,\r\ngrant that I may not so much seek to be consoled as to console;\r\nto be understood, as to understand;\r\nto be loved, as to love;\r\nfor it is in giving that we receive,\r\nit is in pardoning that we are pardoned,\r\nand it is in dying that we are born to Eternal Life.\r","Author":"Ascribed to St. Francis","UniqueID":"ZwHKp"},{"Title":"For Protection","Content":"Lord Jesus Christ, Keeper and Preserver of all things, \r\nlet Your right hand guard us by day and by night, \r\nwhen we sit at home, and when we walk abroad, \r\nwhen we lie down and when we rise up, \r\nthat we may be kept from all evil, \r\nand have mercy upon us sinners. \r","Author":"By Nerses of Clajes","UniqueID":"hqkE4"},{"Title":"For Right Blessings","Content":"O Lord our God, teach us, we beseech You, \r\nto ask Thee rightly for the right blessings. \r\nSteer the vessel of our life toward Yourself, \r\nYou tranquil Haven of all storm-tossed souls. \r\nShow us the course wherein we should go. \r\nRenew a willing spirit within us. \r\nLet Your Spirit curb our wayward senses, \r\nand guide and enable us unto that which is our true good, \r\nto keep Your laws, \r\nand in all our works always to rejoice in Your glorious and gladdening Presence. \r\nFor Yours is the glory and praise from all Your saints forever and ever. ","Author":"by Basil","UniqueID":"LnwH0"},{"Title":"For Refreshment","Content":"O Lord our God, under the shadow of Your wings let us hope. \r\nYou will support us, both when little, and even to gray hairs. \r\nWhen our strength is from You, it is strength; \r\nbut, when our own, it is feebleness. \r\n\r\nWe return unto You, O Lord, \r\nthat from their weariness our souls may rise towards You, \r\nleaning on the things which You have created, \r\nand passing on to You, who has wonderfully made them; \r\nfor with You is refreshment and true strength.\r","Author":"By St. Augustine","UniqueID":"Fs0Dl"},{"Title":"A Non-Traditional Blessing","Content":"May God bless us with a restless discomfort\r\nabout easy answers, half-truths and superficial relationships,\r\nso that we may seek truth boldly and love deep within your heart.\r\n\r\nMay God bless us with holy anger at injustice, oppression,\r\nand exploitation of people, so that we may tirelessly work for\r\njustice, freedom, and peace among all people.\r\n\r\nMay God bless us with the gift of tears to shed with those who suffer\r\nfrom pain, rejection, starvation, or the loss of all that they cherish, so that we may\r\nreach out our hand to comfort them and transform their pain into joy.\r\n\r\nMay God bless us with enough foolishness to believe that\r\nwe really can make a difference in this world, so that we are able,\r\nwith God's grace, to do what others claim cannot be done.\r\n\r\nAnd the blessing of God the Supreme Majesty and our Creator,\r\nJesus Christ the Incarnate Word who is our brother and Saviour,\r\nand the Holy Spirit, our Advocate and Guide, be with us\r\nand remain with us, this day and forevermore.\r","Author":"by Ruth M. Fox","UniqueID":"bZCk9"},{"Title":"The Absorbeat","Content":"May the power of your love, Lord Christ,\r\nfiery and sweet as honey,\r\nso absorb our hearts\r\nas to withdraw them from all that is under heaven.\r\nGrant that we may be ready\r\nto die for love of your love,\r\nas you died for love of our love.","Author":"Ascribed to St. Francis","UniqueID":"osrUN"},{"Title":"Canticle of the Creatures","Content":"Most High, all powerful, good Lord,\r\nyours are the praises, the glory, the honour\r\nand all blessing.\r\n\r\nTo you alone, Most High, do they belong\r\nand no human is worthy to mention your name.\r\nPraised be you, my Lord, with all your creatures,\r\nespecially Sir Brother Sun, who is the day and through whom you give us light.\r\nAnd he is beautiful and radiant with great splendour;\r\nand bears a likeness of you, Most High One.\r\n\r\nPraised be you, my Lord, through Sister Moon and the stars:\r\nin heaven you formed them clear and precious and beautiful.\r\nPraised be you, my Lord, through Brother Wind;\r\nand through the air, cloudy and serene, and every kind of weather,\r\nthrough which you give sustenance to your creatures.\r\n\r\nPraised be you, my Lord, through Sister Water,\r\nwho is very useful and humble and precious and chaste.\r\nPraised be you, my Lord, through Brother Fire,\r\nthrough whom you light the night:\r\nand he is beautiful and playful and robust and strong.\r\n\r\nPraised be you, my Lord, through our Sister, Mother Earth,\r\nwho sustains and governs us\r\nand who produces various fruit\r\nwith coloured flowers and herbs.\r\n\r\nPraised be you, my Lord,\r\nthrough those who give pardon for your love\r\nand bear infirmity and tribulation.\r\nBlessed are those who endure in peace:\r\nfor by you, Most High, shall they be crowned.\r\n\r\nPraised be you, my Lord, for our Sister, Bodily Death,\r\nfrom whom no one living can escape:\r\nwoe to those who die in mortal sin.\r\nBlessed are those whom death will find in your most holy will,\r\nfor the second death shall do them no harm.\r\n\r\nPraise and bless my Lord and give him thanks\r\nand serve him with great humility.\r","Author":"By St. Francis","UniqueID":"pSWA9"},{"Title":"The Prayer Before the Crucifix","Content":"Most High, glorious God,\r\nenlighten the darkness of my heart\r\nand give me true faith,\r\ncertain hope,\r\nand perfect charity,\r\nsense and knowledge,\r\nLord, that I may carry out\r\nYour holy and true command.\r","Author":"By St. Francis","UniqueID":"dGCbu"},{"Title":"A Prayer for Spiritual Blessings","Content":"\"Most high God, our loving Father, infinite in majesty, \r\nwe humbly beseech You for all Your servants everywhere, \r\nthat You would give us a pure mind, \r\nperfect love, \r\nsincerity in conduct, \r\npurity in heart, \r\nstrength in action, \r\ncourage in distress, \r\nself-command in character. \r\n\r\nMay our prayers ascend to Your gracious ears, \r\nand Your loving benediction descend upon us all, \r\nthat we may in all things be protected under the shadow of Your wings. \r\n\r\nGrant us pardon of our sins; \r\nperfect our work; \r\naccept our prayers; \r\nprotect us by Your own Name, O God of Jacob; \r\n\r\nSend us Your saving help from Your holy place, \r\nand strengthen us out of Zion. \r\nRemember all Your people everywhere, \r\ngive us all the grace of devotion to Your will; \r\nfulfill our desires with good gifts, \r\nand crown us with Your mercy. \r\n\r\nWhen we serve You with faithful devotion, \r\npardon our sins and correct us with Fatherly tenderness. \r\nGrant that, being delivered from all adversity, \r\nand both here and eternally justified, \r\nwe may praise You forever and ever, \r\nsaying Holy, Holy, Holy; \r\nthrough Jesus Christ our Lord and Saviour, \r\nWho with You and the Holy Ghost, lives and reigns, \r\never one God, world without end.\r\"","Author":"From the Gallican Sacramentary","UniqueID":"5FTiR"},{"Title":"Adoration","Content":"O You Good Omnipotent, \r\nWho so cares for every one of us, \r\nas if You would care for him alone; \r\nand so for all, as if all were but one! \r\n\r\nBlessed is the man who loves You, \r\nand his friend in You, \r\nand his enemy for You. \r\nFor he only loses none dear to him, \r\nto whom all are dear in Him who cannot be lost. \r\n\r\nAnd who is that but our God, \r\nthe God that made heaven and earth, \r\nand fills them, even by filling them creating them. \r\n\r\nAnd Your law is truth, and truth is Yourself. \r\nI behold how some things pass away that others may replace them, \r\nbut You never depart, O God, \r\nmy Father supremely good, \r\nBeauty of all things beautiful. \r\n\r\nTo You will I entrust whatsoever I have received from You, \r\nso shall I lose nothing. \r\nYou have made me for Yourself, \r\nand my heart is restless until it finds rest in You.\r","Author":"By St. Augustine","UniqueID":"7ZGXc"},{"Title":"The Holy Spirit","Content":"O Holy Spirit, Love of God, \r\ninfuse Your grace, and descend plentifully into my heart; \r\nenlighten the dark corners of this neglected dwelling, \r\nand scatter there Your cheerful beams; \r\n\r\nDwell in that soul that longs to be Your temple; \r\nwater that barren soil, over-run with weeds and briars, \r\nand lost for want of cultivating, \r\nand make it fruitful with Your dew from heaven. \r\n\r\nOh come, You refreshment of them that languish and faint. \r\nCome, You Star and Guide of them that sail in the tempestuous sea of the world; \r\nYou only Haven of the tossed and shipwrecked. \r\n\r\nCome, You Glory and Crown of the living, \r\nand only Safeguard of the dying. \r\n\r\nCome, Holy Spirit, in much mercy, \r\nand make me fit to receive You.","Author":"by St. Augustine","UniqueID":"4BGlX"},{"Title":"For Entire Love","Content":"O Lord, my God, \r\nLight of the blind and Strength of the weak; \r\nyes, also, Light of those that see, and Strength of the strong; \r\nlisten unto my soul, and hear it crying out of the depths.\r\n\r\nO Lord, help us to turn and seek You; \r\nfor You have not forsaken Your creatures \r\nas we have forsaken You, our Creator. \r\nLet us turn and seek You, \r\nfor we know You are here in our hearts, \r\nwhen we confess to You, \r\nwhen we cast ourselves upon You, \r\nand weep in Your bosom, after all our rugged ways; \r\n\r\nand You gently wipe away our tears, \r\nand we weep the more for joy; \r\nbecause You, Lord, who made us \r\ndoes remake and comfort us.\r\n\r\nHear, Lord, my prayer, \r\nand grant that I may most entirely love You, \r\nand rescue me, O Lord, from every temptation, \r\neven unto the end.\r\nby St. Augustine","Author":"by St. Augustine","UniqueID":"rEAAL"},{"Title":"Refuge and Peace","Content":"O, You full of compassion, \r\nI commit and commend myself to You, \r\nin whom I am, and live, and know. \r\n\r\nBe the goal of my pilgrimage, \r\nand my rest by the way. \r\nLet my soul take refuge from the crowding turmoil of worldly thoughts \r\nbeneath the shadow of Your wings; \r\nlet my heart, this sea of restless waves, \r\nfind peace in You, O God. \r\n\r\nYou generous Giver of all good gifts, \r\ngive to him who is weary refreshing food; \r\ngather our distracted thoughts and powers into harmony again; \r\nand set the prisoner free. \r\n\r\nSee, he stands at you door and knocks; \r\nbe it open to him, that he may enter with a free step, \r\nand be quickened by You. \r\n\r\nFor You are the Well-spring of Life, \r\nthe Light of eternal Brightness, \r\nwherein the just live who love You. \r\nBe it unto me according to Your word.","Author":"by St. Augustine","UniqueID":"ozU77"},{"Title":"Late Have I Loved You","Content":"Late have I loved you, \r\nbeauty so ancient and so new: \r\nlate have I loved you. \r\nAnd see, you were within \r\nand I was in the external world and sought you there, \r\nand in my unlovely state I plunged into those lovely created things which you made. \r\n\r\nYou were with me, and I was not with you. \r\nThe lovely things kept me far from you, \r\nthough if they did not have their existence in you, \r\nthey had no existence at all. \r\n\r\nYou called and cried out loud and shattered my deafness. \r\nYou were radiant and resplendent, you put to flight my blindness. \r\nYou were fragrant, and I drew in my breath and now pant after you. \r\nI tasted you, and I feel but hunger and thirst for you. \r\nYou touched me, and I am set on fire to attain the peace which is yours.\r","Author":"by St. Augustine","UniqueID":"KySCS"},{"Title":"Invocation","Content":"Lord God, of might inconceivable, \r\nof glory incomprehensible, \r\nof mercy immeasurable, \r\nof compassion unspeakable; \r\n\r\nO Master, do look down upon us in Your tender love, \r\nand show forth, towards us and those who pray with us, \r\nYour rich mercies and compassions.\r","Author":"from the Liturgy of St. Chrysostom","UniqueID":"T66T1"},{"Title":"For the Holy Spirit","Content":"O God , give me a body undefiled, \r\na pure heart, \r\na watchful mind, \r\nan unfailing knowledge, \r\nthe influence of the Holy Ghost \r\nfor the obtaining and assured enjoying of the truth, \r\nthrough Your Christ.\r","Author":"Apostolic Constitutions","UniqueID":"eyFOo"},{"Title":"Unchangeable","Content":"You who are unchangeable, whom nothing changes! \r\nYou who are unchangeable in love, precisely for our welfare, \r\nnot submitting to any change: \r\nmay we too will our welfare, \r\nsubmitting ourselves to the discipline of Your unchangeableness, \r\nso that we may in unconditional obedience find our rest \r\nand remain at rest in Your unchangeableness. \r\n\r\nYou are not like us; \r\nif we are to preserve only some degree of constancy, \r\nwe must not permit ourselves too much to be moved, \r\nnor by too many things. \r\n\r\nYou on the contrary are moved, \r\nand moved in infinite love, by all things. \r\nEven that which we humans beings call an insignificant trifle, and pass by unmoved, \r\nthe need of a sparrow, even this moved You; \r\nand what we so often scarcely notice, \r\na human sigh, this moves You, \r\nYou who are unchangeable! \r\n\r\nYou who in infinite love is moved, \r\nmay this our prayer also move You to add Your blessing, \r\nin order that there may be brought about such a change in us who pray \r\nas to bring us into conformity with Your unchangeable will, \r\nYou who are unchangeable!\r","Author":"by Sören Kierkgaard","UniqueID":"hIinz"},{"Title":"You Have Loved Us First","Content":"Father in Heaven! \r\nYou have loved us first, \r\nhelp us never to forget that You are love \r\nso that this sure conviction might triumph in our hearts \r\nover the seduction of the world, \r\nover the inquietude of the soul, \r\nover the anxiety for the future, \r\nover the fright of the past, \r\nover the distress of the moment. \r\n\r\nBut grant also that this conviction might discipline our soul \r\nso that our heart might remain faithful and sincere \r\nin the love which we bear to all those \r\nwhom You have commanded us to love as we love ourselves.\r","Author":"by Sören Kierkgaard","UniqueID":"GkXpf"},{"Title":"Have A Little Patience","Content":"Father in Heaven! \r\nShow us a little patience \r\nfor we often intend in all sincerity to commune with You \r\nand yet we speak in such a foolish fashion. \r\nSometimes, when we judge that what has come to us is good, \r\nwe do not have enough words to thank You; \r\njust as a mistaken child is thankful for having gotten his own way. \r\nSometimes things go so badly that we call upon You; \r\njust as an unreasoning child fears what would do him good. \r\n\r\nOh, but if we are so childish, \r\nhow far from being Your true children \r\nYou who are our true Father, \r\nah, as if an animal would pretend to have a man as a father. \r\nHow childish we are and how little our proposals \r\nand our language resemble the language which should not be this way \r\nand that we should be otherwise. \r\nHave then a little patience with us.\r","Author":"by Sören Kierkgaard","UniqueID":"Yc8rl"},{"Title":"To Will One Thing","Content":"Father in Heaven! \r\nWhat are we without You! \r\nWhat is all that we know, \r\nvast accumulation though it be, \r\nbut a chipped fragment if we do not know You! \r\nWhat is all our striving, \r\ncould it ever encompass a world, \r\nbut a half-finished work if we do not know You: \r\nYou the One, who is one thing and who is all!\r\n\r\nSo may You give to the intellect, \r\nwisdom to comprehend that one thing; \r\nto the heart, sincerity to receive this understanding; \r\nto the will, purity that wills only one thing. \r\nIn prosperity may You grant perseverance to will one thing; \r\namid distractions, collectedness to will one thing; \r\nin suffering, patience to will one thing.\r\n\r\nYou that gives both the beginning and the completion, \r\nmay You early, at the dawn of the day, \r\ngive to the young the resolution to will one thing. \r\nAs the day wanes, \r\nmay You give to the old a renewed remembrance of their first resolution, \r\nthat the first may be like the last, \r\nthe last like the first, \r\nin possession of a life that has willed only one thing. \r\n\r\nAlas, but this has indeed not come to pass. \r\nSomething has come in between. \r\nThe separation of sin lies in between. \r\nEach day, and day after day \r\nsomething is being placed in between: \r\ndelay, blockage, interruption, \r\ndelusion, corruption. \r\nSo in this time of repentance \r\nmay You give the courage once again \r\nto will one thing.\r","Author":"by Sören Kierkgaard","UniqueID":"zZJsu"},{"Title":"Calm the Waves","Content":"O Lord, calm the waves of this heart,\r\nCalm its storms.\r\nBe still, O my soul, so God can work.\r\nBe still, O my soul, let God’s rest live in you, \r\nGod’s peace cover you.\r\n\r\nWe know that the World cannot give us peace,\r\nOnly You can bring peace,\r\nWe trust your promise,\r\nEven the whole world cannot take away Your peace.\r","Author":"by Sören Kierkgaard","UniqueID":"0UMEc"},{"Title":"We Belong to You","Content":"O God, \r\nwhen at times our strength is taken from us, \r\nwhen sorrow overcomes us like a kind of fog \r\nin which our vision is plunged as into a dark night; \r\nwhen our hearts do tremble with our loss: \r\n\r\nthen teach us and strengthen the conviction in our hearts \r\nthat in death, no less than in life, \r\nwe belong to You.\r","Author":"by Sören Kierkgaard","UniqueID":"gbe8B"},{"Title":"For Humility","Content":"O Jesus!  When You were a pilgrim on earth, \r\nYou said: “Learn of Me \r\nfor I am gentle and humble of heart \r\nand you will find rest for your souls.”  \r\nI recall Your words that teach me how to practice humility: \r\n“I have given you an example so that you may do what I have done.  \r\nThe disciple is not greater than the Master… \r\nIf you understand this, happy are you if you put them into practice.”  \r\n\r\nLord, I do understand these words \r\nthat came from Your gentle and humble heart \r\nand I want to practice them with the help of Your grace. \r\n\r\nI beg You, my Divine Jesus, to send me a humiliation \r\nwhenever I try to set myself above others. \r\nI know, O my God, that You humble the proud soul\r\n but to the one who humbles one’s self \r\nYou give an eternity of glory.  \r\nSo I want to put myself in the last rank\r\nand to share Your humiliations \r\nso as “to have a share with You” in the kingdom of Heaven.\r\n\r\nBut, You know my weakness, Lord.  \r\nEvery morning I make a resolution to practice humility \r\nand in the evening I recognize that I have committed again many faults of pride.  \r\nAt this I am tempted to become discouraged \r\nbut I know that discouragement is also pride.  \r\n\r\nTherefore, O my God, I want to base my hope in You alone.  \r\nSince You can do everything, \r\ndeign to bring to birth in my soul the virtue I desire.  \r\nTo obtain this grace of Your infinite mercy \r\nI will very often repeat: \r\n“O Jesus, gentle and humble of heart, \r\nmake my heart like Yours!”\r","Author":"From a prayer by St. Therese of Lisieux","UniqueID":"6BUsn"},{"Title":"The Love with Which","Content":"O Jesus, I know well \r\nthat You do not look so much at the greatness of my actions, \r\nas to the love with which I do them.  \r\nIt is true I am not always faithful, \r\nbut I shall not lose courage.  \r\nI desire to make use of every opportunity to please You.\r","Author":"by St. Therese of Lisieux","UniqueID":"bHsig"},{"Title":"Happy to Feel Weak","Content":"Yes, O my God,  \r\nI am happy to feel little and weak in Your Presence, \r\nand my heart remains in peace\r\nI am so glad to feel so impefect \r\nand to need Your mercy so much! \r\nWhen we calmly accept the humiliation of being imperfect, \r\nYour grace , O Lord , returns at once.\r","Author":"by St. Therese of Lisieux","UniqueID":"Qb6fR"},{"Title":"Deepen Your Love","Content":"Deepen Your love in me, O Lord, \r\nthat I may learn in my inmost heart \r\nhow sweet it is to love, \r\nto be dissolved, and to plunge myself into Your love. \r\n\r\nLet Your love possess and raise me above myself, \r\nwith a fervor and wonder beyond imagination. \r\nLet me sing the song of love. \r\nLet me follow you into the heights.\r\n Let my soul spend itself in Your praise, rejoicing for love. \r\n\r\nLet me love you more than myself, \r\nand myself only for Your sake. \r\nLet me love others, as Your law commands.\r","Author":"by St. Therese of Lisieux","UniqueID":"b6ZCv"}],"The Lord's Prayer":[{"Title":"The Lord's Prayer","Content":"Our Father in heaven, \nhallowed be your name. \nYour kingdom come, \nyour will be done, on earth as it is in heaven. \n\nGive us this day our daily bread, \nand forgive us our debts, \nas we also have forgiven our debtors. \nAnd lead us not into temptation, \nbut deliver us from evil.\n\nFor yours is the Kingdom and the power and the glory, forever.","UniqueID":"wIZxV"}],"Table Graces":[{"Title":"Table Graces","Content":"You are blessed, O Lord, \r\nwho nourishes me from my youth, \r\nwho gives food to all flesh. \r\n\r\nFill our hearts with joy and gladness,\r\nthat having always what is sufficient for us, \r\nwe may abound to every good work, \r\nin Christ Jesus our Lord, \r\nthrough whom glory, honour, and power be to You forever.\r\n","UniqueID":"zAwkB"}],"Quotes":[{"Quote":"The function of prayer is not to influence God, but rather to change the nature of the one who prays.","Author":"Sören Kierkegaard","UniqueID":"9GI7x"}],"Pages":[{"Title":"How to use this app","Icon":"face","Content":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eleifend ligula ipsum, sed suscipit nulla bibendum et. Maecenas rhoncus lacus elit. Nunc ullamcorper sollicitudin blandit. Phasellus sem ipsum, viverra at tempor a, varius pretium lorem. Ut ullamcorper, ante sit amet sagittis feugiat, neque erat congue elit, sed viverra arcu leo et turpis. Aenean odio enim, hendrerit nec ligula non, cursus tincidunt leo. Nam vel velit tincidunt, sodales augue et, hendrerit tellus. Mauris porta, mauris vel dapibus dictum, turpis risus tempus lacus, facilisis scelerisque lacus augue ac nulla. Suspendisse at ornare nunc. Curabitur at finibus odio. Suspendisse potenti. Sed aliquet euismod lacus in iaculis.\n\nVivamus eleifend lectus ligula, a dignissim est dignissim nec. Praesent felis nulla, suscipit ut feugiat vel, consequat porta arcu. Etiam imperdiet aliquam dui non laoreet. Nam tellus justo, fringilla ornare ligula sit amet, suscipit maximus ligula. Donec a pellentesque arcu, vitae sollicitudin erat. Vestibulum bibendum scelerisque tristique. Proin sit amet diam ut eros ornare rhoncus. Donec ac condimentum ante. Integer facilisis in massa et vulputate. Maecenas vitae posuere nibh.\n\nMaecenas sem metus, malesuada id euismod id, fermentum faucibus augue. Cras semper ex convallis arcu scelerisque sollicitudin. Ut euismod posuere lectus, quis faucibus mauris aliquam non. Quisque tristique ligula ante, eget hendrerit risus efficitur at. Duis ac dignissim eros, ac tempus nisl. Quisque vel tristique arcu. Curabitur molestie commodo pharetra. Nam mauris nibh, semper congue rhoncus quis, malesuada eu lorem. Donec eu risus nec lacus condimentum dictum vel at sapien. Etiam ipsum lorem, molestie ultricies risus at, suscipit pellentesque sapien. ","UniqueID":"Ycm0Q"},{"Title":"About","Icon":"info_big","Content":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eleifend ligula ipsum, sed suscipit nulla bibendum et. Maecenas rhoncus lacus elit. Nunc ullamcorper sollicitudin blandit. Phasellus sem ipsum, viverra at tempor a, varius pretium lorem. Ut ullamcorper, ante sit amet sagittis feugiat, neque erat congue elit, sed viverra arcu leo et turpis. Aenean odio enim, hendrerit nec ligula non, cursus tincidunt leo. Nam vel velit tincidunt, sodales augue et, hendrerit tellus. Mauris porta, mauris vel dapibus dictum, turpis risus tempus lacus, facilisis scelerisque lacus augue ac nulla. Suspendisse at ornare nunc. Curabitur at finibus odio. Suspendisse potenti. Sed aliquet euismod lacus in iaculis.\n\nVivamus eleifend lectus ligula, a dignissim est dignissim nec. Praesent felis nulla, suscipit ut feugiat vel, consequat porta arcu. Etiam imperdiet aliquam dui non laoreet. Nam tellus justo, fringilla ornare ligula sit amet, suscipit maximus ligula. Donec a pellentesque arcu, vitae sollicitudin erat. Vestibulum bibendum scelerisque tristique. Proin sit amet diam ut eros ornare rhoncus. Donec ac condimentum ante. Integer facilisis in massa et vulputate. Maecenas vitae posuere nibh.\n\nMaecenas sem metus, malesuada id euismod id, fermentum faucibus augue. Cras semper ex convallis arcu scelerisque sollicitudin. Ut euismod posuere lectus, quis faucibus mauris aliquam non. Quisque tristique ligula ante, eget hendrerit risus efficitur at. Duis ac dignissim eros, ac tempus nisl. Quisque vel tristique arcu. Curabitur molestie commodo pharetra. Nam mauris nibh, semper congue rhoncus quis, malesuada eu lorem. Donec eu risus nec lacus condimentum dictum vel at sapien. Etiam ipsum lorem, molestie ultricies risus at, suscipit pellentesque sapien. ","UniqueID":"hcAV3"},{"Title":"Privacy and security","Icon":"shield","Content":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eleifend ligula ipsum, sed suscipit nulla bibendum et. Maecenas rhoncus lacus elit. Nunc ullamcorper sollicitudin blandit. Phasellus sem ipsum, viverra at tempor a, varius pretium lorem. Ut ullamcorper, ante sit amet sagittis feugiat, neque erat congue elit, sed viverra arcu leo et turpis. Aenean odio enim, hendrerit nec ligula non, cursus tincidunt leo. Nam vel velit tincidunt, sodales augue et, hendrerit tellus. Mauris porta, mauris vel dapibus dictum, turpis risus tempus lacus, facilisis scelerisque lacus augue ac nulla. Suspendisse at ornare nunc. Curabitur at finibus odio. Suspendisse potenti. Sed aliquet euismod lacus in iaculis.\n\nVivamus eleifend lectus ligula, a dignissim est dignissim nec. Praesent felis nulla, suscipit ut feugiat vel, consequat porta arcu. Etiam imperdiet aliquam dui non laoreet. Nam tellus justo, fringilla ornare ligula sit amet, suscipit maximus ligula. Donec a pellentesque arcu, vitae sollicitudin erat. Vestibulum bibendum scelerisque tristique. Proin sit amet diam ut eros ornare rhoncus. Donec ac condimentum ante. Integer facilisis in massa et vulputate. Maecenas vitae posuere nibh.\n\nMaecenas sem metus, malesuada id euismod id, fermentum faucibus augue. Cras semper ex convallis arcu scelerisque sollicitudin. Ut euismod posuere lectus, quis faucibus mauris aliquam non. Quisque tristique ligula ante, eget hendrerit risus efficitur at. Duis ac dignissim eros, ac tempus nisl. Quisque vel tristique arcu. Curabitur molestie commodo pharetra. Nam mauris nibh, semper congue rhoncus quis, malesuada eu lorem. Donec eu risus nec lacus condimentum dictum vel at sapien. Etiam ipsum lorem, molestie ultricies risus at, suscipit pellentesque sapien. ","UniqueID":"9BST5"}]};

let moments = Content['Moments'];

let initialCategories = Content['Categories'].map((category, index) => {
  let allowedMoments = [];

  moments.forEach(moment => {
    if (category[moment.Title]) allowedMoments.push(moment.Title);
  });

  return {
    enabled: category.Enabled,
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

let enhancers = composeEnhancers(middleware, persistState(null, {
  slicer: savableSlicer,
}));


const Store = createStore(reducers, initialState$1, enhancers);

const client = remoteStorage.scope('/LiturgicalPrayerApp/');
client.declareType('settings', {
  "type": "object",
});

let lastState = null;
let slice$1 = savableSlicer();
Store.subscribe(function () {
  const state = slice$1(Store.getState());

  if (JSON.stringify(state) !== JSON.stringify(lastState)) {
    client.storeObject('settings', 'settings', state);
    lastState = state;
  }
});

remoteStorage.on('sync-done', () => {
  client.getObject('settings').then(remoteState => {
    if (remoteState) {
      delete remoteState['@context'];
      Store.replaceState(remoteState);
      let app = document.querySelector('prayer-app');
      app.draw();
      [...app.children].forEach(child => typeof child.draw !== 'undefined' ? child.draw() : null);
    }
  });
});

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
            if (link.getAttribute('href').substr(0,4) === 'http') {
              return;
            }

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
          ${t.direct('Moments and settings')}
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
      
      <div class="field">
        <label>${t`Sync data`}</label>
        <remote-storage-widget />
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
          <span class="button has-icon">
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
          <a class="button has-icon" href="${`/settings/${this.route.parameters.moment}/create-free-category`}">
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
        <a class="button has-icon" href="${`/settings/${this.moment.slug}/prayer-category/${this.category.slug}/create`}">
          ${t.direct('Create prayer point')}
          <prayer-icon name="arrow-right" />
        </a>
        
        <button class="button danger has-icon" onclick="${() => {deleteFreeCategory(this.moment.slug, this.category.slug); this.root.router.navigate(`/settings/${this.moment.slug}`);}}">
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

        <button class="button danger has-icon" onclick="${() => {deletePrayerPoint(this.route.parameters.moment, this.freeCategory.slug, item.slug); this.root.router.navigate(categoryUrl);}}">
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

customElements.define('remote-storage-widget', class RemoteStorageWidget extends BaseElement {

  constructor() {
    super();
    this.rs = remoteStorage;
    this.setupHandlers();
    this.showLogin = false;
    this.remoteStorageEmail = '';
    this.dataset.online = navigator.onLine;
    this.online = navigator.onLine;
    this.error = '';
    this.isSyncing = false;
  }

  /**
   * Setup all event handlers
   */
  setupHandlers () {
    this.rs.on('connected', () => this.eventHandler('connected'));
    this.rs.on('ready', () => this.eventHandler('ready'));
    this.rs.on('disconnected', () => this.eventHandler('disconnected'));
    this.rs.on('network-online', () => this.eventHandler('network-online'));
    this.rs.on('network-offline', () => this.eventHandler('network-offline'));
    this.rs.on('error', (error) => this.error = error);
    window.addEventListener('online', () => {this.online = this.dataset.online = true; this.draw();});
    window.addEventListener('offline',  () => {this.online = this.dataset.online = false; this.draw();});

    this.rs.on('wire-busy', () => {
      this.isSyncing = true;
      this.draw();
    });

    this.rs.on('sync-req-done', () => () => {
      this.isSyncing = true;
      this.draw();
    });

    ['sync-done', 'wire-done'].forEach(eventName => {
      this.rs.on(eventName, () => {
        this.isSyncing = false;
        this.draw();
      });
    });

  }

  /**
   * Handles events
   * @param event
   * @param msg
   */
  eventHandler (event, msg) {
    this.error = '';
    this.status = event;
    this.dataset.status = event;
    this.draw();
  }

  sync () {
    this.rs.startSync().then(() => {
      this.draw();
    });
  }

  statusText () {
    let t = this.root.t;
    if (this.online) {
      return this.isSyncing ? t.direct('Syncing') : t.direct('connected');
    }
    else {
      return t.direct('offline');
    }
  }

  draw () {
    let t = this.root.t;
    let readMore = html`
      ${t.direct('This app allows you to sync the data with a storage of your choice.')} 
      <a class="rs-help" href="https://remotestorage.io/" target="_blank">${t.direct('Information')}</a>.
    `;

    let choose = html`<div class="choose">
      <div class="description">
        ${readMore}
      </div>
      
      ${this.rs.apiKeys.hasOwnProperty('dropbox') ? html`<button class="button has-icon dropbox secondary block" onclick="${() => this.rs["dropbox"].connect()}">
        Dropbox
        <img class="dropbox-logo" src="/images/dropbox.svg">
      </button>` : ''}
      
      ${this.rs.apiKeys.hasOwnProperty('googledrive') ? html`<button class="button has-icon googledrive secondary block" onclick="${() => this.rs["googledrive"].connect()}">
        Google Drive
        <img class="googledrive-logo" src="/images/googledrive.svg">
      </button>` : ''}
      
      <button class="button rs secondary block has-icon" onclick="${() => {this.showLogin = true; this.draw();}}">
        RemoteStorage
        <img class="rs-logo" src="/images/remotestorage.svg">
      </button>
      
    </div>`;

    let signIn = html`<div class="sign-in" >
      <div class="description">
        ${readMore}
      </div>
      <form name="rs-sign-in-form" class="rs-sign-in-form" onsubmit="${event => {event.preventDefault(); this.rs.connect(this.remoteStorageEmail.trim());}}">
        <div class="field-inner">
            <input type="text" .value="${this.remoteStorageEmail}" onkeyup="${event => this.remoteStorageEmail = event.target.value}" name="rs-user-address" placeholder="user@provider.com" autocapitalize="off">
        </div>
      </form>
      
      <span class="buttons">
        <button type="submit" class="button">${t.direct('Connect')}</button>
        <button class="button secondary" onclick="${event => {event.preventDefault(); this.showLogin = false; this.draw();}}">${t.direct('Cancel')}</button>
      </span>

    </div>`;

    let error = html`<div class="errors">
        <div class="rs-error-message"></div>
        <div class="rs-error-buttons">
          <button class="button has-icon rs-disconnect" onclick="${() => this.rs.disconnect()}">
            <img src="/images/cross.svg" class="rs-icon rs-power-icon" />
          </button>
        </div>
      </div>`;

    let iconBrand = this.rs.backend ? this.rs.backend : false;

    let customIcon = false;
    if (this.rs.backend === 'remotestorage' && this.rs.remote.userAddress && this.rs.remote.connected) {
      let provider = this.rs.remote.userAddress.split('@')[1];
      customIcon = `https://logo.clearbit.com/${provider}`;
    }

    let connected = html`<div class="${'connected' + (this.isSyncing ? ' is-syncing' : '')}">
      <img class="rs-main-logo" id="${`logo-${iconBrand}`}" src="${customIcon ? customIcon : `/images/${iconBrand}.svg`}">
      <div class="rs-connected-text">
        <h3 class="title">${this.rs.remote.userAddress}</h3>
        <div class="description">${this.statusText()}</div>
      </div>
      <div class="rs-connected-buttons">
        ${this.rs.hasFeature('Sync') ? html`<button class="button only-icon" onclick="${() => this.sync()}">
          <img src="/images/loop.svg" class="rs-icon rs-loop-icon">
        </button>` : ''}
        <button class="button only-icon" onclick="${() => this.rs.disconnect()}">
          <img src="/images/cross.svg" class="rs-icon rs-power-icon" />
        </button>
      </div>
    </div>`;

    return html`
      ${this.rs.remote.connected ? connected : ''}
      ${!this.showLogin && !this.rs.remote.connected ? choose : ''}
      ${this.showLogin ? signIn : ''}
      ${this.status === 'error' ? error : ''}
    `
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

    this.storage = remoteStorage;

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
