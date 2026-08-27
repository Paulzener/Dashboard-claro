
// 1192 - KPIS HISTORICO
// 1672 - GRÁFICO PROMEDIO GENERAL HISTORICO (RGU)
// ==========================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ==========================================

let rawData = [];
let filteredData = [];
let datosVistaHoy = [];
let vistaActual = "hoy";

let filtroSelecciones = {
    actividad: [],
    zona: [],
    ciudad: [],
    tecnico: [],
    supervisor: []
};

let estadoChartInstance = null;
let actividadChartInstance = null;
let duracionChartInstance = null;

let miniEfectividadChartInstance = null;
let miniDuracionChartInstance = null;

// ==========================================
// GRÁFICOS DE LA VISTA "HOY"
// ==========================================
let chartHoy1Instance = null;
let chartHoy2Instance = null;
let chartHoy3Instance = null;

// Datos utilizados por la vista actual
let datosHoyGlobal = [];
// RANGO DE FECHAS PERSONALIZADO (VISTA HOY)
// ==========================================
let rangoFechasHoy = {
    desde: null, // Date | null -> null significa "usar últimos 30 días"
    hasta: null
};

let rangoFechasAltas = {
    desde: null,
    hasta: null
};

const ordenMeses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const ordenMesesCompletos = [
    "Enero", "Febrero", "Marzo", "Abril",
    "Mayo", "Junio", "Julio", "Agosto",
    "Septiembre", "Octubre", "Noviembre", "Diciembre"
];


// ==========================================
// CHART DATALABELS
// ==========================================

if (typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
}

// ==========================================
// INICIO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    cargarDatosDesdeAPI();
    inicializarMultiselects();

    // ==========================
    // RANGO DE FECHAS (GLOBAL)
    // ==========================
    const inputRangoDesde = document.getElementById("rangoHoyDesde");
    const inputRangoHasta = document.getElementById("rangoHoyHasta");
    const btnApplyAll = document.getElementById("applyAllFilters");
    const btnClearAll = document.getElementById("clearFilters");

    // 1. EVENTO APLICAR TODOS LOS FILTROS
    btnApplyAll?.addEventListener("click", () => {

        // Si hay fechas seleccionadas, las capturamos y guardamos
        if (inputRangoDesde?.value && inputRangoHasta?.value) {
            const [anoD, mesD, diaD] = inputRangoDesde.value.split("-").map(Number);
            const [anoH, mesH, diaH] = inputRangoHasta.value.split("-").map(Number);

            const fechaInicio = new Date(anoD, mesD - 1, diaD);
            const fechaFin = new Date(anoH, mesH - 1, diaH);

            // Se asignan las mismas fechas para ambas vistas para mantener sincronía
            rangoFechasHoy.desde = fechaInicio;
            rangoFechasHoy.hasta = fechaFin;

            rangoFechasAltas.desde = fechaInicio;
            rangoFechasAltas.hasta = fechaFin;
        } else if (inputRangoDesde?.value || inputRangoHasta?.value) {
            // Si llenaron solo uno de los dos inputs
            alert("Por favor, selecciona tanto una fecha de inicio como una de fin.");
            return;
        }

        // Ejecutamos tu función principal que aplica multiselects y refresca el dashboard
        if (typeof aplicarTodosLosFiltros === "function") {
            aplicarTodosLosFiltros();
        }
    });

    // 2. EVENTO LIMPIAR FILTROS
    btnClearAll?.addEventListener("click", () => {

        // Limpiamos los campos visuales de fecha en el HTML
        if (inputRangoDesde) inputRangoDesde.value = "";
        if (inputRangoHasta) inputRangoHasta.value = "";

        // Reiniciamos las variables en memoria a null
        rangoFechasHoy.desde = null;
        rangoFechasHoy.hasta = null;

        rangoFechasAltas.desde = null;
        rangoFechasAltas.hasta = null;

        // Ejecutamos tu función principal de limpieza de multiselects y gráficos
        if (typeof limpiarFiltros === "function") {
            limpiarFiltros();
        }
    });

    // ==========================
    // BOTÓN MOSTRAR/OCULTAR FILTROS
    // ==========================
    const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
    const filters = document.getElementById("filters");

    toggleFiltersBtn?.addEventListener("click", () => {
        filters?.classList.toggle("is-open");
        toggleFiltersBtn.classList.toggle("active");
    });
});

// ==========================================
// CARGAR DATOS DESDE API
// ==========================================

function cargarDatosDesdeAPI() {

    fetch("/api/actividades")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    `Error HTTP ${response.status}`
                );
            }

            return response.json();
        })
        .then(data => {
            console.log("Filas totales devueltas por API:", data.length);

            rawData = data.map(item => {

                return {

                    ...item,

                    Fecha:
                        item.Fecha ??
                        item.FECHA ??
                        item.fecha ??
                        item.Fecha_Inicio ??
                        item.ORIGEN ??
                        item.Origen,

                    Tipo_de_Actividad:
                        item.Tipo_de_Actividad ??
                        item.TIPO_DE_ACTIVIDAD ??
                        item.TIPO_ACTIVIDAD ??
                        item.Tipo_Actividad,

                    Ciudad:
                        item.Ciudad ??
                        item.CIUDAD ??
                        item.ciudad,

                    Zona_de_trabajo:
                        item.Zona_de_trabajo ??
                        item.ZONA_DE_TRABAJO ??
                        item.ZONA_TRABAJO ??
                        item.Zona_Trabajo,

                    Estado:
                        item.Estado ??
                        item.ESTADO ??
                        item.estado,

                    Tecnico:
                        item.Tecnico ??
                        item.TECNICO ??
                        item.Técnico,

                    Supervisor:
                        item.Supervisor ??
                        item.SUPERVISOR ??
                        item.supervisor,

                    RGU:
                        item.RGU ??
                        item.rgu,

                    Inicio:
                        item.Inicio ??
                        item.INICIO ??
                        item.Hora_Inicio ??
                        item.HORA_INICIO,

                    Fin:
                        item.Fin ??
                        item.FIN ??
                        item.Hora_Fin ??
                        item.HORA_FIN,

                    Rut_o_Bucket:
                        item.Rut_o_Bucket ??
                        item.RUT ??
                        item.RUT_BUCKET ??
                        item.BUCKET,

                    Orden_de_Trabajo:
                        item.Orden_de_Trabajo ??
                        item.ORDEN_DE_TRABAJO ??
                        item.ORDEN_TRABAJO
                };
            });

            poblarFiltros(rawData);
            mostrarSecciones();


            vistaActual = "hoy";

            aplicarFiltros();

        })
        .catch(error => {

            console.error(
                "Error al cargar datos desde la base de datos:",
                error
            );
        });
}

// ==========================================
// MULTISELECT
// ==========================================

function inicializarMultiselects() {

    document
        .querySelectorAll(".custom-multiselect")
        .forEach(container => {

            const trigger =
                container.querySelector(".multiselect-trigger");

            const menu =
                container.querySelector(".multiselect-menu");

            const btnTodos =
                container.querySelector(".btn-todos");

            const btnLimpiar =
                container.querySelector(".btn-limpiar");

            const btnApply =
                container.querySelector(".btn-apply");

            const filterKey =
                container.dataset.filterKey;


            // Abrir / cerrar
            trigger?.addEventListener("click", e => {

                e.stopPropagation();

                document
                    .querySelectorAll(".multiselect-menu")
                    .forEach(m => {

                        if (m !== menu) {
                            m.classList.add("hidden");
                        }
                    });

                menu?.classList.toggle("hidden");
            });


            // TODOS
            btnTodos?.addEventListener('click', (e) => {

                e.stopPropagation();

                const inputs = container.querySelectorAll(
                    '.multiselect-options input[type="checkbox"]'
                );

                inputs.forEach(chk => {
                    chk.checked = true;
                });

                filtroSelecciones[filterKey] =
                    Array.from(inputs).map(chk => chk.value);

                actualizarTextoTrigger(container, filterKey);
            });


            // LIMPIAR
            btnLimpiar?.addEventListener('click', (e) => {

                e.stopPropagation();

                const inputs = container.querySelectorAll(
                    '.multiselect-options input[type="checkbox"]'
                );

                inputs.forEach(chk => {
                    chk.checked = false;
                });

                filtroSelecciones[filterKey] = [];

                actualizarTextoTrigger(container, filterKey);
            });


            // APLICAR
            btnApply?.addEventListener("click", e => {

                e.stopPropagation();

                actualizarSeleccionDesdeDOM(
                    container,
                    filterKey
                );

                actualizarTextoTrigger(
                    container,
                    filterKey
                );

                menu?.classList.add("hidden");

                aplicarFiltros();
            });
        });


    // Cerrar al hacer click afuera
    document.addEventListener("click", e => {

        if (!e.target.closest(".custom-multiselect")) {

            document
                .querySelectorAll(".multiselect-menu")
                .forEach(menu => {

                    menu.classList.add("hidden");
                });
        }
    });
}

// ==========================================
// ACTUALIZAR SELECCIÓN
// ==========================================

function actualizarSeleccionDesdeDOM(container, filterKey) {

    const checkedInputs =
        Array.from(
            container.querySelectorAll(
                ".multiselect-options input:checked"
            )
        );

    filtroSelecciones[filterKey] =
        checkedInputs.map(input =>
            String(input.value).trim()
        );
}

// ==========================================
// POBLAR MULTISELECT
// ==========================================

function poblarMultiselect(
    idContainer,
    filterKey,
    items,
    esUnico = false
) {

    const container =
        document.getElementById(idContainer);

    if (!container) return;

    const optionsContainer =
        container.querySelector(".multiselect-options");

    if (!optionsContainer) return;

    optionsContainer.innerHTML = "";

    filtroSelecciones[filterKey] = [];


    const header =
        container.querySelector(".multiselect-header");

    if (header) {

        header.style.display =
            esUnico ? "none" : "flex";
    }


    items.forEach((item, index) => {

        const val =
            typeof item === "object"
                ? item.value
                : item;

        const text =
            typeof item === "object"
                ? item.text
                : item;


        const label =
            document.createElement("label");


        if (esUnico) {

            const checked =
                index === 0;

            if (checked) {

                filtroSelecciones[filterKey] = [
                    String(val)
                ];
            }


            label.innerHTML = `
                <input
                    type="radio"
                    name="radio-${filterKey}"
                    value="${escapeHTML(val)}"
                    ${checked ? "checked" : ""}
                    class="chk-${filterKey}"
                >

                <span>${escapeHTML(text)}</span>
            `;

        } else {

            filtroSelecciones[filterKey].push(
                String(val)
            );

            label.innerHTML = `
                <input
                    type="checkbox"
                    value="${escapeHTML(val)}"
                    checked
                    class="chk-${filterKey}"
                >

                <span>${escapeHTML(text)}</span>
            `;
        }

        optionsContainer.appendChild(label);
    });


    actualizarTextoTrigger(
        container,
        filterKey
    );
}

// ==========================================
// ESCAPAR HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// TEXTO DEL FILTRO
// ==========================================

function actualizarTextoTrigger(
    container,
    filterKey
) {

    const triggerText =
        container.querySelector(".selected-text");

    if (!triggerText) return;


    const checkedInput =
        container.querySelector(
            ".multiselect-options input:checked"
        );

    const total =
        container.querySelectorAll(
            ".multiselect-options input"
        ).length;

    const marcados =
        filtroSelecciones[filterKey].length;


    // RADIO
    if (
        container.querySelector(
            'input[type="radio"]'
        )
    ) {

        triggerText.textContent =
            checkedInput
                ? checkedInput.nextElementSibling.textContent
                : "Seleccionar";

        return;
    }


    // TODOS
    if (marcados === total) {

        if (filterKey === "mes") {
            triggerText.textContent =
                "Todos los meses";
        }
        else if (
            filterKey === "ciudad" ||
            filterKey === "zona"
        ) {
            triggerText.textContent =
                "Todas";
        }
        else {
            triggerText.textContent =
                "Todos";
        }

        return;
    }


    // NINGUNO
    if (marcados === 0) {

        triggerText.textContent =
            "Ninguno";

        return;
    }


    // UNO
    if (marcados === 1) {

        triggerText.textContent =
            checkedInput
                ? checkedInput.nextElementSibling.textContent
                : filtroSelecciones[filterKey][0];

        return;
    }


    // VARIOS
    triggerText.textContent =
        `${marcados} seleccionados`;
}

// ==========================================
// FECHAS
// ==========================================

function obtenerFechaObjeto(item) {
    if (!item) return null;

    const rawFecha =
        item.Fecha ??
        item.FECHA ??
        item.fecha ??
        item.Fecha_Inicio ??
        item.Origen;

    if (!rawFecha) return null;

    if (rawFecha instanceof Date) {
        return isNaN(rawFecha.getTime()) ? null : rawFecha;
    }

    const str = String(rawFecha).trim();
    if (!str) return null;

    // 1. Formatos YYYY-MM-DD, YYYY/MM/DD o ISO (2026-06-01T00:00:00)
    const matchYMD = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (matchYMD) {
        const ano = Number(matchYMD[1]);
        const mes = Number(matchYMD[2]) - 1; // 0 = Enero, 11 = Diciembre
        const dia = Number(matchYMD[3]);
        return new Date(ano, mes, dia);
    }

    // 2. Formatos DD/MM/YYYY o DD-MM-YYYY
    const matchDMY = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (matchDMY) {
        const dia = Number(matchDMY[1]);
        const mes = Number(matchDMY[2]) - 1;
        const ano = Number(matchDMY[3]);
        return new Date(ano, mes, dia);
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

function obtenerClaveFecha(fecha) {

    return `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
    ).padStart(2, "0")}-${String(
        fecha.getDate()
    ).padStart(2, "0")}`;
}

// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(item) {
    const f = obtenerFechaObjeto(item);

    if (!f || isNaN(f.getTime())) {
        return '-';
    }

    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const anio = f.getFullYear();

    return `${dia}/${mes}/${anio}`;
}

// ==========================================
// HORAS
// ==========================================

function convertirAHoraMinutos(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }


    const str =
        String(valor).trim();


    const partes =
        str.split(":");


    if (partes.length < 2) {
        return null;
    }


    const h =
        parseInt(partes[0], 10);

    const m =
        parseInt(partes[1], 10);


    if (
        isNaN(h) ||
        isNaN(m)
    ) {
        return null;
    }


    return h * 60 + m;
}

// ==========================================
// DIFERENCIA HORAS
// ==========================================

function calcularDiferenciaMinutos(
    horaInicioRaw,
    horaFinRaw
) {

    const minInicio =
        convertirAHoraMinutos(
            horaInicioRaw
        );

    const minFin =
        convertirAHoraMinutos(
            horaFinRaw
        );


    // Igual que SQL:
    // si alguno está vacío → NULL
    if (
        minInicio === null ||
        minFin === null
    ) {
        return null;
    }


    // Igual que:
    // WHEN [Fin] < [Inicio] THEN 0

    if (minFin < minInicio) {
        return 0;
    }


    // Igual que:
    // DATEDIFF(SECOND, Inicio, Fin) / 60.0

    return minFin - minInicio;
}

