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
            return res.status(500).json({ error: "No hay conexión disponible con SQL Server." });
        }

        const result = await pool.request().query(`
            SELECT
                R.[Origen],
                R.[pasos],
                T.[TecnicoLimpio] AS [Tecnico],
                R.[Orden_de_Trabajo],
                R.[Tipo_de_Actividad],
                R.[Ciudad],
                R.[Zona],
                R.[Zona_de_trabajo],
                R.[Inicio],
                R.[Fin],
                R.[Estado_de_la_actividad],
                R.[Nro_Orden],
                R.[Codigo_de_Cierre],
                R.[Estado],
                R.[Tipo_Red],
                R.[Rut_o_Bucket],
                R.[Nombre],
                R.[Supervisor],
                R.[Numero_Cliente],
                R.[Cantidad_Extensores],
                R.[Cantidad_Planes],
                R.[Cantidad_DBox],
                R.[RGU]
            FROM dbo.ClaroVTR_RGU AS R
            CROSS APPLY (
                SELECT
                    NULLIF(
                        LTRIM(RTRIM(
                            CASE
                                WHEN CHARINDEX('_ZENER_', UPPER(R.[Tecnico])) > 0
                                    THEN SUBSTRING(R.[Tecnico], CHARINDEX('_ZENER_', UPPER(R.[Tecnico])) + LEN('_ZENER_'), LEN(R.[Tecnico]))
                                WHEN CHARINDEX('_ZENE_', UPPER(R.[Tecnico])) > 0
                                    THEN SUBSTRING(R.[Tecnico], CHARINDEX('_ZENE_', UPPER(R.[Tecnico])) + LEN('_ZENE_'), LEN(R.[Tecnico]))
                                WHEN CHARINDEX('_', R.[Tecnico]) > 0
                                    THEN RIGHT(R.[Tecnico], CHARINDEX('_', REVERSE(R.[Tecnico])) - 1)
                                ELSE R.[Tecnico]
                            END
                        )),
                        ''
                    ) AS [TecnicoLimpio]
            ) AS T
            ORDER BY
                R.[Origen],
                T.[TecnicoLimpio];
        `);

        return res.json(result.recordset);

    } catch (err) {
        console.error('❌ Error de SQL Server:', err);
        return res.status(500).json({
            error: "Error interno del servidor",
            detalle: err.message
        });
    }
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});