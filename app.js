// =========================================================
// BASE DE DATOS LOCAL (LocalStorage)
// =========================================================
let inventario = JSON.parse(localStorage.getItem('inventario')) || [
    { id: 1, nombre: 'CABLE USB A-B 4.5 MANHATTAN', stock: 15 },
    { id: 2, nombre: 'CABLE USB DE 1.8 M', stock: 20 }
];

let nombresGuardados = JSON.parse(localStorage.getItem('nombres_guardados')) || [
    "Jaqueline Rafael Anastasio",
    "EZEQUIEL LÓPEZ LÓPEZ"
];

let historial = JSON.parse(localStorage.getItem('historial_entregas')) || [];
let productosEnVale = [];

// =========================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const inputFecha = document.getElementById('fecha');
    if (inputFecha) {
        inputFecha.valueAsDate = new Date();
    }
    renderizarInventario();
    actualizarSelectProductos();
    actualizarListasAutocompletado();
});

function guardarDB() {
    localStorage.setItem('inventario', JSON.stringify(inventario));
    localStorage.setItem('historial_entregas', JSON.stringify(historial));
    localStorage.setItem('nombres_guardados', JSON.stringify(nombresGuardados));
}

function formatearFechaLatina(fechaStr) {
    if (!fechaStr) return '____/____/________';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
}

// =========================================================
// GESTIÓN DE CATÁLOGO E INVENTARIO (CREAR, EDITAR, BORRAR)
// =========================================================
function renderizarInventario() {
    const tbody = document.querySelector('#inventory-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    inventario.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td><strong>${item.stock}</strong></td>
            <td style="display: flex; gap: 5px;">
                <button type="button" onclick="cargarEdicionProducto(${item.id})" class="btn-primary" style="padding: 3px 8px; font-size: 0.8em;">Editar</button>
                <button type="button" onclick="eliminarProducto(${item.id})" class="btn-secondary" style="padding: 3px 8px; font-size: 0.8em; background-color: #dc3545;">Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function cargarEdicionProducto(id) {
    const producto = inventario.find(i => i.id === id);
    if (!producto) return;

    document.getElementById('edit-prod-id').value = producto.id;
    document.getElementById('nuevo-prod-nombre').value = producto.nombre;
    document.getElementById('nuevo-prod-stock').value = producto.stock;

    document.getElementById('catalog-title').textContent = "Actualizar Material";
    document.getElementById('btn-save-catalog').textContent = "Guardar Cambios";
    document.getElementById('btn-cancel-edit').style.display = "inline-block";
}

function cancelarEdicionCatalogo() {
    const editInput = document.getElementById('edit-prod-id');
    if (editInput) editInput.value = "";
    
    document.getElementById('catalog-form').reset();
    document.getElementById('catalog-title').textContent = "Catálogo e Inventario";
    document.getElementById('btn-save-catalog').textContent = "Agregar al Catálogo";
    document.getElementById('btn-cancel-edit').style.display = "none";
}

document.getElementById('catalog-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const editInput = document.getElementById('edit-prod-id');
    const editId = editInput ? editInput.value : "";
    const nombre = document.getElementById('nuevo-prod-nombre').value.trim();
    const stock = parseInt(document.getElementById('nuevo-prod-stock').value);

    if (editId) {
        const producto = inventario.find(i => i.id === parseInt(editId));
        if (producto) {
            producto.nombre = nombre;
            producto.stock = stock;
        }
    } else {
        const existente = inventario.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
        if (existente) {
            existente.stock += stock;
        } else {
            inventario.push({ id: Date.now(), nombre: nombre, stock: stock });
        }
    }

    guardarDB();
    renderizarInventario();
    actualizarSelectProductos();
    cancelarEdicionCatalogo();
});

function eliminarProducto(id) {
    const producto = inventario.find(i => i.id === id);
    if (!producto) return;

    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}" del catálogo?`)) {
        inventario = inventario.filter(i => i.id !== id);
        const editInput = document.getElementById('edit-prod-id');
        if (editInput && editInput.value == id) {
            cancelarEdicionCatalogo();
        }
        guardarDB();
        renderizarInventario();
        actualizarSelectProductos();
    }
}

