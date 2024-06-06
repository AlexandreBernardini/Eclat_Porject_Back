import express, { Request, Response, NextFunction } from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Configuration de l'application Express
const app = express();
app.use(cors());
const port = 3001;

// Clé secrète pour JWT
const JWT_SECRET = 'your_jwt_secret_key';

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

app.use('/uploads', express.static('uploads'));

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

// Interface étendue pour inclure userId
interface CustomRequest extends Request {
  userId?: string;
}

// Middleware pour vérifier le token JWT
const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Aucun token fourni' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Échec de l\'authentification du token' });
    }
    req.userId = (decoded as { pseudo: string }).pseudo;
    next();
  });
};


////////////////////////////
//  POST /inscription    //
///////////////////////////
app.post('/inscription', async (req: Request, res: Response) => {
  try {
    const { pseudo, prenom, nom, mot_de_passe, email, age, telephone } = req.body;
    console.log('Requête d\'inscription reçue :', req.body);
    
    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    console.log('Mot de passe haché :', hashedPassword);

    const sql = 'INSERT INTO login (pseudo, prenom, nom, mot_de_passe, email, age, telephone) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [pseudo, prenom, nom, hashedPassword, email, age, telephone], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'inscription :', err);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'inscription' });
        return;
      }
      console.log('Utilisateur inscrit avec succès');
      res.status(200).json({ message: 'Inscription réussie' });
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

////////////////////////////
//  POST /connexion       //
///////////////////////////
app.post('/connexion', (req: Request, res: Response) => {
  const { pseudo, mot_de_passe } = req.body;

  const sql = 'SELECT * FROM login WHERE pseudo = ?';
  db.query(sql, [pseudo], async (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification des informations de connexion :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la connexion' });
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

      if (validPassword) {
        const token = jwt.sign({ pseudo: user.pseudo }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Connexion réussie');
        res.status(200).json({ success: true, token });
      } else {
        console.log('Mot de passe incorrect');
        res.status(200).json({ success: false, message: 'Mot de passe incorrect' });
      }
    } else {
      console.log('Utilisateur non trouvé');
      res.status(200).json({ success: false, message: 'Utilisateur non trouvé' });
    }
  });
});


////////////////////////////
//  GET /profil           //
///////////////////////////
app.get('/profil', verifyToken, (req: CustomRequest, res: Response) => {
  const pseudo = req.userId; // Utilisation du pseudo depuis le token JWT
  console.log('Requête de profil pour :', pseudo);

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
app.put('/profil', verifyToken, (req: CustomRequest, res: Response) => {
  const pseudo = req.userId; // Utilisation du pseudo depuis le token JWT
  const { prenom, nom, email, age, telephone } = req.body;

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


////////////////////////////
//  GET /agenda           //
///////////////////////////
app.get('/agenda', verifyToken, (req: CustomRequest, res: Response) => {
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

////////////////////////////
//  POST /agenda          //
///////////////////////////
app.post('/agenda', verifyToken, (req: CustomRequest, res: Response) => {
  const { date, time, duration, title, description, creator } = req.body;
  const sql = 'INSERT INTO agenda (date, time, duration, title, description, creator) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [date, time, duration, title, description, creator], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'ajout du cours :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout du cours' });
      return;
    }
    console.log('Cours ajouté avec succès');
    res.status(200).json({ message: 'Cours ajouté avec succès', insertId: result.insertId });
  });
});

////////////////////////////
//  GET /blogposts        //
///////////////////////////
app.get('/blogposts', verifyToken, (req: CustomRequest, res: Response) => {
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
app.post('/blogpost', verifyToken, upload.single('image'), (req: CustomRequest, res: Response) => {
  console.log('Requête reçue:', req.body);
  if (req.file) {
    console.log('Fichier reçu:', req.file);
  } else {
    console.log('Aucun fichier reçu');
  }

  const { content } = req.body;
  const author = req.userId;
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
    res.status(200).json({ message: 'Publication de blog créée avec succès', id: result.insertId, imageUrl });
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
