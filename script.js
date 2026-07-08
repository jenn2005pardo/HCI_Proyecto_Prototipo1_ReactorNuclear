// Variables de Estado del Núcleo Físico
let temperaturaActual = 385;
let nivelAgua = 65;
let pasoActualSecuencia = 1;
let tiempoRestante = 30;
let simulacionActiva = true;
let proteccionScramLevantada = false;
let reactorApagadoCompletamente = false;
let altaPresionActiva = false;

// Relojes de control asíncrono
let intervaloTiempo = null;
let intervaloFluctuacion = null;

// Inicialización de la simulación
function iniciarSimulador() {
  tiempoRestante = 30;
  pasoActualSecuencia = 1;
  temperaturaActual = 385;
  nivelAgua = 65;
  simulacionActiva = true;
  proteccionScramLevantada = false;
  reactorApagadoCompletamente = false;
  altaPresionActiva = false;

  // Resetear interfaz visual de pasos secuenciales
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    stepEl.className =
      "shutdown-step border-2 border-outline-variant bg-surface-container-lowest p-4 relative transition-all duration-300";
    const badge = stepEl.querySelector(".step-badge");
    badge.className =
      "step-badge bg-outline-variant text-on-surface-variant px-2 py-1 font-label-caps text-[10px]";
    const btn = stepEl.querySelector("button");
    btn.className =
      "w-full py-2 bg-surface-variant text-on-surface border border-outline font-bold font-label-caps text-[12px] hover:bg-surface-container-high transition-all";
    btn.textContent = obtenerNombreBotonOriginal(i);
    const icon = stepEl.querySelector(".step-icon");
    icon.textContent = obtenerIconoOriginal(i);
    icon.className =
      "step-icon material-symbols-outlined text-on-surface-variant";
  }

  actualizarEstiloPasoActivo(1);

  // Resetear Compuerta Física
  const guard = document.getElementById("scram-guard");
  guard.style.transform = "none";
  guard.style.opacity = "1";
  guard.classList.remove("hidden");
  document.getElementById("icono-candado-scram").textContent = "lock";
  document.getElementById("texto-guard-scram").textContent =
    "COMPUERTA DE SEGURIDAD";

  document.getElementById("modal-fin").classList.add("hidden");

  // Bucle Principal del Tiempo (Controlador del Reloj del Test A/B)
  if (intervaloTiempo) clearInterval(intervaloTiempo);
  if (intervaloFluctuacion) clearInterval(intervaloFluctuacion);

  intervaloTiempo = setInterval(() => {
    if (!simulacionActiva) return;

    // LÓGICA DE PRESIÓN/TEMPERATURA SOBRE EL RELOJ:
    // Si hay alta presión o temperatura crítica, el tiempo corre el DOBLE o TRIPLE de rápido.
    let factorDesestabilizacion = 1;
    if (altaPresionActiva) factorDesestabilizacion += 1;
    if (temperaturaActual > 400) factorDesestabilizacion += 1;

    tiempoRestante -= factorDesestabilizacion;
    if (tiempoRestante < 0) tiempoRestante = 0;

    document.getElementById("texto-tiempo").textContent = tiempoRestante + "s";
    document.getElementById("barra-tiempo").style.width =
      (tiempoRestante / 30) * 100 + "%";

    if (tiempoRestante <= 0) {
      finalizarSimulacion(
        false,
        "¡EXPLOSIÓN NUCLEAR! El reactor colapsó debido a que el tiempo llegó a cero. Las barras se fundieron y la horda zombie mutó por la radiación siberiana.",
      );
    }
  }, 1000);

  // Bucle de fluctuación física ambiental (Sujeta a variables de agua)
  intervaloFluctuacion = setInterval(() => {
    if (!simulacionActiva) return;

    // Si el nivel de agua disminuye, la temperatura sube rápidamente
    if (nivelAgua < 35) {
      temperaturaActual += 6;
    } else if (nivelAgua >= 35 && nivelAgua < 70) {
      temperaturaActual += 2;
    } else {
      // Nivel alto de agua contiene el incremento básico
      temperaturaActual += Math.random() > 0.5 ? 1 : -1;
    }

    temperaturaActual = Math.round(temperaturaActual);
    evaluarPresionYAgua();
    actualizarInterfazTermica();
  }, 1000);

  notificarGuia(
    "¡SISTEMA EN RIESGO! Ingrese agua fría para bajar la temperatura y ganar tiempo valioso, pero vigile la presión.",
    "normal",
  );
}

