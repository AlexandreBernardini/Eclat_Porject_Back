// Import des dépendances
import express, { Request, Response } from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import cors from 'cors';

// Configuration de l'application Express
const app = express();
app.use(cors());
const port = 3001;

// Configuration de la connexion à la base de données MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Eclat'
});

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

// Middleware pour parser les corps des requêtes en JSON
app.use(bodyParser.json());

////////////////////////////
//  GET /All              //
///////////////////////////
app.get('/utilisateurs', (req, res) => {
  // Sélection de toutes les données des utilisateurs dans la base de données
  const sql = 'SELECT * FROM login';
  db.query(sql, (err, results) => {
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
app.post('/inscription', (req, res) => {
  console.log(req.body);
  const { pseudo, prenom, nom, mot_de_passe, email, age, telephone } = req.body;
  console.log('Données d\'inscription reçues :', req.body);

  // Insertion des données d'inscription dans la base de données
  const sql = 'INSERT INTO login (pseudo, prenom , nom, mot_de_passe, email, age, telephone) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [pseudo, prenom, nom, mot_de_passe, email, age, telephone], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'inscription :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de l\'inscription' });
      return;
    }
    console.log('Utilisateur inscrit avec succès');
    res.status(200).json({ message: 'Inscription réussie' });
  });
});

////////////////////////////
//  POST /connexion       //
///////////////////////////
app.post('/connexion', (req, res) => {
  const { pseudo, mot_de_passe } = req.body;

  // Requête pour vérifier si les informations de connexion sont correctes
  const sql = 'SELECT * FROM login WHERE pseudo = ? AND mot_de_passe = SHA2( ?,256)';
  db.query(sql, [pseudo, mot_de_passe], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification des informations de connexion :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la connexion' });
      return;
    }

    if (results.length > 0) {
      // Si les informations sont correctes, retourner un succès
      res.status(200).json({ success: true });
    } else {
      // Si les informations sont incorrectes, retourner un échec
      res.status(200).json({ success: false });
    }
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});