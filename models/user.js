var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*Tipo de datos para un documento en MongoDB
String, Number, Date, Buffer, Boolean, Mixed, Objectid, Array
*/

//Collections --> Tablas
//Documents --> filas

mongoose.connect('mongodb://localhost/myproject');

var posiblesValores = ["M", "F"];
var emailMatch = [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "Coloca un email válido"];

var passwordValidation = {
    validator: function(pass) {
        return this.password_confirmation == pass;
    },
    message: "Las contraseñas no son iguales"
}


//Esto es un modelo Shema de mongoose
var user_schema = new Schema({
    name: String,
    username: { type: String, required: true, maxlength: [50, "El nombre de usuario no debe superar los 50 caracteres"] },
    password: {
        type: String,
        minlength: [8, "El password debe tener como minimo 8 caracteres"],
        validate: passwordValidation
    },
    age: { type: Number, min: [5, "La edad no puede ser menor que 5"], max: [100, "La edad no puede ser mayor a 100"] },
    email: { type: String, required: "El correo es obligatorio", match: emailMatch },
    date_of_birth: Date,
    sex: { type: String, enum: { values: posiblesValores, message: "Opción no válida" } }
});


user_schema.virtual("password_confirmation").get(
    function() {
        return this.p_c;
    }).set(function(password) {
    this.p_c = password;
});

var User = mongoose.model("User", user_schema);

module.exports.User = User; //Exportamos el modelo