function obtenerNombreBotonOriginal(paso) {
  if (paso === 1) return "FINALIZAR TURBINAS";
  if (paso === 2) return "VENTILAR RADIACIÓN";
  if (paso === 3) return "EQUILIBRAR REFRIGERANTE";
  return "APAGAR REACTOR";
}

function obtenerIconoOriginal(paso) {
  if (paso === 1) return "mode_fan";
  if (paso === 2) return "air";
  if (paso === 3) return "water_damage";
  return "power_off";
}

// INYECCIÓN DE AGUA FRÍA: Baja la temperatura y DA MÁS TIEMPO, pero sube el nivel (Presión)
function ingresarAguaFria() {
  if (!simulacionActiva) return;

  nivelAgua = Math.min(100, nivelAgua + 12);
  temperaturaActual = Math.max(0, temperaturaActual - 40);

  // Incremento de tiempo por inyección exitosa de enfriamiento (Máximo 30s)
  tiempoRestante = Math.min(30, tiempoRestante + 3);

  evaluarPresionYAgua();
  actualizarInterfazTermica();
  notificarGuia(
    "Agua fría ingresada: Temperatura reducida. ¡Has ganado +3 segundos en el reloj de emergencia!",
    "normal",
  );
}

// DESFOGUE DE AGUA CALIENTE: Disminuye el nivel (Presión), pero hace subir la temperatura lentamente
function desfogarAguaCaliente() {
  if (!simulacionActiva) return;

  nivelAgua = Math.max(0, nivelAgua - 18);
  temperaturaActual = Math.min(500, temperaturaActual + 15);

  evaluarPresionYAgua();
  actualizarInterfazTermica();
  notificarGuia(
    "Válvulas abiertas: Desfogando agua hirviendo. Presión interna liberada.",
    "normal",
  );
}

// Monitoreo y control del estado de presión hidrostática (Heurística de Errores)
function evaluarPresionYAgua() {
  document.getElementById("coolant-fill").style.height = nivelAgua + "%";
  document.getElementById("coolant-val").textContent = nivelAgua + "%";

  const badgePresion = document.getElementById("badge-presion");
  const iconoAgua = document.getElementById("icono-agua");

  if (nivelAgua > 85) {
    altaPresionActiva = true;
    badgePresion.textContent = "ALERTA: ALTA PRESIÓN";
    badgePresion.className =
      "inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse";
    iconoAgua.className = "material-symbols-outlined text-error animate-bounce";
  } else if (nivelAgua < 30) {
    altaPresionActiva = false;
    badgePresion.textContent = "CRÍTICO: AGUA BAJA";
    badgePresion.className =
      "inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-600 text-white animate-pulse";
    iconoAgua.className = "material-symbols-outlined text-warning";
  } else {
    altaPresionActiva = false;
    badgePresion.textContent = "PRESIÓN NORMAL";
    badgePresion.className =
      "inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-950 text-green-400";
    iconoAgua.className = "material-symbols-outlined text-tertiary";
  }
}

