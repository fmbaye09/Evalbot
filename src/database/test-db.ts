import { authService } from '../services/authService';
import { examService } from '../services/examService';
import { submissionService } from '../services/submissionService';

async function testDatabase() {
  try {
    console.log('🔍 Test de la base de données...\n');

    // Test de création d'un utilisateur
    console.log('1. Création d\'un utilisateur test...');
    const user = await authService.signUp(
      'test@example.com',
      'password123',
      'Utilisateur Test'
    );
    console.log('✅ Utilisateur créé:', user);

    // Test de création d'un examen
    console.log('\n2. Création d\'un examen test...');
    const exam = await examService.createExam({
      title: 'Examen de Test',
      description: 'Ceci est un examen de test',
      user_id: user.id
    });
    console.log('✅ Examen créé:', exam);

    // Test de création d'une soumission
    console.log('\n3. Création d\'une soumission test...');
    const submission = await submissionService.createSubmission({
      exam_id: exam.id,
      user_id: user.id,
      status: 'pending'
    });
    console.log('✅ Soumission créée:', submission);

    // Test de récupération des examens
    console.log('\n4. Récupération de tous les examens...');
    const exams = await examService.getExams();
    console.log('✅ Examens récupérés:', exams);

    // Test de récupération des soumissions pour l'examen
    console.log('\n5. Récupération des soumissions pour l\'examen...');
    const submissions = await submissionService.getSubmissions(exam.id);
    console.log('✅ Soumissions récupérées:', submissions);

    // Test de mise à jour d'un examen
    console.log('\n6. Mise à jour de l\'examen...');
    const updatedExam = await examService.updateExam(exam.id, {
      title: 'Examen de Test (Modifié)'
    });
    console.log('✅ Examen mis à jour:', updatedExam);

    // Test de notation d'une soumission
    console.log('\n7. Notation de la soumission...');
    const gradedSubmission = await submissionService.updateSubmission(submission.id, {
      status: 'graded',
      grade: 85,
      feedback: 'Très bon travail !'
    });
    console.log('✅ Soumission notée:', gradedSubmission);

    console.log('\n✨ Tous les tests ont réussi !');
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testDatabase(); 