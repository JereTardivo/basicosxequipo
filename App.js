
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

  const agregarLlamada = (empresa) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.empresa === empresa && item.llamadas.length < 5) {
          const motivo = prompt("Motivo de la llamada:");
          const descripcion = prompt("Descripción de la llamada:");
          const ticket = prompt("Ticket de llamada:");
          if (motivo && descripcion && ticket) {
            return {
              ...item,
              llamadas: [...item.llamadas, { motivo, descripcion, ticket }],
            };
          }
        }
        return item;
      })
    );
  };

  const filteredData = data.filter(
    (item) =>
      (!equipoFilter || item.equipo === equipoFilter) &&
      (!empresaFilter || item.empresa.toLowerCase().includes(empresaFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Título */}
      <h1 className="text-2xl font-bold text-center mb-6">
        Gestión de Llamadas a Clientes con Soporte Básico
      </h1>

      {/* Filtros + Botón Excel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {/* Filtro Empresa */}
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

          {/* Filtro Equipo */}
          <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md px-2">
            <Users size={18} className="text-white mr-2" />
            <select
              value={equipoFilter}
              onChange={(e) => setEquipoFilter(e.target.value)}
              className="bg-transparent outline-none text-white p-2 w-full"
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

        {/* Botón Excel */}
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

      {/* Tarjetas */}
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
                    onClick={() => agregarLlamada(item.empresa)}
                  >
                    Agregar llamada
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
