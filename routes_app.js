var express = require('express');
var Imagen = require("./models/imagenes");
var router = express.Router();
var image_finder_middleware = require("./middleware/find_image");
var fs = require("fs");
var redis = require("redis");


var client = redis.createClient();

/*  app.com/app/  */
router.get("/", function(req, res) {
    Imagen.find({})
        .populate("creator")
        .exec(function(err, imagenes) {
            if (err) console.log(err);
            res.render("app/home", { imagenes: imagenes });
        })
});


/* REST */

router.get("/imagenes/new", function(req, res) {
    res.render("app/imagenes/new");
});

router.all("/imagenes/:id*", image_finder_middleware);

router.get("/imagenes/:id/edit", function(req, res) {
    res.render("app/imagenes/edit");
});

router.route("/imagenes/:id")
    .get(function(req, res) {
        res.render("app/imagenes/show");
    })
    .put(function(req, res) {
        res.locals.imagen.title = req.body.title;
        res.locals.imagen.save(function(err) {
            if (!err) {
                res.render("app/imagenes/show");
            } else {
                res.render("app/imagenes/" + req.params.id + "/edit");
            }
        })
    })
    .delete(function(req, res) {
        //Eliminar las imagenes
        Imagen.findOneAndRemove({ _id: req.params.id }, function(err) {
            if (!err) {
                res.redirect("/app/imagenes");
            } else {
                res.redirect("/app/imagenes" + req.params.id);
            }
        })
    });


router.route("/imagenes")
    .get(function(req, res) {
        Imagen.find({ creator: res.locals.user._id }, function(err, imagenes) {
            if (err) { res.redirect("/app"); return; }
            res.render("app/imagenes/index", { imagenes: imagenes });

        });
    })
    .post(function(req, res) {
        var extension = req.files.archivo.name.split(".").pop();
        var ext = extension.toString();
        console.log("Esta es la extencion: " + ext);
        var data = {
            title: req.body.title,
            creator: res.locals.user._id,
            extension: ext
        }
        var imagen = new Imagen(data);

        fs.rename(req.files.archivo.path, 'public/imagenes/' + imagen._id + "." + ext, function(err) {
            if (err) throw err;
            imagen.save(function(err) {
                if (!err) {

                    var imgJSON = {
                        "id": imagen._id,
                        "title": imagen.title,
                        "extension": imagen.extension
                    };

                    client.publish("images", JSON.stringify(imgJSON));
                    res.redirect('/app/imagenes/' + imagen._id);
                } else {
                    console.log(imagen);
                    res.render(err);
                }
            });
        });
    });

module.exports = router;