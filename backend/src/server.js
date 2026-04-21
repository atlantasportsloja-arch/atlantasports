require('dotenv').config();
const app = require('./app');
const { startReviewReminderJob } = require('./jobs/reviewReminder');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Atlanta Sports API rodando na porta ${PORT}`);
  startReviewReminderJob();
});