// ==========================================
// MOSTRAR SECCIONES
// ==========================================

function mostrarSecciones() {

    document
        .getElementById("filters")
        ?.classList.remove("hidden");

    document
        .getElementById("kpis")
        ?.classList.remove("hidden");

    document
        .getElementById("charts")
        ?.classList.remove("hidden");
}

// ==========================================
// POBLAR FILTROS
// ==========================================

function poblarFiltros(data) {

    const ciudades = new Set();
    const zonas = new Set();
    const actividades = new Set();
    const tecnicos = new Set();
    const supervisores = new Set();

    data.forEach(item => {

        const act = (item.Tipo_de_Actividad || "").toString().trim();
        if (act) actividades.add(act);

        const ciudad = (item.Ciudad || "").toString().trim();
        if (ciudad) ciudades.add(ciudad);

        const zona = (item.Zona_de_trabajo || "").toString().trim();
        if (zona) zonas.add(zona);

        const tecnico = (item.Tecnico || "").toString().trim();
        if (tecnico) tecnicos.add(tecnico);

        const supervisor = (item.Supervisor || "").toString().trim();
        if (supervisor) supervisores.add(supervisor);
    });

    const ciudadesOrdenadas = Array.from(ciudades).sort((a, b) => a.localeCompare(b));
    const zonasOrdenadas = Array.from(zonas).sort((a, b) => a.localeCompare(b));
    const actividadesOrdenadas = Array.from(actividades).sort((a, b) => a.localeCompare(b));
    const tecnicosOrdenados = Array.from(tecnicos).sort((a, b) => a.localeCompare(b));
    const supervisoresOrdenados = Array.from(supervisores).sort((a, b) => a.localeCompare(b));

    poblarMultiselect("multiselectActividad", "actividad", actividadesOrdenadas);
    poblarMultiselect("multiselectZona", "zona", zonasOrdenadas);
    poblarMultiselect("multiselectCiudad", "ciudad", ciudadesOrdenadas);
    poblarMultiselect("multiselectTecnico", "tecnico", tecnicosOrdenados);
    poblarMultiselect("multiselectSupervisor", "supervisor", supervisoresOrdenados);
}

// ==========================================
// APLICAR FILTROS (COMPLETO)
// ==========================================
function aplicarFiltros() {

    filteredData = rawData.filter(item => {

        const itemAct = (item.Tipo_de_Actividad || "").toString().trim();
        const itemCiudad = (item.Ciudad || "").toString().trim();
        const itemZona = (item.Zona_de_trabajo || "").toString().trim();
        const itemTecnico = (item.Tecnico || "").toString().trim();
        const itemSupervisor = (item.Supervisor || "").toString().trim();

        const totalAct = document.querySelectorAll("#multiselectActividad .multiselect-options input").length;
        const cumpleActividad =
            totalAct === 0 ||
            filtroSelecciones.actividad.length === 0 ||
            filtroSelecciones.actividad.length === totalAct ||
            filtroSelecciones.actividad.includes(itemAct);

        const totalCiudad = document.querySelectorAll("#multiselectCiudad .multiselect-options input").length;
        const cumpleCiudad =
            totalCiudad === 0 ||
            filtroSelecciones.ciudad.length === 0 ||
            filtroSelecciones.ciudad.length === totalCiudad ||
            filtroSelecciones.ciudad.includes(itemCiudad);

        const totalZona = document.querySelectorAll("#multiselectZona .multiselect-options input").length;
        const cumpleZona =
            totalZona === 0 ||
            filtroSelecciones.zona.length === 0 ||
            filtroSelecciones.zona.length === totalZona ||
            filtroSelecciones.zona.includes(itemZona);

        const totalTecnico = document.querySelectorAll("#multiselectTecnico .multiselect-options input").length;
        const cumpleTecnico =
            totalTecnico === 0 ||
            filtroSelecciones.tecnico.length === 0 ||
            filtroSelecciones.tecnico.length === totalTecnico ||
            filtroSelecciones.tecnico.includes(itemTecnico);

        const totalSupervisor = document.querySelectorAll("#multiselectSupervisor .multiselect-options input").length;
        const cumpleSupervisor =
            totalSupervisor === 0 ||
            filtroSelecciones.supervisor.length === 0 ||
            filtroSelecciones.supervisor.length === totalSupervisor ||
            filtroSelecciones.supervisor.includes(itemSupervisor);

        return (
            cumpleActividad &&
            cumpleCiudad &&
            cumpleZona &&
            cumpleTecnico &&
            cumpleSupervisor
        );
    });

    console.log("Filtros aplicados:", filtroSelecciones);
    console.log("Registros originales:", rawData.length);

    actualizarDashboard();
}

// ==========================================
// APLICAR TODOS
// ==========================================

function aplicarTodosLosFiltros() {

    document.querySelectorAll('.custom-multiselect').forEach(container => {

        const filterKey = container.dataset.filterKey;

        const checkedInputs = Array.from(
            container.querySelectorAll(
                '.multiselect-options input:checked'
            )
        );

        filtroSelecciones[filterKey] =
            checkedInputs.map(chk => chk.value);

        actualizarTextoTrigger(
            container,
            filterKey
        );
    });


    document
        .getElementById('filters')
        ?.classList.remove('is-open');

    document
        .getElementById('toggleFiltersBtn')
        ?.classList.remove('active');


    aplicarFiltros();
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================

function limpiarFiltros() {

    document
        .querySelectorAll(".custom-multiselect")
        .forEach(container => {

            const filterKey =
                container.dataset.filterKey;

            const radio =
                container.querySelector(
                    'input[type="radio"]'
                );


            // AÑO
            if (radio) {

                const primerRadio =
                    container.querySelector(
                        'input[type="radio"]'
                    );

                if (primerRadio) {

                    primerRadio.checked = true;

                    filtroSelecciones[filterKey] = [
                        String(primerRadio.value)
                    ];
                }

            }

            // CHECKBOX
            else {

                const checkboxes =
                    container.querySelectorAll(
                        'input[type="checkbox"]'
                    );


                checkboxes.forEach(chk => {

                    chk.checked = true;
                });


                filtroSelecciones[filterKey] =
                    Array.from(checkboxes)
                        .map(chk =>
                            String(chk.value)
                        );
            }


            actualizarTextoTrigger(
                container,
                filterKey
            );
        });


    aplicarFiltros();
}

// ==========================================
// DASHBOARD
// ==========================================

function actualizarDashboard() {

    // Si estamos en HOY
    if (vistaActual === "hoy") {

        actualizarVistaHoy();

        return;
    }

    // Si estamos en ALTAS (¡Faltaba esta condición!)
    if (vistaActual === "altas") {
        actualizarVistaAltas();
        return;
    }

    // Si estamos en HISTÓRICO
    if (vistaActual === "historico") {

        actualizarKPIsHistorico(filteredData);

        actualizarGraficos(filteredData);

        return;
    }

}

// ==========================================
// OBTENER ESTADOS
// ==========================================

function obtenerCompletadas() {

    return filteredData.filter(item => {

        return String(
            item.Estado ?? ""
        )
            .trim()
            .toLowerCase() === "completado";

    }).length;
}

function obtenerNoRealizadas() {

    return filteredData.filter(item => {

        return String(
            item.Estado ?? ""
        )
            .trim()
            .toLowerCase() === "no realizada";

    }).length;
}

// ==========================================
// KPIS
// ==========================================

// Helper interno para calcular diferencia sin romper si cambia el nombre de la función
function obtenerDiferenciaTiempo(inicio, fin) {
    if (typeof calcularDiferenciaMinutos === "function") {
        return calcularDiferenciaMinutos(inicio, fin);
    }
    if (typeof obtenerMinutosDiferencia === "function") {
        return obtenerMinutosDiferencia(inicio, fin);
    }
    return null;
}
// =====================================================
// HELPER: OBTENER PROPIEDAD TOLERANTE A NOMBRES Y MAYÚSCULAS
// =====================================================
function obtenerProp(item, ...propiedades) {
    if (!item || typeof item !== "object") return null;

    for (const prop of propiedades) {
        // Búsqueda directa
        if (item[prop] !== undefined && item[prop] !== null) {
            return item[prop];
        }
        // Búsqueda insensible a mayúsculas/minúsculas
        const propLower = String(prop).toLowerCase();
        const llaveEncontrada = Object.keys(item).find(k => k.toLowerCase() === propLower);
        if (llaveEncontrada && item[llaveEncontrada] !== undefined && item[llaveEncontrada] !== null) {
            return item[llaveEncontrada];
        }
    }
    return null;
}
// =====================================================
// 1. ACTUALIZAR KPIS GENERAL
// =====================================================
function actualizarKPIs(data) {

    const datos = Array.isArray(data)
        ? data
        : [];

    const total = datos.length;

    let completadas = 0;
    let noRealizadas = 0;

    let duracionTotalSum = 0;
    let duracionConteo = 0;

    const agruparTecnicosKPI = {};


    // =====================================================
    // RECORRER DATOS
    // =====================================================

    datos.forEach(item => {

        const estado =
            String(item.Estado ?? "")
                .trim()
                .toLowerCase();


        // ESTADOS
        if (estado === "completado") {
            completadas++;
        }

        if (estado === "no realizada") {
            noRealizadas++;
        }


        // =================================================
        // DURACIÓN
        // =================================================

        const inicio =
            item.Inicio ??
            item.Hora_Inicio;

        const fin =
            item.Fin ??
            item.Hora_Fin;

        const diferencia =
            calcularDiferenciaMinutos(
                inicio,
                fin
            );

        if (
            estado === "completado" &&
            diferencia !== null &&
            diferencia >= 0 &&
            diferencia < 720
        ) {

            duracionTotalSum += diferencia;
            duracionConteo++;

        }


        // =================================================
        // RGU
        // =================================================

        if (
            estado !== "completado" &&
            estado !== "no realizada"
        ) {
            return;
        }


        const fecha =
            obtenerFechaObjeto(item);

        let tecnico =
            String(item.Tecnico ?? "")
                .trim()
                .toUpperCase();

        if (!fecha || !tecnico) {
            return;
        }


        tecnico =
            tecnico
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );


        const diaKey =
            `${fecha.getFullYear()}-` +
            `${String(fecha.getMonth() + 1).padStart(2, "0")}-` +
            `${String(fecha.getDate()).padStart(2, "0")}`;


        let rgu =
            item.RGU ?? 0;

        if (typeof rgu === "string") {

            rgu =
                rgu
                    .replace(",", ".")
                    .trim();

        }

        const rguNum =
            parseFloat(rgu) || 0;


        if (!agruparTecnicosKPI[tecnico]) {
            agruparTecnicosKPI[tecnico] = {};
        }

        if (
            agruparTecnicosKPI[tecnico][diaKey] === undefined
        ) {
            agruparTecnicosKPI[tecnico][diaKey] = 0;
        }

        agruparTecnicosKPI[tecnico][diaKey] +=
            rguNum;

    });


    // =====================================================
    // RGU PROMEDIO
    // =====================================================

    const tecnicos =
        Object.keys(agruparTecnicosKPI);

    let rguPromedio = 0;

    if (tecnicos.length > 0) {

        let sumaPromedios = 0;

        tecnicos.forEach(tecnico => {

            const dias =
                Object.keys(
                    agruparTecnicosKPI[tecnico]
                );

            let totalTecnico = 0;

            dias.forEach(dia => {

                totalTecnico +=
                    agruparTecnicosKPI[tecnico][dia];

            });

            if (dias.length > 0) {

                sumaPromedios +=
                    totalTecnico / dias.length;

            }

        });

        rguPromedio =
            sumaPromedios /
            tecnicos.length;
    }


    // =====================================================
    // EFECTIVIDAD
    // =====================================================

    const totalEstados =
        completadas +
        noRealizadas;

    const efectividad =
        totalEstados > 0
            ? (
                completadas /
                totalEstados
            ) * 100
            : 0;


    // =====================================================
    // DURACIÓN
    // =====================================================

    const duracionPromedio =
        duracionConteo > 0
            ? Math.round(
                duracionTotalSum /
                duracionConteo
            )
            : 0;

    const horas =
        Math.floor(
            duracionPromedio / 60
        );

    const minutos =
        duracionPromedio % 60;

    const duracionFormateada =
        `${String(horas).padStart(2, "0")}:` +
        `${String(minutos).padStart(2, "0")}`;


    // =====================================================
    // PINTAR KPI
    // =====================================================

    const totalElem =
        document.getElementById("totalOrdenes");

    if (totalElem) {
        totalElem.innerText =
            total.toLocaleString("es-CL");
    }


    const completadasElem =
        document.getElementById("completadas");

    if (completadasElem) {
        completadasElem.innerText =
            completadas.toLocaleString("es-CL");
    }


    const noRealizadasElem =
        document.getElementById("noRealizadas");

    if (noRealizadasElem) {
        noRealizadasElem.innerText =
            noRealizadas.toLocaleString("es-CL");
    }


    const pctCompElem =
        document.getElementById("pctCompletadas");

    if (pctCompElem) {

        pctCompElem.innerText =
            total > 0
                ? (
                    completadas /
                    total *
                    100
                ).toFixed(1) + "%"
                : "0%";
    }


    const efectividadElem =
        document.getElementById("efectividad");

    if (efectividadElem) {

        efectividadElem.innerText =
            efectividad.toFixed(1) + "%";
    }


    const rguElem =
        document.getElementById("rguTotal");

    if (rguElem) {

        rguElem.innerText =
            rguPromedio
                .toFixed(1)
                .replace(".", ",");
    }


    const duracionElem =
        document.getElementById("duracionPromedio");

    if (duracionElem) {

        duracionElem.innerText =
            duracionFormateada;
    }

}

