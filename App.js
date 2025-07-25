

// IMPORTS
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc, onSnapshot } from "firebase/firestore";
import { Pencil, Trash2, UserMinus, FileSpreadsheet, LogIn, LogOut, Building, Users, KeyRound, SortDesc, User, Briefcase, UserPlus, UserCog, Plus } from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const [data, setData] = useState([]);
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({ motivo: "", descripcion: "", ticket: "" });
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedEmpresaData, setSelectedEmpresaData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loginModal, setLoginModal] = useState(false);
  const [login, setLogin] = useState({ user: "", pass: "" });
  const [loginError, setLoginError] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [userDocId, setUserDocId] = useState("");
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [nuevoNombreEmpresa, setNuevoNombreEmpresa] = useState("");
  const [nuevoEquipoEmpresa, setNuevoEquipoEmpresa] = useState("");
  const [isFlexxus, setIsFlexxus] = useState(false);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [editLlamada, setEditLlamada] = useState({ motivo: "", descripcion: "", ticket: "" });
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ actual: "", nueva: "", repetir: "" });
  const [passwordError, setPasswordError] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", usuario: "", password: "", equipo: "" });
  const [mostrarEliminarUsuario, setMostrarEliminarUsuario] = useState(false);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [mostrarModificarUsuario, setMostrarModificarUsuario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [menuEmpresasVisible, setMenuEmpresasVisible] = useState(false);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [mostrarInformes, setMostrarInformes] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  const [menuInformesVisible, setMenuInformesVisible] = useState(false);


  const [equipoFilter, setEquipoFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("equipoSeleccionado") || "";
    }
    return "";
  });

  const fileInputRef = useRef(null);
  const menuEmpresasRef = useRef(null);
  const menuUsuariosRef = useRef(null);
  const menuInformesRef = useRef(null);
  const esFormularioValido = nuevoNombreEmpresa.trim() !== "" && nuevoEquipoEmpresa !== "";
  const mesActual = new Date().toLocaleDateString("es-AR", {
  month: "long",
  year: "numeric"
}).replace(" de ", " ").toLowerCase();


  const exportarUsuarios = async () => {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    const lista = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      lista.push({
        Nombre: data.nombre || "",
        Usuario: data.usuario || "",
        Password: data.password || "",
        Equipo: data.equipo || ""
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(lista);
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

    XLSX.writeFile(wb, "usuarios_exportados.xlsx");
  };

  const handleLogout = () => {
    setIsLogged(false);
    setEquipoFilter("");
    setNombreUsuario("");
    localStorage.removeItem("isLogged");
    localStorage.removeItem("equipoSeleccionado");
    localStorage.removeItem("isFlexxus");
  };

  const handleLogin = async () => {
    try {
      const docRef = doc(db, "usuarios", login.user.toLowerCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.password === login.pass) {
          setIsLogged(true);
          setNombreUsuario(data.nombre || data.usuario);
          setUserDocId(data.usuario);
          setEquipoFilter(data.equipo || "");
          setIsFlexxus(!data.equipo);
          localStorage.setItem("isFlexxus", (!data.equipo).toString());
          setLoginError("");
          setLoginModal(false);
          cargarMesesDisponibles();
        } else {
          setLoginError("Contraseña incorrecta.");
        }
      } else {
        setLoginError("Usuario no encontrado.");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setLoginError("Error al intentar iniciar sesión.");
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

      const snapshot = await getDocs(collection(db, "empresas"));
      const empresasEnFirebase = snapshot.docs.map((doc) => doc.id);
      const empresasEnExcel = json.map(row => row.EMPRESA);

      // Empresas a eliminar: están en Firebase pero no en Excel
      const empresasAEliminar = empresasEnFirebase.filter(id => !empresasEnExcel.includes(id));

      // Empresas a agregar: están en Excel pero no en Firebase
      const empresasAAgregar = empresasEnExcel.filter(nombre => !empresasEnFirebase.includes(nombre));

      // Eliminar empresas que ya no están en el Excel
      for (const id of empresasAEliminar) {
        await deleteDoc(doc(db, "empresas", id));
      }

      // Agregar solo empresas nuevas
      for (const row of json) {
        const nombre = row.EMPRESA;
        const equipo = row.EQUIPO.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

        if (empresasAAgregar.includes(nombre)) {
          await setDoc(doc(db, "empresas", nombre), {
            empresa: nombre,
            equipo,
            mes,
            llamadas: [],
          });
        }
      }

      // Volver a cargar datos actualizados desde Firebase
      const nuevoSnapshot = await getDocs(collection(db, "empresas"));
      const nuevasEmpresas = nuevoSnapshot.docs.map((doc) => doc.data());
      setData(nuevasEmpresas);
    };

    reader.readAsBinaryString(file);
  };


  const cargarMesesDisponibles = async () => {
    const snapshot = await getDocs(collection(db, "empresas"));
    const mesesSet = new Set();

    snapshot.forEach((docu) => {
      const empresaData = docu.data();
      empresaData.llamadas?.forEach((llamada) => {
        if (llamada.mes) {
          mesesSet.add(llamada.mes);
        }
      });
    });

    const mesesUnicos = Array.from(mesesSet).sort((a, b) => {
      const [mesA, añoA] = a.split(" ");
      const [mesB, añoB] = b.split(" ");
      const mesesOrden = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return (
        parseInt(añoA) - parseInt(añoB) ||
        mesesOrden.indexOf(mesA.toLowerCase()) - mesesOrden.indexOf(mesB.toLowerCase())
      );
    });

    setMesesDisponibles(mesesUnicos);
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
    if (!/\d{6}/.test(formValues.ticket)) {
      newErrors.ticket = "Ticket debe tener 6 dígitos numéricos";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updated = data.map((item) => {
      if (item.empresa === selectedEmpresa && item.llamadas.length < 5) {
        const mesActual = new Date().toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric"
        }).replace(" de ", " ");
        const nuevas = [...item.llamadas, { ...formValues, agente: nombreUsuario, mes: mesActual }];
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

  const exportarLlamadasPorMes = async (mesSeleccionado) => {
    const snapshot = await getDocs(collection(db, "empresas"));
    const llamadasFiltradas = [];

    snapshot.forEach((docu) => {
      const empresaData = docu.data();

      // Filtrar las llamadas de este mes
      const llamadasMes = empresaData.llamadas?.filter((llamada) => llamada.mes === mesSeleccionado) || [];

      llamadasMes.forEach((llamada) => {
        llamadasFiltradas.push({
          Empresa: empresaData.empresa,
          Equipo: empresaData.equipo,
          Agente: llamada.agente || "",
          Motivo: llamada.motivo,
          Descripción: llamada.descripcion,
          Ticket: llamada.ticket,
          Mes: llamada.mes,
          "Cantidad de llamadas en el mes": llamadasMes.length,
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(llamadasFiltradas);
    XLSX.utils.book_append_sheet(wb, ws, `Llamadas ${mesSeleccionado}`);
    XLSX.writeFile(wb, `informe_llamadas_${mesSeleccionado}.xlsx`);
  };

  const filteredData = data.filter((item) => {
    const empresaItem = (item.empresa || "").toLowerCase();
    const equipoItem = (item.equipo || "").toLowerCase();
    const empresaFiltro = (empresaFilter || "").toLowerCase();
    const equipoFiltro = (equipoFilter || "").toLowerCase();

    return (!equipoFiltro || equipoItem === equipoFiltro) &&
      (!empresaFiltro || empresaItem.includes(empresaFiltro));
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (orden === "nombre") {
      return a.empresa.localeCompare(b.empresa);
    } else if (orden === "llamadas") {
      return b.llamadas.length - a.llamadas.length;
    }
    return 0;
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

  const handleModalOpen = (empresa) => {
    console.log("Abriendo modal para:", empresa);
    const empresaData = data.find((e) => e.empresa === empresa);
    setSelectedEmpresa(empresa);
    setSelectedEmpresaData(empresaData);
    setModalOpen(true);
    setFormValues({ motivo: "", descripcion: "", ticket: "" });
  };

  const guardarEdicion = async (index) => {
    const empresaActual = selectedEmpresa;
    const mesActual = new Date().toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric"
    }).replace(" de ", " ");
    const nuevasLlamadas = [...selectedEmpresaData.llamadas];
    nuevasLlamadas[index] = { ...editLlamada, agente: nuevasLlamadas[index].agente, mes: mesActual };

    const empresaActualizada = {
      ...selectedEmpresaData,
      llamadas: nuevasLlamadas,
    };

    // Actualizar en Firebase
    await setDoc(doc(db, "empresas", empresaActual), empresaActualizada);

    // Actualizar estados locales
    const nuevasEmpresas = data.map((e) =>
      e.empresa === empresaActual ? empresaActualizada : e
    );
    setData(nuevasEmpresas);
    setSelectedEmpresaData(empresaActualizada);
    setEditandoIndex(null);
  };

  const handlePasswordChange = async () => {
    setPasswordError("");


    if (passwordForm.nueva !== passwordForm.repetir) {
      setPasswordError("Las nuevas contraseñas no coinciden.");
      return;
    }

    try {
      const docRef = doc(db, "usuarios", userDocId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setPasswordError("Usuario no encontrado.");
        return;
      }

      const data = docSnap.data();
      if (data.password !== passwordForm.actual) {
        setPasswordError("La contraseña actual es incorrecta.");
        return;
      }

      await setDoc(docRef, {
        ...data,
        password: passwordForm.nueva
      });

      setModalPasswordOpen(false);
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      setPasswordError("Ocurrió un error al guardar la nueva contraseña.");
    }
  };

  const agregarUsuario = async (nuevoUsuario) => {
    if (
      !nuevoUsuario.usuario?.trim() ||
      !nuevoUsuario.password?.trim() ||
      !nuevoUsuario.nombre?.trim() ||
      !nuevoUsuario.equipo?.trim()
    ) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    const usuarioId = nuevoUsuario.usuario.trim().toLowerCase();
    const docRef = doc(db, "usuarios", usuarioId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      toast.error("Ya existe un usuario con ese nombre.");
      return;
    }

    try {
      await setDoc(docRef, {
        nombre: nuevoUsuario.nombre.trim(),
        usuario: usuarioId,
        password: nuevoUsuario.password.trim(),
        equipo: nuevoUsuario.equipo.trim()
      });
      toast.success("Usuario agregado correctamente");
    } catch (err) {
      toast.error("Error al agregar usuario");
      console.error(err);
    }
  };

  const obtenerUsuarios = async () => {
    const snapshot = await getDocs(collection(db, "usuarios"));
    const lista = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      lista.push({ id: doc.id, nombre: data.nombre });
    });
    setUsuariosDisponibles(lista);
  };

  const confirmarEliminacionUsuario = async () => {
    if (!usuarioAEliminar) return;

    try {
      await deleteDoc(doc(db, "usuarios", usuarioAEliminar.id));
      toast.success("Usuario eliminado correctamente");
      setMostrarEliminarUsuario(false);
      setUsuarioAEliminar(null);
      obtenerUsuarios(); // recarga lista
    } catch (err) {
      toast.error("Error al eliminar");
      console.error(err);
    }
  };

  const guardarCambiosUsuario = async () => {
    if (
      !usuarioSeleccionado?.nombre?.trim() ||
      !usuarioSeleccionado?.usuario?.trim() ||
      !usuarioSeleccionado?.password?.trim() ||
      !usuarioSeleccionado?.equipo?.trim()
    ) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      await setDoc(doc(db, "usuarios", usuarioSeleccionado.id), {
        nombre: usuarioSeleccionado.nombre.trim(),
        usuario: usuarioSeleccionado.usuario.trim().toLowerCase(),
        password: usuarioSeleccionado.password.trim(),
        equipo: usuarioSeleccionado.equipo.trim()
      });
      toast.success("Usuario modificado correctamente");
      setMostrarModificarUsuario(false);
      setUsuarioSeleccionado(null);
      obtenerUsuarios(); // refrescar lista
    } catch (err) {
      toast.error("Error al guardar cambios");
      console.error(err);
    }
  };

  const obtenerEmpresas = async () => {
    try {
      const snapshot = await getDocs(collection(db, "empresas"));
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(lista);
    } catch (error) {
      console.error("Error obteniendo empresas:", error);
    }
  };


  //USE EFFECTS


  useEffect(() => {
    if (typeof window !== "undefined") {
      const equipoGuardado = localStorage.getItem("equipoSeleccionado");
      if (equipoGuardado) setEquipoFilter(equipoGuardado);
      const logueado = localStorage.getItem("isLogged") === "true";
      if (logueado) setIsLogged(true);
      const nombreGuardado = localStorage.getItem("nombreUsuario");
      if (nombreGuardado) setNombreUsuario(nombreGuardado);
      const flexxusGuardado = localStorage.getItem("isFlexxus") === "true";
      setIsFlexxus(flexxusGuardado);
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
    const resetLlamadasSiCambioMes = async () => {
      if (typeof window === "undefined") return;

      const mesActualCambioMes = new Date().getMonth();
      const mesGuardado = localStorage.getItem("mesActualCambioMes");

      if (mesGuardado === null) {
        // Primera vez que corre: no borra nada, solo guarda el mes actual
        localStorage.setItem("mesActualCambioMes", mesActualCambioMes.toString());
        return;
      }

      if (parseInt(mesGuardado) !== mesActualCambioMes) {
        try {
          const snapshot = await getDocs(collection(db, "empresas"));
          const nuevasEmpresas = [];

          for (const docSnap of snapshot.docs) {
            const empresaData = docSnap.data();
            const nuevaEmpresa = { ...empresaData, llamadas: [] };
            await setDoc(doc(db, "empresas", docSnap.id), nuevaEmpresa);
            nuevasEmpresas.push(nuevaEmpresa);
          }

          setData(nuevasEmpresas);
          localStorage.setItem("mesActualCambioMes", mesActualCambioMes.toString());
          toast.success("Llamadas reiniciadas automáticamente por cambio de mes.");
        } catch (error) {
          console.error("Error al resetear llamadas:", error);
          toast.error("Error al reiniciar las llamadas.");
        }
      }
    };

    resetLlamadasSiCambioMes();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "empresas"), (snapshot) => {
      const firebaseData = snapshot.docs.map((doc) => doc.data());
      setData(firebaseData);
    });

    return () => unsubscribe(); // Limpia el listener al desmontar
  }, []);

  useEffect(() => {
    const ordenGuardado = localStorage.getItem("orden");
    if (ordenGuardado) {
      setOrden(ordenGuardado);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("orden", orden);
  }, [orden]);

  useEffect(() => {
    const handleOutsideOrEsc = (event) => {
      if (
        (event.type === "mousedown" && menuEmpresasRef.current && !menuEmpresasRef.current.contains(event.target)) ||
        (event.type === "keydown" && event.key === "Escape")
      ) {
        setMenuEmpresasVisible(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideOrEsc);
    document.addEventListener("keydown", handleOutsideOrEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutsideOrEsc);
      document.removeEventListener("keydown", handleOutsideOrEsc);
    };
  }, []);


  useEffect(() => {
    const handleOutsideOrEsc = (event) => {
      if (event.type === "mousedown") {
        if (menuUsuariosRef.current && !menuUsuariosRef.current.contains(event.target)) {
          setMenuVisible(false);
        }
      }

      if (event.type === "keydown" && event.key === "Escape") {
        setMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideOrEsc);
    document.addEventListener("keydown", handleOutsideOrEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutsideOrEsc);
      document.removeEventListener("keydown", handleOutsideOrEsc);
    };
  }, []);

  useEffect(() => {
    if (!modalEditOpen) {
      // Solo limpiar si el modal se cierra
      setTimeout(() => {
        setEmpresaSeleccionada("");
        setNuevoNombreEmpresa("");
      }, 100); // retraso para no interferir con la apertura
    }
  }, [modalEditOpen]);

  useEffect(() => {
    if (!modalDeleteOpen) {
      setTimeout(() => {
        setEmpresaSeleccionada("");
      }, 100);
    }
  }, [modalDeleteOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setModalEditOpen(false);
        setEmpresaSeleccionada("");
        setNuevoNombreEmpresa("");
      }
    };

    if (modalEditOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [modalEditOpen]);


  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setModalDeleteOpen(false);
        setEmpresaSeleccionada("");
      }
    };

    if (modalDeleteOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [modalDeleteOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setEmpresaSeleccionada("");
      }
    };

    if (setModalOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [setModalOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMostrarInformes(false);
      }
    };

    if (setMostrarInformes) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [setMostrarInformes]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuInformesRef.current && !menuInformesRef.current.contains(event.target)) {
        setMenuInformesVisible(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);



  if (!isLogged) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-gray-800 p-6 rounded-2xl shadow-lg text-center">
          <img src="/logo.png" alt="Flexxus Logo" className="w-40 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-1">Gestión de Llamadas</h1>
          <h1 className="text-xl font-bold mb-4">Clientes con Soporte Básico</h1>
          <input
            type="text"
            placeholder="Usuario"
            value={login.user}
            onChange={(e) => setLogin({ ...login, user: e.target.value })}
            className="w-full mb-3 p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={login.pass}
            onChange={(e) => setLogin({ ...login, pass: e.target.value })}
            className="w-full mb-3 p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
          {loginError && <p className="text-red-500 mb-3">{loginError}</p>}
          <button
            onClick={handleLogin}
            className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-gray-200 p-4">
      <Toaster position="bottom-right" />
      <div className="relative flex items-center justify-center mb-10">
        {/* Logo alineado a la izquierda */}
        <div className="absolute left-0">
          <img
            src="/logo.png"
            alt="Logo Flexxus"
            className="h-10"
            title="Flexxus"
          />
        </div>

        {/* Título verdaderamente centrado */}
        <h1 className="text-2xl font-bold text-center">
          Gestión de Llamadas a Clientes con Soporte Básico
        </h1>



        {/* Usuario e íconos a la derecha */}
        <div className="absolute right-0 flex gap-3 items-center">

          {isLogged && isFlexxus && (
            <div ref={menuInformesRef} className="relative">
              <button
                onClick={() => setMenuInformesVisible(!menuInformesVisible)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded flex items-center gap-2"
              >
                <FileSpreadsheet size={18} />
                <span>Informes</span>
              </button>

              {menuInformesVisible && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg z-50">
                  <button
                    onClick={() => {
                      setMesSeleccionado("");
                      cargarMesesDisponibles();
                      setMostrarInformes(true);
                      setMenuInformesVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={18} />
                      <span>Llamadas Mensuales</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botón Usuarios (solo Flexxus) */}
          {nombreUsuario === "Flexxus" && (
            <div ref={menuUsuariosRef} className="relative">
              <button
                onClick={() => setMenuVisible(!menuVisible)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded flex items-center gap-2"
              >
                <User size={18} />
                <span>Usuarios</span>
              </button>
              {menuVisible && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg z-50">

                  <button
                    onClick={() => {
                      setMostrarFormularioUsuario(true);
                      setMenuVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus size={18} />
                      <span>Nuevo Usuario</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      obtenerUsuarios();
                      setMostrarModificarUsuario(true);
                      setMenuVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <UserCog size={18} /><span>Modificar Usuario</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      obtenerUsuarios();
                      setMostrarEliminarUsuario(true);
                      setMenuVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <UserMinus size={18} /><span>Eliminar Usuario</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      exportarUsuarios();
                      setMenuVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={18} /><span>Exportar Usuarios</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botón Empresas (si está logueado) */}
          {isLogged && nombreUsuario === "Flexxus" && (
            <div ref={menuEmpresasRef} className="relative">
              <button
                onClick={() => setMenuEmpresasVisible(!menuEmpresasVisible)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded flex items-center gap-2"
              >
                <Briefcase size={18} />
                <span>Clientes</span>
              </button>
              {menuEmpresasVisible && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg z-50">
                  <button
                    onClick={() => {
                      handleAddEmpresa();
                      setMenuEmpresasVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <Plus size={18} />
                      <span>Nuevo Cliente</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      obtenerEmpresas(); // Nueva función para cargar lista
                      setModalEditOpen(true);
                      setMenuEmpresasVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <Pencil size={18} />
                      <span>Modificar Cliente</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      obtenerEmpresas();
                      setModalDeleteOpen(true);
                      setMenuEmpresasVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 size={18} />
                      <span>Eliminar Cliente</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setMenuEmpresasVisible(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={18} />
                      <span>Importar Excel</span>
                    </div>
                  </button>
                </div>
              )}
              {nombreUsuario === "Flexxus" && (
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              )}
            </div>
          )}


          {/* Nombre + Cambiar contraseña */}
          {nombreUsuario && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-gray-200 font-semibold">{nombreUsuario}</span>
              <KeyRound
                size={18}
                className="text-yellow-400 hover:text-yellow-500 cursor-pointer"
                title="Cambiar contraseña"
                onClick={() => {
                  setPasswordForm({ actual: "", nueva: "", repetir: "" });
                  setPasswordError("");
                  setModalPasswordOpen(true);
                }}
              />
            </div>
          )}

          {/* Login / Logout */}
          {isLogged ? (
            <LogOut
              className="text-red-400 cursor-pointer hover:text-red-600"
              size={28}
              onClick={handleLogout}
            />
          ) : (
            <LogIn
              className="text-green-400 cursor-pointer hover:text-green-600"
              size={28}
              onClick={() => setLoginModal(true)}
            />
          )}

        </div>
      </div>


      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {/* Filtro Empresa */}
          <div className="flex items-center bg-gray-700 border border-gray-600 rounded-2xl-md px-2">
            <Building size={18} className="text-gray-200 mr-2" />
            <input
              type="text"
              placeholder="Filtrar por Cliente"
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="bg-transparent outline-none text-gray-200 p-2 w-full"
            />
          </div>

          {/* Filtro Equipo */}
          <div className="flex items-center bg-gray-700 border border-gray-600 rounded-2xl-md px-2">
            <Users size={18} className="text-gray-200 mr-2" />
            <select
              value={equipoFilter}
              onChange={(e) => setEquipoFilter(e.target.value)}
              disabled={!isFlexxus}
              className={`bg-gray-700 text-gray-200 border-none p-2 w-full appearance-none ${!isFlexxus ? "opacity-60 cursor-not-allowed" : ""
                }`}
            >
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
        <div className="flex items-center gap-2 ml-auto">
          <SortDesc size={20} className="text-gray-300" />
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="bg-gray-700 text-gray-200 border border-gray-600 rounded-2xl px-3 py-1"
          >
            <option value="nombre">Nombre empresa</option>
            <option value="llamadas">Llamadas realizadas</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start auto-rows-min grid-flow-dense">

        {sortedData.map((item, index) => {
          const mesActual = new Date().toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric"
        }).replace(" de ", " ");
          const llamadasMesActual = item.llamadas.filter((l) => (l.mes || "").toLowerCase() === mesActual);
          const bgColor = llamadasMesActual.length >= 5 ? "bg-red-400/20" : "bg-green-400/20";


          return (
            <div key={index} onClick={() => handleModalOpen(item.empresa)} className="cursor-pointer transform transition-all duration-300 hover:scale-105">
              <Card className={`${bgColor} p-6 transition-all duration-300 border border-transparent hover:border-blue-400 hover:bg-opacity-40 hover:shadow-lg`}>
                <CardContent className="relative">
                  <h2 className="text-xl font-bold text-ellipsis overflow-hidden whitespace-nowrap" title={item.empresa}>{item.empresa}</h2>
                  <p>Llamadas Realizadas: {llamadasMesActual.length}</p>
                </CardContent>
              </Card>
            </div>
          );
        })}

      </div>


      {
        modalOpen && selectedEmpresaData && (() => {
          const llamadasMesActual = selectedEmpresaData.llamadas.filter((l) => l.mes === mesActual);

          return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
              <div className="bg-gray-700 p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-x-hidden relative">
                <button className="absolute top-2 right-3 text-white text-xl" onClick={() => setModalOpen(false)}>×</button>
                <h2 className="text-2xl font-bold mb-2">{selectedEmpresaData.empresa}</h2>
                <p className="mb-4">Llamadas realizadas: {llamadasMesActual.length}</p>

                {llamadasMesActual.length > 0 && (
                  <ul className="space-y-4 mb-4">
                    {llamadasMesActual.map((l, i) => (
                      <li key={i} className="border-b border-gray-600 pb-2 text-sm relative">
                        {editandoIndex === i ? (
                          <>
                            <p className="text-sm text-gray-300 mb-1">Motivo</p>
                            <input
                              type="text"
                              maxLength={50}
                              value={editLlamada.motivo}
                              onChange={(e) => setEditLlamada({ ...editLlamada, motivo: e.target.value })}
                              className="w-full p-1 mb-1 rounded bg-gray-600 text-white"
                              placeholder="Motivo"
                            />
                            <p className="text-sm text-gray-300 mb-1">Descripción</p>
                            <textarea
                              rows="2"
                              maxLength={250}
                              value={editLlamada.descripcion}
                              onChange={(e) => {
                                const texto = e.target.value;
                                if (texto.length <= 250) {
                                  setEditLlamada({ ...editLlamada, descripcion: texto });
                                }
                              }}
                              className="w-full p-1 mb-1 rounded bg-gray-600 text-white"
                              placeholder="Descripción"
                            />
                            <p className={`text-sm text-right ${editLlamada.descripcion.length >= 250 ? 'text-red-400' : 'text-gray-400'}`}>
                              {editLlamada.descripcion.length}/250
                            </p>
                            <p className="text-sm text-gray-300 mb-1">Ticket</p>
                            <input
                              type="text"
                              value={editLlamada.ticket}
                              maxLength={6}
                              onChange={(e) =>
                                setEditLlamada({ ...editLlamada, ticket: e.target.value.replace(/[^0-9]/g, "") })
                              }
                              className="w-1/2 p-1 mb-2 rounded bg-gray-600 text-white"
                              placeholder="Ticket"
                            />
                            <div className="flex justify-end gap-2">
                              <Button onClick={() => setEditandoIndex(null)} className="bg-red-500 text-white px-2 py-1">Cancelar</Button>
                              <Button onClick={() => guardarEdicion(i)} className="bg-green-500 text-white px-2 py-1">Guardar</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="break-words">
                              <strong>{l.motivo}</strong>: {l.descripcion}<br />
                              <span className="text-gray-400">
                                Ticket: <a href={`https://soporte.flexxus.com.ar/tickets/${l.ticket}`} target="_blank" className="underline text-blue-400">{l.ticket}</a> | Agente: {l.agente}
                              </span>
                            </div>
                            {(l.agente === nombreUsuario || nombreUsuario === "Flexxus") && (
                              <Pencil
                                size={16}
                                className="absolute top-0 right-0 cursor-pointer text-gray-300 hover:scale-110 transition-transform"
                                title="Editar llamada"
                                onClick={() => {
                                  setEditandoIndex(i);
                                  setEditLlamada(l);
                                }}
                              />
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {llamadasMesActual.length < 5 && (
                  <div className="space-y-3">
                    <strong><u>Nueva Llamada:</u></strong><br />
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="Motivo"
                      className="w-full p-2 rounded bg-gray-600 text-white"
                      value={formValues.motivo}
                      onChange={(e) => setFormValues({ ...formValues, motivo: e.target.value })}
                    />
                    <textarea
                      placeholder="Descripción"
                      className="w-full p-2 rounded bg-gray-600 text-white"
                      rows="3"
                      maxLength={250}
                      value={formValues.descripcion}
                      onChange={(e) => {
                        const texto = e.target.value;
                        if (texto.length <= 250) {
                          setFormValues({ ...formValues, descripcion: texto });
                        }
                      }}
                    />
                    <p className={`text-sm text-right ${formValues.descripcion.length >= 250 ? 'text-red-400' : 'text-gray-400'}`}>
                      {formValues.descripcion.length}/250
                    </p>
                    <input
                      type="text"
                      placeholder="Ticket (6 dígitos)"
                      className="w-full p-2 rounded bg-gray-600 text-white"
                      maxLength={6}
                      value={formValues.ticket}
                      onChange={(e) => setFormValues({ ...formValues, ticket: e.target.value.replace(/[^0-9]/g, "") })}
                    />
                    {Object.values(errors).map((err, i) => (
                      <p key={i} className="text-red-400 text-sm">{err}</p>
                    ))}
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => setModalOpen(false)} className="bg-red-500 text-white">Cancelar</Button>
                      <Button onClick={handleModalSubmit} className="bg-green-500 text-white">Guardar</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}


      {
        loginModal && (
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
        )
      }

      {/* MODAL NUEVA EMPRESA */}
      {
        modalAddOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Nuevo Cliente</h2>
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
        )
      }

      {/* MODAL EDITAR EMPRESA */}
      {modalEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-white">Modificar Empresa</h2>

            {/* Select de empresas */}
            <select
              value={empresaSeleccionada}
              onChange={(e) => {
                const seleccionada = e.target.value;
                setEmpresaSeleccionada(seleccionada);
                setNuevoNombreEmpresa(seleccionada);
              }}
              className="w-full p-2 mb-4 rounded bg-gray-600 text-white"
            >
              <option value="">Seleccione una empresa</option>
              {data.map((empresa) => (
                <option key={empresa.empresa} value={empresa.empresa}>
                  {empresa.empresa}
                </option>
              ))}
            </select>

            {/* Input editable */}
            <input
              type="text"
              value={nuevoNombreEmpresa}
              onChange={(e) => setNuevoNombreEmpresa(e.target.value)}
              className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full p-2 rounded-2xl bg-gray-700 text-gray-200 mb-4"
              disabled={!empresaSeleccionada}
              placeholder="Nuevo nombre de empresa"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalEditOpen(false)}
                className="bg-red-500 text-gray-200 px-4 py-2 rounded-2xl hover:bg-red-600 focus:ring-2 focus:ring-red-400"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEditEmpresa}
                disabled={!nuevoNombreEmpresa.trim() || !empresaSeleccionada}
                className={`px-4 py-2 rounded-2xl text-gray-200 ${nuevoNombreEmpresa.trim() && empresaSeleccionada
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-yellow-500 opacity-50 cursor-not-allowed"
                  }`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL ELIMINAR EMPRESA */}
      {
        modalDeleteOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="border border-gray-500 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 p-6 rounded-2xl-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white">Eliminar Empresa</h2>

              {/* Select de empresas */}
              <select
                value={empresaSeleccionada}
                onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                className="w-full p-2 mb-4 rounded bg-gray-600 text-white"
              >
                <option value="">Seleccione una empresa</option>
                {data.map((empresa) => (
                  <option key={empresa.empresa} value={empresa.empresa}>
                    {empresa.empresa}
                  </option>
                ))}
              </select>

              {/* Advertencia */}
              {empresaSeleccionada && (
                <div className="bg-red-500 bg-opacity-20 p-3 rounded mb-4 text-white">
                  ¿Estás seguro de que querés eliminar <strong>{empresaSeleccionada}</strong>? Esta acción no se puede deshacer.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalDeleteOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-2xl hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteEmpresa}
                  disabled={!empresaSeleccionada}
                  className={`px-4 py-2 rounded-2xl text-white ${empresaSeleccionada
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-600 opacity-50 cursor-not-allowed"
                    }`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )
      }



      {
        modalPasswordOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="border border-gray-500 bg-gray-700 p-6 rounded-2xl w-full max-w-sm relative">
              <button
                onClick={() => setModalPasswordOpen(false)}
                className="absolute top-2 right-3 text-white text-xl"
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-4">Cambiar contraseña</h2>
              <p className="text-sm font-semibold text-gray-300 mb-1">Contraseña actual</p>
              <input
                type="password"
                placeholder="Contraseña actual"
                value={passwordForm.actual}
                onChange={(e) => setPasswordForm({ ...passwordForm, actual: e.target.value })}
                className="w-full p-2 mb-3 rounded bg-gray-600 text-white"
              />
              <p className="text-sm font-semibold text-gray-300 mb-1">Nueva contraseña</p>
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={passwordForm.nueva}
                onChange={(e) => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                className="w-full p-2 mb-3 rounded bg-gray-600 text-white"
              />
              <p className="text-sm font-semibold text-gray-300 mb-1">Repetir nueva contraseña</p>
              <input
                type="password"
                placeholder="Repetir nueva contraseña"
                value={passwordForm.repetir}
                onChange={(e) => setPasswordForm({ ...passwordForm, repetir: e.target.value })}
                className="w-full p-2 mb-4 rounded bg-gray-600 text-white"
              />

              {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}

              <div className="flex justify-end gap-2">
                <Button onClick={() => setModalPasswordOpen(false)} className="bg-red-500 text-white">
                  Cancelar
                </Button>
                <Button onClick={handlePasswordChange} className="bg-green-500 text-white">
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {
        mostrarFormularioUsuario && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative">
              <button onClick={() => setMostrarFormularioUsuario(false)} className="absolute top-2 right-3 text-white text-xl">×</button>
              <h2 className="text-xl text-white mb-4 font-bold">Agregar Usuario</h2>

              <div className="mb-3">
                <label className="block text-white text-sm mb-1">Nombre Usuario (Nombre y Apellido)</label>
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                  className="w-full p-2 rounded bg-gray-600 text-white"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="mb-3">
                <label className="block text-white text-sm mb-1">Usuario</label>
                <input
                  type="text"
                  value={nuevoUsuario.usuario}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })}
                  className="w-full p-2 rounded bg-gray-600 text-white"
                  placeholder="Ej: juanperez"
                />
              </div>

              <div className="mb-3">
                <label className="block text-white text-sm mb-1">Contraseña</label>
                <input
                  type="text"
                  value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                  className="w-full p-2 rounded bg-gray-600 text-white"
                  placeholder="******"
                />
              </div>

              <div className="mb-4">
                <label className="block text-white text-sm mb-1">Equipo</label>
                <select
                  value={nuevoUsuario.equipo}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, equipo: e.target.value })}
                  className="w-full p-2 rounded bg-gray-600 text-white"
                >
                  <option value="">Seleccionar equipo</option>
                  <option value="Equipo 1">Equipo 1</option>
                  <option value="Equipo 2">Equipo 2</option>
                  <option value="Equipo 3">Equipo 3</option>
                  <option value="Equipo 4">Equipo 4</option>
                  <option value="Equipo 5">Equipo 5</option>
                  <option value="Equipo Corralon">Equipo Corralon</option>
                </select>
              </div>

              <Button
                onClick={() => {
                  if (!nuevoUsuario.nombre || !nuevoUsuario.usuario || !nuevoUsuario.password || !nuevoUsuario.equipo) {
                    toast.error("Todos los campos son obligatorios");
                    return;
                  }
                  agregarUsuario(nuevoUsuario);
                  setMostrarFormularioUsuario(false);
                  setNuevoUsuario({ nombre: "", usuario: "", password: "", equipo: "" });
                }}
                className="bg-blue-600 text-white w-full py-2 rounded"
              >
                Guardar Usuario
              </Button>
            </div>
          </div>
        )
      }

      {
        mostrarEliminarUsuario && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative">
              <button onClick={() => setMostrarEliminarUsuario(false)} className="absolute top-2 right-3 text-white text-xl">×</button>
              <h2 className="text-xl text-white mb-4 font-bold">Eliminar Usuario</h2>

              <select
                value={usuarioAEliminar?.id || ""}
                onChange={(e) => {
                  const seleccionado = usuariosDisponibles.find(u => u.id === e.target.value);
                  setUsuarioAEliminar(seleccionado || null);
                }}
                className="w-full p-2 rounded bg-gray-600 text-white mb-4"
              >
                <option value="">Seleccione un usuario</option>
                {usuariosDisponibles
                  .filter((u) => u.id !== "flexxus")
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
              </select>

              {usuarioAEliminar && (
                <div className="bg-red-500 bg-opacity-20 p-3 rounded mb-4 text-white">
                  ¿Estás seguro que querés eliminar a <strong>{usuarioAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
                </div>
              )}

              <Button
                disabled={!usuarioAEliminar}
                onClick={() => confirmarEliminacionUsuario()}
                className="bg-red-600 text-white w-full py-2 rounded disabled:opacity-50"
              >
                Eliminar Usuario
              </Button>
            </div>
          </div>
        )
      }

      {
        mostrarModificarUsuario && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative">
              <button onClick={() => setMostrarModificarUsuario(false)} className="absolute top-2 right-3 text-white text-xl">×</button>
              <h2 className="text-xl text-white mb-4 font-bold">Modificar Usuario</h2>

              <select
                value={usuarioSeleccionado?.id || ""}
                onChange={(e) => {
                  const seleccionado = usuariosDisponibles.find(u => u.id === e.target.value);
                  setUsuarioSeleccionado(seleccionado || null);
                }}
                className="w-full p-2 rounded bg-gray-600 text-white mb-4"
              >
                <option value="">Seleccione un usuario</option>
                {usuariosDisponibles
                  .filter((u) => u.id !== "flexxus")
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
              </select>

              {usuarioSeleccionado && (
                <>
                  <input
                    type="text"
                    className="w-full p-2 rounded bg-gray-600 text-white mb-2"
                    placeholder="Nombre"
                    value={usuarioSeleccionado.nombre}
                    onChange={(e) => setUsuarioSeleccionado({ ...usuarioSeleccionado, nombre: e.target.value })}
                  />
                  <input
                    type="text"
                    className="w-full p-2 rounded bg-gray-600 text-white mb-2"
                    placeholder="Usuario"
                    value={usuarioSeleccionado.usuario}
                    onChange={(e) => setUsuarioSeleccionado({ ...usuarioSeleccionado, usuario: e.target.value.toLowerCase() })}
                  />
                  <input
                    type="text"
                    className="w-full p-2 rounded bg-gray-600 text-white mb-2"
                    placeholder="Contraseña"
                    value={usuarioSeleccionado.password}
                    onChange={(e) => setUsuarioSeleccionado({ ...usuarioSeleccionado, password: e.target.value })}
                  />
                  <select
                    className="w-full p-2 rounded bg-gray-600 text-white mb-4"
                    value={usuarioSeleccionado.equipo}
                    onChange={(e) => setUsuarioSeleccionado({ ...usuarioSeleccionado, equipo: e.target.value })}
                  >
                    <option value="">Seleccionar equipo</option>
                    <option value="Equipo 1">Equipo 1</option>
                    <option value="Equipo 2">Equipo 2</option>
                    <option value="Equipo 3">Equipo 3</option>
                    <option value="Equipo 4">Equipo 4</option>
                    <option value="Equipo 5">Equipo 5</option>
                    <option value="Equipo Corralon">Equipo Corralon</option>
                  </select>

                  <Button
                    onClick={() => guardarCambiosUsuario()}
                    className="bg-yellow-500 text-white w-full py-2 rounded"
                  >
                    Guardar Cambios
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      }

      {mostrarInformes && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-700 p-6 rounded-2xl w-full max-w-sm relative">
            <button
              onClick={() => setMostrarInformes(false)}
              className="absolute top-2 right-3 text-white text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">Llamadas Mensuales</h2>

            <label className="text-white text-sm mb-1 block">Seleccioná el mes</label>
            <select
              onChange={(e) => setMesSeleccionado(e.target.value)}
              value={mesSeleccionado}
              className="w-full p-2 mb-4 rounded bg-gray-600 text-white"
            >
              <option value="">-- Elegí un mes --</option>
              {mesesDisponibles.map((mes) => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarInformes(false)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (mesSeleccionado) exportarLlamadasPorMes(mesSeleccionado);
                  setMostrarInformes(false);
                  toast.success(`Informe de ${mesSeleccionado} generado`);
                }}
                disabled={!mesSeleccionado}
                className={`px-4 py-2 rounded text-white ${mesSeleccionado
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-green-600 opacity-50 cursor-not-allowed"}`}
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}


    </div >




  );


}