function actualizarInterfazTermica() {
  const tempDisplay = document.getElementById("temp-display");
  const tempBar = document.getElementById("temp-bar");
  const mweDisplay = document.getElementById("mwe-display");

  tempDisplay.textContent = temperaturaActual + "°C";
  tempBar.style.width = Math.min(100, (temperaturaActual / 500) * 100) + "%";

  if (reactorApagadoCompletamente) {
    mweDisplay.textContent = "0";
    document.getElementById("mwe-bars").innerHTML = `
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
            <div class="w-3 h-8 bg-gray-600"></div>
        `;
  } else {
    let mweCalculados = Math.max(0, Math.round(temperaturaActual * 3.1));
    mweDisplay.textContent = mweCalculados.toLocaleString("es-ES");
  }

  if (temperaturaActual > 400 && !reactorApagadoCompletamente) {
    tempDisplay.className =
      "text-error font-data-lg text-display-xl tracking-tighter leading-none animate-pulse";
    tempBar.className =
      "absolute left-0 top-0 h-full bg-error transition-all duration-300";
    notificarGuia(
      `¡ALERTA TÉRMICA! Exceso de 400°C (${temperaturaActual}°C). El tiempo corre más rápido. ¡Inyecte agua fría ya!`,
      "critico",
    );
  } else if (altaPresionActiva) {
    notificarGuia(
      "¡ALERTA DE PRESIÓN CRÍTICA! Volumen superior al 85%. El tiempo se agota el doble de rápido. ¡Active el Desfogue!",
      "critico",
    );
  } else {
    tempDisplay.className =
      "text-secondary font-data-lg text-display-xl tracking-tighter leading-none";
    tempBar.className =
      "absolute left-0 top-0 h-full bg-secondary transition-all duration-300";
  }

  if (temperaturaActual >= 500) {
    finalizarSimulacion(
      false,
      "¡FUSIÓN TÉRMICA! La temperatura alcanzó el límite fatal de 500°C. Las paredes protectoras estallaron instantáneamente.",
    );
  }
}

// Manejador centralizado de mensajes de error de la guía (Heurísticas de Nielsen 9 y 10)
function notificarGuia(mensaje, tipo) {
  const contenedor = document.getElementById("contenedor-alerta");
  const texto = document.getElementById("texto-alerta");
  const sugerencia = document.getElementById("sugerencia-alerta");

  texto.textContent = mensaje.toUpperCase();

  if (tipo === "critico") {
    contenedor.className =
      "flex-1 bg-error-container border border-error p-3 rounded overflow-y-auto strobe-critical";
    sugerencia.className =
      "mt-2 pt-2 border-t border-on-error/20 font-body-md text-[11px] text-white font-bold";
    sugerencia.textContent =
      "SOLUCIÓN INMEDIATA: Balancee los niveles de agua usando Desfogue o Inyección según las alertas.";
  } else if (tipo === "error-secuencia") {
    contenedor.className =
      "flex-1 bg-yellow-950 border-2 border-yellow-500 p-3 rounded overflow-y-auto";
    sugerencia.className =
      "mt-2 pt-2 border-t border-yellow-500/30 font-body-md text-[11px] text-yellow-400 font-bold";
    sugerencia.textContent = `DIAGNÓSTICO: Resuelva el Paso ${pasoActualSecuencia} actualmente activo antes de presionar este componente.`;
  } else {
    contenedor.className =
      "flex-1 bg-surface-container-high border border-outline-variant p-3 rounded overflow-y-auto";
    sugerencia.className =
      "mt-2 pt-2 border-t border-outline-variant font-body-md text-[11px] text-secondary";
    sugerencia.textContent = `Estado actual del operador: Secuencia de mitigación en Paso ${pasoActualSecuencia} de 5.`;
  }
}

