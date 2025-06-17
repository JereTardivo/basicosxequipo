
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Input } from "./components/ui/input";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { FileSpreadsheet, Building, Users } from "lucide-react";

export default function Home() {
  const [data, setData] = useState([]);
  const [equipoFilter, setEquipoFilter] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({ motivo: "", descripcion: "", ticket: "" });
  const [errors, setErrors] = useState({});
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws);
      const enrichedData = jsonData.map((item) => ({
        empresa: item.EMPRESA,
        equipo: item.EQUIPO,
        llamadas: [],
      }));
      setData(enrichedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleAddLlamadaClick = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setFormValues({ motivo: "", descripcion: "", ticket: "" });
    setErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.motivo || !/^[\w\s]{1,50}$/.test(formValues.motivo)) {
      newErrors.motivo = "Motivo requerido (máx 50 caracteres alfanuméricos)";
    }
    if (!formValues.descripcion || !/^[\w\s]{1,250}$/.test(formValues.descripcion)) {
      newErrors.descripcion = "Descripción requerida (máx 250 caracteres alfanuméricos)";
    }
    if (!/^[0-9]{6}$/.test(formValues.ticket)) {
      newErrors.ticket = "Ticket debe ser un número de 6 cifras";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSubmit = () => {
    if (!validateForm()) return;

    setData((prev) =>
      prev.map((item) => {
        if (item.empresa === empresaSeleccionada && item.llamadas.length < 5) {
          return {
            ...item,
            llamadas: [...item.llamadas, { ...formValues }],
          };
        }
        return item;
      })
    );
    setModalOpen(false);
  };

  const filteredData = data.filter(
    (item) =>
      (!equipoFilter || item.equipo === equipoFilter) &&
      (!empresaFilter || item.empresa.toLowerCase().includes(empresaFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Gestión de Llamadas a Clientes con Soporte Básico
      </h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md px-2">
            <Building size={18} className="text-white mr-2" />
            <input
              type="text"
              placeholder="Filtrar por empresa"
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="bg-transparent outline-none text-white p-2 w-full"
            />
          </div>
          <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md px-2">
            <Users size={18} className="text-white mr-2" />
            <select
              value={equipoFilter}
              onChange={(e) => setEquipoFilter(e.target.value)}
              className="bg-gray-800 text-white border-none p-2 w-full appearance-none"
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
        <div className="relative group">
          <input
            type="file"
            id="excelUpload"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="excelUpload"
            className="cursor-pointer hover:scale-110 transition-transform"
            title="Subir archivo Excel"
          >
            <FileSpreadsheet size={36} className="text-green-400" />
          </label>
          <div className="absolute bottom-full mb-2 right-0 bg-gray-800 text-sm text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            Subir archivo Excel
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((item, index) => {
          const llamadasDisponibles = 5 - item.llamadas.length;
          const bgColor =
            llamadasDisponibles === 0 ? "bg-red-400/20" : "bg-green-400/20";
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
                  <Button
                    className="mt-2"
                    onClick={() => handleAddLlamadaClick(item.empresa)}
                  >
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
            <input
              type="text"
              placeholder="Motivo"
              value={formValues.motivo}
              onChange={(e) => setFormValues({ ...formValues, motivo: e.target.value })}
              className="w-full mb-1 p-2 rounded bg-gray-700 text-white"
            />
            {errors.motivo && <p className="text-red-400 text-sm mb-2">{errors.motivo}</p>}
            <input
              type="text"
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) => setFormValues({ ...formValues, descripcion: e.target.value })}
              className="w-full mb-1 p-2 rounded bg-gray-700 text-white"
            />
            {errors.descripcion && <p className="text-red-400 text-sm mb-2">{errors.descripcion}</p>}
            <input
              type="text"
              placeholder="Ticket (6 dígitos)"
              value={formValues.ticket}
              onChange={(e) => setFormValues({ ...formValues, ticket: e.target.value })}
              className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
            />
            {errors.ticket && <p className="text-red-400 text-sm mb-4">{errors.ticket}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleModalSubmit}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
