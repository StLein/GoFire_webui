(function() {
  var eventHandlers = [];

  function isGameAttached() {
    return typeof clientAPI != "undefined";
  }

  class CBfRead {
    constructor(bufObjId) {
      this.bufObjId = bufObjId;
    }

    readLong() {
      return clientAPI.readLong(this.bufObjId);
    }
    readChar() {
      return clientAPI.readChar(this.bufObjId);
    }
    readByte() {
      return clientAPI.readByte(this.bufObjId);
    }
    readShort() {
      return clientAPI.readShort(this.bufObjId);
    }
    readWord() {
      return clientAPI.readWord(this.bufObjId);
    }
    readFloat() {
      return clientAPI.readFloat(this.bufObjId);
    }
    readString() {
      return clientAPI.readString(this.bufObjId);
    }
  };

  class CGameEvent {
    constructor(bufObjId) {
      this.bufObjId = bufObjId;
    }

    getBool(keyName) {
      return clientAPI.getGameEventBool(this.bufObjId, keyName);
    }
    getInt(keyName) {
      return clientAPI.getGameEventInt(this.bufObjId, keyName);
    }
    getFloat(keyName) {
      return clientAPI.getGameEventFloat(this.bufObjId, keyName);
    }
    getString(keyName) {
      return clientAPI.getGameEventString(this.bufObjId, keyName);
    }
  }

  class CClientAPIWrapper {
    getActiveWeapon() {
      return clientAPI.getActiveWeapon();
    }

    getLocalPlayer() {
      return clientAPI.getLocalPlayer();
    }

    getWpnData(ent) {
      return clientAPI.getWpnData(ent);
    }

    addEventHandler(type, callback) {
      eventHandlers.push({ type, callback });
    }

    hookUserMessage(name, callback) {
      clientAPI.hookUserMessage(name);
      this.addEventHandler("UserMessage", function(event) {
        if (event.name == name) {
          callback(new CBfRead(event.bufObjId));
        }
      });
    }

    listenForGameEvent(name, callback) {
      var listenID = clientAPI.listenForGameEvent(name);
      this.addEventHandler("GameEvent", function(event) {
        if (event.name == name) {
          callback(new CGameEvent(event.bufObjId));
        }
      });
    }

    getPlayerTeam(index) {
      return clientAPI.getPlayerTeam(index);
    }

    getPlayerName(index) {
      return clientAPI.getPlayerName(index);
    }

    lookupTextMessageString(msg) {
      return clientAPI.lookupTextMessageString(msg);
    }
  }

  setInterval(function() {
    if (!isGameAttached()) {
      return;
    }

    var event = clientAPI.pollEvent();
    while (event) {
      eventHandlers.forEach(function(i) {
        if (i.type == event.type) {
          i.callback(event);
        }
      });
      event = clientAPI.pollEvent();
    }
  }, 1);

  window.client = new CClientAPIWrapper();
})();
