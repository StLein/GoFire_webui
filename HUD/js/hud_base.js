(function() {
  var hudList = [];

  window.getHudList = function() {
    return hudList;
  };

  window.CHudBase = class {
    constructor(containerName) {
      if (containerName) {
        this.elContainer = document.querySelector(containerName);
      }
    }

    setVisible(state) {
      if (state) {
        this.elContainer.style.display = '';
      } else {
        this.elContainer.style.display = 'none';
      }
    }

    init() {

    }

    onThink() {

    }
  };
})();
