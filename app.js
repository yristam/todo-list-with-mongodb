//jshint esversion:6

const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const lodash = require('lodash');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});
//make mongoose.model("Singular word collection", schema)
//singular word converted to plural word
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  const day = date.getDate();
  Item.find(function (err, result) {
    if (!err) {
      //digunakan untuk menginputkan default item apabila tidak ada item dalam database
      if (result.length === 0) {
        //Item.insertMany merupakan asynchronous task
        Item.insertMany(defaultItems, function (err) {
          if (!err) {
            console.log("Successfully add a default item to the database");
            res.redirect("/");
          }
        });
      } else {
        res.render("list", {
          listTitle: day,
          newListItems: result
        });
      }
    }
  });

});

//custom list, adding a new items
app.post("/", function (req, res) {
  const day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === day) {
    item.save(function (err) {
      //meletakkan redirect didalam save agar prosesnya dilaksanakan setelah selesai mengsave data
      if (!err) {
        res.redirect("/");
      }
    });

  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save(function (err) {
          if (!err) {
            res.redirect("/" + listName);
          }
        });
      }
    });
  }

});

app.post("/delete", function (req, res) {
  const day = date.getDate();
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === day) {
    //useFindAndModify digunakan agar menghilangkan deprecated warning pada findbyidandremove
    Item.findByIdAndRemove(checkedItemId, {
      useFindAndModify: false
    }, function (err) {
      if (!err) {
        console.log("Successfully delete the checked item");
        res.redirect("/")
      }
    });
  } else {
    //berikut merupakan cara mendelete item pada collections yang itemnya berada pada array
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, {
      useFindAndModify: false
    }, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    })
  }


});

/*
By default, browsers will try on their own to find the favicon.ico in the root directory by making a GET 
request to /favicon.ico. When you navigate to localhost:3000/work the browser makes another request to 
localhost:3000/favicon.ico to try to find the favicon for the page. 
This matches our app.get("/:param", callback()) and both "work" and "favicon.ico" get printed to the console.
*/
app.get("/:customListName", function (req, res) {
  const customListName = lodash.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function (err, listItem) {
    if (listItem === null) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      //save() method in mongoose is an asynchronous function which returns a promise, 
      //since you are redirecting it outside save() so its creating problem,
      //instead redirect it inside the callback function like this:
      list.save(function (err) {
        if (!err) {
          res.redirect("/" + customListName);
        }
      });


    } else {
      res.render("list", {
        listTitle: listItem.name,
        newListItems: listItem.items
      });
    }
  });


})

app.get("/work", function (req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});