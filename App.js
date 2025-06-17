import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Input } from "./components/ui/input";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

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
      (!empresaFilter || item.empresa.includes(empresaFilter))
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Gestión de Llamadas</h1>
      <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      <div className="flex gap-2 my-4">
        <Input
          placeholder="Filtrar por equipo"
          value={equipoFilter}
          onChange={(e) => setEquipoFilter(e.target.value)}
        />
        <Input
          placeholder="Filtrar por empresa"
          value={empresaFilter}
          onChange={(e) => setEmpresaFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((item, index) => {
          const llamadasDisponibles = 5 - item.llamadas.length;
          const bgColor =
            llamadasDisponibles === 0 ? "bg-red-200" : "bg-green-200";
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
