(function() {
  class CGlobalVarsWrapper {
    constructor() {
      var fieldMap = [
        "realtime",
        "framecount",
        "absoluteframetime",
        "absoluteframestarttimestddev",
        "curtime",
        "frametime",
        "maxClients",
        "tickcount",
        "interval_per_tick",
        "interpolation_amount",
        "simTicksThisFrame",
        "network_protocol",
        "game_mod"
      ];
      var self = this;
      fieldMap.forEach(function(i) {
        Object.defineProperty(self, i, {
          get: function() {
            return engineAPI.getPropertyOfGlobalVars(i);
          }
        });
      });
    }
  }

  class CLocalizeWrapper {
    find(tokenName) {
      return localizeAPI.find(tokenName);
    }
    constructString(formatString) {
      return localizeAPI.constructString(formatString, arguments.length - 1, arguments[1], arguments[2], arguments[3], arguments[4]);
    }
  }

  class CEngineAPIWrapper {
    getPlayerForUserID(userID) {
      return engineAPI.getPlayerForUserID(userID);
    }
    
    getBuyPresets() {
      return engineAPI.getBuyPresets();
    }

    getCharacters() {
      return engineAPI.getCharacters();
    }

    saveBuyPresets(index, preset) {
      return engineAPI.saveBuyPresets(index, preset);
    }

    getPlayerStat(statId) {
      return engineAPI.getPlayerStat(statId);
    }
    
    clientCommand(str) {
      return engineAPI.clientCommand(str);
    }

    clientCommandUnrestricted(str) {
      return engineAPI.clientCommandUnrestricted(str);
    }

    executeClientCmd(str) {
      return engineAPI.executeClientCmd(str);
    }
  }

  window.globals = new CGlobalVarsWrapper();
  window.localize = new CLocalizeWrapper();
  if (window.engineAPI) {
    window.engine = new CEngineAPIWrapper();
  }
})();
