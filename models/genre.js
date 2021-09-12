const mongoose = require("mongoose");

const Genre = new mongoose.Schema({
  name: {
    type: String,
    remove: true,
    minLength: "3",
    maxLength: "100",
  },
  category: {
    type: String,
  },
});

Genre.virtual("url").get(function () {
  return "/catalog/genre/" + this._id;
});

module.exports = mongoose.model("Genre", Genre);