// =====================================================
// 2. ACTUALIZAR KPIS HOY (ÚLTIMOS 30 DÍAS)
// =====================================================
function actualizarKPIsHoy(data, rango) {
    const datos = Array.isArray(data) ? data : [];

    const rangoActivo = rango || obtenerRangoHoyActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;

    let completadas = 0;
    let noRealizadas = 0;

    const rguPorDia = {};
    const duracionPorDia = {};

    datos.forEach(item => {
        const f = typeof obtenerFechaObjeto === "function"
            ? obtenerFechaObjeto(item)
            : (item.Fecha ? new Date(item.Fecha) : null);

        if (!f || f < fechaInicioRango) return;

        const estadoRaw = String(obtenerProp(item, "Estado", "estado") ?? "").trim().toLowerCase();
        const esCompletado = estadoRaw === "completado" || estadoRaw === "completada";
        const esNoRealizada = estadoRaw === "no realizada" || estadoRaw === "no realizado";

        if (esCompletado) completadas++;
        if (esNoRealizada) noRealizadas++;

        const itemKey = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;

        if (esCompletado || esNoRealizada) {
            let tecnico = String(obtenerProp(item, "Tecnico", "tecnico") ?? "").trim().toUpperCase();
            if (tecnico) {
                tecnico = tecnico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const rguVal = obtenerProp(item, "RGU", "rgu") ?? 0;
                const rguNum = Number(String(rguVal).replace(",", ".")) || 0;

                rguPorDia[itemKey] = rguPorDia[itemKey] || {};
                rguPorDia[itemKey][tecnico] = (rguPorDia[itemKey][tecnico] || 0) + rguNum;
            }
        }

        // =====================================================
        // DURACIÓN — agrupada por día (igual que el gráfico)
        // =====================================================
        if (esCompletado) {
            const inicio = obtenerProp(item, "Inicio", "Hora_Inicio", "inicio");
            const fin = obtenerProp(item, "Fin", "Hora_Fin", "fin");
            const diferencia = obtenerDiferenciaTiempo(inicio, fin);

            if (diferencia !== null && !isNaN(diferencia) && diferencia >= 0 && diferencia < 720) {
                if (!duracionPorDia[itemKey]) {
                    duracionPorDia[itemKey] = { suma: 0, cantidad: 0 };
                }
                duracionPorDia[itemKey].suma += diferencia;
                duracionPorDia[itemKey].cantidad++;
            }
        }
    });

    const valoresRGU = [];
    const valoresDuracion = [];

    for (let i = 0; i < cantidadDias; i++) {
        const fecha = new Date(fechaInicioRango);
        fecha.setDate(fecha.getDate() + i);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

        // RGU del día — solo se cuenta si hubo técnicos con datos ese día
        const tecnicosRGU = rguPorDia[key] || {};
        const listaTecnicos = Object.keys(tecnicosRGU);

        if (listaTecnicos.length > 0) {
            const sumaRGU = listaTecnicos.reduce((acc, tec) => acc + tecnicosRGU[tec], 0);
            valoresRGU.push(Number((sumaRGU / listaTecnicos.length).toFixed(1)));
        }

        // Duración del día — solo se cuenta si hubo actividad completada ese día
        const diaDuracion = duracionPorDia[key];
        if (diaDuracion && diaDuracion.cantidad > 0) {
            valoresDuracion.push(diaDuracion.suma / diaDuracion.cantidad);
        }
    }

    const total = completadas + noRealizadas;
    const efectividad = total > 0 ? (completadas / total) * 100 : 0;

    // Promedios solo sobre los días que tuvieron datos (los días vacíos no cuentan)
    const sumaRGU = valoresRGU.reduce((acc, val) => acc + val, 0);
    const rguPromedio = valoresRGU.length > 0 ? sumaRGU / valoresRGU.length : 0;

    const sumaDuracion = valoresDuracion.reduce((acc, val) => acc + val, 0);
    const duracionPromedio = valoresDuracion.length > 0 ? Math.round(sumaDuracion / valoresDuracion.length) : 0;

    const horas = Math.floor(duracionPromedio / 60);
    const minutos = duracionPromedio % 60;
    const duracionFormateada = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

    const setDOM = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setDOM("totalOrdenes", total.toLocaleString("es-CL"));
    setDOM("completadas", completadas.toLocaleString("es-CL"));
    setDOM("noRealizadas", noRealizadas.toLocaleString("es-CL"));
    setDOM("pctCompletadas", total > 0 ? (completadas / total * 100).toFixed(1) + "%" : "0%");
    setDOM("efectividad", efectividad.toFixed(1) + "%");
    setDOM("rguTotal", rguPromedio.toFixed(1).replace(".", ","));
    setDOM("duracionPromedio", duracionFormateada);
}

// =====================================================
// 3. ACTUALIZAR KPIS ALTAS (RESTAURADA)
// =====================================================
function actualizarKPIsAltas(data, rango) {
    const datos = Array.isArray(data) ? data : [];

    const rangoActivo = rango || obtenerRangoAltasActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;

    let completadas = 0;
    let noRealizadas = 0;

    const rguPorDia = {};
    const duracionPorDia = {};

    for (let i = 0; i < cantidadDias; i++) {
        const fecha = new Date(fechaInicioRango);
        fecha.setDate(fecha.getDate() + i);
        const key =
            `${fecha.getFullYear()}-` +
            `${String(fecha.getMonth() + 1).padStart(2, "0")}-` +
            `${String(fecha.getDate()).padStart(2, "0")}`;

        rguPorDia[key] = {};
        duracionPorDia[key] = { suma: 0, cantidad: 0 };
    }

    datos.forEach(item => {
        const tipo = String(item.Tipo_de_Actividad ?? "").trim().toLowerCase();
        if (tipo !== "alta" && tipo !== "alta traslado" && tipo !== "migración" && tipo !== "migracion") return;

        const fechaRaw = item.Origen || item.Fecha;
        if (!fechaRaw) return;

        const rawStr = String(fechaRaw).trim();
        const key = rawStr.length >= 10 ? rawStr.substring(0, 10) : "";
        if (!Object.prototype.hasOwnProperty.call(rguPorDia, key)) return;

        const estado = String(item.Estado ?? "").trim().toLowerCase();

        if (estado === "completado") {
            completadas++;

            const inicio = item.Inicio ?? item.Hora_Inicio;
            const fin = item.Fin ?? item.Hora_Fin;
            const diferencia = obtenerDiferenciaTiempo(inicio, fin);

            if (diferencia !== null && !isNaN(diferencia) && diferencia >= 0 && diferencia < 720) {
                duracionPorDia[key].suma += diferencia;
                duracionPorDia[key].cantidad++;
            }
        } else if (estado === "no realizada") {
            noRealizadas++;
        }

        if (estado !== "completado" && estado !== "no realizada") return;

        let rgu = item.RGU ?? 0;
        if (typeof rgu === "string") rgu = rgu.replace(",", ".").trim();
        rgu = Number(rgu) || 0;

        let tecnico = String(item.Tecnico ?? "").trim().toUpperCase();
        if (!tecnico) return;
        tecnico = tecnico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        rguPorDia[key][tecnico] = (rguPorDia[key][tecnico] || 0) + rgu;
    });

    const valoresRGU = [];
    const valoresDuracion = [];

    Object.keys(rguPorDia).forEach(key => {
        const tecnicosDia = rguPorDia[key];
        const listaTecnicos = Object.keys(tecnicosDia);

        // Solo se cuenta si hubo técnicos con datos ese día
        if (listaTecnicos.length > 0) {
            const suma = listaTecnicos.reduce((acc, tec) => acc + tecnicosDia[tec], 0);
            valoresRGU.push(Number((suma / listaTecnicos.length).toFixed(1)));
        }

        // Solo se cuenta si hubo actividad completada ese día
        const diaDuracion = duracionPorDia[key];
        if (diaDuracion.cantidad > 0) {
            valoresDuracion.push(diaDuracion.suma / diaDuracion.cantidad);
        }
    });

    // Promedios solo sobre los días que tuvieron datos (los días vacíos no cuentan)
    const rguPromedio = valoresRGU.length > 0
        ? valoresRGU.reduce((acc, val) => acc + val, 0) / valoresRGU.length
        : 0;

    const total = completadas + noRealizadas;
    const efectividad = total > 0 ? (completadas / total) * 100 : 0;

    const sumaDuracion = valoresDuracion.reduce((acc, val) => acc + val, 0);
    const duracionPromedio = valoresDuracion.length > 0 ? Math.round(sumaDuracion / valoresDuracion.length) : 0;

    const horas = Math.floor(duracionPromedio / 60);
    const minutos = duracionPromedio % 60;
    const duracionFormateada = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

    const setDOM = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setDOM("totalOrdenes", total.toLocaleString("es-CL"));
    setDOM("completadas", completadas.toLocaleString("es-CL"));
    setDOM("noRealizadas", noRealizadas.toLocaleString("es-CL"));
    setDOM("pctCompletadas", total > 0 ? (completadas / total * 100).toFixed(1) + "%" : "0%");
    setDOM("efectividad", efectividad.toFixed(1) + "%");
    setDOM("rguTotal", rguPromedio.toFixed(1).replace(".", ","));
    setDOM("duracionPromedio", duracionFormateada);
}

// =====================================================
// 4. ACTUALIZAR KPIS HISTÓRICO (SIGUIENDO LA LÓGICA DEL GRÁFICO)
// =====================================================
function actualizarKPIsHistorico(data) {
    const datos = Array.isArray(data) ? data : [];
    const listaMeses = (typeof ordenMeses !== "undefined" && Array.isArray(ordenMeses))
        ? ordenMeses
        : MESES_DEFAULT;

    let completadas = 0;
    let noRealizadas = 0;

    const datosRGU = {};
    const datosDiariosDuracion = {};

    // NIVEL 1: Agrupación diaria por técnico
    datos.forEach(item => {
        const fecha = typeof obtenerFechaObjeto === "function"
            ? obtenerFechaObjeto(item)
            : (item.Fecha ? new Date(item.Fecha) : null);

        if (!fecha || isNaN(fecha.getTime())) return;

        const estado = String(item.Estado ?? "").trim().toLowerCase();

        if (estado === "completado") completadas++;
        if (estado === "no realizada") noRealizadas++;

        if (estado !== "completado" && estado !== "no realizada") return;

        const mes = listaMeses[fecha.getMonth()];
        const tecnico = (item.Tecnico === null || item.Tecnico === undefined)
            ? "__TECNICO_NULL__"
            : String(item.Tecnico);

        if (!tecnico) return;

        const dia = fecha.getFullYear() + "-" +
            String(fecha.getMonth() + 1).padStart(2, "0") + "-" +
            String(fecha.getDate()).padStart(2, "0");

        // RGU
        let rgu = item.RGU ?? 0;
        if (typeof rgu === "string") rgu = rgu.replace(",", ".").trim();
        const rguNum = Number(rgu) || 0;

        datosRGU[mes] = datosRGU[mes] || {};
        datosRGU[mes][tecnico] = datosRGU[mes][tecnico] || {};
        datosRGU[mes][tecnico][dia] = (datosRGU[mes][tecnico][dia] || 0) + rguNum;

        // DURACIÓN (Lógica exacta del gráfico)
        if (estado === "completado") {
            const inicio = item.Inicio ?? item.Hora_Inicio;
            const fin = item.Fin ?? item.Hora_Fin;

            let diferencia = typeof calcularDiferenciaMinutos === "function"
                ? calcularDiferenciaMinutos(inicio, fin)
                : obtenerDiferenciaTiempo(inicio, fin);

            if (diferencia === null || diferencia < 0) {
                diferencia = 0;
            }

            if (!datosDiariosDuracion[mes]) datosDiariosDuracion[mes] = {};
            if (!datosDiariosDuracion[mes][tecnico]) datosDiariosDuracion[mes][tecnico] = {};
            if (!datosDiariosDuracion[mes][tecnico][dia]) {
                datosDiariosDuracion[mes][tecnico][dia] = { suma: 0, cantidad: 0 };
            }

            datosDiariosDuracion[mes][tecnico][dia].suma += diferencia;
            datosDiariosDuracion[mes][tecnico][dia].cantidad++;
        }
    });

    // RGU MENSUAL
    const valoresRGUMensuales = listaMeses.map(mes => {
        const tecnicos = datosRGU[mes] || {};
        const promediosTecnicos = [];

        Object.keys(tecnicos).forEach(tec => {
            const dias = Object.values(tecnicos[tec]);
            if (dias.length === 0) return;
            const total = dias.reduce((suma, valor) => suma + valor, 0);
            promediosTecnicos.push(total / dias.length);
        });

        if (promediosTecnicos.length === 0) return null;
        const suma = promediosTecnicos.reduce((s, v) => s + v, 0);
        return Number((suma / promediosTecnicos.length).toFixed(1));
    });

    const rguValidos = valoresRGUMensuales.filter(v => v !== null && v !== undefined);
    const rguPromedio = rguValidos.length > 0 ? rguValidos.reduce((s, v) => s + v, 0) / rguValidos.length : 0;

    // NIVEL 2: Promedio mensual de cada técnico a partir de sus promedios diarios
    const promediosTecnicosDuracion = {};

    listaMeses.forEach(mes => {
        promediosTecnicosDuracion[mes] = {};
        if (!datosDiariosDuracion[mes]) return;

        Object.keys(datosDiariosDuracion[mes]).forEach(tec => {
            const dias = datosDiariosDuracion[mes][tec];

            const promediosDiarios = Object.values(dias).map(d => {
                return d.cantidad > 0 ? d.suma / d.cantidad : 0;
            });

            if (promediosDiarios.length === 0) return;

            const sumaPromedios = promediosDiarios.reduce((suma, p) => suma + p, 0);
            promediosTecnicosDuracion[mes][tec] = sumaPromedios / promediosDiarios.length;
        });
    });

    // NIVEL 3: Promedio del mes (idéntico a los valores del gráfico)
    const promediosMensualesDuracion = listaMeses.map(mes => {
        const tecnicos = Object.values(promediosTecnicosDuracion[mes] || {});
        if (tecnicos.length === 0) return null;

        const suma = tecnicos.reduce((total, p) => total + p, 0);
        return Math.round(suma / tecnicos.length);
    });

    // NIVEL HISTÓRICO: Promedio final de los meses válidos
    const duracionValidos = promediosMensualesDuracion.filter(v => v !== null && v !== undefined);
    const duracionPromedio = duracionValidos.length > 0
        ? Math.round(duracionValidos.reduce((s, v) => s + v, 0) / duracionValidos.length)
        : 0;

    const total = completadas + noRealizadas;
    const efectividad = total > 0 ? (completadas / total) * 100 : 0;
    const horas = Math.floor(duracionPromedio / 60);
    const minutos = duracionPromedio % 60;
    const duracionFormateada = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

    const setDOM = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setDOM("totalOrdenes", total.toLocaleString("es-CL"));
    setDOM("completadas", completadas.toLocaleString("es-CL"));
    setDOM("noRealizadas", noRealizadas.toLocaleString("es-CL"));
    setDOM("pctCompletadas", total > 0 ? (completadas / total * 100).toFixed(1) + "%" : "0%");
    setDOM("efectividad", efectividad.toFixed(1) + "%");
    setDOM("rguTotal", rguPromedio.toFixed(1).replace(".", ","));
    setDOM("duracionPromedio", duracionFormateada);
}

// ==========================================
// TABLA
// ==========================================

function formatearHoraRedondeada(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "-";
    }

    const partes = String(valor).trim().split(":");

    if (partes.length >= 2) {
        const h = parseInt(partes[0].slice(-2), 10);
        const m = parseInt(partes[1], 10);

        if (!isNaN(h) && !isNaN(m)) {
            return (
                String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0")
            );
        }
    }

    return valor;
}