// Ejecución secuencial obligatoria del protocolo (Heurística 5: Prevención de errores)
function ejecutarPaso(numeroPaso) {
  if (!simulacionActiva) return;

  if (numeroPaso !== pasoActualSecuencia) {
    explicarErrorDeSecuencia(numeroPaso);
    return;
  }

  const pasoEl = document.getElementById(`step-${numeroPaso}`);
  pasoEl.className =
    "shutdown-step border-2 border-green-500 bg-green-500/10 p-4 relative transition-all duration-300";

  const badge = pasoEl.querySelector(".step-badge");
  badge.className =
    "step-badge bg-green-500 text-black px-2 py-1 font-label-caps text-[10px] font-bold";

  const btn = pasoEl.querySelector("button");
  btn.className =
    "w-full py-2 bg-green-500/20 text-green-400 font-bold font-label-caps text-[12px] cursor-default border border-green-500/40";
  btn.textContent = "COMPLETADO ✓";

  const icon = pasoEl.querySelector(".step-icon");
  icon.textContent = "check_circle";
  icon.className = "step-icon material-symbols-outlined text-green-500";

  if (numeroPaso === 1) {
    notificarGuia(
      "Paso 1 Completado: Turbinas eléctricas desacopladas con éxito. Proceda al Paso 2.",
      "normal",
    );
    pasoActualSecuencia = 2;
    actualizarEstiloPasoActivo(2);
  } else if (numeroPaso === 2) {
    notificarGuia(
      "Paso 2 Completado: Válvulas abiertas. Contenido radiactivo liberado. Proceda al Paso 3.",
      "normal",
    );
    pasoActualSecuencia = 3;
    actualizarEstiloPasoActivo(3);
  } else if (numeroPaso === 3) {
    nivelAgua = 45;
    evaluarPresionYAgua();
    notificarGuia(
      "Paso 3 Completado: Evacuación y balance hidráulico completado a niveles seguros. Proceda al Paso 4.",
      "normal",
    );
    pasoActualSecuencia = 4;
    actualizarEstiloPasoActivo(4);
  } else if (numeroPaso === 4) {
    reactorApagadoCompletamente = true;
    temperaturaActual = 40;
    actualizarInterfazTermica();
    document.getElementById("estado-secuencia").textContent =
      "ESTADO: REACTOR APAGADO - LISTO PARA SCRAM";
    document.getElementById("estado-secuencia").className =
      "font-label-caps text-[10px] text-green-400 font-bold";

    notificarGuia(
      "Paso 4 Completado: Reacción nuclear apagada con éxito. Abra la compuerta de seguridad abajo a la derecha y presione SCRAM.",
      "normal",
    );
    pasoActualSecuencia = 5;

    document.getElementById("icono-candado-scram").textContent = "lock_open";
    document.getElementById("texto-guard-scram").innerHTML =
      "<span class='text-green-400'>COMPUERTA LIBERADA</span>";
  }
}

function actualizarEstiloPasoActivo(paso) {
  document.getElementById("estado-secuencia").textContent =
    `ESTADO: EJECUTANDO PASO ${paso}`;
  const pasoEl = document.getElementById(`step-${paso}`);
  pasoEl.className =
    "shutdown-step border-2 border-secondary bg-surface-container-highest p-4 relative transition-all duration-300 shadow-[0_0_15px_rgba(238,152,0,0.2)]";
  const badge = pasoEl.querySelector(".step-badge");
  badge.className =
    "step-badge bg-secondary text-on-secondary px-2 py-1 font-label-caps text-[10px] font-bold";
}

// Explicación de error avanzada interactiva (Heurística 9 - Solicitud de Actualización del usuario)
function explicarErrorDeSecuencia(pasoIntentado) {
  let mensajeExplicativo = "";

  if (pasoIntentado === 4) {
    switch (pasoActualSecuencia) {
      case 1:
        mensajeExplicativo =
          "No puedes apagar el reactor todavía porque las turbinas siguen encendidas y girando a alta revolución. Podrías causar una sobrecarga de inducción magnética. Primero debes completar el 'PASO 1: DETENER TURBINAS'.";
        break;
      case 2:
        mensajeExplicativo =
          "Acción denegada: La concentración de vapor radiactivo y gases es demasiado alta para apagar el sistema de forma segura. Falta realizar el proceso de descompresión. Complete primero el 'PASO 2: VENTILAR CONTENIDO'.";
        break;
      case 3:
        mensajeExplicativo =
          "Imposible apagar el reactor: Las barras refrigerantes se fundirán debido al agua estancada súper caliente. Falta renovar el caudal de refrigerante. Debe completar el 'PASO 3: EVACUAR E INGRESAR AGUA' antes.";
        break;
    }
  } else {
    if (pasoIntentado > pasoActualSecuencia) {
      mensajeExplicativo = `Operación denegada. Intentó presionar el Paso ${pasoIntentado}, pero el protocolo industrial exige completar estrictamente el Paso ${pasoActualSecuencia} primero.`;
    } else {
      mensajeExplicativo = `El Paso ${pasoIntentado} ya está cerrado y completado con éxito. Concéntrese en resolver el Paso ${pasoActualSecuencia}.`;
    }
  }

  notificarGuia(mensajeExplicativo, "error-secuencia");

  const contenedorErroneo = document.getElementById(`step-${pasoIntentado}`);
  contenedorErroneo.classList.add("border-red-500", "bg-red-950/30");
  setTimeout(() => {
    contenedorErroneo.classList.remove("border-red-500", "bg-red-950/30");
  }, 800);
}

