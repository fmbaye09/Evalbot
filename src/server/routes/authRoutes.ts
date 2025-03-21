import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import { signupSchema, signinSchema } from '../validators/authValidator';
import { generateToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import { ZodError } from 'zod';

const router = express.Router();

// Route d'inscription
router.post('/signup', async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    
    const validatedData = signupSchema.parse(req.body);
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Insérer le nouvel utilisateur
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [validatedData.email, passwordHash, validatedData.name, validatedData.role]
    );

    const user = result.rows[0];
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion
router.post('/signin', async (req, res) => {
  try {
    const validatedData = signinSchema.parse(req.body);
    
    // Rechercher l'utilisateur
    const result = await db.query(
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

// Route pour obtenir l'utilisateur courant
router.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  res.json(req.user);
});

export default router; 