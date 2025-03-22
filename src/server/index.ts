import express, { Request } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/database';
import dotenv from 'dotenv';
import { signupSchema, signinSchema } from '../utils/validation';
import { generateToken, verifyToken } from '../utils/jwt';
import { ZodError } from 'zod';
import { config } from './config';
import examRoutes from './routes/examRoutes';
import authRoutes from './routes/authRoutes';
import correctionRoutes from './routes/correctionRoutes';
import { SUBMISSIONS_DIR, EXAMS_DIR, UPLOAD_DIR, ensureDirectoryExists } from './utils/fileHandler';

dotenv.config();

// Création des dossiers nécessaires
ensureDirectoryExists(UPLOAD_DIR);
ensureDirectoryExists(EXAMS_DIR);
ensureDirectoryExists(SUBMISSIONS_DIR);

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = req.url.includes('/submissions') ? SUBMISSIONS_DIR : EXAMS_DIR;
    // Créer le dossier s'il n'existe pas
    ensureDirectoryExists(uploadDir);
    console.log('Dossier de destination:', uploadDir);
    console.log('Le dossier existe:', fs.existsSync(uploadDir));
    console.log('Contenu du dossier:', fs.readdirSync(uploadDir));
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    console.log('Nom du fichier généré:', uniqueSuffix);
    cb(null, uniqueSuffix);
  }
});

// Configuration de multer pour les examens (PDF uniquement)
const examUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    console.log('Type MIME du fichier:', file.mimetype);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
  }
});

// Configuration de multer pour les soumissions (PDF et images)
const submissionUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et images sont acceptés'));
    }
  }
});

// Middleware pour gérer les erreurs de multer
const handleMulterError = (err: any, req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Extension de l'interface Request d'Express
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
    role: string;
  };
  file?: Express.Multer.File;
}

const app = express();

console.log('Configuration du serveur:', {
  port: config.port,
  dbHost: process.env.DB_HOST,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPort: process.env.DB_PORT
});

// Configuration CORS
app.use(cors({
  origin: '*', // Accepter toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), config.uploadDir)));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/correction', correctionRoutes);

// Middleware d'authentification
const authenticateToken = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = verifyToken(token);
    const result = await pool.query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// Routes d'authentification
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    
    const validatedData = signupSchema.parse(req.body);
    console.log('Données validées:', validatedData);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (existingUser.rows.length > 0) {
      console.log('Email déjà utilisé:', validatedData.email);
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Insérer le nouvel utilisateur
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at, updated_at',
      [validatedData.email, passwordHash, validatedData.name, validatedData.role]
    );

    const user = result.rows[0];
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    console.log('Inscription réussie:', { id: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Erreur de validation:', error.errors);
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'inscription',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const validatedData = signinSchema.parse(req.body);
    
    // Rechercher l'utilisateur
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors.map(e => e.message)
      });
    }
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json(req.user);
});

