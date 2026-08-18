const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(__dirname));

// Configuración de conexión
const dbConfig = {
    user: 'paul.hidalgo',
    password: 'P@u1.2026',
    server: '172.30.0.129',
    database: 'VTR', // <-- REEMPLAZA ESTO por el nombre real de la BD
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Pool global reutilizable
const poolPromise = sql.connect(dbConfig)
    .then(pool => {
        console.log('Conexión exitosa a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Error al conectar con SQL Server:', err);
    });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/actividades', async (req, res) => {
    try {
        const pool = await poolPromise;
        if (!pool) {
            return res.status(500).json({ error: "No hay conexión disponible con SQL Server." });
        }

        const result = await pool.request().query(`
            SELECT 
                *
            FROM dbo.ClaroVTR_RGU
        `);

        res.json(result.recordset);
    } catch (err) {
        // Muestra el mensaje detallado de SQL Server en la respuesta HTTP
        console.error('❌ Error de SQL Server:', err);
        res.status(500).json({ 
            error: "Error interno del servidor", 
            detalle: err.message, 
            sqlState: err.code 
        });
    }
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});