const express = require('express');
const app = express();
const cors = require('cors');
const pathOptimizer = require('./routes/pathOptimizer');

app.use(cors());
app.use(express.json());
app.use('/api/path', pathOptimizer);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