// Variable global para almacenar el límite actual (por defecto 50)
let limiteRegistros = 50;

// Función que se activa cuando cambias la opción en el selector HTML
function cambiarLimite(valor) {
    limiteRegistros = valor === 'todos' ? 'todos' : parseInt(valor);
    renderizarTabla();
}


// ==========================================
// GRÁFICOS
// ==========================================

function actualizarGraficos(data) {

    const datos =
        Array.isArray(data)
            ? data
            : [];


    // Mantener datos filtrados
    filteredData = datos;


    console.log(
        "📊 Actualizando gráficos históricos:",
        datos.length
    );


    // =====================================================
    // PRODUCCIÓN
    // =====================================================

    if (
        typeof crearGraficoProduccion ===
        "function"
    ) {

        crearGraficoProduccion(
            datos
        );

    }


    // =====================================================
    // RGU
    // =====================================================

    if (
        typeof crearGraficoRGU ===
        "function"
    ) {

        crearGraficoRGU(
            datos
        );

    }


    // =====================================================
    // DURACIÓN
    // =====================================================

    if (
        typeof crearGraficoDuracion ===
        "function"
    ) {

        crearGraficoDuracion(
            datos
        );

    }

}

// ==========================================
// PRODUCCIÓN
// ==========================================

function crearGraficoProduccion() {

    const agrupar = {};

    ordenMeses.forEach(mes => {

        agrupar[mes] = {
            completados: 0,
            noRealizadas: 0
        };
    });

    filteredData.forEach(item => {

        const fecha =
            obtenerFechaObjeto(item);

        if (!fecha) return;

        const mes =
            ordenMeses[
            fecha.getMonth()
            ];

        const estado =
            String(
                item.Estado ?? ""
            )
                .trim()
                .toLowerCase();


        if (estado === "completado") {

            agrupar[mes].completados++;
        }


        if (estado === "no realizada") {

            agrupar[mes].noRealizadas++;
        }
    });


    const porcentajes =
        ordenMeses.map(mes => {

            const total =
                agrupar[mes].completados +
                agrupar[mes].noRealizadas;


            return total > 0
                ? Number(
                    (
                        agrupar[mes].completados /
                        total *
                        100
                    ).toFixed(1)
                )
                : null;
        });


    const canvas =
        document.getElementById(
            "estadoChart"
        );

    if (!canvas) return;


    if (estadoChartInstance) {

        estadoChartInstance.destroy();
    }


    estadoChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: ordenMeses,

                    datasets: [{

                        label: "% Efectividad",

                        data: porcentajes,

                        borderColor: "#1d2a57",

                        backgroundColor: "#1d2a57",

                        borderWidth: 2.5,

                        tension: 0.2,

                        spanGaps: true,

                        pointRadius: 4,

                        pointBackgroundColor:
                            "#1d2a57",

                        pointBorderColor:
                            "#1d2a57",

                        datalabels: {

                            anchor:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "top"
                                        : "bottom",

                            align:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "end"
                                        : "start",

                            offset: 6,

                            color:
                                "#1d2a57",

                            font: {
                                size: 11,
                                weight: "bold",
                                family:
                                    "Segoe UI, sans-serif"
                            },

                            formatter:
                                value =>
                                    value !== null
                                        ? value
                                            .toString()
                                            .replace(
                                                ".",
                                                ","
                                            ) + "%"
                                        : ""
                        }
                    }]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    layout: {
                        padding: {
                            top: 25,
                            bottom: 5,
                            left: 10,
                            right: 10
                        }
                    },

                    scales: {

                        x: {
                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {
                                color: "#1e293b",
                                padding: 8,

                                font: {
                                    size: 12,
                                    weight: "600",
                                    family:
                                        "Segoe UI, sans-serif"
                                }
                            }
                        },

                        y: {
                            display: false,
                            beginAtZero: true,
                            grace: "20%"
                        }
                    }
                }
            }
        );
}

// ==========================================
// GRÁFICO PROMEDIO GENERAL HISTÓRICO RGU
// 1. Limpieza de Técnico como SQL
// 2. Promedio de SUM(RGU) por Origen
// 3. Promedio de resultados por Técnico
// 4. Filtro Estado:
//      - Completado
//      - No Realizada
// ==========================================

function crearGraficoRGU() {

    // ==========================================
    // VALIDACIONES
    // ==========================================

    if (!Array.isArray(ordenMeses)) {
        console.error(
            "Error: ordenMeses no existe o no es un arreglo."
        );
        return;
    }

    if (!Array.isArray(filteredData)) {
        console.error(
            "Error: filteredData no existe o no es un arreglo."
        );
        return;
    }

    if (typeof Chart === "undefined") {
        console.error(
            "Error: Chart.js no está cargado."
        );
        return;
    }

    // ==========================================
    // ESTRUCTURA DE AGRUPACIÓN
    //
    // agrupacion[mes][tecnico][origen] = {
    //     suma: número,
    //     cantidadValores: número
    // }
    // ==========================================

    const agrupacion = {};
    const aniosDetectados = [
        ...new Set(
            filteredData
                .map(item => obtenerFechaOrigen(item))
                .filter(fecha => fecha !== null)
                .map(fecha => fecha.getFullYear())
        )
    ].sort();


    ordenMeses.forEach(mes => {
        agrupacion[mes] = {};
    });

    // ==========================================
    // NORMALIZAR ESTADO
    // ==========================================

    function normalizarEstado(valor) {

        return String(valor ?? "")
            .trim()
            .toLocaleLowerCase("es-CL")
            .replace(/\s+/g, " ");
    }

    // ==========================================
    // LIMPIAR TÉCNICO COMO EN EL SQL
    //
    // Orden:
    //
    // 1. Texto posterior a _ZENER_
    // 2. Texto posterior a _ZENE_
    // 3. Elimina ZENER_ al inicio
    // 4. Elimina ZENE_ al inicio
    // 5. Conserva el texto si no hay coincidencia
    //
    // Ejemplos:
    //
    // FS_MM_NFTT_ZENE_OSCAR VILLALOBOS M
    // -> OSCAR VILLALOBOS M
    //
    // NFTT_ZENE_Juan Bolados
    // -> Juan Bolados
    //
    // ZENE_Ricardo Vergara M
    // -> Ricardo Vergara M
    //
    // FS_MM_ZENER_Juan Perez
    // -> Juan Perez
    // ==========================================

    function obtenerTecnicoLimpio(item) {

        if (
            item.Tecnico === null ||
            item.Tecnico === undefined
        ) {
            return null;
        }

        const tecnicoOriginal =
            String(item.Tecnico).trim();

        if (!tecnicoOriginal) {
            return null;
        }

        const tecnicoMayuscula =
            tecnicoOriginal.toLocaleUpperCase(
                "es-CL"
            );

        let tecnicoLimpio =
            tecnicoOriginal;

        // --------------------------------------
        // CASO 1: _ZENER_
        // --------------------------------------

        const posicionZenerInterno =
            tecnicoMayuscula.indexOf(
                "_ZENER_"
            );

        if (posicionZenerInterno !== -1) {

            tecnicoLimpio =
                tecnicoOriginal.slice(
                    posicionZenerInterno +
                    "_ZENER_".length
                );

        } else {

            // ----------------------------------
            // CASO 2: _ZENE_
            // ----------------------------------

            const posicionZeneInterno =
                tecnicoMayuscula.indexOf(
                    "_ZENE_"
                );

            if (posicionZeneInterno !== -1) {

                tecnicoLimpio =
                    tecnicoOriginal.slice(
                        posicionZeneInterno +
                        "_ZENE_".length
                    );

            } else if (
                tecnicoMayuscula.startsWith(
                    "ZENER_"
                )
            ) {

                // ------------------------------
                // CASO 3: ZENER_ AL INICIO
                // ------------------------------

                tecnicoLimpio =
                    tecnicoOriginal.slice(
                        "ZENER_".length
                    );

            } else if (
                tecnicoMayuscula.startsWith(
                    "ZENE_"
                )
            ) {

                // ------------------------------
                // CASO 4: ZENE_ AL INICIO
                // ------------------------------

                tecnicoLimpio =
                    tecnicoOriginal.slice(
                        "ZENE_".length
                    );
            }
        }

        // --------------------------------------
        // EQUIVALENTE A TRIM DEL SQL
        // --------------------------------------

        tecnicoLimpio =
            tecnicoLimpio
                .trim()
                .replace(/\s+/g, " ");

        return tecnicoLimpio || null;
    }

    // ==========================================
    // CREAR CLAVE NORMALIZADA DEL TÉCNICO
    //
    // Evita que:
    //
    // "Juan Bolados"
    // "JUAN BOLADOS"
    // "juan bolados"
    //
    // sean tratados como técnicos diferentes.
    // ==========================================

    function crearClaveTecnico(nombre) {

        return String(nombre)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleUpperCase("es-CL")
            .replace(/\s+/g, " ")
            .trim();
    }

    // ==========================================
    // CONVERTIR RGU A NÚMERO
    // ==========================================

    function convertirRGU(valor) {

        if (
            valor === null ||
            valor === undefined
        ) {
            return null;
        }

        if (
            typeof valor === "string" &&
            valor.trim() === ""
        ) {
            return null;
        }

        if (typeof valor === "number") {

            return Number.isFinite(valor)
                ? valor
                : null;
        }

        let texto =
            String(valor)
                .trim()
                .replace(/\s/g, "");

        /*
         * Formato chileno:
         *
         * 1.234,56 -> 1234.56
         */
        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {
            texto = texto
                .replace(/\./g, "")
                .replace(",", ".");
        } else if (texto.includes(",")) {

            /*
             * 3,25 -> 3.25
             */
            texto =
                texto.replace(",", ".");
        }

        const numero =
            Number(texto);

        return Number.isFinite(numero)
            ? numero
            : null;
    }

    // ==========================================
    // VALIDAR FECHA
    // ==========================================

    function crearFechaValidada(
        anio,
        mes,
        dia
    ) {

        const fecha =
            new Date(anio, mes, dia);

        if (
            fecha.getFullYear() !== anio ||
            fecha.getMonth() !== mes ||
            fecha.getDate() !== dia
        ) {
            return null;
        }

        return fecha;
    }

    // ==========================================
    // CONVERTIR FECHA SIN PROBLEMAS UTC
    // ==========================================

    function convertirFechaLocal(valor) {
        // 1. Control de nulos y vacíos
        if (valor === null || valor === undefined || String(valor).trim() === "") {
            return null;
        }

        // 2. Si ya es un objeto Date
        if (valor instanceof Date) {
            if (Number.isNaN(valor.getTime())) return null;
            return crearFechaValidada(
                valor.getFullYear(),
                valor.getMonth(),
                valor.getDate()
            );
        }

        const texto = String(valor).trim();

        // 3. Formato YYYY-MM-DD / YYYY/MM/DD / ISO (ej: 2026-08-24T15:30:00)
        let coincidencia = texto.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        if (coincidencia) {
            return crearFechaValidada(
                Number(coincidencia[1]),
                Number(coincidencia[2]) - 1,
                Number(coincidencia[3])
            );
        }

        // 4. Formato DD/MM/YYYY / DD-MM-YYYY / DD.MM.YYYY
        coincidencia = texto.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
        if (coincidencia) {
            return crearFechaValidada(
                Number(coincidencia[3]), // Año
                Number(coincidencia[2]) - 1, // Mes (0-11)
                Number(coincidencia[1]) // Día
            );
        }

        // 5. Formato compacto sin separadores YYYYMMDD (ej: 20260824)
        coincidencia = texto.match(/^(\d{4})(\d{2})(\d{2})$/);
        if (coincidencia) {
            return crearFechaValidada(
                Number(coincidencia[1]),
                Number(coincidencia[2]) - 1,
                Number(coincidencia[3])
            );
        }

        // 6. Timestamps numéricos o Números de Serie de Excel
        if (/^\d+(\.\d+)?$/.test(texto)) {
            let numero = Number(texto);

            // Soporte para fechas de Excel (ej: 45123)
            if (numero >= 25569 && numero < 100000) {
                const fechaExcel = new Date((numero - 25569) * 86400000);
                return crearFechaValidada(
                    fechaExcel.getUTCFullYear(),
                    fechaExcel.getUTCMonth(),
                    fechaExcel.getUTCDate()
                );
            }

            // Timestamp Unix en segundos (10 dígitos)
            if (texto.length === 10) {
                numero *= 1000;
            }

            const fechaTimestamp = new Date(numero);
            if (!Number.isNaN(fechaTimestamp.getTime())) {
                return crearFechaValidada(
                    fechaTimestamp.getFullYear(),
                    fechaTimestamp.getMonth(),
                    fechaTimestamp.getDate()
                );
            }
        }

        // 7. Último intento: Parseo nativo de JS (ej: "Aug 24, 2026")
        const fechaNativa = new Date(texto);
        if (Number.isNaN(fechaNativa.getTime())) {
            return null;
        }

        return crearFechaValidada(
            fechaNativa.getFullYear(),
            fechaNativa.getMonth(),
            fechaNativa.getDate()
        );
    }

    // ==========================================
    // OBTENER FECHA DE ORIGEN
    //
    // Se prioriza item.Origen.
    // Si no existe, se usa obtenerFechaObjeto().
    // ==========================================

    function obtenerFechaOrigen(item) {

        const fechaDesdeOrigen =
            convertirFechaLocal(item.Origen);

        if (fechaDesdeOrigen) {
            return fechaDesdeOrigen;
        }

        if (
            typeof obtenerFechaObjeto ===
            "function"
        ) {
            const fechaRespaldo =
                obtenerFechaObjeto(item);

            if (
                fechaRespaldo instanceof Date &&
                !Number.isNaN(
                    fechaRespaldo.getTime()
                )
            ) {
                return crearFechaValidada(
                    fechaRespaldo.getFullYear(),
                    fechaRespaldo.getMonth(),
                    fechaRespaldo.getDate()
                );
            }
        }

        return null;
    }

    // ==========================================
    // CREAR CLAVE DE ORIGEN YYYY-MM-DD
    // ==========================================

    function crearClaveOrigen(fecha) {

        return [
            fecha.getFullYear(),

            String(
                fecha.getMonth() + 1
            ).padStart(2, "0"),

            String(
                fecha.getDate()
            ).padStart(2, "0")
        ].join("-");
    }

    // ==========================================
    // DIAGNÓSTICO
    // ==========================================

    const diagnostico = {
        registrosTotales:
            filteredData.length,

        estadoExcluido:
            0,

        sinTecnico:
            0,

        sinOrigen:
            0,

        sinRGU:
            0,

        incluidos:
            0
    };

    const transformacionesTecnicos =
        new Map();

    // ==========================================
    // RECORRER DATOS
    // ==========================================

    filteredData.forEach(item => {

        // --------------------------------------
        // FILTRAR ESTADO
        // --------------------------------------

        const estado =
            normalizarEstado(item.Estado);

        if (
            estado !== "completado" &&
            estado !== "no realizada"
        ) {
            diagnostico.estadoExcluido++;
            return;
        }

        // --------------------------------------
        // OBTENER NOMBRE LIMPIO
        // --------------------------------------

        const tecnicoLimpio =
            obtenerTecnicoLimpio(item);

        if (!tecnicoLimpio) {
            diagnostico.sinTecnico++;
            return;
        }

        /*
         * Se utiliza una clave normalizada para
         * evitar diferencias por mayúsculas,
         * minúsculas o tildes.
         */
        const claveTecnico =
            crearClaveTecnico(
                tecnicoLimpio
            );

        if (!claveTecnico) {
            diagnostico.sinTecnico++;
            return;
        }

        const tecnicoOriginal =
            String(
                item.Tecnico ?? ""
            ).trim();

        if (
            tecnicoOriginal &&
            tecnicoOriginal !== tecnicoLimpio
        ) {
            const claveTransformacion =
                `${tecnicoOriginal}|||${tecnicoLimpio}`;

            transformacionesTecnicos.set(
                claveTransformacion,
                {
                    Original:
                        tecnicoOriginal,

                    NombreLimpio:
                        tecnicoLimpio
                }
            );
        }

        // --------------------------------------
        // OBTENER ORIGEN
        // --------------------------------------

        const fechaOrigen =
            obtenerFechaOrigen(item);

        if (!fechaOrigen) {
            diagnostico.sinOrigen++;
            return;
        }

        // --------------------------------------
        // MES DESDE ORIGEN
        // --------------------------------------

        const indiceMes =
            fechaOrigen.getMonth();

        const mes =
            ordenMeses[indiceMes];

        if (
            !mes ||
            !Object.prototype.hasOwnProperty.call(
                agrupacion,
                mes
            )
        ) {
            diagnostico.sinOrigen++;
            return;
        }

        // --------------------------------------
        // CLAVE DEL ORIGEN
        // --------------------------------------

        const origen =
            crearClaveOrigen(
                fechaOrigen
            );

        // --------------------------------------
        // CONVERTIR RGU
        // --------------------------------------

        const rgu =
            convertirRGU(item.RGU);

        // --------------------------------------
        // CREAR TÉCNICO
        // --------------------------------------

        if (!agrupacion[mes][claveTecnico]) {

            agrupacion[mes][claveTecnico] = {
                nombre:
                    tecnicoLimpio,

                origenes:
                    {}
            };
        }

        const tecnicoMes =
            agrupacion[mes][claveTecnico];

        // --------------------------------------
        // CREAR ORIGEN
        // --------------------------------------

        if (
            !tecnicoMes.origenes[origen]
        ) {
            tecnicoMes.origenes[origen] = {
                suma: 0,
                cantidadValores: 0
            };
        }

        // --------------------------------------
        // RGU VACÍO
        // --------------------------------------

        if (rgu === null) {
            diagnostico.sinRGU++;
            return;
        }

        // --------------------------------------
        // CALCULATE(SUM(RGU))
        // --------------------------------------

        tecnicoMes.origenes[origen].suma +=
            rgu;

        tecnicoMes.origenes[origen]
            .cantidadValores++;

        diagnostico.incluidos++;
    });


    // ==========================================
    // CALCULAR PROMEDIOS
    // ==========================================

    const detalleCalculo = {};

    const promediosSinRedondear = [];

    const promedios =
        ordenMeses.map(mes => {

            detalleCalculo[mes] = [];

            const agrupacionMes =
                agrupacion[mes] ?? {};

            const tecnicos =
                Object.values(
                    agrupacionMes
                );

            const promediosTecnicos = [];

            // ==================================
            // PROMEDIO POR CADA TÉCNICO
            // ==================================

            tecnicos.forEach(grupoTecnico => {

                const tecnico =
                    grupoTecnico.nombre;

                const origenesTecnico =
                    grupoTecnico.origenes;

                const origenes =
                    Object.keys(
                        origenesTecnico
                    );

                if (!origenes.length) {
                    return;
                }

                const sumasPorOrigen = [];

                origenes.forEach(origen => {

                    const grupoOrigen =
                        origenesTecnico[origen];

                    /*
                     * Si el origen sólo contiene
                     * valores vacíos, se excluye.
                     */
                    if (
                        grupoOrigen
                            .cantidadValores > 0
                    ) {
                        sumasPorOrigen.push(
                            grupoOrigen.suma
                        );
                    }
                });

                if (!sumasPorOrigen.length) {
                    return;
                }

                // ==============================
                // PROMEDIO RGU POR ORIGEN
                //
                // AVERAGEX(
                //     VALUES(Origen),
                //     SUM(RGU)
                // )
                // ==============================

                const sumaRGUTecnico =
                    sumasPorOrigen.reduce(
                        (acumulado, valor) => {
                            return acumulado + valor;
                        },
                        0
                    );

                const promedioTecnico =
                    sumaRGUTecnico /
                    sumasPorOrigen.length;

                if (
                    !Number.isFinite(
                        promedioTecnico
                    )
                ) {
                    return;
                }

                /*
                 * No se redondea todavía.
                 */
                promediosTecnicos.push(
                    promedioTecnico
                );

                detalleCalculo[mes].push({
                    tecnico,
                    cantidadOrigenes:
                        sumasPorOrigen.length,
                    sumaRGU:
                        sumaRGUTecnico,
                    promedioTecnico
                });
            });

            // ==================================
            // MES SIN RESULTADOS
            // ==================================

            if (!promediosTecnicos.length) {
                promediosSinRedondear.push(
                    null
                );
                return null;
            }

            // ==================================
            // PROMEDIO GENERAL DEL MES
            //
            // Promedio de promedios técnicos
            // ==================================

            const sumaPromediosTecnicos =
                promediosTecnicos.reduce(
                    (acumulado, valor) => {
                        return acumulado + valor;
                    },
                    0
                );

            const promedioGeneral =
                sumaPromediosTecnicos /
                promediosTecnicos.length;

            promediosSinRedondear.push(
                promedioGeneral
            );

            return Number(
                promedioGeneral
            );
        });

    // ==========================================
    // META
    // ==========================================

    const meta =
        ordenMeses.map(() => 3);

    // ==========================================
    // OBTENER CANVAS
    // ==========================================

    const canvas =
        document.getElementById(
            "actividadChart"
        );

    if (!canvas) {
        console.warn(
            "No se encontró el canvas #actividadChart."
        );
        return;
    }

    // ==========================================
    // DESTRUIR GRÁFICO ANTERIOR
    // ==========================================

    if (actividadChartInstance) {
        actividadChartInstance.destroy();
        actividadChartInstance = null;
    }

    // ==========================================
    // CREAR GRÁFICO
    // ==========================================

    actividadChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {
                type:
                    "line",

                data: {
                    labels:
                        ordenMeses,

                    datasets: [

                        // ==========================
                        // PROMEDIO GENERAL
                        // ==========================

                        {
                            label:
                                "Promedio General",

                            data:
                                promedios,

                            borderColor:
                                "#172554",

                            backgroundColor:
                                "#172554",

                            borderWidth:
                                2,

                            tension:
                                0,

                            spanGaps:
                                true,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                5,

                            pointBackgroundColor:
                                "#172554",

                            pointBorderColor:
                                "#172554",

                            datalabels: {

                                display:
                                    contexto => {

                                        const valor =
                                            contexto
                                                .dataset
                                                .data[
                                            contexto
                                                .dataIndex
                                            ];

                                        return (
                                            valor !== null &&
                                            valor !== undefined
                                        );
                                    },

                                anchor:
                                    "start",

                                align:
                                    "top",

                                offset:
                                    4,

                                color:
                                    "#172554",

                                font: {
                                    weight:
                                        "bold",

                                    size:
                                        11,

                                    family:
                                        "Segoe UI, sans-serif"
                                },

                                formatter:
                                    value => {

                                        if (
                                            value === null ||
                                            value === undefined
                                        ) {
                                            return "";
                                        }

                                        return (
                                            value
                                                .toFixed(1)
                                                .replace(".", ",")
                                        );
                                    }
                            }
                        },

                        // ==========================
                        // META
                        // ==========================

                        {
                            label:
                                "Meta",

                            data:
                                meta,

                            borderColor:
                                "#facc15",

                            backgroundColor:
                                "#facc15",

                            borderWidth:
                                1.5,

                            tension:
                                0,

                            spanGaps:
                                true,

                            pointRadius:
                                2.5,

                            pointHoverRadius:
                                4,

                            pointBackgroundColor:
                                "#facc15",

                            pointBorderColor:
                                "#facc15",

                            datalabels: {
                                display:
                                    false
                            }
                        }
                    ]
                },

                options: {
                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {
                        mode:
                            "index",

                        intersect:
                            false
                    },

                    plugins: {

                        // ==========================
                        // LEYENDA
                        // ==========================

                        legend: {
                            display:
                                false
                        },

                        // ==========================
                        // TOOLTIP
                        // ==========================

                        tooltip: {
                            callbacks: {

                                title:
                                    elementos => {

                                        if (
                                            !elementos ||
                                            !elementos.length
                                        ) {
                                            return "";
                                        }

                                        return elementos[0]
                                            .label;
                                    },

                                label:
                                    contexto => {

                                        const etiqueta =
                                            contexto
                                                .dataset
                                                .label ?? "";

                                        const valor =
                                            contexto.parsed.y;

                                        if (
                                            valor === null ||
                                            valor === undefined
                                        ) {
                                            return (
                                                `${etiqueta}: ` +
                                                "sin datos"
                                            );
                                        }

                                        return (
                                            `${etiqueta}: ` +
                                            Number(valor)
                                                .toFixed(2)
                                                .replace(
                                                    ".",
                                                    ","
                                                )
                                        );
                                    }
                            }
                        }
                    },

                    scales: {

                        // ==========================
                        // EJE X
                        // ==========================

                        x: {
                            grid: {
                                display:
                                    false
                            },

                            border: {
                                display:
                                    false
                            },

                            ticks: {
                                color:
                                    "#1e293b",

                                padding:
                                    8,

                                font: {
                                    size:
                                        12,

                                    weight:
                                        "600",

                                    family:
                                        "Segoe UI, sans-serif"
                                }
                            }
                        },

                        // ==========================
                        // EJE Y
                        // ==========================

                        y: {
                            display:
                                false,

                            beginAtZero:
                                true,

                            grace:
                                "20%"
                        }
                    }
                }
            }
        );
}

