const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  username: 'exam_user',
  password: 'passer',
  database: 'gestion_examens',
  host: 'localhost',
});

sequelize.authenticate()
  .then(() => {
    console.log('Connexion à la base de données réussie !');
  })
  .catch((err) => {
    console.error('Impossible de se connecter à la base de données :', err);
  });