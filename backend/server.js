const express = require('express');
const app = express();

app.use(express.json());

app.use((req, res) => {
    res.json({ message: 'Votre requête a bien été reçue !' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});