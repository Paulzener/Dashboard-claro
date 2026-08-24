
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
    ano: [],
    mes: []
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



    document
        .getElementById("applyAllFilters")
        ?.addEventListener(
            "click",
            aplicarTodosLosFiltros
        );

    document
        .getElementById("clearFilters")
        ?.addEventListener(
            "click",
            limpiarFiltros
        );


    // ==========================
    // BOTÓN MOSTRAR/OCULTAR FILTROS
    // ==========================

    const toggleFiltersBtn =
        document.getElementById("toggleFiltersBtn");

    const filters =
        document.getElementById("filters");

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

    document
        .getElementById("tableSection")
        ?.classList.remove("hidden");
}

// ==========================================
// POBLAR FILTROS
// ==========================================

function poblarFiltros(data) {

    const anos = new Set();
    const ciudades = new Set();
    const zonas = new Set();
    const actividades = new Set();

    data.forEach(item => {

        // ==========================
        // FECHA
        // ==========================

        const fechaObj = obtenerFechaObjeto(item);

        if (fechaObj) {

            const ano = fechaObj.getFullYear();

            if (!isNaN(ano)) {
                anos.add(String(ano));
            }
        }


        // ==========================
        // ACTIVIDAD
        // ==========================

        const act = (item.Tipo_de_Actividad || "")
            .toString()
            .trim();

        if (act) {
            actividades.add(act);
        }


        // ==========================
        // CIUDAD
        // ==========================

        const ciudad = (item.Ciudad || "")
            .toString()
            .trim();

        if (ciudad) {
            ciudades.add(ciudad);
        }


        // ==========================
        // ZONA
        // ==========================

        const zona = (item.Zona_de_trabajo || "")
            .toString()
            .trim();

        if (zona) {
            zonas.add(zona);
        }
    });


    // ==========================
    // ORDENAR
    // ==========================

    const anosOrdenados = Array
        .from(anos)
        .sort((a, b) => Number(b) - Number(a));

    const ciudadesOrdenadas = Array
        .from(ciudades)
        .sort((a, b) => a.localeCompare(b));

    const zonasOrdenadas = Array
        .from(zonas)
        .sort((a, b) => a.localeCompare(b));

    const actividadesOrdenadas = Array
        .from(actividades)
        .sort((a, b) => a.localeCompare(b));


    // ==========================
    // CARGAR FILTROS
    // ==========================
    const añoActual = new Date().getFullYear().toString();
    poblarMultiselect(
        "multiselectAno",
        "ano",
        anosOrdenados,
        true
    );

    poblarMultiselect(
        "multiselectActividad",
        "actividad",
        actividadesOrdenadas
    );

    poblarMultiselect(
        "multiselectZona",
        "zona",
        zonasOrdenadas
    );

    poblarMultiselect(
        "multiselectCiudad",
        "ciudad",
        ciudadesOrdenadas
    );


    // ==========================
    // MESES
    // ==========================

    const itemsMeses = ordenMeses.map(
        (mesCorto, index) => ({
            value: mesCorto,
            text: ordenMesesCompletos[index]
        })
    );

    poblarMultiselect(
        "multiselectMes",
        "mes",
        itemsMeses
    );
}

