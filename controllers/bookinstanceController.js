var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');

// Display list of all BookInstances
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
    
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance });
    });
    
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {       
    Book.find({},'title')
    .exec(function (err, books) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books, status:[
            'Maintenance',
            'Available',
            'Loaned',
            'Reserved'
        ]});
    });
    
};

// Handle BookInstance create on POST 
exports.bookinstance_create_post = function(req, res, next) {
    req.checkBody('book', 'Book must be specified').notEmpty(); //We won't force Alphanumeric, because book titles might have spaces.
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601();
    
    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    
    //Run the validators because below code will modify the value of due_back which will cause validation error
    var errors = req.validationErrors();
    req.sanitize('due_back').toDate();
    
    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint, 
        status: req.body.status,
        due_back: req.body.due_back
    });

    
    if (errors) {
        
        Book.find({},'title')
        .exec(function (err, books) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors, bookinstance:bookinstance });
        });
        return;
    } 
    else {
    // Data from form is valid
    
        bookinstance.save(function (err) {
            if (err) { return next(err); }
                //successful - redirect to new book-instance record.
                res.redirect(bookinstance.url);
            }); 
    }

};

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res, next) {
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        }
    }, function(err, result) {
        if (err) {return next(err);} 
        res.render('bookinstance_delete', {
            title:'Book instance Delete',
            bookinstance:result.bookinstance
        });
    });
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res) {
    //Author has no books. Delete object and redirect to the list of authors.
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteAuthor(err) {
        if (err) { return next(err); }
        //Success - got to author list
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        book_list: function(callback) {
            Book.find({}).exec(callback);
        },
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback);
        }
    }, function(err, result) {
        if (err) { return next(err); }
        //Successful, so render
        result.bookinstance.imprint = result.bookinstance.imprint;
        res.render('bookinstance_form', {
            title: 'Update BookInstance',
            bookinstance: result.bookinstance,
            book_list:result.book_list,
            status:[
                'Maintenance',
                'Available',
                'Loaned',
                'Reserved'
            ]
        });
    });
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function(req, res) {
    var bookInstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id:req.params.id
    });
    BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, function(err, booki){
        if (err) { return next(err); }
        res.redirect(booki.url);
    });
};