// =========================================================
// SELECTORES Y AUTOCOMPLETADO
// =========================================================
function actualizarSelectProductos() {
    const select = document.getElementById('producto-select');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione un material...</option>';

    inventario.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.nombre} (Stock: ${item.stock})`;
        select.appendChild(option);
    });
}

function actualizarListasAutocompletado() {
    const listResp = document.getElementById('lista-responsables');
    const listPers = document.getElementById('lista-personal');
    if (!listResp || !listPers) return;

    listResp.innerHTML = '';
    listPers.innerHTML = '';

    nombresGuardados.forEach(nombre => {
        const opt1 = document.createElement('option');
        opt1.value = nombre;
        listResp.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = nombre;
        listPers.appendChild(opt2);
    });
}

// =========================================================
// LISTA TEMPORAL DE PRODUCTOS EN EL VALE
// =========================================================
function agregarProductoAEntrega() {
    const select = document.getElementById('producto-select');
    const prodId = parseInt(select.value);
    const cantidadInput = document.getElementById('cantidad');
    const cantidad = parseInt(cantidadInput.value);

    if (!prodId || isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor selecciona un material y una cantidad válida.');
        return;
    }

    const productoOriginal = inventario.find(i => i.id === prodId);
    const yaAgregado = productosEnVale.find(p => p.id === prodId);
    const cantidadTotalSolicitada = (yaAgregado ? yaAgregado.cantidad : 0) + cantidad;

    if (cantidadTotalSolicitada > productoOriginal.stock) {
        alert(`Stock insuficiente de "${productoOriginal.nombre}". Quedan ${productoOriginal.stock}.`);
        return;
    }

    if (yaAgregado) {
        yaAgregado.cantidad += cantidad;
    } else {
        productosEnVale.push({
            id: productoOriginal.id,
            nombre: productoOriginal.nombre,
            cantidad: cantidad
        });
    }

    cantidadInput.value = 1;
    renderizarTablaValeTemporal();
}

function renderizarTablaValeTemporal() {
    const tbody = document.querySelector('#tabla-vale-temporal tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    let totalPiezas = 0;

    productosEnVale.forEach((item, index) => {
        totalPiezas += item.cantidad;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td><strong>${item.cantidad}</strong></td>
            <td>
                <button type="button" onclick="quitarProductoDelVale(${index})" style="background:#dc3545; color:white; border:none; border-radius:3px; cursor:pointer;">X</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('total-piezas-vale').textContent = totalPiezas;
}

function quitarProductoDelVale(index) {
    productosEnVale.splice(index, 1);
    renderizarTablaValeTemporal();
}

// =========================================================
// PROCESAR ENTREGA E IMPRIMIR (LLENO Y EN BLANCO)
// =========================================================
document.getElementById('delivery-form').addEventListener('submit', (e) => {
    e.preventDefault();

    if (productosEnVale.length === 0) {
        alert('Agrega al menos un producto a la lista con el botón "+ Agregar".');
        return;
    }

    const fecha = document.getElementById('fecha').value;
    const responsable = document.getElementById('responsable').value.trim();
    const recibe = document.getElementById('recibe').value.trim();
    const area = document.getElementById('area').value.trim();

    if (!nombresGuardados.includes(responsable)) nombresGuardados.push(responsable);
    if (!nombresGuardados.includes(recibe)) nombresGuardados.push(recibe);

    productosEnVale.forEach(itemVale => {
        const prodInv = inventario.find(i => i.id === itemVale.id);
        if (prodInv) prodInv.stock -= itemVale.cantidad;
    });

    let descripcionLista = productosEnVale.map(p => `${p.nombre} (Cant: ${p.cantidad})`).join(', ');
    let sumaTotalPiezas = productosEnVale.reduce((sum, p) => sum + p.cantidad, 0);

    historial.push({
        id: Date.now(),
        fecha, responsable, recibe, area,
        productos: productosEnVale,
        totalPiezas: sumaTotalPiezas
    });

    guardarDB();
    renderizarInventario();
    actualizarSelectProductos();
    actualizarListasAutocompletado();

    document.getElementById('p-fecha').textContent = formatearFechaLatina(fecha);
    document.getElementById('p-responsable').textContent = recibe;
    document.getElementById('p-descripcion').textContent = descripcionLista;
    document.getElementById('p-area').textContent = area;
    document.getElementById('p-cantidad').textContent = sumaTotalPiezas;
    document.getElementById('p-entrega-nombre').textContent = responsable;
    document.getElementById('p-recibe-nombre').textContent = recibe;

    window.print();

    productosEnVale = [];
    renderizarTablaValeTemporal();
});

// FUNCIÓN CORREGIDA PARA IMPRIMIR EN BLANCO
function imprimirEnBlanco() {
    document.getElementById('p-fecha').textContent = '____/____/________';
    document.getElementById('p-responsable').innerHTML = '&nbsp;';
    document.getElementById('p-descripcion').innerHTML = '&nbsp;';
    document.getElementById('p-area').innerHTML = '&nbsp;';
    document.getElementById('p-cantidad').innerHTML = '&nbsp;';
    document.getElementById('p-entrega-nombre').innerHTML = '&nbsp;';
    document.getElementById('p-recibe-nombre').innerHTML = '&nbsp;';

    window.print();
}