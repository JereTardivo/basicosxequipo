
// IMPORTS
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Pencil, Trash2, PhoneCall, FileSpreadsheet, LogIn, LogOut, Building, Users } from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

export default function App() {
  const [data, setData] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [equipoFilter, setEquipoFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("equipoSeleccionado") || "";
    }
    return "";
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({ motivo: "", descripcion: "", ticket: "" });
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [errors, setErrors] = useState({});
  const [loginModal, setLoginModal] = useState(false);
  const [login, setLogin] = useState({ user: "", pass: "" });
  const [loginError, setLoginError] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [nuevoNombreEmpresa, setNuevoNombreEmpresa] = useState("");
  const [nuevoEquipoEmpresa, setNuevoEquipoEmpresa] = useState("");

  const credencialesEquipos = {
    "equipo1": { pass: "eq1bx2025", equipo: "Equipo 1" },
    "equipo2": { pass: "eq2bx2025", equipo: "Equipo 2" },
    "equipo3": { pass: "eq3bx2025", equipo: "Equipo 3" },
    "equipo4": { pass: "eq4bx2025", equipo: "Equipo 4" },
    "equipo5": { pass: "eq5bx2025", equipo: "Equipo 5" },
    "equipo-corralon": { pass: "corralon25", equipo: "Equipo Corralon" },
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const equipoGuardado = localStorage.getItem("equipoSeleccionado");
      const logueado = localStorage.getItem("isLogged") === "true";
      if (equipoGuardado) setEquipoFilter(equipoGuardado);
      if (logueado) setIsLogged(true);
      const nombreGuardado = localStorage.getItem("nombreUsuario");
      if (nombreGuardado) setNombreUsuario(nombreGuardado);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("equipoSeleccionado", equipoFilter);
      localStorage.setItem("isLogged", isLogged);
      localStorage.setItem("nombreUsuario", nombreUsuario);
    }
  }, [equipoFilter, isLogged]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "empresas"));
        const firebaseData = querySnapshot.docs.map((doc) => doc.data());
        setData(firebaseData);
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("equipoSeleccionado", equipoFilter);
      localStorage.setItem("isLogged", isLogged);
      localStorage.setItem("nombreUsuario", nombreUsuario);
    }
  }, [equipoFilter, isLogged]);

  const handleLogout = () => {
    setIsLogged(false);
    setEquipoFilter("");
    setNombreUsuario("");
    localStorage.removeItem("isLogged");
    localStorage.removeItem("equipoSeleccionado");
  };

  const handleLogin = () => {
    const usuarioIngresado = login.user.trim().toLowerCase();
    const claveIngresada = login.pass.trim();

    if (usuarioIngresado === "flexxus" && claveIngresada === "1926") {
      setIsLogged(true);
      setLoginModal(false);
      setLoginError("");
      setEquipoFilter("");
      setNombreUsuario("");
      setNombreUsuario("Flexxus");
    } else if (
      credencialesEquipos[usuarioIngresado] &&
      credencialesEquipos[usuarioIngresado].pass === claveIngresada
    ) {
      setIsLogged(true);
      setLoginModal(false);
      setLoginError("");
      const equipoNombre = credencialesEquipos[usuarioIngresado].equipo;
      setEquipoFilter(equipoNombre);
      setNombreUsuario(equipoNombre);
    } else {
      setLoginError("Usuario o contraseña incorrectos");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);

      // Borrar todos los documentos anteriores
      const snapshot = await getDocs(collection(db, "empresas"));
      snapshot.forEach(async (docu) => {
        await deleteDoc(doc(db, "empresas", docu.id));
      });

      const newData = json.map((row) => ({
        empresa: row.EMPRESA,
        equipo: row.EQUIPO.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
        llamadas: [],
      }));

      setData(newData);
      for (const row of newData) {
        const docId = row.empresa;
        await setDoc(doc(db, "empresas", docId), row);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleAddLlamadaClick = (empresa) => {
    setSelectedEmpresa(empresa);
    setFormValues({ motivo: "", descripcion: "", ticket: "" });
    setErrors({});
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    const newErrors = {};
    if (!formValues.motivo || formValues.motivo.length > 50) {
      newErrors.motivo = "Máx. 50 caracteres alfanuméricos";
    }
    if (!formValues.descripcion || formValues.descripcion.length > 250) {
      newErrors.descripcion = "Máx. 250 caracteres alfanuméricos";
    }
    if (!/^\d{6}$/.test(formValues.ticket)) {
      newErrors.ticket = "Ticket debe tener 6 dígitos numéricos";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updated = data.map((item) => {
      if (item.empresa === selectedEmpresa && item.llamadas.length < 5) {
        const nuevas = [...item.llamadas, { ...formValues }];
        const updatedItem = { ...item, llamadas: nuevas };
        const docId = item.empresa;
        setDoc(doc(db, "empresas", docId), updatedItem);
        return updatedItem;
      }
      return item;
    });

    setData(updated);
    setModalOpen(false);
  };

  const filteredData = data.filter((item) => {
    const empresaItem = (item.empresa || "").toLowerCase();
    const equipoItem = (item.equipo || "").toLowerCase();
    const empresaFiltro = (empresaFilter || "").toLowerCase();
    const equipoFiltro = (equipoFilter || "").toLowerCase();

    return (!equipoFiltro || equipoItem === equipoFiltro) &&
      (!empresaFiltro || empresaItem.includes(empresaFiltro));
  });


  const handleAddEmpresa = () => {
    setNuevoNombreEmpresa("");
    setNuevoEquipoEmpresa(nombreUsuario); // ← ya deja el equipo cargado
    setModalAddOpen(true);
  };

  const confirmAddEmpresa = async () => {
    const nombre = nuevoNombreEmpresa.trim();
    if (!nombre) return;
    const docId = nombre;
    const nueva = {
      empresa: nombre,
      equipo: nuevoEquipoEmpresa,
      llamadas: [],
    };
    await setDoc(doc(db, "empresas", docId), nueva);
    setData([...data, nueva]);
    setModalAddOpen(false);
  };

  const handleEditEmpresa = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setNuevoNombreEmpresa(empresa);
    setModalEditOpen(true);

  };

  const confirmEditEmpresa = async () => {

    const nuevoNombre = nuevoNombreEmpresa.trim();

    if (!nuevoNombre || !empresaSeleccionada) return;

    const empresaOriginal = data.find(e =>
      e.empresa === empresaSeleccionada &&
      (nombreUsuario === "Flexxus" || e.equipo === equipoFilter)
    );

    if (!empresaOriginal) return;

    const nuevo = { ...empresaOriginal, empresa: nuevoNombre };
    const oldDocId = empresaOriginal.empresa;
    const newDocId = nuevoNombre;

    try {
      await deleteDoc(doc(db, "empresas", oldDocId));
      await setDoc(doc(db, "empresas", newDocId), nuevo);

      const updated = data.map(e =>
        e.empresa === empresaSeleccionada && e.equipo === empresaOriginal.equipo
          ? nuevo
          : e
      );

      setData(updated);
      setModalEditOpen(false);

    } catch (error) {
      console.error("Error al editar empresa:", error);
    }
  };

  const handleDeleteEmpresa = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setModalDeleteOpen(true);
  };

  const confirmDeleteEmpresa = async () => {
    const empresaObj = data.find(e => e.empresa === empresaSeleccionada);

    if (!empresaObj) {
      console.error("Empresa no encontrada para eliminar");
      return;
    }

    const equipoReal = empresaObj.equipo;
    const docId = empresaObj.empresa;

    try {
      await deleteDoc(doc(db, "empresas", docId));
      console.log("Eliminado correctamente:", docId);
      setData(data.filter(e => !(e.empresa === empresaObj.empresa && e.equipo === equipoReal)));
      setModalDeleteOpen(false);
    } catch (error) {
      console.error("Error al eliminar empresa de Firebase:", error);
    }
  };


  const esFormularioValido = nuevoNombreEmpresa.trim() !== "" && nuevoEquipoEmpresa !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-gray-200 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center w-full">Gestión de Llamadas a Clientes con Soporte Básico</h1>
        <div className="absolute top-4 right-4 flex gap-3 items-center">
          {nombreUsuario && <span className="text-gray-200 font-semibold mr-2">{nombreUsuario}</span>}
          {isLogged ? (
            <LogOut className="text-red-400 cursor-pointer hover:text-red-600" size={28} onClick={handleLogout} />
          ) : (
            <LogIn className="text-green-400 cursor-pointer hover:text-green-600" size={28} onClick={() => setLoginModal(true)} />
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="flex items-center bg-gray-700 border border-gray-600 rounded-2xl-md px-2">
            <Building size={18} className="text-gray-200 mr-2" />
            <input type="text" placeholder="Filtrar por empresa" value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="bg-transparent outline-none text-gray-200 p-2 w-full" />
          </div>
          <div className="flex items-center bg-gray-700 border border-gray-600 rounded-2xl-md px-2">
            <Users size={18} className="text-gray-200 mr-2" />
            <select value={equipoFilter} onChange={(e) => setEquipoFilter(e.target.value)}
              className="bg-gray-700 text-gray-200 border-none p-2 w-full appearance-none">
              <option value="">Todos los equipos</option>
              <option value="Equipo 1">Equipo 1</option>
              <option value="Equipo 2">Equipo 2</option>
              <option value="Equipo 3">Equipo 3</option>
              <option value="Equipo 4">Equipo 4</option>
              <option value="Equipo 5">Equipo 5</option>
              <option value="Equipo Corralon">Equipo Corralon</option>
            </select>
          </div>
          {isLogged && (
            <Button
              className="bg-blue-600 text-gray-200 px-4 py-2 rounded-2xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
              onClick={handleAddEmpresa}
            >
              + Nueva Empresa
            </Button>
          )}
        </div>
        {isLogged && (
          <div className="relative group">
            <input type="file" id="excelUpload" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            <label htmlFor="excelUpload" className="cursor-pointer hover:scale-110 transition-transform duration-200">
              <FileSpreadsheet size={36} className="text-green-400" />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start auto-rows-min grid-flow-dense">
        {filteredData.map((item, index) => {
          const llamadasDisponibles = 5 - item.llamadas.length;
          const bgColor = llamadasDisponibles === 0 ? "bg-red-400/20" : "bg-green-400/20";
          return (

            <Card key={index} className={`${bgColor} hover:shadow-xl hover:scale-105 transition-transform duration-300`}>
              <div style={{ position: "relative" }}>
                {isLogged && (
                  <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setModalEditOpen(true);
                        setEmpresaSeleccionada(item.empresa);
                        setNuevoNombreEmpresa(item.empresa);
                        setNuevoEquipoEmpresa(item.equipo);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >

                    </button>
                    <button
                      onClick={() => {
                        setModalDeleteOpen(true);
                        setEmpresaSeleccionada(item.empresa);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >

                    </button>
                  </div>
                )}

                <CardContent className="p-6 relative pb-16">

                  <h2 className="text-xl font-bold tracking-wide">{item.empresa}</h2>
                  <p>Llamadas disponibles: {llamadasDisponibles}</p>
                  <ul className="pl-4">
  {item.llamadas.map((llamada, i) => (
    <div key={i} className="pb-2">
      <li className="ml-4">
        <strong>{llamada.motivo}</strong>: {llamada.descripcion} (Ticket: <a href={`https://soporte.flexxus.com.ar/tickets/${llamada.ticket}`} target="_blank" className="text-blue-400 underline hover:text-blue-300">{llamada.ticket}</a>)
      </li>
      {i !== item.llamadas.length - 1 && <hr className="border-gray-600 my-2" />}
    </div>
  ))}
</ul>

                  {isLogged && (item.equipo === equipoFilter || equipoFilter === "") && item.llamadas.length < 5 && (
                    <div className="absolute bottom-2 right-2">
                      <span
                        className="cursor-pointer"
                        title="AGREGAR LLAMADA"
                        onClick={() => handleAddLlamadaClick(item.empresa)}
                      >
                        <PhoneCall size={24} className="text-gray-200 hover:scale-110 transition-transform duration-200" />
                      </span>
                    </div>
                  )}

                  {isLogged && (nombreUsuario === "Flexxus" || item.equipo === equipoFilter) && (
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <span
                        className="cursor-pointer"
                        title="EDITAR EMPRESA"
                        onClick={() => handleEditEmpresa(item.empresa)}
                      >
                        <Pencil size={20} className="text-gray-200 hover:scale-110 transition-transform duration-200" />
                      </span>
                      <span
                        className="cursor-pointer"
                        title="ELIMINAR EMPRESA"
                        onClick={() => handleDeleteEmpresa(item.empresa)}
                      >
                        <Trash2 size={20} className="text-gray-200 hover:scale-110 transition-transform duration-200" />
                      </span>
                    </div>
                  )}

                </CardContent>

              </div>
            </Card>

          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Agregar llamada</h2>

            <label className="text-sm uppercase text-gray-400 text-gray-200 mb-1 block">Motivo</label>
            <input type="text" placeholder="Motivo" value={formValues.motivo}
              onChange={(e) => setFormValues({ ...formValues, motivo: e.target.value })}
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-1 p-2 rounded-2xl bg-gray-700 text-gray-200" />
            {errors.motivo && <p className="text-red-400 text-sm uppercase text-gray-400 mb-2">{errors.motivo}</p>}

            <label className="text-sm uppercase text-gray-400 text-gray-200 mb-1 block">Descripción</label>
            <textarea rows="3" placeholder="Descripción" value={formValues.descripcion}
              onChange={(e) => setFormValues({ ...formValues, descripcion: e.target.value })}
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-1 p-2 rounded-2xl bg-gray-700 text-gray-200 resize-none" />
            {errors.descripcion && <p className="text-red-400 text-sm uppercase text-gray-400 mb-2">{errors.descripcion}</p>}

            <label className="text-sm uppercase text-gray-400 text-gray-200 mb-1 block">Ticket (6 dígitos)</label>
            <input type="number" placeholder="123456" value={formValues.ticket}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setFormValues({ ...formValues, ticket: value });
              }}
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2 mb-3 p-2 rounded-2xl bg-gray-700 text-gray-200" />
            {errors.ticket && <p className="text-red-400 text-sm uppercase text-gray-400 mb-4">{errors.ticket}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="bg-red-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-red-600 focus:ring-2 focus:ring-red-400">
                Cancelar
              </button>
              <button onClick={handleModalSubmit} className="bg-green-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-green-600 focus:ring-2 focus:ring-green-400">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {loginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Iniciar sesión</h2>
            <input type="text" placeholder="Usuario" value={login.user}
              onChange={(e) => setLogin({ ...login, user: e.target.value })}
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-3 p-2 rounded-2xl bg-gray-700 text-gray-200" />
            <input type="password" placeholder="Contraseña" value={login.pass}
              onChange={(e) => setLogin({ ...login, pass: e.target.value })}
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-3 p-2 rounded-2xl bg-gray-700 text-gray-200" />
            {loginError && <p className="text-red-400 text-sm uppercase text-gray-400 mb-2">{loginError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setLoginModal(false)} className="bg-red-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-red-600 focus:ring-2 focus:ring-red-400">
                Cancelar
              </button>
              <button onClick={handleLogin} className="bg-green-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-green-600 focus:ring-2 focus:ring-green-400">
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA EMPRESA */}
      {modalAddOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar nueva empresa</h2>
            <input
              type="text"
              value={nuevoNombreEmpresa}
              onChange={(e) => setNuevoNombreEmpresa(e.target.value)}
              placeholder="Nombre de la empresa"
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full p-2 rounded-2xl bg-gray-700 text-gray-200 mb-4"
            />
            {nombreUsuario === "Flexxus" ? (
              <select
                value={nuevoEquipoEmpresa}
                onChange={(e) => setNuevoEquipoEmpresa(e.target.value)}
                className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full p-2 rounded-2xl bg-gray-700 text-gray-200 mb-4"
              >
                <option value="">Seleccionar equipo</option>
                <option value="Equipo 1">Equipo 1</option>
                <option value="Equipo 2">Equipo 2</option>
                <option value="Equipo 3">Equipo 3</option>
                <option value="Equipo 4">Equipo 4</option>
                <option value="Equipo 5">Equipo 5</option>
                <option value="Equipo Corralon">Equipo Corralon</option>
              </select>
            ) : (
              <select
                value={nuevoEquipoEmpresa}
                disabled
                className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full p-2 rounded-2xl bg-gray-700 text-gray-200 mb-4 opacity-60 cursor-not-allowed"
              >
                <option value={nombreUsuario}>{nombreUsuario}</option>
              </select>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalAddOpen(false)} className="bg-red-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-red-600 focus:ring-2 focus:ring-red-400">Cancelar</button>
              <button
                onClick={confirmAddEmpresa}
                disabled={!esFormularioValido}
                className={`px-4 py-2 rounded-2xl text-gray-200 ${esFormularioValido
                  ? "bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-400"
                  : "bg-green-500 opacity-50 cursor-not-allowed"
                  }`}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR EMPRESA */}
      {modalEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar nombre de empresa</h2>
            <input
              type="text"
              value={nuevoNombreEmpresa}
              onChange={(e) => setNuevoNombreEmpresa(e.target.value)}
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full p-2 rounded-2xl bg-gray-700 text-gray-200 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalEditOpen(false)} className="bg-red-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-red-600 focus:ring-2 focus:ring-red-400">Cancelar</button>
              <button onClick={confirmEditEmpresa} className="bg-yellow-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-yellow-600">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR EMPRESA */}
      {modalDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-400">Eliminar empresa</h2>
            <p className="text-gray-200 mb-6">¿Estás seguro de que querés eliminar "{empresaSeleccionada}"?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalDeleteOpen(false)} className="bg-gray-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-gray-600">Cancelar</button>
              <button onClick={confirmDeleteEmpresa} className="bg-red-600 text-gray-200 px-4 py-2 rounded-2xl hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

}