// ==========================================
// DURACIÓN PROMEDIO
// ==========================================

function crearGraficoDuracion() {

    // ==========================================
    // NIVEL 1
    // Promedio diario por técnico
    // ==========================================

    const datosDiarios = {};

    filteredData.forEach(item => {

        const fecha = obtenerFechaObjeto(item);

        if (!fecha) return;


        const mes =
            ordenMeses[fecha.getMonth()];


        const estado =
            String(item.Estado ?? "")
                .trim()
                .toLowerCase();


        // Solo completadas
        if (estado !== "completado") {
            return;
        }


        const tecnico =
            item.Tecnico === null ||
                item.Tecnico === undefined
                ? "__TECNICO_NULL__"
                : String(item.Tecnico);


        if (!tecnico) {
            return;
        }


        // ==========================================
        // IMPORTANTE:
        // Usamos fecha LOCAL, NO toISOString()
        // ==========================================

        const dia =
            fecha.getFullYear() +
            "-" +
            String(
                fecha.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                fecha.getDate()
            ).padStart(2, "0");


        const inicio =
            item.Inicio ??
            item.Hora_Inicio;


        const fin =
            item.Fin ??
            item.Hora_Fin;


        let diferencia =
            calcularDiferenciaMinutos(
                inicio,
                fin
            );


        // ==========================================
        // MISMA LÓGICA DEL SQL
        // ==========================================

        if (
            diferencia === null ||
            diferencia < 0
        ) {
            diferencia = 0;
        }


        // ==========================================
        // MES
        //   └── TÉCNICO
        //         └── DÍA
        // ==========================================

        if (!datosDiarios[mes]) {

            datosDiarios[mes] = {};
        }


        if (!datosDiarios[mes][tecnico]) {

            datosDiarios[mes][tecnico] = {};
        }


        if (!datosDiarios[mes][tecnico][dia]) {

            datosDiarios[mes][tecnico][dia] = {
                suma: 0,
                cantidad: 0
            };
        }


        datosDiarios[mes][tecnico][dia].suma +=
            diferencia;


        datosDiarios[mes][tecnico][dia].cantidad++;
    });


    // ==========================================
    // NIVEL 2
    // Promedio mensual de cada técnico
    // a partir de sus promedios diarios
    // ==========================================

    const promediosTecnicos = {};


    ordenMeses.forEach(mes => {

        promediosTecnicos[mes] = {};


        if (!datosDiarios[mes]) {
            return;
        }


        Object.keys(
            datosDiarios[mes]
        ).forEach(tecnico => {

            const dias =
                datosDiarios[mes][tecnico];


            const promediosDiarios =
                Object.values(dias).map(dia => {

                    return dia.cantidad > 0
                        ? dia.suma / dia.cantidad
                        : 0;
                });


            if (
                promediosDiarios.length === 0
            ) {
                return;
            }


            const sumaPromedios =
                promediosDiarios.reduce(
                    (suma, promedio) =>
                        suma + promedio,
                    0
                );


            promediosTecnicos[mes][tecnico] =
                sumaPromedios /
                promediosDiarios.length;
        });
    });


    // ==========================================
    // NIVEL 3
    // Promedio de los técnicos del mes
    // ==========================================

    const promedios =
        ordenMeses.map(mes => {

            const tecnicos =
                Object.values(
                    promediosTecnicos[mes] || {}
                );


            if (tecnicos.length === 0) {
                return null;
            }


            const suma =
                tecnicos.reduce(
                    (total, promedio) =>
                        total + promedio,
                    0
                );


            return Math.round(
                suma / tecnicos.length
            );
        });


    // ==========================================
    // DEBUG
    // ==========================================

    console.log(
        "📊 PROMEDIOS DURACIÓN:",
        ordenMeses.map(
            (mes, index) => ({
                mes: mes,
                minutos: promedios[index],
                hhmm:
                    promedios[index] !== null
                        ? convertirMinutosHHMM(
                            promedios[index]
                        )
                        : null
            })
        )
    );


    // ==========================================
    // CANVAS
    // ==========================================

    const canvas =
        document.getElementById(
            "duracionChart"
        );

    if (!canvas) return;


    if (duracionChartInstance) {
        duracionChartInstance.destroy();
    }


    // ==========================================
    // GRÁFICO
    // ==========================================

    duracionChartInstance =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: ordenMeses,

                    datasets: [{

                        label:
                            "Minutos Promedio",

                        data:
                            promedios,

                        borderColor:
                            "#1d2a57",

                        backgroundColor:
                            "#1d2a57",

                        borderWidth:
                            2.5,

                        tension:
                            0,

                        spanGaps:
                            true,

                        pointRadius:
                            3,

                        datalabels: {

                            anchor:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "top"
                                        : "bottom",

                            align:
                                context =>
                                    context.dataIndex % 2 === 0
                                        ? "end"
                                        : "start",

                            offset:
                                4,

                            color:
                                "#172554",

                            font: {

                                weight:
                                    "bold",

                                size:
                                    10,

                                family:
                                    "Segoe UI, sans-serif"
                            },

                            formatter:
                                value => {

                                    if (
                                        value === null ||
                                        value === undefined
                                    ) {
                                        return "";
                                    }


                                    return convertirMinutosHHMM(
                                        value
                                    );
                                }
                        }
                    }]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display:
                                false
                        }
                    },

                    layout: {

                        padding: {

                            top:
                                25,

                            bottom:
                                5,

                            left:
                                10,

                            right:
                                10
                        }
                    },

                    scales: {

                        x: {

                            grid: {
                                display:
                                    false
                            },

                            border: {
                                display:
                                    false
                            },

                            ticks: {

                                color:
                                    "#1e293b",

                                padding:
                                    8,

                                font: {

                                    size:
                                        12,

                                    weight:
                                        "600",

                                    family:
                                        "Segoe UI, sans-serif"
                                }
                            }
                        },

                        y: {

                            display:
                                false,

                            beginAtZero:
                                true,

                            grace:
                                "20%"
                        }
                    }
                }
            }
        );
}

