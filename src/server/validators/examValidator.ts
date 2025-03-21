import { z } from 'zod';

// Schéma de validation pour la création/mise à jour d'un examen
const examSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères'),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  deadline: z.string()
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'La date limite doit être une date valide')
    .optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date) > new Date();
    }, 'La date limite doit être dans le futur'),
});

// Type pour le résultat de la validation d'un examen
type ExamValidationResult = {
  success: boolean;
  error?: string;
  data?: z.infer<typeof examSchema>;
};

// Type pour le résultat de la validation d'une soumission
type SubmissionValidationResult = {
  success: boolean;
  error?: string;
  data?: z.infer<typeof submissionSchema>;
};

// Fonction de validation d'un examen
export function validateExam(data: unknown): ExamValidationResult {
  try {
    const validatedData = examSchema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    return {
      success: false,
      error: 'Erreur de validation',
    };
  }
}

// Schéma de validation pour la soumission d'un examen
const submissionSchema = z.object({
  exam_id: z.string()
    .uuid('L\'ID de l\'examen doit être un UUID valide')
});

// Fonction de validation d'une soumission
export function validateSubmission(data: unknown): SubmissionValidationResult {
  try {
    const validatedData = submissionSchema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    return {
      success: false,
      error: 'Erreur de validation',
    };
  }
} 