// Protocolo de apertura del SCRAM
function levantarProteccionGuard() {
  if (pasoActualSecuencia < 5) {
    notificarGuia(
      "SISTEMA BLOQUEADO: La compuerta mecánica del SCRAM no responderá hasta que el reactor esté apagado (Completa el Paso 4).",
      "error-secuencia",
    );
    return;
  }

  const guard = document.getElementById("scram-guard");
  guard.style.transform = "translateY(-120%) rotateX(90deg)";
  guard.style.opacity = "0";
  proteccionScramLevantada = true;
  setTimeout(() => {
    guard.classList.add("hidden");
  }, 500);
  notificarGuia(
    "Compuerta abierta. El botón SCRAM de detención de emergencia final está expuesto. ¡PÚLSALO!",
    "normal",
  );
}

function intentarScramDirecto() {
  if (pasoActualSecuencia < 5) {
    notificarGuia(
      "SCRAM DENEGADO: El apagado inmediato causaría una explosión de vapor térmica destructiva si no se ventila ni se detienen las turbinas primero.",
      "error-secuencia",
    );
  } else if (!proteccionScramLevantada) {
    levantarProteccionGuard();
  } else {
    ejecutarScramFinal();
  }
}

function ejecutarScramFinal() {
  if (!simulacionActiva) return;

  if (pasoActualSecuencia < 5) {
    notificarGuia(
      "ACCIÓN CANCELADA: El botón de emergencia final está desenergizado hasta completar los 4 pasos previos en orden.",
      "error-secuencia",
    );
    return;
  }

  if (!proteccionScramLevantada) {
    notificarGuia(
      "Primero debes hacer clic en la compuerta metálica superior para poder pulsar el botón SCRAM.",
      "error-secuencia",
    );
    return;
  }

  finalizarSimulacion(
    true,
    `¡SISTEMA SALVADO EXITOSAMENTE! Mitigación completada con éxito quedando ${tiempoRestante}s en el reloj. El barrendero detuvo el desastre siberiano y la planta se estabilizó a 0 MWe de forma segura.`,
  );
}

function finalizarSimulacion(exito, descripcion) {
  simulacionActiva = false;
  clearInterval(intervaloTiempo);
  clearInterval(intervaloFluctuacion);

  const modal = document.getElementById("modal-fin");
  const contenido = document.getElementById("modal-contenido");
  const titulo = document.getElementById("modal-titulo");
  const desc = document.getElementById("modal-descripcion");

  modal.classList.remove("hidden");
  desc.textContent = descripcion;

  if (exito) {
    titulo.textContent = "✔ PLANTA ASEGURADA";
    titulo.className =
      "font-headline-lg text-2xl uppercase tracking-tighter mb-4 text-green-500 font-bold";
    contenido.className =
      "bg-surface-container-high border-4 border-green-500 p-8 max-w-md w-full text-center rounded shadow-2xl";

    document.getElementById("estado-ping").className =
      "w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]";
    document.getElementById("estado-texto").textContent =
      "REACTOR DETENIDO CON ÉXITO";
    reactorApagadoCompletamente = true;
    actualizarInterfazTermica();
  } else {
    titulo.textContent = "☠ COLAPSO DE LA PLANTA";
    titulo.className =
      "font-headline-lg text-2xl uppercase tracking-tighter mb-4 text-error font-bold";
    contenido.className =
      "bg-surface-container-high border-4 border-error p-8 max-w-md w-full text-center rounded shadow-2xl animate-bounce";

    document.getElementById("estado-ping").className =
      "w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]";
    document.getElementById("estado-texto").textContent =
      "CRÍTICO: NÚCLEO FUSIONADO";
  }
}

function reiniciarSimulacion() {
  window.location.reload(); // Recarga limpia para reiniciar estados de memoria del DOM
}

// Iniciar consola automáticamente al cargar
window.onload = iniciarSimulador;