// ==========================================
// CONVERTIR MINUTOS A HH:MM
// ==========================================

function convertirMinutosHHMM(minutos) {

    const minutosRedondeados =
        Math.round(minutos);

    const horas =
        Math.floor(
            minutosRedondeados / 60
        );

    const minutosRestantes =
        minutosRedondeados % 60;

    return (
        String(horas).padStart(2, "0") +
        ":" +
        String(minutosRestantes).padStart(2, "0")
    );
}

// ==========================================
// CAMBIO DE VISTA
// ==========================================

function actualizarVistaAltas() {

    // 1. Usar los datos globales ya filtrados por los multiselects (Actividad, Zona, etc.)
    const datosFiltrados = filteredData;

    // 2. Obtener el rango de fechas activo para la vista altas
    const rango = obtenerRangoAltasActivo();

    // 3. Filtrar los datos específicamente por ese rango de fechas
    const datosVistaAltas = obtenerDatosEnRango(
        datosFiltrados,
        rango.inicio,
        rango.fin
    );

    console.log("🟣 ALTAS:", datosVistaAltas.length);

    // 4. Enviar la data completamente filtrada a los KPIs y gráficos
    actualizarKPIsAltas(datosVistaAltas, rango);

    // Es buena práctica verificar que las funciones existan antes de llamarlas
    if (typeof crearGraficoHoyProduccionAltas === "function") {
        crearGraficoHoyProduccionAltas(datosVistaAltas, rango);
    }
    if (typeof crearGraficoHoyRGUAltas === "function") {
        crearGraficoHoyRGUAltas(datosVistaAltas, rango);
    }
    if (typeof crearGraficoHoyDuracionAltas === "function") {
        crearGraficoHoyDuracionAltas(datosVistaAltas, rango);
    }
}

function cambiarVista(vista, btnElement) {

    vistaActual = vista;

    // =====================================================
    // BOTÓN ACTIVO
    // =====================================================

    document
        .querySelectorAll(".tab-btn")
        .forEach(btn => {
            btn.classList.remove("active");
        });

    if (btnElement) {
        btnElement.classList.add("active");
    }


    // =====================================================
    // OCULTAR TODAS LAS VISTAS
    // =====================================================

    document
        .querySelectorAll(".tab-view")
        .forEach(view => {
            view.classList.add("hidden");
        });


    // =====================================================
    // VISTA HOY
    // =====================================================

    if (vista === "hoy") {

        document
            .getElementById("viewHoy")
            ?.classList.remove("hidden");

        actualizarVistaHoy();

    }


    // =====================================================
    // VISTA ALTAS
    // =====================================================

    else if (vista === "altas") {

        document
            .getElementById("viewAltas")
            ?.classList.remove("hidden");

        actualizarVistaAltas();

    }


    // =====================================================
    // VISTA HISTÓRICO
    // =====================================================

    else if (vista === "historico") {

        document
            .getElementById("viewHistorico")
            ?.classList.remove("hidden");


        // =================================================
        // OBTENER DATOS NUEVAMENTE
        // =================================================

        const datosHistoricos =
            obtenerDatosFiltrados();


        console.log(
            "🟢 HISTÓRICO:",
            datosHistoricos.length
        );


        // IMPORTANTE:
        // Actualizamos filteredData con TODOS
        // los datos filtrados.
        filteredData =
            datosHistoricos;


        // =================================================
        // KPI HISTÓRICO
        // =================================================

        actualizarKPIsHistorico(
            datosHistoricos
        );


        // =================================================
        // GRÁFICOS HISTÓRICOS
        // =================================================

        actualizarGraficos(
            datosHistoricos
        );

    }

}
// ==========================================
// RANGO ACTIVO DE LA VISTA HOY
// Si el usuario eligió Desde/Hasta se usa ese
// rango; si no, por defecto son los últimos
// 30 días terminando hoy.
// ==========================================



// ==========================================
// CÁLCULO GENÉRICO DE RANGO ACTIVO
// ==========================================
function calcularRangoActivo(seleccion) {

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (seleccion && seleccion.desde && seleccion.hasta) {

        let inicio = new Date(seleccion.desde);
        inicio.setHours(0, 0, 0, 0);

        let fin = new Date(seleccion.hasta);
        fin.setHours(0, 0, 0, 0);

        if (inicio > fin) {
            [inicio, fin] = [fin, inicio];
        }

        const cantidadDias =
            Math.round((fin - inicio) / 86400000) + 1;

        return { inicio, fin, cantidadDias };
    }

    // Por defecto: últimos 30 días terminando hoy
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - 29);

    return { inicio, fin: hoy, cantidadDias: 30 };
}

function obtenerRangoHoyActivo() {
    return calcularRangoActivo(rangoFechasHoy);
}

function obtenerRangoAltasActivo() {
    return calcularRangoActivo(rangoFechasAltas);
}


function obtenerDatosEnRango(datos, fechaInicio, fechaFin) {
    // Si no hay fechas definidas, devolvemos todos los datos
    if (!fechaInicio || !fechaFin) return datos;

    // Convertimos los inputs a objetos Date
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Ajustamos el final para que incluya hasta el último minuto de ese día (opcional pero recomendado)
    fin.setHours(23, 59, 59, 999);

    return datos.filter(item => {
        // Usamos el mismo parser que el resto de la app (hora local),
        // en vez de new Date(item.Fecha), que interpreta strings
        // "YYYY-MM-DD" como UTC y desfasa el primer día del rango.
        const fechaItem = obtenerFechaObjeto(item);

        if (!fechaItem) return false;

        // Comparamos
        return fechaItem >= inicio && fechaItem <= fin;
    });
}

function actualizarVistaHoy() {

    if (!rawData || rawData.length === 0) {
        return;
    }

    // Respetar filtros actuales
    const datosFiltrados = filteredData;

    console.log(
        "🔴 Datos filtrados:",
        datosFiltrados.length
    );

    // Rango activo: personalizado (Desde/Hasta) o últimos 30 días
    const rango = obtenerRangoHoyActivo();

    datosVistaHoy =
        obtenerDatosEnRango(
            datosFiltrados,
            rango.inicio,
            rango.fin
        );

    console.log(
        `🔵 Datos en rango (${rango.cantidadDias} días):`,
        datosVistaHoy.length
    );


    // =====================================================
    // KPI DE HOY
    // =====================================================

    actualizarKPIsHoy(
        datosVistaHoy,
        rango
    );


    // =====================================================
    // GRÁFICOS DE HOY
    // =====================================================

    crearGraficoHoyProduccion(
        datosVistaHoy,
        rango
    );

    crearGraficoHoyRGU(
        datosVistaHoy,
        rango
    );

    crearGraficoHoyDuracion(
        datosVistaHoy,
        rango
    );
}

function obtenerDatosFiltrados() {
    const totalActividad = document.querySelectorAll("#multiselectActividad .multiselect-options input").length;
    const totalCiudad = document.querySelectorAll("#multiselectCiudad .multiselect-options input").length;
    const totalZona = document.querySelectorAll("#multiselectZona .multiselect-options input").length;
    const totalTecnico = document.querySelectorAll("#multiselectTecnico .multiselect-options input").length;
    const totalSupervisor = document.querySelectorAll("#multiselectSupervisor .multiselect-options input").length;

    const resultado = rawData.filter(item => {
        const itemActividad = String(item.Tipo_de_Actividad ?? "").trim();
        const itemCiudad = String(item.Ciudad ?? "").trim();
        const itemZona = String(item.Zona_de_trabajo ?? "").trim();
        const itemTecnico = String(item.Tecnico ?? "").trim();
        const itemSupervisor = String(item.Supervisor ?? "").trim();

        const cumpleActividad =
            totalActividad === 0 ||
            filtroSelecciones.actividad.length === 0 ||
            filtroSelecciones.actividad.length === totalActividad ||
            filtroSelecciones.actividad.includes(itemActividad);

        const cumpleCiudad =
            totalCiudad === 0 ||
            filtroSelecciones.ciudad.length === 0 ||
            filtroSelecciones.ciudad.length === totalCiudad ||
            filtroSelecciones.ciudad.includes(itemCiudad);

        const cumpleZona =
            totalZona === 0 ||
            filtroSelecciones.zona.length === 0 ||
            filtroSelecciones.zona.length === totalZona ||
            filtroSelecciones.zona.includes(itemZona);

        const cumpleTecnico =
            totalTecnico === 0 ||
            filtroSelecciones.tecnico.length === 0 ||
            filtroSelecciones.tecnico.length === totalTecnico ||
            filtroSelecciones.tecnico.includes(itemTecnico);

        const cumpleSupervisor =
            totalSupervisor === 0 ||
            filtroSelecciones.supervisor.length === 0 ||
            filtroSelecciones.supervisor.length === totalSupervisor ||
            filtroSelecciones.supervisor.includes(itemSupervisor);

        return (
            cumpleActividad &&
            cumpleCiudad &&
            cumpleZona &&
            cumpleTecnico &&
            cumpleSupervisor
        );
    });

    return resultado;
}

// ==========================================
// VISTA HOY
// ==========================================

