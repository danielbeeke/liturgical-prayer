let exports = {};

/*! remotestorage.js 1.2.3, https://remotestorage.io, MIT licensed */
!function (e, t) {
  exports.RemoteStorage = t();
}(this, (function () {
  return function (e) {
    var t = {};

    function r(n) {
      if (t[n]) return t[n].exports;
      var o = t[n] = {i: n, l: !1, exports: {}};
      return e[n].call(o.exports, o, o.exports, r), o.l = !0, o.exports
    }

    return r.m = e, r.c = t, r.d = function (e, t, n) {
      r.o(e, t) || Object.defineProperty(e, t, {enumerable: !0, get: n})
    }, r.r = function (e) {
      "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {value: "Module"}), Object.defineProperty(e, "__esModule", {value: !0})
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
          "string" == typeof e ? console.error(e) : console.error(e.message, e.stack)
        },
        globalContext: "undefined" != typeof window ? window : "object" === ("undefined" == typeof self ? "undefined" : n(self)) ? self : t,
        getGlobalContext: function () {
          return "undefined" != typeof window ? window : "object" === ("undefined" == typeof self ? "undefined" : n(self)) ? self : t
        },
        extend: function (e) {
          var t = Array.prototype.slice.call(arguments, 1);
          return t.forEach((function (t) {
            for (var r in t) e[r] = t[r]
          })), e
        },
        containingFolder: function (e) {
          if ("" === e) return "/";
          if (!e) throw"Path not given!";
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
          for (var t in this) "function" == typeof e[t] && (e[t] = e[t].bind(e))
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
                (u = r.slice()).push(t[i])
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
            if ("object" === n(t) && !Array.isArray(t) && null !== t) for (o in t) "object" === n(t[o]) && null !== t[o] && ("[object ArrayBuffer]" === t[o].toString() ? (r[o] = new ArrayBuffer(t[o].byteLength), i = new Int8Array(t[o]), new Int8Array(r[o]).set(i)) : e(t[o], r[o]))
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
              i(s.toString(n))
            } else {
              var a;
              if (o.globalContext.BlobBuilder = o.globalContext.BlobBuilder || o.globalContext.WebKitBlobBuilder, void 0 !== o.globalContext.BlobBuilder) {
                var u = new t.BlobBuilder;
                u.append(e), a = u.getBlob()
              } else a = new Blob([e]);
              var c = new FileReader;
              "function" == typeof c.addEventListener ? c.addEventListener("loadend", (function (e) {
                i(e.target.result)
              })) : c.onloadend = function (e) {
                i(e.target.result)
              }, c.readAsText(a, n)
            }
          }))
        }
      };
      e.exports = o
    }).call(this, r(10), r(18).Buffer)
  }, function (e, t, r) {
    var n = r(3);
    e.exports = function () {
      n.logging && console.log.apply(console, arguments)
    }
  }, function (e, t, r) {
    var n = r(1), o = {
      addEventListener: function (e, t) {
        if ("string" != typeof e) throw new Error("Argument eventName should be a string");
        if ("function" != typeof t) throw new Error("Argument handler should be a function");
        n("[Eventhandling] Adding event listener", e), this._validateEvent(e), this._handlers[e].push(t)
      }, removeEventListener: function (e, t) {
        this._validateEvent(e);
        for (var r = this._handlers[e].length, n = 0; n < r; n++) if (this._handlers[e][n] === t) return void this._handlers[e].splice(n, 1)
      }, _emit: function (e) {
        this._validateEvent(e);
        var t = Array.prototype.slice.call(arguments, 1);
        this._handlers[e].slice().forEach((function (e) {
          e.apply(this, t)
        }))
      }, _validateEvent: function (e) {
        if (!(e in this._handlers)) throw new Error("Unknown event: " + e)
      }, _delegateEvent: function (e, t) {
        t.on(e, function (t) {
          this._emit(e, t)
        }.bind(this))
      }, _addEvent: function (e) {
        this._handlers[e] = []
      }
    };
    o.on = o.addEventListener, o.off = o.removeEventListener, e.exports = function (e) {
      var t = Array.prototype.slice.call(arguments, 1);
      for (var r in o) e[r] = o[r];
      e._handlers = {}, t.forEach((function (t) {
        e._addEvent(t)
      }))
    }
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
    e.exports = r
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
          e.rsDiscovery = JSON.parse(atob(o)), (n = n.replace(new RegExp("&?rsDiscovery=" + o), "")).length > 0 && (e.state = n)
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
        a += "rsDiscovery=" + btoa(JSON.stringify(c))
      }
      var l = function (e, t, r, n) {
        var o = t.indexOf("#"), i = e;
        return i += e.indexOf("?") > 0 ? "&" : "?", i += "redirect_uri=" + encodeURIComponent(t.replace(/#.*$/, "")), i += "&scope=" + encodeURIComponent(r), i += "&client_id=" + encodeURIComponent(n), -1 !== o && o + 1 !== t.length && (i += "&state=" + encodeURIComponent(t.substring(o + 1))), i += "&response_type=token"
      }(n, a, s, u);
      if (i.globalContext.cordova) return e.openWindow(l, a, "location=yes,clearsessioncache=yes,clearcache=yes").then((function (e) {
        t.remote.configure({token: e.access_token})
      }));
      e.setLocation(l)
    };
    u.IMPLIED_FAKE_TOKEN = !1, u.Unauthorized = function (e) {
      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      this.name = "Unauthorized", this.message = void 0 === e ? "App authorization expired or revoked." : e, void 0 !== t.code && (this.code = t.code), this.stack = (new Error).stack
    }, u.Unauthorized.prototype = Object.create(Error.prototype), u.Unauthorized.prototype.constructor = u.Unauthorized, u.getLocation = function () {
      return document.location
    }, u.setLocation = function (e) {
      if ("string" == typeof e) document.location.href = e; else {
        if ("object" !== n(e)) throw"Invalid location " + e;
        document.location = e
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
        })), i.addEventListener("exit", a)
      }))
    }, u._rs_supported = function () {
      return "undefined" != typeof document
    }, u._rs_init = function (e) {
      a = function () {
        var n = !1;
        if (r) {
          if (r.error) throw"access_denied" === r.error ? new u.Unauthorized("Authorization failed: access denied", {code: "access_denied"}) : new u.Unauthorized("Authorization failed: ".concat(r.error));
          r.rsDiscovery && e.remote.configure(r.rsDiscovery), r.access_token && (e.remote.configure({token: r.access_token}), n = !0), r.remotestorage && (e.connect(r.remotestorage), n = !0), r.state && (t = u.getLocation(), u.setLocation(t.href.split("#")[0] + "#" + r.state))
        }
        n || e.remote.stopWaitingForToken()
      };
      var t, r = s();
      r && ((t = u.getLocation()).hash = ""), e.on("features-loaded", a)
    }, u._rs_cleanup = function (e) {
      e.removeEventListener("features-loaded", a)
    }, e.exports = u
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o = r(2), i = r(0), s = r(3), a = r(22), u = r(23), c = u.SchemaNotFound, l = function (e, t) {
      if ("/" !== t[t.length - 1]) throw"Not a folder: " + t;
      "/" === t && (this.makePath = function (e) {
        return ("/" === e[0] ? "" : "/") + e
      }), this.storage = e, this.base = t;
      var r = this.base.split("/");
      r.length > 2 ? this.moduleName = r[1] : this.moduleName = "root", o(this, "change"), this.on = this.on.bind(this), e.onChange(this.base, this._fireChange.bind(this))
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
                  e.body = JSON.parse(e.body)
                } catch (e) {
                }
                "object" === n(e.body) && (r.body[o] = e.body)
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
            throw"Not valid JSON: " + this.makePath(e)
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
        if ("string" != typeof e) throw"Argument 'path' of baseClient.getItemURL must be a string";
        return this.storage.connected ? (e = this._cleanPath(this.makePath(e)), this.storage.remote.href + e) : void 0
      }, cache: function (e, t) {
        if ("string" != typeof e) throw"Argument 'path' of baseClient.cache must be a string";
        if (void 0 === t) t = "ALL"; else if ("string" != typeof t) throw"Argument 'strategy' of baseClient.cache must be a string or undefined";
        if ("FLUSH" !== t && "SEEN" !== t && "ALL" !== t) throw'Argument \'strategy\' of baseclient.cache must be one of ["FLUSH", "SEEN", "ALL"]';
        return this.storage.caching.set(this.makePath(e), t), this
      }, flush: function (e) {
        return this.storage.local.flush(e)
      }, declareType: function (e, t, r) {
        r || (r = t, t = this._defaultTypeURI(e)), l.Types.declare(this.moduleName, e, t, r)
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
        e["@context"] = l.Types.resolveAlias(this.moduleName + "/" + t) || this._defaultTypeURI(t)
      }, makePath: function (e) {
        return this.base + (e || "")
      }, _fireChange: function (e) {
        s.changeEvents[e.origin] && (["new", "old", "lastCommon"].forEach((function (t) {
          if ((!e[t + "ContentType"] || /^application\/(.*)json(.*)/.exec(e[t + "ContentType"])) && "string" == typeof e[t + "Value"]) try {
            e[t + "Value"] = JSON.parse(e[t + "Value"])
          } catch (e) {
          }
        })), this._emit("change", e))
      }, _cleanPath: i.cleanPath
    }, l._rs_init = function () {
    }, e.exports = l
  }, function (e, t, r) {
    "use strict";

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
      }
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
          this.configure(t)
        }.bind(this), 0)
      }
      this._revisionCache = {}, this.connected && setTimeout(this._emit.bind(this), 0, "connected")
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
        }))
      }, stopWaitingForToken: function () {
        this.connected || this._emit("not-connected")
      }, get: function (e, t) {
        var r = this;
        if (!this.connected) return Promise.reject("not connected (path: " + e + ")");
        t || (t = {});
        var o = {};
        return this.supportsRevs && t.ifNoneMatch && (o["If-None-Match"] = b(t.ifNoneMatch)), this._request("GET", this.href + m(e), this.token, o, void 0, this.supportsRevs, this._revisionCache[e]).then((function (t) {
          if (!p(e)) return Promise.resolve(t);
          var o, i = {};
          if (void 0 !== t.body) try {
            t.body = JSON.parse(t.body)
          } catch (t) {
            return Promise.reject("Folder description at " + r.href + m(e) + " is not JSON")
          }
          if (200 === t.statusCode && "object" === n(t.body)) {
            if (0 === Object.keys(t.body).length) t.statusCode = 404; else if ("http://remotestorage.io/spec/folder-description" === (o = t.body)["@context"] && "object" === n(o.items)) {
              for (var s in t.body.items) r._revisionCache[e + s] = t.body.items[s].ETag;
              i = t.body.items
            } else Object.keys(t.body).forEach((function (n) {
              r._revisionCache[e + n] = t.body[n], i[n] = {ETag: t.body[n]}
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
          i[t.toUpperCase()] = e
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
          t("timeout"), o && o.abort()
        }), l.requestTimeout)
      }));
      return Promise.race([a, u])
    }, w._xhrRequest = function (e, t, r) {
      return new Promise((function (o, a) {
        s("[WireClient]", e, t);
        var u = !1, c = setTimeout((function () {
          u = !0, a("timeout")
        }), l.requestTimeout), h = new XMLHttpRequest;
        if (h.open(e, t, !0), r.responseType && (h.responseType = r.responseType), r.headers) for (var f in r.headers) h.setRequestHeader(f, r.headers[f]);
        h.onload = function () {
          u || (clearTimeout(c), o(h))
        }, h.onerror = function (e) {
          u || (clearTimeout(c), a(e))
        };
        var d = r.body;
        "object" === n(d) && !i(d) && d instanceof ArrayBuffer && (d = new Uint8Array(d)), h.send(d)
      }))
    }, Object.defineProperty(w.prototype, "storageType", {
      get: function () {
        if (this.storageApi) {
          var e = this.storageApi.match(/draft-dejong-(remotestorage-\d\d)/);
          return e ? e[1] : "2012.04"
        }
      }
    }), w._rs_init = function (e) {
      o = a.localStorageAvailable(), e.remote = new w(e), this.online = !0
    }, w._rs_supported = function () {
      return "function" == typeof fetch || "function" == typeof XMLHttpRequest
    }, w._rs_cleanup = function () {
      o && delete localStorage[h]
    }, e.exports = w
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
          t.set(e, n)
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
        n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n)
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
          r.addTask(e), r.doTasks()
        })), this.rs.caching.onActivate((function (e) {
          r.addTask(e), r.doTasks()
        })), w(this, "done", "req-done")
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
                })
              }

              _.on("background", (function () {
                return t(!1)
              })), _.on("foreground", (function () {
                return t(!0)
              }))
            }(t), t.sync || (t.sync = new e(t), t.syncStopped && (P("[Sync] Instantiating sync stopped"), t.sync.stopped = !0, delete t.syncStopped)), P("[Sync] syncCycleCb calling syncCycle"), t.syncCycle()
          }, d = function () {
            t.removeEventListener("connected", d), t.startSync()
          }, t.on("ready", f), t.on("connected", d)
        }
      }, {
        key: "_rs_cleanup", value: function (e) {
          e.stopSync(), e.removeEventListener("ready", f), e.removeEventListener("connected", d), e.sync = void 0, delete e.sync
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
              }))
            }.bind(t)), t.doTasks()) : n("cannot fulfill maxAge requirement - remote is not online") : n("cannot fulfill maxAge requirement - remote is not connected")
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
            t > 100 || (e.isCorrupt(r) ? (P("[Sync] WARNING: corrupt node in local cache", r), "object" === c(r) && r.path && (e.addTask(r.path), t++)) : e.needsFetch(r) && e.rs.access.checkPathPermission(r.path, "r") ? (e.addTask(r.path), t++) : y(r.path) && e.needsPush(r) && e.rs.access.checkPathPermission(r.path, "rw") && (e.addTask(r.path), t++))
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
          for (var e in this._tasks) for (var t = b(e), r = 1; r < t.length; r++) this._tasks[t[r]] && (Array.isArray(this._tasks[e]) && this._tasks[e].length && Array.prototype.push.apply(this._tasks[t[r]], this._tasks[e]), delete this._tasks[e])
        }
      }, {
        key: "collectRefreshTasks", value: function () {
          var e = this;
          return this.rs.local.forAllNodes((function (t) {
            var r;
            if (e.needsRefresh(t)) {
              try {
                r = e.getParentPath(t.path)
              } catch (e) {
              }
              r && e.rs.access.checkPathPermission(r, "r") ? e.addTask(r) : e.rs.access.checkPathPermission(t.path, "r") && e.addTask(t.path)
            }
          })).then((function () {
            e.deleteChildPathsFromTasks()
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
            g(e.local.itemsMap, e.common.itemsMap) && delete e.local
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
              e.common = e.remote, delete e.remote
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
          })
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
                f && f.local && (delete f.local.itemsMap[d], g(f.local.itemsMap, f.common.itemsMap) && delete f.local)
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
              if (e && e.itemsMap) for (var r in e.itemsMap) n[t + r] = !0
            };
            for (var i in e) {
              var s = e[i];
              s && (m(i) ? (o(s.common, i), o(s.local, i)) : s.common && void 0 !== s.common.body && (t[i] = v(s), t[i].remote = {
                body: !1,
                timestamp: r.now()
              }, t[i] = r.autoMerge(t[i])))
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
              if (e && e.itemsMap) for (a in e.itemsMap) t[a] || (l[a] = !0)
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
              delete t._tasks[e.path]
            }
            t.rs._emit("sync-req-done"), t.collectTasks(!1).then((function () {
              !t.hasTasks() || t.stopped ? (P("[Sync] Sync is done! Reschedule?", Object.getOwnPropertyNames(t._tasks).length, t.stopped), t.done || (t.done = !0, t.rs._emit("sync-done"))) : setTimeout((function () {
                t.doTasks()
              }), 10)
            }))
          }), (function (r) {
            P("[Sync] Error", r), delete t._timeStarted[e.path], delete t._running[e.path], t.rs._emit("sync-req-done"), t.done || (t.done = !0, t.rs._emit("sync-done"))
          }));
          delete this._running[e.path]
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
          this._tasks[e] || (this._tasks[e] = []), "function" == typeof t && this._tasks[e].push(t)
        }
      }, {
        key: "sync", value: function () {
          var e = this;
          return this.done = !1, this.doTasks() ? Promise.resolve() : this.collectTasks().then((function () {
            try {
              e.doTasks()
            } catch (e) {
              P("[Sync] doTasks error", e)
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
        }), t && a(e, t)
      }(t, e), t
    }(o(Error)), e.exports = k
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
              }; else u = p(u, e[o - 1].substring(a.length))
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
            } else console.error("Cannot delete non-existing node " + o)
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
            }), e[r] = void 0
          }
          return t.setNodes(e)
        }))
      }, _emitChange: function (e) {
        i.changeEvents[e.origin] && this._emit("change", e)
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
            })
          })).then((function () {
            e._emit("local-events-done")
          }))
        }
      }, onDiff: function (e) {
        this.diffHandler = e
      }, migrate: function (e) {
        return "object" !== n(e) || e.common || (e.common = {}, "string" == typeof e.path ? "/" === e.path.substr(-1) && "object" === n(e.body) && (e.common.itemsMap = e.body) : (e.local || (e.local = {}), e.local.body = e.body, e.local.contentType = e.contentType)), e
      }, _updateNodesRunning: !1, _updateNodesQueued: [], _updateNodes: function (e, t) {
        return new Promise(function (r, n) {
          this._doUpdateNodes(e, t, {resolve: r, reject: n})
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
            n._emitChangeEvents(l), r.resolve({statusCode: 200})
          }))
        })).then((function () {
          return Promise.resolve()
        }), (function (e) {
          r.reject(e)
        })).then((function () {
          n._updateNodesRunning = !1;
          var e = n._updateNodesQueued.shift();
          e && n._doUpdateNodes(e.paths, e.cb, e.promise)
        })))
      }, _emitChangeEvents: function (e) {
        for (var t = 0, r = e.length; t < r; t++) this._emitChange(e[t]), this.diffHandler && this.diffHandler(e[t].path)
      }, _getAllDescendentPaths: function (e) {
        var t = this;
        return a(e) ? t.getNodes([e]).then((function (r) {
          var n = [e], o = l(r[e]), i = Object.keys(o.itemsMap).map((function (r) {
            return t._getAllDescendentPaths(e + r).then((function (e) {
              for (var t = 0, r = e.length; t < r; t++) n.push(e[t])
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
      for (var t in m) e[t] = m[t]
    }
  }, function (e, t, r) {
    "use strict";

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
            this.remote && !this.remote.connected && setTimeout(r, 0)
        }
        return t.call(this, e, r)
      }, this._init(), this.fireInitial = function () {
        this.local && setTimeout(this.local.fireInitial.bind(this.local), 0)
      }.bind(this), this.on("ready", this.fireInitial.bind(this)), this.loadModules()
    };

    function _(e) {
      return "number" == typeof e && e > 1e3 && e < 36e5
    }

    b.Authorize = h, b.SyncError = f.SyncError, b.Unauthorized = h.Unauthorized, b.DiscoveryError = u.DiscoveryError, b.prototype = {
      loadModules: function () {
        l.modules.forEach(this.addModule.bind(this))
      },
      authorize: function (e) {
        this.access.setStorageType(this.remote.storageApi), void 0 === e.scope && (e.scope = this.access.scopeParameter), e.redirectUri = m.cordova ? l.cordovaRedirectUri : String(h.getLocation()), void 0 === e.clientId && (e.clientId = e.redirectUri.match(/^(https?:\/\/[^/]+)/)[0]), h(this, e)
      },
      impliedauth: function (e, t) {
        e = this.remote.storageApi, t = String(document.location), d("ImpliedAuth proceeding due to absent authURL; storageApi = " + e + " redirectUri = " + t), this.remote.configure({token: h.IMPLIED_FAKE_TOKEN}), document.location = t
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
            this._emit("error", new b.DiscoveryError("No storage information found for this user address."))
          }.bind(this), l.discoveryTimeout);
          u(e).then((function (o) {
            if (clearTimeout(n), r._emit("authing"), o.userAddress = e, r.remote.configure(o), !r.remote.connected) if (o.authURL) if (void 0 === t) r.authorize({authURL: o.authURL}); else {
              if ("string" != typeof t) throw new Error("Supplied bearer token must be a string");
              d("Skipping authorization sequence and connecting with known token"), r.remote.configure({token: t})
            } else r.impliedauth()
          }), (function () {
            clearTimeout(n), r._emit("error", new b.DiscoveryError("No storage information found for this user address."))
          }))
        }
      },
      reconnect: function () {
        this.remote.configure({token: null}), "remotestorage" === this.backend ? this.connect(this.remote.userAddress) : this.remote.connect()
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
          ++t >= e && (this._init(), d("Done cleaning up, emitting disconnected and disconnect events"), this._emit("disconnected"))
        }.bind(this);
        e > 0 ? this._cleanups.forEach(function (e) {
          var t = e(this);
          "object" === n(t) && "function" == typeof t.then ? t.then(r) : r()
        }.bind(this)) : r()
      },
      setBackend: function (e) {
        this.backend = e, o && (e ? localStorage.setItem("remotestorage:backend", e) : localStorage.removeItem("remotestorage:backend"))
      },
      onChange: function (e, t) {
        this._pathHandlers.change[e] || (this._pathHandlers.change[e] = []), this._pathHandlers.change[e].push(t)
      },
      enableLog: function () {
        l.logging = !0
      },
      disableLog: function () {
        l.logging = !1
      },
      log: function () {
        d.apply(b, arguments)
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
                t.apiKeys.googledrive = {clientId: n}, void 0 !== t.googledrive && t.googledrive.clientId === n || a._rs_init(t)
            }
            return !0
          }
          delete t.apiKeys[r]
        })), o && localStorage.setItem("remotestorage:api-keys", JSON.stringify(this.apiKeys))
      },
      setCordovaRedirectUri: function (e) {
        if ("string" != typeof e || !e.match(/http(s)?:\/\//)) throw new Error("Cordova redirect URI must be a URI string");
        l.cordovaRedirectUri = e
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

        this.get = r(e.get), this.put = r(e.put), this.delete = r(e.delete)
      },
      _pendingGPD: function (e) {
        return function () {
          var t = Array.prototype.slice.call(arguments);
          return new Promise(function (r, n) {
            this._pending.push({method: e, args: t, promise: {resolve: r, reject: n}})
          }.bind(this))
        }.bind(this)
      },
      _processPending: function () {
        this._pending.forEach(function (e) {
          try {
            this[e.method].apply(this, e.args).then(e.promise.resolve, e.promise.reject)
          } catch (t) {
            e.promise.reject(t)
          }
        }.bind(this)), this._pending = []
      },
      _bindChange: function (e) {
        e.on("change", this._dispatchEvent.bind(this, "change"))
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
              e(o)
            } catch (e) {
              console.error("'change' handler failed: ", e, e.stack), r._emit("error", e)
            }
          }))
        }))
      },
      scope: function (e) {
        if ("string" != typeof e) throw"Argument 'path' of baseClient.scope must be a string";
        if (!this.access.checkPathPermission(e, "r")) {
          var t = e.replace(/(['\\])/g, "\\$1");
          console.warn("WARNING: please call remoteStorage.access.claim('" + t + "', 'r') (read only) or remoteStorage.access.claim('" + t + "', 'rw') (read/write) first")
        }
        return new c(this, e)
      },
      getSyncInterval: function () {
        return l.syncInterval
      },
      setSyncInterval: function (e) {
        if (!_(e)) throw e + " is not a valid sync interval";
        var t = l.syncInterval;
        l.syncInterval = parseInt(e, 10), this._emit("sync-interval-change", {oldValue: t, newValue: e})
      },
      getBackgroundSyncInterval: function () {
        return l.backgroundSyncInterval
      },
      setBackgroundSyncInterval: function (e) {
        if (!_(e)) throw e + " is not a valid sync interval";
        var t = l.backgroundSyncInterval;
        l.backgroundSyncInterval = parseInt(e, 10), this._emit("sync-interval-change", {oldValue: t, newValue: e})
      },
      getCurrentSyncInterval: function () {
        return l.isBackground ? l.backgroundSyncInterval : l.syncInterval
      },
      getRequestTimeout: function () {
        return l.requestTimeout
      },
      setRequestTimeout: function (e) {
        l.requestTimeout = parseInt(e, 10)
      },
      syncCycle: function () {
        this.sync && !this.sync.stopped && (this.on("sync-done", function () {
          d("[Sync] Sync done. Setting timer to", this.getCurrentSyncInterval()), this.sync && !this.sync.stopped && (this._syncTimer && (clearTimeout(this._syncTimer), this._syncTimer = void 0), this._syncTimer = setTimeout(this.sync.sync.bind(this.sync), this.getCurrentSyncInterval()))
        }.bind(this)), this.sync.sync())
      },
      startSync: function () {
        return l.cache ? (this.sync.stopped = !1, this.syncStopped = !1, this.sync.sync()) : (console.warn("Nothing to sync, because caching is disabled."), Promise.resolve())
      },
      stopSync: function () {
        clearTimeout(this._syncTimer), this._syncTimer = void 0, this.sync ? (d("[Sync] Stopping sync"), this.sync.stopped = !0) : (d("[Sync] Will instantiate sync stopped"), this.syncStopped = !0)
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
    }), e.exports = b, r(32)
  }, function (e, t) {
    var r;
    r = function () {
      return this
    }();
    try {
      r = r || new Function("return this")()
    } catch (e) {
      "object" == typeof window && (r = window)
    }
    e.exports = r
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
          t && this.configure(t), this._itemRefs = y("".concat(f, ":shares")) || {}
        }
        this.connected && setTimeout(this._emit.bind(this), 0, "connected")
      };

    function P(e) {
      e._dropboxOrigSync || (e._dropboxOrigSync = e.sync.sync.bind(e.sync), e.sync.sync = function () {
        return this.dropbox.fetchDelta.apply(this.dropbox, arguments).then(e._dropboxOrigSync, (function (t) {
          e._emit("error", new h.SyncError(t)), e._emit("sync-done")
        }))
      }.bind(e))
    }

    function E(e) {
      e._dropboxOrigSyncCycle && (e.syncCycle = e._dropboxOrigSyncCycle, delete e._dropboxOrigSyncCycle)
    }

    function S(e) {
      !function (e) {
        e._origRemote || (e._origRemote = e.remote, e.remote = e.dropbox)
      }(e), e.sync ? P(e) : function (e) {
        var t = arguments;
        e._dropboxOrigSyncCycle || (e._dropboxOrigSyncCycle = e.syncCycle, e.syncCycle = function () {
          if (!e.sync) throw new Error("expected sync to be initialized by now");
          P(e), e._dropboxOrigSyncCycle(t), E(e)
        })
      }(e), function (e) {
        e._origBaseClientGetItemURL || (e._origBaseClientGetItemURL = s.prototype.getItemURL, s.prototype.getItemURL = function () {
          throw new Error("getItemURL is not implemented for Dropbox yet")
        })
      }(e)
    }

    function T(e) {
      !function (e) {
        e._origRemote && (e.remote = e._origRemote, delete e._origRemote)
      }(e), function (e) {
        e._dropboxOrigSync && (e.sync.sync = e._dropboxOrigSync, delete e._dropboxOrigSync)
      }(e), function (e) {
        e._origBaseClientGetItemURL && (s.prototype.getItemURL = e._origBaseClientGetItemURL, delete e._origBaseClientGetItemURL)
      }(e), E(e)
    }

    w.prototype = {
      online: !0, connect: function () {
        this.rs.setBackend("dropbox"), this.token ? S(this.rs) : this.rs.authorize({
          authURL: "https://www.dropbox.com/oauth2/authorize",
          scope: "",
          clientId: this.clientId
        })
      }, configure: function (e) {
        void 0 !== e.userAddress && (this.userAddress = e.userAddress), void 0 !== e.token && (this.token = e.token);
        var t = function () {
          o && localStorage.setItem(f, JSON.stringify({userAddress: this.userAddress, token: this.token}))
        }, r = function () {
          this.connected = !1, o && localStorage.removeItem(f)
        };
        this.token ? (this.connected = !0, this.userAddress ? (this._emit("connected"), t.apply(this)) : this.info().then(function (e) {
          this.userAddress = e.email, this._emit("connected"), t.apply(this)
        }.bind(this)).catch(function () {
          r.apply(this), this.rs._emit("error", new Error("Could not fetch user info."))
        }.bind(this))) : r.apply(this)
      }, stopWaitingForToken: function () {
        this.connected || this._emit("not-connected")
      }, _getFolder: function (e) {
        var t = this._revCache, r = this, n = function (n) {
          var i, s;
          if (200 !== n.status && 409 !== n.status) return Promise.reject("Unexpected response status: " + n.status);
          try {
            i = JSON.parse(n.responseText)
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
              r = JSON.parse(r)
            } catch (e) {
              return Promise.reject(e)
            }
            if (409 === a) return b(r, ["path", "not_found"]) ? {statusCode: 404} : Promise.reject(new Error('API error while downloading file ("' + e + '"): ' + r.error_summary));
            if (i = t.getResponseHeader("Content-Type"), s = r.rev, n._revCache.set(e, s), n._shareIfNeeded(e), m(u, i)) o = t.response; else try {
              o = JSON.parse(o), i = "application/json; charset=UTF-8"
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
        e.match(/^\/public\/.*[^/]$/) && void 0 === this._itemRefs[e] && this.share(e)
      }, share: function (e) {
        var t = this, r = {body: {path: v(e)}};
        return this._request("POST", "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", r).then((function (r) {
          if (200 !== r.status && 409 !== r.status) return Promise.reject(new Error("Invalid response status:" + r.status));
          var n;
          try {
            n = JSON.parse(r.responseText)
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
            t = JSON.parse(t)
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
              s = JSON.parse(o.responseText)
            } catch (e) {
              return Promise.reject(new Error("Invalid response body: " + o.responseText))
            }
            if (409 === o.status) {
              if (!b(s, ["path", "not_found"])) return Promise.reject(new Error("API returned an error: " + s.error_summary));
              s = {cursor: null, entries: [], has_more: !1}
            }
            if (n || r._revCache.deactivatePropagation(), s.entries.forEach((function (e) {
              var t = e.path_lower.substr("/remotestorage".length);
              "deleted" === e[".tag"] ? (r._revCache.delete(t), r._revCache.delete(t + "/")) : "file" === e[".tag"] && r._revCache.set(t, e.rev)
            })), r._fetchDeltaCursor = s.cursor, s.has_more) return e(s.cursor);
            r._revCache.activatePropagation(), r._initialFetchDone = !0
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
            t = JSON.parse(e.responseText)
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
            n = JSON.parse(n)
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
            t = JSON.parse(t)
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
            t = JSON.parse(e.responseText)
          } catch (t) {
            return Promise.reject(new Error("Invalid response body: " + e.responseText))
          }
          return 409 === e.status ? Promise.reject(new Error("API error: " + e.error_summary)) : t.links.length ? Promise.resolve(t.links[0].url) : Promise.reject(new Error("No links returned"))
        }), (function (t) {
          return t.message = 'Could not get link to a shared file or folder ("' + e + '"): ' + t.message, Promise.reject(t)
        }))
      }
    }, w._rs_init = function (e) {
      o = u.localStorageAvailable(), e.apiKeys.dropbox && (e.dropbox = new w(e)), "dropbox" === e.backend && S(e)
    }, w._rs_supported = function () {
      return !0
    }, w._rs_cleanup = function (e) {
      T(e), o && localStorage.removeItem(f), e.setBackend(void 0)
    }, e.exports = w
  }, function (e, t, r) {
    var n = r(2), o = "undefined" != typeof window ? "browser" : "node", i = {}, s = function () {
      return i
    };
    s.isBrowser = function () {
      return "browser" === o
    }, s.isNode = function () {
      return "node" === o
    }, s.goBackground = function () {
      s._emit("background")
    }, s.goForeground = function () {
      s._emit("foreground")
    }, s._rs_init = function () {
      function e() {
        document[i.hiddenProperty] ? s.goBackground() : s.goForeground()
      }

      n(s, "background", "foreground"), "browser" === o && (void 0 !== document.hidden ? (i.hiddenProperty = "hidden", i.visibilityChangeEvent = "visibilitychange") : void 0 !== document.mozHidden ? (i.hiddenProperty = "mozHidden", i.visibilityChangeEvent = "mozvisibilitychange") : void 0 !== document.msHidden ? (i.hiddenProperty = "msHidden", i.visibilityChangeEvent = "msvisibilitychange") : void 0 !== document.webkitHidden && (i.hiddenProperty = "webkitHidden", i.visibilityChangeEvent = "webkitvisibilitychange"), document.addEventListener(i.visibilityChangeEvent, e, !1), e())
    }, s._rs_cleanup = function () {
    }, e.exports = s
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
      this.maxAge = e, this._items = {}
    };
    w.prototype = {
      get: function (e) {
        var t = this._items[e], r = (new Date).getTime();
        return t && t.t >= r - this.maxAge ? t.v : void 0
      }, set: function (e, t) {
        this._items[e] = {v: t, t: (new Date).getTime()}
      }
    };
    var P = function (e, t) {
      if (a(this, "connected", "not-connected"), this.rs = e, this.clientId = t, this._fileIdCache = new w(300), o = u.localStorageAvailable()) {
        var r = p(l);
        r && this.configure(r)
      }
    };
    P.prototype = {
      connected: !1, online: !0, configure: function (e) {
        var t = this;
        void 0 !== e.userAddress && (this.userAddress = e.userAddress), void 0 !== e.token && (this.token = e.token);
        var r = function () {
          o && localStorage.setItem(l, JSON.stringify({userAddress: this.userAddress, token: this.token}))
        }, n = function () {
          this.connected = !1, delete this.token, o && localStorage.removeItem(l)
        };
        this.token ? (this.connected = !0, this.userAddress ? (this._emit("connected"), r.apply(this)) : this.info().then((function (e) {
          t.userAddress = e.user.emailAddress, t._emit("connected"), r.apply(t)
        })).catch((function () {
          n.apply(t), t.rs._emit("error", new Error("Could not fetch user info."))
        }))) : n.apply(this)
      }, connect: function () {
        this.rs.setBackend("googledrive"), this.rs.authorize({
          authURL: "https://accounts.google.com/o/oauth2/auth",
          scope: "https://www.googleapis.com/auth/drive",
          clientId: this.clientId
        })
      }, stopWaitingForToken: function () {
        this.connected || this._emit("not-connected")
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
              e.mimeType += ";export=text/html", e.downloadUrl = e.exportLinks["text/html"]
            }
            return r._request("GET", e.downloadUrl, {responseType: "arraybuffer"}).then((function (t) {
              return m(t.response, "UTF-8").then((function (r) {
                var n = r;
                if (e.mimeType.match(/^application\/json/)) try {
                  n = JSON.parse(n)
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
          return r ? (n = "'" + r + "' in parents", "items(downloadUrl,etag,fileSize,id,mimeType,title)", t._request("GET", c + "/drive/v2/files?q=" + encodeURIComponent(n) + "&fields=" + encodeURIComponent("items(downloadUrl,etag,fileSize,id,mimeType,title)") + "&maxResults=1000", {}).then((function (r) {
            if (200 !== r.status) return Promise.reject("request failed or something: " + r.status);
            try {
              o = JSON.parse(r.responseText)
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
                })
              }
            } catch (e) {
              a = !0, u = e
            } finally {
              try {
                n || null == l.return || l.return()
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
      })))
    }, P._rs_supported = function () {
      return !0
    }, P._rs_cleanup = function (e) {
      var t;
      e.setBackend(void 0), e._origRemote && (e.remote = e._origRemote, delete e._origRemote), (t = e)._origBaseClientGetItemURL && (i.prototype.getItemURL = t._origBaseClientGetItemURL, delete t._origBaseClientGetItemURL)
    }, e.exports = P
  }, function (e, t, r) {
    "use strict";

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
      this.name = "DiscoveryError", this.message = e, this.stack = (new Error).stack
    }).prototype = Object.create(Error.prototype), c.DiscoveryError.prototype.constructor = c.DiscoveryError, c._rs_init = function () {
      if (o = s.localStorageAvailable()) {
        var e;
        try {
          e = JSON.parse(localStorage["remotestorage:discover"])
        } catch (e) {
        }
        e && (u = e.cache)
      }
    }, c._rs_supported = function () {
      return !!s.globalContext.XMLHttpRequest
    }, c._rs_cleanup = function () {
      o && delete localStorage["remotestorage:discover"]
    }, e.exports = c
  }, function (e, t) {
    var r = function () {
      this.reset()
    };
    r.prototype = {
      claim: function (e, t) {
        if ("string" != typeof e || -1 !== e.indexOf("/") || 0 === e.length) throw new Error("Scope should be a non-empty string without forward slashes");
        if (!t.match(/^rw?$/)) throw new Error("Mode should be either 'r' or 'rw'");
        this._adjustRootPaths(e), this.scopeModeMap[e] = t
      }, get: function (e) {
        return this.scopeModeMap[e]
      }, remove: function (e) {
        var t, r = {};
        for (t in this.scopeModeMap) r[t] = this.scopeModeMap[t];
        for (t in this.reset(), delete r[e], r) this.set(t, r[t])
      }, checkPermission: function (e, t) {
        var r = this.get(e);
        return r && ("r" === t || "rw" === r)
      }, checkPathPermission: function (e, t) {
        return !!this.checkPermission("*", t) || !!this.checkPermission(this._getModuleName(e), t)
      }, reset: function () {
        this.rootPaths = [], this.scopeModeMap = {}
      }, _getModuleName: function (e) {
        if ("/" !== e[0]) throw new Error("Path should start with a slash");
        var t = e.replace(/^\/public/, "").match(/^\/([^/]*)\//);
        return t ? t[1] : "*"
      }, _adjustRootPaths: function (e) {
        "*" in this.scopeModeMap || "*" === e ? this.rootPaths = ["/"] : e in this.scopeModeMap || (this.rootPaths.push("/" + e + "/"), this.rootPaths.push("/public/" + e + "/"))
      }, _scopeNameForParameter: function (e) {
        if ("*" === e.name && this.storageType) {
          if ("2012.04" === this.storageType) return "";
          if (this.storageType.match(/remotestorage-0[01]/)) return "root"
        }
        return e.name
      }, setStorageType: function (e) {
        this.storageType = e
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
    }, e.exports = r
  }, function (e, t, r) {
    var n = r(0), o = r(1), i = n.containingFolder, s = function () {
      this.reset()
    };
    s.prototype = {
      pendingActivations: [], set: function (e, t) {
        if ("string" != typeof e) throw new Error("path should be a string");
        if (!n.isFolder(e)) throw new Error("path should be a folder");
        if (this._remoteStorage && this._remoteStorage.access && !this._remoteStorage.access.checkPathPermission(e, "r")) throw new Error('No access to path "' + e + '". You have to claim access to it first.');
        if (!t.match(/^(FLUSH|SEEN|ALL)$/)) throw new Error("strategy should be 'FLUSH', 'SEEN', or 'ALL'");
        this._rootPaths[e] = t, "ALL" === t && (this.activateHandler ? this.activateHandler(e) : this.pendingActivations.push(e))
      }, enable: function (e) {
        this.set(e, "ALL")
      }, disable: function (e) {
        this.set(e, "FLUSH")
      }, onActivate: function (e) {
        var t;
        for (o("[Caching] Setting activate handler", e, this.pendingActivations), this.activateHandler = e, t = 0; t < this.pendingActivations.length; t++) e(this.pendingActivations[t]);
        delete this.pendingActivations
      }, checkPath: function (e) {
        return void 0 !== this._rootPaths[e] ? this._rootPaths[e] : "/" === e ? "SEEN" : this.checkPath(i(e))
      }, reset: function () {
        this._rootPaths = {}, this._remoteStorage = null
      }
    }, s._rs_init = function (e) {
      this._remoteStorage = e
    }, e.exports = s
  }, function (e, t, r) {
    e.exports = r(9)
  }, function (e, t, r) {
    "use strict";
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
            t = ("" + t).toLowerCase(), n = !0
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
            e = (e + "").toLowerCase(), n = !0
        }
      }

      function y(e, t, r) {
        var n = e[t];
        e[t] = e[r], e[r] = n
      }

      function g(e, t, r, n, o) {
        if (0 === e.length) return -1;
        if ("string" == typeof r ? (n = r, r = 0) : r > 2147483647 ? r = 2147483647 : r < -2147483648 && (r = -2147483648), r = +r, isNaN(r) && (r = o ? 0 : e.length - 1), r < 0 && (r = e.length + r), r >= e.length) {
          if (o) return -1;
          r = e.length - 1
        } else if (r < 0) {
          if (!o) return -1;
          r = 0
        }
        if ("string" == typeof t && (t = u.from(t, n)), u.isBuffer(t)) return 0 === t.length ? -1 : v(e, t, r, n, o);
        if ("number" == typeof t) return t &= 255, u.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? o ? Uint8Array.prototype.indexOf.call(e, t, r) : Uint8Array.prototype.lastIndexOf.call(e, t, r) : v(e, [t], r, n, o);
        throw new TypeError("val must be string, number or Buffer")
      }

      function v(e, t, r, n, o) {
        var i, s = 1, a = e.length, u = t.length;
        if (void 0 !== n && ("ucs2" === (n = String(n).toLowerCase()) || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
          if (e.length < 2 || t.length < 2) return -1;
          s = 2, a /= 2, u /= 2, r /= 2
        }

        function c(e, t) {
          return 1 === s ? e[t] : e.readUInt16BE(t * s)
        }

        if (o) {
          var l = -1;
          for (i = r; i < a; i++) if (c(e, i) === c(t, -1 === l ? 0 : i - l)) {
            if (-1 === l && (l = i), i - l + 1 === u) return l * s
          } else -1 !== l && (i -= i - l), l = -1
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
          e[r + s] = a
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
              i = e[o + 1], s = e[o + 2], a = e[o + 3], 128 == (192 & i) && 128 == (192 & s) && 128 == (192 & a) && (u = (15 & c) << 18 | (63 & i) << 12 | (63 & s) << 6 | 63 & a) > 65535 && u < 1114112 && (l = u)
          }
          null === l ? (l = 65533, h = 1) : l > 65535 && (l -= 65536, n.push(l >>> 10 & 1023 | 55296), l = 56320 | 1023 & l), n.push(l), o += h
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
          s.copy(n, o), o += s.length
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
          t |= 0, isFinite(r) ? (r |= 0, void 0 === n && (n = "utf8")) : (n = r, r = void 0)
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
            n = ("" + n).toLowerCase(), i = !0
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
        for (var o = 0, i = Math.min(e.length - r, 2); o < i; ++o) e[r + o] = (t & 255 << 8 * (n ? o : 1 - o)) >>> 8 * (n ? o : 1 - o)
      }

      function x(e, t, r, n) {
        t < 0 && (t = 4294967295 + t + 1);
        for (var o = 0, i = Math.min(e.length - r, 4); o < i; ++o) e[r + o] = t >>> 8 * (n ? o : 3 - o) & 255
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
          for (var i = 0; i < o; ++i) r[i] = this[i + e]
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
          M(this, e, t, r, o - 1, -o)
        }
        var i = 0, s = 1, a = 0;
        for (this[t] = 255 & e; ++i < r && (s *= 256);) e < 0 && 0 === a && 0 !== this[t + i - 1] && (a = 1), this[t + i] = (e / s >> 0) - a & 255;
        return t + r
      }, u.prototype.writeIntBE = function (e, t, r, n) {
        if (e = +e, t |= 0, !n) {
          var o = Math.pow(2, 8 * r - 1);
          M(this, e, t, r, o - 1, -o)
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
            o < 256 && (e = o)
          }
          if (void 0 !== n && "string" != typeof n) throw new TypeError("encoding must be a string");
          if ("string" == typeof n && !u.isEncoding(n)) throw new TypeError("Unknown encoding: " + n)
        } else "number" == typeof e && (e &= 255);
        if (t < 0 || this.length < t || this.length < r) throw new RangeError("Out of range index");
        if (r <= t) return this;
        var i;
        if (t >>>= 0, r = void 0 === r ? this.length : r >>> 0, e || (e = 0), "number" == typeof e) for (i = t; i < r; ++i) this[i] = e; else {
          var s = u.isBuffer(e) ? e : B(new u(e, n).toString()), a = s.length;
          for (i = 0; i < r - t; ++i) this[i + t] = s[i % a]
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
            r = 65536 + (o - 55296 << 10 | r - 56320)
          } else o && (t -= 3) > -1 && i.push(239, 191, 189);
          if (o = null, r < 128) {
            if ((t -= 1) < 0) break;
            i.push(r)
          } else if (r < 2048) {
            if ((t -= 2) < 0) break;
            i.push(r >> 6 | 192, 63 & r | 128)
          } else if (r < 65536) {
            if ((t -= 3) < 0) break;
            i.push(r >> 12 | 224, r >> 6 & 63 | 128, 63 & r | 128)
          } else {
            if (!(r < 1114112)) throw new Error("Invalid code point");
            if ((t -= 4) < 0) break;
            i.push(r >> 18 | 240, r >> 12 & 63 | 128, r >> 6 & 63 | 128, 63 & r | 128)
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
    }).call(this, r(10))
  }, function (e, t, r) {
    "use strict";
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

    o["-".charCodeAt(0)] = 62, o["_".charCodeAt(0)] = 63
  }, function (e, t) {
    t.read = function (e, t, r, n, o) {
      var i, s, a = 8 * o - n - 1, u = (1 << a) - 1, c = u >> 1, l = -7, h = r ? o - 1 : 0, f = r ? -1 : 1,
        d = e[t + h];
      for (h += f, i = d & (1 << -l) - 1, d >>= -l, l += a; l > 0; i = 256 * i + e[t + h], h += f, l -= 8) ;
      for (s = i & (1 << -l) - 1, i >>= -l, l += n; l > 0; s = 256 * s + e[t + h], h += f, l -= 8) ;
      if (0 === i) i = 1 - c; else {
        if (i === u) return s ? NaN : 1 / 0 * (d ? -1 : 1);
        s += Math.pow(2, n), i -= c
      }
      return (d ? -1 : 1) * s * Math.pow(2, i - n)
    }, t.write = function (e, t, r, n, o, i) {
      var s, a, u, c = 8 * i - o - 1, l = (1 << c) - 1, h = l >> 1,
        f = 23 === o ? Math.pow(2, -24) - Math.pow(2, -77) : 0, d = n ? 0 : i - 1, p = n ? 1 : -1,
        m = t < 0 || 0 === t && 1 / t < 0 ? 1 : 0;
      for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (a = isNaN(t) ? 1 : 0, s = l) : (s = Math.floor(Math.log(t) / Math.LN2), t * (u = Math.pow(2, -s)) < 1 && (s--, u *= 2), (t += s + h >= 1 ? f / u : f * Math.pow(2, 1 - h)) * u >= 2 && (s++, u /= 2), s + h >= l ? (a = 0, s = l) : s + h >= 1 ? (a = (t * u - 1) * Math.pow(2, o), s += h) : (a = t * Math.pow(2, h - 1) * Math.pow(2, o), s = 0)); o >= 8; e[r + d] = 255 & a, d += p, a /= 256, o -= 8) ;
      for (s = s << o | a, c += o; c > 0; e[r + d] = 255 & s, d += p, s /= 256, c -= 8) ;
      e[r + d - p] |= 128 * m
    }
  }, function (e, t) {
    var r = {}.toString;
    e.exports = Array.isArray || function (e) {
      return "[object Array]" == r.call(e)
    }
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
            m = g[0], y = parseInt(g[1], 10)
          }
          for (var v = {}; i[m.charAt(m.length - 1)];) v[m.charAt(m.length - 1)] = !0, m = m.substring(0, m.length - 1);
          var b = {truncate: y, name: m, suffices: v};
          f.push(b), d[m] = b, l.push(m)
        }
        var _ = function (e) {
          for (var t = "", o = 0, i = 0; i < f.length; i++) {
            var l = f[i], h = e(l.name);
            if (null == h || Array.isArray(h) && 0 === h.length || "object" == typeof h && 0 === Object.keys(h).length) o++; else if (t += i === o ? n : r || ",", Array.isArray(h)) {
              u && (t += l.name + "=");
              for (var d = 0; d < h.length; d++) d > 0 && (t += l.suffices["*"] && r || ",", l.suffices["*"] && u && (t += l.name + "=")), t += a ? encodeURIComponent(h[d]).replace(/!/g, "%21") : s(h[d])
            } else if ("object" == typeof h) {
              u && !l.suffices["*"] && (t += l.name + "=");
              var p = !0;
              for (var m in h) p || (t += l.suffices["*"] && r || ","), p = !1, t += a ? encodeURIComponent(m).replace(/!/g, "%21") : s(m), t += l.suffices["*"] ? "=" : ",", t += a ? encodeURIComponent(h[m]).replace(/!/g, "%21") : s(h[m])
            } else u && (t += l.name, c && "" === h || (t += "=")), null != l.truncate && (h = h.substring(0, l.truncate)), t += a ? encodeURIComponent(h).replace(/!/g, "%21") : s(h)
          }
          return t
        };
        return _.varNames = l, {prefix: n, substitution: _}
      }

      function u(e) {
        if (!(this instanceof u)) return new u(e);
        for (var t = e.split("{"), r = [t.shift()], n = [], o = [], i = []; t.length > 0;) {
          var s = t.shift(), c = s.split("}")[0], l = s.substring(c.length + 1), h = a(c);
          o.push(h.substitution), n.push(h.prefix), r.push(l), i = i.concat(h.substitution.varNames)
        }
        this.fill = function (e) {
          for (var t = r[0], n = 0; n < o.length; n++) t += (0, o[n])(e), t += r[n + 1];
          return t
        }, this.varNames = i, this.template = e
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
        if (this.definedKeywords = {}, e) for (var i in e.definedKeywords) this.definedKeywords[i] = e.definedKeywords[i].slice(0)
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
        this.definedKeywords[e] = this.definedKeywords[e] || [], this.definedKeywords[e].push(t)
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
        this.formatValidators[e] = t
      }, c.prototype.resolveRefs = function (e, t) {
        if (void 0 !== e.$ref) {
          if ((t = t || {})[e.$ref]) return this.createError(v.CIRCULAR_REFERENCE, {urls: Object.keys(t).join(", ")}, "", "", null, void 0, e);
          t[e.$ref] = !0, e = this.getSchema(e.$ref, t)
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
            r = r[u]
          }
          if (void 0 !== r) return this.resolveRefs(r, t)
        }
        void 0 === this.missing[n] && (this.missing.push(n), this.missing[n] = n, this.missingMap[n] = n)
      }, c.prototype.searchSchemas = function (e, t) {
        if (Array.isArray(e)) for (var r = 0; r < e.length; r++) this.searchSchemas(e[r], t); else if (e && "object" == typeof e) for (var n in "string" == typeof e.id && function (e, t) {
          if (t.substring(0, e.length) === e) {
            var r = t.substring(e.length);
            if (t.length > 0 && "/" === t.charAt(e.length - 1) || "#" === r.charAt(0) || "?" === r.charAt(0)) return !0
          }
          return !1
        }(t, e.id) && void 0 === this.schemas[e.id] && (this.schemas[e.id] = e), e) if ("enum" !== n) if ("object" == typeof e[n]) this.searchSchemas(e[n], t); else if ("$ref" === n) {
          var o = m(e[n]);
          o && void 0 === this.schemas[o] && void 0 === this.missingMap[o] && (this.missingMap[o] = o)
        }
      }, c.prototype.addSchema = function (e, t) {
        if ("string" != typeof e || void 0 === t) {
          if ("object" != typeof e || "string" != typeof e.id) return;
          e = (t = e).id
        }
        e === m(e) + "#" && (e = m(e)), this.schemas[e] = t, delete this.missingMap[e], y(t, e), this.searchSchemas(t, e)
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
        this.schemas = {}, this.reset()
      }, c.prototype.reset = function () {
        this.missing = [], this.missingMap = {}, this.errors = []
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
              }), Object.defineProperty(e, this.validationErrorsKey, {value: [], configurable: !0})
            } catch (t) {
              e[this.validatedSchemasKey] = [], e[this.validationErrorsKey] = []
            }
            c = e[this.validatedSchemasKey].length, e[this.validatedSchemasKey][c] = t, e[this.validationErrorsKey][c] = []
          }
        }
        var f = this.errors.length,
          d = this.validateBasic(e, t, o) || this.validateNumeric(e, t, o) || this.validateString(e, t, o) || this.validateArray(e, t, o) || this.validateObject(e, t, o) || this.validateCombinations(e, t, o) || this.validateHypermedia(e, t, o) || this.validateFormat(e, t, o) || this.validateDefinedKeywords(e, t, o) || null;
        if (i) {
          for (; this.scanned.length;) delete this.scanned.pop()[this.validatedSchemasKey];
          this.scannedFrozen = [], this.scannedFrozenSchemas = []
        }
        if (d || f !== this.errors.length) for (; r && r.length || n && n.length;) {
          var p = r && r.length ? "" + r.pop() : null, m = n && n.length ? "" + n.pop() : null;
          d && (d = d.prefixWith(p, m)), this.prefixErrors(f, p, m)
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
              a = v[a]
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
          "/.." === e ? n.pop() : n.push(e)
        })), n.join("").replace(/^\//, "/" === r.charAt(0) ? "/" : "")) + (t.protocol || t.authority || t.pathname ? t.search : t.search || e.search) + t.hash : null;
        var r, n
      }

      function m(e) {
        return e.split("#")[0]
      }

      function y(e, t) {
        if (e && "object" == typeof e) if (void 0 === t ? t = e.id : "string" == typeof e.id && (t = p(t, e.id), e.id = t), Array.isArray(e)) for (var r = 0; r < e.length; r++) y(e[r], t); else for (var n in "string" == typeof e.$ref && (e.$ref = p(t, e.$ref)), e) "enum" !== n && y(e[n], t)
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
          i ? (n = i[1], o = i[2]) : n = t.pattern, r = new RegExp(n, o)
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
          } else this.trackUnknownProperties && !this.knownPropertyPaths[i] && (this.unknownPropertyPaths[i] = !0)
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
          h && i.push(h.prefixWith(null, "" + u).prefixWith(null, "anyOf"))
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
              for (var d in this.unknownPropertyPaths) o[d] || (n[d] = !0)
            }
          } else h && s.push(h)
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
          this.stack = i.stack || i.stacktrace
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
            o.addFormat.apply(o, arguments)
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
            o.dropSchemas.apply(o, arguments)
          }, defineKeyword: function () {
            o.defineKeyword.apply(o, arguments)
          }, defineError: function (e, t, r) {
            if ("string" != typeof e || !/^[A-Z]+(_[A-Z]+)*$/.test(e)) throw new Error("Code name must be a string in UPPER_CASE_WITH_UNDERSCORES");
            if ("number" != typeof t || t % 1 != 0 || t < 1e4) throw new Error("Code number must be an integer > 10000");
            if (void 0 !== v[e]) throw new Error("Error already defined: " + e + " as " + v[e]);
            if (void 0 !== b[t]) throw new Error("Error code already used: " + b[t] + " as " + t);
            for (var n in v[e] = t, b[t] = e, w[e] = w[t] = r, E) {
              var o = E[n];
              o[e] && (o[t] = o[t] || o[e])
            }
          }, reset: function () {
            o.reset(), this.error = null, this.missing = [], this.valid = !0
          }, missing: [], error: null, valid: !0, normSchema: y, resolveUrl: p, getDocumentUri: m, errorCodes: v
        };
        return i.language(t || "en"), i
      }();
      return S.addLanguage("en-gb", w), S.tv4 = S, S
    }) ? n.apply(t, o) : n) || (e.exports = i)
  }, function (e, t) {
    var r = {
      uris: {}, schemas: {}, aliases: {}, declare: function (e, t, r, n) {
        var o = e + "/" + t;
        if (n.extends) {
          var i, s = n.extends.split("/");
          i = 1 === s.length ? e + "/" + s.shift() : s.join("/");
          var a = this.uris[i];
          if (!a) throw"Type '" + o + "' tries to extend unknown schema '" + i + "'";
          n.extends = this.schemas[a]
        }
        this.uris[o] = r, this.aliases[r] = o, this.schemas[r] = n
      }, resolveAlias: function (e) {
        return this.uris[e]
      }, getSchema: function (e) {
        return this.schemas[e]
      }, inScope: function (e) {
        var t = e.length, r = {};
        for (var n in this.uris) if (n.substr(0, t + 1) === e + "/") {
          var o = this.uris[n];
          r[o] = this.schemas[o]
        }
        return r
      }
    }, n = function (e) {
      var t = new Error("Schema not found: " + e);
      return t.name = "SchemaNotFound", t
    };
    n.prototype = Error.prototype, r.SchemaNotFound = n, e.exports = r
  }, function (e, t) {
    function r(e) {
      this.defaultValue = e, this._canPropagate = !1, this._storage = {}, this._itemsRev = {}, this.activatePropagation()
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
          t ? n[e] = t : delete n[e], this._updateParentFolderItemRev(r, this.defaultValue)
        }
      }, _getParentFolder: function (e) {
        return e.substr(0, e.lastIndexOf("/", e.length - 2) + 1)
      }, _propagate: function (e) {
        if ("/" !== e) {
          var t = this._getParentFolder(e), r = this._itemsRev[t], n = [];
          for (var o in r) n.push(r[o]);
          var i = this._generateHash(n);
          this.set(t, i)
        }
      }, _generateFolderRev: function (e) {
        var t = this._itemsRev[e], r = this.defaultValue;
        if (t) {
          var n = [];
          for (var o in t) {
            var i = void 0;
            i = "/" === o.substr(-1) ? this._generateFolderRev(o) : t[o], n.push(i)
          }
          n.length > 0 && (r = this._generateHash(n))
        }
        return this.set(e, r), r
      }
    }, e.exports = r
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
        }
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
            r(a({message: "request timed out", url: e, status: void 0})), n && n.abort()
          }), o.config.request_timeout)
        }));
        Promise.race([i, s]).then((function (e) {
          r(e)
        })).catch((function (e) {
          t(e)
        }))
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
            4 === i.readyState && s()
          }, i.onload = function () {
            s()
          }, i.ontimeout = function () {
            return t(a({message: "request timed out", url: e, status: i.status}))
          }, i.open("GET", e, !0), i.timeout = n.config.request_timeout, i.setRequestHeader("Accept", "application/jrd+json, application/json"), i.send()
        }

        return u()
      }, u.prototype.__isValidJSON = function (e) {
        try {
          JSON.parse(e)
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
              r[t] = e[t]
            })), c.idx.links[o[e.rel]].push(r)
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
                }))
              }))
            }))
          }))
        }

        function c() {
          var e = a();
          r.__fetchJRD(e, u, (function (n) {
            r.__processJRD(e, n, t, (function (e) {
              t(null, e)
            }))
          }))
        }

        return (r.__isLocalhost(n) && (i = "http"), setTimeout(c, 0))
      }, u.prototype.lookupLink = function (e, t, r) {
        if (!i.hasOwnProperty(t)) return r("unsupported rel " + t);
        this.lookup(e, (function (e, n) {
          var o = n.idx.links[t];
          return e ? r(e) : 0 === o.length ? r('no links found with rel="' + t + '"') : r(null, o[0])
        }))
      }, void 0 === (n = function () {
        return u
      }.apply(t, [])) || (e.exports = n)
    }()
  }, function (e, t) {
    e.exports = XMLHttpRequest
  }, function (e, t, r) {
    "use strict";

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
          e.featureModules[t] && delete e.featureModules[t]
        })), this._allLoaded = !1, this.featureModules) this.loadFeature(t)
      }, hasFeature: function (e) {
        for (var t = this.features.length - 1; t >= 0; t--) if (this.features[t].name === e) return this.features[t].supported;
        return !1
      }, loadFeature: function (e) {
        var t = this, r = this.featureModules[e], o = !r._rs_supported || r._rs_supported();
        i("[RemoteStorage] [FEATURE ".concat(e, "] initializing ...")), "object" === n(o) ? o.then((function () {
          t.featureSupported(e, !0), t.initFeature(e)
        }), (function () {
          t.featureSupported(e, !1)
        })) : "boolean" == typeof o ? (this.featureSupported(e, o), o && this.initFeature(e)) : this.featureSupported(e, !1)
      }, initFeature: function (e) {
        var t, r = this, o = this.featureModules[e];
        try {
          t = o._rs_init(this)
        } catch (t) {
          return void this.featureFailed(e, t)
        }
        "object" === n(t) && "function" == typeof t.then ? t.then((function () {
          r.featureInitialized(e)
        }), (function (t) {
          r.featureFailed(e, t)
        })) : this.featureInitialized(e)
      }, featureFailed: function (e, t) {
        i("[RemoteStorage] [FEATURE ".concat(e, "] initialization failed (").concat(t, ")")), this.featureDone()
      }, featureSupported: function (e, t) {
        i("[RemoteStorage] [FEATURE ".concat(e, "]  ").concat(t ? "" : " not", " supported")), t || this.featureDone()
      }, featureInitialized: function (e) {
        i("[RemoteStorage] [FEATURE ".concat(e, "] initialized.")), this.features.push({
          name: e,
          init: this.featureModules[e]._rs_init,
          supported: !0,
          cleanup: this.featureModules[e]._rs_cleanup
        }), this.featureDone()
      }, featureDone: function () {
        this.featuresDone++, this.featuresDone === Object.keys(this.featureModules).length && setTimeout(this.featuresLoaded.bind(this), 0)
      }, _setCachingModule: function () {
        var e = this;
        ["IndexedDB", "LocalStorage", "InMemoryStorage"].some((function (t) {
          if (e.features.some((function (e) {
            return e.name === t
          }))) return e.features.local = e.featureModules[t], !0
        }))
      }, _fireReady: function () {
        try {
          this.readyFired || (this._emit("ready"), this.readyFired = !0)
        } catch (e) {
          console.error("'ready' failed: ", e, e.stack), this._emit("error", e)
        }
      }, featuresLoaded: function () {
        var e = this;
        i("[REMOTESTORAGE] All features loaded !"), this._setCachingModule(), this.local = a.cache && this.features.local && new this.features.local, this.local && this.remote ? (this._setGPD(s, this), this._bindChange(this.local)) : this.remote && this._setGPD(this.remote, this.remote), this.remote && (this.remote.on("connected", (function () {
          e._fireReady(), e._emit("connected")
        })), this.remote.on("not-connected", (function () {
          e._fireReady(), e._emit("not-connected")
        })), this.remote.connected && (this._fireReady(), this._emit("connected")), this.hasFeature("Authorize") || this.remote.stopWaitingForToken()), this._collectCleanupFunctions();
        try {
          this._allLoaded = !0, this._emit("features-loaded")
        } catch (e) {
          o.logError(e), this._emit("error", e)
        }
        this._processPending()
      }, _collectCleanupFunctions: function () {
        this._cleanups = [];
        for (var e = 0; e < this.features.length; e++) {
          var t = this.features[e].cleanup;
          "function" == typeof t && this._cleanups.push(t)
        }
      }
    };
    e.exports = u
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
        var r
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
    e.exports = s
  }, function (e, t, r) {
    function n(e) {
      return (n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      })(e)
    }

    var o, i = r(1), s = r(8), a = r(2), u = r(0), c = function (e) {
      this.db = e || o, this.db ? (s(this), a(this, "change", "local-events-done"), this.getsRunning = 0, this.putsRunning = 0, this.changesQueued = {}, this.changesRunning = {}) : i("[IndexedDB] Failed to open DB")
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
          console.warn("WARNING: waited more than 10 seconds for previous commit to finish")
        }), 1e4))
      }, flushChangesQueued: function () {
        this.commitSlownessWarning && (clearInterval(this.commitSlownessWarning), this.commitSlownessWarning = null), Object.keys(this.changesQueued).length > 0 && (this.changesRunning = this.changesQueued, this.changesQueued = {}, this.setNodesInDb(this.changesRunning).then(this.flushChangesQueued.bind(this)))
      }, getNodesFromDb: function (e) {
        var t = this;
        return new Promise((function (r, n) {
          var o = t.db.transaction(["nodes"], "readonly"), i = o.objectStore("nodes"), s = {};
          t.getsRunning++, e.map((function (e) {
            i.get(e).onsuccess = function (t) {
              s[e] = t.target.result
            }
          })), o.oncomplete = function () {
            r(s), this.getsRunning--
          }.bind(t), o.onerror = o.onabort = function () {
            n("get transaction error/abort"), this.getsRunning--
          }.bind(t)
        }))
      }, setNodesInDb: function (e) {
        var t = this;
        return new Promise((function (r, o) {
          var s = t.db.transaction(["nodes"], "readwrite"), a = s.objectStore("nodes"), u = (new Date).getTime();
          for (var c in t.putsRunning++, i("[IndexedDB] Starting put", e, t.putsRunning), e) {
            var l = e[c];
            if ("object" === n(l)) try {
              a.put(l)
            } catch (e) {
              throw i("[IndexedDB] Error while putting", l, e), e
            } else try {
              a.delete(c)
            } catch (e) {
              throw i("[IndexedDB] Error while removing", a, l, e), e
            }
          }
          s.oncomplete = function () {
            this.putsRunning--, i("[IndexedDB] Finished put", e, this.putsRunning, (new Date).getTime() - u + "ms"), r()
          }.bind(t), s.onerror = function () {
            this.putsRunning--, o("transaction error")
          }.bind(t), s.onabort = function () {
            o("transaction abort"), this.putsRunning--
          }.bind(t)
        }))
      }, reset: function (e) {
        var t = this, r = this.db.name;
        this.db.close(), c.clean(this.db.name, (function () {
          c.open(r, (function (r, n) {
            r ? i("[IndexedDB] Error while resetting local storage", r) : t.db = n, "function" == typeof e && e(self)
          }))
        }))
      }, forAllNodes: function (e) {
        var t = this;
        return new Promise((function (r) {
          t.db.transaction(["nodes"], "readonly").objectStore("nodes").openCursor().onsuccess = function (n) {
            var o = n.target.result;
            o ? (e(t.migrate(o.value)), o.continue()) : r()
          }
        }))
      }, closeDB: function () {
        0 === this.putsRunning ? this.db.close() : setTimeout(this.closeDB.bind(this), 100)
      }
    }, c.open = function (e, t) {
      var r = setTimeout((function () {
        t("timeout trying to open db")
      }), 1e4);
      try {
        var n = indexedDB.open(e, 2);
        n.onerror = function () {
          i("[IndexedDB] Opening DB failed", n), clearTimeout(r), t(n.error)
        }, n.onupgradeneeded = function (e) {
          var t = n.result;
          i("[IndexedDB] Upgrade: from ", e.oldVersion, " to ", e.newVersion), 1 !== e.oldVersion && (i("[IndexedDB] Creating object store: nodes"), t.createObjectStore("nodes", {keyPath: "path"})), i("[IndexedDB] Creating object store: changes"), t.createObjectStore("changes", {keyPath: "path"})
        }, n.onsuccess = function () {
          clearTimeout(r);
          var o = n.result;
          if (!o.objectStoreNames.contains("nodes") || !o.objectStoreNames.contains("changes")) return i("[IndexedDB] Missing object store. Resetting the database."), void c.clean(e, (function () {
            c.open(e, t)
          }));
          t(null, n.result)
        }
      } catch (n) {
        i("[IndexedDB] Failed to open database: " + n), i("[IndexedDB] Resetting database and trying again."), clearTimeout(r), c.clean(e, (function () {
          c.open(e, t)
        }))
      }
    }, c.clean = function (e, t) {
      var r = indexedDB.deleteDatabase(e);
      r.onsuccess = function () {
        i("[IndexedDB] Done removing DB"), t()
      }, r.onerror = r.onabort = function (t) {
        console.error('Failed to remove database "' + e + '"', t)
      }
    }, c._rs_init = function (e) {
      return new Promise((function (t, r) {
        c.open("remotestorage", (function (n, i) {
          n ? r(n) : (o = i, i.onerror = function () {
            e._emit("error", n)
          }, t())
        }))
      }))
    }, c._rs_supported = function () {
      return new Promise((function (e, t) {
        var r = u.getGlobalContext(), n = !1;
        if ("undefined" != typeof navigator && navigator.userAgent.match(/Android (2|3|4\.[0-3])/) && (navigator.userAgent.match(/Chrome|Firefox/) || (n = !0)), "indexedDB" in r && !n) try {
          var o = indexedDB.open("rs-check");
          o.onerror = function () {
            t()
          }, o.onsuccess = function () {
            o.result.close(), indexedDB.deleteDatabase("rs-check"), e()
          }
        } catch (e) {
          t()
        } else t()
      }))
    }, c._rs_cleanup = function (e) {
      return new Promise((function (t) {
        e.local && e.local.closeDB(), c.clean("remotestorage", t)
      }))
    }, e.exports = c
  }, function (e, t, r) {
    var n = r(8), o = r(1), i = r(2), s = r(0), a = "remotestorage:cache:nodes:", u = function () {
      n(this), o("[LocalStorage] Registering events"), i(this, "change", "local-events-done")
    };

    function c(e) {
      return e.substr(0, a.length) === a || "remotestorage:cache:changes:" === e.substr(0, "remotestorage:cache:changes:".length)
    }

    u.prototype = {
      getNodes: function (e) {
        for (var t = {}, r = 0, n = e.length; r < n; r++) try {
          t[e[r]] = JSON.parse(localStorage[a + e[r]])
        } catch (n) {
          t[e[r]] = void 0
        }
        return Promise.resolve(t)
      }, setNodes: function (e) {
        for (var t in e) localStorage[a + t] = JSON.stringify(e[t]);
        return Promise.resolve()
      }, forAllNodes: function (e) {
        for (var t, r = 0, n = localStorage.length; r < n; r++) if (localStorage.key(r).substr(0, a.length) === a) {
          try {
            t = this.migrate(JSON.parse(localStorage[localStorage.key(r)]))
          } catch (e) {
            t = void 0
          }
          t && e(t)
        }
        return Promise.resolve()
      }
    }, u._rs_init = function () {
    }, u._rs_supported = function () {
      return s.localStorageAvailable()
    }, u._rs_cleanup = function () {
      for (var e = [], t = 0, r = localStorage.length; t < r; t++) {
        var n = localStorage.key(t);
        c(n) && e.push(n)
      }
      e.forEach((function (e) {
        o("[LocalStorage] Removing", e), delete localStorage[e]
      }))
    }, e.exports = u
  }, function (e, t, r) {
    var n = r(2), o = r(1), i = r(8), s = function () {
      i(this), o("[InMemoryStorage] Registering events"), n(this, "change", "local-events-done"), this._storage = {}
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
    }, e.exports = s
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
        })
      }
    }, o.prototype._loadModule = function (e, t) {
      if (t) return t(new n(this, "/" + e + "/"), new n(this, "/public/" + e + "/")).exports;
      throw"Unknown module: " + e
    }
  }])
}));

export let RemoteStorage = exports.RemoteStorage;