// Routes des examens
app.get('/api/exams', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    let query = `
      SELECT e.*, u.name as teacher_name
      FROM exams e
      JOIN users u ON e.user_id = u.id
    `;
    const params: any[] = [];
    let paramCount = 1;

    // Si c'est un étudiant, on récupère uniquement les examens disponibles
    if (req.user?.role === 'student') {
      query = `
        SELECT DISTINCT 
          e.*, 
          u.name as teacher_name,
          s.id as submission_id,
          s.status as submission_status,
          s.grade as submission_grade,
          CASE 
            WHEN s.id IS NOT NULL THEN true 
            ELSE false 
          END as is_submitted
        FROM exams e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN submissions s ON e.id = s.exam_id AND s.user_id = $${paramCount}
        WHERE (s.id IS NULL AND (e.deadline IS NULL OR e.deadline > CURRENT_TIMESTAMP))
           OR s.id IS NOT NULL
      `;
      params.push(req.user.id);
      paramCount++;
    }
    // Si c'est un professeur, on ne récupère que ses examens
    else if (req.user?.role === 'teacher') {
      query += ` WHERE e.user_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ' ORDER BY e.created_at DESC';

    console.log('Requête SQL examens:', query, params);
    const result = await pool.query(query, params);
    console.log('Examens récupérés:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des examens:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des examens',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

app.post('/api/exams', authenticateToken, examUpload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, deadline } = req.body;
    const filePath = req.file ? req.file.filename : null;

    console.log('Création d\'examen:', {
      title,
      description,
      deadline,
      filePath,
      userId: req.user?.id,
      file: req.file
    });

    if (!req.file) {
      return res.status(400).json({ error: 'Fichier requis' });
    }

    const result = await pool.query(
      'INSERT INTO exams (title, description, user_id, deadline, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, req.user?.id, deadline, filePath]
    );

    // Ajout du nom du professeur dans la réponse
    const examWithTeacher = {
      ...result.rows[0],
      teacher_name: req.user?.name
    };

    console.log('Examen créé avec succès:', examWithTeacher);
    res.json(examWithTeacher);
  } catch (error) {
    console.error('Erreur lors de la création de l\'examen:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'examen', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
});

// Route pour télécharger un fichier d'examen
app.get('/api/exams/download/:filePath', async (req: AuthenticatedRequest, res) => {
  try {
    const { filePath } = req.params;
    const fullPath = path.join(EXAMS_DIR, filePath);

    console.log('Tentative de téléchargement:', {
      requestedPath: filePath,
      fullPath,
      exists: fs.existsSync(fullPath),
      uploadDirExists: fs.existsSync(EXAMS_DIR),
      uploadDirContents: fs.readdirSync(EXAMS_DIR)
    });

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    res.download(fullPath);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
  }
});

// Routes des soumissions
app.get('/api/submissions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { exam_id, studentId, teacherId } = req.query;
    
    let query = `
      SELECT 
        s.*,
        e.title as exam_title,
        e.description as exam_description,
        u.name as student_name,
        e.user_id as teacher_id
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    // Si c'est un professeur, on ne montre que les soumissions de ses examens
    if (req.user?.role === 'teacher') {
      query += ` AND e.user_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }
    // Si c'est un étudiant, on ne montre que ses soumissions
    else if (req.user?.role === 'student') {
      query += ` AND s.user_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    if (exam_id) {
      query += ` AND s.exam_id = $${paramCount}`;
      params.push(exam_id);
      paramCount++;
    }

    if (studentId) {
      query += ` AND s.user_id = $${paramCount}`;
      params.push(studentId);
      paramCount++;
    }

    if (teacherId) {
      query += ` AND e.user_id = $${paramCount}`;
      params.push(teacherId);
      paramCount++;
    }

    query += ' ORDER BY s.submitted_at DESC';

    console.log('Requête SQL soumissions:', query, params);
    const result = await pool.query(query, params);
    console.log('Soumissions récupérées:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des soumissions',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

app.post('/api/submissions', authenticateToken, submissionUpload.single('file'), handleMulterError, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('Début du processus de soumission');
    console.log('Données de soumission reçues:', {
      body: req.body,
      file: req.file,
      userId: req.user?.id,
      headers: req.headers
    });

    const { exam_id } = req.body;
    const filePath = req.file ? `submissions/${req.file.filename}` : null;

    console.log('Vérification des données requises:', {
      exam_id,
      filePath,
      userId: req.user?.id
    });

    if (!exam_id) {
      console.log('Erreur: ID de l\'examen manquant');
      return res.status(400).json({ error: 'ID de l\'examen manquant' });
    }

    if (!filePath) {
      console.log('Erreur: Aucun fichier fourni');
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Vérifier si l'examen existe et n'est pas expiré
    console.log('Vérification de l\'existence de l\'examen:', exam_id);
    const examResult = await pool.query(
      'SELECT * FROM exams WHERE id = $1',
      [exam_id]
    );
    console.log('Résultat de la recherche d\'examen:', examResult.rows);

    if (examResult.rows.length === 0) {
      console.log('Erreur: Examen non trouvé');
      return res.status(404).json({ error: 'Examen non trouvé' });
    }

    const exam = examResult.rows[0];
    if (exam.deadline && new Date(exam.deadline) < new Date()) {
      console.log('Erreur: Date limite dépassée');
      return res.status(400).json({ error: 'La date limite de soumission est dépassée' });
    }

    // Vérifier si l'étudiant a déjà soumis
    console.log('Vérification des soumissions existantes');
    const existingSubmission = await pool.query(
      'SELECT * FROM submissions WHERE exam_id = $1 AND user_id = $2',
      [exam_id, req.user?.id]
    );
    console.log('Soumissions existantes:', existingSubmission.rows);

    let result;
    if (existingSubmission.rows.length > 0) {
      console.log('Mise à jour d\'une soumission existante');
      // Supprimer l'ancien fichier
      const oldFilePath = path.join(process.cwd(), 'uploads', existingSubmission.rows[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log('Ancien fichier supprimé:', oldFilePath);
      }

      // Mettre à jour la soumission
      result = await pool.query(
        'UPDATE submissions SET file_path = $1, updated_at = NOW() WHERE exam_id = $2 AND user_id = $3 RETURNING *',
        [filePath, exam_id, req.user?.id]
      );
      console.log('Soumission mise à jour:', result.rows[0]);
    } else {
      console.log('Création d\'une nouvelle soumission');
      // Créer une nouvelle soumission
      result = await pool.query(
        'INSERT INTO submissions (exam_id, user_id, file_path, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [exam_id, req.user?.id, filePath, 'pending']
      );
      console.log('Nouvelle soumission créée:', result.rows[0]);
    }

    console.log('Soumission réussie, envoi de la réponse');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur détaillée lors de la soumission:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la soumission',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour télécharger une soumission
app.get('/api/submissions/download/:filePath', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { filePath } = req.params;
    const fullPath = path.join(process.cwd(), 'uploads', filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Vérifier si l'utilisateur a accès au fichier
    const submissionResult = await pool.query(
      'SELECT s.*, e.user_id as teacher_id FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE s.file_path = $1',
      [filePath]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }

    const submission = submissionResult.rows[0];
    if (req.user?.role === 'teacher' && submission.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.user?.role === 'student' && submission.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.download(fullPath);
  } catch (error) {
    console.error('Erreur lors du téléchargement de la soumission:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement de la soumission' });
  }
});

// Route pour noter une soumission
app.put('/api/submissions/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    // Vérifier que l'utilisateur est un professeur
    if (req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Seuls les professeurs peuvent noter les soumissions' });
    }

    // Vérifier que la note est valide
    if (grade === undefined || grade < 0 || grade > 20) {
      return res.status(400).json({ error: 'La note doit être comprise entre 0 et 20' });
    }

    // Vérifier que la soumission existe et appartient à un examen du professeur
    const submissionResult = await pool.query(
      `SELECT s.*, e.user_id as teacher_id 
       FROM submissions s 
       JOIN exams e ON s.exam_id = e.id 
       WHERE s.id = $1`,
      [id]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }

    const submission = submissionResult.rows[0];
    if (submission.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à noter cette soumission' });
    }

    // Mettre à jour la soumission
    const result = await pool.query(
      `UPDATE submissions 
       SET grade = $1, 
           feedback = $2, 
           status = 'graded',
           graded_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [grade, feedback, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la notation de la soumission:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la notation de la soumission',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Gestion des erreurs globale
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrage du serveur
app.listen(config.port, () => {
  console.log(`Serveur démarré sur le port ${config.port}`);
}); 