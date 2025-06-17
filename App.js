
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
import { FileSpreadsheet, LogIn, LogOut, Building, Users } from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

// COMPONENT
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

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("equipoSeleccionado", equipoFilter);
    }
  }, [equipoFilter]);
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

  const handleLogout = () => {
    setIsLogged(false);
  };

  const handleLogin = () => {
    if (login.user.toLowerCase() === "flexxus" && login.pass === "1926") {
      setIsLogged(true);
      setLoginModal(false);
      setLoginError("");
    } else {
      setLoginError("Credenciales incorrectas");
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
        const docId = `${row.empresa}_${row.equipo}`;
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
        const docId = `${item.empresa}_${item.equipo}`;
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center w-full">Gestión de Llamadas a Clientes con Soporte Básico</h1>
        <div className="absolute top-4 right-4 flex gap-3">
          {isLogged ? (
            <LogOut className="text-red-400 cursor-pointer hover:text-red-600" size={28} onClick={handleLogout} />
          ) : (
            <LogIn className="text-green-400 cursor-pointer hover:text-green-600" size={28} onClick={() => setLoginModal(true)} />
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md px-2">
            <Building size={18} className="text-white mr-2" />
            <input type="text" placeholder="Filtrar por empresa" value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="bg-transparent outline-none text-white p-2 w-full" />
          </div>
          <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md px-2">
            <Users size={18} className="text-white mr-2" />
            <select value={equipoFilter} onChange={(e) => setEquipoFilter(e.target.value)}
              className="bg-gray-800 text-white border-none p-2 w-full appearance-none">
              <option value="">Todos los equipos</option>
              <option value="Equipo 1">Equipo 1</option>
              <option value="Equipo 2">Equipo 2</option>
              <option value="Equipo 3">Equipo 3</option>
              <option value="Equipo 4">Equipo 4</option>
              <option value="Equipo 5">Equipo 5</option>
              <option value="Equipo Corralon">Equipo Corralon</option>
            </select>
          </div>
        </div>
        {isLogged && (
          <div className="relative group">
            <input type="file" id="excelUpload" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            <label htmlFor="excelUpload" className="cursor-pointer hover:scale-110 transition-transform">
              <FileSpreadsheet size={36} className="text-green-400" />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((item, index) => {
          const llamadasDisponibles = 5 - item.llamadas.length;
          const bgColor = llamadasDisponibles === 0 ? "bg-red-400/20" : "bg-green-400/20";
          return (
            <Card key={index} className={bgColor}>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold">{item.empresa}</h2>
                <p>Llamadas disponibles: {llamadasDisponibles}</p>
                <ul className="list-disc pl-4">
                  {item.llamadas.map((llamada, i) => (
                    <li key={i}>
                      <strong>{llamada.motivo}</strong>: {llamada.descripcion} (Ticket: {llamada.ticket})
                    </li>
                  ))}
                </ul>
                {llamadasDisponibles > 0 && (
                  <Button className="mt-2" onClick={() => handleAddLlamadaClick(item.empresa)}>
                    Agregar llamada
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Agregar llamada</h2>

            <label className="text-sm text-white mb-1 block">Motivo</label>
            <input type="text" placeholder="Motivo" value={formValues.motivo}
              onChange={(e) => setFormValues({ ...formValues, motivo: e.target.value })}
              className="w-full mb-1 p-2 rounded bg-gray-700 text-white" />
            {errors.motivo && <p className="text-red-400 text-sm mb-2">{errors.motivo}</p>}

            <label className="text-sm text-white mb-1 block">Descripción</label>
            <textarea rows="3" placeholder="Descripción" value={formValues.descripcion}
              onChange={(e) => setFormValues({ ...formValues, descripcion: e.target.value })}
              className="w-full mb-1 p-2 rounded bg-gray-700 text-white resize-none" />
            {errors.descripcion && <p className="text-red-400 text-sm mb-2">{errors.descripcion}</p>}

            <label className="text-sm text-white mb-1 block">Ticket (6 dígitos)</label>
            <input type="number" placeholder="123456" value={formValues.ticket}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setFormValues({ ...formValues, ticket: value });
              }}
              className="w-1/2 mb-3 p-2 rounded bg-gray-700 text-white" />
            {errors.ticket && <p className="text-red-400 text-sm mb-4">{errors.ticket}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Cancelar
              </button>
              <button onClick={handleModalSubmit} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {loginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Iniciar sesión</h2>
            <input type="text" placeholder="Usuario" value={login.user}
              onChange={(e) => setLogin({ ...login, user: e.target.value })}
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white" />
            <input type="password" placeholder="Contraseña" value={login.pass}
              onChange={(e) => setLogin({ ...login, pass: e.target.value })}
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white" />
            {loginError && <p className="text-red-400 text-sm mb-2">{loginError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setLoginModal(false)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Cancelar
              </button>
              <button onClick={handleLogin} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