function cargarGraficosHoy() {

    if (!rawData || rawData.length === 0) {
        console.log("No hay datos disponibles");
        return;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    // ==========================================
    // ÚLTIMOS 7 DÍAS
    // ==========================================

    const dias = [];

    for (let i = 29; i >= 0; i--) {

        const fecha = new Date(hoy);

        fecha.setDate(hoy.getDate() - i);

        dias.push(fecha);
    }

    // ==========================================
    // AGRUPAR DATOS POR DÍA
    // ==========================================

    const datosPorDia = {};

    dias.forEach(fecha => {

        const key = obtenerClaveFecha(fecha);

        datosPorDia[key] = [];

    });

    rawData.forEach(item => {

        const fecha = obtenerFechaObjeto(item);

        if (!fecha) return;

        const fechaNormalizada = new Date(fecha);

        fechaNormalizada.setHours(0, 0, 0, 0);

        const key = obtenerClaveFecha(fechaNormalizada);

        if (datosPorDia[key]) {

            datosPorDia[key].push(item);

        }

    });

    // ==========================================
    // DATOS DE HOY PARA LOS KPIs
    // ==========================================

    const keyHoy = obtenerClaveFecha(hoy);

    datosVistaHoy = datosPorDia[keyHoy] || [];

    console.log("Datos de hoy:", datosVistaHoy.length);

    console.log("Datos por día:", datosPorDia);

    // ==========================================
    // ACTUALIZAR KPIs DE HOY
    // ==========================================

    actualizarKPIs(datosVistaHoy);

    // ==========================================
    // CREAR GRÁFICOS
    // ==========================================

    crearGraficoHoyEfectividad(
        dias,
        datosPorDia
    );

    crearGraficoHoyRGU(
        dias,
        datosPorDia
    );

    crearGraficoHoyDuracion(
        dias,
        datosPorDia
    );
}

function actualizarKPIsConDatos(data) {

    const total = data.length;

    let completadas = 0;
    let noRealizadas = 0;

    let duracionTotalSum = 0;
    let duracionConteo = 0;

    const agruparTecnicosKPI = {};

    data.forEach(item => {

        const est = (item.Estado || "")
            .toString()
            .trim()
            .toLowerCase();

        if (est === "completado") {
            completadas++;
        }

        if (est === "no realizada") {
            noRealizadas++;
        }

        // Duración
        const inicioRaw =
            item.Inicio ||
            item.Hora_Inicio;

        const finRaw =
            item.Fin ||
            item.Hora_Fin;

        const difMin =
            calcularDiferenciaMinutos(
                inicioRaw,
                finRaw
            );

        if (
            est === "completado" &&
            difMin !== null &&
            difMin >= 0 &&
            difMin < 720
        ) {

            duracionTotalSum += difMin;
            duracionConteo++;
        }

        // RGU
        if (est === "completado") {

            const f = obtenerFechaObjeto(item);

            const tecnico =
                (item.Tecnico || "")
                    .toString()
                    .trim();

            if (f && tecnico) {

                const diaKey =
                    `${f.getFullYear()}-` +
                    `${String(f.getMonth() + 1).padStart(2, '0')}-` +
                    `${String(f.getDate()).padStart(2, '0')}`;

                let rguRaw = item.RGU ?? 0;

                if (typeof rguRaw === "string") {
                    rguRaw =
                        rguRaw
                            .replace(',', '.')
                            .trim();
                }

                const rguNum =
                    parseFloat(rguRaw) || 0;

                if (!agruparTecnicosKPI[tecnico]) {
                    agruparTecnicosKPI[tecnico] = {};
                }

                if (!agruparTecnicosKPI[tecnico][diaKey]) {
                    agruparTecnicosKPI[tecnico][diaKey] = 0;
                }

                agruparTecnicosKPI[tecnico][diaKey] += rguNum;
            }
        }
    });

    // RGU promedio
    const tecnicos =
        Object.keys(agruparTecnicosKPI);

    let rguPromedio = 0;

    if (tecnicos.length > 0) {

        let sumaPromedios = 0;

        tecnicos.forEach(tecnico => {

            const dias =
                Object.keys(
                    agruparTecnicosKPI[tecnico]
                );

            let totalTecnico = 0;

            dias.forEach(dia => {

                totalTecnico +=
                    agruparTecnicosKPI[tecnico][dia];
            });

            const promedioDiario =
                totalTecnico / dias.length;

            sumaPromedios += promedioDiario;
        });

        rguPromedio =
            sumaPromedios / tecnicos.length;
    }

    // Porcentajes
    const efectividad =
        (completadas + noRealizadas) > 0
            ? (
                completadas /
                (completadas + noRealizadas)
            ) * 100
            : 0;

    // Duración
    const duracionPromedio =
        duracionConteo > 0
            ? Math.round(
                duracionTotalSum /
                duracionConteo
            )
            : 0;

    const horas =
        Math.floor(duracionPromedio / 60);

    const minutos =
        duracionPromedio % 60;

    // Pintar KPIs
    document.getElementById("totalOrdenes").innerText =
        total;

    document.getElementById("efectividad").innerText =
        efectividad.toFixed(1) + "%";

    document.getElementById("completadas").innerText =
        completadas;

    document.getElementById("noRealizadas").innerText =
        noRealizadas;

    document.getElementById("rguTotal").innerText =
        rguPromedio
            .toFixed(1)
            .replace('.', ',');

    document.getElementById("duracionPromedio").innerText =
        `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

// ==========================================
// KPIs PARA CUALQUIER VISTA
// ==========================================
function actualizarKPIsVista(data) {

    const total = data.length;

    let completadas = 0;
    let noRealizadas = 0;

    let duracionTotalSum = 0;
    let duracionConteo = 0;

    const agruparTecnicosKPI = {};

    data.forEach(item => {

        const est = (item.Estado || "")
            .toString()
            .trim()
            .toLowerCase();

        if (est === "completado") {
            completadas++;
        }

        if (est === "no realizada") {
            noRealizadas++;
        }

        // -----------------------------
        // DURACIÓN
        // -----------------------------

        const inicioRaw =
            item.Inicio ||
            item.Hora_Inicio;

        const finRaw =
            item.Fin ||
            item.Hora_Fin;

        const difMin =
            calcularDiferenciaMinutos(
                inicioRaw,
                finRaw
            );

        if (
            est === "completado" &&
            difMin !== null &&
            difMin >= 0 &&
            difMin < 720
        ) {

            duracionTotalSum += difMin;
            duracionConteo++;
        }

        // -----------------------------
        // RGU
        // -----------------------------

        if (est === "completado") {

            const fecha =
                obtenerFechaObjeto(item);

            const tecnico =
                (item.Tecnico || "")
                    .toString()
                    .trim();

            if (fecha && tecnico) {

                const diaKey =
                    `${fecha.getFullYear()}-` +
                    `${String(fecha.getMonth() + 1).padStart(2, "0")}-` +
                    `${String(fecha.getDate()).padStart(2, "0")}`;

                let rguRaw = item.RGU ?? 0;

                if (typeof rguRaw === "string") {
                    rguRaw =
                        rguRaw
                            .replace(",", ".")
                            .trim();
                }

                const rguNum =
                    parseFloat(rguRaw) || 0;

                if (!agruparTecnicosKPI[tecnico]) {
                    agruparTecnicosKPI[tecnico] = {};
                }

                if (!agruparTecnicosKPI[tecnico][diaKey]) {
                    agruparTecnicosKPI[tecnico][diaKey] = 0;
                }

                agruparTecnicosKPI[tecnico][diaKey] += rguNum;
            }
        }
    });

    // ==========================================
    // RGU PROMEDIO
    // ==========================================

    const tecnicos =
        Object.keys(agruparTecnicosKPI);

    let rguPromedio = 0;

    if (tecnicos.length > 0) {

        let sumaPromedios = 0;

        tecnicos.forEach(tecnico => {

            const dias =
                Object.keys(
                    agruparTecnicosKPI[tecnico]
                );

            let totalRGU = 0;

            dias.forEach(dia => {

                totalRGU +=
                    agruparTecnicosKPI
                    [tecnico]
                    [dia];
            });

            const promedioDiario =
                totalRGU / dias.length;

            sumaPromedios +=
                promedioDiario;
        });

        rguPromedio =
            sumaPromedios /
            tecnicos.length;
    }

    // ==========================================
    // PORCENTAJES
    // ==========================================

    const efectividad =
        (completadas + noRealizadas) > 0
            ? (
                completadas /
                (completadas + noRealizadas)
            ) * 100
            : 0;

    // ==========================================
    // DURACIÓN
    // ==========================================

    const duracionPromedioMin =
        duracionConteo > 0
            ? Math.round(
                duracionTotalSum /
                duracionConteo
            )
            : 0;

    const horas =
        Math.floor(
            duracionPromedioMin / 60
        );

    const minutos =
        duracionPromedioMin % 60;

    const duracionFormateada =
        `${String(horas).padStart(2, "0")}:` +
        `${String(minutos).padStart(2, "0")}`;

    // ==========================================
    // ACTUALIZAR HTML
    // ==========================================

    const totalElem = document.getElementById("totalOrdenes");

    if (totalElem) {
        totalElem.innerText = total;
    }

    const completadasElem =
        document.getElementById("completadas");

    if (completadasElem) {
        completadasElem.innerText =
            `C: ${completadas}`;
    }

    const noRealizadasElem =
        document.getElementById("noRealizadas");

    if (noRealizadasElem) {
        noRealizadasElem.innerText =
            `NR: ${noRealizadas}`;
    }

    const efectividadElem =
        document.getElementById("efectividad");

    if (efectividadElem) {
        efectividadElem.innerText =
            `${efectividad.toFixed(1)}%`;
    }

    const rguElem =
        document.getElementById("rguTotal");

    if (rguElem) {
        rguElem.innerText =
            rguPromedio
                .toFixed(1)
                .replace(".", ",");
    }

    const duracionElem =
        document.getElementById("duracionPromedio");

    if (duracionElem) {
        duracionElem.innerText =
            duracionFormateada;
    }
}

// ==========================================
// 3 Graficos diarios (Global)
// ==========================================
function crearGraficoHoyProduccion(data, rango) {

    const labels = [];
    const completados = [];
    const noRealizadas = [];
    const porcentajes = [];

    const rangoActivo = rango || obtenerRangoHoyActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;

    for (let i = 0; i < cantidadDias; i++) {

        const fecha = new Date(fechaInicioRango);

        fecha.setDate(
            fecha.getDate() + i
        );

        fecha.setHours(0, 0, 0, 0);

        const key =
            `${fecha.getFullYear()}-` +
            `${String(fecha.getMonth() + 1).padStart(2, '0')}-` +
            `${String(fecha.getDate()).padStart(2, '0')}`;

        let c = 0;
        let nr = 0;

        data.forEach(item => {

            const f = obtenerFechaObjeto(item);

            if (!f) return;

            const itemKey =
                `${f.getFullYear()}-` +
                `${String(f.getMonth() + 1).padStart(2, '0')}-` +
                `${String(f.getDate()).padStart(2, '0')}`;

            if (itemKey !== key) return;

            const estado =
                (item.Estado || "")
                    .toString()
                    .trim()
                    .toLowerCase();

            if (estado === "completado") c++;

            if (estado === "no realizada") nr++;
        });

        const total = c + nr;

        const porcentaje =
            total > 0
                ? Number(((c / total) * 100).toFixed(1))
                : 0;

        const diasSemana = [
            "Dom",
            "Lun",
            "Mar",
            "Mié",
            "Jue",
            "Vie",
            "Sáb"
        ];

        labels.push([
            diasSemana[fecha.getDay()],
            `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`
        ]);

        completados.push(c);
        noRealizadas.push(nr);
        porcentajes.push(porcentaje);
    }

    const canvas = document.getElementById("chartHoy1");
    if (!canvas) return;

    // --- PEGA ESTO AQUÍ ---
    const minWidth1 = labels.length * 55;
    canvas.parentElement.style.width = '100%';
    canvas.parentElement.style.minWidth = minWidth1 + 'px';
    // ----------------------

    if (chartHoy1Instance) {
        chartHoy1Instance.destroy();
    }

    chartHoy1Instance =
        new Chart(
            canvas.getContext("2d"),

            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [{
                        label: "% Efectividad",

                        data: porcentajes,

                        borderColor: "#1d2a57",

                        backgroundColor: "#1d2a57",

                        borderWidth: 2.5,

                        tension: 0.2,

                        spanGaps: true,

                        pointRadius: 4,

                        pointBackgroundColor:
                            "#1d2a57",

                        pointBorderColor:
                            "#1d2a57",

                        datalabels: {

                            anchor: "top",

                            align: "end",

                            offset: 6,

                            color:
                                "#1d2a57",

                            font: {
                                size: 11,
                                weight: "bold",
                                family:
                                    "Segoe UI, sans-serif"
                            },

                            formatter: value => value + "%"
                        }
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    layout: {
                        padding: {
                            top: 25,
                            bottom: 5,
                            left: 10,
                            right: 10
                        }
                    },

                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            border: {
                                display: false
                            },
                            ticks: {
                                autoSkip: false,
                                color: "#1e293b",
                                padding: 8,
                                font: {
                                    size: 12,
                                    weight: "600",
                                    family: "Segoe UI, sans-serif"
                                }
                            }
                        },

                        y: {
                            display: false,
                            beginAtZero: true,
                            grace: "20%"
                        }
                    }
                }
            }
        ); setTimeout(() => {
            moverScrollGraficosAlFinal();
        }, 100);
}

function crearGraficoHoyRGU(data, rango) {

    const labels = [];
    const valores = [];

    const diasSemana = [
        "Dom",
        "Lun",
        "Mar",
        "Mié",
        "Jue",
        "Vie",
        "Sáb"
    ];

    // =====================================================
    // ACUMULADOR GENERAL PARA EL KPI
    // =====================================================

    const promediosDiarios = [];


    // =====================================================
    // OBTENER FECHA SIN DESFASE HORARIO
    // =====================================================

    const obtenerFechaKey = (item) => {

        const raw =
            item.Fecha ||
            item.Origen;

        if (!raw) {
            return null;
        }

        const str =
            String(raw).trim();

        const match =
            str.match(
                /^(\d{4}-\d{2}-\d{2})/
            );

        return match
            ? match[1]
            : null;
    };


    // =====================================================
    // RANGO ACTIVO
    // =====================================================

    const rangoActivo = rango || obtenerRangoHoyActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;


    for (let i = 0; i < cantidadDias; i++) {

        const fecha =
            new Date(fechaInicioRango);

        fecha.setDate(
            fecha.getDate() + i
        );


        // =================================================
        // FECHA YYYY-MM-DD
        // =================================================

        const year =
            fecha.getFullYear();

        const month =
            String(
                fecha.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                fecha.getDate()
            ).padStart(2, "0");

        const key =
            `${year}-${month}-${day}`;


        // =================================================
        // TÉCNICOS DEL DÍA
        // =================================================

        const tecnicos = {};


        if (Array.isArray(data)) {

            data.forEach(item => {

                const itemKey =
                    obtenerFechaKey(item);

                if (itemKey !== key) {
                    return;
                }


                // =========================================
                // ESTADO
                // =========================================

                const estado =
                    String(
                        item.Estado ?? ""
                    )
                        .trim()
                        .toLowerCase();

                if (
                    estado !== "completado" &&
                    estado !== "no realizada"
                ) {
                    return;
                }


                // =========================================
                // TÉCNICO
                // =========================================

                let tecnico =
                    String(
                        item.Tecnico ?? ""
                    )
                        .trim()
                        .toUpperCase();

                if (!tecnico) {
                    return;
                }


                // Normalizar acentos

                tecnico =
                    tecnico
                        .normalize("NFD")
                        .replace(
                            /[\u0300-\u036f]/g,
                            ""
                        );


                // =========================================
                // RGU
                // NULL / VACÍO = 0
                // =========================================

                let rgu =
                    item.RGU ?? 0;

                if (
                    typeof rgu === "string"
                ) {

                    rgu =
                        rgu
                            .replace(",", ".")
                            .trim();

                }

                rgu =
                    Number(rgu) || 0;


                // =========================================
                // ACUMULAR RGU DEL TÉCNICO
                // =========================================

                if (
                    !(
                        tecnico in tecnicos
                    )
                ) {

                    tecnicos[tecnico] = 0;

                }

                tecnicos[tecnico] +=
                    rgu;

            });

        }


        // =================================================
        // PROMEDIO DE TÉCNICOS DEL DÍA
        // =================================================

        const listaTecnicos =
            Object.keys(tecnicos);

        let promedio =
            0;


        if (
            listaTecnicos.length > 0
        ) {

            let suma =
                0;

            listaTecnicos.forEach(
                tecnico => {

                    suma +=
                        tecnicos[tecnico];

                }
            );


            promedio =
                suma /
                listaTecnicos.length;

        }


                // =================================================
        // GUARDAR PROMEDIO DEL DÍA
        // Si no hubo técnicos con datos ese día, no se
        // cuenta para el promedio del KPI (pero el gráfico
        // sigue dibujando el punto en 0, igual que los demás)
        // =================================================

        if (listaTecnicos.length > 0) {

            promediosDiarios.push(
                promedio
            );

        }


        // =================================================
        // LABEL DEL GRÁFICO
        // =================================================

        labels.push([
            diasSemana[
            fecha.getDay()
            ],
            `${day}/${month}`
        ]);


        valores.push(
            Number(
                promedio.toFixed(1)
            )
        );

    }


    // =====================================================
    // CALCULAR KPI RGU
    //
    // Promedio de los promedios diarios
    // =====================================================

    let rguPromedio =
        0;


    if (
        promediosDiarios.length > 0
    ) {

        const suma =
            promediosDiarios.reduce(
                (total, valor) =>
                    total + valor,
                0
            );

        rguPromedio =
            suma /
            promediosDiarios.length;

    }


    // =====================================================
    // ACTUALIZAR KPI RGU
    // =====================================================

    const rguElem =
        document.getElementById(
            "rguTotal"
        );

    if (rguElem) {

        rguElem.innerText =
            rguPromedio
                .toFixed(1)
                .replace(".", ",");

    }


    // =====================================================
    // RENDERIZAR GRÁFICO
    // =====================================================

    // =====================================================
    // RENDERIZAR GRÁFICO
    // =====================================================
    const canvas = document.getElementById("chartHoy2");

    if (!canvas) {
        return;
    }

    // --- PEGA ESTO AQUÍ ---
    const minWidth2 = labels.length * 55;
    canvas.parentElement.style.width = '100%';
    canvas.parentElement.style.minWidth = minWidth2 + 'px';
    // ----------------------

    if (typeof chartHoy2Instance !== "undefined" && chartHoy2Instance) {
        chartHoy2Instance.destroy();
    }


    chartHoy2Instance =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [{

                        label: "RGU",

                        data: valores,

                        borderColor: "#1d2a57",

                        backgroundColor: "#1d2a57",

                        borderWidth: 2.5,

                        tension: 0.2,

                        spanGaps: true,

                        pointRadius: 4,

                        datalabels: {

                            anchor: "top",

                            align: "end",

                            offset: 6,

                            color: "#1d2a57",

                            font: {

                                size: 11,

                                weight: "bold",

                                family:
                                    "Segoe UI, sans-serif"

                            },

                            formatter:
                                value =>
                                    value !== null
                                        ? value
                                            .toString()
                                            .replace(
                                                ".",
                                                ","
                                            )
                                        : ""

                        }

                    }]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    layout: {

                        padding: {

                            top: 25,

                            bottom: 5,

                            left: 10,

                            right: 10

                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {

                                autoSkip: false,

                                color: "#1e293b",

                                padding: 8,

                                font: {

                                    size: 12,

                                    weight: "600",

                                    family:
                                        "Segoe UI, sans-serif"

                                }

                            }

                        },

                        y: {

                            display: false,

                            beginAtZero: true,

                            grace: "0%"

                        }

                    }

                }

            }
        );


    // =====================================================
    // MOVER SCROLL AL FINAL
    // =====================================================

    setTimeout(() => {

        if (
            typeof moverScrollGraficosAlFinal ===
            "function"
        ) {

            moverScrollGraficosAlFinal();

        }

    }, 100);

}

function crearGraficoHoyDuracion(data, rango) {

    const labels = [];
    const valores = [];

    const rangoActivo = rango || obtenerRangoHoyActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;

    for (let i = 0; i < cantidadDias; i++) {

        const fecha = new Date(fechaInicioRango);

        fecha.setDate(
            fecha.getDate() + i
        );

        fecha.setHours(0, 0, 0, 0);

        const key =
            `${fecha.getFullYear()}-` +
            `${String(fecha.getMonth() + 1).padStart(2, '0')}-` +
            `${String(fecha.getDate()).padStart(2, '0')}`;

        let suma = 0;
        let cantidad = 0;

        data.forEach(item => {

            const f =
                obtenerFechaObjeto(item);

            if (!f) return;

            const itemKey =
                `${f.getFullYear()}-` +
                `${String(f.getMonth() + 1).padStart(2, '0')}-` +
                `${String(f.getDate()).padStart(2, '0')}`;

            if (itemKey !== key) return;

            const estado =
                (item.Estado || "")
                    .toString()
                    .trim()
                    .toLowerCase();

            if (estado !== "completado") {
                return;
            }

            const inicio =
                item.Inicio ||
                item.Hora_Inicio;

            const fin =
                item.Fin ||
                item.Hora_Fin;

            const diferencia =
                calcularDiferenciaMinutos(
                    inicio,
                    fin
                );

            if (
                diferencia !== null &&
                diferencia >= 0 &&
                diferencia < 720
            ) {

                suma += diferencia;
                cantidad++;
            }
        });

        const promedio =
            cantidad > 0
                ? Math.round(suma / cantidad)
                : 0;

        const diasSemana = [
            "Dom",
            "Lun",
            "Mar",
            "Miér",
            "Jue",
            "Vie",
            "Sáb"
        ];

        labels.push([
            diasSemana[fecha.getDay()],
            `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`
        ]);

        valores.push(promedio);
    }

    const canvas = document.getElementById("chartHoy3");
    if (!canvas) return;

    // --- PEGA ESTO AQUÍ ---
    const minWidth3 = labels.length * 55;
    canvas.parentElement.style.width = '100%';
    canvas.parentElement.style.minWidth = minWidth3 + 'px';
    // ----------------------

    if (chartHoy3Instance) {
        chartHoy3Instance.destroy();
    }

    chartHoy3Instance =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [{
                        label: "Duración promedio",

                        data: valores,

                        borderColor: "#1d2a57",

                        backgroundColor: "#1d2a57",

                        borderWidth: 2.5,

                        tension: 0.2,

                        spanGaps: true,

                        pointRadius: 4,

                        pointBackgroundColor:
                            "#1d2a57",

                        pointBorderColor:
                            "#1d2a57",

                        datalabels: {

                            anchor: "top",

                            align: "end",

                            offset: 6,

                            color:
                                "#1d2a57",

                            font: {
                                size: 11,
                                weight: "bold",
                                family:
                                    "Segoe UI, sans-serif"
                            },

                            formatter: function (value) {

                                if (
                                    value === null ||
                                    value === undefined
                                ) {
                                    return "";
                                }

                                const horas =
                                    Math.floor(value / 60);

                                const minutos =
                                    value % 60;

                                return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
                            }
                        }
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    layout: {
                        padding: {
                            top: 20,
                            bottom: 30,
                            left: 10,
                            right: 10
                        }
                    },

                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            border: {
                                display: false
                            },
                            ticks: {
                                autoSkip: false,
                                color: "#1e293b",
                                padding: 8,

                                font: {
                                    size: 12,
                                    weight: "600",
                                    family: "Segoe UI, sans-serif"
                                }
                            }
                        },

                        y: {
                            display: false,
                            beginAtZero: true,
                            grace: "20%"
                        }
                    }
                }
            }
        ); setTimeout(() => {
            moverScrollGraficosAlFinal();
        }, 100);
}

// ==========================================
// Función para Scroll de graficos
// ==========================================
function moverScrollGraficosAlFinal() {
    document.querySelectorAll(".chart-scroll").forEach(scroll => {
        scroll.scrollLeft = scroll.scrollWidth;
    });
}

//-----------------------------------------
// 3 Graficos diarios filtrados por:  Alta - Traslado - Migración
function crearGraficoHoyProduccionAltas(data, rango) {
    const labels = [];
    const porcentajes = [];

    const rangoActivo = rango || obtenerRangoAltasActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;

    for (let i = 0; i < cantidadDias; i++) {
        const fecha = new Date(fechaInicioRango);
        fecha.setDate(fecha.getDate() + i);
        fecha.setHours(0, 0, 0, 0);

        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

        let c = 0;
        let nr = 0;

        data.forEach(item => {
            const tipo = (item.Tipo_de_Actividad || "").toString().trim().toLowerCase();
            if (tipo !== "alta" && tipo !== "alta traslado" && tipo !== "migración" && tipo !== "migracion") return;

            const f = obtenerFechaObjeto(item);
            if (!f) return;

            const itemKey = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
            if (itemKey !== key) return;

            const estado = (item.Estado || "").toString().trim().toLowerCase();
            if (estado === "completado") c++;
            if (estado === "no realizada") nr++;
        });

        const total = c + nr;
        const porcentaje = total > 0 ? Number(((c / total) * 100).toFixed(1)) : 0;
        const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        labels.push([
            diasSemana[fecha.getDay()],
            `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`
        ]);
        porcentajes.push(porcentaje);
    }

    const canvas = document.getElementById("chartHoyAltas1");
    if (!canvas) return;

    // NUEVA LÓGICA: Usamos minWidth en lugar de width
    const minWidth1 = labels.length * 55; // 55 píxeles por día
    canvas.parentElement.style.width = '100%'; // Reseteamos por si acaso
    canvas.parentElement.style.minWidth = minWidth1 + 'px'; // Aplicamos el mínimo

    if (window.chartHoyAltas1Instance) {
        window.chartHoyAltas1Instance.destroy();
    }

    window.chartHoyAltas1Instance = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "% Efectividad",
                data: porcentajes,
                borderColor: "#1d2a57",
                backgroundColor: "#1d2a57",
                borderWidth: 2.5,
                tension: 0.2,
                spanGaps: true,
                pointRadius: 4,
                pointBackgroundColor: "#1d2a57",
                pointBorderColor: "#1d2a57",
                datalabels: {
                    anchor: "top",
                    align: "end",
                    offset: 6,
                    color: "#1d2a57",
                    font: { size: 11, weight: "bold", family: "Segoe UI, sans-serif" },
                    formatter: value => value + "%"
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            layout: { padding: { top: 25, bottom: 25, left: 10, right: 10 } },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        autoSkip: false,
                        color: "#1e293b",
                        padding: 8,
                        font: { size: 12, weight: "600", family: "Segoe UI, sans-serif" }
                    }
                },
                y: { display: false, beginAtZero: true, grace: "20%" }
            }
        }
    });

    setTimeout(() => {
        const scroll = canvas.closest(".chart-scroll");
        if (scroll) scroll.scrollLeft = scroll.scrollWidth;
    }, 150);
}

function crearGraficoHoyRGUAltas(data, rango) {
    const labels = [];
    const valores = [];

    const rangoActivo = rango || obtenerRangoAltasActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;

    for (let i = 0; i < cantidadDias; i++) {
        const fecha = new Date(fechaInicioRango);
        fecha.setDate(fecha.getDate() + i);

        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;

        const tecnicos = {};

        data.forEach(item => {
            const tipo = (item.Tipo_de_Actividad || "").toString().trim().toLowerCase();
            if (tipo !== "alta" && tipo !== "alta traslado" && tipo !== "migración" && tipo !== "migracion") return;

            const fechaRaw = item.Origen || item.Fecha;
            if (!fechaRaw) return;

            const rawStr = String(fechaRaw).trim();
            const itemKey = rawStr.length >= 10 ? rawStr.substring(0, 10) : "";
            if (itemKey !== key) return;

            const estado = (item.Estado || "").toString().trim().toLowerCase();
            if (estado !== "completado" && estado !== "no realizada") return;

            let tecnico = (item.Tecnico || "").toString().trim().toUpperCase();
            if (!tecnico) return;
            tecnico = tecnico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            let rgu = item.RGU ?? 0;
            if (typeof rgu === "string") rgu = rgu.replace(",", ".").trim();
            rgu = Number(rgu) || 0;

            if (!tecnicos[tecnico]) tecnicos[tecnico] = 0;
            tecnicos[tecnico] += rgu;
        });

        const listaTecnicos = Object.keys(tecnicos);
        let promedio = 0;

        if (listaTecnicos.length > 0) {
            let suma = 0;
            listaTecnicos.forEach(tecnico => { suma += tecnicos[tecnico]; });
            promedio = suma / listaTecnicos.length;
        }

        promedio = Number(promedio.toFixed(1));
        const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        labels.push([
            diasSemana[fecha.getDay()],
            `${day}/${month}`
        ]);
        valores.push(promedio);
    }

    const canvas = document.getElementById("chartHoyAltas2");
    if (!canvas) return;

    // NUEVA LÓGICA: Usamos minWidth en lugar de width
    const minWidth2 = labels.length * 55;
    canvas.parentElement.style.width = '100%';
    canvas.parentElement.style.minWidth = minWidth2 + 'px';

    if (window.chartHoyAltas2Instance) {
        window.chartHoyAltas2Instance.destroy();
    }

    window.chartHoyAltas2Instance = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "RGU",
                data: valores,
                borderColor: "#1d2a57",
                backgroundColor: "#1d2a57",
                borderWidth: 2.5,
                tension: 0.2,
                spanGaps: true,
                pointRadius: 4,
                pointBackgroundColor: "#1d2a57",
                pointBorderColor: "#1d2a57",
                datalabels: {
                    anchor: "top",
                    align: "end",
                    offset: 6,
                    color: "#1d2a57",
                    font: { size: 11, weight: "bold", family: "Segoe UI, sans-serif" },
                    formatter: value => value !== null && value !== undefined ? value.toString().replace(".", ",") : ""
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            layout: { padding: { top: 25, bottom: 25, left: 10, right: 10 } },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        autoSkip: false,
                        color: "#1e293b",
                        padding: 8,
                        font: { size: 12, weight: "600", family: "Segoe UI, sans-serif" }
                    }
                },
                y: { display: false, beginAtZero: true, grace: "20%" }
            }
        }
    });

    setTimeout(() => {
        const scroll = canvas.closest(".chart-scroll");
        if (scroll) scroll.scrollLeft = scroll.scrollWidth;
    }, 150);
}

function crearGraficoHoyDuracionAltas(data, rango) {
    const labels = [];
    const valores = [];

    const rangoActivo = rango || obtenerRangoAltasActivo();
    const fechaInicioRango = rangoActivo.inicio;
    const cantidadDias = rangoActivo.cantidadDias;

    for (let i = 0; i < cantidadDias; i++) {
        const fecha = new Date(fechaInicioRango);
        fecha.setDate(fecha.getDate() + i);
        fecha.setHours(0, 0, 0, 0);

        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        let suma = 0;
        let cantidad = 0;

        data.forEach(item => {
            const tipo = (item.Tipo_de_Actividad || "").toString().trim().toLowerCase();
            if (tipo !== "alta" && tipo !== "alta traslado" && tipo !== "migración" && tipo !== "migracion") return;

            const f = obtenerFechaObjeto(item);
            if (!f) return;

            const itemKey = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
            if (itemKey !== key) return;

            const estado = (item.Estado || "").toString().trim().toLowerCase();
            if (estado !== "completado") return;

            const inicio = item.Inicio || item.Hora_Inicio;
            const fin = item.Fin || item.Hora_Fin;

            const diferencia = calcularDiferenciaMinutos(inicio, fin);
            if (diferencia !== null && diferencia >= 0 && diferencia < 720) {
                suma += diferencia;
                cantidad++;
            }
        });

        const promedio = cantidad > 0 ? Math.round(suma / cantidad) : 0;
        const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        labels.push([
            diasSemana[fecha.getDay()],
            `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`
        ]);
        valores.push(promedio);
    }

    const canvas = document.getElementById("chartHoyAltas3");
    if (!canvas) return;

    // NUEVA LÓGICA: Usamos minWidth en lugar de width
    const minWidth3 = labels.length * 55;
    canvas.parentElement.style.width = '100%';
    canvas.parentElement.style.minWidth = minWidth3 + 'px';

    if (window.chartHoyAltas3Instance) {
        window.chartHoyAltas3Instance.destroy();
    }

    window.chartHoyAltas3Instance = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Duración promedio",
                data: valores,
                borderColor: "#1d2a57",
                backgroundColor: "#1d2a57",
                borderWidth: 2.5,
                tension: 0.2,
                spanGaps: true,
                pointRadius: 4,
                pointBackgroundColor: "#1d2a57",
                pointBorderColor: "#1d2a57",
                datalabels: {
                    anchor: "top",
                    align: "end",
                    offset: 6,
                    color: "#1d2a57",
                    font: { size: 11, weight: "bold", family: "Segoe UI, sans-serif" },
                    formatter: function (value) {
                        if (value === null || value === undefined) return "";
                        const horas = Math.floor(value / 60);
                        const minutos = value % 60;
                        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            layout: { padding: { top: 25, bottom: 25, left: 10, right: 10 } },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        autoSkip: false,
                        color: "#1e293b",
                        padding: 8,
                        font: { size: 12, weight: "600", family: "Segoe UI, sans-serif" }
                    }
                },
                y: { display: false, beginAtZero: true, grace: "20%" }
            }
        }
    });

    setTimeout(() => {
        const scroll = canvas.closest(".chart-scroll");
        if (scroll) scroll.scrollLeft = scroll.scrollWidth;
    }, 150);
}

//----------------------------------------------------

