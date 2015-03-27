
var Screens = {
  currentScreen:   null,
  layoutContainer: null,

  init: function() {
    this.layoutContainer = document.getElementById("screen");
    this.switchScreen(Screens.Start);
  },

  refresh: function() {
    if (this.currentScreen) {
      this.currentScreen.update();
      this.currentScreen.draw();
    }
  },

  switchScreen: function(screen, properties) {
    if (this.currentScreen != null) {
      this.currentScreen.exit();
    }
    this.currentScreen = screen;
    this.currentScreen.enter(properties);
    this.currentScreen.update();
  },

  sendMessage: function(from, msg) {
    if (this.currentScreen && this.currentScreen.sendMessage) {
      this.currentScreen.sendMessage(from, msg);
    }
  }

};

//==================================================================
// Play:
//==================================================================

Screens.Play = {
  cmdHistory: {pos:0, partial:null, cmds:[]},
  ui:         {newLogMessages:[]},
  layout:     '\
    <table id="app">\
      <tr><td id="output">output</td><td id="context"></td></tr>\
      <tr><td colspan="2" id="actions"></td></tr>\
      <tr><td colspan="2"><input id="input" type="text" placeholder="input"/></td></tr>\
      <tr><td colspan="2" id="log"></td></tr>\
    </table>\
    <div id="popup"></div>',

  enter: function(properties) {
    Screens.layoutContainer.innerHTML = this.layout;
    this.ui.output  = document.getElementById('output');
    this.ui.context = document.getElementById('context');
    this.ui.actions = document.getElementById('actions');
    this.ui.input   = document.getElementById('input');
    this.ui.log     = document.getElementById('log');
    this.ui.popup   = document.getElementById('popup');
    this.ui.input.focus();
    for (var i=0; i<App.player.actions.length; i++) {
      this.ui.actions.appendChild(App.player.actions[i].image);
    }
    this.draw();
  },

  exit: function() {
    Screens.layoutContainer.innerHTML = "";
  },

  draw: function() {
    var room = App.player.room;
    var html;

    // ascii art:
    //html = Helpers.randElement(AsciiArt.all);
    html = AsciiArt.hillTrees;

    html += '<br>';
    html += '<span class="roomName">'+room.name+'</span><br>';
    html += '<span class="roomDesc">'+room.desc+'</span><br>';

    // exits:
    var exitNames = room.getExitNames();
    var exitRooms = [];
    if (exitNames.length > 0) {
      html += 'Exits: ';
      for (var i=0; i<exitNames.length; i++) {
        var name = exitNames[i];
        var exit = room.getNextRoom(name);
        exitRooms.push(exit);
        html += '<span class="roomExit" id="'+exit.id+'">'+name+'</span>';
        if (i<exitNames.length-1) html += ', ';
      }
      html += '<br>';
    }

    // mobs:
    var mobs = [];
    for (var i=0; i<room.mobs.length; i++) {
      if (room.mobs[i] != this.player) {
        mobs.push(room.mobs[i]);
      }
    }
    if (mobs.length > 0) {
      html += 'Mobs: ';
      for (var i=0; i<mobs.length; i++) {
        html += '<span class="roomMob" id="'+ mobs[i].id +'">'+ mobs[i].name +'</span>';
        if (i<mobs.length-1)  html += ', ';
      }
      html += '<br>';
    }

    // set ui.output html:
    this.ui.output.innerHTML = html;

    // set ui.context html:
    if (!App.player.target) {
      this.ui.context.innerHTML = "";
    } else {
      this.ui.context.innerHTML = App.player.target.getPopupHTML();
    }

    // setup exit events:
    for (var i=0; i<exitRooms.length; i++) {
      var span = document.getElementById(exitRooms[i].id);
      span.exitName = exitNames[i];
      span.addEventListener("mouseenter", function(e) {
        var room = App.getRoom(e.target.id);
        Helpers.showPopup(room.getPopupHTML());
      });
      span.addEventListener("mouseleave", function(e) {
        Helpers.hidePopup();
      });
      span.addEventListener("click", function(e) {
        App.runCommand(e.target.exitName);
      });
    }

    // setup mob events:
    for (var i=0; i<mobs.length; i++) {
      var span = document.getElementById(mobs[i].id);
      span.addEventListener("mouseenter", function(e) {
        var mob = App.player.room.getMob(e.target.id);
        Helpers.showPopup(mob.getPopupHTML());
      });
      span.addEventListener("mouseleave", function(e) {
        Helpers.hidePopup();
      });
      span.addEventListener("click", function(e) {
        App.player.target = App.player.room.getMob(e.target.id);
        Screens.currentScreen.updateContextWindow();
      });
    }
  },

  update: function() {
    // log:
    for (var i=0; i<this.ui.newLogMessages.length; i++) {
      this.ui.newLogMessages[i].className = "oldLogMessage";
    }
    this.ui.newLogMessages = [];
    // mobs:
    for (var i=0; i<App.mobs.length; i++) {
      var mob = App.mobs[i];
      if (mob.hasMixin('Acting')) {
        mob.act();
      }
    }
    // actions:
    for (var i=0; i<App.player.actions.length; i++) {
      App.player.actions[i].update();
    }
    // player target:
    if (App.player.target && App.player.target.room.id != App.player.room.id) {
      App.player.target = null;
    }
    // screen:
    this.draw();
  },

  sendMessage: function(from, msg) {
    if (from.room == App.player.room) {
      var id = Helpers.getUniqueID();
      this.ui.log.innerHTML += '<span id="'+ id +'" class="newLogMessage">'+ msg + '</span><br>';
      this.ui.newLogMessages.push(document.getElementById(id));
    }
  },

  handleInput: function(code) {
    if (code == Keyboard.KEY_Enter) {
      var command = this.ui.input.value;
      this.ui.input.value = "";
      App.runCommand(command);
      this.cmdHistory.cmds.push(command);
      this.cmdHistory.pos     = this.cmdHistory.cmds.length;
      this.cmdHistory.partial = "";
    } else if (code == Keyboard.KEY_UpArrow) {
      // no history or at oldest? - do nothing:
      if (this.cmdHistory.cmds.length==0 || this.cmdHistory.pos==0) return;
      // at the newest command? - grab a partial:
      if (this.cmdHistory.pos == this.cmdHistory.cmds.length) {
        this.cmdHistory.partial = this.ui.input.value;
      }
      // if there are more then move:
      if (this.cmdHistory.pos > 0) {
        this.cmdHistory.pos--;
        this.ui.input.value = this.cmdHistory.cmds[this.cmdHistory.pos];
      }
    } else if (code == Keyboard.KEY_DownArrow) {
      // no history? - do nothing:
      if (this.cmdHistory.cmds.length==0) return;
      // if there are more then move:
      if (this.cmdHistory.pos < this.cmdHistory.cmds.length) {
        this.cmdHistory.pos++;
        if (this.cmdHistory.pos == this.cmdHistory.cmds.length) {
          this.ui.input.value = this.cmdHistory.partial;
        } else {
          this.ui.input.value = this.cmdHistory.cmds[this.cmdHistory.pos];
        }
      }
    }
  }
};

//==================================================================
// Start:
//==================================================================

Screens.Start = {
  layout: '<div><span id="app">press Enter to start</span></div>',
  enter: function(properties) {
    Screens.layoutContainer.innerHTML = this.layout;
  },
  exit: function() {
  },
  update: function() {
  },
  draw: function() {
  },
  handleInput: function(code) {
    if (code == Keyboard.KEY_Enter) {
      Screens.switchScreen(Screens.Play);
    }
  }
};