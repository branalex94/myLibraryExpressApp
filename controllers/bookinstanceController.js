const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// Display lits of all bookinstances
exports.bookinstace_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific bookinstance
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance === null) {
        let err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_detail", {
        title: "Copy: " + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, "title").exec(function (err, books) {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};

// Handle bookinstance create on POST
exports.bookinstance_create_post = [
  // validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checlFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data
    let bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });
    if (!errors.isEmpty()) {
      // There are errors. Render again with sanitized values and error messages
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid.
      bookinstance.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful, redirect to new record
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display bookinstance delete form on GET
exports.bookinstance_delete_get = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance === null) {
        let err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_delete", {
        title: "Delete BookInstance",
        book: "Copy: " + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// Handle bookinstance delete on POST
exports.bookinstance_delete_post = function (req, res, next) {
  BookInstance.findById(req.params.id).exec(function (err) {
    if (err) {
      return next(err);
    }
    BookInstance.findByIdAndRemove(
      req.body.bookinstanceid,
      function deleteBookInstance(err) {
        if (err) {
          return next(err);
        }
        // Successful, so go to bookinstance list
        res.redirect("/catalog/bookinstances");
      }
    );
  });
};

// Display bookinstance update form on GET
exports.bookinstance_update_get = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      book: function (callback) {
        Book.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance === null) {
        // No results
        const err = new Error("BookInstance not found");
        err.status = 404;
        return next(err);
      }
      // Success
      res.render("bookinstance_form", {
        title: "Update BookInstance",
        bookinstance: results.bookinstance,
        book_list: results.book,
        selected_book: results.bookinstance.book._id,
      });
    }
  );
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = [
  // Validate and sanitize the fields
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checlFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data
    let bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      // There are errors. Render again with sanitized values and error messages
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render
        res.render("bookinstance_form", {
          title: "Update BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid.
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        function (err, thebookinstance) {
          if (err) {
            return next(err);
          }
          // Successful, redirect to bookinstance detail page
          res.redirect(thebookinstance.url);
        }
      );
    }
  },
];