// ==========================================
// APLICAR FILTROS (COMPLETO)
// ==========================================
function aplicarFiltros() {

    filteredData = rawData.filter(item => {

        const fechaObj = obtenerFechaObjeto(item);

        const itemAno = fechaObj ? fechaObj.getFullYear().toString() : "";
        const itemMes = fechaObj ? ordenMeses[fechaObj.getMonth()] : "";
        const itemAct = (item.Tipo_de_Actividad || "").toString().trim();
        const itemCiudad = (item.Ciudad || "").toString().trim();
        const itemZona = (item.Zona_de_trabajo || "").toString().trim();

        // AÑO (Mantiene selección única)
        const totalAno = document.querySelectorAll("#multiselectAno .multiselect-options input").length;
        const cumpleAno =
            totalAno === 0 ||
            filtroSelecciones.ano.length === 0 ||
            filtroSelecciones.ano.includes(itemAno);

        // MES
        const totalMes = document.querySelectorAll("#multiselectMes .multiselect-options input").length;
        const cumpleMes =
            totalMes === 0 ||
            filtroSelecciones.mes.length === 0 ||
            filtroSelecciones.mes.length === totalMes || // <-- Agregado
            filtroSelecciones.mes.includes(itemMes);

        // ACTIVIDAD
        const totalAct = document.querySelectorAll("#multiselectActividad .multiselect-options input").length;
        const cumpleActividad =
            totalAct === 0 ||
            filtroSelecciones.actividad.length === 0 ||
            filtroSelecciones.actividad.length === totalAct || // <-- Agregado
            filtroSelecciones.actividad.includes(itemAct);

        // CIUDAD
        const totalCiudad = document.querySelectorAll("#multiselectCiudad .multiselect-options input").length;
        const cumpleCiudad =
            totalCiudad === 0 ||
            filtroSelecciones.ciudad.length === 0 ||
            filtroSelecciones.ciudad.length === totalCiudad ||
            filtroSelecciones.ciudad.includes(itemCiudad);

        // ZONA
        const totalZona = document.querySelectorAll("#multiselectZona .multiselect-options input").length;
        const cumpleZona =
            totalZona === 0 ||
            filtroSelecciones.zona.length === 0 ||
            filtroSelecciones.zona.length === totalZona || // <-- Agregado
            filtroSelecciones.zona.includes(itemZona);

        return (
            cumpleAno &&
            cumpleMes &&
            cumpleActividad &&
            cumpleCiudad &&
            cumpleZona
        );
    });

    console.log("Filtros aplicados:", filtroSelecciones);
    console.log("Registros originales:", rawData.length);

    const años = {};

    rawData.forEach(x => {

        const fecha = obtenerFechaObjeto(x);

        if (!fecha) {
            años["SIN_FECHA"] =
                (años["SIN_FECHA"] || 0) + 1;
            return;
        }

        const anio = fecha.getFullYear();

        años[anio] = (años[anio] || 0) + 1;
    });

    console.log("Registros por año:", años);

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

    // Si estamos en HISTÓRICO
    if (vistaActual === "historico") {

        actualizarKPIs();

        actualizarGraficos();

        return;
    }

    // Si estamos en DETALLES
    if (vistaActual === "detalles") {

        renderizarTabla();

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

function actualizarKPIs() {
    const total = filteredData.length;

    let completadas = 0;
    let noRealizadas = 0;
    let duracionTotalSum = 0;
    let duracionConteo = 0;

    const agruparTecnicosKPI = {};

    filteredData.forEach(item => {
        const estado = String(item.Estado ?? "").trim().toLowerCase();

        if (estado === "completado") completadas++;
        if (estado === "no realizada") noRealizadas++;

        // Cálculo de Duración
        const inicio = item.Inicio ?? item.Hora_Inicio;
        const fin = item.Fin ?? item.Hora_Fin;
        const diferencia = calcularDiferenciaMinutos(inicio, fin);

        if (estado === "completado" && diferencia !== null && diferencia >= 0 && diferencia < 720) {
            duracionTotalSum += diferencia;
            duracionConteo++;
        }

        // KPI - Agrupación RGU por Técnico y Día 
        if (estado === "completado" || estado === "no realizada") {
            const fecha = obtenerFechaObjeto(item);
            const tecnico = String(item.Tecnico ?? "").trim();

            if (fecha && tecnico) {
                const diaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

                let rgu = item.RGU ?? 0;
                if (typeof rgu === "string") {
                    rgu = rgu.replace(",", ".").trim();
                }
                const rguNum = parseFloat(rgu) || 0;

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

    // ------------------------------
    // CÁLCULOS DE PROMEDIOS Y PORCENTAJES
    // ------------------------------
    const tecnicos = Object.keys(agruparTecnicosKPI);
    let rguPromedio = 0;

    if (tecnicos.length > 0) {
        let suma = 0;
        tecnicos.forEach(tecnico => {
            const dias = Object.keys(agruparTecnicosKPI[tecnico]);
            let totalTecnico = 0;

            dias.forEach(dia => {
                totalTecnico += agruparTecnicosKPI[tecnico][dia];
            });

            if (dias.length > 0) {
                suma += totalTecnico / dias.length;
            }
        });
        rguPromedio = suma / tecnicos.length;
    }

    const efectividad = (completadas + noRealizadas) > 0
        ? (completadas / (completadas + noRealizadas)) * 100
        : 0;

    const duracionPromedio = duracionConteo > 0
        ? Math.round(duracionTotalSum / duracionConteo)
        : 0;

    const horas = Math.floor(duracionPromedio / 60);
    const minutos = duracionPromedio % 60;
    const duracionFormateada = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

    // ------------------------------
    // RENDERIZADO EN DOM
    // ------------------------------
    const totalElem = document.getElementById("totalOrdenes");
    if (totalElem) {
        totalElem.innerText = total.toLocaleString("es-CL"); // Formateado con punto de miles
    }

    const completadasElem = document.getElementById("completadas");
    if (completadasElem) {
        completadasElem.innerText = completadas.toLocaleString("es-CL");
    }

    const pctCompElem = document.getElementById("pctCompletadas");
    if (pctCompElem) {
        pctCompElem.innerText = total > 0 ? ((completadas / total) * 100).toFixed(1) + "%" : "0%";
    }

    const noRealizadasElem = document.getElementById("noRealizadas");
    if (noRealizadasElem) {
        noRealizadasElem.innerText = noRealizadas.toLocaleString("es-CL");
    }

    const efectividadElem = document.getElementById("efectividad");
    if (efectividadElem) {
        efectividadElem.innerText = efectividad.toFixed(1) + "%";
    }

    const rguElem = document.getElementById("rguTotal");
    if (rguElem) {
        rguElem.innerText = rguPromedio.toFixed(1).replace(".", ",");
    }

    const durElem = document.getElementById("duracionPromedio");
    if (durElem) {
        durElem.innerText = duracionFormateada;
    }
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

        let h = parseInt(partes[0].slice(-2), 10);

        let m = parseInt(partes[1], 10);

        const s = partes[2] ? parseInt(partes[2], 10) : 0;


        if (s >= 30) {
            m++;
        }


        if (m >= 60) {

            m = 0;

            h = (h + 1) % 24;
        }


        if (!isNaN(h) && !isNaN(m)
        ) {

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

function renderizarTabla() {
    const tbody = document.getElementById("dataTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    // APLICAR LÍMITE: Si es 'todos' muestra filteredData completo, de lo contrario recorta los primeros N registros
    const limiteData = limiteRegistros === 'todos'
        ? filteredData
        : filteredData.slice(0, limiteRegistros);

    limiteData.forEach(item => {
        const tecnico = String(item.Tecnico ?? "-").trim();
        const supervisor = String(item.Supervisor ?? "-").trim();

        const inicio = item.Inicio ?? item.Hora_Inicio;
        const fin = item.Fin ?? item.Hora_Fin;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHTML(tecnico)}</td>
            <td>${escapeHTML(supervisor)}</td>
            <td>${escapeHTML(item.Rut_o_Bucket ?? "-")}</td>
            <td>${escapeHTML(item.Tipo_de_Actividad ?? "-")}</td>
            <td>${escapeHTML(item.Orden_de_Trabajo ?? "-")}</td>
            <td>${escapeHTML(item.Zona ?? "-")}</td>
            <td>${escapeHTML(item.Zona_de_trabajo ?? "-")}</td>
            <td>${formatearHoraRedondeada(inicio)}</td>
            <td>${formatearHoraRedondeada(fin)}</td>
            <td>${escapeHTML(item.Estado ?? "-")}</td>
            <td>${formatearFecha(item)}</td>
            <td>${escapeHTML(item.RGU ?? "0")}</td>
        `;
        tbody.appendChild(tr);
    });

    const rowCount = document.getElementById("rowCount");

    if (rowCount) {
        rowCount.innerText = `Mostrando ${limiteData.length} de ${filteredData.length} registros`;
    }
}

// ==========================================
// GRÁFICOS
// ==========================================

function actualizarGraficos() {

    crearGraficoProduccion();

    crearGraficoRGU();

    crearGraficoDuracion();
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

function cambiarVista(vista, btnElement) {

    vistaActual = vista;
    document.getElementById('kpis')
        ?.classList.toggle('hidden', vista === 'detalles');

    // Cambiar botón activo
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (btnElement) {
        btnElement.classList.add('active');
    }

    // Ocultar todas las vistas
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.add('hidden');
    });

    // ==========================================
    // VISTA HOY
    // ==========================================
    if (vista === 'hoy') {

        document.getElementById('viewHoy')?.classList.remove('hidden');

        actualizarVistaHoy();

    }
    // ==========================================
    // VISTA ALTAS (DIARIOS)
    // ==========================================
    else if (vista === 'altas') {
        document.getElementById('viewAltas')?.classList.remove('hidden');

        // Obtener la data filtrada o global de tu aplicación
        const data = obtenerDatosFiltrados();

        // Renderizar los 3 gráficos de Altas
        crearGraficoHoyProduccionAltas(data);
        crearGraficoHoyRGUAltas(data);
        crearGraficoHoyDuracionAltas(data);
    }

    // ==========================================
    // VISTA HISTÓRICO
    // ==========================================
    else if (vista === 'historico') {

        document.getElementById('viewHistorico')?.classList.remove('hidden');

        // KPIs históricos
        filteredData = obtenerDatosFiltrados();

        actualizarKPIs();

        // Gráficos históricos
        actualizarGraficos();

    }

    // ==========================================
    // VISTA DETALLES
    // ==========================================
    else if (vista === 'detalles') {
        const viewDetalles = document.getElementById('viewDetalles');
        viewDetalles?.classList.remove('hidden');

        // 1. Seleccionar el tbody de la tabla
        const tbody = document.querySelector('#viewDetalles table tbody'); // Ajusta el id/clase del tbody si es necesario

        if (tbody) {
            // 2. Insertar la fila de carga dentro de la tabla
            tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 20px;">
                    Cargando datos...
                </td>
            </tr>
        `;
        }

        // 3. Procesar datos y renderizar (renderizarTabla reemplazará la fila de carga automáticamente)
        setTimeout(() => {
            filteredData = obtenerDatosFiltrados();
            renderizarTabla();
        }, 50);
    }
}

function obtenerDatosUltimosDias(data, cantidadDias = 30) {

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(hoy);

    fechaInicio.setDate(
        fechaInicio.getDate() - (cantidadDias - 1)
    );

    return data.filter(item => {

        const fecha = obtenerFechaObjeto(item);

        if (!fecha) {
            return false;
        }

        const fechaItem = new Date(fecha);

        fechaItem.setHours(0, 0, 0, 0);

        return (
            fechaItem >= fechaInicio &&
            fechaItem <= hoy
        );
    });
}

function actualizarVistaHoy() {

    if (!rawData || rawData.length === 0) {
        return;
    }

    // Primero respetamos los filtros
    const datosFiltrados = filteredData;
    console.log("🔴 KPI - obtenerDatosFiltrados:", datosFiltrados.length);

    // Obtener datos desde hoy hacia atrás
    datosVistaHoy = obtenerDatosUltimosDias(datosFiltrados, 30);

    console.log("Datos últimos días:", datosVistaHoy);

    // KPIs de los datos recientes
    actualizarKPIsConDatos(datosVistaHoy);

    // Crear los 3 gráficos
    crearGraficoHoyProduccion(datosVistaHoy);
    crearGraficoHoyRGU(datosVistaHoy);
    crearGraficoHoyDuracion(datosVistaHoy);
}

function obtenerDatosFiltrados() {
    const totalAno = document.querySelectorAll("#multiselectAno .multiselect-options input").length;
    const totalMes = document.querySelectorAll("#multiselectMes .multiselect-options input").length;
    const totalActividad = document.querySelectorAll("#multiselectActividad .multiselect-options input").length;
    const totalCiudad = document.querySelectorAll("#multiselectCiudad .multiselect-options input").length;
    const totalZona = document.querySelectorAll("#multiselectZona .multiselect-options input").length;

    // Nombres exactos como vienen en el multiselect
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const resultado = rawData.filter(item => {
        const fechaRaw = String(item.Fecha || item.Origen || "").trim();
        let itemAno = "";
        let itemMes = "";

        // Extraer YYYY y MM directamente del texto para evitar problemas de zona horaria (UTC)
        const match = fechaRaw.match(/^(\d{4})-(\d{2})/);
        if (match) {
            itemAno = match[1];
            const numMes = parseInt(match[2], 10) - 1; // Convertir 01-12 a índice 0-11
            itemMes = nombresMeses[numMes] || "";
        }

        const itemActividad = String(item.Tipo_de_Actividad ?? "").trim();
        const itemCiudad = String(item.Ciudad ?? "").trim();
        const itemZona = String(item.Zona_de_trabajo ?? "").trim();

        const cumpleAno =
            totalAno === 0 ||
            filtroSelecciones.ano.length === 0 ||
            filtroSelecciones.ano.length === totalAno ||
            filtroSelecciones.ano.includes(itemAno);

        const cumpleMes =
            totalMes === 0 ||
            filtroSelecciones.mes.length === 0 ||
            filtroSelecciones.mes.length === totalMes ||
            filtroSelecciones.mes.includes(itemMes);

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

        return (
            cumpleAno &&
            cumpleMes &&
            cumpleActividad &&
            cumpleCiudad &&
            cumpleZona
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

    actualizarKPIsConDatos(datosVistaHoy);

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

function crearGraficoHoyProduccion(data) {

    const labels = [];
    const completados = [];
    const noRealizadas = [];
    const porcentajes = [];

    const hoy = new Date();

    for (let i = 29; i >= 0; i--) {

        const fecha = new Date(hoy);

        fecha.setDate(
            fecha.getDate() - i
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

    const canvas =
        document.getElementById("chartHoy1");


    if (!canvas) return;

    if (chartHoy1Instance) {
        chartHoy1Instance.destroy();
    }
    const diasMostrar = 30;

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

function crearGraficoHoyRGU(data) {
    if (!data || data.length === 0) return;

    // Helper para extraer YYYY-MM-DD sin desfase por zona horaria/UTC
    const obtenerFechaKey = (item) => {
        const raw = item.Fecha || item.Origen; // Usa primero el campo por el que filtraste
        if (!raw) return null;

        // Si es string ISO o con hora, tomamos solo la parte de la fecha
        const str = String(raw).trim();
        const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : null;
    };

    // 1. Extraer claves válidas
    const fechasValidas = new Set();
    data.forEach(item => {
        const key = obtenerFechaKey(item);
        if (key) fechasValidas.add(key);
    });

    if (fechasValidas.size === 0) return;

    // 2. Determinar el rango de fechas
    const fechasOrdenadas = Array.from(fechasValidas).sort();
    const [minY, minM, minD] = fechasOrdenadas[0].split('-').map(Number);
    const [maxY, maxM, maxD] = fechasOrdenadas[fechasOrdenadas.length - 1].split('-').map(Number);

    const fechaInicio = new Date(minY, minM - 1, minD);
    const fechaFin = new Date(maxY, maxM - 1, maxD);

    const labels = [];
    const valores = [];
    const diasSemana = ["Dom", "Lun", "Mar", "Miér", "Jue", "Vie", "Sáb"];

    // 3. Recorrer día a día
    let cursor = new Date(fechaInicio);

    while (cursor <= fechaFin) {
        const year = cursor.getFullYear();
        const month = String(cursor.getMonth() + 1).padStart(2, '0');
        const day = String(cursor.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;

        const tecnicos = {};

        data.forEach(item => {
            const itemKey = obtenerFechaKey(item);
            if (itemKey !== key) return;

            const estado = (item.Estado || "").toString().trim().toLowerCase();
            if (estado !== "completado" && estado !== "no realizada") return;

            let tecnico = (item.Tecnico || "").toString().trim().toUpperCase();
            if (!tecnico) return;
            tecnico = tecnico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            let rgu = item.RGU ?? 0;
            if (typeof rgu === "string") rgu = rgu.replace(",", ".").trim();
            rgu = Number(rgu) || 0;

            if (!(tecnico in tecnicos)) tecnicos[tecnico] = 0;
            tecnicos[tecnico] += rgu;
        });

        const listaTecnicos = Object.keys(tecnicos);
        let promedio = 0;

        if (listaTecnicos.length > 0) {
            let suma = 0;
            listaTecnicos.forEach(tec => { suma += tecnicos[tec]; });
            promedio = suma / listaTecnicos.length;
        }

        labels.push([diasSemana[cursor.getDay()], `${day}/${month}`]);
        valores.push(Number(promedio.toFixed(1)));

        cursor.setDate(cursor.getDate() + 1);
    }

    // 4. Renderizado Chart.js
    const canvas = document.getElementById("chartHoy2");
    if (!canvas) return;

    if (typeof chartHoy2Instance !== "undefined" && chartHoy2Instance) {
        chartHoy2Instance.destroy();
    }

    chartHoy2Instance = new Chart(canvas.getContext("2d"), {
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
                    font: { size: 11, weight: "bold", family: "Segoe UI, sans-serif" },
                    formatter: value => value !== null ? value.toString().replace(".", ",") : ""
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            layout: { padding: { top: 25, bottom: 5, left: 10, right: 10 } },
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
                y: { display: false, beginAtZero: true, grace: "0%" }
            }
        }
    });

    setTimeout(() => {
        if (typeof moverScrollGraficosAlFinal === "function") {
            moverScrollGraficosAlFinal();
        }
    }, 100);
}

function crearGraficoHoyDuracion(data) {

    const labels = [];
    const valores = [];

    const hoy = new Date();

    for (let i = 29; i >= 0; i--) {

        const fecha = new Date(hoy);

        fecha.setDate(
            fecha.getDate() - i
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

    const canvas =
        document.getElementById("chartHoy3");

    if (!canvas) return;

    if (chartHoy3Instance) {
        chartHoy3Instance.destroy();
    }
    const diasMostrar = 30;

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

function moverScrollGraficosAlFinal() {
    document.querySelectorAll(".chart-scroll").forEach(scroll => {
        scroll.scrollLeft = scroll.scrollWidth;
    });
}

// 3 Graficos de Alta - Traslado - Migración
function crearGraficoHoyProduccionAltas(data) {
    const labels = [];
    const porcentajes = [];
    const hoy = new Date();

    for (let i = 29; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
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

function crearGraficoHoyRGUAltas(data) {
    const labels = [];
    const valores = [];

    // 1. Fijar medianoche local para evitar saltos de zona horaria
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);

        // Clave YYYY-MM-DD
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;

        const tecnicos = {};

        data.forEach(item => {
            // Filtro por Tipo de Actividad
            const tipo = (item.Tipo_de_Actividad || "").toString().trim().toLowerCase();
            if (tipo !== "alta" && tipo !== "alta traslado" && tipo !== "migración" && tipo !== "migracion") return;

            // Extracción segura de fecha YYYY-MM-DD
            const fechaRaw = item.Origen || item.Fecha;
            if (!fechaRaw) return;

            const rawStr = String(fechaRaw).trim();
            const itemKey = rawStr.length >= 10 ? rawStr.substring(0, 10) : "";
            if (itemKey !== key) return;

            // Filtro de Estado (coincide con el WHERE de SQL)
            const estado = (item.Estado || "").toString().trim().toLowerCase();
            if (estado !== "completado" && estado !== "no realizada") return;

            // Normalización de Técnico: Mayúsculas y sin acentos
            let tecnico = (item.Tecnico || "").toString().trim().toUpperCase();
            if (!tecnico) return;
            tecnico = tecnico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            // Parsear RGU
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

function crearGraficoHoyDuracionAltas(data) {
    const labels = [];
    const valores = [];
    const hoy = new Date();

    for (let i = 29; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
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