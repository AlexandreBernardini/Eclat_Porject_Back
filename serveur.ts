// Import des dépendances
import express, { Request, Response } from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Vérifier que le dossier 'uploads' existe, sinon le créer
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configuration de multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
      console.log('Connexion réussie');
      res.status(200).json({ success: true, pseudo });
    } else {
      // Si les informations sont incorrectes, retourner un échec
      console.log('Connexion échouée');
      res.status(200).json({ success: false });
    }
  });
});

////////////////////////////
//  GET /blogposts        //
///////////////////////////
// Route pour récupérer toutes les publications de blog
app.get('/blogposts', (req, res) => {
  const sql = 'SELECT * FROM BlogPosts ORDER BY date DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des publications de blog :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des publications de blog' });
      return;
    }
    res.status(200).json(results);
  });
});

////////////////////////////
//  POST /blogpost        //
///////////////////////////
// Route pour créer une nouvelle publication de blog
app.post('/blogpost', upload.single('image'), (req, res) => {
  console.log('Requête reçue:', req.body);
  if (req.file) {
    console.log('Fichier reçu:', req.file);
  } else {
    console.log('Aucun fichier reçu');
  }

  const { content, author } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!content) {
    res.status(400).json({ error: 'Le contenu est obligatoire' });
    return;
  }

  const sql = 'INSERT INTO BlogPosts (content, author, imageUrl) VALUES (?, ?, ?)';
  db.query(sql, [content, author, imageUrl], (err, result) => {
    if (err) {
      console.error('Erreur lors de la création de la publication de blog :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la création de la publication de blog' });
      return;
    }
    res.status(200).json({ message: 'Publication de blog créée avec succès', id: result.insertId });
  });
});

////////////////////////////
//  GET /profil           //
///////////////////////////
// Route pour récupérer les informations du profil utilisateur
app.get('/profil', (req, res) => {
  const { pseudo } = req.query;

  // Requête pour récupérer les informations de l'utilisateur
  const sql = 'SELECT pseudo, prenom, nom, email, age, telephone FROM login WHERE pseudo = ?';
  db.query(sql, [pseudo], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des informations de profil :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des informations de profil' });
      return;
    }

    if (results.length > 0) {
      console.log('Informations de profil récupérées avec succès');
      res.status(200).json(results[0]);
    } else {
      console.log('Utilisateur non trouvé');
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  });
});

////////////////////////////
//  PUT /profil           //
///////////////////////////
// Route pour mettre à jour les informations du profil utilisateur
app.put('/profil', (req, res) => {
  const { pseudo, prenom, nom, email, age, telephone } = req.body;

  // Requête pour mettre à jour les informations de l'utilisateur
  const sql = 'UPDATE login SET prenom = ?, nom = ?, email = ?, age = ?, telephone = ? WHERE pseudo = ?';
  db.query(sql, [prenom, nom, email, age, telephone, pseudo], (err, results) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des informations de profil :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour des informations de profil' });
      return;
    }

    if (results.affectedRows > 0) {
      console.log('Informations de profil mises à jour avec succès');
      res.status(200).json({ message: 'Informations de profil mises à jour avec succès' });
    } else {
      console.log('Utilisateur non trouvé');
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  });
});

// Route pour récupérer tous les cours
app.get('/agenda', (req, res) => {
  const sql = 'SELECT * FROM agenda';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des cours :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des cours' });
      return;
    }
    res.status(200).json(results);
  });
});

app.post('/agenda', (req, res) => {
  const { date, time, duration, title, description, creator } = req.body;
  const sql = 'INSERT INTO agenda (date, time, duration, title, description, creator) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [date, time, duration, title, description, creator], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'ajout du cours :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout du cours' });
      return;
    }
    console.log('Cours ajouté avec succès');
    res.status(200).json({ message: 'Cours ajouté avec succès' });
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
