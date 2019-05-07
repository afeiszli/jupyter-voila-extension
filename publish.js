define([
  'base/js/namespace',
  'base/js/utils',
  'base/js/dialog'
], function(Jupyter, utils, dialog) {
  var exports = {};

  // Show counts of cell types
  var show_stats = function() {

      // Get counts of each cell type
      var cells = Jupyter.notebook.get_cells();
      var hist = {};
      for(var i=0; i < cells.length; i++) {
          var ct = cells[i].cell_type;
          if(hist[ct] === undefined) {
              hist[ct] = 1;
          } else {
              hist[ct] += 1;
          }
      }

      // Build paragraphs of cell type and count
      var body = $('<div>');
      for(var ct in hist) {
          $('<p>').text(ct+': '+hist[ct]).appendTo(body);
      }

      // Show a modal dialog with the stats
      dialog.modal({
          title: "Notebook Stats",
          body: body,
          buttons : {
              "OK": {}
          }
      });
  };

  var publish_notebook = function() {
    var body = $("<div>");
    var name_elem = $("<input>").attr("id", "publish-notebook-name").attr("value", Jupyter.notebook.notebook_name)
    var status = $("<span>").attr("id", "publish-status").css("margin-left", "10px")
    $("<p>").css("margin", "10px 0 0 0").text("Name of the shared notebook: ").append(name_elem).append(status).appendTo(body)
    var overwrite_elem = $("<input>").attr("type", "checkbox").attr("id", "publish-overwrite")
    $("<p>").css("margin", "10px 0 0 0").text("Overwrite existing published notebook: ").append(overwrite_elem).appendTo(body)
    $("<p>").css("margin", "10px 0 0 0").append($("<input>").attr("id", "publish-share-url"))
          .append($("<button>").attr("id", "publish-button").text("Copy").click(copy_url))
          .appendTo(body)
    var button_wrapper = $("<p>").css("margin", "10px 0 0 0").appendTo(body)
    $("<button>").attr("id", "publish-button").text("Publish").click(copy_notebook).appendTo(button_wrapper)

    dialog.modal({
      title: "Publish notebook "+Jupyter.notebook.notebook_name,
      body: body,
      buttons : {
          "OK": {}
      }
  });
  };

  var copy_url = function() {
      $("#publish-share-url").select()
      document.execCommand("copy");
  }

  var copy_notebook = function() {
    console.log("Copy noteboook")
    var public_notebooks = Jupyter.contents.get("/public_notebooks", {"type": "directory"})
    public_notebooks.then(function(json){
      move_notebook(public_notebooks)
    }, function(){
      Jupyter.contents.new_untitled("/", { "type": "directory"}).then(function(json){
        public_notebooks = Jupyter.contents.rename("/Untitled Folder", "/public_notebooks")
        move_notebook(public_notebooks)
      })
    })
  }

  var move_notebook = function(target) {
    target.then(function(json) {
      var name = $("#publish-notebook-name").val()
      var new_path = "public_notebooks/"+name
      var overwrite = $("#publish-overwrite").is(':checked')
      Jupyter.contents.list_contents("/public_notebooks").then(function(directory_listing) {
        var exists = false
        for (var i = 0; i < directory_listing.content.length; i++) {
          var file = directory_listing.content[i]
          if (file.path == new_path) {
            exists = true
            break
          }
          //if (directory_listing[i].)
        }
        if (!exists || overwrite) { //Overwrite if requested
        //Check if exists
          Jupyter.contents.copy(Jupyter.notebook.notebook_path, "public_notebooks").then(function(json) {
              var copy_path = json["path"]
              console.log(new_path)
              if (exists) {
                Jupyter.contents.delete(new_path).then(
                  rename_notebook(copy_path, new_path)
                )
              } else {
                rename_notebook(copy_path, new_path)
              }
          })
        } else { //Fail if exists and not overwrite
          $("#publish-status").text("File already exists!")
        }
      })
    })
  }

  var rename_notebook = function(copy_path, new_path) {
    Jupyter.contents.rename(copy_path, new_path).then(function(json) {
      $("#publish-status").text("Notebook published!")
      var uri = window.location.toString()
      $("#publish-share-url").val(uri.replace(/notebooks.*/,"public/localfile/"+json.name))
    })
  }

  var publish_button = function () {
    if (!IPython.toolbar) {
        $([IPython.events]).on("app_initialized.NotebookApp", publish_button);
        return;
    }
    if ($("#publish_notebook").length === 0) {
        IPython.toolbar.add_buttons_group([
            {
                'label'   : 'publish',
                'help'    : 'Publish notebook in your JupyterHub',
                'icon'    : 'fa-share',
                'callback': publish_notebook,
                'id'      : 'publish_notebook'
            },
        ]);
    }
    //update_gist_link();
  };

  // Wait for notification that the app is ready
  exports.load_ipython_extension = function() {
      publish_button();
      // Then register command mode hotkey "s" to show the dialog
      //Jupyter.keyboard_manager.command_shortcuts.add_shortcut('s', show_stats);
  };

  return exports;
});