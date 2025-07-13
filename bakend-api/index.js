const express = require('express');
const app = express();
const cors = require('cors');
const pathOptimizer = require('./routes/pathOptimizer');
const alternativeSearch = require('./routes/alternativeSearch');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/path', pathOptimizer);
app.use('/api/alternatives', alternativeSearch);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
