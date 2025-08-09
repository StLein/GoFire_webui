(function() {
  let inited = false;
  client.addEventHandler("VidInit", function() {
    getHudList().forEach(function(i) {
      i.init();
    });
  });

  setInterval(function() {
    getHudList().forEach(function(i) {
      i.onThink();
    });
  }, 16);
})();
