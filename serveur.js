"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import des dépendances
var express_1 = require("express");
var mysql_1 = require("mysql");
var body_parser_1 = require("body-parser");
// Configuration de l'application Express
var app = (0, express_1.default)();
var port = 3000;
// Configuration de la connexion à la base de données MySQL
var db = mysql_1.default.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'YacAventure'
});
// Connexion à la base de données
db.connect(function (err) {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        return;
    }
    console.log('Connecté à la base de données MySQL');
});
// Middleware pour parser les corps des requêtes en JSON
app.use(body_parser_1.default.json());
////////////////////////////
//  GET /All              //
///////////////////////////
app.get('/utilisateurs', function (req, res) {
    // Sélection de toutes les données des utilisateurs dans la base de données
    var sql = 'SELECT * FROM utilisateurs';
    db.query(sql, function (err, results) {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs :', err);
            res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des utilisateurs' });
            return;
        }
        console.log('Utilisateurs récupérés avec succès');
        res.status(200).json(results);
    });
});
////////////////////////////
//  POST /inscription    //
///////////////////////////
// Route pour recevoir les données d'inscription
app.post('/inscription', function (req, res) {
    console.log(req.body);
    var _a = req.body, prenom = _a.prenom, nom = _a.nom, age = _a.age, mot_de_passe = _a.mot_de_passe;
    console.log('Données d\'inscription reçues :', req.body);
    // Insertion des données d'inscription dans la base de données
    var sql = 'INSERT INTO utilisateurs (prenom, nom, age, mot_de_passe) VALUES (?, ?, ?, ?)';
    db.query(sql, [prenom, nom, age, mot_de_passe], function (err, result) {
        if (err) {
            console.error('Erreur lors de l\'inscription :', err);
            res.status(500).json({ error: 'Une erreur est survenue lors de l\'inscription' });
            return;
        }
        console.log('Utilisateur inscrit avec succès');
        res.status(200).json({ message: 'Inscription réussie' });
    });
});
// Démarrage du serveur
app.listen(port, function () {
    console.log("Serveur backend d\u00E9marr\u00E9 sur le port ".concat(port));
});
