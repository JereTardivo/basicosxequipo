import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Input } from "./components/ui/input";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default function App() {
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
              llamadas: [
                ...item.llamadas,
                { motivo, descripcion, ticket },
              ],
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

  const equipos = [
    "Equipo 1",
    "Equipo 2",
    "Equipo 3",
    "Equipo 4",
    "Equipo 5",
    "Equipo Corralon",
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Gestión de Llamadas</h1>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-center">
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
              title="Cargar archivo Excel"
            >
              <FileSpreadsheet size={48} className="text-green-400" />
            </label>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-sm text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Subir archivo Excel
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={equipoFilter}
            onChange={(e) => setEquipoFilter(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-md p-2 w-full md:w-1/2 text-white"
          >
            <option value="">Todos los equipos</option>
            {equipos.map((equipo, i) => (
              <option key={i} value={equipo}>
                {equipo}
              </option>
            ))}
          </select>

          <Input
            placeholder="Filtrar por empresa"
            value={empresaFilter}
            onChange={(e) => setEmpresaFilter(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item, index) => {
          const llamadasDisponibles = 5 - item.llamadas.length;
          const bgColor =
            llamadasDisponibles === 0 ? "bg-red-400/20" : "bg-green-400/20";

          return (
            <Card
              key={index}
              className={`rounded-2xl shadow-md ${bgColor} text-white`}
            >
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold mb-2">{item.empresa}</h2>
                <p className="mb-2">Llamadas disponibles: {llamadasDisponibles}</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {item.llamadas.map((llamada, i) => (
                    <li key={i}>
                      <strong>{llamada.motivo}</strong>: {llamada.descripcion} (Ticket: {llamada.ticket})
                    </li>
                  ))}
                </ul>
                {llamadasDisponibles > 0 && (
                  <Button
                    className="mt-4 bg-blue-600 hover:bg-blue-700 transition"
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
