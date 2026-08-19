require('dotenv').config(); // Carga las variables de .env al iniciar

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

// Configuración leída desde el archivo .env
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
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
            return res.status(500).json({
                error: "No hay conexión disponible con SQL Server."
            });
        }

        const result = await pool.request().query(`
            SELECT
                [Origen] AS [Fecha],
                [pasos],
                [Tecnico],
                [Orden_de_Trabajo],
                [Tipo_de_Actividad],
                [Ciudad],
                [Zona],
                [Zona_de_trabajo],
                [Inicio],
                [Fin],
                [Estado_de_la_actividad],
                [Nro_Orden],
                [Codigo_de_Cierre],
                [Estado],
                [Tipo_Red],
                [Rut_o_Bucket],
                [Nombre],
                [Supervisor],
                [Numero_Cliente],
                [Cantidad_Extensores],
                [Cantidad_Planes],
                [Cantidad_DBox],
                [RGU]
            FROM dbo.ClaroVTR_RGU
        `);

        res.json(result.recordset);

    } catch (err) {

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